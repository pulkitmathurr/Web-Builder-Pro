import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";

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

const ResultCard = ({ result, tc, index, onOpen }) => (
    <Reveal delay={Math.min(index * 0.05, 0.3)}>
        <div onClick={onOpen} className="result-card"
            style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15,23,42,0.06)', cursor: 'pointer', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}>
            <div style={{ height: '190px', background: '#f1f5f9', overflow: 'hidden' }}>
                <img src={result.imageUrl} alt={result.title} className="result-card-img"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s ease' }} />
            </div>
            <div style={{ padding: '1rem 1.15rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px', flexWrap: 'wrap' }}>
                    {result.session && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', background: tc.primary, padding: '2.5px 9px', borderRadius: '999px', letterSpacing: '0.03em' }}>
                            {result.session}
                        </span>
                    )}
                    {result.className && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: tc.primary, background: tc.light, padding: '2.5px 9px', borderRadius: '999px', letterSpacing: '0.03em' }}>
                            {result.className}
                        </span>
                    )}
                </div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{result.title}</h3>
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
        .filter(r => r.title && r.imageUrl)
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
                .result-card:hover { transform: translateY(-4px); box-shadow: 0 14px 32px rgba(15,23,42,0.12) !important; }
                .result-card:hover .result-card-img { transform: scale(1.06); }
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

                {/* ── Result grid ── */}
                <div style={{ padding: '3.5rem clamp(1.25rem,6vw,3rem) 6rem' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        {results.length === 0 ? (
                            <p style={{ textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>No results published yet. Please check back soon.</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
                                {results.map((r, i) => (
                                    <ResultCard key={r.id} result={r} tc={tc} index={i} onOpen={() => setLightbox(r)} />
                                ))}
                            </div>
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
