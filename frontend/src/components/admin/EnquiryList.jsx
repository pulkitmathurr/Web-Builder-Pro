import { useEffect, useState } from 'react';
import { getEnquiriesApi, updateEnquiryStatusApi, deleteEnquiryApi } from '../../api/enquiry.api';
import useSchoolStore from '../../store/schoolStore';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const getInitials = (name) => (name || '?')
    .trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const STATUS_COLORS = {
    new: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#2563eb' },
    contacted: { bg: '#fefce8', border: '#fde68a', text: '#a16207', dot: '#d97706' },
    closed: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#16a34a' },
};

const formatDateTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const ClockIcon = ({ color = '#94a3b8', size = 11 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.2 2" />
    </svg>
);

const ChevronIcon = ({ color = '#94a3b8', size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
    </svg>
);

const TrashIcon = ({ color = '#ef4444', size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0-1 13a1 1 0 01-1 1H8a1 1 0 01-1-1L6 7h12z" />
    </svg>
);

// ── Shared list/inbox UI for both Admission Enquiry and Career Enquiry admin pages —
// same submission → status → delete lifecycle, only the extra fields shown per row differ. ──
const EnquiryList = ({ type, breadcrumb, title, description, extraFields = [] }) => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [enquiries, setEnquiries] = useState([]);
    const [expanded, setExpanded] = useState(null);

    useEffect(() => { fetchEnquiries(); }, [type]);

    const fetchEnquiries = async () => {
        setLoading(true);
        try {
            const res = await getEnquiriesApi(type);
            setEnquiries(res.data || []);
        } catch (e) {
            toast.error('Failed to load enquiries');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (uuid, status) => {
        setEnquiries(prev => prev.map(en => en.uuid === uuid ? { ...en, status } : en));
        try {
            await updateEnquiryStatusApi(uuid, status);
        } catch (e) {
            toast.error('Failed to update status');
            fetchEnquiries();
        }
    };

    const handleDelete = async (uuid) => {
        if (!window.confirm('Delete this enquiry? This cannot be undone.')) return;
        try {
            await deleteEnquiryApi(uuid);
            setEnquiries(prev => prev.filter(en => en.uuid !== uuid));
            toast.success('Deleted');
        } catch (e) {
            toast.error('Failed to delete');
        }
    };

    const newCount = enquiries.filter(e => e.status === 'new').length;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes rowIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes detailIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulseDot { 0%, 100% { box-shadow: 0 0 0 0 ${hexToRgba(tc.primary, 0.5)}; } 70% { box-shadow: 0 0 0 6px ${hexToRgba(tc.primary, 0)}; } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .enquiry-section { animation: fadeInUp 0.35s ease forwards; }
                .enquiry-row { animation: rowIn 0.35s ease both; transition: border-left-width 0.2s ease; }
                .enquiry-row:hover { background: #f8fafc; }
                .enquiry-row-detail { animation: detailIn 0.2s ease; }
                .enquiry-avatar { transition: transform 0.25s ease, box-shadow 0.25s ease; }
                .enquiry-row:hover .enquiry-avatar { transform: scale(1.08); box-shadow: 0 4px 14px ${hexToRgba(tc.primary, 0.35)}; }
                .enquiry-chevron { transition: transform 0.25s ease, color 0.2s ease; }
                .enquiry-row:hover .enquiry-chevron { color: ${tc.primary} !important; }
                .enquiry-status-select { transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s; }
                .enquiry-status-select:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(15,23,42,0.08); }
                .enquiry-remove { transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease; }
                .enquiry-remove:hover { transform: scale(1.08); background: #ef4444; border-color: #ef4444; }
                .enquiry-remove:hover svg { stroke: #ffffff; }
                .enquiry-link-pill { transition: transform 0.18s ease, box-shadow 0.18s ease; }
                .enquiry-link-pill:hover { transform: translateY(-1px); box-shadow: 0 4px 12px ${hexToRgba(tc.primary, 0.35)}; }
                .enquiry-new-pulse { animation: pulseDot 2s infinite; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, margin: '-24px', padding: '24px', minHeight: '100vh' }}>

                {/* Hero Header */}
                <div style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>{breadcrumb}</p>
                            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>{title}</h1>
                            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '440px' }}>{description}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ textAlign: 'center', padding: '10px 20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px' }}>
                                <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>{enquiries.length}</div>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', background: newCount > 0 ? hexToRgba('#ffffff', 0.14) : 'rgba(255,255,255,0.08)', border: `1px solid ${newCount > 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '10px' }}>
                                {newCount > 0 && <span className="enquiry-new-pulse" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ffffff', flexShrink: 0 }}></span>}
                                <div>
                                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{newCount}</div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '3px' }}>New</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="enquiry-section">
                    {enquiries.length === 0 ? (
                        <div style={{ background: '#ffffff', border: '1.5px dashed #cbd5e1', borderRadius: '10px', padding: '3.5rem 2rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>No enquiries yet. Submissions from the public site will show up here.</p>
                        </div>
                    ) : (
                        <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '10px', boxShadow: '0 4px 16px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
                            {enquiries.map((en, i) => {
                                const sc = STATUS_COLORS[en.status] || STATUS_COLORS.new;
                                const isOpen = expanded === en.uuid;
                                const accentColor = en.status === 'new' ? tc.primary : sc.dot;
                                return (
                                    <div key={en.uuid} className="enquiry-row"
                                        style={{
                                            borderBottom: i < enquiries.length - 1 ? '1px solid #eef1f6' : 'none',
                                            borderLeft: `3px solid ${isOpen ? accentColor : 'transparent'}`,
                                            transition: 'background 0.15s, border-left-color 0.2s ease',
                                            animationDelay: `${Math.min(i * 0.03, 0.25)}s`,
                                        }}>
                                        <div onClick={() => setExpanded(isOpen ? null : en.uuid)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.05rem 1.5rem', cursor: 'pointer', flexWrap: 'wrap' }}>

                                            {/* Avatar — initials on a theme-color gradient */}
                                            <div className="enquiry-avatar" style={{
                                                flexShrink: 0, width: '38px', height: '38px', borderRadius: '8px',
                                                background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#ffffff', fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em',
                                                boxShadow: `0 2px 8px ${hexToRgba(tc.primary, 0.25)}`,
                                            }}>
                                                {getInitials(en.name)}
                                            </div>

                                            <div style={{ flex: 1, minWidth: '180px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                    <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.1px' }}>{en.name}</span>
                                                    {en.status === 'new' && (
                                                        <span style={{ fontSize: '9px', fontWeight: 800, color: tc.primary, background: hexToRgba(tc.primary, 0.1), padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>New</span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{en.phone}{en.email ? ` · ${en.email}` : ''}</div>
                                            </div>

                                            {extraFields.filter(f => !f.detailOnly).map(f => {
                                                const val = en.extra_data?.[f.key];
                                                if (!val) return null;
                                                if (f.isLink) {
                                                    return (
                                                        <a key={f.key} href={val} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                                            className="enquiry-link-pill"
                                                            style={{ fontSize: '11.5px', fontWeight: 600, color: '#ffffff', background: tc.primary, padding: '5px 12px', borderRadius: '6px', flexShrink: 0, textDecoration: 'none' }}>
                                                            📎 {f.label}
                                                        </a>
                                                    );
                                                }
                                                return (
                                                    <span key={f.key} style={{ fontSize: '11.5px', fontWeight: 600, color: tc.primary, background: tc.light, padding: '5px 12px', borderRadius: '6px', flexShrink: 0 }}>
                                                        {val}
                                                    </span>
                                                );
                                            })}

                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#94a3b8', flexShrink: 0 }}>
                                                <ClockIcon /> {formatDateTime(en.created_at)}
                                            </span>

                                            <select className="enquiry-status-select" value={en.status} onClick={e => e.stopPropagation()}
                                                onChange={e => handleStatusChange(en.uuid, e.target.value)}
                                                style={{ fontSize: '11.5px', fontWeight: 700, color: sc.text, background: sc.bg, border: `1.5px solid ${sc.border}`, borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', textTransform: 'capitalize', flexShrink: 0 }}>
                                                <option value="new">New</option>
                                                <option value="contacted">Contacted</option>
                                                <option value="closed">Closed</option>
                                            </select>

                                            <button className="enquiry-remove" onClick={e => { e.stopPropagation(); handleDelete(en.uuid); }}
                                                style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', flexShrink: 0 }}>
                                                <TrashIcon />
                                            </button>

                                            <span className="enquiry-chevron" style={{ flexShrink: 0, color: '#cbd5e1', display: 'flex', transform: isOpen ? 'rotate(90deg)' : 'none' }}>
                                                <ChevronIcon color="currentColor" />
                                            </span>
                                        </div>
                                        {isOpen && (en.message || extraFields.some(f => en.extra_data?.[f.key])) && (
                                            <div className="enquiry-row-detail" style={{ padding: '0 1.5rem 1.25rem 4.25rem' }}>
                                                {extraFields.filter(f => !f.isLink).map(f => en.extra_data?.[f.key] ? (
                                                    <p key={f.key} style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '4px' }}>
                                                        <strong style={{ color: '#334155' }}>{f.label}:</strong> {en.extra_data[f.key]}
                                                    </p>
                                                ) : null)}
                                                {en.message && (
                                                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, background: '#f8fafc', border: '1px solid #eef1f6', borderRadius: '8px', padding: '12px 14px', marginTop: '8px' }}>
                                                        {en.message}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default EnquiryList;
