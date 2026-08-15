import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectModulesApi, getSelectedModulesApi } from '../../api/school.api';
import useSchoolStore from '../../store/schoolStore';
import { moduleRegistry, getModulesByCategory } from '../../config/moduleRegistry';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

// ── Cream theme palette for this page — warm off-white background + ivory cards,
// distinct from the app's default white admin cards but consistent with the
// "Ivory Cream" base-color option offered elsewhere in the app ──
const CREAM_BG = 'linear-gradient(135deg, #faf6ea 0%, #f3ecd9 45%, #faf6ea 100%)';
const CARD_BG = '#fffdf8';
const CARD_BORDER = '#eee2c8';
const TEXT_MUTED = '#8a7d63';
const TEXT_MUTED_LIGHT = '#b3a684';
const ITEM_BG = '#faf7ef';
const ITEM_BORDER = '#ede0c4';
const ITEM_HOVER_BG = '#f5eeda';

const ModuleSelector = () => {
    const navigate = useNavigate();
    const { tc } = useSchoolStore();
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingExisting, setFetchingExisting] = useState(true);
    const [hoveredModule, setHoveredModule] = useState(null);

    useEffect(() => {
        fetchExistingModules();
    }, []);

    const fetchExistingModules = async () => {
        try {
            const res = await getSelectedModulesApi();
            const mods = res.data.selectedModules;
            const existing = typeof mods === 'string' ? JSON.parse(mods) : (mods || []);
            setSelected(existing);
        } catch (e) {
            console.error(e);
        } finally {
            setFetchingExisting(false);
        }
    };

    const toggleModule = (key) => {
        setSelected(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const selectAll = () => setSelected(moduleRegistry.map(m => m.key));
    const clearAll = () => setSelected([]);

    const handleSubmit = async () => {
        if (selected.length === 0) {
            toast.error('Please select at least one module');
            return;
        }
        setLoading(true);
        try {
            await selectModulesApi(selected);
            toast.success('Modules saved successfully!');
            navigate('/admin/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save modules');
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        {
            key: 'pages', label: 'Website Pages',
            desc: 'Static content pages for your school website',
            gradient: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 100%)`,
            shadow: hexToRgba(tc.primary, 0.25), dot: tc.primary,
            icon: <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        },
        {
            key: 'dynamic', label: 'Dynamic Modules',
            desc: 'Interactive features and forms',
            gradient: 'linear-gradient(135deg, #0f1e3d 0%, #1e3a5f 100%)',
            shadow: 'rgba(37,99,235,0.2)', dot: '#2563eb',
            icon: <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        },
        // Note: there used to be a third "Configuration" category here (Contact Us +
        // General Settings) — removed because those two are always-on admin features
        // (see AdminLayout.jsx's sidebar and App.jsx's routes), auto-available to every
        // school from account creation, not gated behind isModuleEnabled like the modules
        // below. Listing them as "selectable" here was misleading.
    ];

    if (fetchingExisting) {
        return (
            <div style={{ minHeight: '100vh', background: CREAM_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '44px', height: '44px', border: '3px solid #eee2c8', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }}></div>
                    <p style={{ color: TEXT_MUTED, fontSize: '14px' }}>Loading modules...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .cat-card { animation: fadeInUp 0.4s ease forwards; opacity: 0; }
                .cat-card:nth-child(1) { animation-delay: 0.05s; }
                .cat-card:nth-child(2) { animation-delay: 0.12s; }
                .cat-card:nth-child(3) { animation-delay: 0.19s; }
                .mod-item { transition: all 0.2s ease; }
                .mod-item:hover { transform: translateY(-2px); }
                @media (max-width: 720px) {
                    .mod-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 480px) {
                    .mod-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>

            <div style={{
                minHeight: '100vh',
                background: CREAM_BG,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: '3rem 2rem',
                fontFamily: 'system-ui, sans-serif',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* BG blobs */}
                <div style={{ position: 'fixed', width: '600px', height: '600px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.08)} 0%, transparent 70%)`, top: '-200px', right: '-100px', pointerEvents: 'none' }}></div>
                <div style={{ position: 'fixed', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)', bottom: '-100px', left: '-100px', pointerEvents: 'none' }}></div>
                <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(15,23,42,0.035) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }}></div>

                <div style={{ width: '100%', maxWidth: '920px', position: 'relative', zIndex: 1 }}>

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <div style={{ width: '64px', height: '64px', background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: `0 12px 32px ${hexToRgba(tc.primary, 0.3)}`, color: 'white' }}>
                            <svg width="28" height="28" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                            </svg>
                        </div>
                        <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', letterSpacing: '-0.5px' }}>
                            Manage Website Modules
                        </h1>
                        <p style={{ fontSize: '14px', color: TEXT_MUTED, maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
                            Select the pages and features you want on your school website. Previously selected modules are already checked.
                        </p>
                    </div>

                    {/* Stats + Actions Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: '14px', padding: '14px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{selected.length}</p>
                                <p style={{ fontSize: '11px', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected</p>
                            </div>
                            <div style={{ width: '1px', height: '32px', background: CARD_BORDER }}></div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '22px', fontWeight: 700, color: TEXT_MUTED_LIGHT, lineHeight: 1 }}>{moduleRegistry.length}</p>
                                <p style={{ fontSize: '11px', color: TEXT_MUTED_LIGHT, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</p>
                            </div>
                            {/* Progress bar */}
                            <div style={{ width: '120px', height: '6px', background: ITEM_BORDER, borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${(selected.length / moduleRegistry.length) * 100}%`, background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '3px', transition: 'width 0.3s ease' }}></div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={selectAll}
                                style={{ padding: '8px 16px', background: hexToRgba(tc.primary, 0.12), border: `1px solid ${hexToRgba(tc.primary, 0.3)}`, borderRadius: '6px', fontSize: '12px', color: tc.primary, cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s' }}
                            >
                                Select All
                            </button>
                            <button
                                onClick={clearAll}
                                style={{ padding: '8px 16px', background: ITEM_BG, border: `1px solid ${ITEM_BORDER}`, borderRadius: '8px', fontSize: '12px', color: TEXT_MUTED, cursor: 'pointer', transition: 'all 0.15s' }}
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    {/* Categories */}
                    {categories.map((cat, catIdx) => {
                        const modules = getModulesByCategory(cat.key);
                        const allSelected = modules.every(m => selected.includes(m.key));
                        const selectedCount = modules.filter(m => selected.includes(m.key)).length;

                        return (
                            <div key={cat.key} className="cat-card" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>

                                {/* Category Header */}
                                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${CARD_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: ITEM_BG, flexWrap: 'wrap', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: cat.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${cat.shadow}` }}>
                                            {cat.icon}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>{cat.label}</p>
                                            <p style={{ fontSize: '11px', color: TEXT_MUTED }}>{cat.desc} · <span style={{ color: cat.dot, fontWeight: 600 }}>{selectedCount}/{modules.length} selected</span></p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (allSelected) {
                                                setSelected(prev => prev.filter(k => !modules.map(m => m.key).includes(k)));
                                            } else {
                                                setSelected(prev => [...new Set([...prev, ...modules.map(m => m.key)])]);
                                            }
                                        }}
                                        style={{ padding: '7px 14px', background: allSelected ? hexToRgba(tc.primary, 0.15) : CARD_BG, color: allSelected ? tc.primary : TEXT_MUTED, border: allSelected ? `1px solid ${hexToRgba(tc.primary, 0.35)}` : `1px solid ${ITEM_BORDER}`, borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                                    >
                                        {allSelected ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>

                                {/* Module Grid */}
                                <div className="mod-grid" style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    {modules.map(module => {
                                        const isSelected = selected.includes(module.key);
                                        const isHovered = hoveredModule === module.key;
                                        return (
                                            <div
                                                key={module.key}
                                                className="mod-item"
                                                onClick={() => toggleModule(module.key)}
                                                onMouseEnter={() => setHoveredModule(module.key)}
                                                onMouseLeave={() => setHoveredModule(null)}
                                                style={{
                                                    padding: '12px 14px',
                                                    borderRadius: '12px',
                                                    border: isSelected ? `1.5px solid ${hexToRgba(tc.primary, 0.5)}` : `1px solid ${ITEM_BORDER}`,
                                                    background: isSelected ? hexToRgba(tc.primary, 0.1) : isHovered ? ITEM_HOVER_BG : ITEM_BG,
                                                    cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                    boxShadow: isSelected ? `0 4px 16px ${hexToRgba(tc.primary, 0.15)}` : 'none',
                                                }}
                                            >
                                                {/* Checkbox */}
                                                <div style={{
                                                    width: '18px', height: '18px', borderRadius: '5px',
                                                    border: isSelected ? 'none' : `1.5px solid ${ITEM_BORDER}`,
                                                    background: isSelected ? `linear-gradient(135deg,${tc.primary},${tc.secondary})` : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0, transition: 'all 0.15s',
                                                    boxShadow: isSelected ? `0 2px 8px ${hexToRgba(tc.primary, 0.35)}` : 'none'
                                                }}>
                                                    {isSelected && (
                                                        <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                                        </svg>
                                                    )}
                                                </div>

                                                {/* Icon */}
                                                <div style={{ color: isSelected ? tc.primary : TEXT_MUTED_LIGHT, flexShrink: 0, transition: 'color 0.15s' }}>
                                                    {module.icon}
                                                </div>

                                                {/* Label */}
                                                <span style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 400, color: isSelected ? '#0f172a' : TEXT_MUTED, lineHeight: 1.3, transition: 'all 0.15s' }}>
                                                    {module.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Submit */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', paddingBottom: '2rem' }}>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || selected.length === 0}
                            style={{
                                padding: '14px 48px',
                                background: selected.length === 0 ? ITEM_BG : `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`,
                                color: selected.length === 0 ? TEXT_MUTED_LIGHT : '#ffffff',
                                border: selected.length === 0 ? `1px solid ${ITEM_BORDER}` : 'none',
                                borderRadius: '8px',
                                fontSize: '15px', fontWeight: 700,
                                cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '10px',
                                transition: 'all 0.2s ease',
                                boxShadow: selected.length > 0 ? `0 8px 28px ${hexToRgba(tc.primary, 0.35)}` : 'none',
                                letterSpacing: '0.02em'
                            }}
                        >
                            {loading ? (
                                <>
                                    <svg style={{ animation: 'spin 1s linear infinite', width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none">
                                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                    </svg>
                                    Saving modules...
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                    </svg>
                                    Save {selected.length} modules
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
};

export default ModuleSelector;
