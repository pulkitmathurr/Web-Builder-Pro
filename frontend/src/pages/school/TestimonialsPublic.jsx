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
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.15 });
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

const StarRow = ({ rating, color }) => (
    <div style={{ display: 'flex', gap: '3px' }}>
        {[1, 2, 3, 4, 5].map(star => (
            <svg key={star} width="15" height="15" viewBox="0 0 24 24"
                fill={star <= (rating || 0) ? color : 'none'}
                stroke={star <= (rating || 0) ? color : '#d1d5db'} strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5l2.9 6 6.6.7-4.9 4.6 1.2 6.5L12 16.9l-5.8 3.4 1.2-6.5-4.9-4.6 6.6-.7L12 2.5z" />
            </svg>
        ))}
    </div>
);

// ── Single testimonial card — quote mark, avatar (photo or initials), name/role, type badge, rating ──
const TestimonialCard = ({ t, index, tc }) => {
    const initials = t.name ? t.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';

    return (
        <Reveal delay={Math.min(index, 6) * 0.06} style={{ height: '100%' }}>
            <div style={{
                background: '#ffffff', borderRadius: '18px', padding: '2rem 1.75rem', height: '100%',
                display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
                border: '0.5px solid #f1f5f9', position: 'relative',
            }}>
                <svg width="34" height="26" viewBox="0 0 34 26" fill="none" style={{ marginBottom: '14px', opacity: 0.9 }}>
                    <path d="M0 26V15.6C0 6.9 5.4 1.3 13.5 0l1.6 3.9C9.4 5.3 6.6 8.9 6.2 14h7.3v12H0zm18.5 0V15.6c0-8.7 5.4-14.3 13.5-15.6L33.6 3.9c-5.7 1.4-8.5 5-8.9 10.1H32v12H18.5z" fill={tc.primary} />
                </svg>

                {t.quote && (
                    <div className="rte-content" style={{ fontSize: '14.5px', color: '#334155', lineHeight: 1.8, flex: 1, marginBottom: '18px' }}
                        dangerouslySetInnerHTML={{ __html: t.quote }} />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})` }}>
                        {t.photo ? (
                            <img src={t.photo} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{initials}</span>
                        )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>{t.name}</p>
                        <p style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                            {t.role || (t.type === 'visitor' ? 'Visitor' : 'Parent')}
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
                        <span style={{
                            fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                            padding: '3px 8px', borderRadius: '999px',
                            background: t.type === 'visitor' ? '#eff6ff' : `${tc.primary}12`,
                            color: t.type === 'visitor' ? '#2563eb' : tc.primary,
                        }}>
                            {t.type === 'visitor' ? 'Visitor' : 'Parent'}
                        </span>
                        {!!t.rating && <StarRow rating={t.rating} color="#f59e0b" />}
                    </div>
                </div>
            </div>
        </Reveal>
    );
};

const TestimonialsPublic = () => {
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
                const contentRes = await getPublicModuleContentApi(res.data.id, 'testimonials');
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

    if (!isModuleEnabled(school, 'testimonials')) return <NotPublished tc={tc} slug={slug} label="Testimonials" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Testimonials" />;

    const testimonials = (content.testimonials || []).filter(t => t.name);

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
                .rte-content .ql-size-small { font-size: 0.85em; }
                .rte-content .ql-size-large { font-size: 1.2em; }
                .rte-content .ql-size-huge { font-size: 1.5em; }
                .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.75rem; }
                @media (max-width: 960px) { .testimonials-grid { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 640px) { .testimonials-grid { grid-template-columns: 1fr; } }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="testimonials" />

                {/* ── Header — no banner photo, clean gradient header (matches About Us) ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: '4.5rem clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: content.headingFont ? getFontFamily(content.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: content.headingColor || '#ffffff', letterSpacing: '-1px', marginBottom: '10px', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                            {content.heading || 'What People Say About Us'}
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Testimonials grid ── */}
                <div style={{ padding: '4.5rem clamp(1.25rem,6vw,3rem) 7rem' }}>
                    <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
                        {testimonials.length > 0 ? (
                            <div className="testimonials-grid">
                                {testimonials.map((t, i) => (
                                    <TestimonialCard key={t.id} t={t} index={i} tc={tc} />
                                ))}
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>No testimonials yet — check back soon.</p>
                        )}
                    </div>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default TestimonialsPublic;
