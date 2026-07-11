import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const modules = {
  toolbar: [
    ["bold", "italic", "underline", "strike"],
    [{ size: ["small", false, "large", "huge"] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["clean"],
  ],
};

const formats = [
  "bold",
  "italic",
  "underline",
  "strike",
  "size",
  "list",
  "bullet",
  "align",
];

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  minHeight = "120px",
}) => {
  return (
    <div className="rte-wrapper" style={{ "--rte-min-height": minHeight }}>
      <style>{`
                .rte-wrapper .ql-toolbar {
                    border: 0.5px solid #e2e8f0;
                    border-bottom: none;
                    border-radius: 10px 10px 0 0;
                    background: #f8fafc;
                }
                .rte-wrapper .ql-container {
                    border: 0.5px solid #e2e8f0;
                    border-radius: 0 0 10px 10px;
                    font-family: system-ui, sans-serif;
                    font-size: 13.5px;
                    background: #ffffff;
                }
                .rte-wrapper .ql-editor {
                    min-height: var(--rte-min-height);
                    line-height: 1.7;
                    color: #0f172a;
                }
                .rte-wrapper .ql-editor.ql-blank::before {
                    color: #94a3b8;
                    font-style: normal;
                    font-size: 13.5px;
                }
                .rte-wrapper .ql-snow.ql-toolbar button:hover,
                .rte-wrapper .ql-snow .ql-toolbar button:hover,
                .rte-wrapper .ql-snow.ql-toolbar button.ql-active,
                .rte-wrapper .ql-snow .ql-toolbar button.ql-active {
                    color: #8b2252;
                }
                .rte-wrapper .ql-snow.ql-toolbar button:hover .ql-stroke,
                .rte-wrapper .ql-snow .ql-toolbar button:hover .ql-stroke,
                .rte-wrapper .ql-snow.ql-toolbar button.ql-active .ql-stroke {
                    stroke: #8b2252;
                }
                .rte-wrapper .ql-snow.ql-toolbar button:hover .ql-fill,
                .rte-wrapper .ql-snow .ql-toolbar button:hover .ql-fill,
                .rte-wrapper .ql-snow.ql-toolbar button.ql-active .ql-fill {
                    fill: #8b2252;
                }
                    .rte-wrapper .ql-editor .ql-size-small { font-size: 0.75em; }
.rte-wrapper .ql-editor .ql-size-large { font-size: 1.5em; }
.rte-wrapper .ql-editor .ql-size-huge { font-size: 2.5em; }
            `}</style>
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
