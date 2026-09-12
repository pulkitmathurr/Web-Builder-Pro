import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { EVENT_TAG_COLORS } from "./EventsPublic";
import { parseDate, formatDate, formatTime, readingTime } from "../../utils/dateTimeFormat";
import { normalizeImages, getImageUrl, getImageOrientation } from "../../utils/imageOrientation";
import { RTE_LIST_CSS } from "../../constants/rteContentStyles";
import { sanitizeHtml } from "../../utils/sanitizeHtml";
import { getYoutubeEmbedUrl } from "../../utils/youtube";

const ChevronLeftIcon = ({ color, size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
    </svg>
);

const ChevronRightIcon = ({ color, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
    </svg>
);

const ChevronDownIcon = ({ color, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
    </svg>
);

const CloseIcon = ({ color = '#fff', size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

const PlayIcon = ({ color = '#fff', size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M8 5v14l11-7z" />
    </svg>
);

const ExternalLinkIcon = ({ color = '#fff', size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <path d="M15 3h6v6M10 14L21 3" />
    </svg>
);

const CalendarGlyph = ({ color, size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2.5" />
        <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
);

const ClockGlyph = ({ color, size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.2 2" />
    </svg>
);

const PinGlyph = ({ color, size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 6.5-9 12.5-9 12.5S3 16.5 3 10a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const BookGlyph = ({ color, size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
);

// ── A video card — image on top with a centered play/link button, title below in its own
// text area (not overlaid on the photo). Uploaded videos and YouTube links both open the
// shared player modal inline; any other link video opens in a new tab. Uses a real
// thumbnail when the admin has uploaded one. ──
const VideoTile = ({ video, tagColor, onPlay }) => {
    const isUpload = video.sourceType === 'upload' && video.videoUrl;
    const isLink = video.sourceType === 'link' && video.linkUrl;
    if (!isUpload && !isLink) return null;
    const youtubeEmbed = isLink ? getYoutubeEmbedUrl(video.linkUrl) : null;
    const playsInline = isUpload || !!youtubeEmbed;
    const hasThumb = !!video.thumbnail;

    const media = (
        <div className="video-card-media" style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#0f172a' }}>
            {hasThumb ? (
                <img src={video.thumbnail} alt="" className="video-card-img" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${tagColor}35, ${tagColor}65)` }}></div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.12)' }}></div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="video-card-play" style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(15,23,42,0.35)' }}>
                    {playsInline ? <PlayIcon color={tagColor} size={16} /> : <ExternalLinkIcon color={tagColor} size={15} />}
                </div>
            </div>
        </div>
    );

    const cardStyle = { display: 'block', background: '#ffffff', borderRadius: '6px', overflow: 'hidden', border: '1px solid #dde3ea', boxShadow: '0 3px 14px rgba(15,23,42,0.08)', cursor: 'pointer', textDecoration: 'none' };

    const footer = (
        <div className="video-card-footer" style={{ padding: '13px 16px 15px', background: '#eef2f7', borderTop: '1px solid #dde3ea' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ marginTop: '2px', flexShrink: 0 }}>
                    {playsInline ? <PlayIcon color={tagColor} size={11} /> : <ExternalLinkIcon color={tagColor} size={11} />}
                </span>
                <span className="video-card-title" style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {video.title || (playsInline ? 'Watch Video' : 'View Video')}
                </span>
            </div>
        </div>
    );

    return playsInline ? (
        <div className="video-card" style={cardStyle} onClick={() => onPlay(video)}>{media}{footer}</div>
    ) : (
        <a className="video-card" href={video.linkUrl} target="_blank" rel="noreferrer" style={cardStyle}>{media}{footer}</a>
    );
};

// ── A fixed 3-column video grid — event videos and highlight videos both use this. ──
const VideoGrid = ({ videos, tagColor, onPlay }) => {
    if (!videos.length) return null;
    return (
        <div className="video-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {videos.map(v => (
                <VideoTile key={v.id} video={v} tagColor={tagColor} onPlay={onPlay} />
            ))}
        </div>
    );
};

// ── A single mosaic tile's photo. Horizontal photos fill the tile edge-to-edge
// (object-fit: cover) exactly as before. Vertical photos are never force-cropped into a
// landscape box — they sit uncropped (object-fit: contain) over a softly blurred fill of
// the same photo, so there's no empty letterbox bars, just a professional framed look. ──
const MosaicPhoto = ({ src, orientation }) => (
    orientation === 'vertical' ? (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0f172a' }}>
            <img src={src} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(22px) brightness(0.65)', transform: 'scale(1.15)' }} />
            <img src={src} alt="" style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        </div>
    ) : (
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    )
);

// ── Image mosaic — highlight images (up to 5): one large photo on the left (with
// forward/backward navigation) and up to two stacked smaller photos on the right that
// rotate along with it. If more images exist than fit, the last visible tile gets a
// "+N View More" overlay; clicking any tile opens the full lightbox. Each photo carries its
// own horizontal/vertical orientation (set by the admin) — see MosaicPhoto. ──
const ImageMosaic = ({ images, onOpen }) => {
    const [mainIdx, setMainIdx] = useState(0);
    if (!images.length) return null;
    const n = images.length;

    const prevMain = (e) => { e.stopPropagation(); setMainIdx(p => (p === 0 ? n - 1 : p - 1)); };
    const nextMain = (e) => { e.stopPropagation(); setMainIdx(p => (p + 1) % n); };

    const frameStyle = { background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 12px 30px rgba(15,23,42,0.12)' };

    if (n === 1) {
        const isVertical = getImageOrientation(images[0]) === 'vertical';
        return (
            <div style={{ maxWidth: isVertical ? '460px' : '880px', margin: '0 auto' }}>
                <div style={{ ...frameStyle, padding: '6px', borderRadius: '18px' }}>
                    <div className="mosaic-tile" style={{ height: isVertical ? undefined : '408px', aspectRatio: isVertical ? '3 / 4' : undefined, borderRadius: '13px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => onOpen(0)}>
                        <MosaicPhoto src={getImageUrl(images[0])} orientation={getImageOrientation(images[0])} />
                    </div>
                </div>
            </div>
        );
    }

    const smallIdxs = [];
    for (let i = 1; i <= 2 && i < n; i++) smallIdxs.push((mainIdx + i) % n);
    const hiddenCount = Math.max(0, n - 1 - smallIdxs.length);

    return (
        <div style={{ maxWidth: '880px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '12px', height: '408px' }}>
                <div style={{ ...frameStyle, flex: '0 0 63%', minHeight: 0, padding: '6px', borderRadius: '18px' }}>
                    <div className="mosaic-tile" style={{ position: 'relative', height: '100%', borderRadius: '13px', overflow: 'hidden', cursor: 'pointer' }}
                        onClick={() => onOpen(mainIdx)}>
                        <MosaicPhoto src={getImageUrl(images[mainIdx])} orientation={getImageOrientation(images[mainIdx])} />
                        <button onClick={prevMain}
                            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronLeftIcon color="#fff" size={16} />
                        </button>
                        <button onClick={nextMain}
                            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronRightIcon color="#fff" />
                        </button>
                        <span style={{ position: 'absolute', bottom: '14px', right: '16px', fontSize: '11px', fontWeight: 700, color: '#fff', background: 'rgba(15,23,42,0.55)', padding: '4px 10px', borderRadius: '999px' }}>
                            {mainIdx + 1} / {n}
                        </span>
                    </div>
                </div>
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {smallIdxs.map((imgIdx, i) => {
                        const isLast = i === smallIdxs.length - 1;
                        const showOverlay = isLast && hiddenCount > 0;
                        return (
                            <div key={imgIdx} style={{ ...frameStyle, flex: 1, minHeight: 0, padding: '6px', borderRadius: '14px' }}>
                                <div className="mosaic-tile" style={{ position: 'relative', height: '100%', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer' }}
                                    onClick={() => onOpen(imgIdx)}>
                                    <MosaicPhoto src={getImageUrl(images[imgIdx])} orientation={getImageOrientation(images[imgIdx])} />
                                    {showOverlay && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.62)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                            <span style={{ color: '#fff', fontWeight: 800, fontSize: '19px', lineHeight: 1 }}>+{hiddenCount}</span>
                                            <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.03em' }}>View More</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const EventDetailPublic = () => {
    const { slug, id } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [collapsed, setCollapsed] = useState({}); // highlights are open by default; this tracks ones the visitor closed
    const [lightbox, setLightbox] = useState(null);
    const [videoModal, setVideoModal] = useState(null);

    useEffect(() => {
        fetchData();
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [slug, id]);

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

    const event = (content.events || []).find(e => String(e.id) === String(id));

    if (!event) {
        return (
            <>
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="events" />
                <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '4rem 2rem' }}>
                    <p style={{ fontSize: '15px', color: '#94a3b8' }}>This event could not be found.</p>
                    <Link to={`/school/${slug}/events`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 600, color: tc.primary, textDecoration: 'none' }}>
                        <ChevronLeftIcon color={tc.primary} /> Back to Events
                    </Link>
                </div>
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </>
        );
    }

    const { day, month, year } = formatDate(event.date);
    const time = formatTime(event.time);
    const tagColor = EVENT_TAG_COLORS[event.tag] || tc.primary;
    const mins = readingTime(event.body);
    const eventDate = parseDate(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isUpcoming = eventDate && eventDate >= today;
    const statusColor = isUpcoming ? '#059669' : '#94a3b8';

    const eventVideos = (event.videos || []).filter(v => (v.sourceType === 'upload' && v.videoUrl) || (v.sourceType === 'link' && v.linkUrl));
    const highlights = (event.highlights || []).filter(h => h.heading || h.description || h.images?.length || h.videos?.length);

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                body { background: ${bc.surface}; }
                .rte-content p { margin-bottom: 0.95em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; color: #0f172a; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content ul, .rte-content ol { padding-left: 1.4em; margin-bottom: 0.9em; }
                .rte-content li { margin-bottom: 0.35em; }
                .rte-content .ql-size-small { font-size: 0.8em; }
                .rte-content .ql-size-large { font-size: 1.35em; }
                .rte-content .ql-size-huge { font-size: 2em; }
                .rte-content .ql-font-inter { font-family: 'Inter', system-ui, sans-serif; }
                .rte-content .ql-font-poppins { font-family: 'Poppins', sans-serif; }
                .rte-content .ql-font-montserrat { font-family: 'Montserrat', sans-serif; }
                .rte-content .ql-font-playfair { font-family: 'Playfair Display', Georgia, serif; }
                .rte-content .ql-font-raleway { font-family: 'Raleway', sans-serif; }
                .rte-content .ql-font-merriweather { font-family: 'Merriweather', Georgia, serif; }
                ${RTE_LIST_CSS}
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
                .video-card { transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
                .video-card:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(15,23,42,0.14); border-color: transparent; }
                .video-card-img { transition: transform 0.5s ease; }
                .video-card:hover .video-card-img { transform: scale(1.06); }
                .video-card-play { transition: transform 0.25s ease; }
                .video-card:hover .video-card-play { transform: scale(1.1); }
                .mosaic-tile img { transition: transform 0.4s ease; }
                .mosaic-tile:hover img { transform: scale(1.05); }
                .highlight-row-btn { transition: opacity 0.2s ease; }
                .highlight-row-btn:hover { opacity: 0.7; }
                @media (max-width: 640px) {
                    .lightbox-nav-btn { left: 4px !important; right: 4px !important; width: 36px !important; height: 36px !important; }
                }
                @media (max-width: 720px) {
                    /* Always keep all 3 videos in one row, just tighter and smaller on narrow screens */
                    .video-grid { gap: 10px !important; }
                    .video-card-play { width: 34px !important; height: 34px !important; }
                    .video-card-play svg { width: 14px !important; height: 14px !important; }
                    .video-card-title { font-size: 11.5px !important; }
                }
                @media (max-width: 480px) {
                    .video-grid { gap: 6px !important; }
                    .video-card-play { width: 26px !important; height: 26px !important; }
                    .video-card-footer { padding: 8px !important; }
                    .video-card-title { font-size: 10px !important; -webkit-line-clamp: 1 !important; }
                }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar — always solid on this page since there's no dark hero for a transparent navbar to sit on ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="events" forceSolid />

                {/* ── Article — no boxed card, content flows directly on the page background ── */}
                <div style={{ padding: 'calc(92px + 1.1rem) clamp(1.25rem,6vw,3rem) 2rem' }}>
                    <div style={{ maxWidth: '960px', margin: '0 auto' }}>

                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: statusColor, marginBottom: '12px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }}></span>
                                {isUpcoming ? 'Upcoming' : 'Past Event'}
                            </div>

                            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px,3.8vw,40px)', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1.22, marginBottom: '0.85rem' }}>
                                {event.title}
                            </h1>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#64748b', fontWeight: 500, marginBottom: '1.5rem', flexWrap: 'wrap', paddingBottom: '1.25rem', borderBottom: '1px solid #eef1f6' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <CalendarGlyph color="#94a3b8" /> {month} {day}, {year}
                                </span>
                                {time && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <ClockGlyph color="#94a3b8" /> {time}
                                    </span>
                                )}
                                {event.venue && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <PinGlyph color="#94a3b8" /> {event.venue}
                                    </span>
                                )}
                                {mins && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <BookGlyph color="#94a3b8" /> {mins} min read
                                    </span>
                                )}
                            </div>

                            {event.body && (
                                <div className="rte-content" style={{ fontSize: '16px', color: '#334155', lineHeight: 1.95 }}
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.body) }} />
                            )}
                        </div>

                        {/* ── Event videos — fixed 3-column grid ── */}
                        {eventVideos.length > 0 && (
                            <div style={{ marginTop: '2rem' }}>
                                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '12px' }}>Videos</p>
                                <VideoGrid videos={eventVideos} tagColor={tagColor} onPlay={setVideoModal} />
                            </div>
                        )}
                    </div>

                    {/* ── Highlights — nested sub-cards, expand in place, no boxed backgrounds ── */}
                    {highlights.length > 0 && (
                        <div style={{ maxWidth: '960px', margin: '2.5rem auto 0' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: tc.primary, marginBottom: '6px' }}>
                                Highlights
                            </p>
                            <div style={{ width: '36px', height: '2px', background: tc.secondary, margin: '0 0 1.25rem', borderRadius: '2px' }}></div>
                            <div>
                                {highlights.map((h, hi) => {
                                    const isOpen = !collapsed[h.id];
                                    const images = normalizeImages(h.images || []);
                                    const videos = (h.videos || []).filter(v => (v.sourceType === 'upload' && v.videoUrl) || (v.sourceType === 'link' && v.linkUrl));
                                    return (
                                        <div key={h.id} style={{ borderTop: hi === 0 ? 'none' : '1px solid #eef1f6' }}>
                                            <button onClick={() => setCollapsed(prev => ({ ...prev, [h.id]: !prev[h.id] }))} className="highlight-row-btn"
                                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 4px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                                                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '19px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>
                                                    {h.heading || 'Untitled'}
                                                </span>
                                                <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease', flexShrink: 0, marginLeft: '12px' }}>
                                                    <ChevronDownIcon color={tc.primary} />
                                                </span>
                                            </button>
                                            {isOpen && (
                                                <div style={{ padding: '0 4px 2rem' }}>
                                                    {h.description && (
                                                        <div className="rte-content" style={{ fontSize: '15px', color: '#475569', lineHeight: 1.85, marginBottom: (images.length || videos.length) ? '1.25rem' : 0 }}
                                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(h.description) }} />
                                                    )}
                                                    {images.length > 0 && (
                                                        <div style={{ marginBottom: videos.length ? '3rem' : 0 }}>
                                                            <ImageMosaic images={images}
                                                                onOpen={(i) => setLightbox({ images, index: i })} />
                                                        </div>
                                                    )}
                                                    {videos.length > 0 && (
                                                        <div>
                                                            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '12px' }}>Videos</p>
                                                            <VideoGrid videos={videos} tagColor={tagColor} onPlay={setVideoModal} />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Image lightbox (highlight images) ── */}
                {lightbox && (
                    <div onClick={() => setLightbox(null)}
                        style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', animation: 'fadeIn 0.2s ease' }}>
                        <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '85%', maxHeight: '80%' }}>
                            <img src={getImageUrl(lightbox.images[lightbox.index])} alt="" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }} />
                            {lightbox.images.length > 1 && (
                                <>
                                    <button onClick={() => setLightbox(p => ({ ...p, index: p.index === 0 ? p.images.length - 1 : p.index - 1 }))}
                                        className="lightbox-nav-btn"
                                        style={{ position: 'absolute', left: '-64px', top: '50%', transform: 'translateY(-50%)', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ChevronLeftIcon color="#fff" size={16} />
                                    </button>
                                    <button onClick={() => setLightbox(p => ({ ...p, index: (p.index + 1) % p.images.length }))}
                                        className="lightbox-nav-btn"
                                        style={{ position: 'absolute', right: '-64px', top: '50%', transform: 'translateY(-50%)', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ChevronRightIcon color="#fff" />
                                    </button>
                                </>
                            )}
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '1.5rem' }}>{lightbox.index + 1} / {lightbox.images.length}</p>
                        <button onClick={() => setLightbox(null)}
                            style={{ position: 'absolute', top: '2rem', right: '2rem', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CloseIcon />
                        </button>
                    </div>
                )}

                {/* ── Video player modal — uploaded MP4 plays via <video>, YouTube links play
                     via an embedded iframe right here instead of opening a new tab. ── */}
                {videoModal && (
                    <div onClick={() => setVideoModal(null)}
                        style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', animation: 'fadeIn 0.2s ease' }}>
                        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '900px' }}>
                            {videoModal.sourceType === 'link' ? (
                                <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
                                    <iframe src={`${getYoutubeEmbedUrl(videoModal.linkUrl)}?autoplay=1`} title={videoModal.title || 'Video'}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                                        style={{ width: '100%', height: '100%', border: 'none' }} />
                                </div>
                            ) : (
                                <video src={videoModal.videoUrl} poster={videoModal.thumbnail || undefined} controls autoPlay style={{ width: '100%', maxHeight: '75vh', borderRadius: '12px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', display: 'block' }} />
                            )}
                            {videoModal.title && <p style={{ color: '#fff', fontSize: '14px', marginTop: '1rem', textAlign: 'center' }}>{videoModal.title}</p>}
                        </div>
                        <button onClick={() => setVideoModal(null)}
                            style={{ position: 'absolute', top: '2rem', right: '2rem', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CloseIcon />
                        </button>
                    </div>
                )}

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default EventDetailPublic;
