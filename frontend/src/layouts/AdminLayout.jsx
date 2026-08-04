import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import useSchoolStore from "../store/schoolStore";
import useAuthStore from "../store/authStore";
import { getSelectedModulesApi } from "../api/school.api";
import { moduleRegistry } from "../config/moduleRegistry";
import { logoutApi } from "../api/auth.api";
import toast from "react-hot-toast";
import logo from "../assets/webbuilder-removebg-preview.png";
import logoCollapsed from "../assets/webbuilder-collapsed-removebg-preview.png";
import { getFontFamily } from "../constants/fonts";

const pageTitles = {
    "/admin/dashboard": "Dashboard",
    "/admin/modules/select": "Select Modules",
    "/admin/settings": "General Settings",
    "/admin/contact": "Contact Us",
    "/admin/module/home": "Home Page",
};

const AdminLayout = () => {
    // Desktop-only icon-collapse toggle (≥900px) — below that the sidebar hides entirely
    // and a hamburger + slide-in drawer takes over, same pattern as the public site's Navbar.
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [selectedModules, setSelectedModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const { school, tc, bc, fetchSchool } = useSchoolStore();
    const { user, clearAuth } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    // Close the mobile drawer on route change, and lock background scroll while it's open.
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const theme = {
        sidebarBg: '#ffffff',
        sidebarText: '#334155',
        sidebarTextMuted: '#94a3b8',
        sidebarActive: tc.primary,
        sidebarActiveBg: tc.light,
        sidebarActiveText: tc.primary,
        sidebarHover: tc.light,
        navbarBg: '#ffffff',
        navbarText: '#0f172a',
        contentBg: bc.surface,
    };

    useEffect(() => {
        fetchModules();
    }, [location.pathname]);

    useEffect(() => {
        fetchSchool();
    }, []);

    const fetchModules = async () => {
        try {
            const res = await getSelectedModulesApi();
            const { selectedModules: mods, isFirstLogin } = res.data;
            if (isFirstLogin) {
                navigate("/admin/modules/select");
                return;
            }
            const parsedMods = typeof mods === "string" ? JSON.parse(mods) : mods || [];
            setSelectedModules(parsedMods);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try { await logoutApi(); } catch (e) {}
        clearAuth();
        navigate("/login");
        toast.success("Logged out successfully");
    };

    const coreItems = [
        {
            key: "dashboard", label: "Dashboard", path: "/admin/dashboard",
            icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
        },
        {
            key: "contact", label: "Contact Us", path: "/admin/contact",
            icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
        },
        {
            key: "settings", label: "General Settings", path: "/admin/settings",
            icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
        },
    ];

    const moduleItems = selectedModules
        .map((key) => moduleRegistry.find((m) => m.key === key))
        .filter(Boolean)
        .map((m) => ({
            key: m.key,
            label: m.label,
            path: m.key === 'home' ? '/admin/module/home' : `/admin/module/${m.key}`,
            icon: m.icon,
        }));

    const title =
        pageTitles[location.pathname] ||
        moduleRegistry.find((m) => `/admin/module/${m.key}` === location.pathname)?.label ||
        "Admin Panel";

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.contentBg }}>
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading...</p>
            </div>
        );
    }

    const NavItem = ({ item, forceExpanded = false, onNavigate }) => {
        const isActive = location.pathname === item.path;
        const isCollapsed = collapsed && !forceExpanded;
        return (
            <div
                onClick={() => { navigate(item.path); onNavigate?.(); }}
                title={isCollapsed ? item.label : ""}
                style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: isCollapsed ? "10px 0" : "9px 16px",
                    margin: "1px 8px", borderRadius: "8px",
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    cursor: "pointer",
                    background: isActive ? theme.sidebarActiveBg : "transparent",
                    transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = theme.sidebarHover; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
                <span style={{ color: isActive ? theme.sidebarActive : theme.sidebarTextMuted, flexShrink: 0 }}>
                    {item.icon}
                </span>
                {!isCollapsed && (
                    <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 400, color: isActive ? theme.sidebarActiveText : theme.sidebarText, whiteSpace: "nowrap" }}>
                        {item.label}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: theme.contentBg, fontFamily: "system-ui, sans-serif" }}>
            <style>{`
                @media (max-width: 640px) {
                    .admin-navbar-username { display: none !important; }
                    .admin-navbar-logout-text { display: none !important; }
                }
                @media (max-width: 900px) {
                    .admin-sidebar { display: none !important; }
                    .admin-desktop-toggle { display: none !important; }
                    .admin-hamburger { display: flex !important; }
                }
                @keyframes adminDrawerBackdropIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes adminDrawerSlideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
            `}</style>

            {/* Sidebar — desktop only below 900px, replaced by the hamburger + drawer */}
            <div className="admin-sidebar" style={{
                width: collapsed ? "64px" : "260px",
                minHeight: "100vh",
                background: theme.sidebarBg,
                display: "flex", flexDirection: "column",
                transition: "width 0.25s ease",
                overflow: "hidden", flexShrink: 0,
            }}>

                {/* Logo */}
                <div style={{
                    height: "80px",
                    padding: collapsed ? "0" : "0 16px",
                    display: "flex", alignItems: "center",
                    justifyContent: collapsed ? "center" : "flex-start",
                    flexShrink: 0,
                }}>
                    {collapsed ? (
                        <img src={logoCollapsed} alt="Logo" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
                    ) : (
                        <img src={logo} alt="Web Builder Pro" style={{ width: "200px", height: "90px", objectFit: "contain", objectPosition: "left center", display: "block", marginLeft: "8px" }} />
                    )}
                </div>

                {/* Scrollable nav area — fills remaining space so the branding footer below always stays pinned to the bottom */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                    {/* Core Nav */}
                    {!collapsed && (
                        <div style={{ padding: "4px 20px 4px", fontSize: "10px", color: theme.sidebarTextMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            Main
                        </div>
                    )}
                    <nav style={{ padding: "4px 0" }}>
                        {coreItems.map((item) => <NavItem key={item.key} item={item} />)}
                    </nav>

                    {/* Modules Nav */}
                    {moduleItems.length > 0 && (
                        <>
                            {!collapsed && (
                                <div style={{ padding: "12px 20px 4px", fontSize: "10px", color: theme.sidebarTextMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    Modules
                                </div>
                            )}
                            <nav style={{ padding: "4px 0" }}>
                                {moduleItems.map((item) => <NavItem key={item.key} item={item} />)}
                            </nav>
                        </>
                    )}
                </div>

                {/* School branding — pinned at the bottom, always visible, never scrolls away */}
                {school && (
                    <div style={{
                        flexShrink: 0, borderTop: "0.5px solid #f1f5f9",
                        padding: collapsed ? "14px 0" : "16px",
                        display: "flex", alignItems: "center", gap: "12px",
                        justifyContent: collapsed ? "center" : "flex-start",
                    }}>
                        {school.logo_url ? (
                            <img src={school.logo_url} alt={school.name} style={{ width: "48px", height: "48px", objectFit: "contain", borderRadius: "8px", flexShrink: 0 }} />
                        ) : (
                            <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`, flexShrink: 0 }}></div>
                        )}
                        {!collapsed && (
                            <span style={{
                                fontFamily: getFontFamily(school.nav_font), fontSize: "15.5px", fontWeight: 700,
                                letterSpacing: "-0.1px", color: theme.sidebarText, lineHeight: 1.3,
                                minWidth: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                            }}>
                                {school.name}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Main */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                {/* Navbar */}
                <div style={{
                    height: "64px", background: theme.navbarBg,
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 24px 0 16px",
                    position: "sticky", top: 0, zIndex: 100,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <button
                            className="admin-desktop-toggle"
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ width: "32px", height: "32px", background: "transparent", border: "0.5px solid #e2e8f0", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: theme.navbarText }}
                        >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                        <button
                            className="admin-hamburger"
                            onClick={() => setMobileOpen(true)}
                            style={{ display: "none", width: "32px", height: "32px", background: "transparent", border: "0.5px solid #e2e8f0", borderRadius: "8px", alignItems: "center", justifyContent: "center", cursor: "pointer", color: theme.navbarText }}
                            aria-label="Open menu"
                        >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                        <div>
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>Admin / </span>
                            <span style={{ fontSize: "14px", fontWeight: 500, color: theme.navbarText }}>{title}</span>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "30px", height: "30px", background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff" }}>
                            {user?.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <span className="admin-navbar-username" style={{ fontSize: "13px", fontWeight: 500, color: theme.navbarText }}>
                            {user?.name || "Admin"}
                        </span>
                        <div style={{ width: "1px", height: "20px", background: "#e2e8f0" }}></div>
                        <button
                            onClick={handleLogout}
                            style={{ padding: "6px 12px", background: "transparent", border: "0.5px solid #e2e8f0", borderRadius: "8px", fontSize: "12px", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                        >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                            <span className="admin-navbar-logout-text">Logout</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="admin-content-pad" style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
                    <Outlet />
                </div>
            </div>

            {/* Mobile drawer — hamburger-triggered slide-in sidebar for <900px, same pattern
                as the public site's Navbar mobile menu ── */}
            {mobileOpen && (
                <>
                    <div onClick={() => setMobileOpen(false)}
                        style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 998, animation: "adminDrawerBackdropIn 0.2s ease" }} />
                    <div style={{
                        position: "fixed", top: 0, left: 0, bottom: 0, width: "min(280px, 84vw)", zIndex: 999,
                        background: theme.sidebarBg, display: "flex", flexDirection: "column",
                        boxShadow: "0 0 40px rgba(0,0,0,0.25)", animation: "adminDrawerSlideIn 0.25s cubic-bezier(0.16,1,0.3,1)",
                    }}>
                        {/* Logo + close */}
                        <div style={{ height: "80px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: "0.5px solid #f1f5f9" }}>
                            <img src={logo} alt="Web Builder Pro" style={{ width: "170px", height: "76px", objectFit: "contain", objectPosition: "left center", display: "block" }} />
                            <button onClick={() => setMobileOpen(false)}
                                style={{ width: "32px", height: "32px", background: "#f8fafc", border: "0.5px solid #e2e8f0", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: theme.navbarText, flexShrink: 0 }}
                                aria-label="Close menu">
                                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18"/></svg>
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", paddingTop: "8px" }}>
                            <div style={{ padding: "4px 20px 4px", fontSize: "10px", color: theme.sidebarTextMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Main</div>
                            <nav style={{ padding: "4px 0" }}>
                                {coreItems.map((item) => <NavItem key={item.key} item={item} forceExpanded onNavigate={() => setMobileOpen(false)} />)}
                            </nav>
                            {moduleItems.length > 0 && (
                                <>
                                    <div style={{ padding: "12px 20px 4px", fontSize: "10px", color: theme.sidebarTextMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Modules</div>
                                    <nav style={{ padding: "4px 0" }}>
                                        {moduleItems.map((item) => <NavItem key={item.key} item={item} forceExpanded onNavigate={() => setMobileOpen(false)} />)}
                                    </nav>
                                </>
                            )}
                        </div>

                        {school && (
                            <div style={{ flexShrink: 0, borderTop: "0.5px solid #f1f5f9", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                                {school.logo_url ? (
                                    <img src={school.logo_url} alt={school.name} style={{ width: "44px", height: "44px", objectFit: "contain", borderRadius: "8px", flexShrink: 0 }} />
                                ) : (
                                    <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`, flexShrink: 0 }}></div>
                                )}
                                <span style={{ fontFamily: getFontFamily(school.nav_font), fontSize: "14px", fontWeight: 700, letterSpacing: "-0.1px", color: theme.sidebarText, lineHeight: 1.3, minWidth: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                    {school.name}
                                </span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminLayout;