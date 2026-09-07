import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";
import { RTE_CONTENT_CSS } from "../../constants/rteContentStyles";

const CLASS_ORDER = [
    'Nursery', 'LKG', 'UKG',
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12'
];

const PERIODS = [
    { key: 'quarterly', label: 'Quarterly' },
    { key: 'halfYearly', label: 'Half-Yearly' },
    { key: 'annual', label: 'Full Year' },
];

// `amounts` is the new per-period shape; falls back to the legacy flat `amount`
// field (pre-periods content) when viewing the Full Year period.
const getAmount = (fee, period) => {
    if (!fee) return '';
    const val = fee.amounts?.[period];
    if (val) return val;
    if (period === 'annual' && fee.amount) return fee.amount;
    return '';
};

const useScrollReveal = () => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, visible];
};

const Reveal = ({ children, delay = 0, style = {} }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
            ...style
        }}>
            {children}
        </div>
    );
};

// ── One small optional/transport fee table card ──
const FeeTableCard = ({ table, tc, bc }) => {
    const hasItemRows = table.rows.some(r => r.type === 'item');
    return (
        <div style={{ background: bc.card, border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '12px 20px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})` }}>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{table.title}</h4>
            </div>
            <div>
                {hasItemRows && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', background: bc.cardAlt, borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ padding: '8px 20px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', borderRight: '1px solid #e2e8f0' }}>{table.itemLabel || 'Item'}</span>
                        <span style={{ padding: '8px 20px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>{table.amountLabel || 'Amount'}</span>
                    </div>
                )}
                {table.rows.map(row => {
                    if (row.type === 'subheading') {
                        return (
                            <p key={row.id} style={{ fontSize: '12px', fontWeight: 600, color: `${tc.primary}b0`, margin: 0, padding: '8px 20px', textTransform: 'uppercase', letterSpacing: '0.05em', background: tc.light, borderBottom: '1px solid #e2e8f0' }}>
                                {row.text}
                            </p>
                        );
                    }
                    if (row.type === 'note') {
                        return (
                            <p key={row.id} style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.6, margin: 0, padding: '8px 20px', fontStyle: 'italic', borderBottom: '1px solid #f1f5f9' }}>
                                {row.text}
                            </p>
                        );
                    }
                    const trimmed = row.value != null ? String(row.value).trim() : '';
                    const numValue = parseFloat(trimmed.replace(/,/g, ''));
                    const isNumeric = trimmed !== '' && !isNaN(numValue) && /^[\d,.\s]+$/.test(trimmed);
                    const displayValue = isNumeric ? `₹${numValue.toLocaleString('en-IN')}` : row.value;
                    return (
                        <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ padding: '8px 20px', fontSize: '16px', fontWeight: 700, color: '#0f172a', borderRight: '1px solid #f1f5f9' }}>{row.label}</span>
                            <span style={{ padding: '8px 20px', fontSize: '14px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textAlign: 'right' }}>{displayValue}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const FeeStructurePublic = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [selectedPeriod, setSelectedPeriod] = useState('annual');

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
                const contentRes = await getPublicModuleContentApi(res.data.id, 'fee');
                const d = contentRes.data;
                // The public content endpoint only returns a row when it's published,
                // so `d` being non-null already means "published" — show the page even
                // if no fee tables have been added yet (empty sections just don't render).
                if (d) setContent(d);
            }
        } catch (e) {
            navigate('/school-not-found');
        } finally {
            setLoading(false);
        }
    };

    const getTotal = (fees, period = selectedPeriod) => fees.reduce((sum, f) => {
        const n = parseFloat(getAmount(f, period)?.toString().replace(/,/g, '') || 0);
        return sum + (isNaN(n) ? 0 : n);
    }, 0);

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid #f0c4c4', borderTop: '3px solid #8b2252', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!school) return null;

    const tc = getThemeColors(school.theme);
    const bc = getBaseColors(school.base_theme);

    if (!isModuleEnabled(school, 'fee')) return <NotPublished tc={tc} slug={slug} label="Fee Structure" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Fee Structure" />;

    const classes = content.classes || [];
    const sortedClasses = [...classes].sort((a, b) => CLASS_ORDER.indexOf(a.name) - CLASS_ORDER.indexOf(b.name));
    const allFeeTypes = [];
    classes.forEach(cls => cls.fees.forEach(f => {
        if (getAmount(f, selectedPeriod) && !allFeeTypes.includes(f.type)) allFeeTypes.push(f.type);
    }));

    const optionalFeeTables = content.optionalFeeTables || [];
    const transportTables = content.transportTables || [];

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                body { background: ${bc.surface}; }
                .fee-row { transition: background 0.15s; }
                .fee-row:hover { background: ${tc.light} !important; }
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
                @media (max-width: 640px) {
                    .fee-2col-grid { grid-template-columns: 1fr !important; }
                }
                ${RTE_CONTENT_CSS}
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="fee" />

                {/* Content wrapper — one full viewport min-height so that when the page is
                    published with no fee tables yet, the Footer is pushed below the fold
                    instead of sitting right under the header. */}
                <div style={{ minHeight: '100vh' }}>

                {/* ── Header — no banner photo, clean gradient header (same design as About Us) ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.6rem) clamp(1.25rem,6vw,3rem) 0.6rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-1px', marginBottom: '10px' }}>
                            Fee Structure
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Instructions — optional admin-authored note shown above the fee tables ── */}
                {content.description && (
                    <div style={{ padding: '2rem clamp(1.25rem,6vw,5rem) 0', background: bc.surface }}>
                        <Reveal>
                            <div className="rte-content" style={{ maxWidth: '1300px', margin: '0 auto', fontSize: '14.5px', color: '#475569', lineHeight: 1.8 }}
                                dangerouslySetInnerHTML={{ __html: content.description }} />
                        </Reveal>
                    </div>
                )}

                {/* ── Combined Academic Fee Table — all classes side by side ── */}
                {sortedClasses.length > 0 && (
                    <div style={{ padding: '2rem clamp(1.25rem,6vw,5rem) 2.5rem', background: bc.surface }}>
                        <Reveal>
                            <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.25rem' }}>
                                    <div>
                                        <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>Academic Fee Structure</p>
                                        <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px' }}>Class-wise Fee Breakdown</h2>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>View By</label>
                                        <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}
                                            style={{ padding: '11px 18px', borderRadius: '8px', border: `1.5px solid ${tc.primary}`, fontSize: '13.5px', fontWeight: 700, color: tc.primary, background: bc.card, cursor: 'pointer', outline: 'none' }}>
                                            {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {allFeeTypes.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', background: bc.surfaceAlt, borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <p style={{ fontSize: '14px', color: '#94a3b8' }}>{PERIODS.find(p => p.key === selectedPeriod)?.label} fee details not added yet — please contact the school office.</p>
                                    </div>
                                ) : (
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'auto', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', maxWidth: '100%' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${560 + allFeeTypes.length * 160}px` }}>
                                        <thead>
                                            <tr style={{ background: `linear-gradient(135deg,${tc.primary},${tc.secondary})` }}>
                                                <th style={{ position: 'sticky', left: 0, zIndex: 2, background: tc.primary, padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.15)' }}>Class</th>
                                                {allFeeTypes.map(t => (
                                                    <th key={t} style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.15)' }}>{t}</th>
                                                ))}
                                                <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedClasses.map((cls, i) => (
                                                <tr key={cls.name} className="fee-row" style={{ background: i % 2 === 0 ? bc.card : bc.cardAlt }}>
                                                    <td style={{ position: 'sticky', left: 0, zIndex: 1, background: i % 2 === 0 ? bc.card : bc.cardAlt, padding: '10px 20px', fontSize: '14px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{cls.name}</td>
                                                    {allFeeTypes.map(t => {
                                                        const fee = cls.fees.find(f => f.type === t);
                                                        const amt = getAmount(fee, selectedPeriod);
                                                        return (
                                                            <td key={t} style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13.5px', color: amt ? '#334155' : '#cbd5e1', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                                                {amt ? `₹${parseFloat(amt).toLocaleString('en-IN')}` : '—'}
                                                            </td>
                                                        );
                                                    })}
                                                    <td style={{ padding: '10px 20px', textAlign: 'right', fontSize: '14.5px', fontWeight: 800, color: tc.primary, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                                        ₹{getTotal(cls.fees).toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                )}

                                {/* Note */}
                                <div style={{ marginTop: '1rem', padding: '14px 20px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <svg width="18" height="18" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '1px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.6 }}>
                                        All amounts are indicative and subject to change. Please contact the school office for the latest fee schedule and payment details.
                                    </p>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                )}

                {/* ── Other Optional Subjects ── */}
                {optionalFeeTables.length > 0 && (
                    <div style={{ padding: '1.25rem clamp(1.25rem,6vw,5rem) 2.5rem', background: bc.surface }}>
                        <Reveal>
                            <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>Optional Add-ons</p>
                                    <h2 style={{ fontFamily: content.optionalSubjectsHeadingFont ? getFontFamily(content.optionalSubjectsHeadingFont) : undefined, fontStyle: content.optionalSubjectsHeadingItalic ? 'italic' : 'normal', fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 900, color: content.optionalSubjectsHeadingColor || '#0f172a', letterSpacing: '-1px' }}>{content.optionalSubjectsHeading || 'Other optional subjects are also offered'}</h2>
                                </div>
                                <div className="fee-2col-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                                    {optionalFeeTables.map((table, i) => (
                                        <Reveal key={table.id} delay={i * 0.08}>
                                            <FeeTableCard table={table} tc={tc} bc={bc} />
                                        </Reveal>
                                    ))}
                                </div>
                            </div>
                        </Reveal>
                    </div>
                )}

                {/* ── School Transport ── */}
                {transportTables.length > 0 && (
                    <div style={{ padding: '1.25rem clamp(1.25rem,6vw,5rem) 2.5rem', background: bc.surface }}>
                        <Reveal>
                            <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>Getting to School</p>
                                    <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px' }}>School Transport </h2>
                                </div>
                                <div className="fee-2col-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                                    {transportTables.map((table, i) => (
                                        <Reveal key={table.id} delay={i * 0.08}>
                                            <FeeTableCard table={table} tc={tc} bc={bc} />
                                        </Reveal>
                                    ))}
                                </div>
                            </div>
                        </Reveal>
                    </div>
                )}

                </div>{/* /content wrapper */}

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default FeeStructurePublic;
