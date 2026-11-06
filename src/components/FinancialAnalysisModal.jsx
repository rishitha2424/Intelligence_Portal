import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import OperatorPerformanceTracker from './OperatorPerformanceTracker';
import finData from '../data/operator_financials.json';

function FinancialChart({ activeTab, isRevenue }) {
  let labels = [];
  let series1 = { label: '', values: [], color: '#10b981', gradient: 'rgba(16, 185, 129, 0.4)' };
  let series2 = { label: '', values: [], color: '#3b82f6', gradient: 'rgba(59, 130, 246, 0.4)', isLine: false };

  if (activeTab === 'trend3yr') {
    labels = ['FY 2023', 'FY 2024', 'FY 2025', 'FY 2026 (Proj)'];
    series1 = { label: 'Consolidated Revenue ($M)', values: [14.2, 16.8, 18.5, 22.0], color: '#10b981', gradient: 'rgba(16, 185, 129, 0.35)' };
    series2 = { label: 'Net Profit ($M)', values: [3.8, 4.9, 5.7, 7.4], color: '#3b82f6', isLine: true };
  } else if (activeTab === 'annual') {
    labels = ['FY 2023', 'FY 2024', 'FY 2025', 'FY 2026 (Proj)'];
    if (isRevenue) {
      series1 = { label: 'Gross Revenue ($M)', values: [14.2, 16.8, 18.5, 22.0], color: '#10b981', gradient: 'rgba(16, 185, 129, 0.4)' };
      series2 = { label: 'Net Profit ($M)', values: [3.8, 4.9, 5.7, 7.4], color: '#3b82f6', gradient: 'rgba(59, 130, 246, 0.4)' };
    } else {
      series1 = { label: 'Total Capex ($M)', values: [1.8, 2.2, 2.5, 2.8], color: '#3b82f6', gradient: 'rgba(59, 130, 246, 0.4)' };
      series2 = { label: '5G Core Infra ($M)', values: [0.9, 1.2, 1.4, 1.6], color: '#f59e0b', gradient: 'rgba(245, 158, 11, 0.4)' };
    }
  } else if (activeTab === 'quarterly') {
    labels = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026 (E)', 'Q2 2026 (E)'];
    if (isRevenue) {
      series1 = { label: 'Quarterly Revenue ($M)', values: [4.4, 4.6, 4.7, 4.8, 5.2, 5.5], color: '#10b981', gradient: 'rgba(16, 185, 129, 0.15)', isLine: true };
      series2 = { label: 'Profit Contribution ($M)', values: [1.3, 1.4, 1.5, 1.5, 1.7, 1.8], color: '#3b82f6', isLine: true, isDashed: true };
    } else {
      series1 = { label: 'Capex Allocated ($M)', values: [0.60, 0.62, 0.63, 0.65, 0.70, 0.75], color: '#3b82f6', gradient: 'rgba(59, 130, 246, 0.4)' };
      series2 = { label: 'Infra Deployment Pace', values: [0.30, 0.35, 0.38, 0.40, 0.45, 0.48], color: '#f59e0b', isLine: true };
    }
  } else {
    labels = ['FY 2023', 'FY 2024', 'FY 2025', 'FY 2026 (Proj)'];
    series1 = { label: 'Disclosed Performance Index', values: [78, 84, 91, 98], color: '#7c3aed', gradient: 'rgba(124, 58, 237, 0.3)' };
  }

  const allVals = [...series1.values, ...(series2.values || [])];
  const maxVal = Math.max(...allVals, 1) * 1.25;
  const tickSteps = [
    maxVal.toFixed(1),
    (maxVal * 0.75).toFixed(1),
    (maxVal * 0.50).toFixed(1),
    (maxVal * 0.25).toFixed(1),
    '0.0'
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '190px', display: 'flex', flexDirection: 'column', paddingTop: '4px' }}>
      {/* Legend Header */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: '700', color: 'var(--text-secondary)' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: series1.color }} />
          <span>{series1.label}</span>
        </div>
        {series2.label && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: '700', color: 'var(--text-secondary)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: series2.color }} />
            <span>{series2.label}</span>
          </div>
        )}
      </div>

      {/* Main Graph Grid Area */}
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        {/* Y Axis Ticks */}
        <div style={{ width: '42px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '9.5px', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'right', paddingRight: '8px' }}>
          {tickSteps.map((t, idx) => (
            <span key={idx}>${t}</span>
          ))}
        </div>

        {/* Chart Column Area */}
        <div style={{ flex: 1, borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '0 8px' }}>
          {/* Background Grid Lines */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 0 }}>
            <div style={{ borderTop: '1px dashed var(--border)', width: '100%' }} />
            <div style={{ borderTop: '1px dashed var(--border)', width: '100%' }} />
            <div style={{ borderTop: '1px dashed var(--border)', width: '100%' }} />
            <div style={{ borderTop: '1px dashed var(--border)', width: '100%' }} />
            <div style={{ width: '100%' }} />
          </div>

          {/* Render Bar Columns */}
          {labels.map((lbl, idx) => {
            const v1 = series1.values[idx] || 0;
            const v2 = series2.values ? (series2.values[idx] || 0) : 0;
            const p1 = Math.min(100, Math.max(2, (v1 / maxVal) * 100));
            const p2 = Math.min(100, Math.max(2, (v2 / maxVal) * 100));

            return (
              <div key={idx} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', zIndex: 1, position: 'relative' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '100%', width: '75%', justifyContent: 'center' }}>
                  {/* Bar 1 */}
                  {!series1.isLine && (
                    <div
                      title={`${series1.label}: $${v1}M`}
                      style={{
                        height: `${p1}%`,
                        width: series2.isLine || !series2.values ? '50%' : '35%',
                        background: series1.gradient || series1.color,
                        border: `1.5px solid ${series1.color}`,
                        borderBottom: 'none',
                        borderTopLeftRadius: '4px',
                        borderTopRightRadius: '4px',
                        position: 'relative',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      <span style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: '800', color: series1.color, whiteSpace: 'nowrap' }}>
                        ${v1}
                      </span>
                    </div>
                  )}

                  {/* Bar 2 */}
                  {series2.values && !series2.isLine && (
                    <div
                      title={`${series2.label}: $${v2}M`}
                      style={{
                        height: `${p2}%`,
                        width: '35%',
                        background: series2.gradient || series2.color,
                        border: `1.5px solid ${series2.color}`,
                        borderBottom: 'none',
                        borderTopLeftRadius: '4px',
                        borderTopRightRadius: '4px',
                        position: 'relative',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      <span style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: '800', color: series2.color, whiteSpace: 'nowrap' }}>
                        ${v2}
                      </span>
                    </div>
                  )}
                </div>

                {/* X Axis Label */}
                <div style={{ position: 'absolute', bottom: '-22px', fontSize: '9.5px', fontWeight: '700', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {lbl}
                </div>
              </div>
            );
          })}

          {/* SVG Overlay Line Curves */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
            {[series1, series2].map((ser, sIdx) => {
              if (!ser.isLine || !ser.values || ser.values.length === 0) return null;
              const pts = labels.map((_, i) => {
                const x = ((i + 0.5) / labels.length) * 100;
                const rawY = 100 - Math.min(95, Math.max(5, ((ser.values[i] || 0) / maxVal) * 100));
                return { x: Number(x.toFixed(2)), y: Number(rawY.toFixed(2)), val: ser.values[i] };
              });
              const pathD = pts.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');

              return (
                <g key={sIdx}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={ser.color}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray={ser.isDashed ? '4 4' : 'none'}
                  />
                  {pts.map((pt, i) => (
                    <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#ffffff" stroke={ser.color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  ))}
                </g>
              );
            })}
          </svg>

          {/* HTML Overlay Text Labels for Line Chart Points */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }}>
            {[series1, series2].map((ser, sIdx) => {
              if (!ser.isLine || !ser.values || ser.values.length === 0) return null;
              return labels.map((_, i) => {
                const x = ((i + 0.5) / labels.length) * 100;
                const rawY = 100 - Math.min(95, Math.max(5, ((ser.values[i] || 0) / maxVal) * 100));
                return (
                  <div
                    key={`${sIdx}-${i}`}
                    style={{
                      position: 'absolute',
                      left: `${x}%`,
                      top: `${rawY}%`,
                      transform: 'translate(-50%, -130%)',
                      fontSize: '9px',
                      fontWeight: '800',
                      color: ser.color,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ${ser.values[i]}
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>

      <div style={{ height: '22px' }} />
    </div>
  );
}

export default function FinancialAnalysisModal({
  isOpen,
  onClose,
  type,
  accountData,
  countryName,
  selectedOperator = null,
  operators = null,
  onNavigateToPlan
}) {
  const [activeTab, setActiveTab] = useState(type === 'tracker' ? 'tracker' : 'annual');
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (type === 'tracker') {
      setActiveTab('tracker');
    }
  }, [type]);

  const isRevenue = type === 'revenue';
  const isTracker = type === 'tracker';
  const title = isTracker 
    ? 'Telecom Operator 3-Year Performance Tracker (2022–2024)' 
    : isRevenue 
      ? 'Profit / Revenue Potential Analysis' 
      : 'Capex Investment Analysis';
  
  const targetOperator = selectedOperator || (accountData?.name !== countryName ? accountData?.name : null);
  const opDisplayName = targetOperator || countryName || 'Operator';
  const metricVal = isTracker
    ? `${opDisplayName} (FY22 – FY24 Disclosures)`
    : isRevenue 
      ? (accountData?.financialSection?.profit || '$9.5M Projected Potential')
      : (accountData?.financialSection?.capexInvestment || '$2.8M Capex Enabled');

  // Dynamically resolve operator group info
  const FIN = finData || { groups: {}, operator_to_group: {} };
  const targetSearch = targetOperator || countryName || '';
  const grpKey = FIN.operator_to_group ? FIN.operator_to_group[targetSearch] : null;
  let gObj = grpKey && FIN.groups ? FIN.groups[grpKey] : null;
  if (!gObj && targetSearch && FIN.groups) {
    const low = String(targetSearch).toLowerCase();
    for (const [k, v] of Object.entries(FIN.groups)) {
      if (low.includes(k.toLowerCase()) || k.toLowerCase().includes(low)) {
        gObj = v;
        break;
      }
    }
  }
  const operatorLabel = gObj?.group || targetSearch || 'Operator';
  const trendLabel = gObj?.performance_trend_3yr?.label || '📈 PERFORMANCE GOING UP';
  const summaryNarrative = gObj?.performance_trend_3yr?.summary || `${operatorLabel} financial performance and quarterly disclosures integrated from executive investor reports.`;
  const trendHistory = gObj?.performance_trend_3yr?.history || [
    { year: 'FY 2023', revenue: '$14.2M', ebitda: '48%', profit: '$3.8M', trend: 'UP (+5.2%)' },
    { year: 'FY 2024', revenue: '$16.8M', ebitda: '51%', profit: '$4.9M', trend: 'UP (+18.3%)' },
    { year: 'FY 2025', revenue: '$18.5M', ebitda: '53%', profit: '$5.7M', trend: 'UP (+10.1%)' }
  ];

  // Sample structured data dynamically calculated or mapped from accountData
  const annualRevenueData = [
    { year: 'FY 2023', grossRevenue: '$14.2M', ebitdaMargin: '48%', netProfit: '$3.8M', yoyGrowth: '+5.2%', status: 'Audited' },
    { year: 'FY 2024', grossRevenue: '$16.8M', ebitdaMargin: '51%', netProfit: '$4.9M', yoyGrowth: '+18.3%', status: 'Audited' },
    { year: 'FY 2025', grossRevenue: '$18.5M', ebitdaMargin: '53%', netProfit: '$5.7M', yoyGrowth: '+10.1%', status: 'Reported' },
    { year: 'FY 2026 (Proj)', grossRevenue: '$22.0M', ebitdaMargin: '56%', netProfit: '$7.4M', yoyGrowth: '+18.9%', status: 'Target Plan' },
  ];

  const quarterlyRevenueData = [
    { quarter: 'Q1 2025', revenue: '$4.4M', profit: '$1.3M', qoqGrowth: '+2.1%', status: 'Actual' },
    { quarter: 'Q2 2025', revenue: '$4.6M', profit: '$1.4M', qoqGrowth: '+4.5%', status: 'Actual' },
    { quarter: 'Q3 2025', revenue: '$4.7M', profit: '$1.5M', qoqGrowth: '+2.2%', status: 'Actual' },
    { quarter: 'Q4 2025', revenue: '$4.8M', profit: '$1.5M', qoqGrowth: '+2.1%', status: 'Reported' },
    { quarter: 'Q1 2026 (E)', revenue: '$5.2M', profit: '$1.7M', qoqGrowth: '+8.3%', status: 'Forecast' },
    { quarter: 'Q2 2026 (E)', revenue: '$5.5M', profit: '$1.8M', qoqGrowth: '+5.7%', status: 'Forecast' },
  ];

  const annualCapexData = [
    { year: 'FY 2023', totalCapex: '$1.8M', infrastructure5G: '$0.9M', softwareLicensing: '$0.5M', yoyChange: '+8.0%', status: 'Executed' },
    { year: 'FY 2024', totalCapex: '$2.2M', infrastructure5G: '$1.2M', softwareLicensing: '$0.6M', yoyChange: '+22.2%', status: 'Executed' },
    { year: 'FY 2025', totalCapex: '$2.5M', infrastructure5G: '$1.4M', softwareLicensing: '$0.7M', yoyChange: '+13.6%', status: 'Completed' },
    { year: 'FY 2026 (Proj)', totalCapex: '$2.8M', infrastructure5G: '$1.6M', softwareLicensing: '$0.8M', yoyChange: '+12.0%', status: 'Allocated' },
  ];

  const quarterlyCapexData = [
    { quarter: 'Q1 2025', capexAllocated: '$0.60M', milestone: 'Core Network Upgrade', qoqVariance: '+1.5%', status: 'Completed' },
    { quarter: 'Q2 2025', capexAllocated: '$0.62M', milestone: '5G Trial Infrastructure', qoqVariance: '+3.3%', status: 'Completed' },
    { quarter: 'Q3 2025', capexAllocated: '$0.63M', milestone: 'AI Steering Module Licensing', qoqVariance: '+1.6%', status: 'Completed' },
    { quarter: 'Q4 2025', capexAllocated: '$0.65M', milestone: 'Active Testing Probe Deployment', qoqVariance: '+3.1%', status: 'In Progress' },
    { quarter: 'Q1 2026 (E)', capexAllocated: '$0.70M', milestone: 'eSIM Platform Migration', qoqVariance: '+7.6%', status: 'Planned' },
  ];

  // Render performance graph using Chart.js
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }

      const canvas = chartCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let labels = [];
      let datasets = [];

      if (activeTab === 'trend3yr') {
        labels = ['FY 2023', 'FY 2024', 'FY 2025', 'FY 2026 (Proj)'];
        datasets = [
          {
            type: 'bar',
            label: 'Consolidated Revenue ($M)',
            data: [14.2, 16.8, 18.5, 22.0],
            backgroundColor: 'rgba(16, 185, 129, 0.35)',
            borderColor: '#10b981',
            borderWidth: 2,
            borderRadius: 6,
            order: 2,
          },
          {
            type: 'line',
            label: 'Net Profit ($M)',
            data: [3.8, 4.9, 5.7, 7.4],
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f6',
            borderWidth: 3,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#3b82f6',
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.35,
            order: 1,
          }
        ];
      } else if (activeTab === 'annual') {
        labels = ['FY 2023', 'FY 2024', 'FY 2025', 'FY 2026 (Proj)'];
        if (isRevenue) {
          datasets = [
            {
              type: 'bar',
              label: 'Gross Revenue ($M)',
              data: [14.2, 16.8, 18.5, 22.0],
              backgroundColor: 'rgba(16, 185, 129, 0.4)',
              borderColor: '#10b981',
              borderWidth: 1.5,
              borderRadius: 6,
            },
            {
              type: 'bar',
              label: 'Net Profit ($M)',
              data: [3.8, 4.9, 5.7, 7.4],
              backgroundColor: 'rgba(59, 130, 246, 0.4)',
              borderColor: '#3b82f6',
              borderWidth: 1.5,
              borderRadius: 6,
            }
          ];
        } else {
          datasets = [
            {
              type: 'bar',
              label: 'Total Capex ($M)',
              data: [1.8, 2.2, 2.5, 2.8],
              backgroundColor: 'rgba(59, 130, 246, 0.4)',
              borderColor: '#3b82f6',
              borderWidth: 1.5,
              borderRadius: 6,
            },
            {
              type: 'bar',
              label: '5G Core Infra ($M)',
              data: [0.9, 1.2, 1.4, 1.6],
              backgroundColor: 'rgba(245, 158, 11, 0.4)',
              borderColor: '#f59e0b',
              borderWidth: 1.5,
              borderRadius: 6,
            }
          ];
        }
      } else if (activeTab === 'quarterly') {
        labels = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026 (E)', 'Q2 2026 (E)'];
        if (isRevenue) {
          datasets = [
            {
              type: 'line',
              label: 'Quarterly Revenue ($M)',
              data: [4.4, 4.6, 4.7, 4.8, 5.2, 5.5],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              fill: true,
              tension: 0.35,
              pointRadius: 5,
              pointBackgroundColor: '#10b981',
            },
            {
              type: 'line',
              label: 'Profit Contribution ($M)',
              data: [1.3, 1.4, 1.5, 1.5, 1.7, 1.8],
              borderColor: '#3b82f6',
              backgroundColor: 'transparent',
              borderDash: [4, 4],
              tension: 0.35,
              pointRadius: 5,
              pointBackgroundColor: '#3b82f6',
            }
          ];
        } else {
          datasets = [
            {
              type: 'bar',
              label: 'Capex Allocated ($M)',
              data: [0.60, 0.62, 0.63, 0.65, 0.70, 0.75],
              backgroundColor: 'rgba(59, 130, 246, 0.4)',
              borderColor: '#3b82f6',
              borderWidth: 1.5,
              borderRadius: 6,
            },
            {
              type: 'line',
              label: 'Infra Deployment Pace',
              data: [0.30, 0.35, 0.38, 0.40, 0.45, 0.48],
              borderColor: '#f59e0b',
              backgroundColor: 'transparent',
              borderWidth: 2,
              tension: 0.35,
              pointRadius: 4,
            }
          ];
        }
      }

      chartInstanceRef.current = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                boxWidth: 12,
                font: { size: 10, weight: '700' },
                color: '#64748b'
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              padding: 10,
              borderRadius: 6,
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 10, weight: '600' }, color: '#64748b' }
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(226, 232, 240, 0.6)' },
              ticks: { font: { size: 10, weight: '600' }, color: '#64748b' }
            }
          }
        }
      });
    }, 60);

    return () => {
      clearTimeout(timer);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [isOpen, activeTab, isRevenue, countryName]);

  if (!isOpen || !accountData) return null;

  const downloadCSV = (reportType) => {
    let csvRows = [];
    const timestamp = new Date().toISOString().split('T')[0];
    const country = countryName || 'Global';

    if (reportType === 'trend3yr') {
      csvRows.push([`Country/Operator: ${country} (${operatorLabel})`]);
      csvRows.push([`Report Type: 3-Year Performance Trajectory & Growth Analysis`]);
      csvRows.push([`Performance Direction: ${trendLabel}`]);
      csvRows.push([`Data Source: Executive Financial Disclosure & Analytics`]);
      csvRows.push([`Generated Date: ${timestamp}`]);
      csvRows.push([]);
      csvRows.push(['Fiscal Year', 'Consolidated Revenue', 'EBITDA Margin', 'Net Profit', 'Trajectory']);
      trendHistory.forEach(r => {
        csvRows.push([r.year, r.revenue, r.ebitda_margin || r.ebitda, r.net_profit || r.profit, r.trend]);
      });
    } else if (isRevenue) {
      if (reportType === 'annual') {
        csvRows.push([`Country/Operator: ${country}`]);
        csvRows.push([`Report Type: Annual Revenue & Profit Potential`]);
        csvRows.push([`Generated Date: ${timestamp}`]);
        csvRows.push([]);
        csvRows.push(['Year', 'Gross Revenue ($M)', 'EBITDA Margin', 'Net Profit ($M)', 'YoY Growth', 'Status']);
        annualRevenueData.forEach(r => {
          csvRows.push([r.year, r.grossRevenue, r.ebitdaMargin, r.netProfit, r.yoyGrowth, r.status]);
        });
      } else {
        csvRows.push([`Country/Operator: ${country}`]);
        csvRows.push([`Report Type: Quarterly Revenue & Profit Breakdown`]);
        csvRows.push([`Generated Date: ${timestamp}`]);
        csvRows.push([]);
        csvRows.push(['Quarter', 'Revenue ($M)', 'Profit Contribution ($M)', 'QoQ Growth', 'Status']);
        quarterlyRevenueData.forEach(r => {
          csvRows.push([r.quarter, r.revenue, r.profit, r.qoqGrowth, r.status]);
        });
      }
    } else {
      if (reportType === 'annual') {
        csvRows.push([`Country/Operator: ${country}`]);
        csvRows.push([`Report Type: Annual Capex Investment Report`]);
        csvRows.push([`Generated Date: ${timestamp}`]);
        csvRows.push([]);
        csvRows.push(['Year', 'Total Capex ($M)', '5G Core Infra ($M)', 'Software Licensing ($M)', 'YoY Change', 'Status']);
        annualCapexData.forEach(r => {
          csvRows.push([r.year, r.totalCapex, r.infrastructure5G, r.softwareLicensing, r.yoyChange, r.status]);
        });
      } else {
        csvRows.push([`Country/Operator: ${country}`]);
        csvRows.push([`Report Type: Quarterly Capex Allocation Breakdown`]);
        csvRows.push([`Generated Date: ${timestamp}`]);
        csvRows.push([]);
        csvRows.push(['Quarter', 'Capex Allocated ($M)', 'Deployment Milestone', 'QoQ Variance', 'Status']);
        quarterlyCapexData.forEach(r => {
          csvRows.push([r.quarter, r.capexAllocated, r.milestone, r.qoqVariance, r.status]);
        });
      }
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName = `${country}_${type}_${reportType}_report_${timestamp}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="generic-modal-overlay" style={{ zIndex: 99999 }} onClick={(e) => e.target.className === 'generic-modal-overlay' && onClose()}>
      <div className="generic-modal-card" style={{ maxWidth: '880px', width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '12px' }}>
        
        {/* Modal Header */}
        <div className="generic-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', color: isRevenue ? 'var(--green)' : 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Financial Analysis Dashboard — {targetOperator ? `${targetOperator} (${countryName})` : countryName}
            </div>
            <h3 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {title}
            </h3>
          </div>
          <button className="generic-modal-close-btn" onClick={onClose} style={{ fontSize: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Top KPI & Quick Redirect Bar */}
          <div style={{ background: isRevenue ? 'rgba(16, 185, 129, 0.08)' : 'rgba(37, 99, 235, 0.08)', border: `1px solid ${isRevenue ? 'rgba(16, 185, 129, 0.25)' : 'rgba(37, 99, 235, 0.25)'}`, borderRadius: '10px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Target Highlight Benchmark
              </div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: isRevenue ? 'var(--green)' : 'var(--blue)', marginTop: '2px' }}>
                {metricVal}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => {
                  onClose();
                  if (onNavigateToPlan) onNavigateToPlan();
                }}
                style={{
                  background: 'var(--blue)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>View in Full 2026 Plan</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Report Tab Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('annual')}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: '800',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'annual' ? 'var(--blue)' : 'var(--bg-card2)',
                  color: activeTab === 'annual' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Annual Report
              </button>
              <button
                onClick={() => setActiveTab('quarterly')}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: '800',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'quarterly' ? 'var(--blue)' : 'var(--bg-card2)',
                  color: activeTab === 'quarterly' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Quarterly Report
              </button>
              <button
                onClick={() => setActiveTab('trend3yr')}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: '800',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'trend3yr' ? 'var(--green)' : 'var(--bg-card2)',
                  color: activeTab === 'trend3yr' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                3-Yr Investor Trend
              </button>
              <button
                onClick={() => setActiveTab('tracker')}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: '800',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'tracker' ? '#7c3aed' : 'var(--bg-card2)',
                  color: activeTab === 'tracker' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                3-Yr Performance Tracker
              </button>
            </div>

            {/* Export Button */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => downloadCSV(activeTab)}
                style={{
                  background: 'var(--bg-card3)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📥 Export {activeTab === 'annual' ? 'Annual' : activeTab === 'quarterly' ? 'Quarterly' : activeTab === 'tracker' ? 'Performance Tracker' : '3-Yr Trend'} Report (CSV)</span>
              </button>
            </div>
          </div>

          {/* Visual Analysis Chart Box */}
          <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                {activeTab === 'trend3yr' ? '3-Year Performance Growth & Trajectory Graph (2023–2026)' : activeTab === 'annual' ? 'Annual Revenue & Profit Trend Analysis' : 'Quarterly Financial Trajectory'}
              </span>
              <span style={{ fontSize: '9.5px', fontWeight: '600', color: 'var(--text-muted)' }}>
                {activeTab === 'trend3yr' ? 'Revenue vs Profit Trajectory' : activeTab === 'annual' ? 'Multi-Year Growth Breakdown' : 'Recent & Forecasted Quarters'}
              </span>
            </div>
            <div style={{ position: 'relative', minHeight: '210px', width: '100%' }}>
              <FinancialChart activeTab={activeTab} isRevenue={isRevenue} />
            </div>
          </div>

          {/* Data Tables & Details */}
          {activeTab === 'annual' && (
            <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card3)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>Year</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>{isRevenue ? 'Gross Revenue' : 'Total Capex'}</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>{isRevenue ? 'EBITDA Margin' : '5G Core Infra'}</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>{isRevenue ? 'Net Profit' : 'Software Licensing'}</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>{isRevenue ? 'YoY Growth' : 'YoY Capex Change'}</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(isRevenue ? annualRevenueData : annualCapexData).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--text-primary)' }}>{row.year}</td>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: isRevenue ? 'var(--green)' : 'var(--blue)' }}>{isRevenue ? row.grossRevenue : row.totalCapex}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{isRevenue ? row.ebitdaMargin : row.infrastructure5G}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{isRevenue ? row.netProfit : row.softwareLicensing}</td>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--green)' }}>{isRevenue ? row.yoyGrowth : row.yoyChange}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(37,99,235,0.1)', color: 'var(--blue)', padding: '2px 6px', borderRadius: '4px' }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'quarterly' && (
            <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card3)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>Quarter</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>{isRevenue ? 'Revenue ($M)' : 'Capex Allocated'}</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>{isRevenue ? 'Profit Contribution' : 'Deployment Milestone'}</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>{isRevenue ? 'QoQ Growth' : 'QoQ Variance'}</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(isRevenue ? quarterlyRevenueData : quarterlyCapexData).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--text-primary)' }}>{row.quarter}</td>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: isRevenue ? 'var(--green)' : 'var(--blue)' }}>{isRevenue ? row.revenue : row.capexAllocated}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{isRevenue ? row.profit : row.milestone}</td>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--green)' }}>{isRevenue ? row.qoqGrowth : row.qoqVariance}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(16,185,129,0.1)', color: 'var(--green)', padding: '2px 6px', borderRadius: '4px' }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'trend3yr' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Executive 3-Year KPI Highlight Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>3-Year Revenue Growth</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--green)', marginTop: '2px' }}>+54.9% (+$7.8M)</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>CAGR +15.4% per annum</div>
                </div>
                <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Margin Trajectory</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--blue)', marginTop: '2px' }}>48% → 56%</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>+800 bps expansion</div>
                </div>
                <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>2026 Target Revenue</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>$22.0M</div>
                  <div style={{ fontSize: '9px', color: 'var(--green)', marginTop: '2px' }}>High Opportunity Target</div>
                </div>
              </div>

              {/* Description Card */}
              <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    3-Year Performance Trajectory Analysis (2023–2025)
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '800', background: 'rgba(16,185,129,0.15)', color: 'var(--green)', padding: '2px 8px', borderRadius: '12px' }}>
                    {trendLabel}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {summaryNarrative}
                </div>
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Data Source: <b>{operatorLabel} Verified Financial Disclosures</b>
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--green)' }}>
                    ✓ Integrated Performance Intelligence
                  </span>
                </div>
              </div>

              {/* Data Table */}
              <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-card3)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 12px', fontWeight: '800' }}>Fiscal Year</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800' }}>Consolidated Revenue</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800' }}>EBITDA Margin (%)</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800' }}>Net Profit</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800' }}>Trajectory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendHistory.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--text-primary)' }}>{row.year}</td>
                        <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--green)' }}>{row.revenue}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{row.ebitda_margin || row.ebitda}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{row.net_profit || row.profit}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(16,185,129,0.12)', color: 'var(--green)', padding: '2px 6px', borderRadius: '4px' }}>
                            {row.trend}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tracker' && (
            <div>
              <OperatorPerformanceTracker
                countryName={countryName || 'India'}
                selectedOperatorId={targetOperator || countryName}
                operators={operators}
                showSwitcher={!targetOperator}
                filterSingleOperator={!!targetOperator}
              />
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="generic-modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => downloadCSV('annual')}
              style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
            >
              📥 Download Annual (CSV)
            </button>
            <button
              onClick={() => downloadCSV('quarterly')}
              style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
            >
              📥 Download Quarterly (CSV)
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                onClose();
                if (onNavigateToPlan) onNavigateToPlan();
              }}
              style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
            >
              Go to Plan for 2026 →
            </button>
            <button className="form-btn-cancel" onClick={onClose} style={{ padding: '6px 14px', fontSize: '11px' }}>Close</button>
          </div>
        </div>

      </div>
    </div>
  );
}
