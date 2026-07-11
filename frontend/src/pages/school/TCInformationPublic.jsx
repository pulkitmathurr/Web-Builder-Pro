// ============================================================================
// TCInformationPublic.jsx — Public TC search + generate page
// Location: frontend/src/pages/school/TCInformationPublic.jsx
// Module key: 'tc'
//
// ⚠️ IMPORT NOTE: The school-by-slug fetch below uses `getPublicSchoolApi`.
// If your project's school.api.js exports a different name (check the top of
// AlumniPublic.jsx / AboutUsPublic.jsx), copy that exact import + fetch call.
// ============================================================================
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';
import { getThemeColors } from '../../constants/publicNav';
import { getPublicSchoolApi } from '../../api/school.api';
import { getPublicModuleContentApi } from '../../api/content.api';
import { printTC, FORMAT_LABELS } from '../../utils/TCTemplates';

const MODULE_KEY = 'tc';

const TCInformationPublic = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    const [scrollY, setScrollY] = useState(0);

    // Flow state
    const [step, setStep] = useState(1); // 1 = session select, 2 = search form
    const [selectedSession, setSelectedSession] = useState(null);
    const [form, setForm] = useState({ tcNo: '', studentName: '' });
    const [result, setResult] = useState(null); // { status: 'found'|'notfound', record? }
    const [generating, setGenerating] = useState(false);
    const [formError, setFormError] = useState('');

    const tc = school ? getThemeColors(school.theme) : null;

    // ------------------------------------------------------------------
    // Scroll listener for Navbar transparency
    // ------------------------------------------------------------------
    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // ------------------------------------------------------------------
    // Load school + module content
    // ------------------------------------------------------------------
    useEffect(() => {
        (async () => {
            try {
                const sRes = await getPublicSchoolApi(slug);
                const sch = sRes?.data?.data || sRes?.data;
                if (!sch) {
                    navigate('/school-not-found');
                    return;
                }
                setSchool(sch);

                const cRes = await getPublicModuleContentApi(sch.id, MODULE_KEY);
                const raw = cRes?.data?.data || cRes?.data;
                if (raw) {
                    // Backend may return the parsed content object directly
                    // ({ heading, sessions, ... }) OR wrapped as { content: ... }.
                    const obj =
                        raw.content !== undefined
                            ? typeof raw.content === 'string'
                                ? JSON.parse(raw.content)
                                : raw.content
                            : raw;
                    if (obj && (obj.sessions || obj.heading)) setContent(obj);
                }
            } catch (e) {
                console.error('TC public load failed', e);
                if (e?.response?.status === 404) navigate('/school-not-found');
            } finally {
                setLoading(false);
            }
        })();
    }, [slug, navigate]);

    const sessions = useMemo(() => (Array.isArray(content?.sessions) ? content.sessions : []), [content]);

    // ------------------------------------------------------------------
    // Search logic — case-insensitive TC No + Student Name
    // ------------------------------------------------------------------
    const handleSearch = () => {
        setFormError('');
        const tcNo = form.tcNo.trim().toLowerCase();
        const name = form.studentName.trim().toLowerCase();

        if (!tcNo || !name) {
            setFormError('TC Number and Student Name are required.');
            return;
        }

        const records = selectedSession?.records || [];
        const found = records.find((r) => {
            const rTc = String(r.tcNo || '').trim().toLowerCase();
            const rName = String(r.studentName || '').trim().toLowerCase();
            return rTc === tcNo && rName === name;
        });

        setResult(found ? { status: 'found', record: found } : { status: 'notfound' });
    };

    // Legacy records (old CSV-based module) carry a direct pdfUrl —
    // for those, open the uploaded PDF instead of generating a sparse TC.
    const isLegacyRecord = !!result?.record?.pdfUrl;

    const handleGenerate = () => {
        if (!result?.record || !school) return;
        if (isLegacyRecord) {
            window.open(result.record.pdfUrl, '_blank', 'noopener');
            return;
        }
        setGenerating(true);
        // small delay so the spinner is visible before the print window opens
        setTimeout(() => {
            printTC(result.record, school, selectedSession?.tcFormat || 'default');
            setGenerating(false);
        }, 600);
    };

    const goToSession = (s) => {
        setSelectedSession(s);
        setForm({ tcNo: '', studentName: '' });
        setResult(null);
        setFormError('');
        setStep(2);
    };

    const backToSessions = () => {
        setStep(1);
        setSelectedSession(null);
        setResult(null);
        setFormError('');
    };

    const tryAgain = () => {
        setResult(null);
        setFormError('');
    };

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontSize: 15 }}>
                Loading…
            </div>
        );
    }
    if (!school) return null;

    const inputStyle = {
        width: '100%',
        padding: '13px 16px',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        fontSize: 15,
        outline: 'none',
        background: '#fff',
    };
    const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 7 };

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
            <style>{`
                .rte-content p { margin-bottom: 0.6em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content ul, .rte-content ol { padding-left: 1.5em; margin-bottom: 0.8em; }
                .rte-content .ql-size-small { font-size: 0.75em; }
                .rte-content .ql-size-large { font-size: 1.5em; }
                .rte-content .ql-size-huge { font-size: 2.5em; }

                @keyframes stepIn {
                    from { opacity: 0; transform: translateX(28px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes resultPop {
                    from { opacity: 0; transform: translateY(14px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .tc-step-in { animation: stepIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
                .tc-result-pop { animation: resultPop 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
                .tc-session-card { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
                .tc-session-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(15,23,42,0.1); }
                .tc-spinner {
                    display: inline-block; width: 16px; height: 16px;
                    border: 2.5px solid rgba(255,255,255,0.35); border-top-color: #fff;
                    border-radius: 50%; animation: spin 0.7s linear infinite;
                    vertical-align: -3px; margin-right: 8px;
                }
            `}</style>

            <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="tc" />

            {/* ============ Page header (no banner) ============ */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '140px 20px 30px', textAlign: 'center' }}>
                <span
                    style={{
                        display: 'inline-block',
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                        color: tc.primary,
                        background: tc.light,
                        borderRadius: 999,
                        padding: '6px 16px',
                        marginBottom: 18,
                    }}
                >
                    Transfer Certificate
                </span>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 700, color: '#0f172a', lineHeight: 1.15, fontStyle: content?.headingItalic ? 'italic' : 'normal' }}>
                    {content?.heading || 'Download Transfer Certificate'}
                </h1>
                {content?.description && (
                    <div
                        className="rte-content"
                        style={{ marginTop: 16, fontSize: 15.5, color: '#475569', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}
                        dangerouslySetInnerHTML={{ __html: content.description }}
                    />
                )}
            </div>

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 90px' }}>
                {/* ============ Step 1: Session dropdown ============ */}
                {step === 1 && (
                    <>
                        {sessions.length === 0 ? (
                            <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '54px 24px', color: '#64748b', fontSize: 15 }}>
                                TC records are not available yet. Please contact the school office.
                            </div>
                        ) : (
                            <div style={{ maxWidth: 520, margin: '0 auto' }}>
                                <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 20 }}>
                                    Step 1 — Select your academic session
                                </p>

                                {/* Dropdown card */}
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '32px 28px', boxShadow: '0 2px 10px rgba(15,23,42,0.04)', textAlign: 'center' }}>
                                    {/* Calendar icon */}
                                    <div style={{ width: 56, height: 56, margin: '0 auto 20px', borderRadius: 16, background: tc.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={tc.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    </div>

                                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                                        Academic Session
                                    </h3>
                                    <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 22 }}>
                                        Select the session in which the student studied
                                    </p>

                                    {/* Select dropdown */}
                                    <div style={{ position: 'relative', marginBottom: 22 }}>
                                        <select
                                            defaultValue=""
                                            onChange={(e) => {
                                                const s = sessions.find((x) => x.id === e.target.value);
                                                if (s) goToSession(s);
                                            }}
                                            style={{
                                                width: '100%',
                                                appearance: 'none',
                                                padding: '13px 44px 13px 18px',
                                                fontSize: 15,
                                                fontWeight: 600,
                                                border: `1.5px solid ${tc.primary}`,
                                                borderRadius: 12,
                                                background: '#fff',
                                                color: '#0f172a',
                                                cursor: 'pointer',
                                                outline: 'none',
                                            }}
                                        >
                                            <option value="" disabled>— Choose session —</option>
                                            {sessions.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}  ({FORMAT_LABELS[s.tcFormat || 'default']})
                                                </option>
                                            ))}
                                        </select>
                                        <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tc.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </div>

                                    <p style={{ fontSize: 12, color: '#94a3b8' }}>
                                        {sessions.length} session{sessions.length !== 1 ? 's' : ''} available
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ============ Step 2: Search form ============ */}
                {step === 2 && selectedSession && (
                    <div className="tc-step-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                            <button
                                onClick={backToSessions}
                                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 999, padding: '8px 18px', fontSize: 14, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                            >
                                ← Back
                            </button>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: tc.primary, background: tc.light, borderRadius: 999, padding: '7px 16px' }}>
                                Session {selectedSession.name}
                            </span>
                        </div>

                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 'clamp(24px, 4vw, 40px)', boxShadow: '0 2px 10px rgba(15,23,42,0.04)' }}>
                            <p style={{ fontSize: 13.5, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 20 }}>
                                Step 2 — Enter your details
                            </p>

                            {!result && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
                                        <div>
                                            <label style={labelStyle}>TC Number *</label>
                                            <input
                                                style={inputStyle}
                                                placeholder="e.g. TC001"
                                                value={form.tcNo}
                                                onChange={(e) => setForm((p) => ({ ...p, tcNo: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Student Name *</label>
                                            <input
                                                style={inputStyle}
                                                placeholder="Full name as per school records"
                                                value={form.studentName}
                                                onChange={(e) => setForm((p) => ({ ...p, studentName: e.target.value }))}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            />
                                        </div>
                                    </div>

                                    {formError && (
                                        <p style={{ marginTop: 14, fontSize: 13.5, fontWeight: 600, color: '#b91c1c' }}>{formError}</p>
                                    )}

                                    <button
                                        onClick={handleSearch}
                                        style={{
                                            marginTop: 24,
                                            background: tc.primary,
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 12,
                                            padding: '14px 34px',
                                            fontSize: 15,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Search My TC
                                    </button>
                                </>
                            )}

                            {/* ============ Result: found ============ */}
                            {result?.status === 'found' && (
                                <div className="tc-result-pop">
                                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '14px 18px', fontSize: 14.5, fontWeight: 700, color: '#15803d', marginBottom: 22 }}>
                                        ✓ Transfer Certificate record found!
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 26 }}>
                                        {[
                                            ['TC No', result.record.tcNo],
                                            ['Student Name', result.record.studentName],
                                            ['Father Name', result.record.fatherName],
                                            ['Class', result.record.lastClassStudied || result.record.class],
                                            ['Date of Leaving', result.record.dateOfLeaving],
                                            ['Session', selectedSession.name],
                                        ].map(([k, v]) => (
                                            <div key={k} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, padding: '12px 16px' }}>
                                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{v || '—'}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                                        <button
                                            onClick={handleGenerate}
                                            disabled={generating}
                                            style={{
                                                background: tc.primary,
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 12,
                                                padding: '14px 30px',
                                                fontSize: 15,
                                                fontWeight: 700,
                                                cursor: generating ? 'wait' : 'pointer',
                                                opacity: generating ? 0.85 : 1,
                                            }}
                                        >
                                            {generating && <span className="tc-spinner" />}
                                            {isLegacyRecord ? 'Download TC (PDF)' : generating ? 'Generating…' : 'Generate & Download TC'}
                                        </button>
                                        <button
                                            onClick={tryAgain}
                                            style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 24px', fontSize: 14.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                                        >
                                            Search Another
                                        </button>
                                    </div>
                                    <p style={{ marginTop: 14, fontSize: 12.5, color: '#94a3b8' }}>
                                        {isLegacyRecord
                                            ? 'Note: Your TC will open as a PDF in a new tab.'
                                            : <>Note: A print window will open. Select <b>"Save as PDF"</b> as the destination to download your TC.</>}
                                    </p>
                                </div>
                            )}

                            {/* ============ Result: not found ============ */}
                            {result?.status === 'notfound' && (
                                <div className="tc-result-pop">
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '14px 18px', fontSize: 14.5, fontWeight: 700, color: '#b91c1c', marginBottom: 20 }}>
                                        ✕ No matching TC record found in session {selectedSession.name}.
                                    </div>

                                    <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 14, padding: '18px 22px', marginBottom: 22 }}>
                                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Tips:</div>
                                        <ul style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.9, paddingLeft: 20 }}>
                                            <li>Double-check the TC Number exactly as issued by the school.</li>
                                            <li>Enter the student's full name as written in school records.</li>
                                            {/* <li>Try leaving the Class field blank.</li> */}
                                            <li>Make sure you selected the correct academic session.</li>
                                        </ul>
                                    </div>

                                    {(school.phone || school.email) && (
                                        <p style={{ fontSize: 13.5, color: '#475569', marginBottom: 22 }}>
                                            Still can't find it? Contact the school office
                                            {school.phone && <> — 📞 <b>{school.phone}</b></>}
                                            {school.email && <> — ✉️ <b>{school.email}</b></>}
                                        </p>
                                    )}

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                        <button
                                            onClick={tryAgain}
                                            style={{ background: tc.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 14.5, fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            Try Again
                                        </button>
                                        <button
                                            onClick={backToSessions}
                                            style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '13px 24px', fontSize: 14.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                                        >
                                            Change Session
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
        </div>
    );
};

export default TCInformationPublic;