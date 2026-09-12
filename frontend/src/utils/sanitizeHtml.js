import DOMPurify from "dompurify";

// Sanitizes admin-authored rich-text HTML (RichTextEditor / react-quill-new output) before
// it's rendered via dangerouslySetInnerHTML on public pages — strips <script> tags,
// event-handler attributes (onerror, onclick, ...), javascript: URLs, etc., so a malicious
// or compromised admin account can't run arbitrary JS in a visitor's browser. DOMPurify's
// default profile already allows ordinary tags/class/style (needed for Quill's own
// ql-size-*/ql-align-* markup), it only strips the dangerous parts.
export const sanitizeHtml = (html) => (html ? DOMPurify.sanitize(html) : html);
