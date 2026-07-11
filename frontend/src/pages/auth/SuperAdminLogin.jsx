import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginApi } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';
import logo from '../../assets/webbuilder-removebg-preview.png';

const SuperAdminLogin = () => {
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();
    const vantaRef = useRef(null);
    const vantaEffect = useRef(null);

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const initVanta = () => {
            if (!vantaEffect.current && window.VANTA) {
                vantaEffect.current = window.VANTA.WAVES({
                    el: vantaRef.current,
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.00,
                    minWidth: 200.00,
                    scale: 1.00,
                    color: 0xf5e6b0,
                    shininess: 120.00,
                    waveHeight: 25.00,
                    waveSpeed: 0.6,
                    zoom: 0.9
                });
            }
        };

        if (window.VANTA) {
            initVanta();
        } else {
            const interval = setInterval(() => {
                if (window.VANTA) {
                    initVanta();
                    clearInterval(interval);
                }
            }, 100);
        }

        return () => {
            if (vantaEffect.current) {
                vantaEffect.current.destroy();
                vantaEffect.current = null;
            }
        };
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await loginApi(formData.email, formData.password, 'super_admin');
            setAuth(res.data.user, 'super_admin', res.data.accessToken);
            toast.success('Welcome back!');
            navigate('/super-admin/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
            <style>{`
                html, body, #root {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    height: 100% !important;
                    border: none !important;
                    text-align: left !important;
                    display: block !important;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .sa-input {
                    width: 100%;
                    padding: 18px 24px 18px 54px;
                    background: rgba(255,255,255,0.08);
                    border: 1.5px solid rgba(201,162,39,0.7);
                    border-radius: 12px;
                    color: #1a1200;
                    font-size: 15px;
                    outline: none;
                    font-family: 'Inter', sans-serif;
                    transition: all 0.3s;
                    box-sizing: border-box;
                    letter-spacing: 0.03em;
                }
                .sa-input::placeholder { color: rgba(139,100,20,0.6); }
                .sa-input:focus {
                    border-color: rgba(201,162,39,1);
                    background: rgba(255,255,255,0.15);
                    box-shadow: 0 0 0 3px rgba(201,162,39,0.15);
                }
                .sa-btn { transition: all 0.2s; }
                .sa-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 24px rgba(201,162,39,0.4) !important;
                }
            `}</style>

            <div ref={vantaRef} style={{
                width: '100vw', height: '100vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Inter', sans-serif", position: 'relative'
            }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,248,220,0.15)', zIndex: 0 }}></div>

                <div style={{
                    position: 'relative', zIndex: 1,
                    width: '100%', maxWidth: '620px',
                    padding: '0 2rem', textAlign: 'center'
                }}>
                    {/* Logo */}
                    <img src={logo} alt="Web Builder Pro Logo"
                        style={{ width: '300px', height: '150px', objectFit: 'contain', display: 'block', margin: '0 auto 1.5rem' }} />

                    {/* Title */}
                    <h1 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '32px', fontWeight: 500,
                        color: '#1a1200',
                        marginBottom: '8px', letterSpacing: '-0.3px'
                    }}>
                        Sign into your account
                    </h1>

                    {/* Subtitle */}
                    <p style={{
                        fontSize: '15px', color: '#c9a227',
                        textTransform: 'uppercase', letterSpacing: '0.3em',
                        fontWeight: 600, marginBottom: '3rem'
                    }}>
                        Welcome Back
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* Email */}
                        <div style={{ position: 'relative', textAlign: 'left' }}>
                            <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(201,162,39,0.8)' }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                            <input type="email" name="email" value={formData.email}
                                onChange={handleChange} placeholder="Email address"
                                required className="sa-input" />
                        </div>

                        {/* Password */}
                        <div style={{ position: 'relative', textAlign: 'left' }}>
                            <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(201,162,39,0.8)' }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                            <input type={showPassword ? 'text' : 'password'} name="password"
                                value={formData.password} onChange={handleChange}
                                placeholder="Password" required className="sa-input"
                                style={{ paddingRight: '50px' }} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(201,162,39,0.8)', display: 'flex', padding: 0 }}>
                                {showPassword ? (
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                                ) : (
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                )}
                            </button>
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', background: 'rgba(201,162,39,0.3)', margin: '0.5rem 0' }}></div>

                        {/* Submit */}
                        <button type="submit" disabled={loading} className="sa-btn"
                            style={{
                                width: '100%', padding: '15px',
                                background: loading ? 'rgba(201,162,39,0.3)' : 'linear-gradient(135deg, #c9a227, #e8c547)',
                                color: '#0a0800', border: 'none', borderRadius: '12px',
                                fontSize: '14px', fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                letterSpacing: '0.12em', textTransform: 'uppercase',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: '0 4px 20px rgba(201,162,39,0.3)'
                            }}>
                            {loading ? (
                                <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Signing in...</>
                            ) : 'Sign In'}
                        </button>

                    </form>

                    <p style={{ textAlign: 'center', fontSize: '11px', color: '#a08030', marginTop: '2rem', letterSpacing: '0.05em' }}>
                        Authorized personnel only · Web Builder Pro
                    </p>
                </div>
            </div>
        </>
    );
};

export default SuperAdminLogin;
