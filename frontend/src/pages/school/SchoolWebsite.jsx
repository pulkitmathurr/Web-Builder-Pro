import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import { getThemeColors } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";

// ── Premium "water fill" hover button — fills up like water on hover,
// drains back down with a few trailing drips when the pointer leaves ──
const WaterButton = ({ children, variant = 'solid', tc, onClick }) => {
    const [hover, setHover] = useState(false);
    const [drips, setDrips] = useState([]);

    const handleLeave = () => {
        setHover(false);
        const newDrips = Array.from({ length: 3 }).map((_, i) => ({ id: `${Date.now()}-${i}`, left: 18 + Math.random() * 64, delay: i * 0.06 }));
        setDrips(newDrips);
        setTimeout(() => setDrips([]), 750);
    };

    const solid = variant === 'solid';

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={handleLeave}
            style={{
                position: 'relative', overflow: 'hidden', isolation: 'isolate',
                padding: '14px 32px', borderRadius: '6px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                border: solid ? 'none' : '1px solid rgba(255,255,255,0.4)',
                background: solid ? `linear-gradient(135deg,${tc.primary},${tc.secondary})` : 'transparent',
                color: '#ffffff',
                boxShadow: solid ? (hover ? `0 12px 36px ${tc.primary}70` : `0 8px 32px ${tc.primary}50`) : 'none',
                transform: hover ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
        >
            {/* water fill layer */}
            <span aria-hidden style={{
                position: 'absolute', left: 0, right: 0, bottom: hover ? '0%' : '-100%',
                height: '160%', zIndex: 0,
                transition: 'bottom 0.55s cubic-bezier(0.65,0,0.35,1)',
                background: solid ? 'rgba(255,255,255,0.22)' : `linear-gradient(180deg, ${tc.secondary}, ${tc.primary})`,
            }}>
                {/* animated wavy top edge */}
                <span aria-hidden style={{
                    position: 'absolute', top: '-1px', left: 0, width: '200%', height: '14px',
                    background: `repeating-radial-gradient(circle at 10px -4px, transparent 0, transparent 6px, ${solid ? 'rgba(255,255,255,0.22)' : tc.secondary} 7px, ${solid ? 'rgba(255,255,255,0.22)' : tc.secondary} 9px)`,
                    backgroundSize: '20px 14px',
                    animation: hover ? 'waterWave 1.1s linear infinite' : 'none',
                }} />
            </span>

            {/* drip dots that fall when the water drains */}
            {drips.map(d => (
                <span key={d.id} aria-hidden style={{
                    position: 'absolute', bottom: '2px', left: `${d.left}%`, zIndex: 1,
                    width: '4px', height: '9px', borderRadius: '0 0 50% 50% / 0 0 65% 65%',
                    background: solid ? 'rgba(255,255,255,0.55)' : tc.secondary,
                    animation: `waterDrip 0.7s ease-in ${d.delay}s forwards`,
                }} />
            ))}

            <span style={{ position: 'relative', zIndex: 2 }}>{children}</span>
        </button>
    );
};

const SchoolWebsite = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [homeContent, setHomeContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [introVisible, setIntroVisible] = useState(true);
    const [introPhase, setIntroPhase] = useState('enter');

    useEffect(() => { fetchSchool(); }, [slug]);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!school) return;
        if (!school.intro_message) { setIntroVisible(false); return; }

        const t1 = setTimeout(() => setIntroPhase('hold'), 800);
        const t2 = setTimeout(() => setIntroPhase('exit'), 2500);
        const t3 = setTimeout(() => setIntroVisible(false), 3500);

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [school]);

    const fetchSchool = async () => {
        try {
            const res = await getPublicSchoolApi(slug);
            setSchool(res.data);
            if (res.data?.id) {
                fetchHomeContent(res.data.id);
            }
        } catch (e) {
            navigate("/school-not-found");
        } finally {
            setLoading(false);
        }
    };

    const fetchHomeContent = async (schoolId) => {
        try {
            const res = await getPublicModuleContentApi(schoolId, 'home');
            if (res.data) setHomeContent(res.data);
        } catch (e) {
            console.log('No home content published yet');
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: "#020617", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ width: "48px", height: "48px", border: "3px solid rgba(139,34,82,0.3)", borderTop: "3px solid #c9687e", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 14px" }}></div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Loading...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!school) return null;

    const tc = getThemeColors(school.theme);

    return (
        <>
            {/* ── Intro Animation ── */}
            {introVisible && school?.intro_message && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    overflow: 'hidden',
                    transition: introPhase === 'exit' ? 'opacity 0.6s ease, transform 1.2s cubic-bezier(0.16,1,0.3,1)' : 'none',
                    opacity: introPhase === 'exit' ? 0 : 1,
                    transform: introPhase === 'exit' ? 'scale(2.5)' : 'scale(1)',
                    pointerEvents: introPhase === 'exit' ? 'none' : 'all',
                }}>
                    {school.hero_video_url ? (
                        <video autoPlay muted loop playsInline
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}>
                            <source src={school.hero_video_url} type="video/mp4" />
                        </video>
                    ) : (
                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${tc.dark},#020617)`, zIndex: 0 }}></div>
                    )}

                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, transition: 'opacity 1s ease' }} xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <mask id="textMask">
                                <rect width="100%" height="100%" fill="white"/>
                                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="black"
                                    style={{ fontSize: 'clamp(80px, 14vw, 180px)', fontWeight: 900, fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.02em', textTransform: 'uppercase', transition: 'font-size 1.2s cubic-bezier(0.16,1,0.3,1)' }}
                                    fontSize="clamp(80px, 14vw, 180px)" fontWeight="900" fontFamily="'Inter', system-ui, sans-serif" letterSpacing="2">
                                    {school.intro_message.toUpperCase()}
                                </text>
                            </mask>
                        </defs>
                        <rect width="100%" height="100%" fill="white" mask="url(#textMask)"
                            style={{ transition: 'opacity 1s ease', opacity: introPhase === 'enter' ? 0 : 1 }} />
                    </svg>

                    <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: introPhase === 'enter' ? 1 : 0, transition: 'opacity 0.8s ease', background: 'white' }}></div>
                </div>
            )}

            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
                @keyframes waterWave { from { transform: translateX(0); } to { transform: translateX(-20px); } }
                @keyframes waterDrip { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(26px); opacity: 0; } }
.rte-content p { margin-bottom: 0.8em; }
.rte-content p:last-child { margin-bottom: 0; }
.rte-content strong { font-weight: 700; }
.rte-content em { font-style: italic; }
.rte-content u { text-decoration: underline; }
.rte-content ul, .rte-content ol { padding-left: 1.5em; margin-bottom: 0.8em; }
.rte-content .ql-size-small { font-size: 0.75em; }
.rte-content .ql-size-large { font-size: 1.5em; }
.rte-content .ql-size-huge { font-size: 2.5em; }
            `}</style>

            <div style={{ width: '100%', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", background: '#020617', position: 'relative', overflowX: 'hidden' }}>

                {/* ── Shared Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="home" />

                {/* ── Hero — video background ── */}
                <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
                    {school.hero_video_url ? (
                        <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}>
                            <source src={school.hero_video_url} type="video/mp4" />
                        </video>
                    ) : (
                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${tc.dark},#020617)`, zIndex: 0 }}></div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.55)', zIndex: 1 }}></div>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px', zIndex: 1 }}></div>

                    <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 5rem 7rem' }}>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
                            {school.city || 'Excellence in Education'}
                        </p>
                        <h1 style={{ fontFamily: getFontFamily(school.heading_font), fontSize: '76px', fontWeight: 900, lineHeight: 1.0, marginBottom: homeContent?.tagline ? '14px' : '24px', letterSpacing: '-3px', maxWidth: '900px', background: `linear-gradient(90deg, #fff 0%, ${tc.secondary} 50%, #fff 100%)`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'shimmer 4s linear infinite' }}>
                            {school.name}
                        </h1>

                        {homeContent?.tagline && (
                            <p style={{ fontSize: '22px', color: tc.secondary, marginBottom: '20px', fontWeight: 600, letterSpacing: '0.02em' }}>
                                {homeContent.tagline}
                            </p>
                        )}

                        {homeContent?.subText && (
                            <div className="rte-content" style={{ fontSize: '18px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: '2.5rem', width: '80%', maxWidth: '1040px', overflowWrap: 'break-word' }}
                                dangerouslySetInnerHTML={{ __html: homeContent.subText }} />
                        )}
                        <div style={{ display: 'flex', gap: '14px' }}>
                            <WaterButton variant="solid" tc={tc} onClick={() => navigate(`/school/${slug}/about`)}>Explore School</WaterButton>
                            <WaterButton variant="outline" tc={tc}>Admission Enquiry</WaterButton>
                        </div>
                    </div>

                    <div style={{ position: 'absolute', left: '5rem', bottom: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', zIndex: 2 }}>
                        <svg width="24" height="24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default SchoolWebsite;
