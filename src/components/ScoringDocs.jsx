import React, { useState, useEffect } from 'react';
import { fetchKpiDefs } from '../utils/healthApi';
import { SourceDataBadge } from '../utils/dataProvenance';

export default function ScoringDocs({ dataStatus }) {
    const [defs, setDefs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchKpiDefs().then(d => setDefs(d)).catch(e => console.error(e)).finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{padding: '20px'}}>Loading Docs...</div>;

    return (
        <div style={{ padding: '20px', backgroundColor: 'var(--bg-dark, #f8fafc)', color: 'var(--text-main, #0f172a)' }}>
            <h2 style={{ marginBottom: '20px' }}>How Scoring Works <SourceDataBadge dateText={dataStatus?.skygeni_updated_on} /></h2>
            
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Overall Health Calculation</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    Overall health is a weighted average of three components:<br/>
                    <strong>Behavioral (37%) + Financial (25%) + Sentiment (38%)</strong>
                </p>
                <div style={{ marginTop: '15px', padding: '10px', background: '#f8fafc', borderLeft: '4px solid #2563eb' }}>
                    <strong>Note:</strong> NPS and Customer Escalations currently have <strong>no data</strong> available, but are factored into the future scoring model.
                </div>
            </div>
            
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Status Thresholds</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6' }}>
                    <li><strong style={{ color: '#059669' }}>Green</strong>: Score &gt;= 80</li>
                    <li><strong style={{ color: '#D97706' }}>Amber</strong>: Score 50 to 79</li>
                    <li><strong style={{ color: '#DC2626' }}>Red</strong>: Score &lt; 50</li>
                </ul>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>KPI Definitions & Weights</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Category</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>KPI Name</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Weight</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Rule</th>
                        </tr>
                    </thead>
                    <tbody>
                        {defs.map((d, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '10px', fontWeight: 'bold' }}>{d.part}</td>
                                <td style={{ padding: '10px' }}>{d.kpi_name}</td>
                                <td style={{ padding: '10px' }}>{d.weight}</td>
                                <td style={{ padding: '10px', color: '#475569' }}>{d.rule}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div style={{ marginTop: '20px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                Files: health.xlsx, mapping.xlsx, skygeni.xlsx | SkyGeni {dataStatus?.skygeni_updated_on} | Mode: {dataStatus?.mode}
            </div>
        </div>
    );
}
