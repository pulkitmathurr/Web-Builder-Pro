import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { submitSignupApi } from "../../api/signup.api";
import logo from '../../assets/webbuilder-removebg-preview.png';

const BLUE = '#4169E1';
const BLUE_DARK = '#2541A8';
const GREY = '#3B3B3B';
const TEXT_MUTED = '#5B6270';
const TEXT_DARK = '#20242C';

const Field = ({ label, children }) => (
    <div>
        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "7px" }}>
            {label}
        </label>
        {children}
    </div>
);

const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #e5e9f5", background: "#ffffff", color: TEXT_DARK, fontSize: "14px", outline: "none", boxSizing: "border-box" };

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ schoolName: "", adminName: "", email: "", phone: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await submitSignupApi(formData);
            setSubmitted(true);
        } catch (error) {
            toast.error(error.response?.data?.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap"
                rel="stylesheet"
            />
            <style>{`
                html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes signupOrbDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(14px,-12px) scale(1.07); } }
                .signup-input:focus { border-color: ${BLUE} !important; box-shadow: 0 0 0 3px rgba(65,105,225,0.12); }
                .signup-submit-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(65,105,225,0.25), 0 12px 28px rgba(65,105,225,0.42) !important; }
            `}</style>

            <div style={{
                minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
                background: `radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(160deg, ${BLUE_DARK} 0%, ${BLUE} 55%, ${BLUE_DARK} 100%)`,
                fontFamily: "'Inter', system-ui, sans-serif", padding: "2rem 1rem", position: "relative", overflow: "hidden",
            }}>
                <div style={{ position: "absolute", width: "320px", height: "320px", borderRadius: "50%", background: "rgba(255,255,255,0.14)", top: "-100px", left: "-80px", animation: "signupOrbDrift 11s ease-in-out infinite" }}></div>
                <div style={{ position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(20,26,46,0.3)", bottom: "-60px", right: "-60px", animation: "signupOrbDrift 9s ease-in-out infinite reverse" }}></div>

                <div style={{
                    position: "relative", zIndex: 1, width: "100%", maxWidth: "460px",
                    background: "#ffffff", borderRadius: "24px", boxShadow: "0 24px 60px rgba(37,65,168,0.28), 0 2px 14px rgba(0,0,0,0.05)",
                    padding: "2.5rem 2.25rem",
                }}>
                    <img src={logo} alt="Web Builder Pro" style={{ width: "220px", height: "auto", objectFit: "contain", marginBottom: "0.5rem", marginLeft: "-12px" }} />

                    {submitted ? (
                        <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                            <div style={{ width: "56px", height: "56px", margin: "0 auto 18px", borderRadius: "16px", background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="26" height="26" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 800, color: TEXT_DARK, marginBottom: "10px" }}>Request submitted!</h2>
                            <p style={{ color: TEXT_MUTED, fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
                                We've emailed you a confirmation. Our team will review your request and approve your account shortly — you'll get another email the moment that happens, with a link to log in and choose your plan.
                            </p>
                            <button onClick={() => navigate('/login')} style={{ padding: "12px 28px", background: `linear-gradient(150deg, ${BLUE}, ${BLUE_DARK})`, color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "30px", fontWeight: 800, color: TEXT_DARK, marginBottom: "6px", lineHeight: 1.15 }}>
                                Get Started
                            </h1>
                            <p style={{ color: TEXT_MUTED, fontSize: "13.5px", marginBottom: "1.75rem", lineHeight: 1.4 }}>
                                Tell us about your school — a Web Builder Pro admin will review and approve your account.
                            </p>

                            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <Field label="School Name">
                                    <input type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} placeholder="Enter your school name" required className="signup-input" style={inputStyle} />
                                </Field>
                                <Field label="Your Name">
                                    <input type="text" name="adminName" value={formData.adminName} onChange={handleChange} placeholder="Enter your full name" required className="signup-input" style={inputStyle} />
                                </Field>
                                <Field label="Email Address">
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required className="signup-input" style={inputStyle} />
                                </Field>
                                <Field label="Phone Number">
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter your phone number" className="signup-input" style={inputStyle} />
                                </Field>
                                <Field label="Password">
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a password" required minLength={6} className="signup-input" style={inputStyle} />
                                </Field>

                                <button type="submit" disabled={loading} className="signup-submit-btn"
                                    style={{ width: "100%", padding: "13px", background: loading ? "#a9b8ea" : `linear-gradient(150deg, ${BLUE}, ${BLUE_DARK} 65%, ${GREY})`, color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: "4px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 16px rgba(65,105,225,0.3)", transition: "all 0.2s" }}>
                                    {loading ? "Submitting..." : "Submit Request"}
                                </button>
                            </form>

                            <p style={{ textAlign: "center", color: "#9aa3b8", fontSize: "12.5px", marginTop: "1.5rem" }}>
                                Already have an account? <Link to="/login" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>Log in</Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default Signup;
