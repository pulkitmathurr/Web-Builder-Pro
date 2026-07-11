import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStatsApi } from '../../api/superAdmin.api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const res = await getDashboardStatsApi();
            setStats(res.data);
        } catch (e) {
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const statusColor = (status) => {
        if (status === 'active') return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
        if (status === 'pending') return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '44px', height: '44px', border: '3px solid rgba(10,10,10,0.1)', borderTop: '3px solid #0a0a0a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }}></div>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading dashboard...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .dash-section { animation: fadeInUp 0.4s ease forwards; opacity: 0; }
                .dash-section:nth-child(1) { animation-delay: 0.05s; }
                .dash-section:nth-child(2) { animation-delay: 0.12s; }
                .dash-section:nth-child(3) { animation-delay: 0.19s; }
                .dash-section:nth-child(4) { animation-delay: 0.26s; }
                .stat-card { transition: all 0.25s ease; }
                .stat-card:hover { transform: translateY(-4px); }
                .action-card { transition: all 0.2s ease; cursor: pointer; }
                .action-card:hover { transform: translateY(-3px); }
                .school-row { transition: background 0.15s; }
                .school-row:hover { background: #fafafa !important; }
                .mono-shimmer {
                    background: linear-gradient(90deg, #ffffff 0%, #9a9a9a 50%, #ffffff 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 3s linear infinite;
                }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* ── Hero Header ── */}
                <div className="dash-section" style={{
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 40%, #000000 100%)',
                    borderRadius: '16px', padding: '2.5rem', marginBottom: '1.75rem',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.2)'
                }}>
                    {/* BG decorations */}
                    <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', top: '-150px', right: '5%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', bottom: '-60px', right: '35%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>

                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }}></div>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                    Super Admin Panel
                                </p>
                            </div>
                            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                                {getGreeting()}, <span className="mono-shimmer">{user?.name || 'Admin'}</span> 👋
                            </h1>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, maxWidth: '420px' }}>
                                Manage all schools, admins and platform settings from your control center.
                            </p>
                        </div>

                        {/* Quick stats in header */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {[
                                { label: 'Total Schools', value: stats?.total_schools || 0, icon: <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> },
                                { label: 'Active', value: stats?.active_schools || 0, icon: <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
                                { label: 'Admins', value: stats?.total_admins || 0, icon: <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
                            ].map((item, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '1rem 1.25rem', minWidth: '120px', backdropFilter: 'blur(8px)' }}>
                                    <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.12)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                                        {item.icon}
                                    </div>
                                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '2px', lineHeight: 1 }}>{item.value}</p>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Stats Grid ── */}
                <div className="dash-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
                    {[
                        { label: 'Total Schools', value: stats?.total_schools || 0, sub: 'All registered schools', gradient: 'linear-gradient(135deg,#0a0a0a,#262626)', accent: '#ffffff', icon: <svg width="22" height="22" fill="none" stroke="#ffffff" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> },
                        { label: 'Active Schools', value: stats?.active_schools || 0, sub: 'Currently live', gradient: 'linear-gradient(135deg,#171717,#333333)', accent: '#e5e5e5', icon: <svg width="22" height="22" fill="none" stroke="#e5e5e5" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
                        { label: 'Pending Schools', value: stats?.pending_schools || 0, sub: 'Awaiting activation', gradient: 'linear-gradient(135deg,#0a0a0a,#2b2b2b)', accent: '#d4d4d4', icon: <svg width="22" height="22" fill="none" stroke="#d4d4d4" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
                        { label: 'Total Admins', value: stats?.total_admins || 0, sub: 'School administrators', gradient: 'linear-gradient(135deg,#1a1a1a,#3a3a3a)', accent: '#cccccc', icon: <svg width="22" height="22" fill="none" stroke="#cccccc" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
                    ].map((stat, i) => (
                        <div key={i} className="stat-card" style={{ background: stat.gradient, borderRadius: '12px', padding: '1.5rem', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', background: `radial-gradient(circle,${stat.accent}15,transparent)`, top: '-30px', right: '-20px' }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {stat.icon}
                                </div>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stat.accent, boxShadow: `0 0 8px ${stat.accent}` }}></div>
                            </div>
                            <p style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', marginBottom: '4px', letterSpacing: '-1px', lineHeight: 1 }}>{stat.value}</p>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>{stat.label}</p>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{stat.sub}</p>
                        </div>
                    ))}
                </div>

                {/* ── Bottom Grid — Recent Schools + Quick Actions ── */}
                <div className="dash-section" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem' }}>

                    {/* Recent Schools */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#0a0a0a,#262626)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
                                    <svg width="18" height="18" fill="none" stroke="#ffffff" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Recent Schools</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Latest registered schools</p>
                                </div>
                            </div>
                            <button onClick={() => navigate('/super-admin/schools')}
                                style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#0a0a0a,#262626)', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                View All →
                            </button>
                        </div>

                        {/* Table */}
                        <div style={{ overflow: 'hidden' }}>
                            {/* Header */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 20px', background: '#f8fafc', borderBottom: '0.5px solid #f1f5f9' }}>
                                {['School Name', 'Location', 'Theme', 'Status'].map(h => (
                                    <span key={h} style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
                                ))}
                            </div>
                            {(stats?.recent_schools || []).length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center' }}>
                                    <p style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}>🏫</p>
                                    <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>No schools yet</p>
                                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>Create your first school to get started</p>
                                </div>
                            ) : (
                                (stats?.recent_schools || []).map((school, i) => {
                                    const sc = statusColor(school.status);
                                    return (
                                        <div key={i} className="school-row"
                                            onClick={() => navigate('/super-admin/schools')}
                                            style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: i < stats.recent_schools.length - 1 ? '0.5px solid #f8fafc' : 'none', cursor: 'pointer', background: '#ffffff', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {school.logo_url ? (
                                                    <img src={school.logo_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#0a0a0a,#333333)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                                                    </div>
                                                )}
                                                <div>
                                                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>{school.name}</p>
                                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>{school.slug}</p>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>{school.city ? `${school.city}, ${school.state}` : '—'}</span>
                                            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'capitalize' }}>{school.theme || 'default'}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: sc.bg, color: sc.color, border: `0.5px solid ${sc.border}`, display: 'inline-block', textTransform: 'capitalize' }}>
                                                {school.status}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* Actions Card */}
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)' }}>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Quick Actions</p>
                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>Frequently used actions</p>
                            </div>
                            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    { label: 'Create New School', sub: 'Add school + admin', path: '/super-admin/schools/create', gradient: 'linear-gradient(135deg,#0a0a0a,#262626)', accent: '#ffffff', icon: <svg width="18" height="18" fill="none" stroke="#ffffff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg> },
                                    { label: 'Manage Schools', sub: 'View all schools', path: '/super-admin/schools', gradient: 'linear-gradient(135deg,#1a1a1a,#3a3a3a)', accent: '#d4d4d4', icon: <svg width="18" height="18" fill="none" stroke="#d4d4d4" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> },
                                ].map((action, i) => (
                                    <div key={i} className="action-card"
                                        onClick={() => navigate(action.path)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', background: '#f8fafc', border: '0.5px solid #f1f5f9' }}>
                                        <div style={{ width: '40px', height: '40px', background: action.gradient, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${action.accent}30` }}>
                                            {action.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>{action.label}</p>
                                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>{action.sub}</p>
                                        </div>
                                        <svg width="14" height="14" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SuperAdminDashboard;
