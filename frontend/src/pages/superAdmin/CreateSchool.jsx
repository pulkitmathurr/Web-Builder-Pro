import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSchoolWithAdminApi } from '../../api/superAdmin.api';
import toast from 'react-hot-toast';

const CreateSchool = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '',
        address: '', city: '', state: '', pincode: '',
        adminName: '', adminEmail: '', adminPassword: '', adminPhone: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [schoolImage, setSchoolImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) { setSchoolImage(file); setImagePreview(URL.createObjectURL(file)); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
            if (schoolImage) submitData.append('schoolImage', schoolImage);
            await createSchoolWithAdminApi(submitData);
            toast.success('School & Admin created successfully!');
            navigate('/super-admin/schools');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '11px 14px',
        border: '0.5px solid #e2e8f0',
        borderRadius: '10px', fontSize: '13.5px', color: '#0f172a',
        outline: 'none', boxSizing: 'border-box',
        background: '#ffffff',
        transition: 'all 0.2s', fontFamily: 'system-ui, sans-serif',
    };

    const labelStyle = {
        display: 'block', fontSize: '11px', fontWeight: 600,
        color: '#64748b', marginBottom: '6px',
        textTransform: 'uppercase', letterSpacing: '0.06em'
    };

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .cs-section { animation: fadeInUp 0.4s ease forwards; opacity: 0; }
                .cs-section:nth-child(1) { animation-delay: 0.05s; }
                .cs-section:nth-child(2) { animation-delay: 0.1s; }
                .cs-section:nth-child(3) { animation-delay: 0.15s; }
                .cs-input:focus {
                    border-color: #0a0a0a !important;
                    box-shadow: 0 0 0 3px rgba(10,10,10,0.08) !important;
                }
                .cs-input::placeholder { color: #cbd5e1; }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* ── Hero Header ── */}
                <div className="cs-section" style={{
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1e1e1e 40%, #000000 100%)',
                    borderRadius: '16px', padding: '2.5rem', marginBottom: '1.75rem',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                }}>
                    <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', top: '-100px', right: '8%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }}></div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Super Admin / Schools / Create</p>
                        </div>
                        <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '10px', letterSpacing: '-0.5px' }}>Create New School</h1>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, maxWidth: '480px' }}>
                            Register a new school and set up their admin account in one step.
                        </p>
                    </div>
                </div>

                {/* ── Step Indicator ── */}
                <div className="cs-section" style={{ marginBottom: '1.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', maxWidth: '420px' }}>
                        {[
                            { num: 1, label: 'School Details', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> },
                            { num: 2, label: 'Admin Account', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
                        ].map((s, i) => (
                            <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                <div onClick={() => step > s.num && setStep(s.num)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: step > s.num ? 'pointer' : 'default' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        background: step > s.num ? 'linear-gradient(135deg,#0a0a0a,#333333)' : step === s.num ? '#0a0a0a' : '#f1f5f9',
                                        color: step >= s.num ? '#ffffff' : '#94a3b8',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '13px', fontWeight: 700, flexShrink: 0, transition: 'all 0.3s',
                                        border: step === s.num ? '2px solid rgba(10,10,10,0.4)' : '2px solid transparent',
                                        boxShadow: step === s.num ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                                    }}>
                                        {step > s.num ? <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> : s.icon}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '11px', color: step >= s.num ? '#0a0a0a' : '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.2 }}>Step {s.num}</p>
                                        <p style={{ fontSize: '13px', fontWeight: step === s.num ? 600 : 400, color: step >= s.num ? '#0f172a' : '#94a3b8' }}>{s.label}</p>
                                    </div>
                                </div>
                                {i < 1 && <div style={{ flex: 1, height: '2px', background: step > 1 ? 'linear-gradient(90deg,#0a0a0a,#333333)' : '#e2e8f0', margin: '0 16px', borderRadius: '1px', transition: 'background 0.4s' }}></div>}
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>

                    {/* ── Step 1 ── */}
                    {step === 1 && (
                        <div className="cs-section" style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#0a0a0a,#262626)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                                    <svg width="18" height="18" fill="none" stroke="#ffffff" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>School Information</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Basic details and photo of the school</p>
                                </div>
                            </div>

                            <div style={{ padding: '2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={labelStyle}>School Name *</label>
                                        <input className="cs-input" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. St. Mary's Convent School" required style={inputStyle} />
                                    </div>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={labelStyle}>School Logo / Photo</label>
                                        <div onClick={() => document.getElementById('schoolImageInput').click()}
                                            style={{ border: '1.5px dashed #e2e8f0', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: '#fafafa', transition: 'all 0.2s' }}>
                                            {imagePreview ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
                                                    <img src={imagePreview} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', border: '0.5px solid #e2e8f0' }} />
                                                    <div style={{ textAlign: 'left' }}>
                                                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', marginBottom: '3px' }}>{schoolImage?.name}</p>
                                                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>Click to change image</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div style={{ width: '44px', height: '44px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                                                        <svg width="20" height="20" fill="none" stroke="#94a3b8" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                                    </div>
                                                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Click to upload school logo</p>
                                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>PNG, JPG, WEBP · Max 2MB · Transparent PNG recommended</p>
                                                </>
                                            )}
                                        </div>
                                        <input id="schoolImageInput" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                                    </div>

                                    <div>
                                        <label style={labelStyle}>School Email *</label>
                                        <input className="cs-input" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="school@example.com" required style={inputStyle} />
                                    </div>

                                    <div>
                                        <label style={labelStyle}>Phone Number</label>
                                        <input className="cs-input" type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210" style={inputStyle} />
                                    </div>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={labelStyle}>Address</label>
                                        <input className="cs-input" type="text" name="address" value={formData.address} onChange={handleChange} placeholder="123 Main Street" style={inputStyle} />
                                    </div>

                                    <div>
                                        <label style={labelStyle}>City</label>
                                        <input className="cs-input" type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Jaipur" style={inputStyle} />
                                    </div>

                                    <div>
                                        <label style={labelStyle}>State</label>
                                        <input className="cs-input" type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Rajasthan" style={inputStyle} />
                                    </div>

                                    <div>
                                        <label style={labelStyle}>Pincode</label>
                                        <input className="cs-input" type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="302001" style={inputStyle} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '1.25rem 1.75rem', borderTop: '0.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <button type="button" onClick={() => navigate('/super-admin/schools')}
                                    style={{ padding: '10px 20px', background: 'transparent', border: '0.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', color: '#64748b', cursor: 'pointer', fontWeight: 500 }}>
                                    Cancel
                                </button>
                                <button type="button"
                                    onClick={() => {
                                        if (!formData.name || !formData.email) { toast.error('School name and email required'); return; }
                                        setStep(2);
                                    }}
                                    style={{ padding: '10px 28px', background: 'linear-gradient(135deg,#0a0a0a,#333333)', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
                                    Next — Admin Account
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2 ── */}
                    {step === 2 && (
                        <div className="cs-section" style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#0a0a0a,#262626)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                                    <svg width="18" height="18" fill="none" stroke="#ffffff" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Admin Account</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Login credentials for <strong style={{ color: '#0f172a' }}>{formData.name}</strong></p>
                                </div>
                            </div>

                            <div style={{ padding: '2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={labelStyle}>Admin Full Name *</label>
                                        <input className="cs-input" type="text" name="adminName" value={formData.adminName} onChange={handleChange} placeholder="e.g. Rajesh Sharma" required style={inputStyle} />
                                    </div>

                                    <div>
                                        <label style={labelStyle}>Admin Email *</label>
                                        <input className="cs-input" type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} placeholder="admin@school.com" required style={inputStyle} />
                                    </div>

                                    <div>
                                        <label style={labelStyle}>Admin Phone</label>
                                        <input className="cs-input" type="text" name="adminPhone" value={formData.adminPhone} onChange={handleChange} placeholder="9876543210" style={inputStyle} />
                                    </div>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={labelStyle}>Password *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input className="cs-input" type={showPassword ? 'text' : 'password'} name="adminPassword" value={formData.adminPassword} onChange={handleChange} placeholder="Min. 8 characters" required style={{ ...inputStyle, paddingRight: '44px' }} />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                                                {showPassword ? (
                                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                                                ) : (
                                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                                )}
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>Share these credentials with the school admin securely.</p>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div style={{ marginTop: '1.5rem', padding: '1.25rem 1.5rem', background: '#f8fafc', borderRadius: '12px', border: '0.5px solid #e2e8f0' }}>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Summary</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        {[
                                            { label: 'School', value: formData.name },
                                            { label: 'City', value: formData.city || '—' },
                                            { label: 'School Email', value: formData.email },
                                            { label: 'Admin Name', value: formData.adminName || '—' },
                                        ].map(item => (
                                            <div key={item.label} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                                <span style={{ fontSize: '11px', color: '#94a3b8', minWidth: '90px', flexShrink: 0 }}>{item.label}:</span>
                                                <span style={{ fontSize: '12px', color: '#0f172a', fontWeight: 500 }}>{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {imagePreview && (
                                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '10px', borderTop: '0.5px solid #e2e8f0' }}>
                                            <span style={{ fontSize: '11px', color: '#94a3b8', minWidth: '90px' }}>Logo:</span>
                                            <img src={imagePreview} alt="School" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', border: '0.5px solid #e2e8f0' }} />
                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{schoolImage?.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ padding: '1.25rem 1.75rem', borderTop: '0.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <button type="button" onClick={() => setStep(1)}
                                    style={{ padding: '10px 20px', background: 'transparent', border: '0.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', color: '#64748b', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                                    Back
                                </button>
                                <button type="submit" disabled={loading}
                                    style={{ padding: '10px 32px', background: loading ? 'rgba(10,10,10,0.4)' : 'linear-gradient(135deg,#0a0a0a,#333333)', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
                                    {loading ? (
                                        <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Creating...</>
                                    ) : (
                                        <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Create School & Admin</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </>
    );
};

export default CreateSchool;
