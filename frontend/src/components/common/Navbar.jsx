import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { logoutApi } from '../../api/auth.api';
import toast from 'react-hot-toast';

const Navbar = ({ title = 'Dashboard', onToggle, collapsed }) => {
    const { user, clearAuth, role } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const isSuperAdmin = role === 'super_admin';

    const handleLogout = async () => {
        try { await logoutApi(); } catch (e) {}
        clearAuth();
        navigate(isSuperAdmin ? '/super-admin/login' : '/login');
        toast.success('Logged out successfully');
    };

    // Breadcrumb from path
    const pathParts = location.pathname.split('/').filter(Boolean);

    return (
        <>
            <style>{`
                .navbar-logout:hover {
                    background: ${isSuperAdmin ? 'rgba(255,255,255,0.08)' : 'rgba(139,34,82,0.1)'} !important;
                    border-color: ${isSuperAdmin ? 'rgba(255,255,255,0.3)' : 'rgba(139,34,82,0.4)'} !important;
                    color: ${isSuperAdmin ? '#ffffff' : '#8b2252'} !important;
                }
                .navbar-toggle:hover {
                    background: ${isSuperAdmin ? 'rgba(255,255,255,0.08)' : 'rgba(139,34,82,0.08)'} !important;
                    border-color: ${isSuperAdmin ? 'rgba(255,255,255,0.25)' : 'rgba(139,34,82,0.3)'} !important;
                }
            `}</style>

            <div style={{
                height: '64px',
                background: isSuperAdmin
                    ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)'
                    : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px 0 16px',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                borderBottom: isSuperAdmin
                    ? '1px solid rgba(255,255,255,0.1)'
                    : '0.5px solid #f1f5f9',
                boxShadow: isSuperAdmin
                    ? '0 4px 20px rgba(0,0,0,0.2)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
            }}>

                {/* Left — toggle + breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                        className="navbar-toggle"
                        onClick={onToggle}
                        style={{
                            width: '34px', height: '34px',
                            background: 'transparent',
                            border: isSuperAdmin ? '1px solid rgba(255,255,255,0.2)' : '0.5px solid #e2e8f0',
                            borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            color: isSuperAdmin ? 'rgba(255,255,255,0.7)' : '#64748b',
                            flexShrink: 0,
                            transition: 'all 0.15s'
                        }}
                    >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>

                    {/* Breadcrumb */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {pathParts.map((part, i) => (
                            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {i > 0 && (
                                    <svg width="12" height="12" fill="none" stroke={isSuperAdmin ? 'rgba(255,255,255,0.25)' : '#cbd5e1'} strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                                    </svg>
                                )}
                                <span style={{
                                    fontSize: i === pathParts.length - 1 ? '14px' : '12px',
                                    fontWeight: i === pathParts.length - 1 ? 600 : 400,
                                    color: i === pathParts.length - 1
                                        ? (isSuperAdmin ? '#ffffff' : '#0f172a')
                                        : (isSuperAdmin ? 'rgba(255,255,255,0.35)' : '#94a3b8'),
                                    textTransform: 'capitalize',
                                    letterSpacing: i === pathParts.length - 1 ? '-0.2px' : '0'
                                }}>
                                    {part.replace(/-/g, ' ')}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                    {/* User avatar + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '34px', height: '34px',
                            background: isSuperAdmin
                                ? 'linear-gradient(135deg, #ffffff, #cccccc)'
                                : 'linear-gradient(135deg, #8b2252, #c9687e)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 700,
                            color: isSuperAdmin ? '#0a0a0a' : '#ffffff',
                            boxShadow: isSuperAdmin
                                ? '0 2px 10px rgba(255,255,255,0.25)'
                                : '0 2px 10px rgba(139,34,82,0.3)',
                            flexShrink: 0
                        }}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: isSuperAdmin ? '#ffffff' : '#0f172a', lineHeight: 1.2 }}>
                                {user?.name || 'Admin'}
                            </p>
                            <p style={{ fontSize: '10px', color: isSuperAdmin ? 'rgba(255,255,255,0.45)' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                {isSuperAdmin ? 'Super Admin' : 'School Admin'}
                            </p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '24px', background: isSuperAdmin ? 'rgba(255,255,255,0.12)' : '#e2e8f0' }}></div>

                    {/* Logout */}
                    <button
                        className="navbar-logout"
                        onClick={handleLogout}
                        style={{
                            padding: '7px 14px',
                            background: 'transparent',
                            border: isSuperAdmin ? '1px solid rgba(255,255,255,0.2)' : '0.5px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: isSuperAdmin ? 'rgba(255,255,255,0.6)' : '#64748b',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontWeight: 500,
                            transition: 'all 0.15s'
                        }}
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
};

export default Navbar;
