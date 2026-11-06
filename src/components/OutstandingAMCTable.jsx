import React from 'react';
import { SampleDataBadge } from '../utils/dataProvenance';

export default function OutstandingAMCTable({ amcData, isLoading }) {
  if (isLoading) {
    return (
      <div className="section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading financial metrics...</span>
      </div>
    );
  }

  if (!amcData || amcData.length === 0) return null;

  return (
    <div className="section outstanding-amc-section" style={{ marginTop: '12px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
        <div className="section-title" style={{ marginBottom: '16px' }}>
          Outstanding AMC Table 
          {amcData.some(a => a.contract_id.startsWith('AMC-SKYGENI')) ? 
             <span style={{ fontSize: '9px', fontWeight: 700, color: '#059669', background: '#d1fae5', border: '1px solid #34d399', padding: '2px 7px', borderRadius: '20px', marginLeft: '8px' }}>✓ SOURCED DATA (SkyGeni)</span>
             : <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--yellow)', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', padding: '2px 7px', borderRadius: '20px', marginLeft: '8px' }}>⚠ Illustrative sample — not real figures</span>
          }
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="op-table amc-table" style={{ width: '100%' }}>
            <thead>
            <tr>
              <th>Contract ID</th>
              <th>Business Unit</th>
              <th>Operator / Client</th>
              <th style={{ textAlign: 'right' }}>AMC Value (USD)</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {amcData.map((row) => (
              <tr key={row.contract_id}>
                <td style={{ padding: '10px 8px', fontSize: '11px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-muted)' }}>
                  {row.contract_id}
                </td>
                <td style={{ padding: '10px 8px', fontSize: '11px' }}>
                  <span className="cluster-tag" style={{ background: 'var(--bg-card2)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                    {row.business_unit}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {row.client_name}
                </td>
                <td style={{ padding: '10px 8px', fontSize: '12px', fontWeight: '700', color: 'var(--green)', textAlign: 'right' }}>
                  ${row.outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '10px 8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {row.due_date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
