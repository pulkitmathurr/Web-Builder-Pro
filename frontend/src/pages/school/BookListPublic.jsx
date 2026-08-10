import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";

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
                .bl-view-link { transition: opacity 0.15s ease; }
                .bl-view-link:hover { opacity: 0.7; }
                .bl-table-row:hover { background: #f8fafc; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="bookList" />

                {/* ── Header — no banner photo, clean gradient header (matches About Us) ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: '4.5rem clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
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
                        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 8px 28px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
                            <div style={{ padding: '1.75rem 2rem' }}>
                                {content.cardTitle && (
                                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: tc.primary, marginBottom: '14px' }}>{content.cardTitle}</h2>
                                )}
                                {content.description && (
                                    <div className="rte-content" style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.85 }}
                                        dangerouslySetInnerHTML={{ __html: content.description }} />
                                )}
                            </div>

                            {rows.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: tc.primary }}>
                                            <th style={{ textAlign: 'left', padding: '12px 2rem', fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Class</th>
                                            <th style={{ textAlign: 'left', padding: '12px 2rem', fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>View</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map(row => (
                                            <tr key={row.id} className="bl-table-row" style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                                                <td style={{ padding: '13px 2rem', fontSize: '14px', color: '#0f172a' }}>{row.className}</td>
                                                <td style={{ padding: '13px 2rem' }}>
                                                    <a href={row.pdfUrl || row.linkUrl} target="_blank" rel="noopener noreferrer" className="bl-view-link"
                                                        style={{ fontSize: '13.5px', fontWeight: 600, color: tc.primary, textDecoration: 'underline' }}>
                                                        View
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p style={{ padding: '0 2rem 1.75rem', fontSize: '13.5px', color: '#94a3b8' }}>No book lists published yet — check back soon.</p>
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
