import { FONT_OPTIONS, HEADING_SIZE_OPTIONS } from "../../constants/fonts";

// Color + font (+ optional size) picker for plain-text heading fields — the same idea as the
// color swatches already used on the Home page banner (schoolNameColor/taglineColor), extended
// with a font choice so any heading across the admin can be restyled without touching a
// stylesheet. The size dropdown is opt-in: pass `size`/`onSizeChange` to show it (e.g. for
// repeatable content blocks where each heading may want a different weight); omit both and
// this renders exactly as before for the ~10 other call sites that don't need it.
const HeadingStyleField = ({
  color,
  onColorChange,
  font,
  onFontChange,
  size,
  onSizeChange,
  defaultColor = "#0f172a",
}) => {
  const inputStyle = {
    fontSize: "12px",
    padding: "5px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    color: "#0f172a",
    background: "#ffffff",
    cursor: "pointer",
    outline: "none",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
      <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>Color</span>
      <label
        style={{
          position: "relative", width: "24px", height: "24px", borderRadius: "6px",
          border: "1px solid #e2e8f0", overflow: "hidden", cursor: "pointer",
          background: color || defaultColor, flexShrink: 0,
        }}
      >
        <input
          type="color"
          value={color || defaultColor}
          onChange={(e) => onColorChange(e.target.value)}
          style={{ position: "absolute", inset: 0, width: "150%", height: "150%", top: "-25%", left: "-25%", border: "none", cursor: "pointer", padding: 0 }}
        />
      </label>
      {color && (
        <button type="button" onClick={() => onColorChange("")}
          style={{ fontSize: "11px", color: "#64748b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
          Reset
        </button>
      )}

      <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginLeft: "8px" }}>Font</span>
      <select value={font || ""} onChange={(e) => onFontChange(e.target.value)} style={inputStyle}>
        <option value="">Default</option>
        {FONT_OPTIONS.map((f) => (
          <option key={f.key} value={f.key}>{f.label}</option>
        ))}
      </select>

      {onSizeChange && (
        <>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginLeft: "8px" }}>Size</span>
          <select value={size || ""} onChange={(e) => onSizeChange(e.target.value)} style={inputStyle}>
            {HEADING_SIZE_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </>
      )}
    </div>
  );
};

export default HeadingStyleField;
