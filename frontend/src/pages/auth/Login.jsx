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
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap"
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
        .login-input:focus {
          border-color: #8b2252 !important;
          box-shadow: 0 0 0 3px rgba(139,34,82,0.08);
        }
      `}</style>

      <div style={{
        display: "grid",
        gridTemplateColumns: "60fr 40fr",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "system-ui, sans-serif",
      }}>

        {/* ── Left Panel 60% ── */}
        <div style={{
          background: "linear-gradient(145deg, #f9e0e8 0%, #f5cdd8 50%, #f0bfcc 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingBlock: "clamp(1rem, 4vh, 3rem)",
          paddingInline: "3rem",
          position: "relative",
          overflow: "hidden",
          minHeight: 0,
        }}>
          {/* Blobs */}
          <div style={{ position: "absolute", width: "320px", height: "320px", borderRadius: "50%", background: "#e8a0a0", opacity: 0.25, top: "-100px", left: "-80px" }}></div>
          <div style={{ position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "#c9687e", opacity: 0.15, top: "40%", right: "-60px" }}></div>
          <div style={{ position: "absolute", width: "150px", height: "150px", borderRadius: "50%", background: "#e8a0a0", opacity: 0.2, bottom: "60px", left: "20px" }}></div>
          <div style={{ position: "absolute", width: "80px", height: "80px", borderRadius: "50%", background: "#8b2252", opacity: 0.1, top: "30%", left: "40%" }}></div>

          {/* Brand — top left */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative", zIndex: 1 }}>
            <img
              src={logo}
              alt="Logo"
              style={{ height: 'clamp(48px, 8vh, 94px)', objectFit: 'contain' }}
            />
          </div>

          {/* Illustration + Text */}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <div style={{ width: "clamp(160px, 26vh, 380px)", height: "clamp(160px, 26vh, 380px)", margin: "0 auto clamp(0.75rem, 2vh, 2rem)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={schoolIllustration} alt="School Illustration" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <h2 style={{ color: "#5a1a35", fontWeight: 700, fontSize: "clamp(18px, 2.6vh, 28px)", marginBottom: "clamp(6px, 1.2vh, 12px)", lineHeight: 1.35, fontFamily: "'Playfair Display', serif" }}>
              Manage your school<br />from anywhere
            </h2>
            <p style={{ color: "#9e4060", fontSize: "clamp(13px, 1.6vh, 16px)", lineHeight: 1.5, maxWidth: "340px", margin: "0 auto" }}>
              A complete platform to run your school<br />website and operations with ease.
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "clamp(10px, 2vh, 24px)" }}>
              <div style={{ width: "28px", height: "7px", borderRadius: "4px", background: "#8b2252" }}></div>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "rgba(139,34,82,0.3)" }}></div>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "rgba(139,34,82,0.3)" }}></div>
            </div>
          </div>

          {/* Footer */}
          <p style={{ textAlign: "center", color: "#c9a0b0", fontSize: "13px", position: "relative", zIndex: 1 }}>
            © 2026 Web Builder Pro
          </p>
        </div>

        {/* ── Right Panel 40% ── */}
        <div style={{
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingBlock: "clamp(1rem, 4vh, 3rem)",
          paddingInline: "3.5rem",
          overflowY: "auto",
          minHeight: 0,
        }}>

          {/* Logo — right panel top */}
          <img
            src={logo}
            alt="Web Builder Pro Logo"
            style={{
    width: 'clamp(140px, 20vh, 280px)',
    height: 'clamp(70px, 10vh, 140px)',
    objectFit: 'contain',
    marginBottom: 'clamp(0.25rem, 1vh, 0.5rem)',
    marginLeft: '-24px'
}}
          />

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(24px, 3.6vh, 38px)",
            fontWeight: 700,
            color: "#2d0a1a",
            marginBottom: "clamp(4px, 1vh, 8px)",
            lineHeight: 1.2,
          }}>
            Login to your Account
          </h1>
          <p style={{ color: "#b06080", fontSize: "clamp(12px, 1.4vh, 14px)", marginBottom: "clamp(1rem, 3vh, 2.5rem)", lineHeight: 1.4 }}>
            Your school, your rules — step inside<br />and take control.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "clamp(0.75rem, 1.8vh, 1.25rem)" }}>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#b06080", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "7px" }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "#c9a0b0" }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="Email" required className="login-input"
                  style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "12px", border: "1.5px solid #f0c4c4", background: "#ffffff", color: "#2d0a1a", fontSize: "14px", outline: "none", boxSizing: "border-box", transition: "all 0.2s" }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#b06080", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "7px" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "#c9a0b0" }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"} name="password" value={formData.password}
                  onChange={handleChange} placeholder="Password" required className="login-input"
                  style={{ width: "100%", padding: "12px 42px 12px 42px", borderRadius: "12px", border: "1.5px solid #f0c4c4", background: "#ffffff", color: "#2d0a1a", fontSize: "14px", outline: "none", boxSizing: "border-box", transition: "all 0.2s" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#c9a0b0", display: "flex", alignItems: "center" }}>
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
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "clamp(10px, 1.6vh, 14px)", background: loading ? "#c9a0b0" : "#8b2252", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px", boxShadow: "0 4px 16px rgba(139,34,82,0.3)", transition: "all 0.2s" }}>
              {loading ? (
                <>
                  <svg style={{ animation: "spin 1s linear infinite", width: "18px", height: "18px" }} viewBox="0 0 24 24" fill="none">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in...
                </>
              ) : "Login"}
            </button>
          </form>

          <p style={{ textAlign: "center", color: "#d4a0b5", fontSize: "12px", marginTop: "clamp(0.75rem, 3vh, 2rem)" }}>
            Secure login · Web Builder Pro
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;