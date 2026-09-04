import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getActivePlansApi } from '../../api/plans.api';
import { createBillingOrderApi, verifyBillingPaymentApi } from '../../api/billing.api';
import useAuthStore from '../../store/authStore';
import useSchoolStore from '../../store/schoolStore';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const tenureLabel = (y) => `${y} Year${y > 1 ? 's' : ''}`;
const storageLabel = (mb) =>
    mb >= 1024 && mb % 1024 === 0 ? `${mb / 1024} GB` : `${mb} MB`;

const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

const Billing = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { school, tc } = useSchoolStore();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [paying, setPaying] = useState(false);

    const primary = tc?.primary || '#4169E1';
    const secondary = tc?.secondary || '#2541A8';

    useEffect(() => {
        getActivePlansApi()
            .then((res) => setPlans(res.data || []))
            .catch(() => toast.error('Failed to load plans'))
            .finally(() => setLoading(false));
    }, []);

    const selectedPlan = plans.find((p) => p.id === selectedId);

    const handlePay = async () => {
        if (!selectedPlan) return;
        setPaying(true);
        try {
            const scriptOk = await loadRazorpayScript();
            if (!scriptOk) {
                toast.error('Failed to load payment gateway — check your connection');
                setPaying(false);
                return;
            }

            const orderRes = await createBillingOrderApi(selectedPlan.id);
            const order = orderRes.data;

            const rzp = new window.Razorpay({
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                order_id: order.orderId,
                name: 'Web Builder Pro',
                description: `${selectedPlan.name} · ${tenureLabel(selectedPlan.tenure_years)} · ${storageLabel(selectedPlan.storage_mb)}`,
                prefill: { name: user?.name, email: user?.email },
                theme: { color: primary },
                handler: async (response) => {
                    try {
                        await verifyBillingPaymentApi(response);
                        toast.success('Payment successful — your plan is now active!');
                        navigate('/admin/dashboard');
                        window.location.reload();
                    } catch (e) {
                        toast.error(e.response?.data?.message || 'Payment verification failed');
                    } finally {
                        setPaying(false);
                    }
                },
                modal: { ondismiss: () => setPaying(false) },
            });
            rzp.on('payment.failed', () => {
                toast.error('Payment failed — please try again');
                setPaying(false);
            });
            rzp.open();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to start payment');
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: `3px solid ${primary}`, borderRadius: '50%', animation: 'billingSpin 1s linear infinite' }}></div>
                <style>{`@keyframes billingSpin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '960px', margin: '0 auto' }}>
            {/* Hero header — standard admin page anatomy */}
            <div style={{
                background: 'linear-gradient(135deg, #2d0a1a, #4a1030, #2d0520)',
                borderRadius: '20px', padding: '2rem 2rem 1.75rem', marginBottom: '1.75rem', color: '#fff',
            }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.4px' }}>Choose your plan</h1>
                <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                    {school?.name ? `${school.name}'s ` : 'Your '}account is approved — pick a plan to activate your website.
                </p>
            </div>

            {plans.length === 0 ? (
                <div style={{ background: '#fff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '13.5px' }}>
                    No plans are available right now — please contact Web Builder Pro.
                </div>
            ) : (
                <>
                    {/* Plan cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '1.75rem' }}>
                        {plans.map((plan) => {
                            const active = plan.id === selectedId;
                            return (
                                <button key={plan.id} onClick={() => setSelectedId(plan.id)}
                                    style={{
                                        textAlign: 'left', padding: '22px', borderRadius: '16px', cursor: 'pointer',
                                        border: active ? `2px solid ${primary}` : '1px solid #eef1f6',
                                        background: active ? hexToRgba(primary, 0.05) : '#fff',
                                        boxShadow: active ? `0 8px 24px ${hexToRgba(primary, 0.18)}` : '0 2px 10px rgba(15,23,42,0.03)',
                                        display: 'flex', flexDirection: 'column', transition: 'all 0.15s',
                                    }}>
                                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>{plan.name}</p>
                                    <p style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '12px' }}>
                                        {tenureLabel(plan.tenure_years)} · {storageLabel(plan.storage_mb)} storage
                                    </p>
                                    <p style={{ fontSize: '24px', fontWeight: 800, color: primary, marginBottom: '12px' }}>
                                        ₹{Number(plan.price).toLocaleString('en-IN')}
                                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}> / {plan.tenure_years}yr</span>
                                    </p>
                                    {plan.description && (
                                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', lineHeight: 1.5 }}>{plan.description}</p>
                                    )}
                                    {plan.features?.length > 0 && (
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {plan.features.map((f, i) => (
                                                <li key={i} style={{ fontSize: '12px', color: '#475569', display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
                                                    <svg width="13" height="13" fill="none" stroke="#22c55e" strokeWidth="3" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '2px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Summary + Pay */}
                    {selectedPlan && (
                        <div style={{ background: '#fff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(15,23,42,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>You're purchasing</p>
                                <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                                    {selectedPlan.name} — {tenureLabel(selectedPlan.tenure_years)} · {storageLabel(selectedPlan.storage_mb)}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '22px', fontWeight: 800, color: primary, marginBottom: '8px' }}>₹{Number(selectedPlan.price).toLocaleString('en-IN')}</p>
                                <button onClick={handlePay} disabled={paying}
                                    style={{ padding: '12px 26px', background: paying ? '#94a3b8' : `linear-gradient(135deg, ${primary}, ${secondary})`, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer' }}>
                                    {paying ? 'Processing...' : 'Pay with Razorpay'}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Billing;
