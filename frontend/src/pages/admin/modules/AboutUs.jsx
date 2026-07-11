import { useEffect, useState } from "react";
import {
  getModuleContentApi,
  saveModuleContentApi,
  togglePublishApi,
  uploadContentImageApi,
} from "../../../api/content.api";
import toast from "react-hot-toast";
import RichTextEditor from "../../../components/common/RichTextEditor";
import ImageCropModal from "../../../components/common/ImageCropModal";
import ItalicToggle from "../../../components/common/ItalicToggle";
import useSchoolStore from "../../../store/schoolStore";

const hexToRgba = (hex, alpha) => {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const defaultContent = {
  bannerImage: "",
  visionMissionItems: [],
  history: "",
  historyImage: "",
  foundedYear: "",
  leadershipMembers: [],
  values: [
    { title: "", description: "" },
    { title: "", description: "" },
    { title: "", description: "" },
    { title: "", description: "" },
  ],
};

const CROP_ASPECTS = { banner: 16 / 9, history: 3 / 4, leader: 4 / 5 };

const AboutUs = () => {
  const { tc } = useSchoolStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [activeSection, setActiveSection] = useState("banner");
  const [content, setContent] = useState(defaultContent);
  const [uploading, setUploading] = useState({});
  const [cropTarget, setCropTarget] = useState(null); // { mode: 'banner' | 'history' | 'leader', id?, src }

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await getModuleContentApi("about");
      if (res.data) {
        const raw = res.data.content || {};
        const merged = { ...defaultContent, ...raw };

        // Migrate legacy flat vision/mission/motto/goals/philosophy/approach fields
        // (pre-custom-items schema) into the new freeform visionMissionItems list.
        if (!raw.visionMissionItems || raw.visionMissionItems.length === 0) {
          const legacyMap = [
            ["vision", "Vision"],
            ["mission", "Mission"],
            ["motto", "Motto"],
            ["goals", "Goals"],
            ["philosophy", "Philosophy"],
            ["approach", "Approach"],
          ];
          const migrated = legacyMap
            .filter(([key]) => raw[key] && raw[key].replace(/<[^>]*>/g, "").trim())
            .map(([key, heading], i) => ({ id: `vm-legacy-${i}`, heading, text: raw[key] }));
          if (migrated.length) merged.visionMissionItems = migrated;
        }

        // Migrate legacy single-principal fields into the new leadershipMembers list.
        if (
          (!raw.leadershipMembers || raw.leadershipMembers.length === 0) &&
          (raw.principalName || raw.principalMessage || raw.principalPhoto)
        ) {
          merged.leadershipMembers = [
            {
              id: "leader-legacy-0",
              photo: raw.principalPhoto || "",
              name: raw.principalName || "",
              designation: raw.principalDesignation || "",
              message: raw.principalMessage || "",
            },
          ];
        }

        setContent(merged);
        setIsPublished(res.data.is_published === 1);
      }
    } catch (e) {
      console.log("No content yet");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  const handleValueChange = (index, field, value) => {
    const updated = [...content.values];
    updated[index] = { ...updated[index], [field]: value };
    setContent((prev) => ({ ...prev, values: updated }));
  };

  // ── Vision & Mission items ──
  const addVisionItem = () => {
    const item = { id: `vm-${Date.now()}`, heading: "", text: "" };
    setContent((prev) => ({ ...prev, visionMissionItems: [...prev.visionMissionItems, item] }));
  };
  const updateVisionItem = (id, field, value) => {
    setContent((prev) => ({
      ...prev,
      visionMissionItems: prev.visionMissionItems.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    }));
  };
  const removeVisionItem = (id) => {
    setContent((prev) => ({ ...prev, visionMissionItems: prev.visionMissionItems.filter((it) => it.id !== id) }));
  };

  // ── Leadership members ──
  const addLeader = () => {
    const item = { id: `leader-${Date.now()}`, photo: "", name: "", designation: "", message: "" };
    setContent((prev) => ({ ...prev, leadershipMembers: [...prev.leadershipMembers, item] }));
  };
  const updateLeader = (id, field, value) => {
    setContent((prev) => ({
      ...prev,
      leadershipMembers: prev.leadershipMembers.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    }));
  };
  const removeLeader = (id) => {
    setContent((prev) => ({ ...prev, leadershipMembers: prev.leadershipMembers.filter((m) => m.id !== id) }));
  };

  // ── Crop-based image upload flow (banner / history image / leader photos) ──
  const onCropConfirmed = async (croppedFile) => {
    const target = cropTarget;
    setCropTarget(null);
    const key = target.mode === "leader" ? `leader-${target.id}` : target.mode;
    setUploading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await uploadContentImageApi(croppedFile);
      if (target.mode === "banner") handleChange("bannerImage", res.data.url);
      else if (target.mode === "history") handleChange("historyImage", res.data.url);
      else if (target.mode === "leader") updateLeader(target.id, "photo", res.data.url);
      toast.success("Image uploaded!");
    } catch (e) {
      toast.error("Failed to upload image");
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const fetchPublishedFlag = async () => {
    const res = await getModuleContentApi("about");
    return !!res?.data?.is_published;
  };

  const handleSave = async (publish = false) => {
    publish ? setPublishing(true) : setSaving(true);
    try {
      await saveModuleContentApi(
        "about",
        content,
        publish ? 1 : isPublished ? 1 : 0,
      );
      if (publish) {
        // Save never touches is_published — flip it server-side only if not already live.
        let current = await fetchPublishedFlag();
        if (!current) {
          await togglePublishApi("about", 1);
          current = await fetchPublishedFlag();
        }
        setIsPublished(current);
        toast.success("About Us published!");
      } else {
        toast.success("Content saved!");
      }
    } catch (e) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      let current = await fetchPublishedFlag();
      if (current) {
        await togglePublishApi("about", 0);
        current = await fetchPublishedFlag();
      }
      setIsPublished(current);
      toast.success("Unpublished");
    } catch (e) {
      toast.error("Failed to unpublish");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    border: "0.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "13.5px",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
    background: "#ffffff",
    fontFamily: "system-ui, sans-serif",
    transition: "border 0.2s, box-shadow 0.2s",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#64748b",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const cardStyle = {
    background: "#ffffff",
    border: "0.5px solid #f1f5f9",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  };

  const cardHeaderStyle = {
    padding: "1.25rem 1.75rem",
    borderBottom: "0.5px solid #f8fafc",
    background: "linear-gradient(135deg,#f8fafc,#f1f5f9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  };

  const addButtonStyle = {
    padding: "8px 16px",
    background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  };

  const removeButtonStyle = {
    padding: "6px 12px",
    background: "rgba(239,68,68,0.1)",
    color: "#dc2626",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  };

  const sections = [
    {
      key: "banner",
      label: "Banner Image",
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: "vision",
      label: "Vision & Mission",
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      key: "history",
      label: "History",
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: "leadership",
      label: "Leadership Messages",
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      key: "values",
      label: "Core Values",
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  const CropImageBox = ({ label, value, uploadKey, aspectHint, onFileSelected }) => {
    const isUploading = uploading[uploadKey];

    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <div
          onClick={() => document.getElementById(`upload-${uploadKey}`).click()}
          style={{
            border: "1.5px dashed #e2e8f0",
            borderRadius: "12px",
            padding: value ? 0 : "2rem",
            textAlign: "center",
            cursor: "pointer",
            background: value ? "transparent" : "#fafafa",
            overflow: "hidden",
            position: "relative",
            minHeight: value ? "160px" : "auto",
          }}
        >
          {isUploading ? (
            <div style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", border: "3px solid #f0c4c4", borderTop: `3px solid ${tc.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              <p style={{ fontSize: "12px", color: "#64748b" }}>Uploading...</p>
            </div>
          ) : value ? (
            <div style={{ position: "relative" }}>
              <img src={value} alt={label} style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }} />
              <div
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", opacity: 0, transition: "opacity 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
              >
                <span style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>Click to change</span>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>🖼️</div>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Click to upload — crop tool will open</p>
              <p style={{ fontSize: "11px", color: "#94a3b8" }}>{aspectHint || "JPG, PNG, WEBP · Max 5MB"}</p>
            </>
          )}
        </div>
        <input
          id={`upload-${uploadKey}`}
          type="file"
          accept="image/png,image/jpg,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) onFileSelected(file);
            e.target.value = "";
          }}
          style={{ display: "none" }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid #f0c4c4", borderTop: `3px solid ${tc.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }}></div>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .au-section { animation: fadeInUp 0.35s ease forwards; }
                .au-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; }
            `}</style>

      <div style={{ fontFamily: "system-ui, sans-serif" }}>
        {/* Hero Header */}
        <div style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: "10px", padding: "2.25rem 2.5rem", marginBottom: "1.75rem", position: "relative", overflow: "hidden", boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
          <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: "-140px", right: "4%", pointerEvents: "none" }}></div>
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>Admin / Pages / About Us</p>
              <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#ffffff", marginBottom: "8px", letterSpacing: "-0.4px" }}>About Us</h1>
              <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6, maxWidth: "420px" }}>
                Tell your school's story — vision, history, leadership and values.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 14px", background: isPublished ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.08)", border: `1px solid ${isPublished ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.15)"}`, borderRadius: "6px", flexShrink: 0 }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: isPublished ? "#22c55e" : "#94a3b8" }}></div>
              <span style={{ fontSize: "12px", color: isPublished ? "#86efac" : "rgba(255,255,255,0.5)", fontWeight: 500 }}>{isPublished ? "Published" : "Draft"}</span>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "1.75rem", flexWrap: "wrap" }}>
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: activeSection === s.key ? `1.5px solid ${tc.primary}` : "1px solid #e2e8f0",
                fontSize: "13px",
                cursor: "pointer",
                background: activeSection === s.key ? tc.light : "#ffffff",
                color: activeSection === s.key ? tc.primary : "#64748b",
                fontWeight: activeSection === s.key ? 600 : 400,
                display: "flex",
                alignItems: "center",
                gap: "7px",
                transition: "all 0.15s",
                boxShadow: activeSection === s.key ? "0 4px 12px rgba(139,34,82,0.15)" : "none",
              }}
            >
              <span style={{ color: activeSection === s.key ? tc.primary : "#94a3b8" }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* ── Banner Tab ── */}
        {activeSection === "banner" && (
          <div className="au-section" style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "38px", height: "38px", background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                  <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "1px" }}>Page Banner</p>
                  <p style={{ fontSize: "11px", color: "#94a3b8" }}>Wide hero image shown at the top of the About Us page</p>
                </div>
              </div>
            </div>
            <div style={{ padding: "2rem" }}>
              <CropImageBox
                label="Banner Image"
                value={content.bannerImage}
                uploadKey="banner"
                aspectHint="You'll be able to crop to a 16:9 widescreen banner after upload"
                onFileSelected={(file) => setCropTarget({ mode: "banner", src: URL.createObjectURL(file) })}
              />
              <div style={{ marginTop: "16px", padding: "16px 18px", background: "linear-gradient(135deg,#fdf0f5,#fff5f8)", borderRadius: "8px", border: "1px solid #f9c4d4" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: tc.primary, marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How to choose the best banner image
                </p>
                {[
                  "Upload any size photo — you'll crop it to fit the 16:9 banner next",
                  "Use bright, high-resolution photos — campus, students or building exteriors work best",
                  "Keep important subjects centered in your crop — edges may get trimmed on smaller screens",
                  "Avoid images with heavy text or logos already on them",
                ].map((tip, i) => (
                  <p key={i} style={{ fontSize: "11.5px", color: "#9f1239", marginBottom: "4px", lineHeight: 1.6 }}>
                    • {tip}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Vision & Mission Tab ── */}
        {activeSection === "vision" && (
          <div className="au-section" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "38px", height: "38px", background: "linear-gradient(135deg,#1e3a5f,#2563eb)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}>
                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "1px" }}>Vision & Mission</p>
                    <p style={{ fontSize: "11px", color: "#94a3b8" }}>Add as many statements as you like — you choose the heading for each. These scroll as an animated ticker on your website.</p>
                  </div>
                </div>
                <button onClick={addVisionItem} style={addButtonStyle}>+ Add Item</button>
              </div>
            </div>

            {content.visionMissionItems.length === 0 && (
              <div style={{ ...cardStyle, padding: "2.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "#94a3b8" }}>No items yet — click "+ Add Item" above to create your first one (e.g. Vision, Mission, Motto).</p>
              </div>
            )}

            {content.visionMissionItems.map((item, i) => (
              <div key={item.id} style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg,#1e3a5f,#2563eb)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", fontWeight: 700 }}>
                      {i + 1}
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>Item {i + 1}</p>
                  </div>
                  <button onClick={() => removeVisionItem(item.id)} style={removeButtonStyle}>Remove</button>
                </div>
                <div style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={labelStyle}>Heading</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        className="au-input"
                        type="text"
                        value={item.heading}
                        onChange={(e) => updateVisionItem(item.id, "heading", e.target.value)}
                        placeholder="e.g. Vision, Mission, Motto, Our Goals..."
                        style={{ ...inputStyle, fontStyle: item.headingItalic ? "italic" : "normal" }}
                      />
                      <ItalicToggle active={!!item.headingItalic} onToggle={() => updateVisionItem(item.id, "headingItalic", !item.headingItalic)} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Text</label>
                    <RichTextEditor
                      value={item.text}
                      onChange={(val) => updateVisionItem(item.id, "text", val)}
                      placeholder="Write the statement for this item..."
                      minHeight="100px"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── History Tab ── */}
        {activeSection === "history" && (
          <div className="au-section" style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "38px", height: "38px", background: "linear-gradient(135deg,#064e3b,#059669)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(5,150,105,0.3)" }}>
                  <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "1px" }}>Our History</p>
                  <p style={{ fontSize: "11px", color: "#94a3b8" }}>The school's journey and story</p>
                </div>
              </div>
            </div>
            <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "20px" }}>
              <CropImageBox
                label="History Section Image"
                value={content.historyImage}
                uploadKey="history"
                aspectHint="You'll be able to crop to a portrait (3:4) shape after upload · Shows beside the history text"
                onFileSelected={(file) => setCropTarget({ mode: "history", src: URL.createObjectURL(file) })}
              />
              <div>
                <label style={labelStyle}>Founded Year</label>
                <input
                  className="au-input"
                  type="text"
                  value={content.foundedYear}
                  onChange={(e) => handleChange("foundedYear", e.target.value)}
                  placeholder="e.g. 1998"
                  style={{ ...inputStyle, maxWidth: "200px" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Our Story</label>
                <RichTextEditor
                  value={content.history}
                  onChange={(val) => handleChange("history", val)}
                  placeholder="Tell the story of how your school began, key milestones, and how it has grown over the years..."
                  minHeight="220px"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Leadership Tab ── */}
        {activeSection === "leadership" && (
          <div className="au-section" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "38px", height: "38px", background: "linear-gradient(135deg,#4a1d96,#7c3aed)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>
                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "1px" }}>Leadership Messages</p>
                    <p style={{ fontSize: "11px", color: "#94a3b8" }}>Add a message from anyone in leadership — Principal, Director, Chairperson, etc. Add as many as you like.</p>
                  </div>
                </div>
                <button onClick={addLeader} style={addButtonStyle}>+ Add Member</button>
              </div>
            </div>

            {content.leadershipMembers.length === 0 && (
              <div style={{ ...cardStyle, padding: "2.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "#94a3b8" }}>No leadership messages yet — click "+ Add Member" above to add one.</p>
              </div>
            )}

            {content.leadershipMembers.map((m, i) => (
              <div key={m.id} style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg,#4a1d96,#7c3aed)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", fontWeight: 700 }}>
                      {i + 1}
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>Member {i + 1}</p>
                  </div>
                  <button onClick={() => removeLeader(m.id)} style={removeButtonStyle}>Remove</button>
                </div>
                <div style={{ padding: "1.5rem 1.75rem", display: "grid", gridTemplateColumns: "220px 1fr", gap: "1.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <CropImageBox
                      label="Photo"
                      value={m.photo}
                      uploadKey={`leader-${m.id}`}
                      aspectHint="Portrait crop (4:5) after upload"
                      onFileSelected={(file) => setCropTarget({ mode: "leader", id: m.id, src: URL.createObjectURL(file) })}
                    />
                    <div>
                      <label style={labelStyle}>Name</label>
                      <input
                        className="au-input"
                        type="text"
                        value={m.name}
                        onChange={(e) => updateLeader(m.id, "name", e.target.value)}
                        placeholder="e.g. Mrs. Sunita Sharma"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Designation</label>
                      <input
                        className="au-input"
                        type="text"
                        value={m.designation}
                        onChange={(e) => updateLeader(m.id, "designation", e.target.value)}
                        placeholder="e.g. Principal"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Message</label>
                    <RichTextEditor
                      value={m.message}
                      onChange={(val) => updateLeader(m.id, "message", val)}
                      placeholder="Write a warm welcome message about the school's philosophy and commitment to students..."
                      minHeight="220px"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Core Values Tab ── */}
        {activeSection === "values" && (
          <div className="au-section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {content.values.map((v, i) => (
              <div key={i} style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", fontWeight: 700 }}>
                      {i + 1}
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>Core Value {i + 1}</p>
                  </div>
                </div>
                <div style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={labelStyle}>Title</label>
                    <input
                      className="au-input"
                      type="text"
                      value={v.title}
                      onChange={(e) => handleValueChange(i, "title", e.target.value)}
                      placeholder="e.g. Integrity"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Description</label>
                    <RichTextEditor
                      value={v.description}
                      onChange={(val) => handleValueChange(i, "description", val)}
                      placeholder="Brief description of this value..."
                      minHeight="80px"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Save Bar */}
        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={() => handleSave(false)} disabled={saving} style={{ padding: "11px 24px", background: "#ffffff", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            {saving ? "Saving..." : "Save Draft"}
          </button>
          {isPublished ? (
            <button onClick={handleUnpublish} style={{ padding: "11px 24px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              Unpublish
            </button>
          ) : (
            <button onClick={() => handleSave(true)} disabled={publishing} style={{ padding: "11px 28px", background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}`, display: "flex", alignItems: "center", gap: "8px" }}>
              {publishing ? (
                <>
                  <svg style={{ animation: "spin 1s linear infinite", width: "14px", height: "14px" }} viewBox="0 0 24 24" fill="none">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Publishing...
                </>
              ) : (
                "Publish Page"
              )}
            </button>
          )}
        </div>
      </div>

      {cropTarget && (
        <ImageCropModal
          imageSrc={cropTarget.src}
          aspect={CROP_ASPECTS[cropTarget.mode]}
          onCancel={() => setCropTarget(null)}
          onCropComplete={onCropConfirmed}
        />
      )}
    </>
  );
};

export default AboutUs;
