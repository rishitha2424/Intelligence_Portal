import React from 'react';
import { SampleDataBadge } from '../utils/dataProvenance';

export default function CompetitorsTable({ competitorData }) {
  if (!competitorData || competitorData.length === 0) return null;

  const getBadgeStyle = (cat) => {
    switch (cat.toLowerCase()) {
      case 'direct competitor':
        return {
          background: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--red)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          fontSize: '9px',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '20px'
        };
      case 'acquired by mobileum':
        return {
          background: 'rgba(16, 185, 129, 0.1)',
          color: 'var(--green)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          fontSize: '9px',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '20px'
        };
      default:
        return {
          background: 'rgba(59, 130, 246, 0.1)',
          color: 'var(--blue-light)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          fontSize: '9px',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '20px'
        };
    }
  };

  return (
    <div className="section competitors-section" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
        <div className="section-title" style={{ marginBottom: '16px' }}>
          Competitor Analysis Table<span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--yellow)', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', padding: '2px 7px', borderRadius: '20px', marginLeft: '8px' }}>⚠ Illustrative sample — not real figures</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="op-table competitors-table" style={{ width: '100%' }}>
            <thead>
            <tr>
              <th style={{ width: '150px' }}>Competitor</th>
              <th style={{ width: '140px' }}>Relationship</th>
              <th>Key Product Role / Info</th>
              <th>Mobileum Edge</th>
            </tr>
          </thead>
          <tbody>
            {competitorData.map((comp) => (
              <tr key={comp.name}>
                <td style={{ padding: '10px 8px', fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {comp.name}
                </td>
                <td style={{ padding: '10px 8px', fontSize: '11px' }}>
                  <span style={getBadgeStyle(comp.category)}>
                    {comp.category}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {comp.key_offerings}
                </td>
                <td style={{ padding: '10px 8px', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {comp.versus_mobileum}
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
