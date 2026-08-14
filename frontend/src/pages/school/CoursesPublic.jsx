import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";

const useScrollReveal = () => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.12 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, visible];
};

const Reveal = ({ children, delay = 0, style = {} }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(36px)',
            transition: `opacity 0.75s ease ${delay}s, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
            ...style
        }}>
            {children}
        </div>
    );
};

const CoursesPublic = () => {
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
                const contentRes = await getPublicModuleContentApi(res.data.id, 'courses');
                if (contentRes.data?.sections?.length > 0) setContent(contentRes.data);
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
    const navbarSolid = scrollY > 60;

    if (!isModuleEnabled(school, 'courses')) return <NotPublished tc={tc} slug={slug} label="Courses" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Courses" />;

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes float3d { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
                body { background: ${bc.surface}; }
                .section-card { transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease; }
                .section-card:hover { transform: translateY(-8px); box-shadow: 0 30px 60px rgba(0,0,0,0.1); }
                .subj-chip { transition: all 0.2s; }
                .subj-chip:hover { transform: translateY(-3px); }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
                @media (max-width: 760px) {
                    .section-card { grid-template-columns: 1fr !important; }
                }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="courses" />

                {/* ── Header — no banner photo, clean gradient header (same design as About Us) ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.6rem) clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-1px', marginBottom: '10px' }}>
                            Courses & Streams
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Section Cards ── */}
                <div style={{ padding: '5rem clamp(1.25rem,6vw,5rem) 7rem', background: bc.surface }}>
                    <Reveal>
                        <div style={{ maxWidth: '1200px', margin: '0 auto 3.5rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '14px' }}>What We Offer</p>
                            <h2 style={{ fontSize: 'clamp(28px,4.5vw,44px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-1.5px' }}>Academic Sections</h2>
                        </div>
                    </Reveal>

                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {content.sections.map((sec, i) => (
                            <Reveal key={sec.id} delay={i * 0.1}>
                                <div className="section-card" style={{
                                    display: 'grid', gridTemplateColumns: sec.image ? 'minmax(240px,420px) 1fr' : '1fr',
                                    borderRadius: '28px', overflow: 'hidden', border: '1px solid #f1f5f9',
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.05)', background: bc.card,
                                }}>
                                    {sec.image && (
                                        <div style={{ position: 'relative', overflow: 'hidden' }}>
                                            <img src={sec.image} alt={sec.name} style={{ width: '100%', height: '100%', minHeight: '320px', objectFit: 'cover', display: 'block' }} />
                                            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${tc.primary}20,transparent)` }}></div>
                                        </div>
                                    )}
                                    <div style={{ padding: 'clamp(1.5rem,4vw,3rem)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        {sec.classRange && (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: tc.light, borderRadius: '30px', marginBottom: '1.25rem', width: 'fit-content' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tc.primary }}></div>
                                                <span style={{ fontSize: '12px', color: tc.primary, fontWeight: 700, letterSpacing: '0.05em' }}>{sec.classRange}</span>
                                            </div>
                                        )}
                                        <h3 style={{ fontSize: 'clamp(24px,3.5vw,32px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', marginBottom: '14px' }}>{sec.name}</h3>
                                        {sec.description && (
                                            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.8, marginBottom: '1.75rem', maxWidth: '600px' }}>{sec.description}</p>
                                        )}
                                        {sec.subjects.length > 0 && (
                                            <div>
                                                <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '12px' }}>Subjects Offered</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {sec.subjects.map((subj, j) => (
                                                        <span key={j} className="subj-chip" style={{ padding: '7px 16px', background: bc.cardAlt, border: '1px solid #f1f5f9', borderRadius: '20px', fontSize: '13px', color: '#334155', fontWeight: 500, cursor: 'default' }}>
                                                            {subj}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>

                {/* ── Footer CTA ── */}
                <div style={{ padding: 'clamp(2.5rem,8vw,5rem) clamp(1.25rem,6vw,5rem)', background: bc.surface, textAlign: 'center' }}>
                    <Reveal>
                        <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', letterSpacing: '-0.5px' }}>
                            Want to know more about our academics?
                        </h3>
                        <button onClick={() => navigate(`/school/${slug}`)}
                            style={{ padding: '14px 36px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: `0 10px 30px ${tc.primary}30`, letterSpacing: '0.05em' }}>
                            ← Back to Home
                        </button>
                    </Reveal>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default CoursesPublic;