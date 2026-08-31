import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";
import { RTE_FONT_CSS, RTE_LIST_CSS } from "../../constants/rteContentStyles";

const BookIcon = ({ color }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
);
const ExternalIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 5h5v5" /><path d="M19 5l-8 8" /><path d="M19 13v4a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h4" />
    </svg>
);

const BookListPublic = () => {
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
                const contentRes = await getPublicModuleContentApi(res.data.id, 'bookList');
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

    if (!isModuleEnabled(school, 'bookList')) return <NotPublished tc={tc} slug={slug} label="Book List" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Book List" />;

    const rows = (content.rows || []).filter(r => r.className && (r.pdfUrl || r.linkUrl));

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
                .rte-content ul, .rte-content ol { padding-left: 1.4em; margin-bottom: 0.6em; }
                .rte-content .ql-size-small { font-size: 0.85em; }
                .rte-content .ql-size-large { font-size: 1.2em; }
                .rte-content .ql-size-huge { font-size: 1.5em; }
                ${RTE_FONT_CSS}
                ${RTE_LIST_CSS}
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
                @keyframes blRowIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
                .bl-row { animation: blRowIn 0.4s ease both; transition: background 0.2s ease; }
                .bl-row:hover { background: ${tc.primary}08; }
                .bl-row:hover .bl-row-icon { transform: scale(1.1) rotate(-4deg); background: ${tc.primary} !important; }
                .bl-row:hover .bl-row-icon svg { stroke: #ffffff !important; }
                .bl-row-icon { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), background 0.25s ease; }
                .bl-view-btn { transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease; }
                .bl-view-btn:hover { transform: translateY(-1px); filter: brightness(1.06); box-shadow: 0 8px 18px ${tc.primary}45; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="bookList" />

                {/* ── Header — no banner photo, clean gradient header (matches About Us) ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.6rem) clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: content.headingFont ? getFontFamily(content.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: content.headingColor || '#ffffff', letterSpacing: '-1px', marginBottom: '10px', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                            {content.heading || 'Book List'}
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Card — title + description + table ── */}
                <div style={{ padding: '3.5rem clamp(1.25rem,6vw,3rem) 7rem' }}>
                    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
                        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #eef1f5', boxShadow: '0 10px 34px rgba(15,23,42,0.07)', overflow: 'hidden' }}>
                            {(content.cardTitle || content.description) && (
                                <div style={{ padding: '1.85rem 2.25rem' }}>
                                    {content.cardTitle && (
                                        <h2 style={{ fontSize: '18px', fontWeight: 700, color: tc.primary, marginBottom: '12px' }}>{content.cardTitle}</h2>
                                    )}
                                    {content.description && (
                                        <div className="rte-content" style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.85 }}
                                            dangerouslySetInnerHTML={{ __html: content.description }} />
                                    )}
                                </div>
                            )}

                            {rows.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: `linear-gradient(135deg,${tc.primary},${tc.secondary})` }}>
                                            <th style={{ textAlign: 'left', padding: '13px 2.25rem', fontSize: '11.5px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Class</th>
                                            <th style={{ textAlign: 'right', padding: '13px 2.25rem', fontSize: '11.5px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Book List</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, i) => {
                                            const isPdf = !!row.pdfUrl;
                                            return (
                                                <tr key={row.id} className="bl-row" style={{ borderTop: '1px solid #f1f5f9', animationDelay: `${i * 0.04}s` }}>
                                                    <td style={{ padding: '11px 2.25rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                                                            <div className="bl-row-icon" style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${tc.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <BookIcon color={tc.primary} />
                                                            </div>
                                                            <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#0f172a' }}>{row.className}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '11px 2.25rem', textAlign: 'right' }}>
                                                        <a href={isPdf ? row.pdfUrl : row.linkUrl} target="_blank" rel="noopener noreferrer" className="bl-view-btn"
                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 15px', borderRadius: '8px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#ffffff', fontSize: '12px', fontWeight: 600, textDecoration: 'none', boxShadow: `0 4px 12px ${tc.primary}35` }}>
                                                            <ExternalIcon />
                                                            View
                                                        </a>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <p style={{ padding: '0 2.25rem 1.85rem', fontSize: '13.5px', color: '#94a3b8' }}>No book lists published yet — check back soon.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default BookListPublic;
