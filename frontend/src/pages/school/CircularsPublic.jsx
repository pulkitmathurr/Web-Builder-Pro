import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";
import { RTE_FONT_CSS, RTE_LIST_CSS } from "../../constants/rteContentStyles";
import { relativeLabel, shortDate, stripHtml } from "../../utils/dateTimeFormat";

const useScrollReveal = () => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.1 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, visible];
};

const Reveal = ({ children, delay = 0, style = {} }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.65s ease ${delay}s, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>
            {children}
        </div>
    );
};

const DocumentIcon = ({ color, size = 17 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h6" />
    </svg>
);

export const CIRCULAR_TAG_COLORS = {
    Academic: '#2563eb',
    Administrative: '#64748b',
    Fee: '#d97706',
    Exam: '#dc2626',
    Holiday: '#059669',
    General: '#7c3aed',
};

const CircularRow = ({ circular, tc, index, onOpen }) => {
    const tagColor = CIRCULAR_TAG_COLORS[circular.tag] || tc.primary;
    const preview = stripHtml(circular.note);
    const rel = relativeLabel(circular.date);
    const sDate = shortDate(circular.date);
    const hasDoc = !!(circular.pdfUrl || circular.linkUrl);

    return (
        <Reveal delay={Math.min(index * 0.04, 0.28)}>
            <div onClick={onOpen} className="circular-row"
                style={{
                    display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.15rem 1.6rem',
                    cursor: 'pointer', borderBottom: '1px solid #e2e8f0',
                    borderLeft: `3px solid ${tagColor}`,
                    transition: 'background 0.15s ease',
                }}>
                <div style={{ flexShrink: 0, width: '68px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>{rel === 'Today' || rel === 'Yesterday' ? rel : (sDate || '—')}</span>
                </div>

                <div className="circular-row-divider" style={{ width: '1px', alignSelf: 'stretch', background: '#eef1f6', flexShrink: 0 }}></div>

                <div className="circular-row-icon" style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '10px', background: `${tagColor}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DocumentIcon color={tagColor} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        <span style={{
                            fontSize: '10px', fontWeight: 700, color: '#ffffff', background: tagColor,
                            padding: '2.5px 9px', borderRadius: '999px', letterSpacing: '0.04em', textTransform: 'uppercase',
                        }}>
                            {circular.tag || 'General'}
                        </span>
                        {!hasDoc && (
                            <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 600 }}>No document attached</span>
                        )}
                    </div>
                    <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', marginBottom: preview ? '4px' : 0, lineHeight: 1.4 }}>
                        {circular.title}
                    </h3>
                    {preview && (
                        <p style={{
                            fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {preview}
                        </p>
                    )}
                </div>

                <div className="circular-row-arrow" style={{ flexShrink: 0, alignSelf: 'center', color: '#94a3b8', fontSize: '16px', transition: 'transform 0.2s ease, color 0.2s ease' }}>›</div>
            </div>
        </Reveal>
    );
};

const CircularsPublic = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        fetchData();
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [slug]);

    const fetchData = async () => {
        try {
            const res = await getPublicSchoolApi(slug);
            setSchool(res.data);
            if (res.data?.id) {
                const contentRes = await getPublicModuleContentApi(res.data.id, 'circulars');
                if (contentRes.data) setContent(contentRes.data);
            }
        } catch (e) {
            navigate('/school-not-found');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid #f0c4c4', borderTop: '3px solid #8b2252', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!school) return null;

    const tc = getThemeColors(school.theme);
    const bc = getBaseColors(school.base_theme);

    if (!isModuleEnabled(school, 'circulars')) return <NotPublished tc={tc} slug={slug} label="Circulars" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Circulars" />;

    const circulars = [...(content.circulars || [])]
        .filter(c => c.title)
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                body { background: ${bc.surface}; }
                .rte-content p { margin-bottom: 0.6em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content ul, .rte-content ol { padding-left: 1.5em; margin-bottom: 0.8em; }
                .rte-content .ql-size-small { font-size: 0.75em; }
                .rte-content .ql-size-large { font-size: 1.5em; }
                .rte-content .ql-size-huge { font-size: 2.5em; }
                ${RTE_FONT_CSS}
                ${RTE_LIST_CSS}
                .circular-row:hover { background: #f8fafc !important; }
                .circular-row:hover .circular-row-arrow { transform: translateX(3px); color: ${tc.primary} !important; }
                .circular-row:hover .circular-row-icon { transform: scale(1.08); }
                .circular-row-icon { transition: transform 0.25s ease; }
                .circular-row:last-child { border-bottom: none !important; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
                @media (max-width: 640px) {
                    .circular-row { gap: 0.75rem !important; padding: 0.9rem 1rem !important; }
                    .circular-row-divider { display: none !important; }
                    .circular-row-icon { width: 34px !important; height: 34px !important; }
                }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="circulars" />

                {/* ── Header ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.6rem) clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: content.headingFont ? getFontFamily(content.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: content.headingColor || '#ffffff', letterSpacing: '-1px', marginBottom: '10px', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                            {content.heading || 'Circulars'}
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Description ── */}
                {content.description && (
                    <div style={{ padding: '3.5rem clamp(1.25rem,6vw,3rem) 0' }}>
                        <Reveal>
                            <div className="rte-content" style={{ maxWidth: '820px', margin: '0 auto', fontSize: '15px', color: '#475569', lineHeight: 1.9, textAlign: 'center' }}
                                dangerouslySetInnerHTML={{ __html: content.description }} />
                        </Reveal>
                    </div>
                )}

                {/* ── Circular list ── */}
                <div style={{ padding: '3.5rem clamp(1.25rem,6vw,3rem) 6rem' }}>
                    <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
                        {circulars.length === 0 ? (
                            <p style={{ textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>No circulars yet. Please check back soon.</p>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: tc.primary }}>All Circulars</span>
                                </div>
                                <div style={{ width: '32px', height: '2px', background: tc.secondary, margin: '0 0 1.1rem', borderRadius: '2px' }}></div>
                                <div style={{ background: bc.card, borderRadius: '8px', border: '1.5px solid #0f172a', boxShadow: '0 10px 28px rgba(15,23,42,0.08)', overflow: 'hidden' }}>
                                    {circulars.map((c, i) => (
                                        <CircularRow key={c.id} circular={c} tc={tc} index={i}
                                            onOpen={() => navigate(`/school/${slug}/circulars/${c.id}`)} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default CircularsPublic;
