import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import { getThemeColors } from "../../constants/publicNav";

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
    const navbarSolid = scrollY > 60;

    if (!content) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ fontSize: '18px', color: '#64748b' }}>Courses page not published yet</p>
            <button onClick={() => navigate(`/school/${slug}`)}
                style={{ padding: '12px 28px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                ← Back to Home
            </button>
        </div>
    );

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes float3d { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
                body { background: #ffffff; }
                .section-card { transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease; }
                .section-card:hover { transform: translateY(-8px); box-shadow: 0 30px 60px rgba(0,0,0,0.1); }
                .subj-chip { transition: all 0.2s; }
                .subj-chip:hover { transform: translateY(-3px); }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="courses" />

                {/* ── Hero ── */}
                <div style={{ height: '60vh', background: `linear-gradient(135deg,${tc.dark} 0%,${tc.primary} 100%)`, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: `radial-gradient(circle,${tc.secondary}20,transparent)`, top: '-200px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '30px 30px' }}></div>
                    <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '16px' }}>{school.name}</p>
                        <h1 style={{ fontSize: 'clamp(48px,7vw,96px)', fontWeight: 900, color: '#ffffff', letterSpacing: '-3px', lineHeight: 1 }}>Courses & Streams</h1>
                        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginTop: '16px' }}>Academic programs across all levels</p>
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to bottom,transparent,#ffffff)' }}></div>
                </div>

                {/* ── Section Cards ── */}
                <div style={{ padding: '5rem 5rem 7rem', background: '#ffffff' }}>
                    <Reveal>
                        <div style={{ maxWidth: '1200px', margin: '0 auto 3.5rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '14px' }}>What We Offer</p>
                            <h2 style={{ fontSize: '44px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1.5px' }}>Academic Sections</h2>
                        </div>
                    </Reveal>

                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {content.sections.map((sec, i) => (
                            <Reveal key={sec.id} delay={i * 0.1}>
                                <div className="section-card" style={{
                                    display: 'grid', gridTemplateColumns: sec.image ? '420px 1fr' : '1fr',
                                    borderRadius: '28px', overflow: 'hidden', border: '1px solid #f1f5f9',
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.05)', background: '#ffffff',
                                }}>
                                    {sec.image && (
                                        <div style={{ position: 'relative', overflow: 'hidden' }}>
                                            <img src={sec.image} alt={sec.name} style={{ width: '100%', height: '100%', minHeight: '320px', objectFit: 'cover', display: 'block' }} />
                                            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${tc.primary}20,transparent)` }}></div>
                                        </div>
                                    )}
                                    <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        {sec.classRange && (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: tc.light, borderRadius: '30px', marginBottom: '1.25rem', width: 'fit-content' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tc.primary }}></div>
                                                <span style={{ fontSize: '12px', color: tc.primary, fontWeight: 700, letterSpacing: '0.05em' }}>{sec.classRange}</span>
                                            </div>
                                        )}
                                        <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', marginBottom: '14px' }}>{sec.name}</h3>
                                        {sec.description && (
                                            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.8, marginBottom: '1.75rem', maxWidth: '600px' }}>{sec.description}</p>
                                        )}
                                        {sec.subjects.length > 0 && (
                                            <div>
                                                <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '12px' }}>Subjects Offered</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {sec.subjects.map((subj, j) => (
                                                        <span key={j} className="subj-chip" style={{ padding: '7px 16px', background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: '20px', fontSize: '13px', color: '#334155', fontWeight: 500, cursor: 'default' }}>
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
                <div style={{ padding: '5rem', background: tc.light, textAlign: 'center' }}>
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