import { useEffect, useState } from "react";
import {
  getModuleContentApi,
  saveModuleContentApi,
  togglePublishApi,
  uploadContentImageApi,
} from "../../../api/content.api";
import RichTextEditor from "../../../components/common/RichTextEditor";
import ImageCropModal from "../../../components/common/ImageCropModal";
import ItalicToggle from "../../../components/common/ItalicToggle";
import useSchoolStore from "../../../store/schoolStore";
import toast from "react-hot-toast";

const hexToRgba = (hex, alpha) => {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const defaultCategory = {
  id: "",
  slug: "",
  name: "",
  banner: "",
  heading: "",
  description: "",
  images: [],
};
const defaultContent = { categories: [] };

const Infrastructure = () => {
  const { tc } = useSchoolStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [content, setContent] = useState(defaultContent);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [uploading, setUploading] = useState({});
  const [bannerCropSrc, setBannerCropSrc] = useState(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await getModuleContentApi("infrastructure");
      if (res.data) {
        setContent({ ...defaultContent, ...res.data.content });
        setIsPublished(res.data.is_published === 1);
        if (res.data.content?.categories?.length > 0) {
          setActiveCategory(res.data.content.categories[0].id);
        }
      }
    } catch (e) {
      console.log("No content yet");
    } finally {
      setLoading(false);
    }
  };

  const fetchPublishedFlag = async () => {
    const res = await getModuleContentApi("infrastructure");
    return !!res?.data?.is_published;
  };

  const handleSave = async (publish = false) => {
    publish ? setPublishing(true) : setSaving(true);
    try {
      await saveModuleContentApi(
        "infrastructure",
        content,
        publish ? 1 : isPublished ? 1 : 0,
      );
      if (publish) {
        let current = await fetchPublishedFlag();
        if (!current) {
          await togglePublishApi("infrastructure", 1);
          current = await fetchPublishedFlag();
        }
        setIsPublished(current);
        toast.success("Infrastructure published! 🎉");
      } else toast.success("Saved!");
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
        await togglePublishApi("infrastructure", 0);
        current = await fetchPublishedFlag();
      }
      setIsPublished(current);
      toast.success("Unpublished");
    } catch (e) {
      toast.error("Failed");
    }
  };

  const addCategory = (name) => {
    if (!name.trim()) return;
    const slug = slugify(name);
    if (content.categories.find((c) => c.slug === slug)) {
      toast.error("A category with this name already exists");
      return;
    }
    const newCat = {
      ...defaultCategory,
      id: `cat-${Date.now()}`,
      slug,
      name: name.trim(),
    };
    setContent((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));
    setActiveCategory(newCat.id);
    setShowAddCategory(false);
    setNewCategoryName("");
  };

  const removeCategory = (id) => {
    setContent((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
    if (activeCategory === id) {
      const remaining = content.categories.filter((c) => c.id !== id);
      setActiveCategory(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const getActiveCategoryData = () =>
    content.categories.find((c) => c.id === activeCategory);

  const updateField = (field, value) => {
    setContent((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === activeCategory ? { ...c, [field]: value } : c,
      ),
    }));
  };

  const uploadBanner = async (file) => {
    setUploading((prev) => ({ ...prev, banner: true }));
    try {
      const res = await uploadContentImageApi(file);
      updateField("banner", res.data.url);
      toast.success("Banner uploaded!");
    } catch (e) {
      toast.error("Failed to upload");
    } finally {
      setUploading((prev) => ({ ...prev, banner: false }));
    }
  };

  const addImages = async (files) => {
    setUploading((prev) => ({ ...prev, image: true }));
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const res = await uploadContentImageApi(file);
        uploadedUrls.push(res.data.url);
      }
      const cat = getActiveCategoryData();
      updateField("images", [...(cat.images || []), ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) added!`);
    } catch (e) {
      toast.error("Failed to upload one or more images");
    } finally {
      setUploading((prev) => ({ ...prev, image: false }));
    }
  };

  const removeImage = (idx) => {
    const cat = getActiveCategoryData();
    updateField(
      "images",
      cat.images.filter((_, i) => i !== idx),
    );
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

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #f0c4c4",
            borderTop: `3px solid ${tc.primary}`,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  const activeData = activeCategory ? getActiveCategoryData() : null;

  return (
    <>
      <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .infra-section { animation: fadeInUp 0.35s ease forwards; }
                .cat-tab:hover { background: ${tc.light} !important; }
            `}</style>

      <div style={{ fontFamily: "system-ui, sans-serif" }}>
        {/* Hero Header */}
        <div style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '10px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
          <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Infrastructure</p>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Infrastructure Categories</h1>
              <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                Add categories like Our Campus, Sports Facilities, Transport — each gets its own page.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '6px', flexShrink: 0 }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8' }}></div>
              <span style={{ fontSize: '12px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{isPublished ? 'Published' : 'Draft'}</span>
            </div>
          </div>
        </div>

        {/* ── Main Layout ── */}
        <div
          className="infra-section"
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: "1.25rem",
            alignItems: "flex-start",
          }}
        >
          {/* Left — Category List */}
          <div
            style={{
              background: "#ffffff",
              border: "0.5px solid #f1f5f9",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              position: "sticky",
              top: "24px",
            }}
          >
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "0.5px solid #f8fafc",
                background: "linear-gradient(135deg,#f8fafc,#f1f5f9)",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: "1px",
                }}
              >
                Categories
              </p>
              <p style={{ fontSize: "11px", color: "#94a3b8" }}>
                {content.categories.length} added
              </p>
            </div>

            <div style={{ padding: "8px" }}>
              {content.categories.length === 0 && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    textAlign: "center",
                    padding: "1.5rem 0",
                  }}
                >
                  No categories yet
                </p>
              )}
              {content.categories.map((cat) => (
                <div
                  key={cat.id}
                  className="cat-tab"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginBottom: "2px",
                    background:
                      activeCategory === cat.id ? tc.light : "transparent",
                    border:
                      activeCategory === cat.id
                        ? "1px solid #f9c4d4"
                        : "1px solid transparent",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: activeCategory === cat.id ? 600 : 400,
                      color: activeCategory === cat.id ? tc.primary : "#0f172a",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {cat.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCategory(cat.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                      padding: "2px",
                      fontSize: "14px",
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div style={{ padding: "8px", borderTop: "0.5px solid #f1f5f9" }}>
              {showAddCategory ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    padding: "4px",
                  }}
                >
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Sports Facilities"
                    style={{
                      ...inputStyle,
                      fontSize: "12px",
                      padding: "8px 10px",
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && addCategory(newCategoryName)
                    }
                  />
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => addCategory(newCategoryName)}
                      style={{
                        flex: 1,
                        padding: "7px",
                        background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`,
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName("");
                      }}
                      style={{
                        flex: 1,
                        padding: "7px",
                        background: "#f1f5f9",
                        color: "#64748b",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddCategory(true)}
                  style={{
                    width: "100%",
                    padding: "9px",
                    background: "transparent",
                    border: "1.5px dashed #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#64748b",
                    cursor: "pointer",
                  }}
                >
                  + Add Category
                </button>
              )}
            </div>
          </div>

          {/* Right — Category Editor */}
          {!activeData ? (
            <div
              style={{
                background: "#ffffff",
                border: "0.5px solid #f1f5f9",
                borderRadius: "16px",
                padding: "4rem",
                textAlign: "center",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <p
                style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.3 }}
              >
                🏛️
              </p>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#0f172a",
                  marginBottom: "6px",
                }}
              >
                No category selected
              </p>
              <p style={{ fontSize: "13px", color: "#94a3b8" }}>
                Add a category — e.g. "Our Campus" or "Sports Facilities"
              </p>
            </div>
          ) : (
            <div
              style={{
                background: "#ffffff",
                border: "0.5px solid #f1f5f9",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  padding: "1.25rem 1.75rem",
                  borderBottom: "0.5px solid #f8fafc",
                  background: "linear-gradient(135deg,#f8fafc,#f1f5f9)",
                }}
              >
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  {activeData.name}
                </p>
                <p style={{ fontSize: "11px", color: "#94a3b8" }}>
                  /infrastructure/{activeData.slug}
                </p>
              </div>

              <div
                style={{
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {/* Banner */}
                <div>
                  <label style={labelStyle}>Banner Image</label>
                  <div
                    onClick={() =>
                      document.getElementById("banner-input").click()
                    }
                    style={{
                      border: "1.5px dashed #e2e8f0",
                      borderRadius: "12px",
                      padding: activeData.banner ? 0 : "2rem",
                      textAlign: "center",
                      cursor: "pointer",
                      background: activeData.banner ? "transparent" : "#fafafa",
                      overflow: "hidden",
                      minHeight: activeData.banner ? "160px" : "auto",
                    }}
                  >
                    {uploading.banner ? (
                      <div style={{ padding: "2rem" }}>
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            border: "3px solid #f0c4c4",
                            borderTop: `3px solid ${tc.primary}`,
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto",
                          }}
                        ></div>
                      </div>
                    ) : activeData.banner ? (
                      <img
                        src={activeData.banner}
                        alt=""
                        style={{
                          width: "100%",
                          height: "160px",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <p style={{ fontSize: "13px", color: "#64748b" }}>
                        🖼️ Click to upload banner — recommended 1920×1080
                      </p>
                    )}
                  </div>
                  <input
                    id="banner-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files[0];
                      e.target.value = "";
                      if (f) setBannerCropSrc(URL.createObjectURL(f));
                    }}
                    style={{ display: "none" }}
                  />
                </div>

                {/* Heading */}
                <div>
                  <label style={labelStyle}>Heading</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={activeData.heading}
                      onChange={(e) => updateField("heading", e.target.value)}
                      placeholder="e.g. Sports Facilities"
                      style={{ ...inputStyle, fontStyle: activeData.headingItalic ? "italic" : "normal" }}
                    />
                    <ItalicToggle active={!!activeData.headingItalic} onToggle={() => updateField("headingItalic", !activeData.headingItalic)} />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={labelStyle}>Description</label>
                  <RichTextEditor
                    value={activeData.description}
                    onChange={(val) => updateField("description", val)}
                    placeholder="Describe this facility/category in detail..."
                    minHeight="150px"
                  />
                </div>

                {/* Images Grid */}
                <div>
                  <label style={labelStyle}>Images</label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4,1fr)",
                      gap: "14px",
                      marginBottom: "1.25rem",
                    }}
                  >
                    {(activeData.images || []).map((img, i) => (
                      <div
                        key={i}
                        style={{
                          position: "relative",
                          borderRadius: "10px",
                          overflow: "hidden",
                          aspectRatio: "1",
                        }}
                      >
                        <img
                          src={img}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <button
                          onClick={() => removeImage(i)}
                          style={{
                            position: "absolute",
                            top: "6px",
                            right: "6px",
                            width: "24px",
                            height: "24px",
                            background: "rgba(0,0,0,0.6)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            cursor: "pointer",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div
                    onClick={() =>
                      document.getElementById("image-input").click()
                    }
                    style={{
                      border: "1.5px dashed #e2e8f0",
                      borderRadius: "12px",
                      padding: "1.5rem",
                      textAlign: "center",
                      cursor: "pointer",
                      background: "#fafafa",
                    }}
                  >
                    {uploading.image ? (
                      <p style={{ fontSize: "13px", color: "#64748b" }}>
                        Uploading...
                      </p>
                    ) : (
                      <p style={{ fontSize: "13px", color: "#64748b" }}>
                        + Click to add image
                      </p>
                    )}
                  </div>
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 0) addImages(files);
                    }}
                    style={{ display: "none" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Save Bar */}
        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            style={{
              padding: "11px 24px",
              background: "#ffffff",
              color: "#64748b",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          {isPublished ? (
            <button
              onClick={handleUnpublish}
              style={{
                padding: "11px 24px",
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Unpublish
            </button>
          ) : (
            <button
              onClick={() => handleSave(true)}
              disabled={publishing}
              style={{
                padding: "11px 28px",
                background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`,
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}`,
              }}
            >
              {publishing ? "Publishing..." : "Publish"}
            </button>
          )}
        </div>
      </div>

      {bannerCropSrc && (
        <ImageCropModal
          imageSrc={bannerCropSrc}
          aspect={16 / 9}
          onCancel={() => setBannerCropSrc(null)}
          onCropComplete={(croppedFile) => { setBannerCropSrc(null); uploadBanner(croppedFile); }}
        />
      )}
    </>
  );
};

export default Infrastructure;
