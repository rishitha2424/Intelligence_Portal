import React, { useState, useEffect } from 'react';
import { fetchHealthData } from '../utils/healthApi';
import { SourceDataBadge } from '../utils/dataProvenance';
import Chart from 'chart.js/auto';

const STATUS_COLORS = {
    'Green': '#059669',
    'Amber': '#D97706',
    'Red': '#DC2626'
};

export default function HealthOverview({ dataStatus, onCustomerClick }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterSearch, setFilterSearch] = useState('');
    const [sortKey, setSortKey] = useState('health');
    const [sortAsc, setSortAsc] = useState(true);
    
    const [compareList, setCompareList] = useState([]);

    const loadData = async () => {
        try {
            setLoading(true); setError(null);
            const d = await fetchHealthData();
            setData(d || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);
    
    useEffect(() => {
        if (!loading && data.length > 0) {
            // Render charts
            const ctx1 = document.getElementById('statusChart');
            const ctx2 = document.getElementById('avgChart');
            
            if (window.statusChartInst) window.statusChartInst.destroy();
            if (window.avgChartInst) window.avgChartInst.destroy();
            
            const green = data.filter(d => d.status === 'Green').length;
            const amber = data.filter(d => d.status === 'Amber').length;
            const red = data.filter(d => d.status === 'Red').length;
            
            if (ctx1) {
                window.statusChartInst = new Chart(ctx1, {
                    type: 'doughnut',
                    data: {
                        labels: ['Green', 'Amber', 'Red'],
                        datasets: [{ data: [green, amber, red], backgroundColor: [STATUS_COLORS['Green'], STATUS_COLORS['Amber'], STATUS_COLORS['Red']] }]
                    },
                    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
                });
            }
            
            if (ctx2) {
                const avgBeh = data.reduce((sum, d) => sum + (parseFloat(d.behavioral) || 0), 0) / data.length;
                const avgFin = data.reduce((sum, d) => sum + (parseFloat(d.financial) || 0), 0) / data.length;
                const avgSen = data.reduce((sum, d) => sum + (parseFloat(d.sentiment) || 0), 0) / data.length;
                
                window.avgChartInst = new Chart(ctx2, {
                    type: 'bar',
                    data: {
                        labels: ['Behavioral', 'Financial', 'Sentiment'],
                        datasets: [{ label: 'Average Score', data: [avgBeh, avgFin, avgSen], backgroundColor: '#3b82f6' }]
                    },
                    options: { maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }
                });
            }
        }
    }, [data, loading]);

    const filteredData = data.filter(d => {
        if (filterStatus !== 'All' && d.status !== filterStatus) return false;
        if (filterSearch && !d.customer_name.toLowerCase().includes(filterSearch.toLowerCase()) && !(d.country || '').toLowerCase().includes(filterSearch.toLowerCase())) return false;
        return true;
    }).sort((a, b) => {
        let valA = a[sortKey]; let valB = b[sortKey];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
    });

    const exportCSV = () => {
        const rows = [['Customer', 'Country', 'Health', 'Behavioral', 'Financial', 'Sentiment', 'CSAT', 'Status', 'Revenue']];
        filteredData.forEach(d => {
            rows.push([d.customer_name, d.country, d.health, d.behavioral, d.financial, d.sentiment, d.csat_color, d.status, d.revenue].map(v => `"${v || ''}"`));
        });
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'health_export.csv'; a.click();
    };

    if (loading) return <div style={{padding: '20px'}}>Loading Customer Health...</div>;
    if (error) return <div style={{padding: '20px', color: 'red'}}>Error: {error} <button onClick={loadData}>Retry</button></div>;
    if (!data.length) return <div style={{padding: '20px'}}>No data available.</div>;

    const needsAttention = [...data].sort((a, b) => (a.health || 0) - (b.health || 0)).slice(0, 5);

    return (
        <div style={{ padding: '20px', backgroundColor: 'var(--bg-dark, #f8fafc)', color: 'var(--text-main, #0f172a)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Customer Health Overview <SourceDataBadge dateText={dataStatus?.skygeni_updated_on} /></h2>
                <button onClick={exportCSV} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Export CSV</button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {['All', 'Green', 'Amber', 'Red'].map(s => (
                    <div key={s} onClick={() => setFilterStatus(s)} style={{ flex: 1, padding: '15px', background: 'white', borderRadius: '8px', border: filterStatus === s ? '2px solid #2563eb' : '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{s === 'All' ? 'Total Customers' : s + ' Health'}</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: s === 'All' ? '#0f172a' : STATUS_COLORS[s] }}>
                            {s === 'All' ? data.length : data.filter(d => d.status === s).length}
                        </div>
                    </div>
                ))}
            </div>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', height: '300px' }}>
                <div style={{ flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>Status Distribution</h4>
                    <div style={{ height: '240px' }}><canvas id="statusChart"></canvas></div>
                </div>
                <div style={{ flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>Average Scores</h4>
                    <div style={{ height: '240px' }}><canvas id="avgChart"></canvas></div>
                </div>
                <div style={{ flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', overflowY: 'auto' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: STATUS_COLORS['Red'] }}>Needs Attention (Lowest 5)</h4>
                    {needsAttention.map((c, i) => (
                        <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={() => onCustomerClick(c.customer_name)}>
                            <div style={{ fontWeight: 'bold' }}>{c.customer_name} <span style={{ float: 'right', color: STATUS_COLORS[c.status] }}>{c.health}</span></div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{c.country}</div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <input type="text" placeholder="Search customer or country..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} style={{ padding: '8px', width: '300px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    {compareList.length > 0 && <button style={{ padding: '8px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Compare ({compareList.length})</button>}
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                            <th></th>
                            {['Customer', 'Country', 'Health', 'Behavioral', 'Financial', 'Sentiment', 'CSAT', 'Status', 'Revenue'].map(h => (
                                <th key={h} style={{ padding: '10px', cursor: 'pointer', borderBottom: '2px solid #e2e8f0' }} onClick={() => { setSortKey(h.toLowerCase()); setSortAsc(!sortAsc); }}>
                                    {h} {sortKey === h.toLowerCase() ? (sortAsc ? '↑' : '↓') : ''}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((d, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '10px' }}><input type="checkbox" checked={compareList.includes(d.customer_name)} onChange={e => {
                                    if (e.target.checked && compareList.length < 3) setCompareList([...compareList, d.customer_name]);
                                    else setCompareList(compareList.filter(c => c !== d.customer_name));
                                }} /></td>
                                <td style={{ padding: '10px', fontWeight: 'bold', color: '#2563eb', cursor: 'pointer' }} onClick={() => onCustomerClick(d.customer_name)}>{d.customer_name}</td>
                                <td style={{ padding: '10px' }}>{d.country || 'n/a'}</td>
                                <td style={{ padding: '10px', fontWeight: 'bold' }}>{d.health || 'n/a'}</td>
                                <td style={{ padding: '10px' }}>{d.behavioral || 'n/a'}</td>
                                <td style={{ padding: '10px' }}>{d.financial || 'n/a'}</td>
                                <td style={{ padding: '10px' }}>{d.sentiment || 'n/a'}</td>
                                <td style={{ padding: '10px', color: d.csat_color ? STATUS_COLORS[d.csat_color] : 'inherit', fontWeight: 'bold' }}>{d.csat_color || 'n/a'}</td>
                                <td style={{ padding: '10px', color: STATUS_COLORS[d.status] || 'inherit', fontWeight: 'bold' }}>{d.status || 'n/a'}</td>
                                <td style={{ padding: '10px' }}>{d.revenue || 'n/a'}</td>
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
