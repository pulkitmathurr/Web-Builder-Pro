import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import logo from '../assets/webbuilder-removebg-preview.png';
import logoCollapsed from '../assets/webbuilder-collapsed-removebg-preview.png';

const navItems = [
    {
        key: 'dashboard', label: 'Dashboard', path: '/super-admin/dashboard',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
    },
    {
        key: 'schools', label: 'Manage Schools', path: '/super-admin/schools',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
    },
    {
        key: 'create-school', label: 'Create School', path: '/super-admin/schools/create',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
    },
];

const pageTitles = {
    '/super-admin/dashboard': 'Dashboard',
    '/super-admin/schools': 'Manage Schools',
    '/super-admin/schools/create': 'Create School',
};

const SuperAdminLayout = () => {
    // Default to the collapsed (icon-only) sidebar on tablet/phone widths so it doesn't
    // eat most of the screen — the toggle button still lets the admin expand it manually.
    const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 900);
    const location = useLocation();
    const navigate = useNavigate();
    const title = pageTitles[location.pathname] || 'Super Admin';

    const NavItem = ({ item }) => {
        const isActive = location.pathname === item.path;
        return (
            <div
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : ''}
                style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: collapsed ? '10px 0' : '9px 16px',
                    margin: '1px 8px', borderRadius: '8px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    cursor: 'pointer',
                    background: isActive ? '#eef2ff' : 'transparent',
                    transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
                <span style={{ color: isActive ? '#4f6ef7' : '#94a3b8', flexShrink: 0 }}>
                    {item.icon}
                </span>
                {!collapsed && (
                    <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400, color: isActive ? '#3c4fd1' : '#334155', whiteSpace: 'nowrap' }}>
                        {item.label}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f5f9', fontFamily: 'system-ui, sans-serif' }}>

            {/* ── Sidebar ── */}
            <div style={{
                width: collapsed ? '64px' : '260px',
                minHeight: '100vh',
                background: '#ffffff',
                borderRight: '1px solid #eef1f6',
                display: 'flex', flexDirection: 'column',
                transition: 'width 0.25s ease',
                overflow: 'hidden', flexShrink: 0,
            }}>

                {/* Logo */}
                <div style={{
                    height: '80px',
                    padding: collapsed ? '0' : '0 16px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    flexShrink: 0,
                    borderBottom: '1px solid #eef1f6',
                }}>
                    {collapsed ? (
                        <img src={logoCollapsed} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    ) : (
                        <img src={logo} alt="Web Builder Pro" style={{ width: '200px', height: '90px', objectFit: 'contain', objectPosition: 'left center', display: 'block', marginLeft: '8px' }} />
                    )}
                </div>

                {/* Nav */}
                <div style={{ flex: 1, overflowY: 'auto', paddingTop: '14px' }}>
                    {!collapsed && (
                        <div style={{ padding: '4px 20px 8px', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                            Main
                        </div>
                    )}
                    <nav style={{ padding: '4px 0' }}>
                        {navItems.map((item) => <NavItem key={item.key} item={item} />)}
                    </nav>
                </div>

                {/* Footer badge */}
                {!collapsed && (
                    <div style={{ flexShrink: 0, borderTop: '1px solid #eef1f6', padding: '14px 20px' }}>
                        <p style={{ fontSize: '10.5px', color: '#cbd5e1', letterSpacing: '0.03em' }}>Web Builder Pro · Platform</p>
                    </div>
                )}
            </div>

            {/* ── Main ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Navbar title={title} onToggle={() => setCollapsed(!collapsed)} />
                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', width: '100%' }}>
                    <Outlet />
                </div>
            </div>

        </div>
    );
};

export default SuperAdminLayout;
