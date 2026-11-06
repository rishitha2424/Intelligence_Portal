import React, { useState, useEffect } from 'react';
import { fetchAccounts, fetchProductGroups } from '../utils/healthApi';
import { SourceDataBadge } from '../utils/dataProvenance';

export default function AccountExplorer({ dataStatus }) {
    const [accounts, setAccounts] = useState([]);
    const [pgs, setPgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [filterRegion, setFilterRegion] = useState('');
    const [filterCountry, setFilterCountry] = useState('');
    const [filterSearch, setFilterSearch] = useState('');
    const [selectedAccount, setSelectedAccount] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true); setError(null);
                const [a, p] = await Promise.all([fetchAccounts(), fetchProductGroups()]);
                setAccounts(a); setPgs(p);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filtered = accounts.filter(a => {
        if (filterRegion && a.region !== filterRegion) return false;
        if (filterCountry && a.country !== filterCountry) return false;
        if (filterSearch && !a.account_name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
        return true;
    });

    const regions = Array.from(new Set(accounts.map(a => a.region).filter(Boolean))).sort();
    const countries = Array.from(new Set(accounts.map(a => a.country).filter(Boolean))).sort();

    if (loading) return <div style={{padding: '20px'}}>Loading Explorer...</div>;
    if (error) return <div style={{padding: '20px', color: 'red'}}>Error: {error}</div>;

    return (
        <div style={{ padding: '20px', backgroundColor: 'var(--bg-dark, #f8fafc)', color: 'var(--text-main, #0f172a)' }}>
            <h2 style={{ marginBottom: '20px' }}>Account Explorer (SkyGeni) <SourceDataBadge dateText={dataStatus?.skygeni_updated_on} /></h2>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <select value={filterRegion} onChange={e => {setFilterRegion(e.target.value); setFilterCountry('');}} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="">All Regions</option>
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="">All Countries</option>
                    {countries.filter(c => !filterRegion || accounts.find(a => a.country === c && a.region === filterRegion)).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="text" placeholder="Search account..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '200px' }} />
                <button onClick={() => {setFilterRegion(''); setFilterCountry(''); setFilterSearch('');}} style={{ padding: '8px 12px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Clear</button>
            </div>
            
            <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 2, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                                <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Account</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Region</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Country</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Products</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Owners</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((a, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', background: selectedAccount?.account_name === a.account_name ? '#f0f9ff' : 'white' }} onClick={() => setSelectedAccount(a)}>
                                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#2563eb' }}>{a.account_name}</td>
                                    <td style={{ padding: '10px' }}>{a.region}</td>
                                    <td style={{ padding: '10px' }}>{a.country}</td>
                                    <td style={{ padding: '10px' }}>
                                        <span style={{ display: 'inline-block', background: '#e2e8f0', padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>{a.product_group_count} items</span>
                                    </td>
                                    <td style={{ padding: '10px', fontSize: '11px' }}>{a.owners.join(', ') || 'Not assigned'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div style={{ flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {selectedAccount ? (
                        <div>
                            <h3 style={{ margin: '0 0 5px 0' }}>{selectedAccount.account_name}</h3>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>{selectedAccount.country} ({selectedAccount.region})</div>
                            <h4 style={{ margin: '0 0 10px 0' }}>Products by BU</h4>
                            {selectedAccount.bus.map(bu => {
                                // Since we aggregated PGs, we might need to filter raw skygeni to map them perfectly, 
                                // but for display we can just show the list of products this account has.
                                return (
                                    <div key={bu} style={{ marginBottom: '10px' }}>
                                        <strong>{bu}</strong>
                                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                                            (See full detail in Health tab if mapped)
                                        </div>
                                    </div>
                                );
                            })}
                            <div style={{ marginTop: '15px', fontSize: '12px' }}>
                                <strong>All Products:</strong> {selectedAccount.product_groups.join(', ')}
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: '#64748b', textAlign: 'center', marginTop: '50px' }}>Select an account to view details</div>
                    )}
                </div>
            </div>
            
            <div style={{ marginTop: '20px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                Files: health.xlsx, mapping.xlsx, skygeni.xlsx | SkyGeni {dataStatus?.skygeni_updated_on} | Mode: {dataStatus?.mode}
            </div>
        </div>
    );
}
