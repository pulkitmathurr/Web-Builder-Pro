import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSchoolProfileApi, getSelectedModulesApi } from '../../api/school.api';
import { moduleRegistry } from '../../config/moduleRegistry';
import useAuthStore from '../../store/authStore';
import useSchoolStore from '../../store/schoolStore';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { tc } = useSchoolStore();
    const [school, setSchool] = useState(null);
    const [selectedModules, setSelectedModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredAction, setHoveredAction] = useState(null);
    const [hoveredModule, setHoveredModule] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, modulesRes] = await Promise.all([
                getSchoolProfileApi(),
                getSelectedModulesApi()
            ]);
            setSchool(profileRes.data);
            const mods = modulesRes.data.selectedModules;
            setSelectedModules(typeof mods === 'string' ? JSON.parse(mods) : (mods || []));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const stats = [
        {
            label: 'Active Modules',
            value: selectedModules.length,
            sub: 'Pages on your website',
            gradient: `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
            icon: <svg width="22" height="22" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>,
        },
        {
            label: 'Website Status',
            value: school?.status === 'active' ? 'Live' : 'Pending',
            sub: school?.status === 'active' ? 'Visible to all visitors' : 'Not yet live',
            gradient: school?.status === 'active' ? 'linear-gradient(135deg, #064e3b 0%, #059669 100%)' : 'linear-gradient(135deg, #92400e 0%, #d97706 100%)',
            icon: <svg width="22" height="22" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>,
        },
        {
            label: 'School Slug',
            value: school?.slug || '—',
            sub: 'Your unique website URL',
            gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
            icon: <svg width="22" height="22" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
        },
        {
            label: 'Theme',
            value: school?.theme || 'default',
            sub: 'Active color theme',
            gradient: 'linear-gradient(135deg, #4a1d96 0%, #7c3aed 100%)',
            icon: <svg width="22" height="22" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>,
        },
    ];

    const quickActions = [
        {
            label: 'General Settings',
            desc: 'Update school profile and info',
            path: '/admin/settings',
            gradient: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`,
            shadowColor: hexToRgba(tc.primary, 0.3),
            icon: <svg width="20" height="20" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
        },
        {
            label: 'Manage Modules',
            desc: 'Add or remove website pages',
            path: '/admin/modules/select',
            gradient: 'linear-gradient(135deg, #064e3b, #059669)',
            shadowColor: 'rgba(5,150,105,0.3)',
            icon: <svg width="20" height="20" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>,
        },
        {
            label: 'Contact Us',
            desc: 'Update address and social links',
            path: '/admin/contact',
            gradient: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
            shadowColor: 'rgba(37,99,235,0.3)',
            icon: <svg width="20" height="20" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
        },
    ];

    return (
        <>
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .dash-stat { animation: fadeInUp 0.4s ease forwards; }
                .dash-stat:nth-child(1) { animation-delay: 0.05s; opacity: 0; }
                .dash-stat:nth-child(2) { animation-delay: 0.1s; opacity: 0; }
                .dash-stat:nth-child(3) { animation-delay: 0.15s; opacity: 0; }
                .dash-stat:nth-child(4) { animation-delay: 0.2s; opacity: 0; }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* Welcome Hero */}
                <div style={{
                    background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`,
                    borderRadius: '10px',
                    padding: '2.5rem 2.5rem',
                    marginBottom: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 20px 60px ${hexToRgba(tc.primary, 0.25)}, 0 4px 20px rgba(0,0,0,0.15)`
                }}>
                    {/* Animated bg blobs */}
                    <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.3)} 0%, transparent 70%)`, top: '-150px', right: '5%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', width: '250px', height: '250px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.secondary, 0.2)} 0%, transparent 70%)`, bottom: '-100px', right: '35%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.15)} 0%, transparent 70%)`, top: '20%', left: '40%', pointerEvents: 'none' }}></div>

                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tc.secondary, animation: 'pulse 2s infinite' }}></div>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    {getGreeting()}
                                </p>
                            </div>
                            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', marginBottom: '10px', lineHeight: 1.15, letterSpacing: '-0.5px' }}>
                                {user?.name?.split(' ')[0] || 'Admin'}
                            </h1>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '400px' }}>
                                Welcome to your admin panel. Manage your school website content, modules and settings from here.
                            </p>
                        </div>

                        {/* School Card */}
                        <div style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '1.25rem 1.5rem',
                            display: 'flex', alignItems: 'center', gap: '16px',
                            backdropFilter: 'blur(10px)',
                            minWidth: '240px'
                        }}>
                            {school?.logo_url ? (
                                <img src={school.logo_url} alt="School" style={{ width: '52px', height: '52px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                            ) : (
                                <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                                    <svg width="24" height="24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                    </svg>
                                </div>
                            )}
                            <div>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '6px', lineHeight: 1.3 }}>{school?.name}</p>
                                <span style={{
                                    fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 600,
                                    background: school?.status === 'active' ? 'rgba(21,128,61,0.25)' : 'rgba(161,98,7,0.25)',
                                    color: school?.status === 'active' ? '#86efac' : '#fde68a',
                                    border: school?.status === 'active' ? '1px solid rgba(134,239,172,0.2)' : '1px solid rgba(253,230,138,0.2)'
                                }}>
                                    {school?.status === 'active' ? '● Live' : '● Pending'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '1.5rem' }}>
                    {stats.map((s, i) => (
                        <div
                            key={i}
                            className="dash-stat"
                            style={{
                                background: '#ffffff',
                                borderRadius: '8px',
                                padding: '1.5rem',
                                border: '0.5px solid #f1f5f9',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'default'
                            }}
                        >
                            {/* Top accent line */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: s.gradient, borderRadius: '8px 8px 0 0' }}></div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                                <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', flexShrink: 0 }}>
                                    {s.icon}
                                </div>
                            </div>
                            <p style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', lineHeight: 1 }}>{s.value}</p>
                            <p style={{ fontSize: '12px', color: '#94a3b8' }}>{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Bottom Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '1.25rem' }}>

                    {/* Quick Actions */}
                    <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '4px', height: '16px', background: tc.primary, borderRadius: '2px', display: 'inline-block' }}></span>
                            Quick Actions
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {quickActions.map((action, i) => (
                                <div
                                    key={i}
                                    onClick={() => navigate(action.path)}
                                    onMouseEnter={() => setHoveredAction(i)}
                                    onMouseLeave={() => setHoveredAction(null)}
                                    style={{
                                        padding: '14px 16px',
                                        background: '#ffffff',
                                        border: hoveredAction === i ? '0.5px solid #e2e8f0' : '0.5px solid #f1f5f9',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        transform: hoveredAction === i ? 'translateX(6px) translateY(-1px)' : 'none',
                                        boxShadow: hoveredAction === i ? `0 8px 24px ${action.shadowColor}` : '0 1px 4px rgba(0,0,0,0.04)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '12px',
                                        background: action.gradient,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: `0 4px 12px ${action.shadowColor}`,
                                        flexShrink: 0,
                                        transition: 'transform 0.2s',
                                        transform: hoveredAction === i ? 'scale(1.1) rotate(-3deg)' : 'scale(1)'
                                    }}>
                                        {action.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>{action.label}</p>
                                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{action.desc}</p>
                                    </div>
                                    <svg style={{ color: hoveredAction === i ? tc.primary : '#cbd5e1', transition: 'all 0.2s', transform: hoveredAction === i ? 'translateX(3px)' : 'none', flexShrink: 0 }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Modules */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '4px', height: '16px', background: tc.primary, borderRadius: '2px', display: 'inline-block' }}></span>
                                Active Modules
                                <span style={{ fontSize: '11px', background: tc.light, color: tc.primary, padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                                    {selectedModules.length}
                                </span>
                            </p>
                            <span
                                onClick={() => navigate('/admin/modules/select')}
                                style={{ fontSize: '12px', color: tc.primary, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                                Manage
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                                </svg>
                            </span>
                        </div>

                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                            {selectedModules.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center' }}>
                                    <div style={{ width: '48px', height: '48px', background: tc.light, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                        <svg width="24" height="24" fill="none" stroke={tc.primary} strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: 500 }}>No modules selected</p>
                                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>Add pages to your school website</p>
                                    <button onClick={() => navigate('/admin/modules/select')} style={{ padding: '8px 20px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                                        Select Modules
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
                                    {selectedModules.slice(0, 10).map((key, i) => {
                                        const mod = moduleRegistry.find(m => m.key === key);
                                        if (!mod) return null;
                                        return (
                                            <div
                                                key={key}
                                                onClick={() => navigate(`/admin/module/${key}`)}
                                                onMouseEnter={() => setHoveredModule(key)}
                                                onMouseLeave={() => setHoveredModule(null)}
                                                style={{
                                                    padding: '18px 8px',
                                                    borderRight: (i + 1) % 5 !== 0 ? '0.5px solid #f8fafc' : 'none',
                                                    borderBottom: i < selectedModules.slice(0, 10).length - 5 ? '0.5px solid #f8fafc' : 'none',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                                    cursor: 'pointer',
                                                    background: hoveredModule === key ? tc.light : 'transparent',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <div style={{
                                                    width: '36px', height: '36px',
                                                    borderRadius: '10px',
                                                    background: hoveredModule === key ? `linear-gradient(135deg,${tc.primary},${tc.secondary})` : '#f8fafc',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s',
                                                    boxShadow: hoveredModule === key ? `0 4px 12px ${hexToRgba(tc.primary, 0.25)}` : 'none',
                                                    transform: hoveredModule === key ? 'scale(1.1)' : 'scale(1)',
                                                    color: hoveredModule === key ? '#ffffff' : tc.primary,
                                                }}>
                                                    {mod.icon}
                                                </div>
                                                <span style={{ fontSize: '10px', color: hoveredModule === key ? tc.primary : '#64748b', textAlign: 'center', lineHeight: 1.3, fontWeight: hoveredModule === key ? 600 : 400 }}>
                                                    {mod.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {selectedModules.length > 10 && (
                                <div style={{ padding: '12px', textAlign: 'center', borderTop: '0.5px solid #f8fafc', background: '#fafafa' }}>
                                    <span onClick={() => navigate('/admin/modules/select')} style={{ fontSize: '12px', color: tc.primary, cursor: 'pointer', fontWeight: 600 }}>
                                        +{selectedModules.length - 10} more modules →
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;