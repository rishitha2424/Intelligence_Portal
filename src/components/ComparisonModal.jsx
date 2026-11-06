import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import CountryFlag from './CountryFlag';

export default function ComparisonModal({
  isOpen,
  onClose,
  compareList,
  setCompareList,
  countries,
  getFlagEmoji
}) {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isOpen || compareList.length < 2 || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    const selectedCountries = compareList.map(name => ({
      name,
      data: countries[name]
    })).filter(x => x.data);

    const dims = ['roaming_opportunity', 'fraud_risk', 'fiveG_upsell', 'arpu_pressure', 'subscriber_growth', 'regulatory_risk'];
    const clrs = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const isDark = document.documentElement.classList.contains('dark-theme');
    const labelColor = isDark ? '#8ba3c7' : '#475569';
    const gridColor = isDark ? '#1e3054' : '#cbd5e1';
    const tooltipBg = isDark ? 'rgba(13,22,40,0.95)' : 'rgba(255,255,255,0.95)';
    const tooltipBorder = isDark ? '#1e3054' : '#cbd5e1';
    const tooltipText = isDark ? '#8ba3c7' : '#475569';
    const tooltipTitle = isDark ? '#f0f4ff' : '#0f172a';

    chartRef.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Roaming', 'Fraud', '5G', 'ARPU Pres.', 'Sub Growth', 'Regulatory'],
        datasets: selectedCountries.map((c, i) => ({
          label: c.name,
          data: dims.map(d => c.data.radar?.[d] || 3),
          backgroundColor: clrs[i] + '22',
          borderColor: clrs[i],
          borderWidth: 2,
          pointRadius: 3,
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: labelColor,
              font: { size: 10 },
              boxWidth: 8
            }
          },
          tooltip: {
            backgroundColor: tooltipBg,
            borderColor: tooltipBorder,
            borderWidth: 1,
            titleColor: tooltipTitle,
            bodyColor: tooltipText,
            cornerRadius: 6,
            padding: 8,
            titleFont: { size: 11, family: 'Inter' },
            bodyFont: { size: 10, family: 'Inter' }
          }
        },
        scales: {
          r: {
            min: 0,
            max: 5,
            grid: { color: gridColor },
            ticks: { display: false },
            pointLabels: {
              color: labelColor,
              font: { size: 9 }
            },
            angleLines: { color: gridColor }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [isOpen, compareList, countries]);

  if (!isOpen) return null;

  const toggleCompare = (name) => {
    if (compareList.includes(name)) {
      setCompareList(prev => prev.filter(c => c !== name));
    } else if (compareList.length < 3) {
      setCompareList(prev => [...prev, name]);
    }
  };

  const removeCompare = (name) => {
    setCompareList(prev => prev.filter(c => c !== name));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const countryList = Object.keys(countries).sort();
  const selectedCountriesData = compareList.map(name => ({
    name,
    data: countries[name]
  })).filter(x => x.data);

  const metrics = [
    { label: 'Population (M)', key: v => v.population_mln?.toFixed(0) || '—' },
    { label: 'Mobile Users (M)', key: v => v.mobile_users_mln?.toFixed(0) || '—' },
    { label: 'Penetration %', key: v => v.mobile_penetration_pct?.toFixed(0) || '—' },
    { label: 'GDP Growth %', key: v => v.gdp_growth_pct?.toFixed(1) || '—' },
    { label: 'GDP per Capita', key: v => v.gdp_per_capita_usd ? '$' + v.gdp_per_capita_usd.toLocaleString() : '—' },
    { label: 'Avg Age', key: v => v.avg_age?.toFixed(1) || '—' },
    { label: 'Internet %', key: v => v.internet_users_pct?.toFixed(0) || '—' },
    { label: '5G Avg %', key: v => v.stats?.avg_5g?.toFixed(0) || '—' },
    { label: 'Roaming Intensity', key: v => (v.stats?.roaming_intensity || 0).toFixed(1) + '/5' },
    { label: 'Fraud Score', key: v => (v.stats?.fraud_score || 0).toFixed(1) + '/5' },
    { label: '# Operators', key: v => v.num_operators },
    { label: 'Cluster', key: v => v.cluster_name },
    { label: 'Top Mobileum Product', key: v => v.top_product?.product || '—' },
    { label: 'Top Product Score', key: v => v.top_product?.score ? v.top_product.score + '/100' : '—' },
  ];

  const colW = `${Math.floor(80 / selectedCountriesData.length)}%`;

  return (
    <div id="modal-overlay" onClick={(e) => e.target.id === 'modal-overlay' && onClose()}>
      <div id="modal">
        <div id="modal-header">
          <div id="modal-title">
            {compareList.length >= 2
              ? `Comparing: ${compareList.join(' vs ')}`
              : 'Select Countries to Compare'}
          </div>
          <button id="modal-close" onClick={onClose}>✕</button>
        </div>
        <div id="modal-body">
          {compareList.length < 2 ? (
            <>
              <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Select 2-3 countries to compare side by side. Click a country to add it.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '300px', overflowY: 'auto', padding: '4px' }}>
                {countryList.map(c => {
                  const selected = compareList.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => toggleCompare(c)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        border: '1px solid var(--border)',
                        background: selected ? 'var(--blue)' : 'var(--bg-card2)',
                        color: selected ? '#fff' : 'var(--text-secondary)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <CountryFlag iso={countries[c]?.iso} country={c} size="small" />
                        <span>{c}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px' }}>
                <table className="op-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '20%' }}>
                        Metric
                      </th>
                      {selectedCountriesData.map(c => (
                        <th
                          key={c.name}
                          style={{
                            textAlign: 'center',
                            width: colW,
                            color: 'var(--text-primary)'
                          }}
                        >
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <CountryFlag iso={c.data?.iso} country={c.name} size="small" />
                            <span>{c.name}</span>
                          </div>
                          <div style={{ fontSize: '9px', fontWeight: '400', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {c.data.region}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m, idx) => (
                      <tr key={idx}>
                        <td style={{
                          padding: '8px 10px',
                          color: 'var(--text-secondary)',
                          fontSize: '10px',
                          borderBottom: '1px solid var(--border)',
                          fontWeight: '500'
                        }}>
                          {m.label}
                        </td>
                        {selectedCountriesData.map(c => (
                          <td
                            key={c.name}
                            style={{
                              padding: '8px 10px',
                              textAlign: 'center',
                              borderBottom: '1px solid var(--border)',
                              fontWeight: '500',
                              color: 'var(--text-primary)'
                            }}
                          >
                            {m.key(c.data)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <div style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '.5px',
                  marginBottom: '10px'
                }}>
                  Impact Dimensions Comparison
                </div>
                <div style={{ height: '260px' }}>
                  <canvas ref={canvasRef}></canvas>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={clearCompare}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Clear Comparison
                </button>
                <button
                  onClick={() => setCompareList([])}
                  style={{
                    background: 'var(--blue)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Select Different Countries
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
