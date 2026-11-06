import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import CountryFlag from './CountryFlag';
import { fetchHealthData } from '../utils/healthApi';

const CLUSTER_COLORS = {
  'Ultra-Premium Roaming Hub': '#9B59B6',
  'Mature Mid-Tier': '#4A90D9',
  'High Growth Corridor': '#F39C12',
  'Emerging Mid-Tier': '#1ABC9C',
  'Small Wealthy Market': '#2ECC71',
  'Frontier Market': '#E74C3C',
  'Regulatory Transition': '#7F8C8D',
  'Mature & Saturated': '#9B59B6',
  'High Growth Exposed': '#F39C12',
  'Roaming Hub': '#1ABC9C',
  'Emerging Opportunity': '#2ECC71',
  'Unknown': '#7F8C8D'
};

export default function SidePanel({
  selectedCountry,
  countryData,
  onClose,
  allCountries,
  metadata,
  getFlagEmoji,
  theme
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [globalHealthData, setGlobalHealthData] = useState(null);
  const chartRefs = useRef({});

  useEffect(() => {
    fetchHealthData().then(data => setGlobalHealthData(data)).catch(e => console.error("SidePanel health fetch failed", e));
  }, []);

  // Reset tab on country change
  useEffect(() => {
    setActiveTab('overview');
  }, [selectedCountry]);

  // Handle Chart rendering when activeTab or selectedCountry changes
  useEffect(() => {
    if (!selectedCountry || !countryData) return;

    // Destroy existing charts
    Object.keys(chartRefs.current).forEach(key => {
      if (chartRefs.current[key]) {
        chartRefs.current[key].destroy();
        chartRefs.current[key] = null;
      }
    });

    const isDark = document.documentElement.classList.contains('dark-theme');
    const labelColor = isDark ? '#8ba3c7' : '#475569';
    const gridColor = isDark ? '#1e3054' : '#cbd5e1';
    const tooltipBg = isDark ? 'rgba(13,22,40,0.95)' : 'rgba(255,255,255,0.95)';
    const tooltipBorder = isDark ? '#1e3054' : '#cbd5e1';
    const tooltipText = isDark ? '#8ba3c7' : '#475569';
    const tooltipTitle = isDark ? '#f0f4ff' : '#0f172a';

    const axisStyle = () => ({
      grid: { color: gridColor },
      ticks: { color: labelColor, font: { size: 9 } },
      border: { color: gridColor }
    });

    const tooltipStyle = () => ({
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      titleColor: tooltipTitle,
      bodyColor: tooltipText,
      cornerRadius: 6,
      padding: 8,
      titleFont: { size: 11, family: 'Inter' },
      bodyFont: { size: 10, family: 'Inter' }
    });

    // ─── OVERVIEW TAB CHARTS ───
    if (activeTab === 'overview') {
      const canvas = document.getElementById('overview_radar');
      if (canvas && countryData.radar) {
        const ctx = canvas.getContext('2d');
        const r = countryData.radar;
        chartRefs.current['overview_radar'] = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['Roaming Opp.', 'Fraud Risk', '5G Upsell', 'ARPU Pressure', 'Sub Growth', 'Regulatory'],
            datasets: [{
              label: selectedCountry,
              data: [r.roaming_opportunity, r.fraud_risk, r.fiveG_upsell, r.arpu_pressure, r.subscriber_growth, r.regulatory_risk],
              backgroundColor: 'rgba(59,130,246,0.2)',
              borderColor: '#3b82f6',
              borderWidth: 2,
              pointBackgroundColor: '#3b82f6',
              pointRadius: 3,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: labelColor, font: { size: 9 }, boxWidth: 8 } },
              tooltip: tooltipStyle()
            },
            scales: {
              r: {
                min: 0,
                max: 5,
                grid: { color: gridColor },
                ticks: { display: false, stepSize: 1 },
                pointLabels: { color: labelColor, font: { size: 9 } },
                angleLines: { color: gridColor }
              }
            }
          }
        });
      }
    }

    // ─── OPERATORS TAB CHARTS ───
    if (activeTab === 'operators') {
      const ops = countryData.operators.filter(o => o.market_share_pct);
      const doughnutCanvas = document.getElementById('operators_doughnut');
      if (doughnutCanvas && ops.length) {
        const ctx = doughnutCanvas.getContext('2d');
        chartRefs.current['operators_doughnut'] = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ops.map(o => o.operator),
            datasets: [{
              data: ops.map(o => parseFloat(o.market_share_pct) || 0),
              backgroundColor: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
              borderColor: isDark ? '#0d1628' : '#ffffff',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: labelColor, font: { size: 9 }, boxWidth: 8 } },
              tooltip: tooltipStyle()
            }
          }
        });
      }

      const sOps = countryData.operators.filter(o => o.revenue_growth_score && o.sub_base_mln);
      const scatterCanvas = document.getElementById('operators_scatter');
      if (scatterCanvas && sOps.length) {
        const ctx = scatterCanvas.getContext('2d');
        chartRefs.current['operators_scatter'] = new Chart(ctx, {
          type: 'bubble',
          data: {
            datasets: sOps.map((o, i) => ({
              label: o.operator,
              data: [{
                x: parseFloat(o.market_share_pct) || 0,
                y: o.revenue_growth_score,
                r: Math.max(5, Math.min(20, (o.sub_base_mln || 1) / 30))
              }],
              backgroundColor: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 5] + '99',
              borderColor: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 5],
            }))
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: tooltipStyle()
            },
            scales: {
              x: {
                title: { display: true, text: 'Market Share %', color: labelColor, font: { size: 9 } },
                ...axisStyle()
              },
              y: {
                title: { display: true, text: 'Rev Growth Score', color: labelColor, font: { size: 9 } },
                min: 0,
                max: 6,
                ...axisStyle()
              }
            }
          }
        });
      }
    }

    // ─── IMPACT TAB CHARTS ───
    if (activeTab === 'impact') {
      const radarCanvas = document.getElementById('impact_radar');
      if (radarCanvas && countryData.radar) {
        const ctx = radarCanvas.getContext('2d');
        const r = countryData.radar;
        const regAvg = countryData.regional_averages;

        chartRefs.current['impact_radar'] = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['Roaming Opp.', 'Fraud Risk', '5G Upsell', 'ARPU Pressure', 'Sub Growth', 'Reg. Risk'],
            datasets: [
              {
                label: selectedCountry,
                data: [r.roaming_opportunity, r.fraud_risk, r.fiveG_upsell, r.arpu_pressure, r.subscriber_growth, r.regulatory_risk],
                backgroundColor: 'rgba(59,130,246,0.2)',
                borderColor: '#3b82f6',
                borderWidth: 2,
                pointBackgroundColor: '#3b82f6',
                pointRadius: 3,
              },
              {
                label: 'Regional Avg',
                data: [3, 2.6, (regAvg?.avg_5g || 31) / 20, 3, 2, 2.5],
                backgroundColor: 'rgba(16,185,129,0.1)',
                borderColor: '#10b98177',
                borderWidth: 1.5,
                pointBackgroundColor: '#10b981',
                pointRadius: 2,
                borderDash: [4, 3],
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: tooltipStyle()
            },
            scales: {
              r: {
                min: 0,
                max: 5,
                grid: { color: gridColor },
                ticks: { display: false },
                pointLabels: { color: labelColor, font: { size: 9 } },
                angleLines: { color: gridColor }
              }
            }
          }
        });
      }

      const wf = countryData.waterfall;
      const wfCanvas = document.getElementById('impact_waterfall');
      if (wfCanvas && wf) {
        const ctx = wfCanvas.getContext('2d');
        const labels = ['Baseline', 'OTT Loss', 'ARPU Comp.', 'Churn Drag', 'Roaming Up', '5G Upside', 'Net'];
        const rawVals = [wf.base, wf.ott_substitution, wf.arpu_compression, wf.churn_pressure, wf.roaming_upside, wf.fiveG_upside, wf.net];
        const colors = rawVals.map((v, i) => {
          if (i === 0 || i === labels.length - 1) return '#3b82f6';
          return v >= 0 ? '#10b981' : '#ef4444';
        });

        chartRefs.current['impact_waterfall'] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              data: rawVals.map(v => Math.abs(v)),
              backgroundColor: colors,
              borderRadius: 4,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                ...tooltipStyle(),
                callbacks: {
                  label: (context) => {
                    const val = rawVals[context.dataIndex];
                    return ` ${val >= 0 ? '+' : ''}${val}%`;
                  }
                }
              }
            },
            scales: {
              x: axisStyle(),
              y: {
                ...axisStyle(),
                title: { display: true, text: 'Revenue Index', color: labelColor, font: { size: 9 } }
              }
            }
          }
        });
      }
    }

    // ─── PRODUCTS TAB CHARTS ───
    if (activeTab === 'products') {
      const products = countryData.product_ranking || [];
      const barCanvas = document.getElementById('products_bar');
      if (barCanvas && products.length) {
        const ctx = barCanvas.getContext('2d');
        chartRefs.current['products_bar'] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: products.map(p => p.product.replace('–', '-').substring(0, 22)),
            datasets: [{
              data: products.map(p => p.score),
              backgroundColor: products.map(p =>
                p.score > 75 ? '#10b98166' : p.score > 50 ? '#f59e0b66' : '#3b82f666'),
              borderColor: products.map(p =>
                p.score > 75 ? '#10b981' : p.score > 50 ? '#f59e0b' : '#3b82f6'),
              borderWidth: 1,
              borderRadius: 4
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: tooltipStyle()
            },
            scales: {
              x: { ...axisStyle(), min: 0, max: 100, title: { display: true, text: 'Fit Score', color: labelColor, font: { size: 9 } } },
              y: {
                ...axisStyle(),
                ticks: { color: labelColor, font: { size: 9 } }
              }
            }
          }
        });
      }
    }

    // ─── STATISTICS TAB CHARTS ───
    if (activeTab === 'stats') {
      const regionPeers = Object.entries(allCountries)
        .filter(([_, cv]) => cv.region === countryData.region)
        .slice(0, 20);
      const bubbleCanvas = document.getElementById('stats_bubble');
      if (bubbleCanvas && regionPeers.length) {
        const ctx = bubbleCanvas.getContext('2d');
        chartRefs.current['stats_bubble'] = new Chart(ctx, {
          type: 'bubble',
          data: {
            datasets: regionPeers.map(([cn, cv]) => ({
              label: cn,
              data: [{
                x: cv.mobile_penetration_pct || 0,
                y: cv.gdp_growth_pct || 0,
                r: Math.max(4, Math.min(18, (cv.population_mln || 1) / 50))
              }],
              backgroundColor: cn === selectedCountry
                ? '#f59e0bcc'
                : (CLUSTER_COLORS[cv.cluster_name] || '#3b82f6') + '55',
              borderColor: cn === selectedCountry ? '#f59e0b' : 'transparent',
              borderWidth: cn === selectedCountry ? 2 : 0,
            }))
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                ...tooltipStyle(),
                callbacks: {
                  label: (context) => {
                    const d = context.raw;
                    return ` ${context.dataset.label}: Pen=${d.x}% GDP=${d.y}%`;
                  }
                }
              }
            },
            scales: {
              x: { ...axisStyle(), title: { display: true, text: 'Mobile Penetration %', color: labelColor, font: { size: 9 } } },
              y: { ...axisStyle(), title: { display: true, text: 'GDP Growth %', color: labelColor, font: { size: 9 } } }
            }
          }
        });
      }
    }

    return () => {
      Object.keys(chartRefs.current).forEach(key => {
        if (chartRefs.current[key]) {
          chartRefs.current[key].destroy();
          chartRefs.current[key] = null;
        }
      });
    };
  }, [selectedCountry, countryData, activeTab, theme]);

  if (!selectedCountry || !countryData) return <div id="panel"></div>;

  const clr = CLUSTER_COLORS[countryData.cluster_name] || '#4A90D9';

  // formatting helpers
  const fmt = (val, unit, decimals = 0) => {
    if (val === null || val === undefined) return '—';
    const n = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(n)) return '—';
    return n.toFixed(decimals) + unit;
  };

  const fmtNum = (val) => {
    if (!val) return '—';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
    return val.toFixed(0);
  };

  const trendToScore = (val) => {
    if (!val || val === 'nan') return 3;
    const v = val.toLowerCase();
    if (v.includes('very high') || v.includes('major') || v.includes('strongly')) return 5;
    if (v.includes('high') || v.includes('growing') || v.includes('up') || v.includes('increasing')) return 4;
    if (v.includes('moderate') || v.includes('stable') || v.includes('flat') || v.includes('marginal')) return 3;
    if (v.includes('low') || v.includes('declining') || v.includes('down') || v.includes('decreasing')) return 2;
    if (v.includes('very low') || v.includes('none') || v.includes('minimal')) return 1;
    return 3;
  };

  const hmColor = (score) => {
    const s = Math.max(0, Math.min(100, score || 0));
    if (s < 20) return '#ef4444';
    if (s < 40) return 'rgba(245, 158, 11, 0.15)';
    if (s < 60) return 'rgba(59, 130, 246, 0.15)';
    if (s < 80) return 'rgba(16, 185, 129, 0.15)';
    return 'rgba(16, 185, 129, 0.25)';
  };

  const getBadgeColor = (score) => {
    const s = Math.max(0, Math.min(100, score || 0));
    if (s < 20) return { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' };
    if (s < 40) return { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', text: '#d97706' };
    if (s < 60) return { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', text: '#2563eb' };
    if (s < 80) return { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', text: '#059669' };
    return { border: '#10b981', bg: 'rgba(16, 185, 129, 0.25)', text: '#059669' };
  };

  return (
    <div id="panel" className="open">
      <div id="panel-inner">
        <div id="panel-header">
          <div id="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CountryFlag iso={countryData.iso} country={selectedCountry} size="medium" />
            <span>{selectedCountry}</span>
          </div>
          <div id="panel-subtitle">
            {countryData.region}
            {countryData.sub_region ? ' · ' + countryData.sub_region : ''} ·{' '}
            {countryData.num_operators} Operator{countryData.num_operators > 1 ? 's' : ''}
          </div>
          <button id="close-panel" onClick={onClose}>✕</button>
        </div>

        <div id="panel-tabs">
          {['overview', 'operators', 'impact', 'products', 'stats', 'narrative'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'products' ? 'Mobileum Fit' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* TAB: OVERVIEW */}
        <div className={`tab-content ${activeTab === 'overview' ? 'active' : ''}`}>
          <div style={{ padding: '10px 0 6px' }}>
            <span
              className="cluster-tag"
              style={{
                background: `${clr}22`,
                color: clr,
                border: `1px solid ${clr}44`
              }}
            >
              ◈ {countryData.cluster_name}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '8px' }}>
              {metadata.cluster_definitions?.[countryData.cluster_name] || ''}
            </span>
          </div>

          {countryData.anomaly_text && (
            <div className="anomaly-box">
              <div className="anomaly-icon">⚠</div>
              <div>{countryData.anomaly_text}</div>
            </div>
          )}

          <div className="kpi-grid">
            <div className="kpi-card blue" data-source="MNO Verified · World Bank">
              <div className="kpi-label">Population</div>
              <div className="kpi-value">{fmt(countryData.population_mln, 'M', 1)}</div>
              <div className="kpi-sub">Total population (millions)</div>
            </div>
            <div className="kpi-card teal" data-source="MNO Verified · ITU 2024">
              <div className="kpi-label">Mobile Users</div>
              <div className="kpi-value">{fmt(countryData.mobile_users_mln, 'M', 1)}</div>
              <div className="kpi-sub">Active subscribers</div>
            </div>
            <div className="kpi-card green" data-source="ITU / GSMA 2024">
              <div className="kpi-label">Penetration</div>
              <div className="kpi-value">{fmt(countryData.mobile_penetration_pct, '%')}</div>
              <div className="kpi-sub">
                {countryData.mobile_penetration_pct > 100 ? 'Multi-SIM market' : 'Single-SIM dominant'}
              </div>
            </div>
            <div className="kpi-card yellow" data-source="World Bank GDP Data 2024">
              <div className="kpi-label">GDP Growth</div>
              <div className="kpi-value">{fmt(countryData.gdp_growth_pct, '%')}</div>
              <div className="kpi-sub">
                {countryData.gdp_growth_pct > 3 ? '▲ Above global avg' : countryData.gdp_growth_pct < 0 ? '▼ Contraction' : '→ Moderate growth'}
              </div>
            </div>
            <div className="kpi-card purple" data-source="World Bank 2024">
              <div className="kpi-label">GDP per Capita</div>
              <div className="kpi-value">${fmtNum(countryData.gdp_per_capita_usd)}</div>
              <div className="kpi-sub">
                USD ·{' '}
                {countryData.gdp_per_capita_usd > 20000 ? 'High income' : countryData.gdp_per_capita_usd > 5000 ? 'Upper-middle' : 'Emerging'}
              </div>
            </div>
            <div className="kpi-card teal" data-source="UN World Population Prospects">
              <div className="kpi-label">Avg Age</div>
              <div className="kpi-value">{fmt(countryData.avg_age, ' yrs')}</div>
              <div className="kpi-sub">
                {countryData.avg_age < 28 ? 'Very young' : countryData.avg_age < 35 ? 'Young-middle' : countryData.avg_age < 42 ? 'Middle-aged' : 'Aging'} population
              </div>
            </div>
            <div className="kpi-card blue" data-source="ITU 2024">
              <div className="kpi-label">Internet Users</div>
              <div className="kpi-value">{fmt(countryData.internet_users_pct, '%')}</div>
              <div className="kpi-sub">Digital penetration</div>
            </div>
            <div
              className={`kpi-card ${
                (countryData.stats?.avg_5g || 0) > 60
                  ? 'green'
                  : (countryData.stats?.avg_5g || 0) > 30
                  ? 'yellow'
                  : 'red'
              }`}
              data-source="GSMA Intelligence 2024"
            >
              <div className="kpi-label">Avg 5G Penetration</div>
              <div className="kpi-value">
                {countryData.stats?.avg_5g ? countryData.stats.avg_5g.toFixed(0) + '%' : 'N/A'}
              </div>
              <div className="kpi-sub">
                {(countryData.stats?.avg_5g || 0) > 60 ? 'Advanced 5G' : (countryData.stats?.avg_5g || 0) > 30 ? 'Deploying' : '5G gap identified'}
              </div>
            </div>
          </div>

          {countryData.top_product && (
            <div className="section">
              <div className="section-title">Top Mobileum Recommendation</div>
              <div className="product-card top">
                <div className="product-top-badge">★ #1 RECOMMENDED</div>
                <div className="product-name">{countryData.top_product.product}</div>
                <div className="score-bar-wrap">
                  <div className="score-bar-bg">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${countryData.top_product.score}%`,
                        background: countryData.top_product.score > 75 ? '#10b981' : countryData.top_product.score > 50 ? '#f59e0b' : '#3b82f6'
                      }}
                    ></div>
                  </div>
                  <div className="score-num">{countryData.top_product.score}/100</div>
                </div>
                <div className="product-reason">{countryData.top_product.reason}</div>
              </div>
            </div>
          )}

          <div className="chart-wrap">
            <div className="chart-title">Impact Dimensions Overview</div>
            <div className="chart-canvas-wrap" style={{ height: '220px' }}>
              <canvas id="overview_radar"></canvas>
            </div>
          </div>
        </div>

        {/* TAB: OPERATORS */}
        <div className={`tab-content ${activeTab === 'operators' ? 'active' : ''}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div className="chart-wrap">
              <div className="chart-title">Market Share</div>
              <div style={{ height: '180px' }}>
                <canvas id="operators_doughnut"></canvas>
              </div>
            </div>
            <div className="chart-wrap">
              <div className="chart-title">Revenue vs Share</div>
              <div style={{ height: '180px' }}>
                <canvas id="operators_scatter"></canvas>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="heatmap-wrap" style={{ border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-card)', padding: '16px' }}>
              <div className="section-title" style={{ marginBottom: '16px' }}>Operator Health Matrix</div>
              <div style={{ overflowX: 'auto' }}>
                <table className="heatmap-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Operator</th>
                    <th>Subs (M)</th>
                    <th>5G %</th>
                    <th>Sub Growth</th>
                    <th>ARPU</th>
                    <th>Revenue</th>
                    <th>Profitability</th>
                    <th>Outbound</th>
                    <th>Inbound</th>
                    <th>Health</th>
                  </tr>
                </thead>
                <tbody>
                  {countryData.operators.map((op, idx) => {
                    const logicalName = `${op.operator} ${countryData.country_name || selectedCountry}`;
                    const healthObj = globalHealthData?.find(h => h.customer_name?.toLowerCase() === logicalName.toLowerCase() || h.customer_name?.toLowerCase() === op.operator.toLowerCase());
                    const healthScore = healthObj ? Math.round(healthObj.health || 0) : null;
                    
                    const cells = [
                      { val: op.sub_base_mln, fmt: v => v ? v + 'M' : '—', score: null },
                      { val: op.fiveG_pct, fmt: v => v !== null ? v + '%' : '—', score: op.fiveG_pct },
                      { val: op.subscriber_growth_pct, fmt: v => v !== null ? v + '%' : '—', score: (op.subscriber_growth_pct || 0) + 5 },
                      { val: op.arpu_growth_score, fmt: () => op.arpu_growth || '—', score: op.arpu_growth_score * 20 },
                      { val: op.revenue_growth_score, fmt: () => op.revenue_growth || '—', score: op.revenue_growth_score * 20 },
                      { val: op.profitability_score, fmt: () => op.profitability || '—', score: op.profitability_score * 20 },
                      { val: op.outbound_roaming_score, fmt: () => op.outbound_roaming || '—', score: op.outbound_roaming_score * 20 },
                      { val: op.inbound_roaming_score, fmt: () => op.inbound_roaming || '—', score: op.inbound_roaming_score * 20 },
                      { val: healthScore, fmt: v => v !== null ? v : '—', score: healthScore, isHealth: true }
                    ];

                    return (
                      <tr key={idx}>
                        <td className="hm-op-name">
                          <div className="op-name">{op.operator}</div>
                          <div className="op-sub">{op.prepaid_postpaid || ''}</div>
                        </td>
                        {cells.map((cell, cidx) => {
                          const sc = cell.score;
                          let bg = sc === null ? '' : hmColor(sc);
                          let textClr = sc !== null && sc < 35 ? '#fff' : sc > 65 ? '#0f172a' : 'inherit';
                          
                          if (cell.isHealth && sc !== null && sc !== undefined) {
                            if (sc >= 80) { bg = '#10b981'; textClr = '#ffffff'; }
                            else if (sc >= 60) { bg = '#f59e0b'; textClr = '#ffffff'; }
                            else { bg = '#ef4444'; textClr = '#ffffff'; }
                          }

                          return (
                            <td
                              key={cidx}
                              style={{
                                background: bg,
                                color: textClr,
                                fontWeight: sc !== null ? '600' : 'normal'
                              }}
                            >
                              {cell.fmt(cell.val)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Operator Detail</div>
            {countryData.operators.map((op, idx) => {
              const capexText = op.capex_investment !== 'nan' ? op.capex_investment : '—';
              return (
                <div className="product-card" key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="product-name">{op.operator}</div>
                      <div className="product-cat">
                        {op.sub_base_mln ? op.sub_base_mln + 'M subscribers · ' : ''}
                        {op.market_share_pct || '?'}% market share
                      </div>
                    </div>
                    <div
                      className="score-circle"
                      style={{
                        borderColor: getBadgeColor(op.profitability_score * 20).border,
                        backgroundColor: getBadgeColor(op.profitability_score * 20).bg,
                        color: getBadgeColor(op.profitability_score * 20).text,
                        width: '48px',
                        height: '48px',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                    >
                      <div style={{ fontSize: '13px' }}>{op.profitability_score}/5</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>HLTH</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                    <div>📶 5G: <strong style={{ color: 'var(--text-primary)' }}>{op.fiveG_pct !== null ? op.fiveG_pct + '%' : '—'}</strong></div>
                    <div>📈 ARPU: <strong style={{ color: 'var(--text-primary)' }}>{op.arpu_growth || '—'}</strong></div>
                    <div>🔄 Sub Growth: <strong style={{ color: 'var(--text-primary)' }}>{op.subscriber_growth_pct !== null ? op.subscriber_growth_pct + '%' : '—'}</strong></div>
                    <div>💰 Capex: <strong style={{ color: 'var(--text-primary)' }}>{capexText.length > 30 ? capexText.substring(0, 28) + '…' : capexText}</strong></div>
                    <div>🌍 Outbound: <strong style={{ color: 'var(--text-primary)' }}>{op.outbound_roaming.substring(0, 20) || '—'}</strong></div>
                    <div>✈️ Top Routes: <strong style={{ color: 'var(--text-primary)' }}>{op.top_roaming_countries.substring(0, 25) || '—'}</strong></div>
                  </div>
                  {op.financial_comments && op.financial_comments !== 'nan' && (
                    <div style={{ marginTop: '6px', fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {op.financial_comments.substring(0, 120)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TAB: IMPACT ANALYSIS */}
        <div className={`tab-content ${activeTab === 'impact' ? 'active' : ''}`}>
          <div className="chart-wrap">
            <div className="chart-title">Impact Radar — Country vs Regional Average</div>
            <div className="chart-canvas-wrap" style={{ height: '250px' }}>
              <canvas id="impact_radar"></canvas>
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--text-muted)' }}>
                <div style={{ width: '12px', height: '3px', background: '#3b82f6', borderRadius: '2px' }}></div>{' '}
                {selectedCountry}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--text-muted)' }}>
                <div style={{ width: '12px', height: '3px', background: '#10b981', borderRadius: '2px', opacity: '.6' }}></div>{' '}
                Regional Avg
              </div>
            </div>
          </div>

          <div className="chart-wrap">
            <div className="chart-title">Revenue Opportunity Waterfall — Mobileum Impact</div>
            <div className="chart-canvas-wrap" style={{ height: '200px' }}>
              <canvas id="impact_waterfall"></canvas>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Seasonal Roaming Calendar</div>
            <div className="cal-grid">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
                const intensity = countryData.seasonal_roaming?.[i + 1] || 1;
                const colors = ['var(--bg-card3)', 'var(--bg-card3)', '#1e4080', '#1a5276', '#1abc9c'];
                const textColors = ['var(--text-secondary)', 'var(--text-secondary)', '#7fb3d3', '#fff', '#fff'];
                return (
                  <div
                    key={m}
                    className="cal-month"
                    style={{
                      background: colors[intensity - 1] || colors[0],
                      color: textColors[intensity - 1] || textColors[0],
                      fontWeight: intensity >= 3 ? '600' : 'normal'
                    }}
                    title={`${m}: ${['No data', 'Minimal', 'Low', 'Moderate', 'High', 'Peak'][intensity] || 'Normal'} roaming`}
                  >
                    {m}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
              {['No data', 'Minimal', 'Moderate', 'High', 'Peak'].map((l, i) => {
                const c = ['var(--bg-card3)', 'var(--bg-card3)', '#1e4080', '#1a5276', '#1abc9c'][i];
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', color: 'var(--text-muted)' }} key={l}>
                    <div style={{ width: '8px', height: '8px', background: c, borderRadius: '2px' }}></div>
                    {l}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="section">
            <div className="section-title">Impact Analysis Dimensions</div>
            {(() => {
              const dims = [
                { label: 'Outbound Roaming Impact', key: 'ia_outbound_impact', src: 'Impact Analysis' },
                { label: 'Inbound Roaming Impact', key: 'ia_inbound_impact', src: 'Impact Analysis' },
                { label: 'ARPU Impact', key: 'ia_arpu_impact', src: 'Impact Analysis' },
                { label: 'App/OTT Substitution', key: 'ia_apps', src: 'Impact Analysis' },
                { label: 'Revenue Growth Outlook', key: 'ia_rev_growth', src: 'Impact Analysis' },
                { label: 'Profitability Outlook', key: 'ia_profitability', src: 'Impact Analysis' },
                { label: 'MS Financial Need', key: 'ia_need_ms_financial', src: 'Impact Analysis' },
                { label: 'MS Technical Need', key: 'ia_need_ms_technical', src: 'Impact Analysis' },
              ];

              const op0 = countryData.operators[0] || {};
              return dims.map(d => {
                const val = op0[d.key] || '—';
                const score = trendToScore(val);
                const barClr = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#10b981'][score - 1] || '#3b82f6';
                if (val === '—' || val === 'nan' || val === '') return null;
                return (
                  <React.Fragment key={d.key}>
                    <div className="percentile-row" data-source={d.src}>
                      <div className="perc-label">{d.label}</div>
                      <div className="perc-bar">
                        <div className="perc-fill" style={{ width: `${(score / 5) * 100}%`, background: barClr }}></div>
                      </div>
                      <div className="perc-value" style={{ color: barClr }}>{score}/5</div>
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', margin: '-4px 0 6px 128px' }}>
                      {val.substring(0, 60)}
                    </div>
                  </React.Fragment>
                );
              });
            })()}
          </div>

          {countryData.operators.length > 1 && (
            <div className="section">
              <div className="section-title">Operator-Level IA Summary</div>
              {countryData.operators.map((op, idx) => {
                const bizModel = op.ia_recommended_biz_model;
                const fin = op.ia_financials;
                if (!bizModel && !fin) return null;
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-card2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {op.operator}
                    </div>
                    {fin && fin !== 'nan' && (
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                        💰 {fin.substring(0, 80)}
                      </div>
                    )}
                    {bizModel && bizModel !== 'nan' && (
                      <div style={{ fontSize: '10px', color: 'var(--blue)' }}>
                        🎯 {bizModel.substring(0, 80)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TAB: MOBILEUM FIT */}
        <div className={`tab-content ${activeTab === 'products' ? 'active' : ''}`}>
          <div className="chart-wrap">
            <div className="chart-title">Product Fit Score — All Mobileum Solutions</div>
            <div className="chart-canvas-wrap" style={{ height: '220px' }}>
              <canvas id="products_bar"></canvas>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Priority Recommendations</div>
            {(countryData.product_ranking || []).slice(0, 3).map((p, i) => {
              const isTop = i === 0;
              const barClr = p.score > 75 ? '#10b981' : p.score > 50 ? '#f59e0b' : '#3b82f6';
              return (
                <div className={`product-card ${isTop ? 'top' : ''}`} key={p.product}>
                  {isTop ? (
                    <div className="product-top-badge">★ #1 BEST FIT</div>
                  ) : (
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      #{i + 1} RECOMMENDED
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="product-name">{p.product}</div>
                    <div className="score-circle" style={{ borderColor: barClr, color: barClr }}>
                      {p.score}
                    </div>
                  </div>
                  <div className="score-bar-wrap">
                    <div className="score-bar-bg">
                      <div className="score-bar-fill" style={{ width: `${p.score}%`, background: barClr }}></div>
                    </div>
                    <div className="score-num">{p.score}/100</div>
                  </div>
                  <div className="product-reason">{p.reason}</div>
                </div>
              );
            })}
          </div>

          <div className="section">
            <div className="section-title">Full Product Ranking</div>
            <table className="op-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th style={{ width: '80px' }}>Score</th>
                  <th>Rationale</th>
                </tr>
              </thead>
              <tbody>
                {(countryData.product_ranking || []).map((p, i) => {
                  const barClr = p.score > 75 ? 'var(--green)' : p.score > 50 ? 'var(--yellow)' : 'var(--blue)';
                  return (
                    <tr key={p.product}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{i + 1}</td>
                      <td className="op-name" style={{ fontSize: '11px' }}>{p.product}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div className="score-bar-bg" style={{ width: '40px' }}>
                            <div className="score-bar-fill" style={{ width: `${p.score}%`, background: barClr }}></div>
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: '600', color: barClr, whiteSpace: 'nowrap' }}>
                            {p.score}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                        {(p.reason || '').substring(0, 60)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(() => {
            const parsedServices = countryData.operators[0]?.mobileum_services_parsed || [];
            if (parsedServices.length > 0) {
              return (
                <div className="section">
                  <div className="section-title">Mobileum IA Service Detail (Operator Level)</div>
                  {parsedServices.map((svc, idx) => (
                    <div className="narrative-block" key={idx}>
                      <h4 style={{ color: 'var(--blue)' }}>{svc.name}</h4>
                      <p><strong>Category:</strong> {svc.category}</p>
                      <p style={{ marginTop: '4px' }}>{svc.rationale}</p>
                      {svc.kpi && <p style={{ marginTop: '4px', color: 'var(--green)' }}>📊 KPI: {svc.kpi}</p>}
                    </div>
                  ))}
                </div>
              );
            }
          })()}
        </div>

        {/* TAB: STATISTICS */}
        <div className={`tab-content ${activeTab === 'stats' ? 'active' : ''}`}>
          {countryData.anomaly_text && (
            <div className="anomaly-box">
              <div className="anomaly-icon">⚠</div>
              <div>
                {countryData.anomaly_text}
                <br />
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  Source: Regression on {metadata.total_countries} countries (GDP per capita vs mobile penetration)
                </span>
              </div>
            </div>
          )}

          <div className="section">
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
              <div className="section-title" style={{ marginBottom: '16px' }}>Global Percentile Rankings</div>
            {(() => {
              const p = countryData.percentiles || {};
              const ga = metadata.global_averages || {};
              const ra = countryData.regional_averages || {};

              const percMetrics = [
                { label: 'Mobile Penetration', key: 'mobile_penetration', val: countryData.mobile_penetration_pct, unit: '%', src: 'ITU 2024' },
                { label: 'GDP Growth', key: 'gdp_growth', val: countryData.gdp_growth_pct, unit: '%', src: 'World Bank 2024' },
                { label: 'Internet Users', key: 'internet_users', val: countryData.internet_users_pct, unit: '%', src: 'ITU 2024' },
                { label: 'GDP per Capita', key: 'gdp_per_capita', val: countryData.gdp_per_capita_usd, unit: 'USD', src: 'World Bank 2024' },
                { label: '5G Penetration (avg)', key: 'avg_5g', val: countryData.stats?.avg_5g, unit: '%', src: 'GSMA 2024' },
                { label: 'Avg Age', key: 'avg_age', val: countryData.avg_age, unit: 'yrs', src: 'UN 2024' },
              ];

              return percMetrics.map(m => {
                const perc = p[m.key];
                if (perc === null || perc === undefined) return null;
                const barClr = perc > 75 ? '#10b981' : perc > 50 ? '#3b82f6' : perc > 25 ? '#f59e0b' : '#ef4444';
                return (
                  <div style={{ marginBottom: '12px' }} data-source={m.src} key={m.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{m.label}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: '600' }}>
                        {m.val !== null ? m.val.toFixed(m.unit === 'USD' ? 0 : 1) + (m.unit === 'USD' ? ' USD' : m.unit === 'yrs' ? ' yrs' : '%') : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="perc-bar" style={{ flex: 1 }}>
                        <div className="perc-fill" style={{ width: `${perc}%`, background: barClr }}></div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '600', color: barClr, width: '40px', textAlign: 'right' }}>
                        {perc}th
                      </span>
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Global avg: {ga[m.key] !== null && ga[m.key] !== undefined ? ga[m.key].toFixed(1) : '—'} · Region avg:{' '}
                      {ra[m.key] !== null && ra[m.key] !== undefined ? ra[m.key].toFixed(1) : '—'}
                    </div>
                  </div>
                );
              });
            })()}
            </div>
          </div>

          <div className="chart-wrap">
            <div className="chart-title">Position vs Region Peers — 4 Dimensions</div>
            <div style={{ height: '220px' }}>
              <canvas id="stats_bubble"></canvas>
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '6px' }}>
              X: Mobile Penetration · Y: GDP Growth · Size: Population · Color: Cluster
            </div>
          </div>

          {(() => {
            const peers = Object.entries(allCountries)
              .filter(([k, cv]) => cv.cluster_name === countryData.cluster_name && k !== selectedCountry)
              .slice(0, 5);

            if (peers.length > 0) {
              return (
                <div className="section">
                  <div className="section-title">Cluster Peers — {countryData.cluster_name}</div>
                  <table className="op-table">
                    <thead>
                      <tr>
                        <th>Country</th>
                        <th>Pen%</th>
                        <th>5G%</th>
                        <th>GDP Gr%</th>
                        <th>Operators</th>
                      </tr>
                    </thead>
                    <tbody>
                      {peers.map(([pName, pv]) => (
                        <tr key={pName} style={{ cursor: 'pointer' }}>
                          <td className="op-name">{getFlagEmoji(pv.iso)} {pName}</td>
                          <td>{pv.mobile_penetration_pct?.toFixed(0) || '—'}%</td>
                          <td>{pv.stats?.avg_5g?.toFixed(0) || '—'}%</td>
                          <td>{pv.gdp_growth_pct?.toFixed(1) || '—'}%</td>
                          <td>{pv.num_operators}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
          })()}

          <div className="section">
            <div className="section-title">Fraud Risk Decomposition</div>
            {(() => {
              const op0 = countryData.operators[0] || {};
              const fraudDims = [
                { label: 'OTT/App Substitution', score: op0.ott_score || 3 },
                { label: 'Outbound Roaming Exposure', score: op0.outbound_roaming_score || 3 },
                { label: 'Inbound Attack Surface', score: op0.inbound_roaming_score || 3 },
                { label: 'Digital-Native Risk (Age)', score: countryData.avg_age < 28 ? 5 : countryData.avg_age < 33 ? 4 : 3 },
                { label: 'Regulatory Gap', score: op0.regulatory_risk || 3 },
              ];

              const totalFraud = fraudDims.reduce((a, d) => a + d.score, 0);
              const maxFraud = fraudDims.length * 5;
              const fraudPct = Math.round((totalFraud / maxFraud) * 100);
              const color = fraudPct > 70 ? 'var(--red)' : fraudPct > 50 ? 'var(--yellow)' : 'var(--green)';

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color }}>
                      {fraudPct}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Fraud Risk Score
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {fraudDims.map(d => {
                      const w = (d.score / 5) * 100;
                      const c = d.score >= 4 ? 'var(--red)' : d.score >= 3 ? 'var(--yellow)' : 'var(--green)';
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }} key={d.label}>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', width: '130px', flexShrink: 0 }}>
                            {d.label}
                          </span>
                          <div className="perc-bar" style={{ flex: 1 }}>
                            <div className="perc-fill" style={{ width: `${w}%`, background: c }}></div>
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: '600', color: c, width: '20px', textAlign: 'right' }}>
                            {d.score}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* TAB: INTELLIGENCE NARRATIVE */}
        <div className={`tab-content ${activeTab === 'narrative' ? 'active' : ''}`}>
          {(() => {
            const op0 = countryData.operators[0] || {};
            const isYoung = countryData.avg_age < 30;
            const isAging = countryData.avg_age > 42;
            const isHighGDP = countryData.gdp_per_capita_usd > 20000;
            const is5GLeader = (countryData.stats?.avg_5g || 0) > 60;
            const is5GLagging = (countryData.stats?.avg_5g || 0) < 15;
            const isRoamingHub = countryData.cluster_name.includes('Roaming Hub');
            const isFrontier = countryData.cluster_name === 'Frontier Market';
            const highFraud = countryData.stats?.fraud_score > 3.5;
            const operatorsStr = countryData.operators.map(o => o.operator).join(', ');
            const topOp = countryData.operators.reduce((a, b) => (a.sub_base_mln || 0) > (b.sub_base_mln || 0) ? a : b, { operator: '—' });
            const fiveGAvg = countryData.stats?.avg_5g?.toFixed(0) || '—';

            return (
              <>
                <div className="narrative-block">
                  <h4>Market Overview</h4>
                  <p>
                    <strong>{selectedCountry}</strong> is a{' '}
                    {isHighGDP ? 'high-income' : countryData.gdp_per_capita_usd > 5000 ? 'upper-middle income' : 'emerging market'}{' '}
                    country in the <strong>{countryData.region}</strong> region
                    {countryData.sub_region ? ` (${countryData.sub_region})` : ''}. With a population of{' '}
                    <strong>{countryData.population_mln ? countryData.population_mln.toFixed(0) + 'M' : '—'}</strong> and{' '}
                    {countryData.mobile_users_mln ? countryData.mobile_users_mln.toFixed(0) + 'M' : '—'} active mobile subscribers (
                    <strong>{countryData.mobile_penetration_pct ? countryData.mobile_penetration_pct.toFixed(0) + '%' : '—'} penetration</strong>
                    ), the market is served by <strong>{countryData.num_operators} operator{countryData.num_operators > 1 ? 's' : ''}</strong> (
                    {operatorsStr}). The dominant player is <strong>{topOp.operator}</strong>{' '}
                    {topOp.sub_base_mln ? `with ${topOp.sub_base_mln}M subscribers` : ''}.
                  </p>
                  <p style={{ marginTop: '8px' }}>
                    GDP growth stands at <strong>{countryData.gdp_growth_pct !== null ? countryData.gdp_growth_pct + '%' : '—'}</strong>{' '}
                    {countryData.gdp_growth_pct > 5
                      ? '— one of the fastest-growing economies globally'
                      : countryData.gdp_growth_pct > 2
                      ? '— moderate growth trajectory'
                      : countryData.gdp_growth_pct < 0
                      ? '— currently in economic contraction'
                      : ''}
                    . The country belongs to the <strong>{countryData.cluster_name}</strong> market cluster.
                  </p>
                </div>

                <div className="narrative-block">
                  <h4>Demographic & Digital Behaviour</h4>
                  <p>
                    The average age of <strong>{countryData.avg_age ? countryData.avg_age + ' years' : '—'}</strong>{' '}
                    {isYoung
                      ? 'indicates a highly digital-native, mobile-first population with strong OTT and app usage. This demographic is the primary driver of data demand and creates elevated bypass fraud risk via WhatsApp voice and video calls.'
                      : isAging
                      ? 'reflects an aging population where mobile usage tends toward voice and traditional services. Churn risk is lower but ARPU uplift through data migration is the key opportunity.'
                      : 'places this market in the middle-age bracket — a blend of digital-native and traditional mobile users.'}{' '}
                    Internet penetration of <strong>{countryData.internet_users_pct ? countryData.internet_users_pct + '%' : '—'}</strong>{' '}
                    {countryData.internet_users_pct > 90
                      ? 'confirms a fully digitised market where advanced SaaS and eSIM solutions are viable immediately.'
                      : countryData.internet_users_pct > 60
                      ? 'shows a maturing digital market with room for smart device and 5G upsell.'
                      : 'highlights a digital gap — managed services and infrastructure solutions are likely more relevant than SaaS.'}
                  </p>
                </div>

                <div className="narrative-block">
                  <h4>5G & Technology Landscape</h4>
                  <p>
                    Average 5G penetration across operators is <strong>{fiveGAvg}%</strong>.{' '}
                    {is5GLeader
                      ? `This is a 5G-advanced market where the eSIM, Steering of Roaming, and Roaming DNA products operate at full capability. Active testing investment protects the 5G QoE advantage.`
                      : is5GLagging
                      ? `5G deployment is in early stages. This creates a strong opportunity for Mobileum's 5G Active Testing and Managed Services, helping operators accelerate their rollout with validated network performance.`
                      : `5G deployment is progressing. The focus should be on 5G testing, performance assurance, and subscriber migration management.`}
                  </p>
                </div>

                <div className="narrative-block">
                  <h4>Roaming Behaviour</h4>
                  <p>
                    {isRoamingHub ? (
                      <>
                        <strong>{selectedCountry}</strong> is identified as a <strong>Roaming Hub</strong> — with exceptional inbound
                        and outbound volumes driven by{' '}
                        {selectedCountry.includes('UAE') || selectedCountry.includes('Qatar') || selectedCountry.includes('Bahrain')
                          ? 'a large expatriate population and business/tourism traffic'
                          : selectedCountry.includes('Singapore') || selectedCountry.includes('Hong Kong')
                          ? 'its role as a regional business and transit hub'
                          : 'high business travel and diaspora connectivity'}
                        . This makes Steering of Roaming, Roaming DNA, and Roaming Campaign Management the primary value drivers.
                      </>
                    ) : (
                      <>
                        Outbound roaming trend: <strong>{op0.outbound_roaming || '—'}</strong>. Inbound trend:{' '}
                        <strong>{op0.inbound_roaming || '—'}</strong>.{' '}
                        {op0.top_roaming_countries && op0.top_roaming_countries !== 'nan' && (
                          <>
                            Top roaming corridors: <strong>{op0.top_roaming_countries}</strong>.
                          </>
                        )}
                        {op0.biz_travellers && op0.biz_travellers !== 'nan' && (
                          <>
                            {' '}
                            Business traveller profile: <strong>{op0.biz_travellers}</strong>.
                          </>
                        )}
                      </>
                    )}
                  </p>
                  {op0.roaming_comments && op0.roaming_comments !== 'nan' && (
                    <p style={{ marginTop: '6px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                      {op0.roaming_comments.substring(0, 200)}
                    </p>
                  )}
                </div>

                <div className="narrative-block">
                  <h4>Regulatory Environment</h4>
                  <p>
                    {op0.regulation_comments && op0.regulation_comments !== 'nan'
                      ? op0.regulation_comments.substring(0, 300)
                      : `Regulatory environment in ${selectedCountry} is ${op0.regulation_impact?.toLowerCase() || 'under standard national telecom authority oversight'}.`}
                  </p>
                  {op0.regulations && op0.regulations !== 'nan' && (
                    <p style={{ marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                      {op0.regulations.substring(0, 250)}
                    </p>
                  )}
                </div>

                <div className="narrative-block">
                  <h4>Mobileum Strategic Opportunity</h4>
                  <p>
                    {highFraud && (
                      <>
                        <strong>Fraud exposure is elevated</strong> — OTT substitution, IDD bypass risk, and the{' '}
                        {isYoung ? 'young, digitally-active' : 'mobile-heavy'} subscriber base create conditions for SIM-box fraud,
                        flash calls, and IRSF. RAID 9 with AI-adaptive rules is the priority recommendation.{' '}
                      </>
                    )}
                    {is5GLagging && (
                      <>
                        <strong>5G infrastructure gap</strong> — Active testing and performance assurance tools are critical to
                        support operators' network expansion plans.{' '}
                      </>
                    )}
                    {isRoamingHub && (
                      <>
                        <strong>Roaming hub dynamics</strong> — The Steering of Roaming and Roaming DNA products can directly protect
                        and grow the high-value roaming revenue stream.{' '}
                      </>
                    )}
                    {isFrontier && (
                      <>
                        <strong>Frontier market profile</strong> — Managed Services provides the operational foundation that allows
                        operators in this market to deploy enterprise-grade telecom capabilities without heavy upfront capex.{' '}
                      </>
                    )}
                    The recommended business model is:{' '}
                    <strong>
                      {op0.ia_recommended_biz_model && op0.ia_recommended_biz_model !== 'nan'
                        ? op0.ia_recommended_biz_model
                        : 'Evaluate based on operator financial capacity'}
                    </strong>
                    .
                  </p>
                </div>

                {op0.key_events && op0.key_events !== 'nan' && (
                  <div className="narrative-block">
                    <h4>Key Market Events</h4>
                    <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      {op0.key_events.substring(0, 400)}
                    </p>
                  </div>
                )}
              </>
            );
          })()}

          <div style={{ marginTop: '16px', padding: '10px', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px' }}>
              Data Sources
            </div>
            {(metadata.data_sources || []).map(s => (
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }} key={s}>
                • {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
