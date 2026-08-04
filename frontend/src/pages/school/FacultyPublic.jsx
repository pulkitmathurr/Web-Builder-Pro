import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";

const LEVEL_LABELS = {
    pgt: 'PGT Faculty',
    tgt: 'TGT Faculty',
    prt: 'PRT Faculty',
    ntt: 'NTT Faculty',
    general: 'General Faculty',
};

const LEVEL_ORDER = ['pgt', 'tgt', 'prt', 'ntt', 'general'];

const TEACHES_AT_LABELS = {
    pgt: 'PGT',
    tgt: 'TGT',
    prt: 'PRT',
    ntt: 'NTT',
    general: 'General (All Levels)',
};

const useScrollReveal = () => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.12 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, visible];
};

const Reveal = ({ children, delay = 0, style = {} }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(36px)', transition: `opacity 0.75s ease ${delay}s, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>
            {children}
        </div>
    );
};

const CARDS_PER_PAGE = 5;
const AUTO_SLIDE_MS = 4000;

// ── Single level section — 5-card grid; auto-advancing slideshow (no arrows) once more than 5 ──
const LevelSection = ({ levelKey, members, tc, bc }) => {
    const [page, setPage] = useState(0);
    const totalPages = Math.ceil(members.length / CARDS_PER_PAGE);

    useEffect(() => {
        if (totalPages <= 1) return;
        const timer = setInterval(() => setPage(p => (p + 1) % totalPages), AUTO_SLIDE_MS);
        return () => clearInterval(timer);
    }, [totalPages]);

    const visibleThumbs = members.slice(page * CARDS_PER_PAGE, page * CARDS_PER_PAGE + CARDS_PER_PAGE);

    return (
        <div style={{ padding: '3.5rem clamp(1.25rem,6vw,5rem)', background: bc.surface, borderTop: '1px solid #f1f5f9' }}>
            <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                <Reveal>
                    <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1.75rem' }}>{LEVEL_LABELS[levelKey]}</p>
                </Reveal>

                <Reveal delay={0.1}>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(140px, 190px))`, justifyContent: 'center', gap: '14px' }}>
                        {visibleThumbs.map((m, idx) => (
                            <div key={`${page}-${m.id}`} className="faculty-card"
                                style={{
                                    borderRadius: '6px',
                                    border: '1px solid #dde2e8',
                                    background: bc.card,
                                    padding: '6px',
                                    display: 'flex', flexDirection: 'column',
                                    boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
                                    animationDelay: `${idx * 0.08}s`,
                                    '--tc-primary': tc.primary,
                                }}>
                                {/* Photo — framed with an inset accent border that sharpens on hover */}
                                <div className="faculty-card-img" style={{ position: 'relative', overflow: 'hidden', borderRadius: '3px', aspectRatio: '3/4', background: tc.light }}>
                                    {m.photo ? (
                                        <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontSize: '28px', opacity: 0.3 }}>👤</span>
                                        </div>
                                    )}
                                </div>
                                {/* Name plate */}
                                <div style={{ flex: '0 0 auto', padding: '8px 4px 3px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>{m.name}</p>
                                    {m.designation && (
                                        <p style={{ fontSize: '10px', fontWeight: 700, color: tc.primary, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.designation}</p>
                                    )}
                                    {m.experience && (
                                        <p style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.experience} experience</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </div>
        </div>
    );
};

// ── Complete staff directory — auto-built from every member across all levels ──
const thStyle = { padding: '15px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.22)' };
const tdStyle = { padding: '14px 20px', fontSize: '13.5px', color: '#334155', whiteSpace: 'nowrap', border: '1px solid #cbd5e1' };

const FacultyTable = ({ members, tc, bc }) => (
    <div style={{ padding: '2rem clamp(1.25rem,6vw,5rem) 6rem', background: bc.surface }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
            <Reveal>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>Complete Directory</p>
                    <h2 style={{ fontSize: 'clamp(26px,3vw,36px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>Staff & Faculty</h2>
                </div>
            </Reveal>
            <Reveal delay={0.1}>
                <div style={{ background: bc.card, borderRadius: '4px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(15,23,42,0.08)', border: '1.5px solid #94a3b8' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px', border: '1px solid #cbd5e1' }}>
                            <thead>
                                <tr style={{ background: `linear-gradient(135deg, ${tc.dark}, ${tc.primary})` }}>
                                    <th style={thStyle}>Name</th>
                                    <th style={thStyle}>Designation / Subject</th>
                                    <th style={thStyle}>Teaches At</th>
                                    <th style={thStyle}>Qualification</th>
                                    <th style={thStyle}>Experience</th>
                                    <th style={thStyle}>Udise National Code/ Oasis ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((m, i) => (
                                    <tr key={m.id} className="faculty-row"
                                        style={{
                                            background: i % 2 === 0 ? bc.card : bc.cardAlt,
                                            animationDelay: `${i * 0.05}s`,
                                            '--row-hover-bg': tc.light,
                                        }}>
                                        <td style={{ ...tdStyle, fontWeight: 700, color: '#0f172a' }}>{m.name || '—'}</td>
                                        <td style={tdStyle}>{m.designation || '—'}</td>
                                        <td style={tdStyle}>
                                            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: tc.light, color: tc.primary, fontSize: '11.5px', fontWeight: 700 }}>
                                                {TEACHES_AT_LABELS[m.level || 'general']}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>{m.qualification || '—'}</td>
                                        <td style={tdStyle}>{m.experience || '—'}</td>
                                        <td style={tdStyle}>{m.udiseCode || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Reveal>
        </div>
    </div>
);

const FacultyPublic = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        fetchData();
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [slug]);

    const fetchData = async () => {
        try {
            const res = await getPublicSchoolApi(slug);
            setSchool(res.data);
            if (res.data?.id) {
                const contentRes = await getPublicModuleContentApi(res.data.id, 'faculty');
                if (contentRes.data?.members?.length > 0) setContent(contentRes.data);
            }
        } catch (e) {
            navigate('/school-not-found');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid #f0c4c4', borderTop: '3px solid #8b2252', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!school) return null;

    const tc = getThemeColors(school.theme);
    const bc = getBaseColors(school.base_theme);
    const navbarSolid = scrollY > 60;

    if (!isModuleEnabled(school, 'faculty')) return <NotPublished tc={tc} slug={slug} label="Faculty" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Faculty" />;

    // Group members by level
    const grouped = {};
    content.members.forEach(m => {
        const lvl = m.level || 'general';
        if (!grouped[lvl]) grouped[lvl] = [];
        grouped[lvl].push(m);
    });
    const activeLevels = LEVEL_ORDER.filter(lvl => grouped[lvl] && grouped[lvl].length > 0);

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes facultyCardPop { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .faculty-card { position: relative; animation: facultyCardPop 0.5s cubic-bezier(0.16,1,0.3,1) both; transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease, border-color 0.35s ease; }
                .faculty-card::before { content: ''; position: absolute; inset: 5px; border: 1px solid transparent; border-radius: 3px; pointer-events: none; transition: border-color 0.35s ease, inset 0.35s ease; }
                .faculty-card:hover { transform: translateY(-6px); box-shadow: 0 18px 36px rgba(15,23,42,0.14); border-color: var(--tc-primary); }
                .faculty-card:hover::before { border-color: var(--tc-primary); inset: 3px; }
                .faculty-card-img img { transition: transform 0.5s cubic-bezier(0.16,1,0.3,1); }
                .faculty-card:hover .faculty-card-img img { transform: scale(1.08); }
                @keyframes facultyRowFade { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
                .faculty-row { animation: facultyRowFade 0.4s ease both; transition: background 0.2s ease; }
                .faculty-row:hover { background: var(--row-hover-bg) !important; }
                .faculty-row td { transition: color 0.2s ease; }
                body { background: ${bc.surface}; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="faculty" />

                {/* ── Header — no banner photo, clean gradient header (same design as About Us) ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: '4.5rem clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-1px', marginBottom: '10px' }}>
                            Our Faculty
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', padding: '3rem clamp(1.25rem,6vw,5rem) 0', background: bc.surface }}>
                    <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '500px', margin: '0 auto' }}>Meet the educators who inspire and guide our students every day</p>
                </div>

                {/* ── Level-wise sections ── */}
                {activeLevels.map(levelKey => (
                    <LevelSection key={levelKey} levelKey={levelKey} members={grouped[levelKey]} tc={tc} bc={bc} />
                ))}

                {/* ── Complete staff directory table ── */}
                <FacultyTable members={content.members} tc={tc} bc={bc} />

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default FacultyPublic;