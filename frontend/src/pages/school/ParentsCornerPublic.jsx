import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily, getHeadingSizeCss } from "../../constants/fonts";
import { RTE_FONT_CSS, RTE_LIST_CSS } from "../../constants/rteContentStyles";

import { sanitizeHtml } from "../../utils/sanitizeHtml";
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

// ── One Parents Corner section — a photo alternates left/right against heading + rich text
// when a photo is set (Stripe/Linear-editorial rhythm); text-only sections fall back to the
// same ghost-numeral treatment used on the Admission Procedure page for visual consistency. ──
const ParentSection = ({ section, idx, isLast, tc }) => {
    const photoUrl = section.photo || '';
    const reverse = idx % 2 === 1;

    const headingEl = section.heading && (
        <h3 style={{
            fontFamily: section.headingFont ? getFontFamily(section.headingFont) : "'Playfair Display', Georgia, serif",
            fontSize: getHeadingSizeCss(section.headingSize),
            fontWeight: 700,
            color: section.headingColor || tc.dark,
            fontStyle: section.headingItalic ? 'italic' : 'normal',
            marginBottom: '12px',
            letterSpacing: '-0.3px',
        }}>
            {section.heading}
        </h3>
    );

    const descEl = section.description && (
        <div className="rte-content" style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.85 }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.description) }} />
    );

    if (photoUrl) {
        return (
            <Reveal delay={Math.min(idx * 0.08, 0.4)}>
                <div className="pcp-photo-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(1.5rem,4vw,3rem)', alignItems: 'center', padding: idx === 0 ? '0 0 2.75rem' : '2.75rem 0', borderBottom: isLast ? 'none' : '1px solid #eef1f6' }}>
                    <div style={{ order: reverse ? 2 : 1 }}>
                        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 16px 40px rgba(15,23,42,0.14)', aspectRatio: '4/3' }}>
                            <img src={photoUrl} alt={section.heading || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                    </div>
                    <div style={{ order: reverse ? 1 : 2 }}>
                        <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, color: tc.primary, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>
                            {String(idx + 1).padStart(2, '0')}
                        </span>
                        {headingEl}
                        {descEl}
                    </div>
                </div>
            </Reveal>
        );
    }

    return (
        <Reveal delay={Math.min(idx * 0.08, 0.4)}>
            <div style={{ position: 'relative', padding: idx === 0 ? '0 0 2.25rem' : '2.25rem 0', borderBottom: isLast ? 'none' : '1px solid #eef1f6' }}>
                <div style={{
                    position: 'absolute', top: idx === 0 ? '-8px' : '14px', left: 0,
                    fontSize: 'clamp(46px,6.5vw,78px)', fontWeight: 800, lineHeight: 1, userSelect: 'none', zIndex: 0,
                    color: `${tc.primary}14`, WebkitTextStroke: `1.5px ${tc.primary}70`,
                }}>
                    {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ position: 'relative', zIndex: 1, paddingLeft: 'clamp(58px,8.5vw,104px)' }}>
                    {headingEl}
                    {descEl}
                </div>
            </div>
        </Reveal>
    );
};

const ParentsCornerPublic = () => {
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
                const contentRes = await getPublicModuleContentApi(res.data.id, 'parentsCorner');
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

    if (!isModuleEnabled(school, 'parentsCorner')) return <NotPublished tc={tc} slug={slug} label="Parents Corner" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Parents Corner" />;

    const visibleSections = (content.sections || []).filter(s => s.heading || s.description);

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
                .rte-content ul, .rte-content ol { padding-left: 1.4em; margin-bottom: 0.6em; }
                .rte-content .ql-size-small { font-size: 0.85em; }
                .rte-content .ql-size-large { font-size: 1.2em; }
                .rte-content .ql-size-huge { font-size: 1.5em; }
                ${RTE_FONT_CSS}
                ${RTE_LIST_CSS}
                @media (max-width: 760px) {
                    .pcp-photo-row { grid-template-columns: 1fr !important; }
                    .pcp-photo-row > div { order: initial !important; }
                }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="parentsCorner" />

                {/* ── Header — clean gradient header (same family as About Us / Faculty / Admission Procedure) ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.6rem) clamp(1.25rem,6vw,3rem) 0.9rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: content.headingFont ? getFontFamily(content.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: content.headingColor || '#ffffff', letterSpacing: '-1px', marginBottom: '10px', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                            {content.heading || 'Parents Corner'}
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Intro description — a soft accent card instead of a bare paragraph, so the
                     intro reads as a designed element rather than leftover text under the hero. ── */}
                {content.description && (
                    <div style={{ padding: '3rem clamp(1.25rem,6vw,3rem) 0.5rem' }}>
                        <Reveal>
                            <div style={{
                                maxWidth: '980px', margin: '0 auto', position: 'relative', overflow: 'hidden',
                                background: `linear-gradient(135deg, ${tc.light}, #ffffff)`, border: `1px solid ${tc.primary}1f`,
                                borderRadius: '20px', padding: 'clamp(1.75rem,4vw,2.5rem) clamp(1.75rem,4vw,2.75rem)',
                                boxShadow: '0 14px 36px rgba(15,23,42,0.07)',
                            }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '5px', background: `linear-gradient(180deg, ${tc.primary}, ${tc.secondary})` }}></div>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, color: tc.primary, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tc.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21c0-4.4 3.6-8 8-8M12 21c0-4.4-3.6-8-8-8m8 8V3m0 6c1.5-2.5 4-4 8-4-1 4-3 6-8 6" /></svg>
                                    For Parents
                                </span>
                                <div className="rte-content" style={{ fontSize: '15px', color: '#475569', lineHeight: 1.9 }}
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.description) }} />
                            </div>
                        </Reveal>
                    </div>
                )}

                {/* ── Sections — admin-authored, repeatable heading + photo + description blocks ── */}
                {visibleSections.length > 0 && (
                    <div style={{ padding: '3.5rem clamp(1.25rem,6vw,3rem) 6rem', background: bc.surface }}>
                        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
                            {visibleSections.map((section, idx) => (
                                <ParentSection key={section.id || idx} section={section} idx={idx} isLast={idx === visibleSections.length - 1} tc={tc} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default ParentsCornerPublic;
