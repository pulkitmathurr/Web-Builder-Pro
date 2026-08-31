import { FONT_OPTIONS } from './fonts';

// ── Shared CSS fragments for any public page that renders RichTextEditor-authored
// HTML via `dangerouslySetInnerHTML` inside a `.rte-content` wrapper. Every such page
// already hand-writes its own base `.rte-content` rules (p/strong/em/u/ql-size, tuned
// per page with its own font-size scale and spacing) — these two fragments cover the
// two things that were missing everywhere and silently failed on every public page:
//
// 1. RTE_FONT_CSS — custom fonts. RichTextEditor.jsx's font picker tags spans with
//    `.ql-font-<key>`, but the matching `font-family` rules are scoped to
//    `.rte-wrapper` (the admin editor only), so a font chosen in the editor never
//    applied on the public site. Append this wherever a page doesn't already define
//    its own `.ql-font-*` rules.
//
// 2. RTE_LIST_CSS — list bullets/numbers. react-quill-new (Quill 2.x) wraps every
//    list type in `<ol><li data-list="bullet|ordered">`, drawing the marker itself
//    via a `.ql-ui::before` pseudo-element rather than native `list-style`. That CSS
//    ships scoped to `.ql-editor` (the editor only) in quill.snow.css, so a saved
//    bullet/numbered list rendered as a bare, unmarked block on every public page.
//    Append this everywhere — no page had it.
//
// Usage: interpolate into a page's own template-string <style> block, right after
// its existing `.rte-content` rules — `${RTE_FONT_CSS}\n${RTE_LIST_CSS}`.
export const RTE_FONT_CSS = FONT_OPTIONS
    .map(f => `.rte-content .ql-font-${f.key} { font-family: ${f.family}; }`)
    .join('\n');

export const RTE_LIST_CSS = `
.rte-content ol { padding-left: 1.5em; margin-bottom: 0.8em; counter-reset: list-0; }
.rte-content li { list-style-type: none; padding-left: 1.5em; position: relative; }
.rte-content li[data-list] > .ql-ui { display: inline-block; }
.rte-content li[data-list] > .ql-ui::before { display: inline-block; margin-left: -1.5em; margin-right: 0.3em; text-align: right; white-space: nowrap; width: 1.2em; }
.rte-content li[data-list="bullet"] > .ql-ui::before { content: '\\2022'; }
.rte-content li[data-list="ordered"] { counter-increment: list-0; }
.rte-content li[data-list="ordered"] > .ql-ui::before { content: counter(list-0, decimal) '. '; }
`;

// Convenience bundle (base rules + font + list) for a page that doesn't have its own
// `.rte-content` block yet — new pages should use this instead of hand-writing one.
export const RTE_CONTENT_CSS = `
.rte-content p { margin-bottom: 0.6em; }
.rte-content p:last-child { margin-bottom: 0; }
.rte-content strong { font-weight: 700; }
.rte-content em { font-style: italic; }
.rte-content u { text-decoration: underline; }
.rte-content .ql-size-small { font-size: 0.75em; }
.rte-content .ql-size-large { font-size: 1.5em; }
.rte-content .ql-size-huge { font-size: 2.5em; }
${RTE_FONT_CSS}
${RTE_LIST_CSS}
`;
