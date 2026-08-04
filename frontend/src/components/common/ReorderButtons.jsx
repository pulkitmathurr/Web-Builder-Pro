// Small up/down control for manually ordering items in an admin list — used everywhere
// a newly-added card is prepended and the admin needs to choose the final display order.
const ReorderButtons = ({ index, length, onMove, vertical = true }) => {
    const btnStyle = (disabled) => ({
        width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #e2e8f0',
        background: disabled ? '#f8fafc' : '#ffffff', color: disabled ? '#cbd5e1' : '#64748b',
        cursor: disabled ? 'default' : 'pointer', fontSize: '11px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1,
    });

    return (
        <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: '4px', flexShrink: 0 }}>
            <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} title="Move up" style={btnStyle(index === 0)}>▲</button>
            <button type="button" onClick={() => onMove(index, 1)} disabled={index === length - 1} title="Move down" style={btnStyle(index === length - 1)}>▼</button>
        </div>
    );
};

export default ReorderButtons;
