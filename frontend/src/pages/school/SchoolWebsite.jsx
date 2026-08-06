import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import { getThemeColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";
import { parseDate, shortDate } from "../../utils/dateTimeFormat";

// ── Thin autoscrolling strip, fixed above the navbar, surfacing the
// latest announcements — admin-toggleable from the Home Page settings ──
const AnnouncementTicker = ({ slug, tc, items }) => {
    const navigate = useNavigate();

    const label = items
        .map(a => `${a.title}${a.date ? ` (${shortDate(a.date)})` : ''}`)
        .join('   •   ');

    return (
        <div
            onClick={() => navigate(`/school/${slug}/announcements`)}
            role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') navigate(`/school/${slug}/announcements`); }}
            className="announcement-ticker"
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1001,
                height: '34px', display: 'flex', alignItems: 'center',
                background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(6px)',
                borderBottom: `1px solid ${tc.primary}40`, cursor: 'pointer', overflow: 'hidden',
            }}
            title="View all announcements"
        >
            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', padding: '0 14px', height: '100%', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, fontSize: '10.5px', fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase', zIndex: 1 }}>
                🔔 Latest
            </span>
            <div className="announcement-ticker-track" style={{ display: 'flex', whiteSpace: 'nowrap', animation: `tickerScroll ${Math.max(14, items.length * 7)}s linear infinite` }}>
                <span style={{ padding: '0 24px', fontSize: '12.5px', color: 'rgba(255,255,255,0.85)' }}>{label}</span>
                <span style={{ padding: '0 24px', fontSize: '12.5px', color: 'rgba(255,255,255,0.85)' }}>{label}</span>
            </div>
        </div>
    );
};

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
            className="hero-water-btn"
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

// ── Intro text layout — SVG <text> can't wrap on its own, so measure with a
// scratch canvas and greedily wrap into lines, shrinking the font until every
// line fits the screen width and the whole block fits the screen height ──
let introMeasureCtx = null;
const measureIntroTextWidth = (text, fontSize) => {
    if (!introMeasureCtx) introMeasureCtx = document.createElement('canvas').getContext('2d');
    introMeasureCtx.font = `900 ${fontSize}px Inter, system-ui, sans-serif`;
    const letterSpacingExtra = Math.max(0, text.length - 1) * fontSize * 0.02;
    return introMeasureCtx.measureText(text).width + letterSpacingExtra;
};

const wrapIntroLines = (text, fontSize, maxWidth) => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';
    words.forEach(word => {
        const candidate = current ? `${current} ${word}` : word;
        if (!current || measureIntroTextWidth(candidate, fontSize) <= maxWidth) {
            current = candidate;
        } else {
            lines.push(current);
            current = word;
        }
    });
    if (current) lines.push(current);
    return lines;
};

const computeIntroLayout = (text) => {
    const upper = text.toUpperCase();
    const maxWidth = window.innerWidth * 0.88;
    const maxHeight = window.innerHeight * 0.7;
    let fontSize = Math.min(Math.max(window.innerWidth * 0.14, 80), 180);
    let lines = wrapIntroLines(upper, fontSize, maxWidth);
    let guard = 0;
    while (
        guard < 40 && fontSize > 14 &&
        (lines.length * fontSize * 1.05 > maxHeight || lines.some(l => measureIntroTextWidth(l, fontSize) > maxWidth))
    ) {
        fontSize -= Math.max(1, fontSize * 0.05);
        lines = wrapIntroLines(upper, fontSize, maxWidth);
        guard++;
    }
    return { lines, fontSize };
};

const SchoolWebsite = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [homeContent, setHomeContent] = useState(null);
    const [announcementsContent, setAnnouncementsContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [introVisible, setIntroVisible] = useState(true);
    const [introPhase, setIntroPhase] = useState('enter');
    const [bannerIndex, setBannerIndex] = useState(0);
    const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
    const [introLayout, setIntroLayout] = useState({ lines: [], fontSize: 80 });

    useEffect(() => { fetchSchool(); }, [slug]);

    useEffect(() => {
        if (!school?.intro_message) return;
        const recompute = () => setIntroLayout(computeIntroLayout(school.intro_message));
        recompute();
        window.addEventListener('resize', recompute);
        return () => window.removeEventListener('resize', recompute);
    }, [school?.intro_message]);

    const heroBanners = homeContent?.heroBgType === 'banner' ? (homeContent?.heroBanners || []) : [];

    useEffect(() => {
        setBannerIndex(0);
        if (heroBanners.length < 2) return;
        const timer = setInterval(() => {
            setBannerIndex(i => (i + 1) % heroBanners.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [heroBanners.length]);

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

    // ── Welcome banner popup — optional, shown once per browser tab session, only
    // after the intro animation (if any) has finished so the two never overlap ──
    useEffect(() => {
        if (!school || introVisible) return;
        if (!school.welcome_banner_enabled || !school.welcome_banner_url) return;
        const key = `welcomeBannerShown_${school.id}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
        setShowWelcomeBanner(true);
    }, [school, introVisible]);

    const fetchSchool = async () => {
        try {
            const res = await getPublicSchoolApi(slug);
            setSchool(res.data);
            if (res.data?.id) {
                fetchHomeContent(res.data.id);
                fetchAnnouncementsContent(res.data.id);
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

    const fetchAnnouncementsContent = async (schoolId) => {
        try {
            const res = await getPublicModuleContentApi(schoolId, 'announcements');
            if (res.data) setAnnouncementsContent(res.data);
        } catch (e) {
            console.log('No announcements published yet');
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

    const tickerItems = homeContent?.showAnnouncementTicker !== false && isModuleEnabled(school, 'announcements')
        ? [...(announcementsContent?.announcements || [])]
            .filter(a => a.title)
            .sort((a, b) => {
                if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
                return (parseDate(b.date) || 0) - (parseDate(a.date) || 0);
            })
            .slice(0, 5)
        : [];
    const tickerVisible = tickerItems.length > 0;

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
                                    style={{ fontSize: `${introLayout.fontSize}px`, fontWeight: 900, fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.02em', textTransform: 'uppercase', transition: 'font-size 0.2s ease' }}
                                    fontWeight="900" fontFamily="'Inter', system-ui, sans-serif">
                                    {introLayout.lines.map((line, i) => (
                                        <tspan key={i} x="50%" dy={i === 0 ? `${-(introLayout.lines.length - 1) * 0.55}em` : '1.1em'}>
                                            {line}
                                        </tspan>
                                    ))}
                                </text>
                            </mask>
                        </defs>
                        <rect width="100%" height="100%" fill="white" mask="url(#textMask)"
                            style={{ transition: 'opacity 1s ease', opacity: introPhase === 'enter' ? 0 : 1 }} />
                    </svg>

                    <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: introPhase === 'enter' ? 1 : 0, transition: 'opacity 0.8s ease', background: 'white' }}></div>
                </div>
            )}

            {/* ── Welcome Banner Popup — optional admissions/promo poster set from Settings ── */}
            {showWelcomeBanner && school.welcome_banner_url && (
                <div onClick={() => setShowWelcomeBanner(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(2,6,23,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', animation: 'fadeIn 0.3s ease' }}>
                    <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '440px', width: '100%' }}>
                        <button onClick={() => setShowWelcomeBanner(false)} aria-label="Close"
                            style={{ position: 'absolute', top: '-14px', right: '-14px', width: '32px', height: '32px', borderRadius: '50%', background: '#ffffff', border: 'none', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, fontSize: '18px', lineHeight: 1, boxShadow: '0 4px 14px rgba(0,0,0,0.35)' }}>
                            ×
                        </button>
                        <div
                            onClick={() => { if (school.welcome_banner_link) window.open(school.welcome_banner_link, '_blank', 'noopener,noreferrer'); }}
                            style={{ cursor: school.welcome_banner_link ? 'pointer' : 'default', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', lineHeight: 0 }}>
                            <img src={school.welcome_banner_url} alt="Welcome" style={{ width: '100%', maxHeight: '85vh', objectFit: 'contain', display: 'block', background: '#0f172a' }} />
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
                @keyframes waterWave { from { transform: translateX(0); } to { transform: translateX(-20px); } }
                @keyframes waterDrip { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(26px); opacity: 0; } }
                @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                .announcement-ticker:hover .announcement-ticker-track { animation-play-state: paused; }
.rte-content p { margin-bottom: 0.8em; }
.rte-content p:last-child { margin-bottom: 0; }
.rte-content strong { font-weight: 700; }
.rte-content em { font-style: italic; }
.rte-content u { text-decoration: underline; }
.rte-content ul, .rte-content ol { padding-left: 1.5em; margin-bottom: 0.8em; }
.rte-content .ql-size-small { font-size: 0.75em; }
.rte-content .ql-size-large { font-size: 1.5em; }
.rte-content .ql-size-huge { font-size: 2.5em; }
.rte-content .ql-font-inter { font-family: 'Inter', system-ui, sans-serif; }
.rte-content .ql-font-poppins { font-family: 'Poppins', sans-serif; }
.rte-content .ql-font-montserrat { font-family: 'Montserrat', sans-serif; }
.rte-content .ql-font-playfair { font-family: 'Playfair Display', Georgia, serif; }
.rte-content .ql-font-raleway { font-family: 'Raleway', sans-serif; }
.rte-content .ql-font-merriweather { font-family: 'Merriweather', Georgia, serif; }
                @media (max-width: 480px) {
                    .hero-buttons-row { flex-wrap: nowrap !important; gap: 6px !important; }
                    .hero-water-btn { padding: 9px 8px !important; font-size: 9px !important; letter-spacing: 0.02em !important; white-space: nowrap !important; flex: 1 1 0 !important; text-align: center !important; }
                }
            `}</style>

            <div style={{ width: '100%', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", background: '#020617', position: 'relative', overflowX: 'hidden' }}>

                {/* ── Latest Announcement Ticker — admin-toggleable in Home Page settings.
                     Sits above the Navbar (topOffset pushes the fixed Navbar down by the
                     ticker's height) so it's only ever present on this page. ── */}
                {tickerVisible && (
                    <AnnouncementTicker slug={slug} tc={tc} items={tickerItems} />
                )}

                {/* ── Shared Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="home" topOffset={tickerVisible ? 34 : 0} />

                {/* ── Hero — video / banner slideshow background — taller than one viewport (fixed
                     px buffer on top of 100vh, not a vh percentage, so it stays taller than the
                     screen even on shorter laptop viewports) so the footer isn't already visible
                     without scrolling ── */}
                <div style={{ width: '100%', height: 'calc(100vh + 220px)', position: 'relative', overflow: 'hidden' }}>
                    {heroBanners.length > 0 ? (
                        heroBanners.map((b, i) => (
                            <div key={b.id || b.url} aria-hidden={i !== bannerIndex}
                                style={{ position: 'absolute', inset: 0, backgroundImage: `url(${b.url})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0, opacity: i === bannerIndex ? 1 : 0, transition: 'opacity 1.2s ease' }} />
                        ))
                    ) : school.hero_video_url ? (
                        <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}>
                            <source src={school.hero_video_url} type="video/mp4" />
                        </video>
                    ) : (
                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${tc.dark},#020617)`, zIndex: 0 }}></div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.55)', zIndex: 1 }}></div>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px', zIndex: 1 }}></div>

                    {/* Pinned to the real viewport height (not the taller buffered container above)
                         so the heading/buttons always land above the fold, no scrolling needed. */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(1.25rem,7vw,4.5rem) clamp(1.25rem,6vw,5rem) clamp(3rem,10vw,4.5rem)', boxSizing: 'border-box' }}>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
                            {school.city || 'Excellence in Education'}
                        </p>
                        <h1 style={homeContent?.schoolNameColor ? {
                            fontFamily: getFontFamily(homeContent?.schoolNameFont), fontSize: 'clamp(34px,9vw,76px)', fontWeight: 900, lineHeight: 1.15, paddingBottom: '0.08em', marginBottom: homeContent?.tagline ? '14px' : '24px', letterSpacing: '-1.5px', maxWidth: '900px', color: homeContent.schoolNameColor,
                        } : {
                            fontFamily: getFontFamily(homeContent?.schoolNameFont), fontSize: 'clamp(34px,9vw,76px)', fontWeight: 900, lineHeight: 1.15, paddingBottom: '0.08em', marginBottom: homeContent?.tagline ? '14px' : '24px', letterSpacing: '-1.5px', maxWidth: '900px', background: `linear-gradient(90deg, #fff 0%, ${tc.secondary} 50%, #fff 100%)`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'shimmer 4s linear infinite',
                        }}>
                            {school.name}
                        </h1>

                        {homeContent?.tagline && (
                            <p style={{ fontFamily: homeContent.taglineFont ? getFontFamily(homeContent.taglineFont) : undefined, fontSize: 'clamp(16px,3.2vw,22px)', color: homeContent.taglineColor || tc.secondary, marginBottom: '20px', fontWeight: 600, letterSpacing: '0.02em' }}>
                                {homeContent.tagline}
                            </p>
                        )}

                        {homeContent?.subText && (
                            <div className="rte-content" style={{ fontFamily: homeContent.subTextFont ? getFontFamily(homeContent.subTextFont) : undefined, fontSize: 'clamp(14px,2vw,18px)', color: homeContent.subTextColor || 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: '2.5rem', width: '100%', maxWidth: '1040px', overflowWrap: 'normal', wordBreak: 'normal' }}
                                dangerouslySetInnerHTML={{ __html: homeContent.subText }} />
                        )}
                        <div className="hero-buttons-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                            <WaterButton variant="solid" tc={tc} onClick={() => navigate(`/school/${slug}/about`)}>Explore School</WaterButton>
                            <WaterButton variant="outline" tc={tc} onClick={() => window.dispatchEvent(new Event('open-admission-enquiry'))}>Admission Enquiry</WaterButton>
                        </div>
                    </div>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default SchoolWebsite;
