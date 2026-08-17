import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import useSchoolStore from '../../../store/schoolStore';
import ItalicToggle from '../../../components/common/ItalicToggle';
import HeadingStyleField from '../../../components/common/HeadingStyleField';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const ALL_CLASSES = [
    'Nursery', 'LKG', 'UKG',
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12'
];

const DEFAULT_FEE_TYPES = [
    'Tuition Fee', 'Activity Fee', 'Transport Fee', 'Admission Fee',
    'Exam Fee', 'Lab Fee', 'Library Fee', 'Sports Fee',
    'Computer Fee', 'Hostel Fee', 'Uniform Fee',
];

const PERIODS = [
    { key: 'quarterly', label: 'Quarterly' },
    { key: 'halfYearly', label: 'Half-Yearly' },
    { key: 'annual', label: 'Full Year' },
];

const FEE_TABS = [
    { key: 'classes', label: 'Class-wise Fees', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg> },
    { key: 'optional', label: 'Optional Fee Tables', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> },
    { key: 'transport', label: 'School Transport', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 19h8m-8 0a2 2 0 01-2-2v-1h12v1a2 2 0 01-2 2m-8 0v1m8-1v1M5 16V7a2 2 0 012-2h10a2 2 0 012 2v9M5 16h14M8 11h8" /></svg> },
];

const defaultContent = {
    classes: [], optionalFeeTables: [], transportTables: [],
    optionalSubjectsHeading: '', optionalSubjectsHeadingColor: '', optionalSubjectsHeadingFont: '', optionalSubjectsHeadingItalic: false,
};

const FeeStructure = () => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [activeTab, setActiveTab] = useState('classes');
    const [activeClass, setActiveClass] = useState(null);
    const [activePeriod, setActivePeriod] = useState('annual');
    const [showAddClass, setShowAddClass] = useState(false);
    const [selectedNewClass, setSelectedNewClass] = useState('');

    useEffect(() => { fetchContent(); }, []);

    // Migrate legacy single `amount` per fee into the new `amounts: { quarterly, halfYearly, annual }` shape.
    const migrateClasses = (classes = []) => classes.map(cls => ({
        ...cls,
        fees: (cls.fees || []).map(f => f.amounts
            ? f
            : { type: f.type, amounts: { quarterly: '', halfYearly: '', annual: f.amount || '' } }),
    }));

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('fee');
            if (res.data) {
                const raw = res.data.content || {};
                const classes = migrateClasses(raw.classes);
                const merged = { ...defaultContent, ...raw, classes };
                setContent(merged);
                setSavedSnapshot(JSON.stringify(merged));
                setIsPublished(res.data.is_published === 1);
                if (classes.length > 0) {
                    setActiveClass(classes[0].name);
                }
            }
        } catch (e) {
            console.log('No content yet');
        } finally {
            setLoading(false);
        }
    };

    const fetchPublishedFlag = async () => {
        const res = await getModuleContentApi('fee');
        return !!res?.data?.is_published;
    };

    const handleSave = async (publish = false) => {
        publish ? setPublishing(true) : setSaving(true);
        try {
            await saveModuleContentApi('fee', content, publish ? 1 : isPublished ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                let current = await fetchPublishedFlag();
                if (!current) {
                    await togglePublishApi('fee', 1);
                    current = await fetchPublishedFlag();
                }
                setIsPublished(current);
                toast.success('Fee Structure published! 🎉');
            }
            else toast.success('Saved!');
        } catch (e) {
            toast.error('Failed to save');
        } finally {
            setSaving(false); setPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        try {
            let current = await fetchPublishedFlag();
            if (current) {
                await togglePublishApi('fee', 0);
                current = await fetchPublishedFlag();
            }
            setIsPublished(current);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    // ── Class operations ──
    const addClass = () => {
        if (!selectedNewClass) return;
        if (content.classes.find(c => c.name === selectedNewClass)) {
            toast.error('Class already added'); return;
        }
        const newClass = { name: selectedNewClass, fees: [] };
        setContent(prev => ({ ...prev, classes: [...prev.classes, newClass] }));
        setActiveClass(selectedNewClass);
        setShowAddClass(false);
        setSelectedNewClass('');
    };

    const removeClass = (className) => {
        setContent(prev => ({ ...prev, classes: prev.classes.filter(c => c.name !== className) }));
        if (activeClass === className) {
            const remaining = content.classes.filter(c => c.name !== className);
            setActiveClass(remaining.length > 0 ? remaining[0].name : null);
        }
    };

    // ── Fee operations ──
    const getActiveClassData = () => content.classes.find(c => c.name === activeClass);

    const addFeeType = (feeTypeName) => {
        if (!feeTypeName || !activeClass) return;
        const cls = getActiveClassData();
        if (cls?.fees.find(f => f.type === feeTypeName)) {
            toast.error('Fee type already added'); return;
        }
        setContent(prev => ({
            ...prev,
            classes: prev.classes.map(c =>
                c.name === activeClass
                    ? { ...c, fees: [...c.fees, { type: feeTypeName, amounts: { quarterly: '', halfYearly: '', annual: '' } }] }
                    : c
            )
        }));
    };

    const removeFeeType = (feeType) => {
        setContent(prev => ({
            ...prev,
            classes: prev.classes.map(c =>
                c.name === activeClass
                    ? { ...c, fees: c.fees.filter(f => f.type !== feeType) }
                    : c
            )
        }));
    };

    const updateFeeAmount = (feeType, amount) => {
        setContent(prev => ({
            ...prev,
            classes: prev.classes.map(c =>
                c.name === activeClass
                    ? { ...c, fees: c.fees.map(f => f.type === feeType ? { ...f, amounts: { ...f.amounts, [activePeriod]: amount } } : f) }
                    : c
            )
        }));
    };

    const getTotal = (fees, period = activePeriod) => {
        return fees.reduce((sum, f) => {
            const num = parseFloat(f.amounts?.[period]?.toString().replace(/,/g, '') || 0);
            return sum + (isNaN(num) ? 0 : num);
        }, 0);
    };

    // ── Generic table builder ops — shared by Optional Fee Tables & Transport Tables ──
    const addTable = (key) => {
        const table = { id: `tbl-${Date.now()}`, title: '', itemLabel: 'Item', amountLabel: 'Amount', rows: [] };
        setContent(prev => ({ ...prev, [key]: [...prev[key], table] }));
    };

    const removeTable = (key, tableId) => {
        setContent(prev => ({ ...prev, [key]: prev[key].filter(t => t.id !== tableId) }));
    };

    const updateTable = (key, tableId, field, value) => {
        setContent(prev => ({
            ...prev,
            [key]: prev[key].map(t => t.id === tableId ? { ...t, [field]: value } : t)
        }));
    };

    const addRow = (key, tableId, type) => {
        const row = { id: `row-${Date.now()}`, type, label: '', value: '', text: '' };
        setContent(prev => ({
            ...prev,
            [key]: prev[key].map(t => t.id === tableId ? { ...t, rows: [...t.rows, row] } : t)
        }));
    };

    const updateRow = (key, tableId, rowId, field, value) => {
        setContent(prev => ({
            ...prev,
            [key]: prev[key].map(t => t.id === tableId
                ? { ...t, rows: t.rows.map(r => r.id === rowId ? { ...r, [field]: value } : r) }
                : t)
        }));
    };

    const removeRow = (key, tableId, rowId) => {
        setContent(prev => ({
            ...prev,
            [key]: prev[key].map(t => t.id === tableId ? { ...t, rows: t.rows.filter(r => r.id !== rowId) } : t)
        }));
    };

    const availableClasses = ALL_CLASSES.filter(c => !content.classes.find(cl => cl.name === c));
    const activeClassData = getActiveClassData();

    const inputStyle = {
        width: '100%', padding: '10px 14px', border: '1px solid #e5e9f0',
        borderRadius: '10px', fontSize: '13.5px', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'system-ui, sans-serif',
        transition: 'border 0.2s, box-shadow 0.2s, background 0.2s'
    };

    const isDirty = savedSnapshot !== null && JSON.stringify(content) !== savedSnapshot;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes drift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-24px, 18px) scale(1.08); } }
                .fs-section { animation: fadeInUp 0.35s ease forwards; }
                @media (max-width: 800px) {
                    .fs-section { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 560px) {
                    .fs-row-grid { grid-template-columns: 1fr 90px 40px !important; }
                }
                .fee-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .class-tab { transition: all 0.15s; }
                .class-tab:hover { background: ${tc.light} !important; }
                .fs-tab-btn { transition: all 0.15s; }
                .fs-tab-btn:hover { border-color: ${tc.primary}55 !important; }
                .fs-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .fs-hero-orb { animation: drift1 9s ease-in-out infinite; }
                @media (max-width: 640px) {
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .fs-hero-inner { gap: 12px !important; }
                    .fs-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .fs-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .fs-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .fs-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .fs-status-badge { padding: 4px 9px !important; }
                    .fs-status-badge span { font-size: 9.5px !important; }
                    .fs-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }
                    .fs-period-tabs { flex-wrap: wrap !important; }
                }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif', background: bc.surface, margin: '-24px', padding: '24px', minHeight: '100vh' }}>

                {/* ── Hero Header ── */}
                <div className="dash-hero" style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div className="fs-hero-orb" style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
                    <div className="fs-hero-inner" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div className="fs-hero-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                            <div className="fs-hero-item">
                                <p className="fs-hero-eyebrow" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Fee Structure</p>
                                <h1 className="fs-hero-title" style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Fee Structure</h1>
                                <p className="fs-hero-desc" style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                                    Add classes and their fee breakdown — only filled classes show on public website.
                                </p>
                            </div>
                            <div className="fs-hero-item fs-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 11px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '999px', flexShrink: 0 }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8', flexShrink: 0 }}></div>
                                <span style={{ fontSize: '10.5px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{isPublished ? 'Published' : 'Draft'}</span>
                            </div>
                        </div>
                        <div className="fs-hero-item fs-hero-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <ModuleActionButtons
                                tc={tc}
                                saving={saving}
                                publishing={publishing}
                                isPublished={isPublished}
                                isDirty={isDirty}
                                onSave={() => handleSave(false)}
                                onPublish={() => handleSave(true)}
                                onUnpublish={handleUnpublish}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Section tabs ── */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
                    {FEE_TABS.map(t => {
                        const count = t.key === 'classes' ? content.classes.length : t.key === 'optional' ? content.optionalFeeTables.length : content.transportTables.length;
                        return (
                            <button key={t.key} type="button" className="fs-tab-btn" onClick={() => setActiveTab(t.key)}
                                style={{ padding: '10px 20px', borderRadius: '10px', border: activeTab === t.key ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0', fontSize: '13px', cursor: 'pointer', background: activeTab === t.key ? tc.light : '#ffffff', color: activeTab === t.key ? tc.primary : '#64748b', fontWeight: activeTab === t.key ? 600 : 400, display: 'flex', alignItems: 'center', gap: '7px', boxShadow: activeTab === t.key ? `0 4px 12px ${hexToRgba(tc.primary, 0.15)}` : 'none' }}>
                                <span style={{ color: activeTab === t.key ? tc.primary : '#94a3b8' }}>{t.icon}</span>
                                {t.label}
                                <span style={{ fontSize: '11px', color: activeTab === t.key ? tc.primary : '#cbd5e1', fontWeight: 700 }}>{count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Main Layout ── */}
                {activeTab === 'classes' && (
                <div className="fs-section" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.25rem', alignItems: 'flex-start' }}>

                    {/* ── Left — Class List ── */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', position: 'sticky', top: '24px' }}>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)' }}>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Classes</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>{content.classes.length} added</p>
                        </div>

                        <div style={{ padding: '8px' }}>
                            {content.classes.length === 0 && (
                                <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '1.5rem 0' }}>No classes added yet</p>
                            )}
                            {content.classes.map(cls => (
                                <div key={cls.name}
                                    className="class-tab"
                                    onClick={() => setActiveClass(cls.name)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px',
                                        background: activeClass === cls.name ? tc.light : 'transparent',
                                        border: activeClass === cls.name ? '1px solid #f9c4d4' : '1px solid transparent',
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cls.fees.length > 0 ? '#22c55e' : '#e2e8f0' }}></div>
                                        <span style={{ fontSize: '13px', fontWeight: activeClass === cls.name ? 600 : 400, color: activeClass === cls.name ? tc.primary : '#0f172a' }}>{cls.name}</span>
                                    </div>
                                    <button onClick={e => { e.stopPropagation(); removeClass(cls.name); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', fontSize: '14px', lineHeight: 1 }}>×</button>
                                </div>
                            ))}
                        </div>

                        {/* Add Class */}
                        <div style={{ padding: '8px', borderTop: '0.5px solid #f1f5f9' }}>
                            {showAddClass ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px' }}>
                                    <select value={selectedNewClass} onChange={e => setSelectedNewClass(e.target.value)}
                                        style={{ ...inputStyle, fontSize: '12px', padding: '8px 10px' }}>
                                        <option value="">Select class...</option>
                                        {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={addClass}
                                            style={{ flex: 1, padding: '7px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                            Add
                                        </button>
                                        <button onClick={() => { setShowAddClass(false); setSelectedNewClass(''); }}
                                            style={{ flex: 1, padding: '7px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowAddClass(true)} disabled={availableClasses.length === 0}
                                    style={{ width: '100%', padding: '9px', background: 'transparent', border: '1.5px dashed #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                                    Add Class
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Right — Fee Editor ── */}
                    {!activeClass ? (
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '4rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ width: '56px', height: '56px', background: '#f1f5f9', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <svg width="24" height="24" fill="none" stroke="#94a3b8" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m-6 4h6m-6 4h4M5 21h14a1 1 0 001-1V6.41a1 1 0 00-.29-.7L16.29 2.29A1 1 0 0015.59 2H5a1 1 0 00-1 1v17a1 1 0 001 1z" /></svg>
                            </div>
                            <p style={{ fontSize: '15px', fontWeight: 500, color: '#0f172a', marginBottom: '6px' }}>No class selected</p>
                            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Add a class from the left panel to start entering fees</p>
                        </div>
                    ) : (
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            {/* Header */}
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                        <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                                    </div>
                                    <div>
                                        <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px' }}>{activeClass}</p>
                                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{activeClassData?.fees.length || 0} fee types added</p>
                                    </div>
                                </div>
                                {activeClassData?.fees.length > 0 && (
                                    <div style={{ padding: '8px 16px', background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: '10px' }}>
                                        <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Total {PERIODS.find(p => p.key === activePeriod)?.label} Fee</p>
                                        <p style={{ fontSize: '16px', fontWeight: 700, color: '#15803d' }}>
                                            ₹{getTotal(activeClassData.fees).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '1.75rem' }}>
                                {/* Period Tabs — choose which table (Quarterly / Half-Yearly / Full Year) you're filling amounts for */}
                                <div className="fs-period-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
                                    {PERIODS.map(p => (
                                        <button key={p.key} onClick={() => setActivePeriod(p.key)}
                                            style={{
                                                padding: '9px 20px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
                                                border: activePeriod === p.key ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0',
                                                background: activePeriod === p.key ? tc.light : '#ffffff',
                                                color: activePeriod === p.key ? tc.primary : '#64748b',
                                                transition: 'all 0.15s',
                                            }}>
                                            {p.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Add Fee Type */}
                                <AddFeeTypeRow onAdd={addFeeType} existingTypes={activeClassData?.fees.map(f => f.type) || []} defaultFeeTypes={DEFAULT_FEE_TYPES} inputStyle={inputStyle} />

                                {/* Fee List */}
                                {activeClassData?.fees.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8', fontSize: '13px' }}>
                                        No fee types added yet — use the dropdown above
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '1.25rem' }}>
                                        {/* Table Header */}
                                        <div className="fs-row-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 200px 44px', gap: '12px', padding: '8px 12px', background: `linear-gradient(135deg,${tc.dark},${tc.primary})`, borderRadius: '8px', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fee Type</span>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{PERIODS.find(p => p.key === activePeriod)?.label} Amount (₹)</span>
                                            <span></span>
                                        </div>

                                        {activeClassData.fees.map((fee, i) => (
                                            <div key={fee.type} className="fs-row-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 200px 44px', gap: '12px', padding: '10px 12px', borderBottom: '0.5px solid #f8fafc', alignItems: 'center', background: i % 2 === 0 ? '#fafafa' : '#ffffff', borderRadius: '6px', marginBottom: '3px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{fee.type}</span>
                                                <div style={{ position: 'relative' }}>
                                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#64748b' }}>₹</span>
                                                    <input
                                                        className="fee-input"
                                                        type="number"
                                                        value={fee.amounts?.[activePeriod] || ''}
                                                        onChange={e => updateFeeAmount(fee.type, e.target.value)}
                                                        placeholder="0"
                                                        style={{ ...inputStyle, paddingLeft: '28px' }}
                                                    />
                                                </div>
                                                <button onClick={() => removeFeeType(fee.type)}
                                                    style={{ width: '36px', height: '36px', background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '16px' }}>
                                                    ×
                                                </button>
                                            </div>
                                        ))}

                                        {/* Total Row */}
                                        <div className="fs-row-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 200px 44px', gap: '12px', padding: '12px 12px', marginTop: '6px', background: 'linear-gradient(135deg,#fdf0f5,#fff5f8)', borderRadius: '8px', border: '1px solid #f9c4d4' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: tc.primary }}>Total {PERIODS.find(p => p.key === activePeriod)?.label} Fee</span>
                                            <span style={{ fontSize: '15px', fontWeight: 800, color: tc.primary }}>₹{getTotal(activeClassData.fees).toLocaleString('en-IN')}</span>
                                            <span></span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                )}

                {/* ── Optional Fee Tables ── */}
                {activeTab === 'optional' && (
                <div>
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Optional Fee Tables</p>
                                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>Robotics, Music, Foreign Language, Swimming etc. Shown 2 per row on the public site.</p>
                            </div>
                        </div>
                        <div style={{ padding: '1.5rem 1.75rem' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section Heading</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    className="fee-input"
                                    type="text"
                                    value={content.optionalSubjectsHeading}
                                    onChange={e => setContent(prev => ({ ...prev, optionalSubjectsHeading: e.target.value }))}
                                    placeholder="Other optional subjects are also offered"
                                    style={{ ...inputStyle, fontStyle: content.optionalSubjectsHeadingItalic ? 'italic' : 'normal' }}
                                />
                                <ItalicToggle active={!!content.optionalSubjectsHeadingItalic} onToggle={() => setContent(prev => ({ ...prev, optionalSubjectsHeadingItalic: !prev.optionalSubjectsHeadingItalic }))} />
                            </div>
                            <HeadingStyleField
                                color={content.optionalSubjectsHeadingColor} onColorChange={val => setContent(prev => ({ ...prev, optionalSubjectsHeadingColor: val }))}
                                font={content.optionalSubjectsHeadingFont} onFontChange={val => setContent(prev => ({ ...prev, optionalSubjectsHeadingFont: val }))}
                            />
                        </div>
                    </div>

                    <FeeTableEditor
                        sectionKey="optionalFeeTables"
                        tables={content.optionalFeeTables}
                        inputStyle={inputStyle}
                        onAddTable={addTable}
                        onRemoveTable={removeTable}
                        onUpdateTable={updateTable}
                        onAddRow={addRow}
                        onUpdateRow={updateRow}
                        onRemoveRow={removeRow}
                    />
                </div>
                )}

                {/* ── School Transport Tables ── */}
                {activeTab === 'transport' && (
                <div>
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)' }}>
                            <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 19h8m-8 0a2 2 0 01-2-2v-1h12v1a2 2 0 01-2 2m-8 0v1m8-1v1M5 16V7a2 2 0 012-2h10a2 2 0 012 2v9M5 16h14M8 11h8" /></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>School Transport Tables</p>
                                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>Shown on the public site under "School Transport (Optional)" — e.g. Rickshaw, Bus/Van. Shown 2 per row.</p>
                            </div>
                        </div>
                    </div>
                    <FeeTableEditor
                        sectionKey="transportTables"
                        tables={content.transportTables}
                        inputStyle={inputStyle}
                        onAddTable={addTable}
                        onRemoveTable={removeTable}
                        onUpdateTable={updateTable}
                        onAddRow={addRow}
                        onUpdateRow={updateRow}
                        onRemoveRow={removeRow}
                    />
                </div>
                )}

            </div>
        </>
    );
};

// ── Add Fee Type Row Component ──
const AddFeeTypeRow = ({ onAdd, existingTypes, defaultFeeTypes, inputStyle }) => {
    const { tc } = useSchoolStore();
    const [selected, setSelected] = useState('');
    const [customType, setCustomType] = useState('');
    const [showCustomModal, setShowCustomModal] = useState(false);
    const customInputRef = useRef(null);

    const availableTypes = defaultFeeTypes.filter(t => !existingTypes.includes(t));

    useEffect(() => {
        if (showCustomModal) customInputRef.current?.focus();
    }, [showCustomModal]);

    const handleSelect = (val) => {
        if (val === '__other__') {
            setCustomType('');
            setShowCustomModal(true);
        } else {
            setSelected(val);
        }
    };

    const handleAdd = () => {
        if (!selected) return;
        onAdd(selected);
        setSelected('');
    };

    const closeCustomModal = () => {
        setShowCustomModal(false);
        setCustomType('');
    };

    const confirmCustom = () => {
        const typeToAdd = customType.trim();
        if (!typeToAdd) return;
        onAdd(typeToAdd);
        closeCustomModal();
    };

    return (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '0.5px solid #e2e8f0', marginBottom: '4px' }}>
            <div style={{ flex: 1 }}>
                <select value={selected} onChange={e => handleSelect(e.target.value)}
                    style={{ ...inputStyle, fontSize: '13px', cursor: 'pointer' }}>
                    <option value="">Select fee type to add...</option>
                    {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    <option value="__other__">+ Other (custom)</option>
                </select>
            </div>
            <button onClick={handleAdd}
                style={{ padding: '10px 20px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.25)}`, flexShrink: 0 }}>
                + Add Fee
            </button>

            {showCustomModal && createPortal(
                <>
                    <style>{`
                        @keyframes cftBackdropIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes cftModalIn { from { opacity: 0; transform: translateY(16px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
                        @keyframes cftOrbDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-14px,10px) scale(1.08); } }
                        .cft-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.12)} !important; background: #ffffff !important; }
                        .cft-cancel-btn:hover { background: #f1f5f9 !important; }
                        .cft-confirm-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 8px 20px ${hexToRgba(tc.primary, 0.35)} !important; }
                        .cft-close-btn:hover { background: rgba(255,255,255,0.25) !important; }
                    `}</style>
                    <div onClick={closeCustomModal}
                        style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', animation: 'cftBackdropIn 0.2s ease' }}>
                        <div onClick={e => e.stopPropagation()}
                            style={{ width: '100%', maxWidth: '420px', background: '#ffffff', borderRadius: '22px', boxShadow: '0 40px 90px rgba(15,23,42,0.4)', overflow: 'hidden', fontFamily: 'system-ui, sans-serif', animation: 'cftModalIn 0.32s cubic-bezier(0.16,1,0.3,1)' }}>

                            {/* Gradient header */}
                            <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: '1.75rem 1.75rem 1.5rem' }}>
                                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }}></div>
                                <div style={{ position: 'absolute', width: '160px', height: '160px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}45, transparent 70%)`, top: '-70px', right: '-40px', animation: 'cftOrbDrift 7s ease-in-out infinite', pointerEvents: 'none' }}></div>

                                <button onClick={closeCustomModal} className="cft-close-btn"
                                    style={{ position: 'absolute', top: '14px', right: '14px', width: '30px', height: '30px', borderRadius: '9px', background: 'rgba(255,255,255,0.14)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s ease' }}>
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>

                                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 16px rgba(0,0,0,0.2)' }}>
                                        <svg width="21" height="21" fill="none" stroke="#ffffff" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5.586a1 1 0 01.707.293l6.414 6.414a1 1 0 010 1.414l-8.586 8.586a1 1 0 01-1.414 0L3.293 13.293A1 1 0 013 12.586V7a4 4 0 014-4z"/></svg>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '16.5px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.2px' }}>Custom Fee Type</p>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>Add a fee type unique to your school</p>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '1.5rem 1.75rem 1.75rem' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fee Type Name</label>
                                <input ref={customInputRef} className="cft-input" type="text" value={customType} onChange={e => setCustomType(e.target.value)}
                                    placeholder="e.g. Lab Fee, Sports Kit, Smart Class"
                                    style={{ width: '100%', padding: '12px 15px', border: '1.5px solid #e2e8f0', borderRadius: '11px', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'system-ui, sans-serif', transition: 'border 0.2s, box-shadow 0.2s, background 0.2s' }}
                                    onKeyDown={e => { if (e.key === 'Enter') confirmCustom(); if (e.key === 'Escape') closeCustomModal(); }} />

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
                                    <button onClick={closeCustomModal} className="cft-cancel-btn"
                                        style={{ padding: '10px 20px', background: '#f8fafc', color: '#64748b', border: '1px solid #eef1f6', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s ease' }}>
                                        Cancel
                                    </button>
                                    <button onClick={confirmCustom} disabled={!customType.trim()} className="cft-confirm-btn"
                                        style={{ padding: '10px 22px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: customType.trim() ? 'pointer' : 'not-allowed', opacity: customType.trim() ? 1 : 0.45, boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}`, transition: 'transform 0.15s ease, box-shadow 0.15s ease', display: 'flex', alignItems: 'center', gap: '7px' }}>
                                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/></svg>
                                        Add Fee
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

// ── Generic small-table builder — used for both Optional Fee Tables and Transport Tables ──
const FeeTableEditor = ({ sectionKey, tables, inputStyle, onAddTable, onRemoveTable, onUpdateTable, onAddRow, onUpdateRow, onRemoveRow }) => {
    const { tc } = useSchoolStore();
    const rowTypeBadge = { item: tc.primary, subheading: '#1e3a5f', note: '#92400e' };
    const smallBtnStyle = { padding: '7px 14px', background: '#f8fafc', color: '#64748b', border: '0.5px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {tables.length === 0 && (
                <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>No tables yet — click "+ Add Table" below to create one.</p>
                </div>
            )}

            {tables.map((table) => (
                <div key={table.id} style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            value={table.title}
                            onChange={e => onUpdateTable(sectionKey, table.id, 'title', e.target.value)}
                            placeholder="Enter Table Title"
                            style={{ ...inputStyle, fontWeight: 600, flex: 1 }}
                        />
                        <button onClick={() => onRemoveTable(sectionKey, table.id)}
                            style={{ padding: '9px 16px', background: '#fef2f2', color: '#ef4444', border: '0.5px solid #fecaca', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Remove Table
                        </button>
                    </div>

                    <div style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
                            <div style={{ width: '68px', flexShrink: 0 }}></div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item Column Label</label>
                                <input value={table.itemLabel} onChange={e => onUpdateTable(sectionKey, table.id, 'itemLabel', e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount Column Label</label>
                                <input value={table.amountLabel} onChange={e => onUpdateTable(sectionKey, table.id, 'amountLabel', e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ width: '32px', flexShrink: 0 }}></div>
                        </div>

                        {table.rows.map(row => (
                            <div key={row.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', padding: '8px', background: '#fafafa', borderRadius: '8px' }}>
                                <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: rowTypeBadge[row.type], width: '68px', flexShrink: 0 }}>{row.type}</span>
                                {row.type === 'item' ? (
                                    <>
                                        <input value={row.label} onChange={e => onUpdateRow(sectionKey, table.id, row.id, 'label', e.target.value)}
                                            placeholder="Enter Item Label" style={{ ...inputStyle, flex: 1 }} />
                                        <input value={row.value} onChange={e => onUpdateRow(sectionKey, table.id, row.id, 'value', e.target.value)}
                                            placeholder="Enter Amount" style={{ ...inputStyle, flex: 1 }} />
                                    </>
                                ) : (
                                    <input value={row.text} onChange={e => onUpdateRow(sectionKey, table.id, row.id, 'text', e.target.value)}
                                        placeholder={row.type === 'subheading' ? 'Enter Subheading Text' : 'Enter Footnote Text'}
                                        style={{ ...inputStyle, flex: 1 }} />
                                )}
                                <button onClick={() => onRemoveRow(sectionKey, table.id, row.id)}
                                    style={{ width: '32px', height: '32px', background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '7px', cursor: 'pointer', color: '#ef4444', fontSize: '14px', flexShrink: 0 }}>
                                    ×
                                </button>
                            </div>
                        ))}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '0.75rem' }}>
                            <button onClick={() => onAddRow(sectionKey, table.id, 'item')} style={smallBtnStyle}>+ Item Row</button>
                            <button onClick={() => onAddRow(sectionKey, table.id, 'subheading')} style={smallBtnStyle}>+ Subheading</button>
                            <button onClick={() => onAddRow(sectionKey, table.id, 'note')} style={smallBtnStyle}>+ Note</button>
                        </div>
                    </div>
                </div>
            ))}

            <button onClick={() => onAddTable(sectionKey)}
                style={{ alignSelf: 'flex-start', padding: '10px 20px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.25)}` }}>
                + Add Table
            </button>
        </div>
    );
};

export default FeeStructure;