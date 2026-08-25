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

const TENURE_LABELS = { 1: '1 Year', 2: '2 Years', 3: '3 Years' };
const STORAGE_LABELS = { 200: '200 MB', 400: '400 MB', 1024: '1 GB' };

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
    const [tenure, setTenure] = useState(null);
    const [storage, setStorage] = useState(null);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        getActivePlansApi()
            .then((res) => setPlans(res.data || []))
            .catch(() => toast.error('Failed to load plans'))
            .finally(() => setLoading(false));
    }, []);

    const tenures = [...new Set(plans.map((p) => p.tenure_years))].sort();
    const storageTiers = [...new Set(plans.map((p) => p.storage_mb))].sort((a, b) => a - b);
    const selectedPlan = plans.find((p) => p.tenure_years === tenure && p.storage_mb === storage);

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
                description: `${TENURE_LABELS[selectedPlan.tenure_years]} · ${STORAGE_LABELS[selectedPlan.storage_mb]}`,
                prefill: { name: user?.name, email: user?.email },
                theme: { color: tc?.primary || '#4169E1' },
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
                <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: `3px solid ${tc?.primary || '#4169E1'}`, borderRadius: '50%', animation: 'billingSpin 1s linear infinite' }}></div>
                <style>{`@keyframes billingSpin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '860px', margin: '0 auto' }}>
            {/* Hero header — standard admin page anatomy */}
            <div style={{
                background: 'linear-gradient(135deg, #2d0a1a, #4a1030, #2d0520)',
                borderRadius: '20px', padding: '2rem 2rem 1.75rem', marginBottom: '1.75rem', color: '#fff',
            }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.4px' }}>Choose your plan</h1>
                <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                    {school?.name ? `${school.name}'s ` : "Your "}account is approved — pick a tenure and storage tier to activate your website. All modules are included in every plan.
                </p>
            </div>

            {/* Step 1: Tenure */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>1. Select Tenure</h2>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tenures.length}, 1fr)`, gap: '12px' }}>
                    {tenures.map((t) => (
                        <button key={t} onClick={() => setTenure(t)}
                            style={{
                                padding: '18px', borderRadius: '14px', cursor: 'pointer', textAlign: 'center',
                                border: tenure === t ? `2px solid ${tc?.primary || '#4169E1'}` : '1px solid #eef1f6',
                                background: tenure === t ? hexToRgba(tc?.primary || '#4169E1', 0.06) : '#ffffff',
                            }}>
                            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{TENURE_LABELS[t] || `${t} Years`}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 2: Storage */}
            <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>2. Select Storage</h2>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${storageTiers.length}, 1fr)`, gap: '12px' }}>
                    {storageTiers.map((mb) => {
                        const plan = plans.find((p) => p.tenure_years === tenure && p.storage_mb === mb);
                        return (
                            <button key={mb} disabled={!tenure} onClick={() => setStorage(mb)}
                                style={{
                                    padding: '18px', borderRadius: '14px', cursor: tenure ? 'pointer' : 'not-allowed', textAlign: 'center',
                                    border: storage === mb ? `2px solid ${tc?.primary || '#4169E1'}` : '1px solid #eef1f6',
                                    background: storage === mb ? hexToRgba(tc?.primary || '#4169E1', 0.06) : '#ffffff',
                                    opacity: tenure ? 1 : 0.5,
                                }}>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{STORAGE_LABELS[mb] || `${mb}MB`}</p>
                                {tenure && plan && <p style={{ fontSize: '12px', color: '#94a3b8' }}>₹{plan.price}</p>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Summary + Pay */}
            {selectedPlan && (
                <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(15,23,42,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>You're purchasing</p>
                        <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                            {TENURE_LABELS[selectedPlan.tenure_years]} · {STORAGE_LABELS[selectedPlan.storage_mb]}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '22px', fontWeight: 800, color: tc?.primary || '#4169E1', marginBottom: '8px' }}>₹{selectedPlan.price}</p>
                        <button onClick={handlePay} disabled={paying}
                            style={{ padding: '12px 26px', background: paying ? '#94a3b8' : `linear-gradient(135deg, ${tc?.primary || '#4169E1'}, ${tc?.secondary || '#2541A8'})`, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer' }}>
                            {paying ? 'Processing...' : 'Pay with Razorpay'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;
