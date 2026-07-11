import { useState, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import useAuthStore from '../store/authStore';
import logo from '../assets/webbuilder-removebg-preview.png';

const navItems = [
    {
        key: 'dashboard', label: 'Dashboard', path: '/super-admin/dashboard',
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
    },
    {
        key: 'schools', label: 'Manage Schools', path: '/super-admin/schools',
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
    },
    {
        key: 'create-school', label: 'Create School', path: '/super-admin/schools/create',
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
    },
    {
        key: 'logout', label: 'Logout', path: null,
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
    },
];

const pageTitles = {
    '/super-admin/dashboard': 'Dashboard',
    '/super-admin/schools': 'Manage Schools',
    '/super-admin/schools/create': 'Create School',
};

const DISC_RADIUS = 340;
const ITEM_COUNT = navItems.length;

const SuperAdminLayout = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [dragging, setDragging] = useState(false);
    const lastY = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const title = pageTitles[location.pathname] || 'Super Admin';

    const angleStep = 36;

    const handleWheel = (e) => {
        e.preventDefault();
        setRotation(prev => prev + (e.deltaY > 0 ? angleStep : -angleStep));
    };

    const handleMouseDown = (e) => {
        setDragging(true);
        lastY.current = e.clientY;
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;
        const diff = e.clientY - lastY.current;
        lastY.current = e.clientY;
        setRotation(prev => prev + diff * 0.8);
    };

    const handleMouseUp = () => setDragging(false);

    const handleItemClick = (item) => {
        if (item.key === 'logout') {
            logout();
            navigate('/super-admin/login');
        } else {
            navigate(item.path);
            setIsOpen(false);
        }
    };

    return (
        <>
            <style>{`
                @keyframes discSlideIn {
                    from { transform: translateX(-100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes discSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(-100%); opacity: 0; }
                }
                @keyframes handlePulse {
                    0%,100% { box-shadow: 4px 0 20px rgba(255,255,255,0.15); }
                    50% { box-shadow: 4px 0 32px rgba(255,255,255,0.3); }
                }
                .disc-container {
                    animation: discSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
                }
                .disc-handle { animation: handlePulse 2s ease-in-out infinite; }
                .nav-item-btn {
                    transition: all 0.2s ease;
                }
                .nav-item-btn:hover {
                    transform: scale(1.05);
                }
            `}</style>

            <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fb', fontFamily: 'system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>

                {/* ── Backdrop ── */}
                {isOpen && (
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', zIndex: 998 }}
                    />
                )}

                {/* ── Handle Button — always visible ── */}
                <div
                    className="disc-handle"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        position: 'fixed',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1001,
                        width: '36px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
                        borderRadius: '0 40px 40px 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.25)',
                        borderLeft: 'none',
                    }}
                >
                    <svg
                        width="14" height="14" fill="none" stroke="#e5e5e5" strokeWidth="2.5" viewBox="0 0 24 24"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                </div>

                {/* ── Rotating Disc ── */}
                {isOpen && (
                    <div
                        className="disc-container"
                        style={{
                            position: 'fixed',
                            left: `-${DISC_RADIUS - 80}px`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: `${DISC_RADIUS * 2}px`,
                            height: `${DISC_RADIUS * 2}px`,
                            zIndex: 999,
                            userSelect: 'none',
                        }}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* Disc background */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #000000 100%)',
                            border: '2px solid rgba(255,255,255,0.15)',
                            boxShadow: '8px 0 60px rgba(0,0,0,0.5), inset -4px 0 30px rgba(255,255,255,0.05)',
                            overflow: 'hidden',
                        }}>
                            {/* Grid pattern */}
                            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px', borderRadius: '50%' }}></div>
                            {/* Ring */}
                            <div style={{ position: 'absolute', inset: '12px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }}></div>
                            <div style={{ position: 'absolute', inset: '30px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)' }}></div>
                        </div>

                        {/* Logo at center */}
                        <div style={{
                            position: 'absolute',
                            left: DISC_RADIUS - 50,
                            top: DISC_RADIUS - 50,
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg,#0a0a0a,#1a1a1a)',
                            border: '2px solid rgba(255,255,255,0.25)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 2,
                            boxShadow: '0 0 30px rgba(255,255,255,0.1)'
                        }}>
                            <img src={logo} alt="logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                        </div>

                        {/* Nav Items arranged in arc */}
                        {navItems.map((item, i) => {
                            const baseAngle = (i - (ITEM_COUNT - 1) / 2) * angleStep;
                            const angle = baseAngle + rotation;
                            const rad = (angle * Math.PI) / 180;
                            const itemRadius = DISC_RADIUS - 90;
                            const x = DISC_RADIUS + Math.sin(rad) * itemRadius;
                            const y = DISC_RADIUS - Math.cos(rad) * itemRadius;

                            // Only show items on the right half (visible area)
                            const isVisible = x > DISC_RADIUS - 20;
                            const opacity = Math.max(0, Math.min(1, (x - (DISC_RADIUS - 20)) / 80));

                            const isActive = item.path && location.pathname === item.path;
                            const isCenter = Math.abs(angle % 360) < 20 || Math.abs((angle % 360) - 360) < 20;

                            return (
                                <div
                                    key={item.key}
                                    className="nav-item-btn"
                                    onClick={() => isVisible && handleItemClick(item)}
                                    style={{
                                        position: 'absolute',
                                        left: x - 42,
                                        top: y - 42,
                                        width: '84px',
                                        height: '84px',
                                        borderRadius: '50%',
                                        background: isActive
                                            ? 'linear-gradient(135deg,#ffffff,#d4d4d4)'
                                            : isCenter
                                            ? 'rgba(255,255,255,0.15)'
                                            : 'rgba(255,255,255,0.06)',
                                        border: isActive
                                            ? '2px solid #ffffff'
                                            : '1px solid rgba(255,255,255,0.2)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        cursor: isVisible ? 'pointer' : 'default',
                                        opacity: opacity,
                                        transition: 'background 0.2s, border 0.2s',
                                        zIndex: 3,
                                        boxShadow: isActive ? '0 0 20px rgba(255,255,255,0.35)' : 'none',
                                        pointerEvents: isVisible ? 'auto' : 'none',
                                    }}
                                >
                                    <span style={{ color: isActive ? '#0a0a0a' : '#e5e5e5' }}>
                                        {item.icon}
                                    </span>
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: 600,
                                        color: isActive ? '#0a0a0a' : 'rgba(255,255,255,0.75)',
                                        textAlign: 'center',
                                        lineHeight: 1.2,
                                        letterSpacing: '0.03em',
                                        maxWidth: '68px',
                                        wordBreak: 'break-word'
                                    }}>
                                        {item.label}
                                    </span>
                                </div>
                            );
                        })}

                        {/* Active indicator line at right edge */}
                        <div style={{
                            position: 'absolute',
                            right: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '4px',
                            height: '80px',
                            background: 'linear-gradient(to bottom,transparent,#ffffff,transparent)',
                            borderRadius: '2px',
                            zIndex: 4
                        }}></div>

                    </div>
                )}

                {/* ── Main Content ── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Navbar title={title} collapsed={false} onToggle={() => setIsOpen(!isOpen)} />
                    <div style={{ flex: 1, padding: '24px', overflowY: 'auto', width: '100%' }}>
                        <Outlet />
                    </div>
                </div>

            </div>
        </>
    );
};

export default SuperAdminLayout;
