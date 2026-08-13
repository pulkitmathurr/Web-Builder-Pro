import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GOOGLE_FONTS_URL, getFontFamily } from "../../constants/fonts";
import { NAVBAR_ITEMS, isModuleEnabled } from "../../constants/publicNav";
import { getPublicModuleContentApi } from "../../api/content.api";
import { isLevelComplete } from "../../utils/courseLevels";

const ChevronDown = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: '5px', flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
);

const ChevronRight = ({ color }) => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" style={{ marginLeft: '8px', flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
    </svg>
);

const MenuIcon = ({ color }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round">
        <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
);

const CloseIcon = ({ color }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round">
        <path d="M6 6l12 12M18 6L6 18" />
    </svg>
);

const ChevronDownSm = ({ color, open }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}>
        <path d="M6 9l6 6 6-6" />
    </svg>
);

// ── Shared top navbar — logo/name on the left, Home + hover dropdowns on the right.
// Dropdown items with subItems (Infrastructure, Courses, and the top-level Sports item)
// open a nested flyout to the right on hover, instead of listing everything inline. ──
const Navbar = ({ school, slug, tc, scrollY = 0, activeKey, forceSolid = false, topOffset = 0 }) => {
    const navigate = useNavigate();
    // Navbar background is always solid white now (no transparent-over-hero state),
    // so this is always true — kept as a variable since text/border colors below key off it.
    const navbarSolid = true;
    const navFont = getFontFamily(school.nav_font);
    const [openTop, setOpenTop] = useState(null);
    const [openSub, setOpenSub] = useState(null);
    const [coursesContent, setCoursesContent] = useState(null);
    const [infraContent, setInfraContent] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileGroup, setMobileGroup] = useState(null);
    const [mobileSub, setMobileSub] = useState(null);
    const topCloseTimer = useRef(null);
    const subCloseTimer = useRef(null);

    useEffect(() => {
        if (!school?.id) return;
        getPublicModuleContentApi(school.id, 'courses').then(res => setCoursesContent(res.data || {})).catch(() => setCoursesContent({}));
        getPublicModuleContentApi(school.id, 'infrastructure').then(res => setInfraContent(res.data || {})).catch(() => setInfraContent({}));
    }, [school?.id]);

    // Lock background scroll while the mobile drawer is open.
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const openTopMenu = (label) => { clearTimeout(topCloseTimer.current); setOpenTop(label); setOpenSub(null); };
    const scheduleTopClose = () => { topCloseTimer.current = setTimeout(() => { setOpenTop(null); setOpenSub(null); }, 150); };
    const openSubMenu = (key) => { clearTimeout(subCloseTimer.current); setOpenSub(key); };
    const scheduleSubClose = () => { subCloseTimer.current = setTimeout(() => setOpenSub(null), 150); };
    const keepOpen = () => { clearTimeout(topCloseTimer.current); clearTimeout(subCloseTimer.current); };
    const go = (path) => {
        setOpenTop(null); setOpenSub(null);
        setMobileOpen(false); setMobileGroup(null); setMobileSub(null);
        navigate(path);
    };
    const toggleMobileGroup = (label) => { setMobileGroup(prev => prev === label ? null : label); setMobileSub(null); };
    const toggleMobileSub = (key) => { setMobileSub(prev => prev === key ? null : key); };

    // 'home' always stays in the nav — there's no fallback UI for a disabled landing page,
    // so unselecting it isn't treated as removable the way other modules are.
    // 'gallery-video' isn't its own module_key — it's the Video Gallery tab of the 'gallery' module.
    const navEnabled = (key) => {
        if (key === 'home') return true;
        return isModuleEnabled(school, key === 'gallery-video' ? 'gallery' : key);
    };

    const visibleNavItems = NAVBAR_ITEMS
        .map(item => item.links ? { ...item, links: item.links.filter(l => navEnabled(l.key)) } : item)
        .filter(item => {
            if (item.links) return item.links.length > 0;
            return navEnabled(item.key);
        });

    const getSubItems = (link) => {
        if (link.dynamicSubItems === 'courses') {
            return (link.subItems || []).filter(s => isLevelComplete(coursesContent?.[s.key]));
        }
        if (link.dynamicSubItems === 'infrastructure') {
            return (infraContent?.categories || []).map(cat => ({ label: cat.name, path: (s) => `/school/${s}/infrastructure/${cat.slug}` }));
        }
        return link.subItems;
    };

    const textColor = navbarSolid ? '#0f172a' : '#ffffff';
    const affiliationBadges = Array.isArray(school.affiliation_badges) ? school.affiliation_badges.filter(b => b?.url) : [];

    const dropdownPanelStyle = (isOpen) => ({
        position: 'absolute', top: 'calc(100% + 18px)', left: '50%',
        transform: isOpen ? 'translate(-50%,0) scale(1)' : 'translate(-50%,-6px) scale(0.98)',
        transformOrigin: 'top center',
        minWidth: '230px', background: '#ffffff', borderRadius: '14px',
        border: `1px solid ${tc.primary}20`,
        boxShadow: '0 26px 60px rgba(0,0,0,0.18), 0 2px 10px rgba(0,0,0,0.06)',
        padding: '10px', opacity: isOpen ? 1 : 0, visibility: isOpen ? 'visible' : 'hidden',
        transition: 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16,1,0.3,1)',
        pointerEvents: isOpen ? 'auto' : 'none', zIndex: 10,
    });

    const flyoutPanelStyle = (isOpen) => ({
        position: 'absolute', top: '-10px', left: 'calc(100% + 10px)',
        minWidth: '210px', background: '#ffffff', borderRadius: '12px',
        border: `1px solid ${tc.primary}20`,
        boxShadow: '0 22px 50px rgba(0,0,0,0.18)',
        padding: '8px', opacity: isOpen ? 1 : 0, visibility: isOpen ? 'visible' : 'hidden',
        transform: isOpen ? 'translateX(0)' : 'translateX(-6px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        pointerEvents: isOpen ? 'auto' : 'none', zIndex: 11,
    });

    const rowStyle = (isActive) => ({
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 12px', borderRadius: '9px', cursor: 'pointer',
        fontSize: '13.5px', fontWeight: 600, color: isActive ? tc.primary : '#0f172a',
        background: isActive ? tc.light : 'transparent',
        borderLeft: isActive ? `3px solid ${tc.primary}` : '3px solid transparent',
        transition: 'background 0.15s, border-color 0.15s',
    });

    const Pointer = () => (
        <span style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '12px', height: '12px', background: '#fff', borderLeft: `1px solid ${tc.primary}20`, borderTop: `1px solid ${tc.primary}20`, borderRadius: '2px' }} />
    );

    return (
        <>
            <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
            <style>{`
                @media (max-width: 960px) {
                    .navbar-desktop-items { display: none !important; }
                    .navbar-badges { display: none !important; }
                    .navbar-hamburger { display: flex !important; }
                }
                @media (max-width: 1280px) {
                    .navbar-badges img { height: 46px !important; }
                    .navbar-right { gap: 1rem !important; }
                }
                @media (max-width: 480px) {
                    .navbar-logo-box { width: 42px !important; height: 42px !important; }
                    .navbar-school-name { font-size: 14px !important; }
                    .navbar-inner { padding: 0 1.1rem !important; }
                }
                .mobile-drawer-row { transition: background 0.18s ease, transform 0.15s ease; }
                .mobile-drawer-row:active { transform: scale(0.98); }
                @keyframes mobileDrawerIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes mobileRowIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
                .mobile-drawer-row-wrap { animation: mobileRowIn 0.4s cubic-bezier(0.16,1,0.3,1) both; }
                .mobile-submenu { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s cubic-bezier(0.16,1,0.3,1); }
                .mobile-submenu.open { grid-template-rows: 1fr; }
                .mobile-submenu > div { overflow: hidden; }
                .mobile-chevron-btn { transition: background 0.2s ease, color 0.2s ease; }
            `}</style>
            <nav className="navbar-inner" style={{
                position: 'fixed', top: `${topOffset}px`, left: 0, right: 0, zIndex: 1000,
                height: '92px', padding: '0 3rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid #f1f5f9',
                transition: 'all 0.3s ease',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', minWidth: 0, flexShrink: 1 }} onClick={() => go(`/school/${slug}`)}>
                    {school.logo_url ? (
                        <img className="navbar-logo-box" src={school.logo_url} alt={school.name} style={{ height: '54px', width: '54px', objectFit: 'contain', flexShrink: 0 }} />
                    ) : (
                        <div className="navbar-logo-box" style={{ width: '54px', height: '54px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '10px', flexShrink: 0 }}></div>
                    )}
                    <p className="navbar-school-name" style={{ fontFamily: navFont, fontSize: '17px', fontWeight: 700, color: (mobileOpen ? '#0f172a' : textColor), letterSpacing: '0.03em', textTransform: 'uppercase', transition: 'color 0.3s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                        {school.name}
                    </p>
                </div>

                {/* ── Mobile hamburger toggle — hidden on desktop, shown ≤960px ── */}
                <button className="navbar-hamburger" onClick={() => setMobileOpen(o => !o)}
                    style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '9px', border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
                    {mobileOpen ? <CloseIcon color="#0f172a" /> : <MenuIcon color={textColor} />}
                </button>

                <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexShrink: 0 }}>
                <div className="navbar-desktop-items" style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', flexShrink: 0 }}>
                    {visibleNavItems.map(item => {
                        // ── Plain link (Home, Mandatory Public Disclosure) ──
                        if (item.path && !item.links && !item.subItems) {
                            const isActive = activeKey === item.key;
                            return (
                                <span key={item.key} onClick={() => go(item.path(slug))}
                                    style={{ cursor: 'pointer', fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap', textTransform: 'uppercase', color: isActive ? tc.secondary : textColor, paddingBottom: '6px', borderBottom: '2px solid transparent', transition: 'color 0.25s ease' }}>
                                    {item.label}
                                </span>
                            );
                        }

                        // ── Single top-level flyout (Sports) ──
                        if (item.subItems && !item.links) {
                            const isOpen = openTop === item.label;
                            const isActive = activeKey === item.key;
                            return (
                                <div key={item.label} onMouseEnter={() => openTopMenu(item.label)} onMouseLeave={scheduleTopClose} style={{ position: 'relative' }}>
                                    <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap', textTransform: 'uppercase', color: isActive ? tc.secondary : textColor, paddingBottom: '6px', borderBottom: isOpen ? `2px solid ${tc.secondary}` : '2px solid transparent', transition: 'color 0.25s ease, border-color 0.25s ease' }}
                                        onClick={() => go(item.path(slug))}>
                                        {item.label}
                                        <ChevronDown />
                                    </span>
                                    <div style={dropdownPanelStyle(isOpen)} onMouseEnter={keepOpen} onMouseLeave={scheduleTopClose}>
                                        <Pointer />
                                        {item.subItems.map(sub => (
                                            <div key={sub.label} onClick={() => go(sub.path(slug))} style={rowStyle(false)}
                                                onMouseEnter={e => e.currentTarget.style.background = tc.light}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                {sub.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        // ── Group dropdown (About Us, Academics, Gallery) ──
                        const isOpen = openTop === item.label;
                        const groupHasActive = item.links.some(l => l.key === activeKey);
                        return (
                            <div key={item.label} onMouseEnter={() => openTopMenu(item.label)} onMouseLeave={scheduleTopClose} style={{ position: 'relative' }}>
                                <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap', textTransform: 'uppercase', color: groupHasActive ? tc.secondary : textColor, paddingBottom: '6px', borderBottom: isOpen ? `2px solid ${tc.secondary}` : '2px solid transparent', transition: 'color 0.25s ease, border-color 0.25s ease' }}>
                                    {item.label}
                                    <ChevronDown />
                                </span>

                                <div style={dropdownPanelStyle(isOpen)} onMouseEnter={keepOpen} onMouseLeave={scheduleTopClose}>
                                    <Pointer />
                                    {item.links.map(link => {
                                        const isCourses = link.key === 'courses';
                                        const subItems = getSubItems(link);
                                        const hasSub = subItems?.length > 0;
                                        const isSubOpen = openSub === link.key;
                                        const isActive = activeKey === link.key;
                                        return (
                                            <div key={link.key} style={{ position: 'relative' }}
                                                onMouseEnter={() => hasSub && openSubMenu(link.key)}
                                                onMouseLeave={scheduleSubClose}>
                                                <div onClick={() => { if (!isCourses) go(link.path(slug)); }}
                                                    style={{ ...rowStyle(isActive), cursor: isCourses ? 'default' : 'pointer' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = tc.light}
                                                    onMouseLeave={e => e.currentTarget.style.background = isActive ? tc.light : 'transparent'}>
                                                    {link.label}
                                                    {hasSub && <ChevronRight color={isActive ? tc.primary : '#94a3b8'} />}
                                                </div>
                                                {hasSub && (
                                                    <div style={flyoutPanelStyle(isSubOpen)} onMouseEnter={keepOpen} onMouseLeave={scheduleSubClose}>
                                                        {subItems.map(sub => (
                                                            <div key={sub.label} onClick={() => go(sub.path(slug))} style={rowStyle(false)}
                                                                onMouseEnter={e => e.currentTarget.style.background = tc.light}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                                {sub.label}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {affiliationBadges.length > 0 && (
                    <div className="navbar-badges" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '1.4rem', borderLeft: `1px solid ${navbarSolid ? '#e2e8f0' : 'rgba(255,255,255,0.25)'}`, flexShrink: 0, transition: 'border-color 0.3s' }}>
                        {affiliationBadges.map(badge => (
                            <img key={badge.id || badge.url} src={badge.url} alt={badge.label || ''} title={badge.label || ''}
                                style={{ height: '60px', width: 'auto', maxWidth: '84px', objectFit: 'contain', flexShrink: 0 }} />
                        ))}
                    </div>
                )}
                </div>
            </nav>

            {/* ── Mobile drawer — tap-based accordion version of the same nav data,
                since hover-based dropdowns don't work on touch devices. ── */}
            {mobileOpen && (
                <div style={{
                    position: 'fixed', top: `${92 + topOffset}px`, left: 0, right: 0, bottom: 0, zIndex: 999,
                    background: `linear-gradient(180deg, ${tc.light} 0%, #ffffff 140px)`, overflowY: 'auto', animation: 'mobileDrawerIn 0.25s cubic-bezier(0.16,1,0.3,1)',
                    padding: '0.75rem 0 2rem',
                }}>
                    {visibleNavItems.map((item, idx) => {
                        // Plain link
                        if (item.path && !item.links && !item.subItems) {
                            const isActive = activeKey === item.key;
                            return (
                                <div key={item.key} className="mobile-drawer-row-wrap" style={{ borderBottom: '1px solid #f1f5f9', animationDelay: `${idx * 0.04}s` }}>
                                    <div onClick={() => go(item.path(slug))} className="mobile-drawer-row"
                                        style={{ padding: '15px 1.5rem', position: 'relative', fontSize: '14.5px', fontWeight: 700, color: isActive ? tc.primary : '#0f172a', background: isActive ? tc.light : 'transparent', cursor: 'pointer' }}>
                                        {isActive && <span style={{ position: 'absolute', left: 0, top: '22%', bottom: '22%', width: '3px', borderRadius: '0 3px 3px 0', background: `linear-gradient(180deg, ${tc.primary}, ${tc.secondary})` }} />}
                                        {item.label}
                                    </div>
                                </div>
                            );
                        }

                        // Single top-level flyout (Sports) — tap label to navigate, tap chevron to expand subitems
                        if (item.subItems && !item.links) {
                            const isExpanded = mobileGroup === item.label;
                            const isActive = activeKey === item.key;
                            return (
                                <div key={item.label} className="mobile-drawer-row-wrap" style={{ borderBottom: '1px solid #f1f5f9', animationDelay: `${idx * 0.04}s` }}>
                                    <div className="mobile-drawer-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 1.5rem', position: 'relative', background: (isActive || isExpanded) ? tc.light : 'transparent' }}>
                                        {(isActive || isExpanded) && <span style={{ position: 'absolute', left: 0, top: '22%', bottom: '22%', width: '3px', borderRadius: '0 3px 3px 0', background: `linear-gradient(180deg, ${tc.primary}, ${tc.secondary})` }} />}
                                        <span onClick={() => go(item.path(slug))} style={{ fontSize: '14.5px', fontWeight: 700, color: isActive ? tc.primary : '#0f172a', cursor: 'pointer' }}>
                                            {item.label}
                                        </span>
                                        <span onClick={() => toggleMobileGroup(item.label)} className="mobile-chevron-btn"
                                            style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: isExpanded ? '#ffffff' : 'transparent', color: isExpanded ? tc.primary : '#94a3b8' }}>
                                            <ChevronDownSm color={isExpanded ? tc.primary : '#94a3b8'} open={isExpanded} />
                                        </span>
                                    </div>
                                    <div className={`mobile-submenu${isExpanded ? ' open' : ''}`}>
                                        <div style={{ background: tc.light, padding: '4px 0' }}>
                                            {item.subItems.map(sub => (
                                                <div key={sub.label} onClick={() => go(sub.path(slug))} className="mobile-drawer-row"
                                                    style={{ padding: '12px 1.5rem 12px 2.5rem', fontSize: '13.5px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                                                    {sub.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Group dropdown (About Us, Academics, Gallery, News & Events, Admissions)
                        const isExpanded = mobileGroup === item.label;
                        const groupHasActive = item.links.some(l => l.key === activeKey);
                        return (
                            <div key={item.label} className="mobile-drawer-row-wrap" style={{ borderBottom: '1px solid #f1f5f9', animationDelay: `${idx * 0.04}s` }}>
                                <div onClick={() => toggleMobileGroup(item.label)} className="mobile-drawer-row"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 1.5rem', position: 'relative', cursor: 'pointer', background: (groupHasActive || isExpanded) ? tc.light : 'transparent' }}>
                                    {(groupHasActive || isExpanded) && <span style={{ position: 'absolute', left: 0, top: '22%', bottom: '22%', width: '3px', borderRadius: '0 3px 3px 0', background: `linear-gradient(180deg, ${tc.primary}, ${tc.secondary})` }} />}
                                    <span style={{ fontSize: '14.5px', fontWeight: 700, color: groupHasActive ? tc.primary : '#0f172a' }}>{item.label}</span>
                                    <span className="mobile-chevron-btn" style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isExpanded ? '#ffffff' : 'transparent', color: isExpanded ? tc.primary : '#94a3b8' }}>
                                        <ChevronDownSm color={isExpanded ? tc.primary : '#94a3b8'} open={isExpanded} />
                                    </span>
                                </div>
                                <div className={`mobile-submenu${isExpanded ? ' open' : ''}`}>
                                    <div style={{ background: tc.light, padding: '4px 0' }}>
                                        {item.links.map(link => {
                                            const isCourses = link.key === 'courses';
                                            const subItems = getSubItems(link);
                                            const hasSub = subItems?.length > 0;
                                            const isSubExpanded = mobileSub === link.key;
                                            const isActive = activeKey === link.key;
                                            return (
                                                <div key={link.key}>
                                                    <div className="mobile-drawer-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 1.5rem 12px 2.5rem', position: 'relative' }}>
                                                        {isActive && <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', width: '5px', height: '5px', borderRadius: '50%', background: tc.primary }} />}
                                                        <span onClick={() => { if (!isCourses) go(link.path(slug)); else if (hasSub) toggleMobileSub(link.key); }}
                                                            style={{ fontSize: '13.5px', fontWeight: 600, color: isActive ? tc.primary : '#334155', cursor: 'pointer' }}>
                                                            {link.label}
                                                        </span>
                                                        {hasSub && (
                                                            <span onClick={() => toggleMobileSub(link.key)} className="mobile-chevron-btn"
                                                                style={{ width: '26px', height: '26px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: isSubExpanded ? '#ffffff' : 'transparent', color: isSubExpanded ? tc.primary : '#94a3b8' }}>
                                                                <ChevronDownSm color={isSubExpanded ? tc.primary : '#94a3b8'} open={isSubExpanded} />
                                                            </span>
                                                        )}
                                                    </div>
                                                    {hasSub && (
                                                        <div className={`mobile-submenu${isSubExpanded ? ' open' : ''}`}>
                                                            <div style={{ background: '#ffffff', padding: '4px 0', borderLeft: `2px solid ${tc.primary}30` }}>
                                                                {subItems.map(sub => (
                                                                    <div key={sub.label} onClick={() => go(sub.path(slug))} className="mobile-drawer-row"
                                                                        style={{ padding: '11px 1.5rem 11px 3.5rem', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                                                                        {sub.label}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
};

export default Navbar;
