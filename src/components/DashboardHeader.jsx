import React from 'react';
import CountryFlag from './CountryFlag';
import { getKamByCountry } from '../data/kamData';

/**
 * DashboardHeader - Shared reusable header component for Country & Operator views.
 * Ensures consistent left-aligned structure across all operator pages and country views:
 * Row 1: Back Button inline with Breadcrumbs (Global / [Country] / [Operator])
 * Row 2: Page Title (Globe icon + [Operator Name] Operator Details)
 * Row 3: Subtitle text
 * Followed by a horizontal divider line.
 */
export default function DashboardHeader({
  selectedCountry,
  selectedOperator,
  countryData,
  activeRegion = 'all',
  isScrolled = false,
  getFlagEmoji,
  setSelectedCountry,
  setSelectedOperator,
  onExportReport,
  onExportPPT,
  onCloseOverview
}) {
  return (
    <div id="panel-header-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Container with top-right action controls overlay */}
      <div style={{ position: 'relative', width: '100%' }}>

        {/* 1. TOP ROW — Far left corner: Back Button inline with Breadcrumb Trail */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
          
          {/* Back Button */}
          {selectedCountry ? (
            <button
              onClick={() => {
                if (selectedOperator) {
                  if (setSelectedOperator) setSelectedOperator(null);
                } else {
                  if (setSelectedCountry) setSelectedCountry(null);
                }
              }}
              style={{
                background: 'var(--bg-card2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '10px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-card3)'; e.currentTarget.style.borderColor = 'var(--blue)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-card2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              {selectedOperator ? `← Back to ${selectedCountry}` : '← Back to Global Map'}
            </button>
          ) : (
            <button
              onClick={() => {
                if (onCloseOverview) onCloseOverview();
              }}
              style={{
                background: 'var(--bg-card2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '10px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-card2)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              ✖ Close Overview
            </button>
          )}

          {/* Breadcrumb Trail: Global / [Country] / [Operator] */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <span
              onClick={() => {
                if (setSelectedCountry) setSelectedCountry(null);
                if (setSelectedOperator) setSelectedOperator(null);
              }}
              style={{ color: 'var(--blue)', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
              title="Return to Global view"
            >
              {activeRegion === 'all' ? 'Global' : activeRegion}
            </span>

            {selectedCountry && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                {selectedOperator ? (
                  <span
                    onClick={() => {
                      if (setSelectedOperator) setSelectedOperator(null);
                    }}
                    style={{ color: 'var(--blue)', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                    title={`Back to ${selectedCountry} overview`}
                  >
                    {selectedCountry}
                  </span>
                ) : (
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{selectedCountry}</span>
                )}
              </>
            )}

            {selectedOperator && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{selectedOperator}</span>
              </>
            )}
          </div>
        </div>

        {/* 2. ROW 2 — Page Title: Globe icon + [Operator Name] Operator Details */}
        <div
          id="panel-title"
          className="panel-title-text"
          style={{
            fontSize: '20px',
            fontWeight: '800',
            color: 'var(--text-primary)',
            marginTop: '4px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {selectedCountry && countryData?.iso && (
            <CountryFlag iso={countryData.iso} country={selectedCountry} size="large" />
          )}
          {selectedOperator ? (
            <>{selectedOperator} Operator Details</>
          ) : selectedCountry ? (
            <>{selectedCountry} Market Intelligence</>
          ) : (
            <>🌍 {activeRegion === 'all' ? 'Global Overview' : `${activeRegion} Regional Overview`}</>
          )}
        </div>

        {/* 3. ROW 3 — Subtitle (Permanently visible to prevent layout shift) */}
        <div
          id="panel-subtitle"
          className="panel-subtitle-text"
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginTop: '4px',
            textAlign: 'left'
          }}
        >
          {selectedOperator
            ? `Active operator profile, performance benchmarks, and financial analytics for ${selectedOperator}.`
            : selectedCountry
              ? 'Active intelligence, operator benchmarks, support service levels, and competitor analytics.'
              : 'Aggregated regional telecom statistics, operator distributions, and market benchmarks.'
          }
        </div>

        {selectedCountry && (
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--blue)', marginTop: '2px', textAlign: 'left' }}>
            KAM: {getKamByCountry(selectedCountry)}
          </div>
        )}

        {/* Top-Right Action Controls (Clear Filter & Export Report / Export PPT) */}
        <div style={{ position: 'absolute', right: 0, top: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          {selectedOperator && (
            <button
              onClick={() => setSelectedOperator(null)}
              style={{
                background: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid var(--blue)',
                color: 'var(--blue)',
                borderRadius: '6px',
                padding: '3px 10px',
                fontSize: '10px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              title="Clear operator selection filter"
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--blue)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)';
                e.currentTarget.style.color = 'var(--blue)';
              }}
            >
              <span>Clear Filter ({selectedOperator})</span>
              <span style={{ fontWeight: 'bold' }}>✕</span>
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onExportReport && selectedCountry && (
              <button
                onClick={onExportReport}
                style={{
                  background: 'var(--blue)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                title="Export Report as PDF"
              >
                ↓ Export Report
              </button>
            )}
            {onExportPPT && selectedCountry && (
              <button
                onClick={onExportPPT}
                style={{
                  background: 'var(--blue)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                title="Export Report as PowerPoint Presentation (.pptx)"
              >
                ↓ Export as PPT
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal divider line separating header from content underneath */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0 6px 0', width: '100%' }} />
    </div>
  );
}
