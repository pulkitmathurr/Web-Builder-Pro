import { useState } from 'react';
import toast from 'react-hot-toast';
import { changePasswordApi } from '../../api/auth.api';

const LockIcon = ({ size = 22, color = '#ffffff' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="11" width="16" height="10" rx="2.5" />
        <path d="M7.5 11V7.5a4.5 4.5 0 019 0V11" />
        <circle cx="12" cy="16" r="1.6" fill={color} stroke="none" />
    </svg>
);

const EyeIcon = ({ open }) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {open ? (
            <>
                <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" />
                <circle cx="12" cy="12" r="3.2" />
            </>
        ) : (
            <>
                <path d="M3 3l18 18" />
                <path d="M10.6 5.2A10.6 10.6 0 0112 5c7 0 10.5 7 10.5 7a17.7 17.7 0 01-3.3 4.3M6.6 6.6C3.6 8.5 1.5 12 1.5 12S5 19 12 19c1.4 0 2.7-.27 3.86-.72" />
                <path d="M9.5 9.7a3.2 3.2 0 004.6 4.5" />
            </>
        )}
    </svg>
);

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#5b6b95', marginBottom: '7px', letterSpacing: '0.03em', textTransform: 'uppercase' };

// ── One password field — lock-adjacent label, floating input with a show/hide eye toggle.
// Shared by all three fields below so the icon-padding/eye-button math lives in one place. ──
const PasswordField = ({ label, value, onChange, placeholder, autoFocus, minLength }) => {
    const [visible, setVisible] = useState(false);
    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{label}</label>
            <div className="cpm-field" style={{ position: 'relative' }}>
                <input
                    className="cpm-input"
                    type={visible ? 'text' : 'password'}
                    required
                    autoFocus={autoFocus}
                    minLength={minLength}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    style={{
                        width: '100%', padding: '12px 44px 12px 15px', border: '1.5px solid #e5e9f5', borderRadius: '12px',
                        fontSize: '13.5px', color: '#0f172a', outline: 'none', boxSizing: 'border-box',
                        background: 'linear-gradient(180deg,#f8faff,#f2f4fc)',
                        boxShadow: 'inset 0 1px 3px rgba(15,23,42,0.06)',
                        transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
                    }}
                />
                <button type="button" className="cpm-eye" onClick={() => setVisible(v => !v)}
                    tabIndex={-1}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    style={{
                        position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                        width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer',
                    }}>
                    <EyeIcon open={visible} />
                </button>
            </div>
        </div>
    );
};

// ── Self-service "change my own password" modal — works for any logged-in role since the
// backend resolves admin vs super_admin from the JWT. Currently wired into the Super Admin
// navbar; drop it into the School Admin navbar the same way if that's ever needed too. ──
const ChangePasswordModal = ({ onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [closing, setClosing] = useState(false);

    const requestClose = () => {
        setClosing(true);
        setTimeout(onClose, 160);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New passwords don't match");
            return;
        }
        setSubmitting(true);
        try {
            await changePasswordApi(currentPassword, newPassword);
            toast.success('Password changed successfully');
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to change password');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div onClick={requestClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
                background: 'rgba(9,12,26,0.62)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
                animation: `cpmFadeIn 0.22s ease ${closing ? 'reverse both' : ''}`,
            }}>
            <style>{`
                @keyframes cpmFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes cpmPopIn { from { opacity: 0; transform: translateY(22px) scale(0.92); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes cpmBadgeGlow { 0%, 100% { box-shadow: 0 10px 26px rgba(79,110,247,0.45), 0 0 0 0 rgba(109,139,255,0.4); } 50% { box-shadow: 0 10px 30px rgba(79,110,247,0.55), 0 0 0 8px rgba(109,139,255,0); } }
                @keyframes cpmOrbDrift { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-10px,10px); } }
                .cpm-field:focus-within .cpm-input { border-color: #6d8bff !important; background: #ffffff !important; box-shadow: 0 0 0 4px rgba(79,110,247,0.14), inset 0 1px 2px rgba(15,23,42,0.03) !important; }
                .cpm-field:focus-within .cpm-eye { color: #4f6ef7 !important; }
                .cpm-eye:hover { background: #eef2ff !important; color: #4f6ef7 !important; }
                .cpm-submit { position: relative; overflow: hidden; }
                .cpm-submit::after { content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent); transform: skewX(-20deg); transition: left 0.6s ease; }
                .cpm-submit:hover:not(:disabled)::after { left: 130%; }
                .cpm-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(30,45,140,0.3), 0 16px 30px rgba(79,110,247,0.5) !important; }
                .cpm-submit:active:not(:disabled) { transform: translateY(0) scale(0.97); }
                .cpm-cancel:hover { background: #f1f4fb !important; color: #334155 !important; }
                .cpm-close:hover { background: rgba(79,110,247,0.12) !important; color: #4f6ef7 !important; transform: rotate(90deg); }
            `}</style>

            <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit}
                style={{
                    position: 'relative', width: '100%', maxWidth: '400px', background: '#ffffff', borderRadius: '24px',
                    padding: '2.75rem 2rem 2rem', overflow: 'hidden',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 30px 70px -18px rgba(30,45,140,0.35), 0 14px 34px -14px rgba(15,23,42,0.3), 0 0 0 1px rgba(255,255,255,0.6)',
                    animation: `cpmPopIn 0.32s cubic-bezier(0.34,1.56,0.64,1) ${closing ? 'reverse both' : ''}`,
                }}>

                {/* Decorative background glow — same visual language as the app's admin-sidebar orbs */}
                <div style={{ position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', top: '-120px', right: '-80px', background: 'radial-gradient(circle, rgba(109,139,255,0.16) 0%, transparent 70%)', pointerEvents: 'none', animation: 'cpmOrbDrift 7s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', width: '180px', height: '180px', borderRadius: '50%', bottom: '-100px', left: '-70px', background: 'radial-gradient(circle, rgba(79,110,247,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

                {/* Close (×) */}
                <button type="button" className="cpm-close" onClick={requestClose} aria-label="Close"
                    style={{ position: 'absolute', top: '16px', right: '16px', width: '30px', height: '30px', borderRadius: '9px', border: 'none', background: 'rgba(15,23,42,0.05)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease', zIndex: 1 }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" /></svg>
                </button>

                {/* Floating gradient lock badge — half-overlapping the card's top edge for depth */}
                <div style={{
                    position: 'relative', zIndex: 1, width: '58px', height: '58px', borderRadius: '18px', margin: '0 auto 18px',
                    background: 'linear-gradient(155deg,#8098ff,#4f6ef7 65%,#3450d6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.4)',
                    animation: 'cpmBadgeGlow 2.8s ease-in-out infinite',
                }}>
                    <LockIcon />
                </div>

                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', marginBottom: '5px' }}>Change Password</h3>
                    <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5 }}>Your other logged-in sessions will be signed out.</p>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <PasswordField label="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password" autoFocus />
                    <PasswordField label="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min. 6 characters)" minLength={6} />
                    <PasswordField label="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password" minLength={6} />
                </div>

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button type="button" className="cpm-cancel" onClick={requestClose}
                        style={{ flex: 1, padding: '12px', background: '#f8fafc', border: '1.5px solid #eef1f6', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: '#64748b', cursor: 'pointer', transition: 'background 0.15s ease, color 0.15s ease' }}>
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="cpm-submit"
                        style={{
                            flex: 1.4, padding: '12px', background: 'linear-gradient(160deg,#8098ff,#4f6ef7 60%,#3450d6)', border: 'none', borderRadius: '12px',
                            fontSize: '13px', fontWeight: 800, color: '#ffffff', cursor: submitting ? 'wait' : 'pointer',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 3px 6px rgba(30,45,140,0.25), 0 10px 22px rgba(79,110,247,0.4)',
                            transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease',
                        }}>
                        {submitting ? 'Changing…' : 'Change Password'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChangePasswordModal;
