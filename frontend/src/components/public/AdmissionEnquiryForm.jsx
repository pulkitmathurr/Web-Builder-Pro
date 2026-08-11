import { useState } from "react";
import { submitEnquiryApi } from "../../api/enquiry.api";
import toast from "react-hot-toast";

const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`)];

const emptyForm = { studentName: '', dob: '', motherName: '', fatherName: '', phone: '', email: '', gender: '', classApplying: '', message: '' };

const FieldIcon = ({ d, children }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children || <path d={d} />}
    </svg>
);
const ICONS = {
    studentName: <FieldIcon><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></FieldIcon>,
    dob: <FieldIcon><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></FieldIcon>,
    motherName: <FieldIcon><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></FieldIcon>,
    fatherName: <FieldIcon><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></FieldIcon>,
    phone: <FieldIcon d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />,
    email: <FieldIcon><path d="M22 6l-10 7L2 6" /><path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2z" /></FieldIcon>,
    gender: <FieldIcon><circle cx="12" cy="9" r="5" /><path d="M12 14v8M9 19h6" /></FieldIcon>,
    classApplying: <FieldIcon><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></FieldIcon>,
    message: <FieldIcon><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></FieldIcon>,
};

const Field = ({ name, label, required, children, index, errors, labelStyle }) => (
    <div className="aef-field" style={{ animationDelay: `${index * 0.04}s` }}>
        <label style={labelStyle}>{label}{required && <span style={{ color: '#dc2626' }}> *</span>}</label>
        <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: errors[name] ? '#dc2626' : '#94a3b8', pointerEvents: 'none', display: 'flex' }}>
                {ICONS[name]}
            </span>
            {children}
        </div>
    </div>
);

// ── Shared admission enquiry form — same fields, same submission logic (tbl_enquiries,
// type 'admission'), used both inline on the Admission Procedure page and inside the
// site-wide "Enquire Now" modal (EnquiryWidget.jsx), so a visitor sees one consistent
// form no matter where they fill it. Sharp corners, no pill shapes — deliberately
// tighter/more professional than the rounded-pill style used elsewhere on the site. ──
const AdmissionEnquiryForm = ({ school, tc, dense = false }) => {
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (String(value).trim()) setErrors(prev => ({ ...prev, [field]: false }));
    };

    const padY = dense ? '10px' : '14px';
    const inputStyle = {
        width: '100%', padding: `${padY} 14px ${padY} 36px`, border: '1.5px solid #e2e8f0', borderRadius: '8px',
        fontSize: dense ? '13px' : '13.5px', color: '#0f172a', outline: 'none', boxSizing: 'border-box',
        background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif", transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
    };
    const errorStyle = { borderColor: '#dc2626' };
    const labelStyle = { display: 'block', fontSize: dense ? '11px' : '12px', fontWeight: 700, color: '#334155', marginBottom: dense ? '5px' : '7px', letterSpacing: '0.01em' };
    const gap = dense ? '13px' : '20px';

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!form.studentName.trim()) newErrors.studentName = true;
        if (!form.phone.trim()) newErrors.phone = true;
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fill in the required fields');
            return;
        }
        setSubmitting(true);
        try {
            await submitEnquiryApi(school.id, {
                type: 'admission',
                name: form.fatherName.trim() || form.motherName.trim() || form.studentName.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || undefined,
                message: form.message.trim() || undefined,
                extra: {
                    studentName: form.studentName.trim(),
                    dateOfBirth: form.dob,
                    motherName: form.motherName.trim(),
                    fatherName: form.fatherName.trim(),
                    gender: form.gender,
                    classApplying: form.classApplying,
                },
            });
            setSubmitted(true);
        } catch (e) {
            toast.error('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div style={{ textAlign: 'center', padding: dense ? '1.5rem 0' : '3rem 1rem' }}>
                <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 1.25rem' }}>
                    <div className="aef-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${tc.primary}` }}></div>
                    <div className="aef-badge" style={{ position: 'relative', width: '72px', height: '72px', borderRadius: '50%', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 10px 28px ${tc.primary}40` }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path className="aef-check" d="M4 12.5l5 5L20 6.5" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.2px' }}>Enquiry Submitted!</h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: '340px', margin: '0 auto 1.5rem' }}>
                    Thank you for reaching out. Our admissions team will get in touch with you shortly.
                </p>
                <button onClick={() => { setForm(emptyForm); setErrors({}); setSubmitted(false); }} className="aef-again"
                    style={{ padding: '10px 22px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', color: '#1e293b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Submit Another
                </button>
                <style>{`
                    @keyframes aefRingPulse { 0% { transform: scale(0.75); opacity: 0.8; } 100% { transform: scale(1.7); opacity: 0; } }
                    @keyframes aefBadgePop { 0% { transform: scale(0); opacity: 0; } 55% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
                    @keyframes aefCheckDraw { from { stroke-dashoffset: 28; } to { stroke-dashoffset: 0; } }
                    .aef-ring { animation: aefRingPulse 1s ease-out 0.15s both; }
                    .aef-badge { animation: aefBadgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
                    .aef-check { stroke-dasharray: 28; stroke-dashoffset: 28; animation: aefCheckDraw 0.35s ease-out 0.4s forwards; }
                    .aef-again { transition: transform 0.18s ease, border-color 0.18s ease; }
                    .aef-again:hover { transform: translateY(-1px); border-color: ${tc.primary}; }
                `}</style>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap }}>
            <div className="aef-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>
                <Field name="studentName" label="Name of Student" required index={0} errors={errors} labelStyle={labelStyle}>
                    <input className="aef-input" type="text" value={form.studentName} onChange={e => update('studentName', e.target.value)}
                        placeholder="Enter student's name" style={{ ...inputStyle, ...(errors.studentName ? errorStyle : {}) }} />
                </Field>
                <Field name="dob" label="Date of Birth" index={1} errors={errors} labelStyle={labelStyle}>
                    <input className="aef-input" type="date" value={form.dob} onChange={e => update('dob', e.target.value)} style={inputStyle} />
                </Field>
            </div>
            <div className="aef-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>
                <Field name="motherName" label="Name of Mother" index={2} errors={errors} labelStyle={labelStyle}>
                    <input className="aef-input" type="text" value={form.motherName} onChange={e => update('motherName', e.target.value)} placeholder="Enter mother's name" style={inputStyle} />
                </Field>
                <Field name="fatherName" label="Name of Father" index={3} errors={errors} labelStyle={labelStyle}>
                    <input className="aef-input" type="text" value={form.fatherName} onChange={e => update('fatherName', e.target.value)} placeholder="Enter father's name" style={inputStyle} />
                </Field>
            </div>
            <div className="aef-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>
                <Field name="phone" label="Contact Number" required index={4} errors={errors} labelStyle={labelStyle}>
                    <input className="aef-input" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                        placeholder="Enter phone number" style={{ ...inputStyle, ...(errors.phone ? errorStyle : {}) }} />
                </Field>
                <Field name="email" label="Email" index={5} errors={errors} labelStyle={labelStyle}>
                    <input className="aef-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="Enter email address" style={inputStyle} />
                </Field>
            </div>
            <div className="aef-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>
                <Field name="gender" label="Gender" index={6} errors={errors} labelStyle={labelStyle}>
                    <select className="aef-input" value={form.gender} onChange={e => update('gender', e.target.value)} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </Field>
                <Field name="classApplying" label="Select Class" index={7} errors={errors} labelStyle={labelStyle}>
                    <select className="aef-input" value={form.classApplying} onChange={e => update('classApplying', e.target.value)} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
                        <option value="">Select Class</option>
                        {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </Field>
            </div>
            <div className="aef-field" style={{ animationDelay: '0.32s' }}>
                <label style={labelStyle}>Message</label>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8', pointerEvents: 'none', display: 'flex' }}>{ICONS.message}</span>
                    <textarea className="aef-input" value={form.message} onChange={e => update('message', e.target.value)}
                        placeholder="Any questions or additional details..." rows={dense ? 2 : 4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', paddingTop: dense ? '10px' : '12px' }} />
                </div>
            </div>
            <button type="submit" disabled={submitting} className="aef-submit aef-field"
                style={{
                    marginTop: '4px', padding: dense ? '11px' : '15px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff',
                    border: 'none', borderRadius: '8px', fontSize: '14.5px', fontWeight: 700, cursor: submitting ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: `0 8px 22px ${tc.primary}38`, animationDelay: '0.36s',
                }}>
                {submitting && (
                    <svg className="aef-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <circle style={{ opacity: 0.3 }} cx="12" cy="12" r="10" stroke="#fff" strokeWidth="3.5" />
                        <path d="M22 12a10 10 0 00-10-10" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
                    </svg>
                )}
                {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <style>{`
                @keyframes aefFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes aefSpin { to { transform: rotate(360deg); } }
                .aef-field { animation: aefFadeIn 0.45s cubic-bezier(0.16,1,0.3,1) both; }
                .aef-input:focus { border-color: ${tc.primary} !important; background: #ffffff !important; box-shadow: 0 0 0 3.5px ${tc.primary}1a; }
                .aef-submit { transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease; }
                .aef-submit:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 12px 28px ${tc.primary}45; }
                .aef-submit:active:not(:disabled) { transform: translateY(0); }
                .aef-spin { animation: aefSpin 0.7s linear infinite; }
                @media (max-width: 420px) { .aef-2col { grid-template-columns: 1fr !important; } }
            `}</style>
        </form>
    );
};

export default AdmissionEnquiryForm;
