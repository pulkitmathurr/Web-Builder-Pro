import { useNavigate } from "react-router-dom";

// Shared "page not published yet" screen for every public module page — replaces each
// page's own ad-hoc fallback so the empty state looks consistent and on-brand (uses the
// school's theme colors) instead of a plain gray message + link.
// `reason="disabled"` renders the same screen with different copy for the case where the
// school admin has switched this module off entirely (via "Manage Modules"), as opposed to
// the module being on but just not published yet.
const NotPublished = ({ tc, slug, label = "This page", reason = "unpublished" }) => {
    const navigate = useNavigate();
    const isDisabled = reason === "disabled";

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '22px', padding: '2rem', textAlign: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />

            <div style={{
                width: '76px', height: '76px', borderRadius: '22px',
                background: tc.light, border: `1px solid ${tc.primary}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <svg width="32" height="32" fill="none" stroke={tc.primary} strokeWidth="1.6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h4m3 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>

            <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: 700, color: '#1e293b', marginBottom: '10px', letterSpacing: '-0.3px' }}>
                    {isDisabled ? `${label} Isn't Available` : `${label} Isn't Published Yet`}
                </h1>
                <p style={{ fontSize: '14.5px', color: '#64748b', lineHeight: 1.7, maxWidth: '380px', margin: '0 auto' }}>
                    {isDisabled
                        ? "This section isn't enabled on this school's website."
                        : "The school hasn't published this page yet. Please check back soon."}
                </p>
            </div>

            <button onClick={() => navigate(`/school/${slug}`)}
                style={{
                    marginTop: '4px', padding: '13px 30px',
                    background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`,
                    color: '#fff', border: 'none', borderRadius: '10px',
                    fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: `0 10px 26px ${tc.primary}35`,
                }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Home
            </button>
        </div>
    );
};

export default NotPublished;
