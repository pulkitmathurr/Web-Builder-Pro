import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { submitEnquiryApi } from "../../api/enquiry.api";
import { uploadPdfApi } from "../../api/content.api";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import toast from "react-hot-toast";

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const AUTO_POPUP_DELAY_MS = 4000;

const inputStyleBase = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px',
    fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box',
    background: '#ffffff', fontFamily: "'Inter', system-ui, sans-serif", transition: 'border 0.2s',
};
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' };
const Required = () => <span style={{ color: '#dc2626' }}> *</span>;
const errorInputStyle = { borderColor: '#dc2626' };
const fieldErrorStyle = { color: '#dc2626', fontSize: '11px', fontWeight: 500, marginTop: '4px' };
const FieldError = ({ show }) => show ? <p style={fieldErrorStyle}>Please fill in this field</p> : null;

// ── Shared modal chrome (plain white header + heading + close + success view),
// matching the reference "ENQUIRE FORM" design — compact so the whole form fits
// without an internal scrollbar (fields are deliberately smaller/tighter than a
// typical full-page form for this reason). ──
const ModalShell = ({ open, onClose, bc, title, submitted, successTitle, successMessage, onResetAndClose, children }) => {
    if (!open) return null;
    return (
        <div onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 6000,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
            }}>
            <div onClick={e => e.stopPropagation()}
                style={{
                    background: bc.card, borderRadius: '14px', width: '100%', maxWidth: '480px',
                    maxHeight: '96vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    animation: 'enqModalIn 0.25s cubic-bezier(0.16,1,0.3,1)', fontFamily: "'Inter', system-ui, sans-serif",
                    position: 'relative',
                }}>
                <button onClick={onClose} className="enq-widget-close"
                    style={{ position: 'absolute', top: '14px', right: '16px', border: 'none', background: 'transparent', color: '#0f172a', fontSize: '20px', lineHeight: 1, cursor: 'pointer', padding: '4px' }}>
                    ×
                </button>

                <div style={{ padding: '22px 24px 20px' }}>
                    <h2 style={{ fontSize: '21px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.01em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '16px' }}>
                        {title}
                    </h2>

                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 1rem' }}>
                                <div className="enq-success-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #22c55e' }}></div>
                                <div className="enq-success-badge" style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                                        <path className="enq-success-check" d="M4 12.5l5 5L20 6.5" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{successTitle}</h3>
                            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                                {successMessage}
                            </p>
                            <button onClick={onResetAndClose}
                                style={{ padding: '9px 20px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '999px', color: '#1e293b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                Close
                            </button>
                        </div>
                    ) : children}
                </div>
            </div>
        </div>
    );
};

const emptyAdmissionForm = { name: '', studentName: '', classApplying: '', gender: '', phone: '', email: '', address: '', message: '' };

// ── Admission Enquiry modal — opens on floating tab click, on the "Admission
// Enquiry" CTA elsewhere on the site (via the 'open-admission-enquiry' window
// event, see SchoolWebsite.jsx), and once automatically per browser session. ──
const AdmissionEnquiryModal = ({ school, tc, bc }) => {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(emptyAdmissionForm);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const handler = () => setOpen(true);
        window.addEventListener('open-admission-enquiry', handler);
        return () => window.removeEventListener('open-admission-enquiry', handler);
    }, []);

    useEffect(() => {
        if (!school || !isModuleEnabled(school, 'admission')) return;
        const key = `enquiryModalShown_${school.id}`;
        if (sessionStorage.getItem(key)) return;
        const t = setTimeout(() => {
            setOpen(true);
            sessionStorage.setItem(key, '1');
        }, AUTO_POPUP_DELAY_MS);
        return () => clearTimeout(t);
    }, [school]);

    if (!isModuleEnabled(school, 'admission')) return null;

    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (value.trim()) setErrors(prev => ({ ...prev, [field]: false }));
    };
    const resetAndClose = () => { setSubmitted(false); setForm(emptyAdmissionForm); setErrors({}); setOpen(false); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = true;
        if (!form.phone.trim()) newErrors.phone = true;
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fill in all required fields');
            return;
        }
        setSubmitting(true);
        try {
            await submitEnquiryApi(school.id, {
                type: 'admission',
                name: form.name.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || undefined,
                message: form.message.trim() || undefined,
                extra: {
                    studentName: form.studentName.trim(),
                    classApplying: form.classApplying.trim(),
                    gender: form.gender,
                    address: form.address.trim(),
                },
            });
            setSubmitted(true);
        } catch (e) {
            toast.error('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModalShell open={open} onClose={() => setOpen(false)} tc={tc} bc={bc}
            title="Enquire Form"
            submitted={submitted} successTitle="Enquiry Submitted!"
            successMessage="Thank you for reaching out. Our admissions team will get in touch with you shortly."
            onResetAndClose={resetAndClose}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                    <label style={labelStyle}>Name Of the Child</label>
                    <input className="enq-widget-input" type="text" value={form.studentName} onChange={e => update('studentName', e.target.value)} placeholder="Enter student's name" style={inputStyleBase} />
                </div>

                <div className="enq-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label style={labelStyle}>Class Applying For</label>
                        <input className="enq-widget-input" type="text" value={form.classApplying} onChange={e => update('classApplying', e.target.value)} placeholder="e.g. Nursery, Class 3" style={inputStyleBase} />
                    </div>
                    <div>
                        <label style={labelStyle}>Gender</label>
                        <div style={{ display: 'flex', gap: '12px', height: '35px', alignItems: 'center' }}>
                            {GENDER_OPTIONS.map(g => (
                                <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
                                    <input type="radio" name="admission-gender" value={g} checked={form.gender === g} onChange={() => update('gender', g)}
                                        style={{ width: '14px', height: '14px', accentColor: tc.primary, cursor: 'pointer' }} />
                                    {g}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="enq-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label style={labelStyle}>Parent Name<Required /></label>
                        <input className="enq-widget-input" type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Enter your full name" style={{ ...inputStyleBase, ...(errors.name ? errorInputStyle : {}) }} required />
                        <FieldError show={errors.name} />
                    </div>
                    <div>
                        <label style={labelStyle}>Parent Phone Number<Required /></label>
                        <input className="enq-widget-input" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="Enter phone number" style={{ ...inputStyleBase, ...(errors.phone ? errorInputStyle : {}) }} required />
                        <FieldError show={errors.phone} />
                    </div>
                </div>

                <div className="enq-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label style={labelStyle}>Parent Email Address</label>
                        <input className="enq-widget-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="Enter email address" style={inputStyleBase} />
                    </div>
                    <div>
                        <label style={labelStyle}>Address</label>
                        <input className="enq-widget-input" type="text" value={form.address} onChange={e => update('address', e.target.value)} placeholder="Enter your address" style={inputStyleBase} />
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Message</label>
                    <textarea className="enq-widget-input" value={form.message} onChange={e => update('message', e.target.value)} placeholder="Any questions or additional details..." rows={2} style={{ ...inputStyleBase, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>

                <button type="submit" disabled={submitting} className="enq-widget-submit"
                    style={{ marginTop: '4px', alignSelf: 'flex-start', padding: '11px 28px', background: tc.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'filter 0.2s ease' }}>
                    {submitting ? 'Submitting...' : 'Send Message'}
                </button>
            </form>
        </ModalShell>
    );
};

const emptyCareerForm = { name: '', position: '', phone: '', email: '', message: '' };

// ── Career Enquiry modal — opens only from its own floating tab (or the
// 'open-career-enquiry' window event) — deliberately no auto-popup on load,
// unlike Admission, since two auto-popups on the same visit would be annoying. ──
const CareerEnquiryModal = ({ school, tc, bc }) => {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(emptyCareerForm);
    const [errors, setErrors] = useState({});
    const [resumeUrl, setResumeUrl] = useState('');
    const [uploadingResume, setUploadingResume] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const handler = () => setOpen(true);
        window.addEventListener('open-career-enquiry', handler);
        return () => window.removeEventListener('open-career-enquiry', handler);
    }, []);

    if (!isModuleEnabled(school, 'career')) return null;

    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (value.trim()) setErrors(prev => ({ ...prev, [field]: false }));
    };
    const resetAndClose = () => { setSubmitted(false); setForm(emptyCareerForm); setErrors({}); setResumeUrl(''); setOpen(false); };

    const handleResumeUpload = async (file) => {
        setUploadingResume(true);
        try {
            const res = await uploadPdfApi(file);
            setResumeUrl(res.data.url);
            toast.success('Resume uploaded');
        } catch (e) {
            toast.error('Failed to upload resume');
        } finally {
            setUploadingResume(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = true;
        if (!form.phone.trim()) newErrors.phone = true;
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fill in all required fields');
            return;
        }
        setSubmitting(true);
        try {
            await submitEnquiryApi(school.id, {
                type: 'career',
                name: form.name.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || undefined,
                message: form.message.trim() || undefined,
                extra: { position: form.position.trim(), resumeUrl },
            });
            setSubmitted(true);
        } catch (e) {
            toast.error('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModalShell open={open} onClose={() => setOpen(false)} tc={tc} bc={bc}
            title="Career Form"
            submitted={submitted} successTitle="Application Submitted!"
            successMessage="Thank you for your interest. Our team will review your application and get in touch if there's a fit."
            onResetAndClose={resetAndClose}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="enq-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label style={labelStyle}>Full Name<Required /></label>
                        <input className="enq-widget-input" type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Enter your full name" style={{ ...inputStyleBase, ...(errors.name ? errorInputStyle : {}) }} required />
                        <FieldError show={errors.name} />
                    </div>
                    <div>
                        <label style={labelStyle}>Position Applied For</label>
                        <input className="enq-widget-input" type="text" value={form.position} onChange={e => update('position', e.target.value)} placeholder="e.g. Primary Teacher" style={inputStyleBase} />
                    </div>
                </div>

                <div className="enq-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label style={labelStyle}>Phone Number<Required /></label>
                        <input className="enq-widget-input" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="Enter phone number" style={{ ...inputStyleBase, ...(errors.phone ? errorInputStyle : {}) }} required />
                        <FieldError show={errors.phone} />
                    </div>
                    <div>
                        <label style={labelStyle}>Email Address</label>
                        <input className="enq-widget-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="Enter email address" style={inputStyleBase} />
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Resume (PDF, optional)</label>
                    <label style={{ display: 'block', padding: '9px 12px', border: '1.5px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '12.5px', color: resumeUrl ? '#15803d' : '#64748b', background: resumeUrl ? '#f0fdf4' : '#ffffff', textAlign: 'center' }}>
                        {uploadingResume ? 'Uploading...' : resumeUrl ? '✓ Resume uploaded — click to change' : '📎 Click to upload your resume'}
                        <input type="file" accept="application/pdf" style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleResumeUpload(f); }} />
                    </label>
                </div>

                <div>
                    <label style={labelStyle}>Message</label>
                    <textarea className="enq-widget-input" value={form.message} onChange={e => update('message', e.target.value)} placeholder="Tell us a bit about your experience..." rows={2} style={{ ...inputStyleBase, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>

                <button type="submit" disabled={submitting} className="enq-widget-submit"
                    style={{ marginTop: '4px', alignSelf: 'flex-start', padding: '11px 28px', background: tc.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'filter 0.2s ease' }}>
                    {submitting ? 'Submitting...' : 'Send Message'}
                </button>
            </form>
        </ModalShell>
    );
};

// ── Site-wide enquiry widget — floating "Enquire Now" / "Career Enquiry" tabs
// (always visible on every public school page) plus their modal forms. Mounted
// once in App.jsx alongside <Routes>, so it derives the school from the URL
// itself (there is no shared public layout route to hang this off yet) rather
// than every public page having to import/render it individually. Replaces the
// old dedicated /school/:slug/admission-enquiry and /career-enquiry pages —
// see CLAUDE.md Modules section. ──
const EnquiryWidget = () => {
    const location = useLocation();
    const match = location.pathname.match(/^\/school\/([^/]+)/);
    const slug = match ? match[1] : null;

    const [school, setSchool] = useState(null);

    useEffect(() => {
        if (!slug) return;
        let cancelled = false;
        getPublicSchoolApi(slug).then(res => { if (!cancelled) setSchool(res.data); }).catch(() => { if (!cancelled) setSchool(null); });
        return () => { cancelled = true; };
    }, [slug]);

    if (!school) return null;

    const tc = getThemeColors(school.theme);
    const bc = getBaseColors(school.base_theme);
    const admissionOn = isModuleEnabled(school, 'admission');
    const careerOn = isModuleEnabled(school, 'career');

    return (
        <>
            <style>{`
                .enq-widget-tab:hover { filter: brightness(1.08); }
                .enq-widget-input:focus { border-color: ${tc.primary} !important; }
                .enq-widget-submit:hover { filter: brightness(1.06); }
                @keyframes enqModalIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .enq-success-badge { animation: enqCheckPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
                .enq-success-ring { animation: enqRingPulse 0.9s ease-out 0.1s both; }
                .enq-success-check { stroke-dasharray: 28; stroke-dashoffset: 28; animation: enqCheckDraw 0.3s ease-out 0.35s forwards; }
                @keyframes enqCheckPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
                @keyframes enqRingPulse { 0% { transform: scale(0.7); opacity: 0.7; } 100% { transform: scale(2); opacity: 0; } }
                @keyframes enqCheckDraw { to { stroke-dashoffset: 0; } }
                @media (max-width: 420px) {
                    .enq-2col { grid-template-columns: 1fr !important; }
                }
            `}</style>

            {/* Floating tabs — fixed to the right edge on every page. Vertical
                (top-to-bottom) text in a rounded tab, matching the reference design. */}
            {admissionOn && (
                <button className="enq-widget-tab" onClick={() => window.dispatchEvent(new Event('open-admission-enquiry'))}
                    style={{
                        position: 'fixed', right: 0, top: careerOn ? '40%' : '45%', transform: 'translateY(-50%)', zIndex: 5000,
                        background: tc.primary, color: '#ffffff',
                        border: 'none', borderRadius: '10px 0 0 10px', padding: '13px 8px',
                        fontSize: '12px', fontWeight: 700, letterSpacing: '0.02em', cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.28)', fontFamily: "'Inter', system-ui, sans-serif",
                        transition: 'filter 0.2s ease', writingMode: 'vertical-rl', textOrientation: 'mixed',
                    }}>
                    Enquire Now
                </button>
            )}
            {careerOn && (
                <button className="enq-widget-tab" onClick={() => window.dispatchEvent(new Event('open-career-enquiry'))}
                    style={{
                        position: 'fixed', right: 0, top: admissionOn ? '60%' : '45%', transform: 'translateY(-50%)', zIndex: 5000,
                        background: tc.primary, color: '#ffffff',
                        border: 'none', borderRadius: '10px 0 0 10px', padding: '13px 8px',
                        fontSize: '12px', fontWeight: 700, letterSpacing: '0.02em', cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.28)', fontFamily: "'Inter', system-ui, sans-serif",
                        transition: 'filter 0.2s ease', writingMode: 'vertical-rl', textOrientation: 'mixed',
                    }}>
                    Career Enquiry
                </button>
            )}

            <AdmissionEnquiryModal school={school} tc={tc} bc={bc} />
            <CareerEnquiryModal school={school} tc={tc} bc={bc} />
        </>
    );
};

export default EnquiryWidget;
