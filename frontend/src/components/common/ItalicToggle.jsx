import useSchoolStore from '../../store/schoolStore';

// Small toggle button placed beside plain-text Heading inputs (which have no rich-text
// toolbar of their own) so admins can mark that heading to render in italic on the public site.
const ItalicToggle = ({ active, onToggle }) => {
    const { tc } = useSchoolStore();
    return (
        <button
            type="button"
            onClick={onToggle}
            title={active ? 'Remove italic' : 'Make italic'}
            style={{
                width: '38px', height: '38px', borderRadius: '8px', cursor: 'pointer', flexShrink: 0,
                border: active ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0',
                background: active ? tc.light : '#ffffff',
                color: active ? tc.primary : '#64748b',
                fontStyle: 'italic', fontWeight: 700, fontSize: '15px', fontFamily: 'Georgia, serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
            }}
        >
            I
        </button>
    );
};

export default ItalicToggle;
