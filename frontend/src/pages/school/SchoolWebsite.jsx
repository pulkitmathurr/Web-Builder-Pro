import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";
import { SHIELD_PATH_D, SHIELD_ASPECT } from "../../constants/shieldShape";
import { parseDate, shortDate } from "../../utils/dateTimeFormat";
import { getMusicTrack } from "../../constants/musicTracks";
import { getYoutubeEmbedUrl } from "../../utils/youtube";

// ── Scroll-triggered fade+slide-up, same pattern used on every other public page ──
const useScrollReveal = () => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.15 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return [ref, visible];
};

const Reveal = ({ children, delay = 0, style = {}, className }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} className={className} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(40px)',
            transition: `opacity 0.8s ease ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
            ...style
        }}>
            {children}
        </div>
    );
};

// ── Two overlapping shield/crest-shaped photos for the Homepage Highlight section.
// The clip path is defined once in objectBoundingBox units so it scales with each
// image element's own size rather than needing fixed pixel coordinates. ──
const ShieldClipDefs = () => (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
            <clipPath id="homeShieldClip" clipPathUnits="objectBoundingBox">
                <path d={SHIELD_PATH_D} />
            </clipPath>
        </defs>
    </svg>
);

// ── Testimonials — quote card grid shown below Campus Glimpses. Same card
// design as the old standalone Testimonials page, now driven by Home content. ──
const TestimonialStarRow = ({ rating, color }) => (
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

const TESTIMONIAL_TYPE_LABELS = { parent: 'Parent', alumni: 'Alumni', visitor: 'Visitor' };
const TESTIMONIAL_TYPE_BADGE_COLORS = {
    visitor: { bg: '#eff6ff', text: '#2563eb' },
    alumni: { bg: '#fdf4ff', text: '#a21caf' },
};

const TestimonialCard = ({ t, index, tc }) => {
    const initials = t.name ? t.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
    const typeLabel = TESTIMONIAL_TYPE_LABELS[t.type] || 'Parent';
    const badgeColor = TESTIMONIAL_TYPE_BADGE_COLORS[t.type] || { bg: `${tc.primary}12`, text: tc.primary };

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
                            {t.role || typeLabel}
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
                        <span style={{
                            fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                            padding: '3px 8px', borderRadius: '999px',
                            background: badgeColor.bg,
                            color: badgeColor.text,
                        }}>
                            {typeLabel}
                        </span>
                        {!!t.rating && <TestimonialStarRow rating={t.rating} color="#f59e0b" />}
                    </div>
                </div>
            </div>
        </Reveal>
    );
};

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

// ── Floating background-music toggle — starts muted (browsers block
// autoplay-with-sound anyway) with a speaker icon so the visitor opts in ──
const BackgroundMusicPlayer = ({ track, tc }) => {
    const audioRef = useRef(null);
    const [muted, setMuted] = useState(true);

    useEffect(() => {
        audioRef.current?.play().catch(() => {});
    }, [track.url]);

    const toggleMute = () => {
        const next = !muted;
        setMuted(next);
        if (!next) audioRef.current?.play().catch(() => {});
    };

    return (
        <>
            <audio ref={audioRef} src={track.url} loop autoPlay muted={muted} />
            <button
                onClick={toggleMute}
                aria-label={muted ? `Play background music: ${track.label}` : `Mute background music: ${track.label}`}
                title={muted ? `Play "${track.label}"` : `Mute "${track.label}"`}
                style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 1200,
                    width: '48px', height: '48px', borderRadius: '50%', border: 'none',
                    background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`,
                    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.35)', transition: 'transform 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
                {muted ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M23 9l-6 6m0-6l6 6" /></svg>
                ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" /></svg>
                )}
            </button>
        </>
    );
};

// ── Premium "water fill" hover button — fills up like water on hover,
// drains back down with a few trailing drips when the pointer leaves ──
const HeroButton = ({ children, variant = 'solid', tc, onClick }) => {
    const [hover, setHover] = useState(false);
    const solid = variant === 'solid';

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className="hero-water-btn"
            style={{
                padding: '14px 32px', borderRadius: '6px', cursor: 'pointer', border: 'none',
                fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                background: solid ? `linear-gradient(135deg,${tc.primary},${tc.secondary})` : '#ffffff',
                color: solid ? '#ffffff' : '#0f172a',
                boxShadow: solid
                    ? (hover ? `0 12px 36px ${tc.primary}70` : `0 8px 32px ${tc.primary}50`)
                    : (hover ? '0 12px 36px rgba(0,0,0,0.28)' : '0 8px 32px rgba(0,0,0,0.18)'),
                transform: hover ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
        >
            {children}
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
        }, 3000);
        return () => clearInterval(timer);
    }, [heroBanners.length]);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!school) return;
        if (!school.intro_message || school.intro_message_enabled === false || school.intro_message_enabled === 0) { setIntroVisible(false); return; }

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

    const closeWelcomeBanner = () => setShowWelcomeBanner(false);

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
    const bc = getBaseColors(school.base_theme);

    const hasIntroSection = !!(homeContent?.introHeading || homeContent?.introDescription || homeContent?.introImage1 || homeContent?.introImage2);
    const tourEmbedUrl = getYoutubeEmbedUrl(homeContent?.tourYoutubeUrl);
    const campusImages = homeContent?.campusImages || [];
    const testimonials = (homeContent?.testimonials || []).filter(t => t.name);

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

            {/* ── Welcome Banner Popup — optional admissions/promo poster set from Settings.
                 The only thing that opens automatically on page load; the Admission/Career
                 Enquiry forms (EnquiryWidget, mounted separately in App.jsx) only ever open
                 from an explicit click. ── */}
            {showWelcomeBanner && school.welcome_banner_url && (
                <div onClick={closeWelcomeBanner}
                    style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(2,6,23,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', animation: 'fadeIn 0.3s ease' }}>
                    <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '440px', width: '100%' }}>
                        <button onClick={closeWelcomeBanner} aria-label="Close"
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

            {/* ── Background Music — optional, set from Settings; muted until the visitor opts in ── */}
            {school.bg_music_enabled && school.bg_music_track && getMusicTrack(school.bg_music_track) && (
                <BackgroundMusicPlayer track={getMusicTrack(school.bg_music_track)} tc={tc} />
            )}

            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
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
.testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.75rem; }
@media (max-width: 960px) { .testimonials-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .testimonials-grid { grid-template-columns: 1fr; } }
                @media (max-width: 480px) {
                    .hero-buttons-row { flex-wrap: nowrap !important; gap: 6px !important; }
                    .hero-water-btn { padding: 9px 8px !important; font-size: 9px !important; letter-spacing: 0.02em !important; white-space: nowrap !important; flex: 1 1 0 !important; text-align: center !important; }
                }
                @media (max-width: 800px) {
                    .home-intro-grid { grid-template-columns: 1fr !important; }
                }
                /* ── Homepage Highlight shield photos — resting 3D tilt (fanned, opposite
                     directions) that flattens and lifts on hover for a tangible card feel. ── */
                .home-shield-1, .home-shield-2 { transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s ease; transform-style: preserve-3d; }
                .home-shield-1 { transform: perspective(1400px) rotateY(-10deg) rotateX(5deg); }
                .home-shield-2 { transform: perspective(1400px) rotateY(8deg) rotateX(-4deg); }
                .home-shield-photos:hover .home-shield-1 { transform: perspective(1400px) rotateY(-3deg) rotateX(2deg) translateY(-6px); }
                .home-shield-photos:hover .home-shield-2 { transform: perspective(1400px) rotateY(3deg) rotateX(-2deg) translateY(-6px); }
                .cg-tile img { transition: transform 0.6s cubic-bezier(0.16,1,0.3,1); }
                .cg-tile-overlay, .cg-tile-ring { transition: opacity 0.4s ease; }
                .cg-tile { transition: transform 0.45s cubic-bezier(0.16,1,0.3,1), box-shadow 0.45s ease; }
                .cg-tile:hover { transform: translateY(-8px); box-shadow: 0 22px 46px rgba(15,23,42,0.24) !important; }
                .cg-tile:hover img { transform: scale(1.1); }
                .cg-tile:hover .cg-tile-overlay, .cg-tile:hover .cg-tile-ring { opacity: 1 !important; }
                @keyframes cgOrbDrift { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-22px,18px) scale(1.08); } }
                .cg-orb { animation: cgOrbDrift 11s ease-in-out infinite; }
                .cg-ticker-track { display: flex; width: max-content; animation: tickerScroll ${Math.max(20, campusImages.length * 6)}s linear infinite; }
                .cg-ticker-track:hover { animation-play-state: paused; }
                @media (max-width: 640px) {
                    .cg-tile { width: 150px !important; margin: 0 7px !important; border-radius: 13px !important; }
                }
                @media (max-width: 400px) {
                    .cg-tile { width: 125px !important; margin: 0 6px !important; }
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

                {/* ── Hero — video / banner slideshow background.
                     marginTop pushes it below the fixed Navbar (92px, plus the ticker's 34px
                     when visible) instead of the image starting behind/under the navbar. ── */}
                <div style={{ width: '100%', marginTop: `${(tickerVisible ? 34 : 0) + 92}px`, height: `calc(100vh - ${(tickerVisible ? 34 : 0) + 92}px)`, minHeight: '500px', position: 'relative', overflow: 'hidden' }}>
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

                    <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(1.25rem,6vw,3.5rem) clamp(1.25rem,6vw,5rem) clamp(2rem,6vw,3rem)', boxSizing: 'border-box' }}>
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
                            <HeroButton variant="solid" tc={tc} onClick={() => navigate(`/school/${slug}/about`)}>Explore School</HeroButton>
                            <HeroButton variant="outline" tc={tc} onClick={() => window.dispatchEvent(new Event('open-admission-enquiry'))}>Admission Enquiry</HeroButton>
                        </div>
                    </div>
                </div>

                {/* ── Homepage Highlight — optional two-shield-photo + heading/description
                     block, admin-managed from Home Page settings. Hidden entirely until the
                     admin fills in at least one field. ── */}
                {hasIntroSection && (
                    <section style={{ background: bc.surfaceAlt, padding: 'clamp(2rem,5vw,3.5rem) clamp(1.25rem,6vw,5rem)', position: 'relative' }}>
                        <ShieldClipDefs />
                        <div className="home-intro-grid" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(260px,400px) 1fr', gap: 'clamp(1.5rem,4vw,3rem)', alignItems: 'center' }}>
                            <Reveal>
                                <div className="home-shield-photos" style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', perspective: '1400px' }}>
                                    {/* Each shield photo is built from nested same-shape layers (gradient
                                         frame → thin hairline → photo) rather than a CSS border/outline,
                                         since those get cut oddly by the clip-path shape. A resting 3D tilt
                                         (see .home-shield-1/2 above) plus a layered ambient + contact shadow
                                         gives the pair a tangible, fanned-card depth instead of sitting flat. ── */}
                                    {homeContent.introImage1 && (
                                        <div className="home-shield-1" style={{ position: 'absolute', left: 0, top: 0, width: '68%', aspectRatio: `${SHIELD_ASPECT}`, clipPath: 'url(#homeShieldClip)', boxSizing: 'border-box', padding: '7px', background: `linear-gradient(150deg,${tc.secondary},${tc.primary})`, boxShadow: `0 26px 50px rgba(0,0,0,0.24), 0 10px 24px ${tc.primary}40`, zIndex: 1 }}>
                                            <div style={{ width: '100%', height: '100%', clipPath: 'url(#homeShieldClip)', boxSizing: 'border-box', padding: '2.5px', background: '#ffffff' }}>
                                                <div style={{ width: '100%', height: '100%', clipPath: 'url(#homeShieldClip)', overflow: 'hidden' }}>
                                                    <img src={homeContent.introImage1} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {homeContent.introImage2 && (
                                        <div className="home-shield-2" style={{ position: 'absolute', right: 0, bottom: 0, width: '54%', aspectRatio: `${SHIELD_ASPECT}`, clipPath: 'url(#homeShieldClip)', boxSizing: 'border-box', padding: '6px', background: bc.surfaceAlt, boxShadow: `0 26px 50px rgba(0,0,0,0.3), 0 10px 22px ${tc.primary}35`, zIndex: 2 }}>
                                            <div style={{ width: '100%', height: '100%', clipPath: 'url(#homeShieldClip)', boxSizing: 'border-box', padding: '7px', background: `linear-gradient(150deg,${tc.secondary},${tc.primary})` }}>
                                                <div style={{ width: '100%', height: '100%', clipPath: 'url(#homeShieldClip)', boxSizing: 'border-box', padding: '2.5px', background: '#ffffff' }}>
                                                    <div style={{ width: '100%', height: '100%', clipPath: 'url(#homeShieldClip)', overflow: 'hidden' }}>
                                                        <img src={homeContent.introImage2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Reveal>
                            <Reveal delay={0.1}>
                                <div>
                                    {homeContent.introHeading && (
                                        <h2 style={{
                                            fontFamily: homeContent.introHeadingFont ? getFontFamily(homeContent.introHeadingFont) : "'Playfair Display', Georgia, serif",
                                            fontStyle: homeContent.introHeadingFont ? 'normal' : 'italic',
                                            fontWeight: 700, fontSize: 'clamp(22px,3vw,32px)', color: homeContent.introHeadingColor || tc.primary, lineHeight: 1.4, marginBottom: '1.25rem',
                                        }}>
                                            {homeContent.introHeading}
                                        </h2>
                                    )}
                                    {homeContent.introDescription && (
                                        <div className="rte-content" style={{ fontSize: '15px', color: '#334155', lineHeight: 1.9 }} dangerouslySetInnerHTML={{ __html: homeContent.introDescription }} />
                                    )}
                                </div>
                            </Reveal>
                        </div>
                    </section>
                )}

                {/* ── School Tour — optional embedded YouTube video, admin-managed from Home
                     Page settings. Hidden entirely until the admin adds a valid YouTube link. ── */}
                {tourEmbedUrl && (
                    <section style={{ background: bc.surface, padding: 'clamp(2.5rem,6vw,4rem) clamp(1.25rem,6vw,5rem)' }}>
                        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
                            <Reveal style={{ marginBottom: '1.75rem' }}>
                                <h2 style={{
                                    fontFamily: "'Playfair Display', Georgia, serif",
                                    fontSize: 'clamp(26px,3.8vw,40px)', fontWeight: 800, color: tc.primary, letterSpacing: '-0.4px',
                                }}>
                                    {homeContent.tourHeading || 'School Tour'}
                                </h2>
                                <div style={{ width: '64px', height: '4px', borderRadius: '99px', background: `linear-gradient(90deg,${tc.primary},${tc.secondary})`, margin: '14px auto 0' }} />
                            </Reveal>
                            <Reveal delay={0.1}>
                                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 20px 45px rgba(0,0,0,0.18)' }}>
                                    <iframe src={tourEmbedUrl} title="School Tour" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                </div>
                            </Reveal>
                        </div>
                    </section>
                )}

                {/* ── Campus Glimpses — optional photo grid, admin-managed from Home Page
                     settings. Hidden entirely until the admin uploads at least one photo. ── */}
                {campusImages.length > 0 && (
                    <section style={{ background: `linear-gradient(180deg, ${bc.surface}, ${bc.card})`, padding: 'clamp(2.5rem,6vw,4rem) clamp(1.25rem,6vw,5rem)', position: 'relative', overflow: 'hidden' }}>
                        <div className="cg-orb" style={{ position: 'absolute', width: '420px', height: '420px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.primary}26 0%, transparent 70%)`, top: '-160px', left: '-120px', pointerEvents: 'none' }} />
                        <div className="cg-orb" style={{ position: 'absolute', width: '360px', height: '360px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}22 0%, transparent 70%)`, bottom: '-140px', right: '-100px', pointerEvents: 'none', animationDelay: '-4s' }} />

                        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                            <Reveal style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <span style={{ display: 'inline-block', fontSize: '11.5px', fontWeight: 700, color: tc.secondary, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '12px' }}>
                                    School Life
                                </span>
                                <h2 style={{
                                    fontFamily: homeContent.campusHeadingFont ? getFontFamily(homeContent.campusHeadingFont) : undefined,
                                    fontSize: 'clamp(26px,3.8vw,40px)', fontWeight: 800, color: homeContent.campusHeadingColor || tc.primary, marginBottom: '16px', letterSpacing: '-0.4px',
                                }}>
                                    {homeContent.campusHeading || 'Campus Glimpses'}
                                </h2>
                                <div style={{ width: '64px', height: '4px', borderRadius: '99px', background: `linear-gradient(90deg,${tc.primary},${tc.secondary})`, margin: '0 auto 18px' }} />
                                {homeContent.campusSubtext && (
                                    <p style={{ fontSize: '14.5px', color: '#64748b', lineHeight: 1.8, maxWidth: '620px', margin: '0 auto' }}>
                                        {homeContent.campusSubtext}
                                    </p>
                                )}
                            </Reveal>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100px', background: `linear-gradient(90deg,${bc.card},transparent)`, zIndex: 2, pointerEvents: 'none' }}></div>
                                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '100px', background: `linear-gradient(270deg,${bc.card},transparent)`, zIndex: 2, pointerEvents: 'none' }}></div>
                                <div style={{ overflow: 'hidden' }}>
                                    <div className="cg-ticker-track">
                                        {[...campusImages, ...campusImages].map((img, i) => (
                                            <div key={`${img.id || img.url}-${i}`} className="cg-tile" style={{ position: 'relative', flexShrink: 0, width: '260px', margin: '0 12px', borderRadius: '18px', overflow: 'hidden', aspectRatio: '3 / 4', boxShadow: '0 10px 30px rgba(15,23,42,0.14)', border: '1px solid rgba(255,255,255,0.6)' }}>
                                                <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                <div className="cg-tile-overlay" style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 45%, ${tc.dark}cc 100%)`, opacity: 0 }} />
                                                <div className="cg-tile-ring" style={{ position: 'absolute', inset: '10px', border: `1.5px solid ${tc.secondary}`, borderRadius: '11px', opacity: 0 }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Testimonials — optional quote grid shown below Campus Glimpses,
                     admin-managed from Home Page settings. Hidden entirely until the
                     admin adds at least one testimonial. ── */}
                {testimonials.length > 0 && (
                    <section style={{ background: bc.surface, padding: 'clamp(2.5rem,6vw,4.5rem) clamp(1.25rem,6vw,5rem)' }}>
                        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
                            <Reveal style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                                <span style={{ display: 'inline-block', fontSize: '11.5px', fontWeight: 700, color: tc.secondary, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '12px' }}>
                                    Testimonials
                                </span>
                                <h2 style={{
                                    fontFamily: homeContent.testimonialsHeadingFont ? getFontFamily(homeContent.testimonialsHeadingFont) : "'Playfair Display', Georgia, serif",
                                    fontSize: 'clamp(26px,3.8vw,40px)', fontWeight: 800, color: homeContent.testimonialsHeadingColor || tc.primary, marginBottom: '16px', letterSpacing: '-0.4px',
                                }}>
                                    {homeContent.testimonialsHeading || 'What People Say About Us'}
                                </h2>
                                <div style={{ width: '64px', height: '4px', borderRadius: '99px', background: `linear-gradient(90deg,${tc.primary},${tc.secondary})`, margin: '0 auto' }} />
                            </Reveal>
                            <div className="testimonials-grid">
                                {testimonials.map((t, i) => (
                                    <TestimonialCard key={t.id} t={t} index={i} tc={tc} />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default SchoolWebsite;
