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
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.08 });
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

// Fixed palette matching the reference site closely, independent of school theme —
// the salmon-pink header + indigo heading look is specifically what was asked for.
const PD_HEADER = '#dd8c8c';
const PD_STRIPE = '#fdf1f1';
const PD_HEADING = '#1e1b4b';

const IconPdf = ({ size = 16, color = '#ffffff' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
    </svg>
);

// ── A single category — letter + name heading, then a styled table ──
const CategoryTable = ({ category, letter }) => {
    const rows = category.type === 'info'
        ? (category.rows || []).filter(r => r.label)
        : (category.rows || []).filter(r => r.label && (r.pdfUrl || r.linkUrl || r.description));

    if (rows.length === 0) return null;

    return (
        <Reveal style={{ marginBottom: '3.5rem' }}>
            <h2 style={{
                fontSize: 'clamp(22px,2.6vw,28px)', fontWeight: 800, color: PD_HEADING,
                letterSpacing: '-0.3px', marginBottom: '1.25rem'
            }}>
                {letter}. {(category.name || 'Untitled').toUpperCase()}
            </h2>

            <div style={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                {/* Header row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: category.type === 'info' ? '70px 1.6fr 1.6fr' : '70px 2fr 1.4fr',
                    background: PD_HEADER
                }}>
                    <span style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>S.No.</span>
                    <span style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        {category.type === 'info' ? 'Information' : 'Documents/ Information'}
                    </span>
                    <span style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        {category.type === 'info' ? 'Details' : 'Uploaded Documents'}
                    </span>
                </div>

                {/* Rows */}
                {rows.map((row, i) => (
                    <div key={row.id} style={{
                        display: 'grid',
                        gridTemplateColumns: category.type === 'info' ? '70px 1.6fr 1.6fr' : '70px 2fr 1.4fr',
                        background: i % 2 === 0 ? PD_STRIPE : '#ffffff',
                        borderTop: '1px solid #f8eaea'
                    }}>
                        <span style={{ padding: '16px', fontSize: '13.5px', color: '#0f172a', fontWeight: 600 }}>{i + 1}</span>
                        <span style={{ padding: '16px', fontSize: '13.5px', color: '#1e293b', fontWeight: 600, lineHeight: 1.6 }}>{row.label}</span>
                        {category.type === 'info' ? (
                            <span style={{ padding: '16px', fontSize: '13.5px', color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                                {row.details || '—'}
                            </span>
                        ) : (
                            <span style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {row.pdfUrl && (
                                    <a href={row.pdfUrl} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: '12.5px', color: '#2563eb', textDecoration: 'underline', lineHeight: 1.6 }}>
                                        View Document
                                    </a>
                                )}
                                {!row.pdfUrl && row.linkUrl && (
                                    <a href={row.linkUrl} target="_blank" rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content',
                                            padding: '6px 14px', background: PD_HEADER, color: '#ffffff', borderRadius: '20px',
                                            fontSize: '12px', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.02em',
                                        }}>
                                        Click Here
                                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    </a>
                                )}
                                {row.description && (
                                    <span style={{ fontSize: '13px', color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                                        {row.description}
                                    </span>
                                )}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </Reveal>
    );
};

// ── Migrates any previously-saved category shape into the current { rows: [...] } shape,
// so old saved data (with `documents` instead of `rows`) never crashes this page. ──
const normalizeCategories = (categories) => {
    if (!Array.isArray(categories)) return [];
    return categories.map(cat => {
        if (Array.isArray(cat.rows)) return { type: cat.type || 'documents', ...cat };
        if (Array.isArray(cat.documents)) {
            return {
                ...cat,
                type: cat.type || 'documents',
                rows: cat.documents.map(d => ({ id: d.id, label: d.title || d.label || '', pdfUrl: d.pdfUrl || '', linkUrl: d.linkUrl || '', description: d.description || '' })),
            };
        }
        return { ...cat, type: cat.type || 'documents', rows: [] };
    });
};

const PublicDisclosurePublic = () => {
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
                const contentRes = await getPublicModuleContentApi(res.data.id, 'disclosure');
                if (contentRes.data?.categories?.length > 0) {
                    setContent({ ...contentRes.data, categories: normalizeCategories(contentRes.data.categories) });
                }
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

    if (!content) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ fontSize: '18px', color: '#64748b' }}>Public Disclosure page not published yet</p>
            <button onClick={() => navigate(`/school/${slug}`)}
                style={{ padding: '12px 28px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                ← Back to Home
            </button>
        </div>
    );

    const categories = content.categories || [];

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes pulseBtn { 0%,100% { box-shadow: 0 8px 24px rgba(220,38,38,0.35); } 50% { box-shadow: 0 12px 32px rgba(220,38,38,0.5); } }
                body { background: #ffffff; }
                .pd-cta-btn { transition: transform 0.2s ease; animation: pulseBtn 2.5s ease-in-out infinite; }
                .pd-cta-btn:hover { transform: translateY(-3px); }
                .rte-content p { margin-bottom: 0.8em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content ul, .rte-content ol { padding-left: 1.5em; margin-bottom: 0.8em; }
                .rte-content .ql-size-small { font-size: 0.75em; }
                .rte-content .ql-size-large { font-size: 1.5em; }
                .rte-content .ql-size-huge { font-size: 2.5em; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="disclosure" />

                {/* ── Banner ── */}
                <div style={{ height: '55vh', position: 'relative', overflow: 'hidden' }}>
                    {content.banner ? (
                        <img src={content.banner} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${tc.dark},${tc.primary})` }}></div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)' }}></div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 2rem' }}>
                        <div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '16px' }}>{school.name}</p>
                            <h1 style={{ fontSize: 'clamp(36px,5.5vw,68px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1, color: '#ffffff', textShadow: '0 4px 30px rgba(0,0,0,0.4)', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                                {content.heading || 'Public Disclosure'}
                            </h1>
                        </div>
                    </div>
                </div>

                {/* ── Description ── */}
                {content.description && (
                    <div style={{ padding: '3.5rem 3rem 0' }}>
                        <Reveal>
                            <div className="rte-content" style={{ maxWidth: '820px', margin: '0 auto', fontSize: '15px', color: '#475569', lineHeight: 1.9, textAlign: 'center' }}
                                dangerouslySetInnerHTML={{ __html: content.description }} />
                        </Reveal>
                    </div>
                )}

                {/* ── Category Tables ── */}
                <div style={{ padding: '3.5rem 3rem 2rem' }}>
                    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
                        {categories.map((cat, i) => (
                            <CategoryTable key={cat.id} category={cat} letter={String.fromCharCode(65 + i)} />
                        ))}
                    </div>
                </div>

                {/* ── Standalone Mandatory Disclosure PDF button ── */}
                {content.disclosurePdf?.pdfUrl && (
                    <div style={{ padding: '2rem 3rem 6rem', textAlign: 'center' }}>
                        <Reveal>
                            <h2 style={{ fontSize: 'clamp(20px,2.4vw,26px)', fontWeight: 800, color: PD_HEADING, marginBottom: '1.5rem' }}>
                                {String.fromCharCode(65 + categories.length)}. {(content.disclosurePdf.label || 'Mandatory Public Disclosure').toUpperCase()}
                            </h2>
                            <a href={content.disclosurePdf.pdfUrl} target="_blank" rel="noopener noreferrer" className="pd-cta-btn"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                                    padding: '14px 32px', background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                                    color: '#ffffff', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                                    textDecoration: 'none', letterSpacing: '0.03em'
                                }}>
                                <IconPdf size={17} />
                                Click Here
                            </a>
                        </Reveal>
                    </div>
                )}

                {/* ── Footer CTA ── */}
                <div style={{ padding: '5rem', background: tc.light, textAlign: 'center' }}>
                    <Reveal>
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

export default PublicDisclosurePublic;