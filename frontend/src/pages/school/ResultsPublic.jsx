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

// ── Single-column list, one large clickable result image per row (title +
// session/class label above it) — mirrors the reference site's plain
// "Result 2025-26 Class 12" heading + full-width image layout. ──
const ResultRow = ({ result, tc, index, onOpen }) => (
    <Reveal delay={Math.min(index * 0.06, 0.3)}>
        <div style={{ marginBottom: '3.25rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                {result.title && (
                    <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a', lineHeight: 1.4, marginBottom: (result.session || result.className) ? '9px' : 0 }}>{result.title}</h3>
                )}
                {(result.session || result.className) && (
                    <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, color: '#fff', background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`, padding: '4px 14px', borderRadius: '999px', letterSpacing: '0.04em', textTransform: 'uppercase', boxShadow: `0 4px 12px ${tc.primary}40` }}>
                        {[result.session, result.className].filter(Boolean).join(' · ')}
                    </span>
                )}
            </div>
            <div onClick={onOpen} className="result-frame">
                <div className="result-frame-inner">
                    <img src={result.imageUrl} alt={result.title || 'Result'} className="result-img" />
                </div>
                <div className="result-frame-shine"></div>
            </div>
        </div>
    </Reveal>
);

const ResultsPublic = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [lightbox, setLightbox] = useState(null);

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
                const contentRes = await getPublicModuleContentApi(res.data.id, 'results');
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

    if (!isModuleEnabled(school, 'results')) return <NotPublished tc={tc} slug={slug} label="Results" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Results" />;

    const results = [...(content.results || [])]
        .filter(r => r.imageUrl)
        .sort((a, b) => (b.session || '').localeCompare(a.session || ''));

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
                .result-frame {
                    position: relative;
                    padding: 4px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, ${tc.primary}, ${tc.secondary});
                    cursor: pointer;
                    box-shadow: 0 10px 28px rgba(15,23,42,0.10);
                    transition: transform 0.45s cubic-bezier(0.16,1,0.3,1), box-shadow 0.45s cubic-bezier(0.16,1,0.3,1);
                    overflow: hidden;
                }
                .result-frame:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 24px 50px ${tc.primary}40, 0 10px 28px rgba(15,23,42,0.14);
                }
                .result-frame-inner {
                    position: relative;
                    z-index: 1;
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 8px;
                    overflow: hidden;
                }
                .result-img {
                    display: block;
                    width: 100%;
                    height: auto;
                    border-radius: 7px;
                    transition: transform 0.6s cubic-bezier(0.16,1,0.3,1);
                }
                .result-frame:hover .result-img { transform: scale(1.04); }
                .result-frame-shine {
                    position: absolute;
                    top: 0; left: -60%;
                    width: 40%; height: 100%;
                    background: linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent);
                    transform: skewX(-20deg);
                    transition: left 0.85s ease;
                    z-index: 2;
                    pointer-events: none;
                }
                .result-frame:hover .result-frame-shine { left: 130%; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="results" />

                {/* ── Header ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.6rem) clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: content.headingFont ? getFontFamily(content.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: content.headingColor || '#ffffff', letterSpacing: '-1px', marginBottom: '10px', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                            {content.heading || 'Results'}
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

                {/* ── Result list ── */}
                <div style={{ padding: '3.5rem clamp(1.25rem,6vw,3rem) 6rem' }}>
                    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
                        {results.length === 0 ? (
                            <p style={{ textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>No results published yet. Please check back soon.</p>
                        ) : (
                            results.map((r, i) => (
                                <ResultRow key={r.id} result={r} tc={tc} index={i} onOpen={() => setLightbox(r)} />
                            ))
                        )}
                    </div>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>

            {/* ── Lightbox ── */}
            {lightbox && (
                <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(2,6,23,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', animation: 'fadeIn 0.2s ease' }}>
                    <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
                    <button onClick={() => setLightbox(null)} aria-label="Close"
                        style={{ position: 'absolute', top: '20px', right: '24px', width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>
                        ×
                    </button>
                    <div onClick={e => e.stopPropagation()} style={{ maxWidth: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                        <img src={lightbox.imageUrl} alt={lightbox.title} style={{ maxWidth: '100%', maxHeight: '76vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>{lightbox.title}</p>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12.5px', marginTop: '2px' }}>{[lightbox.session, lightbox.className].filter(Boolean).join(' · ')}</p>
                        </div>
                        <a href={lightbox.imageUrl} target="_blank" rel="noreferrer"
                            style={{ fontSize: '12.5px', fontWeight: 600, color: '#fff', background: tc.primary, padding: '9px 18px', borderRadius: '8px', textDecoration: 'none' }}>
                            Open Full Size ↗
                        </a>
                    </div>
                </div>
            )}
        </>
    );
};

export default ResultsPublic;
