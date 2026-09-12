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
import { sanitizeHtml } from "../../utils/sanitizeHtml";
import { parseDate, formatDate, stripHtml } from "../../utils/dateTimeFormat";

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

export const EVENT_TAG_COLORS = {
    Cultural: '#7c3aed',
    Sports: '#059669',
    Academic: '#2563eb',
    Workshop: '#d97706',
    Competition: '#dc2626',
    Celebration: '#db2777',
};

const CalendarIcon = ({ color, size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2.5" />
        <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
);

const PinIcon = ({ color, size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 6.5-9 12.5-9 12.5S3 16.5 3 10a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const ArrowRightIcon = ({ color, size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16M13 5l7 7-7 7" />
    </svg>
);

const UpcomingTabIcon = ({ color, size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2.5" />
        <path d="M8 3v4M16 3v4M3 10h18" />
        <path d="M12 14v3l2 1.5" />
    </svg>
);

const PastTabIcon = ({ color, size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v5h5" />
        <path d="M3.5 13a8.5 8.5 0 108.5-9.5c-3 0-5.6 1.5-7.2 4" />
    </svg>
);

const EventCard = ({ event, tc, bc, index, onOpen }) => {
    const tagColor = EVENT_TAG_COLORS[event.tag] || tc.primary;
    const { day, month } = formatDate(event.date);
    const preview = stripHtml(event.body);

    return (
        <Reveal delay={Math.min(index * 0.05, 0.3)}>
            <div onClick={onOpen} className="event-card"
                style={{
                    cursor: 'pointer', background: bc.card, borderRadius: '14px', border: '1px solid #e7ebf1',
                    boxShadow: '0 1px 3px rgba(15,23,42,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%',
                    transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease, border-color 0.3s ease',
                }}>
                <div className="event-card-media" style={{ position: 'relative', height: '172px', overflow: 'hidden', background: event.image ? '#0f172a' : `linear-gradient(135deg, ${tagColor}14, ${tagColor}2a)`, flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: tagColor, zIndex: 2 }}></div>
                    {event.image ? (
                        <img className="event-card-img" src={event.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CalendarIcon color={tagColor} />
                        </div>
                    )}
                    <div style={{
                        position: 'absolute', top: '12px', left: '12px', background: '#ffffff', borderRadius: '7px',
                        padding: '5px 10px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.18)', lineHeight: 1,
                    }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{day}</div>
                        <div style={{ fontSize: '9px', fontWeight: 700, color: tagColor, letterSpacing: '0.05em', marginTop: '2px' }}>{month}</div>
                    </div>
                    <span style={{
                        position: 'absolute', top: '12px', right: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px',
                        fontSize: '9.5px', fontWeight: 700, color: tagColor, background: 'rgba(255,255,255,0.94)',
                        padding: '5px 10px 5px 8px', borderRadius: '999px', letterSpacing: '0.05em', textTransform: 'uppercase',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                    }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: tagColor, flexShrink: 0 }}></span>
                        {event.tag || 'Event'}
                    </span>
                </div>

                <div style={{ padding: '1.15rem 1.2rem 1.1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '7px', lineHeight: 1.35, letterSpacing: '-0.2px' }}>
                        {event.title}
                    </h3>
                    {event.venue && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#8b95a5', marginBottom: '8px' }}>
                            <PinIcon color="#a3adbd" />
                            <span>{event.venue}</span>
                        </div>
                    )}
                    {preview && (
                        <p style={{
                            fontSize: '12.5px', color: '#64748b', lineHeight: 1.65, margin: 0, flex: 1,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                            {preview}
                        </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #eef1f6' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: tagColor, letterSpacing: '0.03em' }}>View Details</span>
                        <ArrowRightIcon color={tagColor} />
                    </div>
                </div>
            </div>
        </Reveal>
    );
};

const EventsPublic = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [tab, setTab] = useState('upcoming');

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
                const contentRes = await getPublicModuleContentApi(res.data.id, 'events');
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

    if (!isModuleEnabled(school, 'events')) return <NotPublished tc={tc} slug={slug} label="Events & Activities" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Events & Activities" />;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allEvents = (content.events || []).filter(e => e.title);
    const upcoming = allEvents
        .filter(e => { const d = parseDate(e.date); return d && d >= today; })
        .sort((a, b) => parseDate(a.date) - parseDate(b.date));
    const past = allEvents
        .filter(e => { const d = parseDate(e.date); return !d || d < today; })
        .sort((a, b) => parseDate(b.date) - parseDate(a.date));

    const shown = tab === 'upcoming' ? upcoming : past;

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
                .event-card:hover { transform: translateY(-5px); box-shadow: 0 18px 34px rgba(15,23,42,0.12); border-color: transparent; }
                .event-card-img { transition: transform 0.55s cubic-bezier(0.16,1,0.3,1); }
                .event-card:hover .event-card-img { transform: scale(1.06); }
                .tab-btn { transition: background 0.2s ease, color 0.2s ease; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="events" />

                {/* ── Header — same block size/padding as the Announcements header ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.6rem) clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: content.headingFont ? getFontFamily(content.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 46px)', fontWeight: 700, color: content.headingColor || '#ffffff', letterSpacing: '-1px', marginBottom: '10px', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                            {content.heading || 'Events & Activities'}
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Description ── */}
                {content.description && (
                    <div style={{ padding: '3.5rem clamp(1.25rem,6vw,3rem) 0' }}>
                        <Reveal>
                            <div className="rte-content" style={{ maxWidth: '900px', margin: '0 auto', fontSize: '15px', color: '#475569', lineHeight: 1.9, textAlign: 'center' }}
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.description) }} />
                        </Reveal>
                    </div>
                )}

                {/* ── Tabs ── */}
                <div style={{ padding: '1.75rem clamp(1.25rem,6vw,3rem) 0', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'inline-flex', background: bc.card, border: '1px solid #e5e9f0', borderRadius: '11px', padding: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        {[
                            { key: 'upcoming', label: 'Upcoming', count: upcoming.length, Icon: UpcomingTabIcon },
                            { key: 'past', label: 'Past', count: past.length, Icon: PastTabIcon },
                        ].map(t => {
                            const active = tab === t.key;
                            return (
                                <button key={t.key} onClick={() => setTab(t.key)} className="tab-btn"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '7px',
                                        padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                        fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em',
                                        background: active ? `linear-gradient(135deg,${tc.primary},${tc.secondary})` : 'transparent',
                                        color: active ? '#ffffff' : '#64748b',
                                        boxShadow: active ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                                    }}>
                                    <t.Icon color={active ? '#ffffff' : '#94a3b8'} />
                                    {t.label}
                                    <span style={{
                                        fontSize: '10.5px', fontWeight: 700, padding: '1px 6px', borderRadius: '999px',
                                        background: active ? 'rgba(255,255,255,0.22)' : '#eef1f6', color: active ? '#ffffff' : '#94a3b8',
                                    }}>{t.count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Event grid ── */}
                <div style={{ padding: '1.75rem clamp(1.25rem,6vw,3rem) 4rem' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        {shown.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '3.5rem 0' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `${tc.primary}0f`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CalendarIcon color={tc.primary} size={24} />
                                </div>
                                <p style={{ textAlign: 'center', fontSize: '13.5px', color: '#94a3b8' }}>
                                    {tab === 'upcoming' ? 'No upcoming events right now. Please check back soon.' : 'No past events to show yet.'}
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.5rem' }}>
                                {shown.map((e, i) => (
                                    <EventCard key={e.id} event={e} tc={tc} bc={bc} index={i}
                                        onOpen={() => navigate(`/school/${slug}/events/${e.id}`)} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default EventsPublic;
