import { useEffect, useState } from 'react';
import { getAllPlansApi, updatePlanApi } from '../../api/plans.api';
import toast from 'react-hot-toast';

const Plans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drafts, setDrafts] = useState({});
    const [savingId, setSavingId] = useState(null);

    useEffect(() => { fetchPlans(); }, []);

    const fetchPlans = async () => {
        try {
            const res = await getAllPlansApi();
            setPlans(res.data || []);
            const nextDrafts = {};
            (res.data || []).forEach(p => { nextDrafts[p.id] = p.price; });
            setDrafts(nextDrafts);
        } catch (e) {
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePrice = async (id) => {
        setSavingId(id);
        try {
            await updatePlanApi(id, { price: Number(drafts[id]) });
            toast.success('Price updated');
            fetchPlans();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to update price');
        } finally {
            setSavingId(null);
        }
    };

    const handleToggleActive = async (plan) => {
        try {
            await updatePlanApi(plan.id, { isActive: plan.is_active ? 0 : 1 });
            toast.success(plan.is_active ? 'Plan deactivated' : 'Plan activated');
            fetchPlans();
        } catch (e) {
            toast.error('Failed to update plan');
        }
    };

    const storageLabel = (mb) => (mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #e0e7ff', borderTop: '3px solid #4f6ef7', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const tenures = [1, 2, 3];

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>Plans & Pricing</h1>
                <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>
                    Set the ₹ price for each tenure × storage combo. All modules are included in every plan.
                </p>
            </div>

            {tenures.map(tenure => (
                <div key={tenure} style={{ marginBottom: '1.75rem' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>{tenure} Year Plan{tenure > 1 ? 's' : ''}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                        {plans.filter(p => p.tenure_years === tenure).map(plan => (
                            <div key={plan.id} style={{ background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 10px rgba(15,23,42,0.03)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{storageLabel(plan.storage_mb)}</span>
                                    <span style={{
                                        fontSize: '10px', padding: '3px 8px', borderRadius: '20px', fontWeight: 600,
                                        background: plan.is_active ? '#f0fdf4' : '#fef2f2', color: plan.is_active ? '#15803d' : '#b91c1c',
                                        border: `1px solid ${plan.is_active ? '#bbf7d0' : '#fecaca'}`,
                                    }}>
                                        {plan.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>₹</span>
                                    <input type="number" min="0" value={drafts[plan.id] ?? ''} onChange={(e) => setDrafts({ ...drafts, [plan.id]: e.target.value })}
                                        style={{ flex: 1, padding: '8px 10px', border: '1px solid #eef1f6', borderRadius: '8px', fontSize: '13px', outline: 'none', color: '#0f172a' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleSavePrice(plan.id)} disabled={savingId === plan.id}
                                        style={{ flex: 1, padding: '8px', background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                        {savingId === plan.id ? 'Saving...' : 'Save'}
                                    </button>
                                    <button onClick={() => handleToggleActive(plan)}
                                        style={{ flex: 1, padding: '8px', background: '#f8fafc', color: '#475569', border: '1px solid #eef1f6', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                        {plan.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Plans;
