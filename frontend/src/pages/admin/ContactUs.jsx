import { useEffect, useState } from 'react';
import { updateSchoolProfileApi, getSchoolProfileApi } from '../../api/school.api';
import useSchoolStore from '../../store/schoolStore';
import { sanitizePhoneDigits, isValidPhone } from '../../utils/phone';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const ContactUs = () => {
    const { tc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('location');
    const [hoveredSocial, setHoveredSocial] = useState(null);
    const [formData, setFormData] = useState({
        phone: '', phone2: '', whatsapp_number: '', address: '', city: '', state: '', pincode: '',
        map_url: '', facebook: '', instagram: '', youtube: '', twitter: '', linkedin: '',
    });

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await getSchoolProfileApi();
            const school = res.data;
            setFormData({
                phone: school.phone || '',
                phone2: school.phone2 || '',
                whatsapp_number: school.whatsapp_number || '',
                address: school.address || '',
                city: school.city || '',
                state: school.state || '',
                pincode: school.pincode || '',
                map_url: school.map_url || '',
                facebook: school.facebook || '',
                instagram: school.instagram || '',
                youtube: school.youtube || '',
                twitter: school.twitter || '',
                linkedin: school.linkedin || '',
            });
        } catch (e) {
            toast.error('Failed to load contact info');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone' || name === 'phone2' || name === 'whatsapp_number') {
            setFormData({ ...formData, [name]: sanitizePhoneDigits(value) });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

 // `fields` scopes the save to just the section the user clicked "Save" on —
 // each button passes only the field names shown in its own card, so e.g.
 // Save Location never touches map_url/social fields and vice versa.
 const handleSave = async (fields) => {
    if (fields.includes('phone') && formData.phone && !isValidPhone(formData.phone)) {
        toast.error('Phone number must be exactly 10 digits');
        return;
    }
    if (fields.includes('phone2') && formData.phone2 && !isValidPhone(formData.phone2)) {
        toast.error('Alternate phone number must be exactly 10 digits');
        return;
    }
    if (fields.includes('whatsapp_number') && formData.whatsapp_number && !isValidPhone(formData.whatsapp_number)) {
        toast.error('WhatsApp number must be exactly 10 digits');
        return;
    }
    setSaving(true);
    try {
        const dataToSave = {};
        fields.forEach(f => { dataToSave[f] = formData[f]; });

        if (fields.includes('map_url') && dataToSave.map_url) {
            // If the full iframe code was pasted, extract the src
            if (dataToSave.map_url.includes('<iframe')) {
                const srcMatch = dataToSave.map_url.match(/src="([^"]+)"/);
                if (srcMatch && srcMatch[1]) {
                    dataToSave.map_url = srcMatch[1];
                }
            }

            // Decode HTML entities
            dataToSave.map_url = dataToSave.map_url
                .replace(/&#39;/g, "'")
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
            setFormData(prev => ({ ...prev, map_url: dataToSave.map_url }));
        }

        await updateSchoolProfileApi(dataToSave);
        toast.success('Contact info saved!');
    } catch (e) {
        toast.error('Failed to save');
    } finally {
        setSaving(false);
    }
};

const LOCATION_FIELDS = ['phone', 'phone2', 'whatsapp_number', 'address', 'city', 'state', 'pincode'];
const MAP_FIELDS = ['map_url'];
const SOCIAL_FIELDS = ['facebook', 'instagram', 'youtube', 'twitter', 'linkedin'];

    const inputStyle = {
        width: '100%',
        padding: '11px 14px',
        border: '0.5px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '13.5px',
        color: '#0f172a',
        outline: 'none',
        boxSizing: 'border-box',
        background: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        transition: 'border 0.2s'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '11px',
        fontWeight: 600,
        color: '#64748b',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    };

    const sections = [
        {
            key: 'location', label: 'Location',
            icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        },
        {
            key: 'map', label: 'Google Map',
            icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
        },
        {
            key: 'social', label: 'Social Media',
            icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
        },
    ];

    const socialLinks = [
        { name: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourschool', color: '#1877f2', gradient: 'linear-gradient(135deg,#1877f2,#42a5f5)', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
        { name: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourschool', color: '#e1306c', gradient: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
        { name: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourschool', color: '#ff0000', gradient: 'linear-gradient(135deg,#ff0000,#ff6b6b)', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg> },
        { name: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/yourschool', color: '#1da1f2', gradient: 'linear-gradient(135deg,#1da1f2,#0d8bd9)', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
        { name: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/school/yourschool', color: '#0077b5', gradient: 'linear-gradient(135deg,#0077b5,#00a0dc)', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #bfdbfe', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes heroIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes drift1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-24px, 18px) scale(1.08); }
                }
                .contact-section { animation: fadeInUp 0.35s ease forwards; }
                .contact-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .contact-hero-orb { animation: drift1 9s ease-in-out infinite; }
                @media (max-width: 900px) {
                    .contact-3col { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 700px) {
                    .contact-2col { grid-template-columns: 1fr !important; }
                    .contact-3col { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    /* ── Hero header — compact, same treatment as Dashboard/Settings ── */
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .contact-hero-inner { flex-wrap: wrap !important; gap: 0.85rem !important; }
                    .dash-hero-greeting { margin-bottom: 6px !important; }
                    .dash-hero-greeting p { font-size: 10px !important; }
                    .dash-hero-title { font-size: 19px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .dash-hero-desc { font-size: 11px !important; line-height: 1.5 !important; max-width: 100% !important; }

                    /* ── Quick Contact glass panel inside hero ── */
                    .contact-quick-panel { padding: 0.6rem 1rem !important; width: 100% !important; min-width: 0 !important; border-radius: 12px !important; }
                    .contact-quick-row { padding: 9px 0 !important; gap: 10px !important; }
                    .contact-quick-icon { width: 28px !important; height: 28px !important; border-radius: 8px !important; }
                    .contact-quick-icon svg { width: 14px !important; height: 14px !important; }
                    .contact-quick-label { font-size: 9px !important; }
                    .contact-quick-value { font-size: 11.5px !important; white-space: normal !important; overflow-wrap: break-word !important; text-overflow: unset !important; overflow: visible !important; }

                    /* ── Section tabs — horizontal swipeable strip ── */
                    .contact-tabs { flex-wrap: nowrap !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; scrollbar-width: none !important; padding-bottom: 2px !important; }
                    .contact-tabs::-webkit-scrollbar { display: none !important; }
                    .contact-tabs button { flex-shrink: 0 !important; padding: 8px 14px !important; font-size: 12px !important; gap: 5px !important; }
                    .contact-tabs button svg { width: 14px !important; height: 14px !important; }

                    /* ── Social cards — 2-per-row compact grid instead of 1-per-row stack ── */
                    .contact-3col { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
                    .contact-social-card { border-radius: 8px !important; }
                    .contact-social-header { padding: 8px !important; gap: 6px !important; }
                    .contact-social-icon { width: 24px !important; height: 24px !important; border-radius: 6px !important; }
                    .contact-social-icon svg { width: 12px !important; height: 12px !important; }
                    .contact-social-label { font-size: 10px !important; white-space: normal !important; overflow-wrap: break-word !important; line-height: 1.2 !important; }
                    .contact-social-body { padding: 8px !important; }
                    .contact-social-input { font-size: 10px !important; padding: 7px 8px !important; }
                    .contact-social-preview { display: none !important; }
                }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* Hero Header */}
                <div className="dash-hero" style={{
                    background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`,
                    borderRadius: '22px',
                    padding: '2.5rem 2.75rem',
                    marginBottom: '1.75rem',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 20px 60px ${hexToRgba(tc.primary, 0.2)}, 0 4px 20px rgba(0,0,0,0.15)`
                }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div className="contact-hero-orb" style={{ position: 'absolute', width: '350px', height: '350px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-120px', right: '8%', pointerEvents: 'none' }}></div>

                    <div className="contact-hero-inner" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
                        <div className="contact-hero-item" style={{ animationDelay: '0.05s' }}>
                            <div className="dash-hero-greeting" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tc.secondary }}></div>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin / Contact Us</p>
                            </div>
                            <h1 className="dash-hero-title" style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '10px', letterSpacing: '-0.5px' }}>Contact Information</h1>
                            <p className="dash-hero-desc" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '400px' }}>
                                Manage your school's address, Google Maps location and social media links.
                            </p>
                        </div>
                        {/* Quick Contact — one cohesive glass panel with icon rows, instead of separate boxed chips */}
                        <div className="contact-hero-item contact-quick-panel" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '18px', padding: '0.5rem 1.5rem', backdropFilter: 'blur(14px)', minWidth: '230px', animationDelay: '0.15s' }}>
                            {[
                                { label: 'Phone Number', value: formData.phone || 'Not added yet', icon: <svg width="16" height="16" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg> },
                                { label: 'City', value: formData.city || 'Not added yet', icon: <svg width="16" height="16" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
                            ].map((item, i) => (
                                <div key={i} className="contact-quick-row" style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '13px 0', borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                                    <div className="contact-quick-icon" style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {item.icon}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p className="contact-quick-label" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                                        <p className="contact-quick-value" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Section Tabs */}
                <div className="contact-tabs" style={{ display: 'flex', gap: '6px', marginBottom: '1.75rem' }}>
                    {sections.map(s => (
                        <button
                            key={s.key}
                            onClick={() => setActiveSection(s.key)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '6px',
                                border: activeSection === s.key ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0',
                                fontSize: '13px', cursor: 'pointer',
                                background: activeSection === s.key ? tc.light : '#ffffff',
                                color: activeSection === s.key ? tc.primary : '#64748b',
                                fontWeight: activeSection === s.key ? 600 : 400,
                                display: 'flex', alignItems: 'center', gap: '7px',
                                transition: 'all 0.15s',
                                boxShadow: activeSection === s.key ? `0 4px 12px ${hexToRgba(tc.primary, 0.15)}` : 'none'
                            }}
                        >
                            <span style={{ color: activeSection === s.key ? tc.primary : '#94a3b8' }}>{s.icon}</span>
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Location Section */}
                {activeSection === 'location' && (
                    <div className="contact-section contact-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Contact Details</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Phone numbers for contact page</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Phone Number</label>
                                    <input type="tel" inputMode="numeric" maxLength={10} name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter Phone Number" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Alternate Phone Number</label>
                                    <input type="tel" inputMode="numeric" maxLength={10} name="phone2" value={formData.phone2} onChange={handleChange} placeholder="Enter Alternate Phone Number" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>WhatsApp Number</label>
                                    <input type="tel" inputMode="numeric" maxLength={10} name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} placeholder="Enter WhatsApp Number" style={inputStyle} />
                                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Shows a floating WhatsApp chat button on your public website. Leave blank to hide it.</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#064e3b,#059669)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Address</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Full school address details</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Street Address</label>
                                    <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Enter Street Address" style={inputStyle} />
                                </div>
                                <div className="contact-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={labelStyle}>City</label>
                                        <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Enter City" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>State</label>
                                        <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Enter State" style={inputStyle} />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Pincode</label>
                                    <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Enter Pincode" style={inputStyle} />
                                </div>
                            </div>
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => handleSave(LOCATION_FIELDS)} disabled={saving}
                                style={{ padding: '12px 32px', background: saving ? hexToRgba(tc.primary, 0.5) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}`, display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                {saving ? (
                                    <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving...</>
                                ) : (
                                    <>Save </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Map Section */}
                {activeSection === 'map' && (
                    <div className="contact-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#92400e,#d97706)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(217,119,6,0.3)' }}>
                                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Google Maps Embed</p>
                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>Show your school location on the contact page</p>
                            </div>
                        </div>
                        <div className="contact-2col" style={{ padding: '1.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                            <div>
                                <label style={labelStyle}>Embed URL</label>
                                <textarea name="map_url" value={formData.map_url} onChange={handleChange} placeholder="https://www.google.com/maps/embed?pb=..." rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                                <div style={{ marginTop: '12px', padding: '14px', background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', borderRadius: '10px', border: '0.5px solid #fde68a' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                        How to get embed URL
                                    </p>
                                    {['1. Go to Google Maps', '2. Search your school location', '3. Click Share → Embed a map', '4. Copy the src URL from iframe OR paste full iframe code here'].map((step, i) => (
                                        <p key={i} style={{ fontSize: '11px', color: '#78350f', marginBottom: '3px' }}>{step}</p>
                                    ))}
                                </div>
                                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button onClick={() => handleSave(MAP_FIELDS)} disabled={saving} style={{ padding: '11px 24px', background: saving ? hexToRgba(tc.primary, 0.5) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.25)}` }}>
                                        {saving ? 'Saving...' : 'Save Map'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                {formData.map_url ? (
                                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '0.5px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                                        <iframe src={formData.map_url} width="100%" height="300" style={{ border: 0, display: 'block' }} allowFullScreen="" loading="lazy" title="School Location"/>
                                    </div>
                                ) : (
                                    <div style={{ height: '300px', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', borderRadius: '8px', border: '1.5px dashed #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                        <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="24" height="24" fill="none" stroke="#94a3b8" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                                        </div>
                                        <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Map preview will appear here</p>
                                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>Paste your Google Maps embed URL</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Social Section */}
                {activeSection === 'social' && (
                    <div className="contact-section">
                        <div className="contact-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.25rem' }}>
                            {socialLinks.map((social, i) => (
                                <div
                                    key={social.name}
                                    className="contact-social-card"
                                    onMouseEnter={() => setHoveredSocial(social.name)}
                                    onMouseLeave={() => setHoveredSocial(null)}
                                    style={{
                                        background: '#ffffff',
                                        border: hoveredSocial === social.name ? `0.5px solid ${social.color}30` : '0.5px solid #f1f5f9',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        boxShadow: hoveredSocial === social.name ? `0 8px 24px ${social.color}15` : '0 2px 8px rgba(0,0,0,0.04)',
                                        transition: 'all 0.2s ease',
                                        transform: hoveredSocial === social.name ? 'translateY(-2px)' : 'none'
                                    }}
                                >
                                    <div className="contact-social-header" style={{ padding: '14px 16px', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className="contact-social-icon" style={{ width: '34px', height: '34px', borderRadius: '8px', background: social.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: `0 4px 10px ${social.color}40`, flexShrink: 0 }}>
                                            {social.icon}
                                        </div>
                                        <p className="contact-social-label" style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{social.label}</p>
                                    </div>
                                    <div className="contact-social-body" style={{ padding: '14px 16px' }}>
                                        <input
                                            className="contact-social-input"
                                            type="text" name={social.name} value={formData[social.name]}
                                            onChange={handleChange} placeholder={social.placeholder}
                                            style={{ ...inputStyle, fontSize: '12px', padding: '9px 12px' }}
                                        />
                                        {formData[social.name] && (
                                            <a href={formData[social.name]} target="_blank" rel="noreferrer" className="contact-social-preview"
                                                style={{ fontSize: '11px', color: social.color, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 500 }}>
                                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                                Preview link
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => handleSave(SOCIAL_FIELDS)} disabled={saving}
                                style={{ padding: '12px 32px', background: saving ? hexToRgba(tc.primary, 0.5) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}`, display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                {saving ? (
                                    <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving...</>
                                ) : (
                                    <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Save Social Links</>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ContactUs;