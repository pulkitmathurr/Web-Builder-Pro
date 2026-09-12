import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";
import { sanitizeHtml } from "../../utils/sanitizeHtml";
import { relativeLabel, shortDate, formatTime, stripHtml } from "../../utils/dateTimeFormat";
import { getImageUrl } from "../../utils/imageOrientation";

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

export const TAG_COLORS = {
    General: '#2563eb',
    Urgent: '#dc2626',
    Event: '#7c3aed',
    Holiday: '#059669',
    'Exam Notice': '#d97706',
};

const AnnouncementRow = ({ announcement, tc, index, onOpen }) => {
    const tagColor = TAG_COLORS[announcement.tag] || tc.primary;
    const preview = stripHtml(announcement.body);
    const rel = relativeLabel(announcement.date);
    const sDate = shortDate(announcement.date);
    const time = formatTime(announcement.time);
    const thumb = getImageUrl((announcement.images && announcement.images[0]) || announcement.image);

    return (
        <Reveal delay={Math.min(index * 0.04, 0.28)}>
            <div
                onClick={onOpen}
                className="announcement-row"
                style={{
                    display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.15rem 1.6rem',
                    cursor: 'pointer', borderBottom: '1px solid #e2e8f0',
                    borderLeft: `3px solid ${tagColor}`,
                    background: announcement.pinned ? `${tc.primary}08` : 'transparent',
                    transition: 'background 0.15s ease',
                }}
            >
                {/* Date / time stamp */}
                <div style={{ flexShrink: 0, width: '68px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>{rel === 'Today' || rel === 'Yesterday' ? rel : (sDate || '—')}</span>
                    {time && <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>{time}</span>}
                </div>

                <div className="announcement-row-divider" style={{ width: '1px', alignSelf: 'stretch', background: '#eef1f6', flexShrink: 0 }}></div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        {announcement.pinned && (
                            <span style={{ fontSize: '11px', color: tc.primary, fontWeight: 700 }}>📌</span>
                        )}
                        <span style={{
                            fontSize: '10px', fontWeight: 700, color: '#ffffff', background: tagColor,
                            padding: '2.5px 9px', borderRadius: '999px', letterSpacing: '0.04em', textTransform: 'uppercase',
                        }}>
                            {announcement.tag || 'General'}
                        </span>
                    </div>
                    <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', marginBottom: '4px', lineHeight: 1.4 }}>
                        {announcement.title}
                    </h3>
                    {preview && (
                        <p style={{
                            fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {preview}
                        </p>
                    )}
                </div>

                {thumb && (
                    <img src={thumb} alt="" className="announcement-thumb" style={{ flexShrink: 0, width: '58px', height: '58px', borderRadius: '8px', objectFit: 'cover', border: `1.5px solid ${tc.primary}40` }} />
                )}

                <div className="announcement-row-arrow" style={{ flexShrink: 0, alignSelf: 'center', color: '#94a3b8', fontSize: '16px', transition: 'transform 0.2s ease, color 0.2s ease' }}>›</div>
            </div>
        </Reveal>
    );
};

const AnnouncementsPublic = () => {
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
                const contentRes = await getPublicModuleContentApi(res.data.id, 'announcements');
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

    if (!isModuleEnabled(school, 'announcements')) return <NotPublished tc={tc} slug={slug} label="Announcements" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Announcements" />;

    const announcements = [...(content.announcements || [])]
        .filter(a => a.title)
        .sort((a, b) => {
            if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
            return new Date(b.date || 0) - new Date(a.date || 0);
        });

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                body { background: ${bc.surface}; }
                .announcement-row:hover { background: #f8fafc !important; }
                .announcement-row:hover .announcement-row-arrow { transform: translateX(3px); color: ${tc.primary} !important; }
                .announcement-row:last-child { border-bottom: none !important; }
                .announcement-thumb { transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease; }
                .announcement-row:hover .announcement-thumb { transform: scale(1.06); border-color: ${tc.primary}; box-shadow: 0 6px 16px ${tc.primary}30; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
                @media (max-width: 640px) {
                    .announcement-row { gap: 0.75rem !important; padding: 0.9rem 1rem !important; }
                    .announcement-row-divider { display: none !important; }
                    .announcement-thumb { width: 44px !important; height: 44px !important; }
                }
                @media (max-width: 480px) {
                    .announcement-thumb { display: none !important; }
                }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="announcements" />

                {/* ── Header — no banner photo, clean gradient header (same design as About Us) ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.6rem) clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: content.headingFont ? getFontFamily(content.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: content.headingColor || '#ffffff', letterSpacing: '-1px', marginBottom: '10px', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                            {content.heading || 'Announcements & News'}
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Description ── */}
                {content.description && (
                    <div style={{ padding: '3.5rem clamp(1.25rem,6vw,3rem) 0' }}>
                        <Reveal>
                            <div className="rte-content" style={{ maxWidth: '820px', margin: '0 auto', fontSize: '15px', color: '#475569', lineHeight: 1.9, textAlign: 'center' }}
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.description) }} />
                        </Reveal>
                    </div>
                )}

                {/* ── Announcement inbox ── */}
                <div style={{ padding: '3.5rem clamp(1.25rem,6vw,3rem) 6rem' }}>
                    <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
                        {announcements.length === 0 ? (
                            <p style={{ textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>No announcements yet. Please check back soon.</p>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: tc.primary }}>Latest Updates</span>
                                </div>
                                <div style={{ width: '32px', height: '2px', background: tc.secondary, margin: '0 0 1.1rem', borderRadius: '2px' }}></div>
                                <div style={{ background: bc.card, borderRadius: '8px', border: '1.5px solid #0f172a', boxShadow: '0 10px 28px rgba(15,23,42,0.08)', overflow: 'hidden' }}>
                                    {announcements.map((a, i) => (
                                        <AnnouncementRow key={a.id} announcement={a} tc={tc} index={i}
                                            onOpen={() => navigate(`/school/${slug}/announcements/${a.id}`)} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default AnnouncementsPublic;
