import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { CIRCULAR_TAG_COLORS } from "./CircularsPublic";
import { formatDate } from "../../utils/dateTimeFormat";
import { RTE_FONT_CSS, RTE_LIST_CSS } from "../../constants/rteContentStyles";

const DocumentIcon = ({ color, size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h6" />
    </svg>
);

const CircularDetailPublic = () => {
    const { slug, id } = useParams();
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
    }, [slug, id]);

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

    const circular = (content.circulars || []).find(c => String(c.id) === String(id));

    if (!circular) {
        return (
            <>
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="circulars" />
                <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '4rem 2rem' }}>
                    <p style={{ fontSize: '15px', color: '#94a3b8' }}>This circular could not be found.</p>
                    <Link to={`/school/${slug}/circulars`} style={{ fontSize: '13.5px', fontWeight: 600, color: tc.primary, textDecoration: 'none' }}>← Back to Circulars</Link>
                </div>
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </>
        );
    }

    const { day, month, year } = formatDate(circular.date);
    const tagColor = CIRCULAR_TAG_COLORS[circular.tag] || tc.primary;
    const docUrl = circular.pdfUrl || circular.linkUrl;

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                body { background: ${bc.surface}; }
                .rte-content p { margin-bottom: 0.95em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; color: #0f172a; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content ul, .rte-content ol { padding-left: 1.4em; margin-bottom: 0.9em; }
                .rte-content li { margin-bottom: 0.35em; }
                .rte-content .ql-size-small { font-size: 0.8em; }
                .rte-content .ql-size-large { font-size: 1.35em; }
                .rte-content .ql-size-huge { font-size: 2em; }
                ${RTE_FONT_CSS}
                ${RTE_LIST_CSS}
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
                .download-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar — always solid on this page since there's no dark hero for a transparent navbar to sit on ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="circulars" forceSolid />

                {/* ── Article — no boxed card, content flows directly on the page background,
                    same anatomy as the Announcement/Event detail pages ── */}
                <div style={{ padding: 'calc(92px + 1.1rem) clamp(1.25rem,6vw,3rem) 5rem' }}>
                    <div style={{ maxWidth: '960px', margin: '0 auto' }}>

                        {/* Heading (left) + Download button (right) — wraps onto its own line
                            below a long title instead of overlapping it. */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid #eef1f6' }}>
                            <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                    <span style={{
                                        fontSize: '10px', fontWeight: 700, color: tagColor, background: `${tagColor}14`,
                                        padding: '4px 11px', borderRadius: '999px', letterSpacing: '0.05em', textTransform: 'uppercase',
                                    }}>
                                        {circular.tag || 'General'}
                                    </span>
                                </div>

                                <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px,3.8vw,38px)', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1.22, marginBottom: '0.85rem' }}>
                                    {circular.title}
                                </h1>

                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                                    <DocumentIcon color="#94a3b8" /> {month} {day}, {year}
                                </span>
                            </div>

                            {docUrl ? (
                                <a href={docUrl} target="_blank" rel="noopener noreferrer" className="download-btn"
                                    style={{
                                        flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '9px', fontSize: '14px', fontWeight: 700,
                                        color: '#ffffff', textDecoration: 'none', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`,
                                        borderRadius: '10px', padding: '13px 24px', boxShadow: `0 6px 18px ${tc.primary}33`,
                                        transition: 'filter 0.2s ease, transform 0.2s ease',
                                    }}>
                                    ⬇ {circular.pdfUrl ? 'Download Circular' : 'View Circular'}
                                </a>
                            ) : (
                                <div style={{ flexShrink: 0, fontSize: '13.5px', color: '#94a3b8', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px' }}>
                                    No document has been attached to this circular yet.
                                </div>
                            )}
                        </div>

                        {circular.note && (
                            <div className="rte-content" style={{ fontSize: '15.5px', color: '#334155', lineHeight: 1.9 }}
                                dangerouslySetInnerHTML={{ __html: circular.note }} />
                        )}
                    </div>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default CircularDetailPublic;
