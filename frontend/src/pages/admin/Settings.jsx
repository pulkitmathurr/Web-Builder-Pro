import { useEffect, useState } from 'react';
import { getSchoolProfileApi, updateSchoolProfileApi, updateSchoolSettingsApi, uploadSchoolLogoApi } from '../../api/school.api';
import useSchoolStore from '../../store/schoolStore';
import ImageCropModal from '../../components/common/ImageCropModal';
import { FONT_OPTIONS, GOOGLE_FONTS_URL, getFontFamily } from '../../constants/fonts';
import toast from 'react-hot-toast';

const InfoIcon = () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

const BuildingIcon = ({ size = 32, color = '#cbd5e1' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
);

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const AdminSettings = () => {
    const { tc, setTheme: setStoreTheme } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [hoveredTheme, setHoveredTheme] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoCropSrc, setLogoCropSrc] = useState(null);
    const [profileData, setProfileData] = useState({
        name: '', phone: '', address: '', city: '', state: '', pincode: '', intro_message: ''
    });
    const [settingsData, setSettingsData] = useState({
        theme: 'default', logo_url: '', nav_font: 'inter', heading_font: 'inter'
    });

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await getSchoolProfileApi();
            const school = res.data;
            setProfileData({
                name: school.name || '',
                phone: school.phone || '',
                address: school.address || '',
                city: school.city || '',
                state: school.state || '',
                pincode: school.pincode || '',
                intro_message: school.intro_message || '',
            });
            setSettingsData({
                theme: school.theme || 'default',
                logo_url: school.logo_url || '',
                nav_font: school.nav_font || 'inter',
                heading_font: school.heading_font || 'inter',
            });
        } catch (e) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleProfileSave = async () => {
        setSaving(true);
        try {
            await updateSchoolProfileApi(profileData);
            toast.success('Profile updated successfully!');
        } catch (e) {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleThemeSave = async (theme) => {
        setSaving(true);
        try {
            await updateSchoolSettingsApi({ theme });
            setSettingsData({ ...settingsData, theme });
            setStoreTheme(theme);
            toast.success('Theme updated!');
        } catch (e) {
            toast.error('Failed to update theme');
        } finally {
            setSaving(false);
        }
    };

    const handleFontSave = async (field, fontKey) => {
        setSaving(true);
        try {
            await updateSchoolSettingsApi({ [field]: fontKey });
            setSettingsData({ ...settingsData, [field]: fontKey });
            toast.success('Font updated!');
        } catch (e) {
            toast.error('Failed to update font');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (file) setLogoCropSrc(URL.createObjectURL(file));
    };

    const handleLogoCropConfirmed = (croppedFile) => {
        setLogoCropSrc(null);
        setLogoFile(croppedFile);
        setLogoPreview(URL.createObjectURL(croppedFile));
    };

    const handleLogoUpload = async () => {
        if (!logoFile) { toast.error('Please select a logo'); return; }
        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append('schoolLogo', logoFile);
            const res = await uploadSchoolLogoApi(formData);
            setSettingsData(prev => ({ ...prev, logo_url: res.data.logo_url }));
            toast.success('Logo uploaded successfully!');
            setLogoFile(null);
        } catch (e) {
            toast.error('Failed to upload logo');
        } finally {
            setUploadingLogo(false);
        }
    };

    const themes = [
        { key: 'default', label: 'Rose Pink', desc: 'Warm & elegant', color: '#8b2252', gradient: 'linear-gradient(135deg,#8b2252,#c9687e)', shadow: 'rgba(139,34,82,0.35)' },
        { key: 'blue', label: 'Ocean Blue', desc: 'Professional & trustworthy', color: '#1e3a5f', gradient: 'linear-gradient(135deg,#1e3a5f,#2563eb)', shadow: 'rgba(37,99,235,0.35)' },
        { key: 'green', label: 'Emerald', desc: 'Fresh & natural', color: '#064e3b', gradient: 'linear-gradient(135deg,#064e3b,#059669)', shadow: 'rgba(5,150,105,0.35)' },
        { key: 'purple', label: 'Royal Purple', desc: 'Premium & creative', color: '#4a1d96', gradient: 'linear-gradient(135deg,#4a1d96,#7c3aed)', shadow: 'rgba(124,58,237,0.35)' },
        { key: 'orange', label: 'Sunset Orange', desc: 'Bold & energetic', color: '#7c2d12', gradient: 'linear-gradient(135deg,#7c2d12,#ea580c)', shadow: 'rgba(234,88,12,0.35)' },
        { key: 'dark', label: 'Dark Gold', desc: 'Sophisticated & premium', color: '#0f0c05', gradient: 'linear-gradient(135deg,#0f0c05,#c9a227)', shadow: 'rgba(201,162,39,0.35)' },
    ];

    const inputStyle = {
        width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0',
        borderRadius: '6px', fontSize: '13.5px', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', background: '#ffffff', fontFamily: 'system-ui, sans-serif',
        transition: 'border 0.2s, box-shadow 0.2s'
    };

    const labelStyle = {
        display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
    };

    const tabs = [
        { key: 'profile', label: 'School Profile', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> },
        { key: 'logo', label: 'School Logo', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> },
        { key: 'theme', label: 'Website Theme', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg> },
        { key: 'fonts', label: 'Fonts', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7M17 12l3 6m0 0l-3-6m3 6h-6"/></svg> },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .settings-section { animation: fadeInUp 0.35s ease forwards; }
                .settings-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* Hero Header */}
                <div style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '10px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.2)}` }}>
                    <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tc.secondary }}></div>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin / Settings</p>
                            </div>
                            <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '10px', letterSpacing: '-0.5px' }}>General Settings</h1>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '380px' }}>
                                Update profile, logo and theme for your school website.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {[
                                { label: 'School', value: profileData.name || '—', icon: <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> },
                                { label: 'Logo', value: settingsData.logo_url ? 'Uploaded ✓' : 'Not set', icon: <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> },
                                { label: 'Theme', value: settingsData.theme || 'default', icon: <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg> },
                            ].map((item, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1rem 1.25rem', minWidth: '120px', backdropFilter: 'blur(8px)' }}>
                                    <div style={{ width: '32px', height: '32px', background: hexToRgba(tc.primary, 0.4), borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>{item.icon}</div>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            style={{ padding: '10px 20px', borderRadius: '6px', border: activeTab === tab.key ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0', fontSize: '13px', cursor: 'pointer', background: activeTab === tab.key ? tc.light : '#ffffff', color: activeTab === tab.key ? tc.primary : '#64748b', fontWeight: activeTab === tab.key ? 600 : 400, display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.15s', boxShadow: activeTab === tab.key ? `0 4px 12px ${hexToRgba(tc.primary, 0.15)}` : 'none' }}>
                            <span style={{ color: activeTab === tab.key ? tc.primary : '#94a3b8' }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Profile Tab ── */}
                {activeTab === 'profile' && (
                    <div className="settings-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

                        {/* Basic Info */}
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Basic Information</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>School name and contact number</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>School Name</label>
                                    <input className="settings-input" type="text" name="name" value={profileData.name} onChange={handleProfileChange} placeholder="St. Mary's Convent School" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Phone Number</label>
                                    <input className="settings-input" type="text" name="phone" value={profileData.phone} onChange={handleProfileChange} placeholder="9876543210" style={inputStyle} />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Location</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>School address details</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Address</label>
                                    <input className="settings-input" type="text" name="address" value={profileData.address} onChange={handleProfileChange} placeholder="123 Main Street" style={inputStyle} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={labelStyle}>City</label>
                                        <input className="settings-input" type="text" name="city" value={profileData.city} onChange={handleProfileChange} placeholder="Jaipur" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>State</label>
                                        <input className="settings-input" type="text" name="state" value={profileData.state} onChange={handleProfileChange} placeholder="Rajasthan" style={inputStyle} />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Pincode</label>
                                    <input className="settings-input" type="text" name="pincode" value={profileData.pincode} onChange={handleProfileChange} placeholder="302001" style={inputStyle} />
                                </div>
                            </div>
                        </div>

                        {/* Intro Message — Full width */}
                        <div style={{ gridColumn: '1 / -1', background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#4a1d96,#7c3aed)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4V2m10 2V2M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Website Intro Animation</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Message shown as loading animation when visitors open your website</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem' }}>
                                <div>
                                    <label style={labelStyle}>Intro Message</label>
                                    <input
                                        className="settings-input"
                                        type="text"
                                        name="intro_message"
                                        value={profileData.intro_message}
                                        onChange={handleProfileChange}
                                        placeholder="e.g. WE INSPIRE · WE BELIEVE · WE ACHIEVE"
                                        style={{ ...inputStyle, fontSize: '16px', fontWeight: 600, letterSpacing: '0.08em' }}
                                    />
                                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <InfoIcon /> Keep it short and impactful — 2 to 5 words work best. E.g. "WE BELIEVE" or "EXCELLENCE IN EDUCATION"
                                    </p>
                                </div>

                                {/* Preview */}
                                {profileData.intro_message && (
                                    <div style={{ marginTop: '1rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative', height: '120px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, opacity: 0.15 }}></div>
                                        <p style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', position: 'relative', zIndex: 1 }}>
                                            {profileData.intro_message}
                                        </p>
                                        <p style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '10px', color: '#94a3b8' }}>Preview</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Save */}
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={handleProfileSave} disabled={saving}
                                style={{ padding: '12px 32px', background: saving ? hexToRgba(tc.primary, 0.5) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {saving ? <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving...</> : <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Save Profile</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Logo Tab ── */}
                {activeTab === 'logo' && (
                    <div className="settings-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Upload School Logo</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Shown in navbar and hero section</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div onClick={() => document.getElementById('schoolLogoInput').click()}
                                    style={{ border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: '2rem', textAlign: 'center', cursor: 'pointer', background: logoFile ? '#f8fafc' : '#fafafa', transition: 'all 0.2s' }}>
                                    {logoFile || settingsData.logo_url ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                            <img src={logoPreview || settingsData.logo_url} alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                            <p style={{ fontSize: '12px', color: '#64748b' }}>Click to change logo</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><BuildingIcon /></div>
                                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Click to upload school logo</p>
                                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>PNG, JPG, WEBP · Max 2MB · Transparent PNG recommended</p>
                                        </>
                                    )}
                                </div>
                                <input id="schoolLogoInput" type="file" accept="image/png,image/jpg,image/jpeg,image/webp" onChange={handleLogoChange} style={{ display: 'none' }} />
                                <div style={{ padding: '12px 14px', background: 'linear-gradient(135deg,#fdf0f5,#fff5f8)', borderRadius: '8px', border: '1px solid #f9c4d4' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 600, color: tc.primary, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}><InfoIcon /> Best practices</p>
                                    {['Use PNG with transparent background', 'Square format works best (1:1 ratio)', 'Minimum 200×200px resolution', 'Max file size: 2MB'].map((tip, i) => (
                                        <p key={i} style={{ fontSize: '11px', color: '#9f1239', marginBottom: '3px' }}>• {tip}</p>
                                    ))}
                                </div>
                                <button onClick={handleLogoUpload} disabled={uploadingLogo || !logoFile}
                                    style={{ padding: '11px', background: uploadingLogo || !logoFile ? hexToRgba(tc.primary, 0.3) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: uploadingLogo || !logoFile ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: !logoFile ? 'none' : `0 4px 14px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    {uploadingLogo ? <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Uploading...</> : <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>Upload Logo</>}
                                </button>
                            </div>
                        </div>

                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#064e3b,#059669)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Navbar Preview</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>How logo appears on school website</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem' }}>
                                <div style={{ background: 'rgba(2,6,23,0.95)', borderRadius: '8px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {logoPreview || settingsData.logo_url ? (
                                            <img src={logoPreview || settingsData.logo_url} alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '6px' }} />
                                        ) : (
                                            <div style={{ width: '36px', height: '36px', background: hexToRgba(tc.primary, 0.5), borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                                            </div>
                                        )}
                                        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }}></div>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{profileData.name || 'School Name'}</p>
                                    </div>
                                    <div style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', fontSize: '10px', color: '#ffffff', letterSpacing: '0.1em' }}>MENU ≡</div>
                                </div>
                                {settingsData.logo_url || logoPreview ? (
                                    <div style={{ padding: '10px 12px', background: '#f0fdf4', borderRadius: '8px', border: '0.5px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="14" height="14" fill="none" stroke="#15803d" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                        <p style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>{logoPreview ? 'New logo ready — click Upload' : 'Logo is live on your website ✓'}</p>
                                    </div>
                                ) : (
                                    <div style={{ padding: '10px 12px', background: '#fefce8', borderRadius: '8px', border: '0.5px solid #fde68a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="14" height="14" fill="none" stroke="#a16207" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                        <p style={{ fontSize: '12px', color: '#a16207', fontWeight: 500 }}>No logo uploaded — default icon showing</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Theme Tab ── */}
                {activeTab === 'theme' && (
                    <div className="settings-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#4a1d96,#7c3aed)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
                                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Choose Website Theme</p>
                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>Select color theme for your public school website</p>
                            </div>
                        </div>
                        <div style={{ padding: '1.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                                {themes.map(theme => {
                                    const isActive = settingsData.theme === theme.key;
                                    const isHovered = hoveredTheme === theme.key;
                                    return (
                                        <div key={theme.key} onClick={() => handleThemeSave(theme.key)} onMouseEnter={() => setHoveredTheme(theme.key)} onMouseLeave={() => setHoveredTheme(null)}
                                            style={{ borderRadius: '8px', border: isActive ? `2px solid ${theme.color}` : '0.5px solid #f1f5f9', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease', transform: isActive ? 'translateY(-4px)' : isHovered ? 'translateY(-2px)' : 'none', boxShadow: isActive ? `0 12px 32px ${theme.shadow}` : isHovered ? `0 8px 20px ${theme.shadow}` : '0 2px 8px rgba(0,0,0,0.04)' }}>
                                            <div style={{ height: '90px', background: theme.gradient, position: 'relative', overflow: 'hidden' }}>
                                                <div style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: '-30px', right: '-20px' }}></div>
                                                <div style={{ position: 'absolute', bottom: '12px', left: '14px', display: 'flex', gap: '5px' }}>
                                                    <div style={{ width: '32px', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.7)' }}></div>
                                                    <div style={{ width: '20px', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.35)' }}></div>
                                                </div>
                                                {isActive && <div style={{ position: 'absolute', top: '10px', right: '10px', width: '24px', height: '24px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" fill="none" stroke={theme.color} strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>}
                                            </div>
                                            <div style={{ padding: '12px 14px', background: '#ffffff' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: theme.gradient, flexShrink: 0 }}></div>
                                                    <p style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? theme.color : '#0f172a' }}>{theme.label}</p>
                                                </div>
                                                <p style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '18px' }}>{theme.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: '1.25rem', padding: '12px 16px', background: 'linear-gradient(135deg,#fdf0f5,#fff5f8)', borderRadius: '8px', border: '1px solid #f9c4d4', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: tc.primary }}><InfoIcon /></span>
                                <p style={{ fontSize: '12px', color: tc.primary, fontWeight: 500 }}>Theme changes reflect on your public website and admin panel immediately.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Fonts Tab ── */}
                {activeTab === 'fonts' && (
                    <div className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {[
                            { field: 'nav_font', title: 'Navbar Font', desc: 'Font for the school name shown in the navbar', gradient: 'linear-gradient(135deg,#1e3a5f,#2563eb)', shadow: 'rgba(37,99,235,0.3)' },
                            { field: 'heading_font', title: 'Homepage Heading Font', desc: 'Font for the big school name heading in the hero section', gradient: 'linear-gradient(135deg,#4a1d96,#7c3aed)', shadow: 'rgba(124,58,237,0.3)' },
                        ].map(section => (
                            <div key={section.field} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '38px', height: '38px', background: section.gradient, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${section.shadow}` }}>
                                        <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7M17 12l3 6m0 0l-3-6m3 6h-6"/></svg>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>{section.title}</p>
                                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{section.desc}</p>
                                    </div>
                                </div>
                                <div style={{ padding: '1.75rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                                        {FONT_OPTIONS.map(font => {
                                            const isActive = settingsData[section.field] === font.key;
                                            return (
                                                <div key={font.key} onClick={() => handleFontSave(section.field, font.key)}
                                                    style={{ borderRadius: '8px', border: isActive ? `2px solid ${tc.primary}` : '0.5px solid #f1f5f9', padding: '18px 14px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease', background: isActive ? tc.light : '#ffffff', boxShadow: isActive ? `0 8px 20px ${hexToRgba(tc.primary, 0.18)}` : '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}>
                                                    {isActive && <div style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', background: tc.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>}
                                                    <p style={{ fontFamily: font.family, fontSize: '30px', fontWeight: 700, color: isActive ? tc.primary : '#0f172a', marginBottom: '8px' }}>Aa</p>
                                                    <p style={{ fontFamily: font.family, fontSize: '13px', fontWeight: isActive ? 700 : 600, color: isActive ? tc.primary : '#334155', marginBottom: '2px' }}>{font.label}</p>
                                                    <p style={{ fontSize: '10.5px', color: '#94a3b8' }}>{font.desc}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg,#fdf0f5,#fff5f8)', borderRadius: '8px', border: '1px solid #f9c4d4', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: tc.primary }}><InfoIcon /></span>
                            <p style={{ fontSize: '12px', color: tc.primary, fontWeight: 500 }}>Font changes reflect on your public website immediately.</p>
                        </div>
                    </div>
                )}
            </div>

            {logoCropSrc && (
                <ImageCropModal
                    imageSrc={logoCropSrc}
                    aspect={1}
                    onCancel={() => setLogoCropSrc(null)}
                    onCropComplete={handleLogoCropConfirmed}
                />
            )}
        </>
    );
};

export default AdminSettings;