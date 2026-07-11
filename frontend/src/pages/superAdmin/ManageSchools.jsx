import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSchoolsApi, updateSchoolStatusApi, deleteSchoolApi } from '../../api/superAdmin.api';
import toast from 'react-hot-toast';

const ManageSchools = () => {
    const navigate = useNavigate();
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [confirmName, setConfirmName] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { fetchSchools(); }, []);

    const fetchSchools = async () => {
        try {
            const res = await getAllSchoolsApi();
            setSchools(res.data || []);
        } catch (e) {
            toast.error('Failed to load schools');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (uuid, newStatus) => {
        try {
            await updateSchoolStatusApi(uuid, newStatus);
            toast.success(`School ${newStatus} successfully`);
            fetchSchools();
        } catch (e) {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteConfirmed = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteSchoolApi(deleteTarget.uuid);
            toast.success('School deleted permanently');
            setDeleteTarget(null);
            setConfirmName('');
            fetchSchools();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to delete school');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = schools.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || s.status === filter;
        return matchSearch && matchFilter;
    });

    const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

    const statusConfig = {
        active: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', dot: '#22c55e' },
        pending: { bg: '#fffbeb', text: '#b45309', border: '#fde68a', dot: '#f59e0b' },
        suspended: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', dot: '#ef4444' },
    };

    const filterOptions = [
        { value: 'all', label: 'All Schools', count: schools.length },
        { value: 'active', label: 'Active', count: schools.filter(s => s.status === 'active').length },
        { value: 'pending', label: 'Pending', count: schools.filter(s => s.status === 'pending').length },
        { value: 'suspended', label: 'Suspended', count: schools.filter(s => s.status === 'suspended').length },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '44px', height: '44px', border: '3px solid rgba(10,10,10,0.1)', borderTop: '3px solid #0a0a0a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }}></div>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading schools...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .ms-section { animation: fadeInUp 0.35s ease forwards; opacity: 0; }
                .ms-section:nth-child(1) { animation-delay: 0.05s; }
                .ms-section:nth-child(2) { animation-delay: 0.1s; }
                .ms-section:nth-child(3) { animation-delay: 0.15s; }
                .school-row { transition: background 0.15s; }
                .school-row:hover { background: #fafafa !important; }
                .action-btn { transition: all 0.15s; }
                .action-btn:hover { transform: translateY(-1px); }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* ── Hero Header ── */}
                <div className="ms-section" style={{
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 40%, #000000 100%)',
                    borderRadius: '16px', padding: '2.5rem', marginBottom: '1.75rem',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ position: 'absolute', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', top: '-120px', right: '8%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>

                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }}></div>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Super Admin / Schools</p>
                            </div>
                            <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '10px', letterSpacing: '-0.5px' }}>
                                Manage Schools
                            </h1>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                                {schools.length} schools registered on the platform
                            </p>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {[
                                { label: 'Total', value: schools.length, color: '#ffffff' },
                                { label: 'Active', value: schools.filter(s => s.status === 'active').length, color: '#e5e5e5' },
                                { label: 'Pending', value: schools.filter(s => s.status === 'pending').length, color: '#d4d4d4' },
                            ].map((s, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '1rem 1.5rem', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
                                    <p style={{ fontSize: '28px', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '4px' }}>{s.value}</p>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
                                </div>
                            ))}
                            <button onClick={() => navigate('/super-admin/schools/create')}
                                style={{ background: 'linear-gradient(135deg,#ffffff,#d4d4d4)', color: '#0a0a0a', border: 'none', borderRadius: '10px', padding: '1rem 1.5rem', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', minWidth: '90px', boxShadow: '0 8px 24px rgba(255,255,255,0.15)' }}>
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                                <span style={{ fontSize: '11px', letterSpacing: '0.05em' }}>New School</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Filters ── */}
                <div className="ms-section" style={{ display: 'flex', gap: '10px', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
                        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <input type="text" placeholder="Search by name or email..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px 10px 38px', border: '0.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', color: '#0f172a', boxSizing: 'border-box', background: '#ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }} />
                    </div>

                    {/* Filter tabs */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {filterOptions.map(f => (
                            <button key={f.value} onClick={() => setFilter(f.value)}
                                style={{
                                    padding: '8px 16px', borderRadius: '10px', border: filter === f.value ? '1.5px solid rgba(10,10,10,0.6)' : '0.5px solid #e2e8f0',
                                    fontSize: '12px', cursor: 'pointer', fontWeight: filter === f.value ? 600 : 400,
                                    background: filter === f.value ? 'linear-gradient(135deg,#0a0a0a,#262626)' : '#ffffff',
                                    color: filter === f.value ? '#ffffff' : '#64748b',
                                    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
                                    boxShadow: filter === f.value ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                                }}>
                                {f.label}
                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: filter === f.value ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: filter === f.value ? '#ffffff' : '#94a3b8', fontWeight: 600 }}>
                                    {f.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="ms-section" style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

                    {/* Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2.3fr 1.4fr 1fr 0.8fr 1.5fr', padding: '12px 20px', background: 'linear-gradient(135deg,#0a0a0a,#262626)', borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
                        {['School', 'Admin', 'Location', 'Status', 'Actions'].map(h => (
                            <span key={h} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</span>
                        ))}
                    </div>

                    {/* Empty */}
                    {filtered.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.2 }}>🏫</div>
                            <p style={{ fontSize: '15px', fontWeight: 500, color: '#0f172a', marginBottom: '6px' }}>
                                {search ? 'No schools match your search' : 'No schools yet'}
                            </p>
                            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
                                {search ? 'Try a different search term' : 'Create your first school to get started'}
                            </p>
                            {!search && (
                                <button onClick={() => navigate('/super-admin/schools/create')}
                                    style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#0a0a0a,#333333)', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                    + Create School
                                </button>
                            )}
                        </div>
                    ) : (
                        filtered.map((school, i) => {
                            const sc = statusConfig[school.status] || statusConfig.pending;
                            return (
                                <div key={school.id} className="school-row"
                                    style={{ display: 'grid', gridTemplateColumns: '2.3fr 1.4fr 1fr 0.8fr 1.5fr', padding: '16px 20px', borderBottom: i < filtered.length - 1 ? '0.5px solid #f8fafc' : 'none', alignItems: 'center', background: '#ffffff' }}>

                                    {/* School */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {school.logo_url ? (
                                            <img src={school.logo_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', border: '0.5px solid #f1f5f9' }} />
                                        ) : (
                                            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,#0a0a0a,#333333)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{getInitials(school.name)}</span>
                                            </div>
                                        )}
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>{school.name}</p>
                                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>{school.email}</p>
                                        </div>
                                    </div>

                                    {/* Admin */}
                                    <div>
                                        <p style={{ fontSize: '12px', fontWeight: 500, color: '#0f172a', marginBottom: '2px' }}>{school.admin_name || '—'}</p>
                                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{school.admin_email || 'No admin yet'}</p>
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '1px' }}>{school.city || '—'}</p>
                                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{school.state || '—'}</p>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: sc.bg, color: sc.text, border: `0.5px solid ${sc.border}`, display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: sc.dot }}></div>
                                            {school.status}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {school.status !== 'active' && (
                                            <button className="action-btn"
                                                onClick={() => handleStatusChange(school.uuid, 'active')}
                                                style={{ padding: '5px 10px', background: '#f0fdf4', color: '#15803d', border: '0.5px solid #bbf7d0', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                                                Activate
                                            </button>
                                        )}
                                        {school.status !== 'suspended' && (
                                            <button className="action-btn"
                                                onClick={() => handleStatusChange(school.uuid, 'suspended')}
                                                style={{ padding: '5px 10px', background: '#fffbeb', color: '#b45309', border: '0.5px solid #fde68a', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                                                Suspend
                                            </button>
                                        )}
                                        <button className="action-btn"
                                            onClick={() => { setDeleteTarget(school); setConfirmName(''); }}
                                            style={{ padding: '5px 10px', background: 'linear-gradient(135deg,#0a0a0a,#262626)', color: '#ffffff', border: '0.5px solid #0a0a0a', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {filtered.length > 0 && (
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px', textAlign: 'right' }}>
                        Showing <strong style={{ color: '#0a0a0a' }}>{filtered.length}</strong> of {schools.length} schools
                    </p>
                )}
            </div>

            {/* ── Delete Confirmation Modal ── */}
            {deleteTarget && (
                <div onClick={() => !deleting && setDeleteTarget(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div onClick={e => e.stopPropagation()}
                        style={{ background: '#ffffff', maxWidth: '440px', width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.4)' }}>
                        <div style={{ padding: '1.75rem', borderBottom: '0.5px solid #f1f5f9' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Permanent action</p>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0a0a0a', marginBottom: '10px' }}>Delete "{deleteTarget.name}"?</h3>
                            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                                This permanently deletes the school, its admin account and all of its website content. This cannot be undone.
                            </p>
                        </div>
                        <div style={{ padding: '1.75rem' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Type <strong style={{ color: '#0a0a0a' }}>{deleteTarget.name}</strong> to confirm
                            </label>
                            <input type="text" value={confirmName} onChange={e => setConfirmName(e.target.value)}
                                placeholder={deleteTarget.name}
                                style={{ width: '100%', padding: '10px 14px', border: '0.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', color: '#0a0a0a', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ padding: '1.25rem 1.75rem', borderTop: '0.5px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                                style={{ padding: '10px 20px', background: '#ffffff', color: '#64748b', border: '0.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleDeleteConfirmed} disabled={deleting || confirmName !== deleteTarget.name}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px',
                                    background: confirmName === deleteTarget.name ? '#b91c1c' : '#fca5a5',
                                    color: '#ffffff', border: 'none', fontSize: '13px', fontWeight: 600,
                                    cursor: confirmName === deleteTarget.name && !deleting ? 'pointer' : 'not-allowed',
                                }}>
                                {deleting ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ManageSchools;
