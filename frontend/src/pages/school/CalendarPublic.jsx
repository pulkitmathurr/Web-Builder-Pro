import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";
import { parseDate, toDateKey, formatDate } from "../../utils/dateTimeFormat";

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

const CATEGORY_COLORS = { Holiday: '#059669', Exam: '#dc2626', PTM: '#2563eb', Event: '#7c3aed', Other: '#64748b' };
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const buildMonthGrid = (year, month) => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
};

const CalendarPublic = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [viewDate, setViewDate] = useState(() => { const d = new Date(); d.setDate(1); return d; });

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
                const contentRes = await getPublicModuleContentApi(res.data.id, 'calendar');
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

    if (!isModuleEnabled(school, 'calendar')) return <NotPublished tc={tc} slug={slug} label="Event Calendar" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Event Calendar" />;

    const items = (content.items || []).filter(i => i.title && i.date);

    const itemsByDate = {};
    items.forEach(item => {
        const d = parseDate(item.date);
        if (!d) return;
        const key = toDateKey(d);
        (itemsByDate[key] = itemsByDate[key] || []).push(item);
    });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const grid = buildMonthGrid(year, month);
    const todayKey = toDateKey(new Date());

    const monthItems = items
        .map(item => ({ item, d: parseDate(item.date) }))
        .filter(({ d }) => d && d.getFullYear() === year && d.getMonth() === month)
        .sort((a, b) => a.d - b.d);

    const goMonth = (delta) => setViewDate(d => { const nd = new Date(d); nd.setMonth(nd.getMonth() + delta); return nd; });

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
                .cal-nav-btn:hover { background: ${tc.primary}14 !important; }
                .cal-day:hover { background: #f8fafc; }
                .cal-list-row:hover { background: #f8fafc; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="calendar" />

                {/* ── Header ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: '4.5rem clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: content.headingFont ? getFontFamily(content.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: content.headingColor || '#ffffff', letterSpacing: '-1px', marginBottom: '10px', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                            {content.heading || 'Event Calendar'}
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

                {/* ── Calendar ── */}
                <div style={{ padding: '3rem clamp(1.25rem,6vw,3rem) 6rem' }}>
                    <div style={{ maxWidth: '1040px', margin: '0 auto' }}>

                        <Reveal>
                            <div style={{ background: bc.card, borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(15,23,42,0.08)', padding: 'clamp(1.25rem,4vw,2rem) clamp(1rem,3vw,2.25rem)' }}>

                                {/* Month navigator */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <button onClick={() => goMonth(-1)} className="cal-nav-btn"
                                        style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e5e9f0', background: 'transparent', cursor: 'pointer', fontSize: '15px', color: '#334155', transition: 'background 0.15s' }}>
                                        ‹
                                    </button>
                                    <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '21px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>{MONTH_NAMES[month]} {year}</h2>
                                    <button onClick={() => goMonth(1)} className="cal-nav-btn"
                                        style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e5e9f0', background: 'transparent', cursor: 'pointer', fontSize: '15px', color: '#334155', transition: 'background 0.15s' }}>
                                        ›
                                    </button>
                                </div>

                                {/* Weekday header */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px' }}>
                                    {WEEKDAYS.map(w => (
                                        <div key={w} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#94a3b8', padding: '4px 0' }}>{w}</div>
                                    ))}
                                </div>

                                {/* Day grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#e5e9f0', border: '1.5px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
                                    {grid.map((day, i) => {
                                        if (!day) return <div key={i} style={{ background: bc.card, minHeight: '92px' }}></div>;
                                        const key = toDateKey(new Date(year, month, day));
                                        const dayItems = itemsByDate[key] || [];
                                        const isToday = key === todayKey;
                                        const visibleItems = dayItems.slice(0, 2);
                                        const extraCount = dayItems.length - visibleItems.length;
                                        return (
                                            <div key={i} className="cal-day"
                                                style={{
                                                    minHeight: '92px', display: 'flex', flexDirection: 'column',
                                                    alignItems: 'stretch', padding: '5px 4px', gap: '2px', overflow: 'hidden',
                                                    boxShadow: isToday ? `inset 0 0 0 1.5px ${tc.primary}` : 'none',
                                                    background: isToday ? `${tc.primary}0a` : bc.card,
                                                }}>
                                                <span style={{ fontSize: '12px', fontWeight: isToday ? 800 : 600, color: isToday ? tc.primary : '#334155', paddingLeft: '2px' }}>{day}</span>
                                                {visibleItems.length > 0 && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                                        {visibleItems.map((it, di) => (
                                                            <span key={di} title={it.title}
                                                                style={{
                                                                    fontSize: '9.5px', fontWeight: 600, color: '#ffffff',
                                                                    background: CATEGORY_COLORS[it.category] || tc.primary,
                                                                    borderRadius: '4px', padding: '2px 5px', lineHeight: 1.3,
                                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                                }}>
                                                                {it.title}
                                                            </span>
                                                        ))}
                                                        {extraCount > 0 && (
                                                            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, paddingLeft: '3px' }}>+{extraCount} more</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Legend */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #eef1f6' }}>
                                    {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                                        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }}></span>
                                            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>{cat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Reveal>

                        {/* Month event list */}
                        <Reveal delay={0.1}>
                            <div style={{ marginTop: '2.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: tc.primary }}>This Month</span>
                                </div>
                                <div style={{ width: '32px', height: '2px', background: tc.secondary, margin: '0 0 0.9rem', borderRadius: '2px' }}></div>
                                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '19px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px', marginBottom: '1.1rem' }}>
                                    {MONTH_NAMES[month]} {year} <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginLeft: '4px' }}>— {monthItems.length} {monthItems.length === 1 ? 'date' : 'dates'}</span>
                                </h3>
                                {monthItems.length === 0 ? (
                                    <div style={{ background: bc.card, borderRadius: '16px', border: '1px dashed #d8dee7', padding: '2rem', textAlign: 'center' }}>
                                        <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>No dates marked for this month.</p>
                                    </div>
                                ) : (
                                    <div style={{ background: bc.card, borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,0.07)', overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.7rem 1.4rem', background: '#f8fafc', borderBottom: '1px solid #eef1f6' }}>
                                            <span style={{ width: '46px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8' }}>Date</span>
                                            <span style={{ flex: 1, fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8' }}>Event</span>
                                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8' }}>Category</span>
                                        </div>
                                        {monthItems.map(({ item }, i) => {
                                            const { day, month: mon } = formatDate(item.date);
                                            const color = CATEGORY_COLORS[item.category] || tc.primary;
                                            return (
                                                <div key={item.id} className="cal-list-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.4rem', borderBottom: i < monthItems.length - 1 ? '1px solid #eef1f6' : 'none', borderLeft: `3px solid ${color}`, transition: 'background 0.15s ease' }}>
                                                    <div style={{ flexShrink: 0, width: '46px', textAlign: 'center', background: '#f1f5f9', borderRadius: '9px', padding: '5px 0' }}>
                                                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{day}</div>
                                                        <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', marginTop: '2px' }}>{mon}</div>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#0f172a', letterSpacing: '-0.1px' }}>{item.title}</div>
                                                        {item.note && <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '3px' }}>{item.note}</div>}
                                                    </div>
                                                    <span style={{ fontSize: '10px', fontWeight: 700, color, background: `${color}14`, padding: '4px 10px', borderRadius: '999px', letterSpacing: '0.03em', textTransform: 'uppercase', flexShrink: 0 }}>
                                                        {item.category}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </Reveal>
                    </div>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default CalendarPublic;
