import { useEffect, useState } from 'react';
import { getSchoolProfileApi, updateSchoolProfileApi, updateSchoolSettingsApi, uploadSchoolLogoApi, uploadWelcomeBannerApi, uploadFooterBackgroundApi } from '../../api/school.api';
import useSchoolStore from '../../store/schoolStore';
import ImageCropModal from '../../components/common/ImageCropModal';
import { FONT_OPTIONS, GOOGLE_FONTS_URL, getFontFamily } from '../../constants/fonts';
import { BASE_COLOR_OPTIONS } from '../../constants/publicNav';
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
    const { tc, setTheme: setStoreTheme, setBaseTheme: setStoreBaseTheme } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [hoveredTheme, setHoveredTheme] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [removingLogo, setRemovingLogo] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoCropSrc, setLogoCropSrc] = useState(null);
    const [profileData, setProfileData] = useState({
        name: '', phone: '', phone2: '', address: '', city: '', state: '', pincode: '', intro_message: ''
    });
    const [settingsData, setSettingsData] = useState({
        theme: 'default', base_theme: 'white', logo_url: '', nav_font: 'inter'
    });
    const [bannerData, setBannerData] = useState({
        welcome_banner_enabled: false, welcome_banner_url: '', welcome_banner_link: ''
    });
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [bannerCropSrc, setBannerCropSrc] = useState(null);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [removingBanner, setRemovingBanner] = useState(false);
    const [togglingBanner, setTogglingBanner] = useState(false);
    const [savingBannerLink, setSavingBannerLink] = useState(false);

    const [footerBgUrl, setFooterBgUrl] = useState('');
    const [footerBgFile, setFooterBgFile] = useState(null);
    const [footerBgPreview, setFooterBgPreview] = useState(null);
    const [footerBgCropSrc, setFooterBgCropSrc] = useState(null);
    const [uploadingFooterBg, setUploadingFooterBg] = useState(false);
    const [removingFooterBg, setRemovingFooterBg] = useState(false);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await getSchoolProfileApi();
            const school = res.data;
            setProfileData({
                name: school.name || '',
                phone: school.phone || '',
                phone2: school.phone2 || '',
                address: school.address || '',
                city: school.city || '',
                state: school.state || '',
                pincode: school.pincode || '',
                intro_message: school.intro_message || '',
            });
            setSettingsData({
                theme: school.theme || 'default',
                base_theme: school.base_theme || 'white',
                logo_url: school.logo_url || '',
                nav_font: school.nav_font || 'inter',
            });
            setBannerData({
                welcome_banner_enabled: !!school.welcome_banner_enabled,
                welcome_banner_url: school.welcome_banner_url || '',
                welcome_banner_link: school.welcome_banner_link || '',
            });
            setFooterBgUrl(school.footer_bg_url || '');
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

    const handleBaseThemeSave = async (base_theme) => {
        setSaving(true);
        try {
            await updateSchoolSettingsApi({ base_theme });
            setSettingsData({ ...settingsData, base_theme });
            setStoreBaseTheme(base_theme);
            toast.success('Base color updated!');
        } catch (e) {
            toast.error('Failed to update base color');
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

    const handleLogoRemove = async () => {
        setRemovingLogo(true);
        try {
            await updateSchoolProfileApi({ logo_url: null });
            setSettingsData(prev => ({ ...prev, logo_url: '' }));
            setLogoFile(null);
            setLogoPreview(null);
            toast.success('Logo removed');
        } catch (e) {
            toast.error('Failed to remove logo');
        } finally {
            setRemovingLogo(false);
        }
    };

    // ── Welcome Banner (optional popup shown once on the homepage) ──
    const handleBannerFileChange = (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (file) setBannerCropSrc(URL.createObjectURL(file));
    };

    const handleBannerCropConfirmed = (croppedFile) => {
        setBannerCropSrc(null);
        setBannerFile(croppedFile);
        setBannerPreview(URL.createObjectURL(croppedFile));
    };

    const handleBannerUpload = async () => {
        if (!bannerFile) { toast.error('Please select a banner image'); return; }
        setUploadingBanner(true);
        try {
            const formData = new FormData();
            formData.append('welcomeBanner', bannerFile);
            const res = await uploadWelcomeBannerApi(formData);
            setBannerData(prev => ({ ...prev, welcome_banner_url: res.data.welcome_banner_url }));
            toast.success('Welcome banner uploaded successfully!');
            setBannerFile(null);
        } catch (e) {
            toast.error('Failed to upload banner');
        } finally {
            setUploadingBanner(false);
        }
    };

    const handleBannerRemove = async () => {
        setRemovingBanner(true);
        try {
            await updateSchoolProfileApi({ welcome_banner_url: null, welcome_banner_enabled: 0 });
            setBannerData(prev => ({ ...prev, welcome_banner_url: '', welcome_banner_enabled: false }));
            setBannerFile(null);
            setBannerPreview(null);
            toast.success('Banner image removed');
        } catch (e) {
            toast.error('Failed to remove banner image');
        } finally {
            setRemovingBanner(false);
        }
    };

    const handleBannerToggle = async () => {
        const next = !bannerData.welcome_banner_enabled;
        setTogglingBanner(true);
        try {
            await updateSchoolProfileApi({ welcome_banner_enabled: next ? 1 : 0 });
            setBannerData(prev => ({ ...prev, welcome_banner_enabled: next }));
            toast.success(next ? 'Welcome banner enabled' : 'Welcome banner disabled');
        } catch (e) {
            toast.error('Failed to update banner status');
        } finally {
            setTogglingBanner(false);
        }
    };

    const handleBannerLinkChange = (e) => {
        setBannerData(prev => ({ ...prev, welcome_banner_link: e.target.value }));
    };

    const handleBannerLinkSave = async () => {
        setSavingBannerLink(true);
        try {
            await updateSchoolProfileApi({ welcome_banner_link: bannerData.welcome_banner_link });
            toast.success('Link saved!');
        } catch (e) {
            toast.error('Failed to save link');
        } finally {
            setSavingBannerLink(false);
        }
    };

    // ── Footer Background (subtle background image behind the site footer) ──
    const handleFooterBgChange = (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (file) setFooterBgCropSrc(URL.createObjectURL(file));
    };

    const handleFooterBgCropConfirmed = (croppedFile) => {
        setFooterBgCropSrc(null);
        setFooterBgFile(croppedFile);
        setFooterBgPreview(URL.createObjectURL(croppedFile));
    };

    const handleFooterBgUpload = async () => {
        if (!footerBgFile) { toast.error('Please select a background image'); return; }
        setUploadingFooterBg(true);
        try {
            const formData = new FormData();
            formData.append('footerBg', footerBgFile);
            const res = await uploadFooterBackgroundApi(formData);
            setFooterBgUrl(res.data.footer_bg_url);
            toast.success('Footer background uploaded successfully!');
            setFooterBgFile(null);
        } catch (e) {
            toast.error('Failed to upload footer background');
        } finally {
            setUploadingFooterBg(false);
        }
    };

    const handleFooterBgRemove = async () => {
        setRemovingFooterBg(true);
        try {
            await updateSchoolProfileApi({ footer_bg_url: null });
            setFooterBgUrl('');
            setFooterBgFile(null);
            setFooterBgPreview(null);
            toast.success('Footer background removed');
        } catch (e) {
            toast.error('Failed to remove footer background');
        } finally {
            setRemovingFooterBg(false);
        }
    };

    const themes = [
        { key: 'default', label: 'Rose Pink', desc: 'Warm & elegant', color: '#8b2252', gradient: 'linear-gradient(135deg,#8b2252,#c9687e)', shadow: 'rgba(139,34,82,0.35)' },
        { key: 'blue', label: 'Ocean Blue', desc: 'Professional & trustworthy', color: '#1e3a5f', gradient: 'linear-gradient(135deg,#1e3a5f,#2563eb)', shadow: 'rgba(37,99,235,0.35)' },
        { key: 'green', label: 'Emerald', desc: 'Fresh & natural', color: '#064e3b', gradient: 'linear-gradient(135deg,#064e3b,#059669)', shadow: 'rgba(5,150,105,0.35)' },
        { key: 'purple', label: 'Royal Purple', desc: 'Premium & creative', color: '#4a1d96', gradient: 'linear-gradient(135deg,#4a1d96,#7c3aed)', shadow: 'rgba(124,58,237,0.35)' },
        { key: 'orange', label: 'Sunset Orange', desc: 'Bold & energetic', color: '#7c2d12', gradient: 'linear-gradient(135deg,#7c2d12,#ea580c)', shadow: 'rgba(234,88,12,0.35)' },
        { key: 'dark', label: 'Dark Gold', desc: 'Sophisticated & premium', color: '#0f0c05', gradient: 'linear-gradient(135deg,#0f0c05,#c9a227)', shadow: 'rgba(201,162,39,0.35)' },
        { key: 'beige', label: 'Warm Beige', desc: 'Sober & understated', color: '#7a624a', gradient: 'linear-gradient(135deg,#7a624a,#cbab7c)', shadow: 'rgba(122,98,74,0.35)' },
        { key: 'slate', label: 'Slate Gray', desc: 'Calm & minimal', color: '#414b56', gradient: 'linear-gradient(135deg,#414b56,#8b98a8)', shadow: 'rgba(65,75,86,0.35)' },
        { key: 'cream', label: 'Ivory Cream', desc: 'Soft & refined', color: '#9c8a63', gradient: 'linear-gradient(135deg,#9c8a63,#e6d7b0)', shadow: 'rgba(156,138,99,0.35)' },
        { key: 'red', label: 'Crimson Red', desc: 'Bold & passionate', color: '#7f1d1d', gradient: 'linear-gradient(135deg,#7f1d1d,#dc2626)', shadow: 'rgba(220,38,38,0.35)' },
        { key: 'teal', label: 'Deep Teal', desc: 'Fresh & modern', color: '#134e4a', gradient: 'linear-gradient(135deg,#134e4a,#0d9488)', shadow: 'rgba(13,148,136,0.35)' },
        { key: 'navy', label: 'Midnight Navy', desc: 'Sharp & authoritative', color: '#0f1c3f', gradient: 'linear-gradient(135deg,#0f1c3f,#3b5bdb)', shadow: 'rgba(59,91,219,0.35)' },
        { key: 'olive', label: 'Olive Forest', desc: 'Earthy & grounded', color: '#1f2e0a', gradient: 'linear-gradient(135deg,#1f2e0a,#65a30d)', shadow: 'rgba(101,163,13,0.35)' },
        { key: 'cyan', label: 'Turquoise Cyan', desc: 'Vibrant & lively', color: '#0e3b45', gradient: 'linear-gradient(135deg,#0e3b45,#0891b2)', shadow: 'rgba(8,145,178,0.35)' },
        { key: 'amber', label: 'Amber Gold', desc: 'Warm & inviting', color: '#78350f', gradient: 'linear-gradient(135deg,#78350f,#f59e0b)', shadow: 'rgba(245,158,11,0.35)' },
        { key: 'charcoal', label: 'Charcoal Black', desc: 'Sleek & modern', color: '#18181b', gradient: 'linear-gradient(135deg,#18181b,#71717a)', shadow: 'rgba(113,113,122,0.35)' },
        { key: 'lavender', label: 'Lavender Violet', desc: 'Gentle & creative', color: '#3f2d63', gradient: 'linear-gradient(135deg,#3f2d63,#a78bfa)', shadow: 'rgba(167,139,250,0.35)' },
        { key: 'coral', label: 'Coral Blush', desc: 'Warm & welcoming', color: '#7c2d3d', gradient: 'linear-gradient(135deg,#7c2d3d,#fb7185)', shadow: 'rgba(251,113,133,0.35)' },
        { key: 'plainCream', label: 'Plain Cream', desc: 'Soft & neutral', color: '#8a7550', gradient: 'linear-gradient(135deg,#8a7550,#f3ecd9)', shadow: 'rgba(138,117,80,0.35)' },
        { key: 'mustard', label: 'Mustard Yellow', desc: 'Cheerful & vibrant', color: '#7a5c00', gradient: 'linear-gradient(135deg,#7a5c00,#eab308)', shadow: 'rgba(234,179,8,0.35)' },
        { key: 'indigo', label: 'Indigo', desc: 'Deep & modern', color: '#312e81', gradient: 'linear-gradient(135deg,#312e81,#6366f1)', shadow: 'rgba(99,102,241,0.35)' },
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
        { key: 'baseColor', label: 'Base Color', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg> },
        { key: 'fonts', label: 'Fonts', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7M17 12l3 6m0 0l-3-6m3 6h-6"/></svg> },
        { key: 'welcomeBanner', label: 'Welcome Banner', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg> },
        { key: 'footerBg', label: 'Footer Background', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M4 15l4-4a2 2 0 012.8 0L16 16m-3-3l1.6-1.6a2 2 0 012.8 0L20 14"/></svg> },
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
                @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes drift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-24px, 18px) scale(1.08); } }
                .settings-section { animation: fadeInUp 0.35s ease forwards; }
                .settings-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; }
                .settings-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .settings-hero-orb { animation: drift1 9s ease-in-out infinite; }
                @media (max-width: 900px) {
                    .settings-3col { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 700px) {
                    .settings-section[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
                    .settings-3col { grid-template-columns: 1fr !important; }
                }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* Hero Header */}
                <div style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.5rem 2.75rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 20px 60px ${hexToRgba(tc.primary, 0.2)}, 0 4px 20px rgba(0,0,0,0.15)` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div className="settings-hero-orb" style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div className="settings-hero-item" style={{ animationDelay: '0.05s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tc.secondary }}></div>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin / Settings</p>
                            </div>
                            <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '10px', letterSpacing: '-0.5px' }}>General Settings</h1>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '460px' }}>
                                Manage how your school is presented online — profile details, branding and the visual identity of your public website.
                            </p>
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
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
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
                                    <input className="settings-input" type="text" name="name" value={profileData.name} onChange={handleProfileChange} placeholder="Enter School Name" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Phone Number</label>
                                    <input className="settings-input" type="text" name="phone" value={profileData.phone} onChange={handleProfileChange} placeholder="Enter Phone Number" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Alternate Phone Number</label>
                                    <input className="settings-input" type="text" name="phone2" value={profileData.phone2} onChange={handleProfileChange} placeholder="Enter Alternate Phone Number" style={inputStyle} />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
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
                                    <input className="settings-input" type="text" name="address" value={profileData.address} onChange={handleProfileChange} placeholder="Enter Street Address" style={inputStyle} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={labelStyle}>City</label>
                                        <input className="settings-input" type="text" name="city" value={profileData.city} onChange={handleProfileChange} placeholder="Enter City" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>State</label>
                                        <input className="settings-input" type="text" name="state" value={profileData.state} onChange={handleProfileChange} placeholder="Enter State" style={inputStyle} />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Pincode</label>
                                    <input className="settings-input" type="text" name="pincode" value={profileData.pincode} onChange={handleProfileChange} placeholder="Enter Pincode" style={inputStyle} />
                                </div>
                            </div>
                        </div>

                        {/* Intro Message — Full width */}
                        <div style={{ gridColumn: '1 / -1', background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#4a1d96,#7c3aed)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
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
                                        placeholder="Enter Intro Message"
                                        style={{ ...inputStyle, fontSize: '16px', fontWeight: 600, letterSpacing: '0.08em' }}
                                    />
                                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <InfoIcon /> Keep it short and impactful — 2 to 5 words work best. E.g. "WE BELIEVE" or "EXCELLENCE IN EDUCATION"
                                    </p>
                                </div>

                                {/* Preview */}
                                {profileData.intro_message && (
                                    <div style={{ marginTop: '1rem', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative', height: '120px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Upload School Logo</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Shown in navbar and hero section</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div onClick={() => document.getElementById('schoolLogoInput').click()}
                                    style={{ position: 'relative', border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: '2rem', textAlign: 'center', cursor: 'pointer', background: logoFile ? '#f8fafc' : '#fafafa', transition: 'all 0.2s' }}>
                                    {logoFile || settingsData.logo_url ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                            <img src={logoPreview || settingsData.logo_url} alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                            <p style={{ fontSize: '12px', color: '#64748b' }}>Click to change logo</p>
                                            {settingsData.logo_url && !logoFile && (
                                                <button type="button" onClick={e => { e.stopPropagation(); handleLogoRemove(); }} disabled={removingLogo}
                                                    style={{ position: 'absolute', top: '10px', right: '10px', width: '26px', height: '26px', background: 'rgba(15,23,42,0.7)', color: '#fff', border: 'none', borderRadius: '50%', cursor: removingLogo ? 'wait' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Remove logo">×</button>
                                            )}
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

                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#064e3b,#059669)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
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
                    <div className="settings-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#4a1d96,#7c3aed)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
                                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Choose Website Theme</p>
                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>Select color theme for your public school website</p>
                            </div>
                        </div>
                        <div style={{ padding: '1.75rem' }}>
                            <div className="settings-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
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

                {/* ── Base Color Tab — independent of the accent theme above. Controls the
                     site's overall background + card shades (previously hardcoded white), so
                     the two can be mixed and matched (e.g. Ocean Blue accent + Cream base). ── */}
                {activeTab === 'baseColor' && (
                    <div className="settings-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#9c8a63,#e6d7b0)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(156,138,99,0.3)' }}>
                                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Choose Base Color</p>
                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>The main background of your public website — cards and sections pick up a matching shade</p>
                            </div>
                        </div>
                        <div style={{ padding: '1.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
                                {BASE_COLOR_OPTIONS.map(base => {
                                    const isActive = settingsData.base_theme === base.key;
                                    return (
                                        <div key={base.key} onClick={() => handleBaseThemeSave(base.key)}
                                            style={{ borderRadius: '8px', border: isActive ? `2px solid ${tc.primary}` : '0.5px solid #f1f5f9', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease', transform: isActive ? 'translateY(-4px)' : 'none', boxShadow: isActive ? `0 12px 32px ${hexToRgba(tc.primary, 0.18)}` : '0 2px 8px rgba(0,0,0,0.04)' }}>
                                            <div style={{ height: '64px', background: base.surface, position: 'relative', borderBottom: '1px solid #f1f5f9' }}>
                                                <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', height: '22px', borderRadius: '5px', background: base.card, border: '1px solid rgba(0,0,0,0.04)' }}></div>
                                                {isActive && <div style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', background: tc.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>}
                                            </div>
                                            <div style={{ padding: '10px 12px', background: '#ffffff' }}>
                                                <p style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? tc.primary : '#0f172a' }}>{base.label}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Fonts Tab ── */}
                {activeTab === 'fonts' && (
                    <div className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {[
                            { field: 'nav_font', title: 'Navbar Font', desc: 'Font for the school name shown in the navbar', gradient: 'linear-gradient(135deg,#1e3a5f,#2563eb)', shadow: 'rgba(37,99,235,0.3)' },
                        ].map(section => (
                            <div key={section.field} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '38px', height: '38px', background: section.gradient, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${section.shadow}` }}>
                                        <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7M17 12l3 6m0 0l-3-6m3 6h-6"/></svg>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>{section.title}</p>
                                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{section.desc}</p>
                                    </div>
                                </div>
                                <div style={{ padding: '1.75rem' }}>
                                    <div className="settings-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
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
                            <p style={{ fontSize: '12px', color: tc.primary, fontWeight: 500 }}>Font changes reflect on your public website immediately. Looking for the homepage heading font? That's now set from the Home page module, alongside its color.</p>
                        </div>
                    </div>
                )}

                {/* ── Welcome Banner Tab — optional popup poster shown once on the homepage ── */}
                {activeTab === 'welcomeBanner' && (
                    <div className="settings-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Welcome Banner Popup</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Optional — a promotional poster (e.g. admissions open) shown once when a visitor opens your homepage</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                {/* Enable/disable */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: bannerData.welcome_banner_enabled ? '#f0fdf4' : '#f8fafc', border: `1px solid ${bannerData.welcome_banner_enabled ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '8px' }}>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Show Welcome Banner</p>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Popup appears once per visit on your homepage</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleBannerToggle}
                                        disabled={togglingBanner || (!bannerData.welcome_banner_url && !bannerData.welcome_banner_enabled)}
                                        title={!bannerData.welcome_banner_url && !bannerData.welcome_banner_enabled ? 'Upload a banner image first' : ''}
                                        style={{
                                            width: '42px', height: '23px', borderRadius: '999px', border: 'none',
                                            cursor: togglingBanner ? 'wait' : 'pointer',
                                            background: bannerData.welcome_banner_enabled ? tc.primary : '#e2e8f0',
                                            position: 'relative', transition: 'background 0.2s', flexShrink: 0, padding: 0,
                                            opacity: (!bannerData.welcome_banner_url && !bannerData.welcome_banner_enabled) ? 0.5 : 1,
                                        }}>
                                        <span style={{
                                            position: 'absolute', top: '2.5px', left: bannerData.welcome_banner_enabled ? '21px' : '3px',
                                            width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                        }} />
                                    </button>
                                </div>

                                {/* Image upload */}
                                <div>
                                    <label style={labelStyle}>Banner Image</label>
                                    <div onClick={() => document.getElementById('welcomeBannerInput').click()}
                                        style={{ position: 'relative', border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: bannerPreview || bannerData.welcome_banner_url ? 0 : '2rem', textAlign: 'center', cursor: 'pointer', background: bannerFile ? '#f8fafc' : '#fafafa', overflow: 'hidden', transition: 'all 0.2s' }}>
                                        {bannerPreview || bannerData.welcome_banner_url ? (
                                            <>
                                                <img src={bannerPreview || bannerData.welcome_banner_url} alt="Welcome banner" style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', display: 'block', background: '#0f172a' }} />
                                                {bannerData.welcome_banner_url && !bannerFile && (
                                                    <button type="button" onClick={e => { e.stopPropagation(); handleBannerRemove(); }} disabled={removingBanner}
                                                        style={{ position: 'absolute', top: '10px', right: '10px', width: '26px', height: '26px', background: 'rgba(15,23,42,0.7)', color: '#fff', border: 'none', borderRadius: '50%', cursor: removingBanner ? 'wait' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        title="Remove banner image">×</button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🖼️</div>
                                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Click to upload your banner poster</p>
                                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>JPG, PNG, WEBP · Max 5MB · Full poster image (logo, text, photos all baked in)</p>
                                            </>
                                        )}
                                    </div>
                                    <input id="welcomeBannerInput" type="file" accept="image/png,image/jpg,image/jpeg,image/webp" onChange={handleBannerFileChange} style={{ display: 'none' }} />
                                    {bannerPreview && (
                                        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>New image ready — click "Upload Banner" below to save it.</p>
                                    )}
                                </div>

                                <button onClick={handleBannerUpload} disabled={uploadingBanner || !bannerFile}
                                    style={{ padding: '11px', background: uploadingBanner || !bannerFile ? hexToRgba(tc.primary, 0.3) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: uploadingBanner || !bannerFile ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: !bannerFile ? 'none' : `0 4px 14px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    {uploadingBanner ? <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Uploading...</> : <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>Upload Banner</>}
                                </button>

                                {/* Click-through link */}
                                <div>
                                    <label style={labelStyle}>Click-through Link (optional)</label>
                                    <input className="settings-input" type="text" value={bannerData.welcome_banner_link} onChange={handleBannerLinkChange} placeholder="Enter Link URL (e.g. admission form link)" style={inputStyle} />
                                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <InfoIcon /> Clicking the banner opens this link in a new tab. Leave blank if the poster is just informational.
                                    </p>
                                </div>
                                <button onClick={handleBannerLinkSave} disabled={savingBannerLink}
                                    style={{ padding: '11px', background: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: savingBannerLink ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
                                    {savingBannerLink ? 'Saving...' : 'Save Link'}
                                </button>
                            </div>
                        </div>

                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#064e3b,#059669)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Live Preview</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>How the popup appears to visitors</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem' }}>
                                {bannerPreview || bannerData.welcome_banner_url ? (
                                    <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: 'rgba(2,6,23,0.9)', padding: '1.5rem' }}>
                                        <div style={{ position: 'relative', maxWidth: '260px', margin: '0 auto', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                                            <img src={bannerPreview || bannerData.welcome_banner_url} alt="Preview" style={{ width: '100%', display: 'block' }} />
                                            <div style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>×</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: '2.5rem', textAlign: 'center', border: '1.5px dashed #e2e8f0', borderRadius: '12px', background: '#fafafa' }}>
                                        <p style={{ fontSize: '13px', color: '#94a3b8' }}>Upload a banner image to see the preview</p>
                                    </div>
                                )}
                                <div style={{ marginTop: '14px', padding: '10px 12px', background: bannerData.welcome_banner_enabled ? '#f0fdf4' : '#fefce8', borderRadius: '8px', border: `0.5px solid ${bannerData.welcome_banner_enabled ? '#bbf7d0' : '#fde68a'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {bannerData.welcome_banner_enabled ? (
                                        <>
                                            <svg width="14" height="14" fill="none" stroke="#15803d" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                            <p style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>Live — shown once per visit on your homepage ✓</p>
                                        </>
                                    ) : (
                                        <>
                                            <svg width="14" height="14" fill="none" stroke="#a16207" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                            <p style={{ fontSize: '12px', color: '#a16207', fontWeight: 500 }}>Disabled — not shown on your website</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Footer Background Tab — subtle background image behind the site footer ── */}
                {activeTab === 'footerBg' && (
                    <div className="settings-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M4 15l4-4a2 2 0 012.8 0L16 16m-3-3l1.6-1.6a2 2 0 012.8 0L20 14"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Footer Background</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Optional — a faint background image shown behind your site's footer (school building, campus photo, etc.)</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div onClick={() => document.getElementById('footerBgInput').click()}
                                    style={{ position: 'relative', border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: footerBgPreview || footerBgUrl ? 0 : '2rem', textAlign: 'center', cursor: 'pointer', background: footerBgFile ? '#f8fafc' : '#fafafa', overflow: 'hidden', transition: 'all 0.2s' }}>
                                    {footerBgPreview || footerBgUrl ? (
                                        <>
                                            <img src={footerBgPreview || footerBgUrl} alt="Footer background" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
                                            {footerBgUrl && !footerBgFile && (
                                                <button type="button" onClick={e => { e.stopPropagation(); handleFooterBgRemove(); }} disabled={removingFooterBg}
                                                    style={{ position: 'absolute', top: '10px', right: '10px', width: '26px', height: '26px', background: 'rgba(15,23,42,0.7)', color: '#fff', border: 'none', borderRadius: '50%', cursor: removingFooterBg ? 'wait' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Remove footer background">×</button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏫</div>
                                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Click to upload a footer background image</p>
                                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>JPG, PNG, WEBP · Max 5MB · Wide/landscape photos work best</p>
                                        </>
                                    )}
                                </div>
                                <input id="footerBgInput" type="file" accept="image/png,image/jpg,image/jpeg,image/webp" onChange={handleFooterBgChange} style={{ display: 'none' }} />
                                {footerBgPreview && (
                                    <p style={{ fontSize: '11px', color: '#64748b' }}>New image ready — click "Upload Background" below to save it.</p>
                                )}
                                <button onClick={handleFooterBgUpload} disabled={uploadingFooterBg || !footerBgFile}
                                    style={{ padding: '11px', background: uploadingFooterBg || !footerBgFile ? hexToRgba(tc.primary, 0.3) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: uploadingFooterBg || !footerBgFile ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: !footerBgFile ? 'none' : `0 4px 14px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    {uploadingFooterBg ? <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Uploading...</> : <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>Upload Background</>}
                                </button>
                            </div>
                        </div>

                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#064e3b,#059669)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Footer Preview</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>How the image sits behind your footer (shown faded)</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem' }}>
                                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#222831', padding: '2rem 1.5rem', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    {(footerBgPreview || footerBgUrl) && (
                                        <img src={footerBgPreview || footerBgUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18 }} />
                                    )}
                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        <p style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#ffffff', marginBottom: '6px' }}>{profileData.name || 'School Name'}</p>
                                        <p style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.45)' }}>© {new Date().getFullYear()} · Powered by Web Builder Pro</p>
                                    </div>
                                </div>
                                {footerBgUrl || footerBgPreview ? (
                                    <div style={{ marginTop: '14px', padding: '10px 12px', background: '#f0fdf4', borderRadius: '8px', border: '0.5px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="14" height="14" fill="none" stroke="#15803d" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                        <p style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>{footerBgPreview ? 'New image ready — click Upload' : 'Footer background is live on your website ✓'}</p>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '14px', padding: '10px 12px', background: '#fefce8', borderRadius: '8px', border: '0.5px solid #fde68a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="14" height="14" fill="none" stroke="#a16207" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                        <p style={{ fontSize: '12px', color: '#a16207', fontWeight: 500 }}>No background set — footer stays a plain solid color</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {footerBgCropSrc && (
                <ImageCropModal
                    imageSrc={footerBgCropSrc}
                    aspect={null}
                    onCancel={() => setFooterBgCropSrc(null)}
                    onCropComplete={handleFooterBgCropConfirmed}
                    outputFormat="image/png"
                />
            )}

            {logoCropSrc && (
                <ImageCropModal
                    imageSrc={logoCropSrc}
                    aspect={null}
                    onCancel={() => setLogoCropSrc(null)}
                    onCropComplete={handleLogoCropConfirmed}
                    outputFormat="image/png"
                />
            )}

            {bannerCropSrc && (
                <ImageCropModal
                    imageSrc={bannerCropSrc}
                    aspect={null}
                    onCancel={() => setBannerCropSrc(null)}
                    onCropComplete={handleBannerCropConfirmed}
                    outputFormat="image/png"
                />
            )}
        </>
    );
};

export default AdminSettings;