import { useState } from "react";
import { submitEnquiryApi } from "../../api/enquiry.api";
import toast from "react-hot-toast";

const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`)];

const emptyForm = { studentName: '', dob: '', motherName: '', fatherName: '', phone: '', email: '', gender: '', classApplying: '', message: '' };

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

    const inputStyle = {
        width: '100%', padding: dense ? '9px 12px' : '11px 13px', border: '1.5px solid #cbd5e1', borderRadius: '6px',
        fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box',
        background: '#ffffff', fontFamily: "'Inter', system-ui, sans-serif", transition: 'border 0.2s',
    };
    const errorStyle = { borderColor: '#dc2626' };
    const labelStyle = { display: 'block', fontSize: dense ? '12px' : '12.5px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' };
    const gap = dense ? '10px' : '14px';

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
            <div style={{ textAlign: 'center', padding: dense ? '1rem 0' : '2rem 1rem' }}>
                <div style={{ width: '60px', height: '60px', margin: '0 auto 1rem', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M4 12.5l5 5L20 6.5" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Enquiry Submitted!</h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '1.25rem', maxWidth: '320px', margin: '0 auto 1.25rem' }}>
                    Thank you for reaching out. Our admissions team will get in touch with you shortly.
                </p>
                <button onClick={() => { setForm(emptyForm); setErrors({}); setSubmitted(false); }}
                    style={{ padding: '9px 20px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '6px', color: '#1e293b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Submit Another
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap }}>
            <div className="aef-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>
                <div>
                    <label style={labelStyle}>Name of Student *</label>
                    <input className="aef-input" type="text" value={form.studentName} onChange={e => update('studentName', e.target.value)}
                        placeholder="Enter student's name" style={{ ...inputStyle, ...(errors.studentName ? errorStyle : {}) }} />
                </div>
                <div>
                    <label style={labelStyle}>Date of Birth</label>
                    <input className="aef-input" type="date" value={form.dob} onChange={e => update('dob', e.target.value)} style={inputStyle} />
                </div>
            </div>
            <div className="aef-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>
                <div>
                    <label style={labelStyle}>Name of Mother</label>
                    <input className="aef-input" type="text" value={form.motherName} onChange={e => update('motherName', e.target.value)} placeholder="Enter mother's name" style={inputStyle} />
                </div>
                <div>
                    <label style={labelStyle}>Name of Father</label>
                    <input className="aef-input" type="text" value={form.fatherName} onChange={e => update('fatherName', e.target.value)} placeholder="Enter father's name" style={inputStyle} />
                </div>
            </div>
            <div className="aef-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>
                <div>
                    <label style={labelStyle}>Contact Number *</label>
                    <input className="aef-input" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                        placeholder="Enter phone number" style={{ ...inputStyle, ...(errors.phone ? errorStyle : {}) }} />
                </div>
                <div>
                    <label style={labelStyle}>Email</label>
                    <input className="aef-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="Enter email address" style={inputStyle} />
                </div>
            </div>
            <div className="aef-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>
                <div>
                    <label style={labelStyle}>Gender</label>
                    <select className="aef-input" value={form.gender} onChange={e => update('gender', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label style={labelStyle}>Select Class</label>
                    <select className="aef-input" value={form.classApplying} onChange={e => update('classApplying', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="">Select Class</option>
                        {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label style={labelStyle}>Message</label>
                <textarea className="aef-input" value={form.message} onChange={e => update('message', e.target.value)}
                    placeholder="Any questions or additional details..." rows={dense ? 2 : 3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <button type="submit" disabled={submitting} className="aef-submit"
                style={{
                    marginTop: '2px', padding: dense ? '11px' : '13px', background: tc.primary, color: '#fff',
                    border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 700, cursor: submitting ? 'wait' : 'pointer',
                    transition: 'filter 0.2s ease',
                }}>
                {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <style>{`
                .aef-input:focus { border-color: ${tc.primary} !important; }
                .aef-submit:hover { filter: brightness(1.08); }
                @media (max-width: 420px) { .aef-2col { grid-template-columns: 1fr !important; } }
            `}</style>
        </form>
    );
};

export default AdmissionEnquiryForm;
