import { useNavigate, useLocation } from 'react-router-dom';
import useThemeStore from '../../store/themeStore';

const superAdminNavItems = [
    {
        key: 'dashboard', label: 'Dashboard', path: '/super-admin/dashboard',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
    },
    {
        key: 'schools', label: 'Schools', path: '/super-admin/schools',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
    },
    {
        key: 'create-school', label: 'Create School', path: '/super-admin/schools/create',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
    },
    // {
    //     key: 'create-admin', label: 'Create Admin', path: '/super-admin/admins/create',
    //     icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
    // },
];

const Sidebar = ({ collapsed, role = 'super_admin' }) => {
    const { theme } = useThemeStore();
    const navigate = useNavigate();
    const location = useLocation();
    const navItems = role === 'super_admin' ? superAdminNavItems : [];

    return (
        <div style={{
            width: collapsed ? '64px' : '220px',
            minHeight: '100vh',
            background: theme.sidebarBg,
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.25s ease',
            overflow: 'hidden',
            flexShrink: 0,
        }}>
            {/* Logo — no border bottom */}
            <div style={{
                padding: collapsed ? '22px 0' : '22px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                minHeight: '64px',
            }}>
                <div style={{
                    width: '32px', height: '32px',
                    background: `linear-gradient(135deg, ${theme.accent}, #e8c547)`,
                    borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', flexShrink: 0
                }}>🏫</div>
                {!collapsed && (
                    <span style={{ fontWeight: 600, fontSize: '15px', color: theme.sidebarText, whiteSpace: 'nowrap' }}>
                        School SaaS
                    </span>
                )}
            </div>

            {/* Section label */}
            {!collapsed && (
                <div style={{ padding: '8px 20px 4px', fontSize: '10px', color: theme.sidebarTextMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Main Menu
                </div>
            )}

            {/* Nav */}
            <nav style={{ flex: 1, padding: '4px 0' }}>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <div
                            key={item.key}
                            onClick={() => navigate(item.path)}
                            title={collapsed ? item.label : ''}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: collapsed ? '10px 0' : '9px 16px',
                                margin: '1px 8px',
                                borderRadius: '8px',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                cursor: 'pointer',
                                background: isActive ? theme.sidebarActiveBg : 'transparent',
                                color: isActive ? theme.sidebarActiveText : theme.sidebarText,
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = theme.sidebarHover; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                        >
                            <span style={{ color: isActive ? theme.sidebarActive : theme.sidebarTextMuted, flexShrink: 0 }}>
                                {item.icon}
                            </span>
                            {!collapsed && (
                                <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' }}>
                                    {item.label}
                                </span>
                            )}
                        </div>
                    );
                })}
            </nav>
        </div>
    );
};

export default Sidebar;