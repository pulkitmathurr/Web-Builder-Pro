// ============================================================================
// TCInformation.jsx — Admin panel (TC Generation System)
// Location: frontend/src/pages/admin/modules/TCInformation.jsx
// Module key: 'tc' (already in moduleRegistry.js)
// Requires: npm install xlsx
// ============================================================================
import { useEffect, useMemo, useState } from 'react';
import {
    getModuleContentApi,
    saveModuleContentApi,
    togglePublishApi,
} from '../../../api/content.api';
import RichTextEditor from '../../../components/common/RichTextEditor';
import useSchoolStore from '../../../store/schoolStore';
import ItalicToggle from '../../../components/common/ItalicToggle';
import {
    getFormatFromFilename,
    FORMAT_LABELS,
    getSampleCSV,
} from '../../../utils/TCTemplates';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const MODULE_KEY = 'tc';

const uid = (prefix) =>
    `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// ---------------------------------------------------------------------------
// Excel column-name normalization + variants
// ---------------------------------------------------------------------------
const normalizeKey = (k) =>
    String(k || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

const COLUMN_VARIANTS = {
    tcNo: ['tc_no', 'tcno', 'tc_number', 'serial_no', 'sr_no', 'certificate_no'],
    studentName: ['student_name', 'name', 'name_of_pupil', 'pupil_name', 'student', 'name_of_student'],
    fatherName: ['father_name', 'fathers_name', 'father_s_name', 'father', 'guardian_name'],
    motherName: ['mother_name', 'mothers_name', 'mother_s_name', 'mother'],
    dob: ['dob', 'date_of_birth', 'birth_date', 'd_o_b'],
    nationality: ['nationality'],
    religion: ['religion'],
    caste: ['caste'],
    category: ['category', 'caste_category', 'sc_st_obc', 'sc_st_obc_category'],
    aadharNo: ['aadhar_no', 'aadhaar_no', 'aadhar', 'aadhaar', 'aadhar_number', 'aadhaar_number'],
    admissionNo: ['admission_no', 'adm_no', 'admission_number', 'adm_number'],
    admissionClass: ['admission_class', 'class_of_admission', 'class_at_admission', 'class_in_which_admitted'],
    dateOfAdmission: ['date_of_admission', 'admission_date', 'doa', 'date_of_first_admission'],
    lastClassStudied: ['last_class_studied', 'class_last_studied', 'last_class', 'class'],
    leavingClass: ['leaving_class', 'class_up_to_which_promoted'],
    yearStudied: ['year_studied', 'year', 'session', 'academic_year'],
    subjects: ['subjects', 'subjects_studied', 'subjects_offered'],
    examResult: ['exam_result', 'result', 'examination_result', 'board_result'],
    promotedTo: ['promoted_to', 'promotion', 'qualified_for_promotion'],
    feesPaidUpto: ['fees_paid_upto', 'fee_paid_upto', 'fees_paid_up_to', 'dues_paid_upto'],
    duesPending: ['dues_pending', 'dues', 'any_dues'],
    ncc: ['ncc', 'ncc_scout_guide'],
    gamesSports: ['games_sports', 'games', 'sports', 'games_played'],
    extraCurricular: ['extra_curricular', 'extracurricular', 'activities', 'co_curricular'],
    dateOfLeaving: ['date_of_leaving', 'leaving_date', 'dol'],
    reasonForLeaving: ['reason_for_leaving', 'reason', 'reason_of_leaving'],
    conduct: ['conduct', 'general_conduct', 'conduct_and_character'],
    remarks: ['remarks', 'remark', 'any_other_remarks'],
};

const mapExcelRow = (rawRow) => {
    // normalize all keys of the raw row once
    const norm = {};
    Object.keys(rawRow).forEach((k) => {
        const nk = normalizeKey(k);
        if (nk && norm[nk] === undefined) norm[nk] = rawRow[k];
    });
    const record = { id: uid('tc') };
    Object.entries(COLUMN_VARIANTS).forEach(([field, variants]) => {
        for (const v of variants) {
            if (norm[v] !== undefined && norm[v] !== null && String(norm[v]).trim() !== '') {
                record[field] = String(norm[v]).trim();
                break;
            }
        }
    });
    return record;
};

// ---------------------------------------------------------------------------
// Small shared styles
// ---------------------------------------------------------------------------
const card = {
    background: '#fff',
    border: '0.5px solid #f1f5f9',
    borderRadius: 16,
    boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
    padding: 24,
    marginBottom: 24,
};
const label = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 };
const input = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
};
const btnPrimary = {
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
};
const btnGhost = {
    background: '#fff',
    color: '#0f172a',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
};
const th = {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
};
const td = {
    padding: '10px 12px',
    fontSize: 13.5,
    color: '#334155',
    borderBottom: '1px solid #f1f5f9',
    whiteSpace: 'nowrap',
};

const EMPTY_ADD_FORM = {
    tcNo: '',
    studentName: '',
    fatherName: '',
    motherName: '',
    dob: '',
    lastClassStudied: '',
    dateOfLeaving: '',
    conduct: 'Good',
    remarks: '',
};

// ============================================================================
// Component
// ============================================================================
const TCInformation = () => {
    const { tc } = useSchoolStore();
    const [heading, setHeading] = useState('Download Transfer Certificate');
    const [headingItalic, setHeadingItalic] = useState(false);
    const [description, setDescription] = useState('');
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [isPublished, setIsPublished] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [msg, setMsg] = useState(null); // { type: 'ok'|'err', text }

    const [showNewSession, setShowNewSession] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');

    const [excelPreview, setExcelPreview] = useState(null); // { rows, format, fileName }
    const [excelBusy, setExcelBusy] = useState(false);

    const [search, setSearch] = useState('');
    const [addOneOpen, setAddOneOpen] = useState(false);
    const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);

    const activeSession = useMemo(
        () => sessions.find((s) => s.id === activeSessionId) || null,
        [sessions, activeSessionId]
    );

    const flash = (type, text) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 3500);
    };

    // ------------------------------------------------------------------
    // Load
    // ------------------------------------------------------------------
    useEffect(() => {
        (async () => {
            try {
                const res = await getModuleContentApi(MODULE_KEY);
                const data = res?.data?.data || res?.data;
                if (data?.content) {
                    const c = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
                    setHeading(c.heading || 'Download Transfer Certificate');
                    setHeadingItalic(!!c.headingItalic);
                    setDescription(c.description || '');
                    const sess = Array.isArray(c.sessions) ? c.sessions : [];
                    // backward compatibility: old records without tcFormat
                    setSessions(sess.map((s) => ({ tcFormat: 'default', ...s, records: s.records || [] })));
                    if (sess.length) setActiveSessionId(sess[0].id);
                }
                setIsPublished(!!(data?.is_published));
            } catch (e) {
                console.error('TC load failed', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ------------------------------------------------------------------
    // Save / Publish
    // ------------------------------------------------------------------
    // Reads the ACTUAL published flag from the server (source of truth).
    const fetchPublishedFlag = async () => {
        const res = await getModuleContentApi(MODULE_KEY);
        const data = res?.data?.data || res?.data;
        return !!(data?.is_published ?? data?.isPublished);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveModuleContentApi(MODULE_KEY, { heading, headingItalic, description, sessions });
            // Some backends reset the published flag on save — re-sync badge from DB.
            try { setIsPublished(await fetchPublishedFlag()); } catch { /* keep current */ }
            flash('ok', 'Draft saved successfully.');
        } catch (e) {
            console.error(e);
            flash('err', 'Save failed. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handlePublishToggle = async () => {
        setPublishing(true);
        try {
            const wantPublished = !isPublished;
            await saveModuleContentApi(MODULE_KEY, { heading, headingItalic, description, sessions });

            // Toggle ONLY if the server state differs from what we want —
            // never blind-flip based on possibly-stale UI state.
            let current = await fetchPublishedFlag();
            if (current !== wantPublished) {
                await togglePublishApi(MODULE_KEY);
                current = await fetchPublishedFlag();
            }
            setIsPublished(current);
            flash('ok', current ? 'Module published — live on public site.' : 'Module unpublished.');
        } catch (e) {
            console.error(e);
            flash('err', 'Publish action failed.');
        } finally {
            setPublishing(false);
        }
    };

    // ------------------------------------------------------------------
    // Sessions
    // ------------------------------------------------------------------
    const addSession = () => {
        const name = newSessionName.trim();
        if (!name) return;
        const s = { id: uid('sess'), name, tcFormat: 'default', records: [] };
        setSessions((prev) => [...prev, s]);
        setActiveSessionId(s.id);
        setNewSessionName('');
        setShowNewSession(false);
        setExcelPreview(null);
        setSearch('');
    };

    const deleteSession = (id) => {
        const s = sessions.find((x) => x.id === id);
        if (!window.confirm(`Delete session "${s?.name}" and its ${s?.records?.length || 0} records?`)) return;
        setSessions((prev) => {
            const next = prev.filter((x) => x.id !== id);
            if (activeSessionId === id) setActiveSessionId(next[0]?.id || null);
            return next;
        });
        setExcelPreview(null);
    };

    const updateActiveSession = (updater) => {
        setSessions((prev) => prev.map((s) => (s.id === activeSessionId ? updater(s) : s)));
    };

    // ------------------------------------------------------------------
    // Excel upload (SheetJS dynamic import)
    // ------------------------------------------------------------------
    const handleExcelFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-selecting same file
        if (!file || !activeSession) return;

        setExcelBusy(true);
        try {
            const XLSX = await import('xlsx'); // npm install xlsx
            const buf = await file.arrayBuffer();
            const wb = XLSX.read(buf, { type: 'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            const rows = rawRows.map(mapExcelRow).filter((r) => r.tcNo || r.studentName);
            if (!rows.length) {
                flash('err', 'No valid rows found in the Excel file. Check column headers.');
                return;
            }
            const format = getFormatFromFilename(file.name);
            setExcelPreview({ rows, format, fileName: file.name });
        } catch (err) {
            console.error('Excel parse failed', err);
            flash('err', 'Could not read the Excel file. Is xlsx installed? (npm install xlsx)');
        } finally {
            setExcelBusy(false);
        }
    };

    const applyExcel = (mode) => {
        if (!excelPreview || !activeSession) return;
        updateActiveSession((s) => ({
            ...s,
            tcFormat: excelPreview.format,
            records: mode === 'replace' ? excelPreview.rows : [...(s.records || []), ...excelPreview.rows],
        }));
        flash(
            'ok',
            `${excelPreview.rows.length} records ${mode === 'replace' ? 'imported (replaced all)' : 'added'} — format: ${FORMAT_LABELS[excelPreview.format]}. Don't forget to Save.`
        );
        setExcelPreview(null);
    };

    const downloadSample = (format) => {
        const csv = getSampleCSV(format);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${format}_tc_sample.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ------------------------------------------------------------------
    // Records
    // ------------------------------------------------------------------
    const filteredRecords = useMemo(() => {
        const list = activeSession?.records || [];
        const q = search.trim().toLowerCase();
        if (!q) return list;
        return list.filter(
            (r) =>
                (r.tcNo || '').toLowerCase().includes(q) ||
                (r.studentName || '').toLowerCase().includes(q)
        );
    }, [activeSession, search]);

    const deleteRecord = (id) => {
        updateActiveSession((s) => ({ ...s, records: (s.records || []).filter((r) => r.id !== id) }));
    };

    const submitAddOne = () => {
        if (!addForm.tcNo.trim() || !addForm.studentName.trim()) {
            flash('err', 'TC No and Student Name are required.');
            return;
        }
        updateActiveSession((s) => ({
            ...s,
            records: [...(s.records || []), { id: uid('tc'), ...addForm }],
        }));
        setAddForm(EMPTY_ADD_FORM);
        setAddOneOpen(false);
        flash('ok', 'Record added. Don\'t forget to Save.');
    };

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    if (loading) {
        return (
            <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Loading TC module…</div>
        );
    }

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 60px' }}>
            {/* ============ Hero header ============ */}
            <div
                style={{
                    background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`,
                    borderRadius: 20,
                    padding: '36px 32px',
                    color: '#fff',
                    margin: '24px 0',
                    boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}`,
                }}
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <h1 style={{ fontSize: 26, fontWeight: 800 }}>TC Generation System</h1>
                            <span
                                style={{
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    padding: '4px 12px',
                                    borderRadius: 999,
                                    background: isPublished ? 'rgba(34,197,94,0.18)' : 'rgba(250,204,21,0.15)',
                                    color: isPublished ? '#4ade80' : '#fde047',
                                    border: `1px solid ${isPublished ? 'rgba(74,222,128,0.4)' : 'rgba(253,224,71,0.35)'}`,
                                }}
                            >
                                {isPublished ? 'PUBLISHED' : 'DRAFT'}
                            </span>
                        </div>
                        <p style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.75)', maxWidth: 560 }}>
                            Upload session-wise TC records from Excel. Format is auto-detected from the
                            filename, and students can generate & download their TC as PDF from the public page.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{ ...btnGhost, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
                        >
                            {saving ? 'Saving…' : 'Save Draft'}
                        </button>
                        <button
                            onClick={handlePublishToggle}
                            disabled={publishing}
                            style={{ ...btnPrimary, background: isPublished ? '#7f1d1d' : '#16a34a' }}
                        >
                            {publishing ? 'Working…' : isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                    </div>
                </div>
            </div>

            {msg && (
                <div
                    style={{
                        marginBottom: 20,
                        padding: '12px 16px',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 600,
                        background: msg.type === 'ok' ? '#f0fdf4' : '#fef2f2',
                        color: msg.type === 'ok' ? '#15803d' : '#b91c1c',
                        border: `1px solid ${msg.type === 'ok' ? '#bbf7d0' : '#fecaca'}`,
                    }}
                >
                    {msg.text}
                </div>
            )}

            {/* ============ Page content ============ */}
            <div style={card}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Page Content</h2>
                <div style={{ marginBottom: 18 }}>
                    <label style={label}>Heading</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input style={{ ...input, fontStyle: headingItalic ? 'italic' : 'normal' }} value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="Download Transfer Certificate" />
                        <ItalicToggle active={headingItalic} onToggle={() => setHeadingItalic(v => !v)} />
                    </div>
                </div>
                <div>
                    <label style={label}>Description</label>
                    <RichTextEditor value={description} onChange={setDescription} />
                </div>
            </div>

            {/* ============ Format reference ============ */}
            <div style={{ ...card, background: '#f8fafc' }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Excel Filename → TC Format</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                    Format is auto-detected from the uploaded filename prefix. Download a sample to see the expected columns.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
                    {[
                        { format: 'cbse', example: 'cbse_2024-25.xlsx' },
                        { format: 'state', example: 'state_2024-25.xlsx' },
                        { format: 'icse', example: 'icse_2024-25.xlsx' },
                        { format: 'default', example: 'records_2024-25.xlsx' },
                    ].map(({ format, example }) => (
                        <div key={format} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                            <div style={{ fontSize: 12.5, fontFamily: 'monospace', color: '#7c2d12', background: '#fff7ed', borderRadius: 6, padding: '3px 8px', display: 'inline-block' }}>
                                {example}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '10px 0 8px' }}>
                                → {FORMAT_LABELS[format]}
                            </div>
                            <button onClick={() => downloadSample(format)} style={{ ...btnGhost, padding: '6px 12px', fontSize: 12.5 }}>
                                Sample CSV ↓
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ============ Session dropdown ============ */}
            <div style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: activeSession ? 22 : 0, flexWrap: 'wrap' }}>
                    {/* Dropdown */}
                    <div style={{ flex: 1, minWidth: 220 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Academic Session
                        </label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={activeSessionId || ''}
                                onChange={(e) => {
                                    setActiveSessionId(e.target.value);
                                    setExcelPreview(null);
                                    setSearch('');
                                    setAddOneOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    appearance: 'none',
                                    padding: '10px 40px 10px 14px',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    border: '1.5px solid #e2e8f0',
                                    borderRadius: 10,
                                    background: '#fff',
                                    color: '#0f172a',
                                    cursor: 'pointer',
                                    outline: 'none',
                                }}
                            >
                                {sessions.length === 0 && <option value="">No sessions yet</option>}
                                {sessions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} — {FORMAT_LABELS[s.tcFormat || 'default']} ({s.records?.length || 0} records)
                                    </option>
                                ))}
                            </select>
                            {/* Chevron icon */}
                            <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>
                    </div>

                    {/* Delete active session */}
                    {activeSession && (
                        <button
                            onClick={() => deleteSession(activeSessionId)}
                            style={{ ...btnGhost, color: '#dc2626', borderColor: '#fecaca', padding: '10px 14px', whiteSpace: 'nowrap' }}
                        >
                            🗑 Delete Session
                        </button>
                    )}

                    {/* New Session */}
                    {showNewSession ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                                autoFocus
                                style={{ ...input, width: 140, padding: '10px 12px' }}
                                placeholder="e.g. 2025-26"
                                value={newSessionName}
                                onChange={(e) => setNewSessionName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addSession()}
                            />
                            <button onClick={addSession} style={{ ...btnPrimary, padding: '10px 14px' }}>Add</button>
                            <button onClick={() => { setShowNewSession(false); setNewSessionName(''); }} style={{ ...btnGhost, padding: '10px 14px' }}>Cancel</button>
                        </div>
                    ) : (
                        <button onClick={() => setShowNewSession(true)} style={{ ...btnGhost, borderStyle: 'dashed', padding: '10px 16px', whiteSpace: 'nowrap' }}>
                            + New Session
                        </button>
                    )}
                </div>

                {!activeSession && sessions.length === 0 && (
                    <p style={{ marginTop: 16, fontSize: 14, color: '#64748b' }}>
                        No sessions yet. Create a session (e.g. "2024-25") to start uploading TC records.
                    </p>
                )}

                {activeSession && (
                    <>
                        {/* Session info bar */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 16px', marginBottom: 20, fontSize: 13.5 }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>Session: {activeSession.name}</span>
                            <span style={{ color: '#cbd5e1' }}>|</span>
                            <span style={{ color: '#475569' }}>TC Format: <b>{FORMAT_LABELS[activeSession.tcFormat || 'default']}</b></span>
                            <span style={{ color: '#cbd5e1' }}>|</span>
                            <span style={{ color: '#475569' }}>{activeSession.records?.length || 0} records</span>
                        </div>

                        {/* Excel upload */}
                        <div style={{ border: '1.5px dashed #cbd5e1', borderRadius: 14, padding: 20, marginBottom: 24, background: '#fcfcfd' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Upload Excel (.xlsx)</h3>
                                    <p style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
                                        Parsed in-browser with SheetJS — requires <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>npm install xlsx</code>. Format auto-detected from filename.
                                    </p>
                                </div>
                                <label style={{ ...btnPrimary, display: 'inline-block' }}>
                                    {excelBusy ? 'Reading…' : 'Choose .xlsx file'}
                                    <input type="file" accept=".xlsx,.xls" onChange={handleExcelFile} style={{ display: 'none' }} disabled={excelBusy} />
                                </label>
                            </div>

                            {excelPreview && (
                                <div style={{ marginTop: 18 }}>
                                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>
                                        📄 {excelPreview.fileName} — <span style={{ color: tc.primary }}>{FORMAT_LABELS[excelPreview.format]}</span> detected, {excelPreview.rows.length} records found
                                    </div>
                                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ background: '#f8fafc' }}>
                                                <tr>
                                                    {['TC No', 'Student Name', 'Father Name', 'DOB', 'Class', 'Date of Leaving', 'Conduct'].map((h) => (
                                                        <th key={h} style={th}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {excelPreview.rows.slice(0, 4).map((r) => (
                                                    <tr key={r.id}>
                                                        <td style={td}>{r.tcNo || '—'}</td>
                                                        <td style={td}>{r.studentName || '—'}</td>
                                                        <td style={td}>{r.fatherName || '—'}</td>
                                                        <td style={td}>{r.dob || '—'}</td>
                                                        <td style={td}>{r.lastClassStudied || '—'}</td>
                                                        <td style={td}>{r.dateOfLeaving || '—'}</td>
                                                        <td style={td}>{r.conduct || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {excelPreview.rows.length > 4 && (
                                        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>…and {excelPreview.rows.length - 4} more rows</p>
                                    )}
                                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                                        <button onClick={() => applyExcel('add')} style={{ ...btnPrimary, background: '#16a34a' }}>
                                            Add to existing ({activeSession.records?.length || 0})
                                        </button>
                                        <button onClick={() => applyExcel('replace')} style={{ ...btnPrimary, background: '#b91c1c' }}>
                                            Replace all
                                        </button>
                                        <button onClick={() => setExcelPreview(null)} style={btnGhost}>Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Records toolbar */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <input
                                style={{ ...input, maxWidth: 320 }}
                                placeholder="Search by TC No or Student Name…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button onClick={() => setAddOneOpen((o) => !o)} style={btnGhost}>
                                {addOneOpen ? 'Close form' : '+ Add One'}
                            </button>
                        </div>

                        {/* Add-one inline form */}
                        {addOneOpen && (
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, marginBottom: 18 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                    {[
                                        { key: 'tcNo', ph: 'TC No *' },
                                        { key: 'studentName', ph: 'Student Name *' },
                                        { key: 'fatherName', ph: 'Father Name' },
                                        { key: 'motherName', ph: 'Mother Name' },
                                        { key: 'dob', ph: 'DOB (DD/MM/YYYY)' },
                                        { key: 'lastClassStudied', ph: 'Class Last Studied' },
                                        { key: 'dateOfLeaving', ph: 'Date of Leaving' },
                                        { key: 'conduct', ph: 'Conduct' },
                                        { key: 'remarks', ph: 'Remarks' },
                                    ].map((f) => (
                                        <input
                                            key={f.key}
                                            style={input}
                                            placeholder={f.ph}
                                            value={addForm[f.key]}
                                            onChange={(e) => setAddForm((p) => ({ ...p, [f.key]: e.target.value }))}
                                        />
                                    ))}
                                </div>
                                <button onClick={submitAddOne} style={{ ...btnPrimary, marginTop: 14 }}>Add Record</button>
                            </div>
                        )}

                        {/* Records table */}
                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                        {['TC No', 'Student Name', 'Father Name', 'DOB', 'Class', 'Date of Leaving', 'Conduct', ''].map((h, i) => (
                                            <th key={i} style={th}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.length === 0 && (
                                        <tr>
                                            <td colSpan={8} style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 26 }}>
                                                {search ? 'No records match your search.' : 'No records in this session yet — upload an Excel or use "+ Add One".'}
                                            </td>
                                        </tr>
                                    )}
                                    {filteredRecords.map((r) => (
                                        <tr key={r.id}>
                                            <td style={{ ...td, fontWeight: 700 }}>{r.tcNo || '—'}</td>
                                            <td style={td}>{r.studentName || '—'}</td>
                                            <td style={td}>{r.fatherName || '—'}</td>
                                            <td style={td}>{r.dob || '—'}</td>
                                            <td style={td}>{r.lastClassStudied || '—'}</td>
                                            <td style={td}>{r.dateOfLeaving || '—'}</td>
                                            <td style={td}>{r.conduct || '—'}</td>
                                            <td style={td}>
                                                <button
                                                    onClick={() => deleteRecord(r.id)}
                                                    style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* ============ Bottom save bar ============ */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button onClick={handleSave} disabled={saving} style={btnGhost}>
                    {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button onClick={handlePublishToggle} disabled={publishing} style={{ ...btnPrimary, background: isPublished ? '#7f1d1d' : '#16a34a' }}>
                    {publishing ? 'Working…' : isPublished ? 'Unpublish' : 'Publish'}
                </button>
            </div>
        </div>
    );
};

export default TCInformation;