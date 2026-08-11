import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginApi } from "../../api/auth.api";
import useAuthStore from "../../store/authStore";
import schoolIllustration from "../../assets/school-illustration.svg";
import logo from '../../assets/webbuilder-removebg-preview.png';

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginApi(formData.email, formData.password, "admin");
      setAuth(res.data.user, "admin", res.data.accessToken);
      toast.success("Login successful!");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Poppins:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
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

        .login-input:focus {
          border-color: #a67c3d !important;
          box-shadow: 0 0 0 3px rgba(139,94,44,0.1);
        }
        .login-field-icon { transition: color 0.25s ease; }
        .login-field:focus-within .login-field-icon { color: #a67c3d !important; }

        .login-submit-btn { position: relative; overflow: hidden; }
        .login-submit-btn::after {
          content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.5), transparent);
          transform: skewX(-20deg); transition: left 0.65s ease; pointer-events: none;
        }
        .login-submit-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(139,94,44,0.25), 0 12px 28px rgba(139,94,44,0.42) !important;
        }
        .login-submit-btn:not(:disabled):hover::after { left: 130%; }
        .login-submit-btn:not(:disabled):active { transform: scale(0.97); }

        @keyframes loginBlobDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(14px,-12px) scale(1.07); } }
        @keyframes loginFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loginShimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        @keyframes loginFloatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes loginGlowPulse { 0%,100% { opacity: 0.4; transform: translate(-50%,-50%) scale(1); } 50% { opacity: 0.65; transform: translate(-50%,-50%) scale(1.08); } }
        @keyframes loginBadgePulse { 0%,100% { box-shadow: 0 0 0 0 rgba(139,94,44,0.32); } 50% { box-shadow: 0 0 0 9px rgba(139,94,44,0); } }

        .login-anim-1 { animation: loginFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .login-anim-2 { animation: loginFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s both; }
        .login-anim-3 { animation: loginFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.28s both; }
        .login-anim-4 { animation: loginFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.4s both; }
        .login-anim-5 { animation: loginFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both; }
        .login-anim-6 { animation: loginFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.6s both; }

        .login-float { animation: loginFloatY 5s ease-in-out infinite; }
        .login-glow-pulse { animation: loginGlowPulse 4s ease-in-out infinite; }
        .login-badge-pulse { animation: loginBadgePulse 2.6s ease-in-out infinite; }

        .login-shimmer-text {
          background: linear-gradient(90deg, #5c3d16, #c9973f, #5c3d16);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          animation: loginShimmer 6s linear infinite;
        }

        /* ── Mobile-only decorative layer + floating glass card ── */
        .login-mobile-blob { display: none; }
        .login-divider { display: block; }

        @media (max-width: 860px) {
          .login-shell { grid-template-columns: 1fr !important; height: auto !important; min-height: 100vh !important; overflow: visible !important; }
          .login-left-panel { display: none !important; }
          .login-divider { display: none !important; }
          .login-right-panel {
            padding: 3rem 1.1rem 2.5rem !important;
            overflow-y: visible !important;
            overflow-x: hidden !important;
            position: relative;
            background: linear-gradient(160deg, #fdf8ec 0%, #f7ecd2 45%, #efdcb0 100%) !important;
            min-height: 100vh !important;
          }

          .login-mobile-blob { display: block; position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; }
          .login-blob-1 { width: 220px; height: 220px; background: #e8cf9a; opacity: 0.4; top: -70px; right: -60px; animation: loginBlobDrift 8s ease-in-out infinite; }
          .login-blob-2 { width: 170px; height: 170px; background: #8b5e2c; opacity: 0.16; bottom: 40px; left: -60px; animation: loginBlobDrift 10s ease-in-out infinite reverse; }
          .login-blob-3 { width: 90px; height: 90px; background: #c9a35a; opacity: 0.28; top: 44%; left: -35px; animation: loginBlobDrift 7s ease-in-out infinite; }

          .login-mobile-card {
            position: relative; z-index: 1;
            width: 100%; max-width: 420px; margin: 0 auto;
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border-radius: 24px;
            border: 1px solid rgba(255,255,255,0.7);
            box-shadow: 0 24px 60px rgba(139,94,44,0.22), 0 2px 14px rgba(0,0,0,0.05);
            padding: 2.25rem 1.5rem 1.75rem;
          }

          .login-right-logo { width: clamp(220px, 32vh, 320px) !important; height: auto !important; margin: 0 auto 0.75rem !important; display: block !important; }
          .login-badge { margin: 0 auto 14px !important; }
          .login-mobile-heading { text-align: center !important; }
          .login-mobile-sub { text-align: center !important; }
          .login-mobile-footer { text-align: center !important; }
        }
        @media (max-width: 400px) {
          .login-right-panel { padding-inline: 0.85rem !important; }
          .login-mobile-card { padding: 1.85rem 1.1rem 1.5rem !important; }
        }
      `}</style>

      <div className="login-shell" style={{
        display: "grid",
        gridTemplateColumns: "60fr 40fr",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Poppins', system-ui, sans-serif",
      }}>

        {/* ── Left Panel 60% — hidden on mobile, right panel already carries its own logo ── */}
        <div className="login-left-panel" style={{
          backgroundImage: "radial-gradient(rgba(139,94,44,0.055) 1px, transparent 1px), linear-gradient(145deg, #faf3e0 0%, #f5e8c8 50%, #efdcb0 100%)",
          backgroundSize: "22px 22px, auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingBlock: "clamp(1rem, 4vh, 3rem)",
          paddingInline: "3rem",
          position: "relative",
          overflow: "hidden",
          minHeight: 0,
        }}>
          {/* Blobs — drifting continuously for a premium sense of motion */}
          <div style={{ position: "absolute", width: "320px", height: "320px", borderRadius: "50%", background: "#e8cf9a", opacity: 0.25, top: "-100px", left: "-80px", animation: "loginBlobDrift 11s ease-in-out infinite" }}></div>
          <div style={{ position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "#c9a35a", opacity: 0.15, top: "40%", right: "-60px", animation: "loginBlobDrift 9s ease-in-out infinite reverse" }}></div>
          <div style={{ position: "absolute", width: "150px", height: "150px", borderRadius: "50%", background: "#e8cf9a", opacity: 0.2, bottom: "60px", left: "20px", animation: "loginBlobDrift 13s ease-in-out infinite" }}></div>
          <div style={{ position: "absolute", width: "80px", height: "80px", borderRadius: "50%", background: "#8b5e2c", opacity: 0.1, top: "30%", left: "40%", animation: "loginBlobDrift 8s ease-in-out infinite reverse" }}></div>

          {/* Brand — top left */}
          <div className="login-anim-1" style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative", zIndex: 1 }}>
            <img
              src={logo}
              alt="Logo"
              style={{ height: 'clamp(64px, 11vh, 130px)', objectFit: 'contain' }}
            />
          </div>

          {/* Illustration + Text */}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <div className="login-anim-2" style={{ position: "relative", width: "clamp(190px, 32vh, 440px)", height: "clamp(190px, 32vh, 440px)", margin: "0 auto clamp(0.75rem, 2vh, 2rem)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="login-glow-pulse" style={{ position: "absolute", top: "50%", left: "50%", width: "78%", height: "78%", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,151,63,0.35) 0%, transparent 72%)", filter: "blur(6px)", pointerEvents: "none" }}></div>
              <img src={schoolIllustration} alt="School Illustration" className="login-float" style={{ position: "relative", width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <h2 className="login-anim-3 login-shimmer-text" style={{ fontWeight: 700, fontSize: "clamp(22px, 3.4vh, 34px)", marginBottom: "clamp(8px, 1.4vh, 14px)", lineHeight: 1.3, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.01em" }}>
              Manage your school<br />from anywhere
            </h2>
            <p className="login-anim-4" style={{ color: "#8a6a42", fontSize: "clamp(15px, 2vh, 19px)", lineHeight: 1.6, maxWidth: "400px", margin: "0 auto", fontWeight: 400 }}>
              A complete platform to run your school<br />website and operations with ease.
            </p>
          </div>

          {/* Footer */}
          <p className="login-anim-6" style={{ textAlign: "center", color: "#c4b28a", fontSize: "13px", position: "relative", zIndex: 1 }}>
            © 2026 Web Builder Pro
          </p>
        </div>

        {/* ── Right Panel 40% ── */}
        <div className="login-right-panel" style={{
          background: "#ffffff",
          backgroundImage: "radial-gradient(rgba(139,94,44,0.035) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingBlock: "clamp(1rem, 4vh, 3rem)",
          paddingInline: "3.5rem",
          overflowY: "auto",
          minHeight: 0,
          position: "relative",
        }}>

          {/* Gradient divider between panels — desktop only */}
          <div className="login-divider" style={{ position: "absolute", left: 0, top: "10%", bottom: "10%", width: "1px", background: "linear-gradient(180deg, transparent, rgba(139,94,44,0.3), transparent)" }}></div>

          {/* ── Mobile-only decorative blobs, floating behind the card ── */}
          <div className="login-mobile-blob login-blob-1"></div>
          <div className="login-mobile-blob login-blob-2"></div>
          <div className="login-mobile-blob login-blob-3"></div>

          <div className="login-mobile-card">

          {/* Logo — right panel top */}
          <img
            src={logo}
            alt="Web Builder Pro Logo"
            className="login-right-logo login-anim-1"
            style={{
    width: 'clamp(170px, 24vh, 320px)',
    height: 'clamp(85px, 12vh, 160px)',
    objectFit: 'contain',
    marginBottom: 'clamp(0.25rem, 1vh, 0.5rem)',
    marginLeft: '-24px'
}}
          />

          {/* Icon badge — small premium touch above the heading */}
          {/* <div className="login-badge login-anim-2 login-badge-pulse" style={{ width: "44px", height: "44px", borderRadius: "13px", background: "linear-gradient(150deg, #c9973f, #8b5e2c)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "clamp(10px, 1.6vh, 16px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 16px rgba(139,94,44,0.35)" }}>
            <svg width="20" height="20" fill="none" stroke="#ffffff" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div> */}

          <h1 className="login-mobile-heading login-anim-2 login-shimmer-text" style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(24px, 3.6vh, 38px)",
            fontWeight: 700,
            marginBottom: "clamp(4px, 1vh, 8px)",
            lineHeight: 1.2,
          }}>
            Login to your Account
          </h1>
          <p className="login-mobile-sub login-anim-2" style={{ color: "#9c7b45", fontSize: "clamp(12px, 1.4vh, 14px)", marginBottom: "clamp(1rem, 3vh, 2.5rem)", lineHeight: 1.4 }}>
            Your school, your rules — step inside<br />and take control.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "clamp(0.75rem, 1.8vh, 1.25rem)" }}>

            {/* Email */}
            <div className="login-anim-3">
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#9c7b45", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "7px" }}>
                Email Address
              </label>
              <div className="login-field" style={{ position: "relative" }}>
                <svg className="login-field-icon" style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "#c4b28a" }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="Enter your email" required className="login-input"
                  style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "12px", border: "1.5px solid #eaddb8", background: "#ffffff", color: "#2d2013", fontSize: "14px", outline: "none", boxSizing: "border-box", transition: "all 0.2s" }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-anim-4">
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#9c7b45", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "7px" }}>
                Password
              </label>
              <div className="login-field" style={{ position: "relative" }}>
                <svg className="login-field-icon" style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "#c4b28a" }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"} name="password" value={formData.password}
                  onChange={handleChange} placeholder="Enter your password" required className="login-input"
                  style={{ width: "100%", padding: "12px 42px 12px 42px", borderRadius: "12px", border: "1.5px solid #eaddb8", background: "#ffffff", color: "#2d2013", fontSize: "14px", outline: "none", boxSizing: "border-box", transition: "all 0.2s" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#c4b28a", display: "flex", alignItems: "center" }}>
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="login-anim-5">
              <button type="submit" disabled={loading} className="login-submit-btn"
                style={{ width: "100%", padding: "clamp(10px, 1.6vh, 14px)", background: loading ? "#d6c39c" : "linear-gradient(150deg, #c9973f, #8b5e2c 65%, #6b4a1a)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 16px rgba(139,94,44,0.3)", transition: "all 0.2s" }}>
                {loading ? (
                  <>
                    <svg style={{ animation: "spin 1s linear infinite", width: "18px", height: "18px" }} viewBox="0 0 24 24" fill="none">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M20 12H4"/>
                    </svg>
                    Login
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="login-mobile-footer login-anim-6" style={{ textAlign: "center", color: "#cbb98f", fontSize: "12px", marginTop: "clamp(0.75rem, 3vh, 2rem)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure login · Web Builder Pro
          </p>

          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
