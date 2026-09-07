import { useCallback, useEffect, useRef, useState } from 'react';

// ── Horizontal, swipeable admin tab strip ──────────────────────────────────────
// Drop-in replacement for a `<div style={{ display:'flex', flexWrap:'wrap' }}>`
// wrapping a row of tab <button>s. Instead of the tabs wrapping into an uneven
// multi-line block on narrow / mobile widths, they stay on one line inside a
// scrollable strip, and prev/next arrow buttons appear *only when the tabs
// actually overflow* their row (so on desktop, where everything fits, it looks
// exactly as before — no arrows).
//
// Usage — keep the existing tab buttons as children, untouched:
//   <ScrollTabs colors={tc} style={{ marginBottom: '1.75rem' }}>
//     {TABS.map(t => <button key={t.key} ...>...</button>)}
//   </ScrollTabs>
//
// `colors` takes { primary, light } (e.g. the page's theme `tc`) for the
// right-arrow accent; both are optional.
const ScrollTabs = ({ children, colors = {}, style = {}, gap = 6 }) => {
    const primary = colors.primary || '#4169E1';
    const light = colors.light || '#EDF1FD';

    const stripRef = useRef(null);
    const [overflowing, setOverflowing] = useState(false);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const measure = useCallback(() => {
        const el = stripRef.current;
        if (!el) return;
        setOverflowing(el.scrollWidth > el.clientWidth + 4);
        setAtStart(el.scrollLeft <= 2);
        setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
    }, []);

    useEffect(() => {
        const el = stripRef.current;
        if (!el) return;
        measure();
        el.addEventListener('scroll', measure, { passive: true });
        window.addEventListener('resize', measure);
        // Re-measure once layout / web fonts have settled.
        const t = setTimeout(measure, 300);
        return () => {
            el.removeEventListener('scroll', measure);
            window.removeEventListener('resize', measure);
            clearTimeout(t);
        };
    }, [measure, children]);

    const nudge = (dir) => stripRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });

    const arrowBase = {
        flexShrink: 0, width: '32px', height: '32px', borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'opacity 0.15s ease',
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', ...style }}>
            {overflowing && (
                <button type="button" onClick={() => nudge(-1)} aria-label="Scroll tabs left"
                    style={{ ...arrowBase, border: '1px solid #e2e8f0', background: '#ffffff', color: '#64748b', opacity: atStart ? 0.4 : 1 }}>
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
                </button>
            )}

            <div ref={stripRef} className="scrolltabs-strip"
                style={{ display: 'flex', gap: `${gap}px`, flexWrap: 'nowrap', overflowX: 'auto', scrollBehavior: 'smooth', flex: 1, WebkitOverflowScrolling: 'touch' }}>
                {children}
            </div>

            {overflowing && (
                <button type="button" onClick={() => nudge(1)} aria-label="Scroll tabs right"
                    style={{ ...arrowBase, border: `1.5px solid ${primary}`, background: light, color: primary, opacity: atEnd ? 0.4 : 1 }}>
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                </button>
            )}
        </div>
    );
};

export default ScrollTabs;
