// ============================================================================
// TCTemplates.js — TC Generation utility (Web Builder Pro)
// Location: frontend/src/utils/TCTemplates.js
// Pure JS — no React. Used by TCInformation.jsx (admin) & TCInformationPublic.jsx
// ============================================================================

// ---------------------------------------------------------------------------
// 1. Format detection from Excel filename
// ---------------------------------------------------------------------------
export const getFormatFromFilename = (filename) => {
    if (!filename) return 'default';
    const name = String(filename).toLowerCase().trim();
    if (name.startsWith('cbse_')) return 'cbse';
    if (name.startsWith('state_')) return 'state';
    if (name.startsWith('icse_')) return 'icse';
    return 'default';
};

export const FORMAT_LABELS = {
    cbse: 'CBSE Format',
    state: 'State Board Format',
    icse: 'ICSE Format',
    default: 'Default Format',
};

// ---------------------------------------------------------------------------
// 2. Excel/CSV column definitions per format
//    header = column header in sample CSV, key = record field
// ---------------------------------------------------------------------------
export const EXCEL_COLUMNS = {
    cbse: [
        { header: 'TC_No', key: 'tcNo' },
        { header: 'Student_Name', key: 'studentName' },
        { header: 'Mother_Name', key: 'motherName' },
        { header: 'Father_Name', key: 'fatherName' },
        { header: 'Nationality', key: 'nationality' },
        { header: 'Category', key: 'category' },
        { header: 'Aadhar_No', key: 'aadharNo' },
        { header: 'DOB', key: 'dob' },
        { header: 'Date_Of_Admission', key: 'dateOfAdmission' },
        { header: 'Admission_Class', key: 'admissionClass' },
        { header: 'Admission_No', key: 'admissionNo' },
        { header: 'Last_Class_Studied', key: 'lastClassStudied' },
        { header: 'Exam_Result', key: 'examResult' },
        { header: 'Year_Studied', key: 'yearStudied' },
        { header: 'Subjects', key: 'subjects' },
        { header: 'Promoted_To', key: 'promotedTo' },
        { header: 'Fees_Paid_Upto', key: 'feesPaidUpto' },
        { header: 'Dues_Pending', key: 'duesPending' },
        { header: 'NCC', key: 'ncc' },
        { header: 'Games_Sports', key: 'gamesSports' },
        { header: 'Extra_Curricular', key: 'extraCurricular' },
        { header: 'Leaving_Class', key: 'leavingClass' },
        { header: 'Date_Of_Leaving', key: 'dateOfLeaving' },
        { header: 'Reason_For_Leaving', key: 'reasonForLeaving' },
        { header: 'Conduct', key: 'conduct' },
        { header: 'Remarks', key: 'remarks' },
    ],
    state: [
        { header: 'TC_No', key: 'tcNo' },
        { header: 'Student_Name', key: 'studentName' },
        { header: 'Father_Name', key: 'fatherName' },
        { header: 'Mother_Name', key: 'motherName' },
        { header: 'DOB', key: 'dob' },
        { header: 'Nationality', key: 'nationality' },
        { header: 'Religion', key: 'religion' },
        { header: 'Caste', key: 'caste' },
        { header: 'Admission_No', key: 'admissionNo' },
        { header: 'Date_Of_Admission', key: 'dateOfAdmission' },
        { header: 'Admission_Class', key: 'admissionClass' },
        { header: 'Last_Class_Studied', key: 'lastClassStudied' },
        { header: 'Date_Of_Leaving', key: 'dateOfLeaving' },
        { header: 'Reason_For_Leaving', key: 'reasonForLeaving' },
        { header: 'Conduct', key: 'conduct' },
        { header: 'Remarks', key: 'remarks' },
    ],
    icse: [
        { header: 'TC_No', key: 'tcNo' },
        { header: 'Student_Name', key: 'studentName' },
        { header: 'Father_Name', key: 'fatherName' },
        { header: 'Mother_Name', key: 'motherName' },
        { header: 'DOB', key: 'dob' },
        { header: 'Nationality', key: 'nationality' },
        { header: 'Admission_No', key: 'admissionNo' },
        { header: 'Date_Of_Admission', key: 'dateOfAdmission' },
        { header: 'Admission_Class', key: 'admissionClass' },
        { header: 'Last_Class_Studied', key: 'lastClassStudied' },
        { header: 'Year_Studied', key: 'yearStudied' },
        { header: 'Subjects', key: 'subjects' },
        { header: 'Exam_Result', key: 'examResult' },
        { header: 'Promoted_To', key: 'promotedTo' },
        { header: 'Fees_Paid_Upto', key: 'feesPaidUpto' },
        { header: 'Games_Sports', key: 'gamesSports' },
        { header: 'Extra_Curricular', key: 'extraCurricular' },
        { header: 'Date_Of_Leaving', key: 'dateOfLeaving' },
        { header: 'Reason_For_Leaving', key: 'reasonForLeaving' },
        { header: 'Conduct', key: 'conduct' },
        { header: 'Remarks', key: 'remarks' },
    ],
    default: [
        { header: 'TC_No', key: 'tcNo' },
        { header: 'Student_Name', key: 'studentName' },
        { header: 'Father_Name', key: 'fatherName' },
        { header: 'Mother_Name', key: 'motherName' },
        { header: 'DOB', key: 'dob' },
        { header: 'Admission_No', key: 'admissionNo' },
        { header: 'Date_Of_Admission', key: 'dateOfAdmission' },
        { header: 'Last_Class_Studied', key: 'lastClassStudied' },
        { header: 'Date_Of_Leaving', key: 'dateOfLeaving' },
        { header: 'Reason_For_Leaving', key: 'reasonForLeaving' },
        { header: 'Conduct', key: 'conduct' },
        { header: 'Remarks', key: 'remarks' },
    ],
};

// ---------------------------------------------------------------------------
// 3. TC field definitions per format (numbered fields printed on TC)
//    Each field: { label, get(record) }
// ---------------------------------------------------------------------------
const val = (r, key) => {
    const v = r && r[key];
    return v !== undefined && v !== null && String(v).trim() !== '' ? String(v).trim() : '—';
};

const TC_FIELDS = {
    // CBSE — 25 numbered fields
    cbse: [
        { label: 'Name of Pupil', get: (r) => val(r, 'studentName') },
        { label: "Mother's Name", get: (r) => val(r, 'motherName') },
        { label: "Father's / Guardian's Name", get: (r) => val(r, 'fatherName') },
        { label: 'Nationality', get: (r) => val(r, 'nationality') },
        { label: 'Whether the candidate belongs to SC / ST / OBC Category', get: (r) => val(r, 'category') },
        { label: 'Aadhaar Card Number', get: (r) => val(r, 'aadharNo') },
        { label: 'Date of Birth (as per Admission Register)', get: (r) => val(r, 'dob') },
        { label: 'Date of First Admission in the School', get: (r) => val(r, 'dateOfAdmission') },
        { label: 'Class in which Admitted', get: (r) => val(r, 'admissionClass') },
        { label: 'Admission Number', get: (r) => val(r, 'admissionNo') },
        { label: 'Class in which the Pupil Last Studied', get: (r) => val(r, 'lastClassStudied') },
        { label: 'School / Board Annual Examination Last Taken with Result', get: (r) => val(r, 'examResult') },
        { label: 'Academic Session / Year(s) Studied', get: (r) => val(r, 'yearStudied') },
        { label: 'Subjects Studied', get: (r) => val(r, 'subjects') },
        { label: 'Whether Qualified for Promotion to Higher Class (if so, to which class)', get: (r) => val(r, 'promotedTo') },
        { label: 'Month up to which School Dues Paid', get: (r) => val(r, 'feesPaidUpto') },
        { label: 'Any Dues Pending', get: (r) => val(r, 'duesPending') },
        { label: 'Whether NCC Cadet / Boy Scout / Girl Guide', get: (r) => val(r, 'ncc') },
        { label: 'Games Played / Sports', get: (r) => val(r, 'gamesSports') },
        { label: 'Extra-Curricular Activities', get: (r) => val(r, 'extraCurricular') },
        { label: 'General Conduct', get: (r) => val(r, 'conduct') },
        { label: 'Class up to which Promoted / Leaving Class', get: (r) => val(r, 'leavingClass') },
        { label: 'Date of Leaving the School', get: (r) => val(r, 'dateOfLeaving') },
        { label: 'Reason for Leaving the School', get: (r) => val(r, 'reasonForLeaving') },
        { label: 'Any Other Remarks', get: (r) => val(r, 'remarks') },
    ],

    // State Board — 15 fields
    state: [
        { label: 'Name of Student', get: (r) => val(r, 'studentName') },
        { label: "Father's Name", get: (r) => val(r, 'fatherName') },
        { label: "Mother's Name", get: (r) => val(r, 'motherName') },
        { label: 'Date of Birth', get: (r) => val(r, 'dob') },
        { label: 'Nationality', get: (r) => val(r, 'nationality') },
        { label: 'Religion', get: (r) => val(r, 'religion') },
        { label: 'Caste', get: (r) => (r && (r.caste || r.category) ? String(r.caste || r.category) : '—') },
        { label: 'Admission Number', get: (r) => val(r, 'admissionNo') },
        { label: 'Date of Admission', get: (r) => val(r, 'dateOfAdmission') },
        { label: 'Class in which Admitted', get: (r) => val(r, 'admissionClass') },
        { label: 'Class Last Studied', get: (r) => val(r, 'lastClassStudied') },
        { label: 'Date of Leaving the School', get: (r) => val(r, 'dateOfLeaving') },
        { label: 'Reason for Leaving', get: (r) => val(r, 'reasonForLeaving') },
        { label: 'Conduct and Character', get: (r) => val(r, 'conduct') },
        { label: 'Remarks', get: (r) => val(r, 'remarks') },
    ],

    // ICSE — 19 fields
    icse: [
        { label: 'Name of Pupil', get: (r) => val(r, 'studentName') },
        { label: "Father's / Guardian's Name", get: (r) => val(r, 'fatherName') },
        { label: "Mother's Name", get: (r) => val(r, 'motherName') },
        { label: 'Date of Birth', get: (r) => val(r, 'dob') },
        { label: 'Nationality', get: (r) => val(r, 'nationality') },
        { label: 'Admission Number', get: (r) => val(r, 'admissionNo') },
        { label: 'Date of Admission', get: (r) => val(r, 'dateOfAdmission') },
        { label: 'Class in which Admitted', get: (r) => val(r, 'admissionClass') },
        { label: 'Class in which Last Studied', get: (r) => val(r, 'lastClassStudied') },
        { label: 'Academic Year(s) Studied', get: (r) => val(r, 'yearStudied') },
        { label: 'Subjects Offered', get: (r) => val(r, 'subjects') },
        { label: 'Examination Last Taken with Result', get: (r) => val(r, 'examResult') },
        { label: 'Whether Qualified for Promotion (if so, to which class)', get: (r) => val(r, 'promotedTo') },
        { label: 'Fees Paid up to', get: (r) => val(r, 'feesPaidUpto') },
        { label: 'Games / Sports Participation', get: (r) => val(r, 'gamesSports') },
        { label: 'Co-Curricular Activities', get: (r) => val(r, 'extraCurricular') },
        { label: 'Date of Leaving the School', get: (r) => val(r, 'dateOfLeaving') },
        { label: 'Reason for Leaving', get: (r) => val(r, 'reasonForLeaving') },
        { label: 'General Conduct & Remarks', get: (r) => {
            const c = r && r.conduct ? String(r.conduct) : '—';
            const rem = r && r.remarks ? ` (${r.remarks})` : '';
            return c + rem;
        } },
    ],

    // Default — 11 basic fields
    default: [
        { label: 'Name of Student', get: (r) => val(r, 'studentName') },
        { label: "Father's Name", get: (r) => val(r, 'fatherName') },
        { label: "Mother's Name", get: (r) => val(r, 'motherName') },
        { label: 'Date of Birth', get: (r) => val(r, 'dob') },
        { label: 'Admission Number', get: (r) => val(r, 'admissionNo') },
        { label: 'Date of Admission', get: (r) => val(r, 'dateOfAdmission') },
        { label: 'Class Last Studied', get: (r) => val(r, 'lastClassStudied') },
        { label: 'Date of Leaving the School', get: (r) => val(r, 'dateOfLeaving') },
        { label: 'Reason for Leaving', get: (r) => val(r, 'reasonForLeaving') },
        { label: 'Conduct', get: (r) => val(r, 'conduct') },
        { label: 'Remarks', get: (r) => val(r, 'remarks') },
    ],
};

// ---------------------------------------------------------------------------
// 4. TC HTML generation
// ---------------------------------------------------------------------------
const esc = (s) =>
    String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const todayStr = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
};

export const generateTCHTML = (record, school, format = 'default') => {
    const fields = TC_FIELDS[format] || TC_FIELDS.default;
    const schoolName = esc(school?.school_name || school?.name || 'School Name');
    const address = esc(school?.address || '');
    const phone = esc(school?.phone || school?.contact_number || '');
    const email = esc(school?.email || '');
    const logo = school?.logo_url || '';
    const affiliation = FORMAT_LABELS[format] || FORMAT_LABELS.default;

    const rowsHtml = fields
        .map(
            (f, i) => `
            <tr>
                <td class="sr">${i + 1}.</td>
                <td class="label">${esc(f.label)}</td>
                <td class="value">${esc(f.get(record))}</td>
            </tr>`
        )
        .join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Transfer Certificate — ${esc(record?.studentName || '')}</title>
<style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        font-family: 'Times New Roman', Times, serif;
        color: #111;
        background: #f0f0f0;
        padding: 20px;
    }
    .sheet {
        width: 210mm;
        min-height: 280mm;
        margin: 0 auto;
        background: #fff;
        padding: 14mm 12mm;
        border: 1px solid #999;
    }
    /* School header */
    .head {
        display: flex;
        align-items: center;
        gap: 14px;
        border-bottom: 3px double #111;
        padding-bottom: 10px;
        margin-bottom: 10px;
    }
    .head img { width: 72px; height: 72px; object-fit: contain; }
    .head .info { flex: 1; text-align: center; }
    .head h1 { font-size: 26px; letter-spacing: 0.5px; text-transform: uppercase; }
    .head p { font-size: 12.5px; margin-top: 2px; }
    .head .affil { font-size: 11.5px; font-style: italic; margin-top: 3px; }
    /* Title */
    .title-wrap { text-align: center; margin: 14px 0 10px; }
    .title {
        display: inline-block;
        border: 3px double #111;
        padding: 6px 26px;
        font-size: 18px;
        font-weight: bold;
        letter-spacing: 3px;
        text-transform: uppercase;
    }
    /* Serial / Date row */
    .meta {
        display: flex;
        justify-content: space-between;
        font-size: 13.5px;
        font-weight: bold;
        margin: 12px 2px 10px;
    }
    /* Fields table */
    table.fields { width: 100%; border-collapse: collapse; font-size: 13px; }
    table.fields td { border: 1px solid #444; padding: 5px 8px; vertical-align: top; }
    table.fields td.sr { width: 34px; text-align: center; }
    table.fields td.label { width: 46%; }
    table.fields td.value { font-weight: bold; }
    /* Signature block */
    .signs {
        display: flex;
        justify-content: space-between;
        margin-top: 60px;
        font-size: 13px;
        font-weight: bold;
        text-align: center;
    }
    .signs .sig { width: 30%; }
    .signs .line { border-top: 1px solid #111; padding-top: 6px; }
    .note { font-size: 10.5px; font-style: italic; margin-top: 18px; text-align: center; color: #333; }
    /* Print buttons */
    .no-print {
        text-align: center;
        margin: 0 auto 16px;
        max-width: 210mm;
        display: flex;
        gap: 10px;
        justify-content: center;
        align-items: center;
    }
    .no-print button {
        border: none;
        font-family: inherit;
        font-size: 14px;
        font-weight: bold;
        padding: 10px 24px;
        border-radius: 6px;
        cursor: pointer;
    }
    .btn-pdf { background: #2563eb; color: #fff; }
    .btn-pdf:hover { background: #1d4ed8; }
    .btn-print { background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1 !important; }
    .btn-print:hover { background: #e2e8f0; }
    @media print {
        body { background: #fff; padding: 0; }
        .sheet { border: none; width: auto; min-height: auto; padding: 0; }
        .no-print { display: none !important; }
    }
</style>
</head>
<body>
    <div class="no-print">
        <button class="btn-pdf" onclick="window.print()">💾 Save as PDF</button>
        <button class="btn-print" onclick="window.print()">🖨 Print</button>
    </div>

    <div class="sheet">
        <div class="head">
            ${logo ? `<img src="${esc(logo)}" alt="Logo" />` : ''}
            <div class="info">
                <h1>${schoolName}</h1>
                ${address ? `<p>${address}</p>` : ''}
                ${phone || email ? `<p>${phone ? 'Ph: ' + phone : ''}${phone && email ? ' | ' : ''}${email ? 'Email: ' + email : ''}</p>` : ''}
                <p class="affil">${esc(affiliation)}</p>
            </div>
            ${logo ? `<div style="width:72px"></div>` : ''}
        </div>

        <div class="title-wrap">
            <span class="title">Transfer Certificate</span>
        </div>

        <div class="meta">
            <span>Serial No: ${esc(record?.tcNo || '—')}</span>
            <span>Date of Issue: ${esc(record?.dateOfIssue || todayStr())}</span>
        </div>

        <table class="fields">
            ${rowsHtml}
        </table>

        <div class="signs">
            <div class="sig"><div class="line">Class Teacher</div></div>
            <div class="sig"><div class="line">Dealing Clerk</div></div>
            <div class="sig"><div class="line">Principal<br/>(Seal & Signature)</div></div>
        </div>

        <p class="note">This is a computer-generated Transfer Certificate issued by ${schoolName}.</p>
    </div>
</body>
</html>`;
};

// ---------------------------------------------------------------------------
// 5. Print TC — opens new window with TC HTML + Print button
// ---------------------------------------------------------------------------
export const printTC = (record, school, format = 'default') => {
    const html = generateTCHTML(record, school, format);
    const win = window.open('', '_blank', 'width=900,height=1000');
    if (!win) {
        alert('Popup blocked! Please allow popups for this site to generate the TC.');
        return false;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    return true;
};

// ---------------------------------------------------------------------------
// 6. Sample CSV per format (for admin reference download)
// ---------------------------------------------------------------------------
const SAMPLE_ROW = {
    tcNo: 'TC001',
    studentName: 'Rahul Sharma',
    fatherName: 'Suresh Sharma',
    motherName: 'Sunita Sharma',
    dob: '15/08/2008',
    nationality: 'Indian',
    religion: 'Hindu',
    caste: 'General',
    category: 'General',
    aadharNo: '1234 5678 9012',
    admissionNo: 'ADM001',
    admissionClass: 'Class 1',
    dateOfAdmission: '01/04/2015',
    lastClassStudied: 'Class 10',
    leavingClass: 'Class 10',
    yearStudied: '2024-25',
    subjects: 'English; Hindi; Math; Science; Social Science',
    examResult: 'Passed',
    promotedTo: 'Class 11',
    feesPaidUpto: 'March 2025',
    duesPending: 'Nil',
    ncc: 'N/A',
    gamesSports: 'Cricket',
    extraCurricular: 'Debate',
    dateOfLeaving: '31/03/2025',
    reasonForLeaving: 'Completion of Class 10',
    conduct: 'Good',
    remarks: '',
};

export const getSampleCSV = (format = 'default') => {
    const cols = EXCEL_COLUMNS[format] || EXCEL_COLUMNS.default;
    const headers = cols.map((c) => c.header).join(',');
    const row = cols
        .map((c) => {
            const v = SAMPLE_ROW[c.key] || '';
            return v.includes(',') ? `"${v}"` : v;
        })
        .join(',');
    return `${headers}\n${row}`;
};