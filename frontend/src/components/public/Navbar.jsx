import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GOOGLE_FONTS_URL, getFontFamily } from "../../constants/fonts";
import { NAVBAR_ITEMS } from "../../constants/publicNav";
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

// ── Shared top navbar — logo/name on the left, Home + hover dropdowns on the right.
// Dropdown items with subItems (Infrastructure, Courses, and the top-level Sports item)
// open a nested flyout to the right on hover, instead of listing everything inline. ──
const Navbar = ({ school, slug, tc, scrollY = 0, activeKey }) => {
    const navigate = useNavigate();
    const navbarSolid = scrollY > 60;
    const navFont = getFontFamily(school.nav_font);
    const [openTop, setOpenTop] = useState(null);
    const [openSub, setOpenSub] = useState(null);
    const [coursesContent, setCoursesContent] = useState(null);
    const [infraContent, setInfraContent] = useState(null);
    const topCloseTimer = useRef(null);
    const subCloseTimer = useRef(null);

    useEffect(() => {
        if (!school?.id) return;
        getPublicModuleContentApi(school.id, 'courses').then(res => setCoursesContent(res.data || {})).catch(() => setCoursesContent({}));
        getPublicModuleContentApi(school.id, 'infrastructure').then(res => setInfraContent(res.data || {})).catch(() => setInfraContent({}));
    }, [school?.id]);

    const openTopMenu = (label) => { clearTimeout(topCloseTimer.current); setOpenTop(label); setOpenSub(null); };
    const scheduleTopClose = () => { topCloseTimer.current = setTimeout(() => { setOpenTop(null); setOpenSub(null); }, 150); };
    const openSubMenu = (key) => { clearTimeout(subCloseTimer.current); setOpenSub(key); };
    const scheduleSubClose = () => { subCloseTimer.current = setTimeout(() => setOpenSub(null), 150); };
    const keepOpen = () => { clearTimeout(topCloseTimer.current); clearTimeout(subCloseTimer.current); };
    const go = (path) => { setOpenTop(null); setOpenSub(null); navigate(path); };

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
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                height: '92px', padding: '0 3rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: navbarSolid ? 'rgba(255,255,255,0.95)' : 'transparent',
                backdropFilter: navbarSolid ? 'blur(16px)' : 'none',
                borderBottom: navbarSolid ? '1px solid #f1f5f9' : 'none',
                transition: 'all 0.3s ease',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', cursor: 'pointer' }} onClick={() => navigate(`/school/${slug}`)}>
                    {school.logo_url ? (
                        <img src={school.logo_url} alt={school.name} style={{ height: '60px', width: '60px', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ width: '60px', height: '60px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '10px' }}></div>
                    )}
                    <p style={{ fontFamily: navFont, fontSize: '19px', fontWeight: 700, color: textColor, letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'color 0.3s' }}>
                        {school.name}
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    {NAVBAR_ITEMS.map(item => {
                        // ── Plain link (Home, Public Disclosure) ──
                        if (item.path && !item.links && !item.subItems) {
                            const isActive = activeKey === item.key;
                            return (
                                <span key={item.key} onClick={() => go(item.path(slug))}
                                    style={{ cursor: 'pointer', fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: isActive ? tc.secondary : textColor, paddingBottom: '6px', borderBottom: '2px solid transparent', transition: 'color 0.25s ease' }}>
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
                                    <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: isActive ? tc.secondary : textColor, paddingBottom: '6px', borderBottom: isOpen ? `2px solid ${tc.secondary}` : '2px solid transparent', transition: 'color 0.25s ease, border-color 0.25s ease' }}
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
                                <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: groupHasActive ? tc.secondary : textColor, paddingBottom: '6px', borderBottom: isOpen ? `2px solid ${tc.secondary}` : '2px solid transparent', transition: 'color 0.25s ease, border-color 0.25s ease' }}>
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
            </nav>
        </>
    );
};

export default Navbar;
