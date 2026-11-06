import React, { useState, useEffect } from 'react';
import { fetchHealthDetail, fetchCustomerNames, fetchWhiteSpace } from '../utils/healthApi';
import { SourceDataBadge } from '../utils/dataProvenance';

const STATUS_COLORS = { 'Green': '#059669', 'Amber': '#D97706', 'Red': '#DC2626' };

export default function HealthDetail({ customerName, onBack, dataStatus }) {
    const [detail, setDetail] = useState(null);
    const [names, setNames] = useState([]);
    const [ws, setWs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true); setError(null);
                const [d, n, w] = await Promise.all([
                    fetchHealthDetail(customerName),
                    fetchCustomerNames(customerName),
                    fetchWhiteSpace(customerName)
                ]);
                setDetail(d); setNames(n); setWs(w);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [customerName]);

    if (loading) return <div style={{padding: '20px'}}>Loading Details...</div>;
    if (error) return <div style={{padding: '20px', color: 'red'}}>Error: {error}</div>;
    if (!detail) return null;

    const { summary, business_units, reasons } = detail;
    const { business_units: wsBus, peer_suggestions } = ws || {};

    return (
        <div style={{ padding: '20px', backgroundColor: 'var(--bg-dark, #f8fafc)', color: 'var(--text-main, #0f172a)' }}>
            <button onClick={onBack} style={{ marginBottom: '15px', padding: '6px 12px', background: '#cbd5e1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>← Back to Overview</button>
            
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ margin: '0 0 5px 0' }}>{summary.customer_name} <SourceDataBadge dateText={dataStatus?.skygeni_updated_on} /></h2>
                    <div style={{ color: '#64748b' }}>{summary.country} | Group: {summary.group || 'n/a'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: STATUS_COLORS[summary.status] }}>{summary.health} <span style={{fontSize: '16px'}}>({summary.status})</span></div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>CSAT: <strong style={{ color: STATUS_COLORS[summary.csat_color] }}>{summary.csat_color || 'n/a'}</strong> | Revenue: {summary.revenue}</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>Health Composition</h4>
                    <div style={{ marginBottom: '10px' }}>Behavioral (37%): <strong style={{ color: summary.behavioral < 50 ? STATUS_COLORS['Red'] : STATUS_COLORS['Green'] }}>{summary.behavioral || 'n/a'}</strong></div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '15px' }}>
                        <div style={{ width: `${summary.behavioral || 0}%`, height: '100%', background: '#3b82f6' }}></div>
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>Financial (25%): <strong style={{ color: summary.financial < 50 ? STATUS_COLORS['Red'] : STATUS_COLORS['Green'] }}>{summary.financial || 'n/a'}</strong></div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '15px' }}>
                        <div style={{ width: `${summary.financial || 0}%`, height: '100%', background: '#10b981' }}></div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>Sentiment (38%): <strong style={{ color: summary.sentiment < 50 ? STATUS_COLORS['Red'] : STATUS_COLORS['Green'] }}>{summary.sentiment || 'n/a'}</strong></div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${summary.sentiment || 0}%`, height: '100%', background: '#8b5cf6' }}></div>
                    </div>
                </div>

                <div style={{ flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: STATUS_COLORS['Red'] }}>Why is this score low? (Top Reasons)</h4>
                    {reasons && reasons.length > 0 ? (
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            {reasons.map((r, i) => <li key={i} style={{ marginBottom: '8px', fontSize: '13px' }}>{r}</li>)}
                        </ul>
                    ) : (
                        <div style={{ fontSize: '13px', color: '#64748b' }}>Score is healthy or missing data.</div>
                    )}
                </div>
            </div>

            <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', overflowX: 'auto' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Business Unit KPI Heatmap</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                            <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Business Unit</th>
                            <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Health</th>
                            <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Behavioral</th>
                            <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Financial</th>
                            <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Sentiment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {business_units && business_units.map((bu, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>{bu.bu_name_or_count}</td>
                                <td style={{ padding: '8px', color: STATUS_COLORS[bu.status], fontWeight: 'bold' }}>{bu.health || 'n/a'}</td>
                                <td style={{ padding: '8px' }}>{bu.behavioral || 'n/a'}</td>
                                <td style={{ padding: '8px' }}>{bu.financial || 'n/a'}</td>
                                <td style={{ padding: '8px' }}>{bu.sentiment || 'n/a'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>Products & White Space</h4>
                    {wsBus && wsBus.map((bu, i) => (
                        <div key={i} style={{ marginBottom: '10px', fontSize: '13px' }}>
                            <strong>{bu.bu}</strong>: 
                            {bu.covered ? (
                                <span style={{ marginLeft: '8px' }}>{bu.products.join(', ')} ({bu.owners.join(', ') || 'Not assigned'})</span>
                            ) : (
                                <span style={{ marginLeft: '8px', color: STATUS_COLORS['Red'], fontWeight: 'bold' }}>Not covered</span>
                            )}
                        </div>
                    ))}
                    
                    <h5 style={{ margin: '15px 0 5px 0', color: '#2563eb' }}>Peer Suggestions (a suggestion from the data, not a forecast)</h5>
                    {peer_suggestions && peer_suggestions.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
                            {peer_suggestions.map((p, i) => (
                                <li key={i}>{p.product_group} (used by {p.peer_count} peers in region)</li>
                            ))}
                        </ul>
                    ) : <div style={{ fontSize: '12px', color: '#64748b' }}>No strong peer suggestions found.</div>}
                </div>
                
                <div style={{ flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>Also Known As (Mapped Identities)</h4>
                    {names && names.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                            {names.map((n, i) => (
                                <li key={i}><strong>{n.value}</strong> 
                                    <span style={{color: '#64748b'}}> (from {n.file_name} - {n.field})</span>
                                </li>
                            ))}
                        </ul>
                    ) : <div style={{ fontSize: '13px', color: '#64748b' }}>No mapping records found.</div>}
                </div>
            </div>

            <div style={{ marginTop: '20px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                Files: health.xlsx, mapping.xlsx, skygeni.xlsx | SkyGeni {dataStatus?.skygeni_updated_on} | Mode: {dataStatus?.mode}
            </div>
        </div>
    );
}
