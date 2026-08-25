import { useEffect, useState } from 'react';
import { getStorageUsageApi } from '../../api/school.api';
import { getModuleByKey } from '../../config/moduleRegistry';
import useSchoolStore from '../../store/schoolStore';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const formatBytes = (bytes) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
};

const BREAKDOWN_COLORS = ['#4169E1', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777', '#65a30d'];

const StorageUsageBar = () => {
    const { tc } = useSchoolStore();
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getStorageUsageApi()
            .then((res) => setUsage(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading || !usage || usage.limitBytes === 0) return null;

    const isNearLimit = usage.percent >= 85;

    return (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Storage Used</p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: isNearLimit ? '#dc2626' : '#0f172a' }}>
                    {formatBytes(usage.usedBytes)} of {formatBytes(usage.limitBytes)} ({usage.percent}%)
                </p>
            </div>

            {/* Overall bar */}
            <div style={{ height: '10px', borderRadius: '999px', background: '#f1f5f9', overflow: 'hidden', marginBottom: usage.breakdown.length > 0 ? '16px' : 0 }}>
                <div style={{
                    height: '100%', width: `${usage.percent}%`, borderRadius: '999px',
                    background: isNearLimit ? 'linear-gradient(90deg, #f59e0b, #dc2626)' : `linear-gradient(90deg, ${tc.primary}, ${tc.secondary})`,
                    transition: 'width 0.4s ease',
                }} />
            </div>

            {/* Per-module breakdown */}
            {usage.breakdown.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {usage.breakdown.map((row, i) => {
                        const mod = getModuleByKey(row.moduleKey);
                        const label = mod?.label || (row.moduleKey === 'other' ? 'General / School Assets' : row.moduleKey);
                        const color = BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length];
                        return (
                            <div key={row.moduleKey} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                                <span style={{ fontSize: '12.5px', color: '#334155', flex: 1 }}>{label}</span>
                                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>{formatBytes(row.bytes)} · {row.percent}%</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StorageUsageBar;
