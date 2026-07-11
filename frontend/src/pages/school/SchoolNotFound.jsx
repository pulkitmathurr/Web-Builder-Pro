import { useNavigate } from 'react-router-dom';

const SchoolNotFound = () => {
    const navigate = useNavigate();
    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '80px', fontWeight: 700, color: 'rgba(255,255,255,0.08)', lineHeight: 1, marginBottom: '16px' }}>404</p>
                <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#ffffff', marginBottom: '10px' }}>School not found</h1>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>The school you're looking for doesn't exist or is not active.</p>
                <button
                    onClick={() => navigate('/')}
                    style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#8b2252,#c9687e)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                    Go Home
                </button>
            </div>
        </div>
    );
};

export default SchoolNotFound;