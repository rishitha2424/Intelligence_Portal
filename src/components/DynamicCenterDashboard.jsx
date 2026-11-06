import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import CustomerServiceTickets from './CustomerServiceTickets';
import OutstandingAMCTable from './OutstandingAMCTable';
import CompetitorsTable from './CompetitorsTable';
import FinancialReports from './FinancialReports';
import GenericFormModal from './GenericFormModal';
import ProductEditModal from './ProductEditModal';
import PlanEditModal from './PlanEditModal';
import FinancialAnalysisModal from './FinancialAnalysisModal';
import CollapsibleList from './CollapsibleList';
import DashboardHeader from './DashboardHeader';
import CustomerContactsSection from './CustomerContactsSection';
import finData from '../data/operator_financials.json';

const CLUSTER_COLORS = {
  'Frontier': '#E74C3C',
  'Emerging': '#F39C12',
  'Growth': '#1ABC9C',
  'Mature': '#4A90D9',
  'Advanced': '#9B59B6',
  'Mature & Saturated': '#9B59B6',
  'High Growth Exposed': '#F39C12',
  'Roaming Hub': '#1ABC9C',
  'Emerging Opportunity': '#2ECC71',
  'Regulatory Transition': '#7F8C8D',
  'Unknown': '#7F8C8D'
};

const TIER_ORDER = {
  'Advanced': 1, 'Mature & Saturated': 2, 'Mature': 3, 'Growth': 4,
  'High Growth Exposed': 5, 'Emerging Opportunity': 6, 'Roaming Hub': 7,
  'Regulatory Transition': 8, 'Emerging': 9, 'Frontier': 10
};

// Heuristic to map trend strength (Low -> High)
function trendToScore(val) {
  if (!val) return 3;
  const v = String(val).toLowerCase();
  if (v.includes('unstable') || v.includes('high pressure') || v.includes('severe') || v.includes('critical')) return 1;
  if (v.includes('pressure') || v.includes('negative') || v.includes('declining') || v.includes('weak')) return 2;
  if (v.includes('moderate') || v.includes('stable') || v.includes('flat') || v.includes('neutral') || v.includes('marginal') || v.includes('mixed') || v.includes('seasonal')) return 3;
  if (v.includes('strong') || v.includes('positive') || v.includes('growth') || v.includes('growing') || v.includes('healthy')) return 4;
  if (v.includes('advanced') || v.includes('leader') || v.includes('exceptional') || v.includes('dominant')) return 5;
  return 3;
};

const parsePipelineValue = (valStr) => {
  if (!valStr) return 0;
  const match = valStr.match(/\$?([0-9.]+)\s*M/i);
  if (match) {
    return parseFloat(match[1]);
  }
  const cleanNum = parseFloat(valStr.replace(/[^0-9.]/g, ''));
  return isNaN(cleanNum) ? 0 : cleanNum;
};

const getProductValue = (index, totalValStr, numProducts) => {
  const totalVal = parsePipelineValue(totalValStr);
  if (totalVal <= 0) return '$0.0M';
  if (numProducts <= 1) return `$${totalVal.toFixed(1)}M`;

  const sumWeights = (numProducts * (numProducts + 1)) / 2;
  const productWeight = (numProducts - index) / sumWeights;
  const productVal = totalVal * productWeight;
  return `$${productVal.toFixed(1)}M`;
};

export default function DynamicCenterDashboard({
  selectedCountry,
  countryData,
  allCountries,
  metadata,
  getFlagEmoji,
  theme,
  ticketData,
  amcData,
  competitorData,
  accountData,
  isDataLoading,
  activeTab,
  setActiveTab,
  selectedOperator,
  setSelectedOperator,
  setSelectedCountry,
  activeRegion,
  onCloseOverview,
  submissions = [],
  onAddSubmission,
  onExportReport,
  onExportPPT,
  onUpdateAccountData
}) {
  const chartRefs = useRef({});
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [productStates, setProductStates] = useState({});
  const [activeModal, setActiveModal] = useState(null); // null | 'product' | 'plan' | 'genericPlan' | 'history'
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState(''); // 'plan' or 'product'
  const [financialModalOpen, setFinancialModalOpen] = useState(false);
  const [financialModalType, setFinancialModalType] = useState('revenue');

  const renderEditedBadge = (fieldName, section) => {
    if (section?._editedFields?.[fieldName]) {
      return (
        <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--blue)', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.35)', padding: '2px 7px', borderRadius: '20px', marginLeft: '8px', whiteSpace: 'nowrap' }}>
          ✎ Edited
        </span>
      );
    }
    return null;
  };

  const handleFormSubmit = (formData) => {
    if (onAddSubmission) {
      onAddSubmission({
        ...formData,
        type: formType
      });
    }
  };

  const getProductState = (productName) => {
    const key = `${selectedCountry || 'global'}_${selectedOperator || 'none'}_${productName}`;
    const state = productStates[key];
    if (state) return state;

    const usedProducts = accountData?.productSection?.mobileumProducts || [];
    const isUsed = usedProducts.includes(productName);

    return {
      used: isUsed,
      channel: 'Licensed'
    };
  };

  const setProductStateValue = (productName, field, value) => {
    const key = `${selectedCountry || 'global'}_${selectedOperator || 'none'}_${productName}`;
    setProductStates(prev => {
      const currentState = prev[key] || getProductState(productName);
      return {
        ...prev,
        [key]: {
          ...currentState,
          [field]: value
        }
      };
    });
  };

  // Refs for the chart canvases
  const overviewRadarRef = useRef(null);
  const operatorsDoughnutRef = useRef(null);
  const operatorsScatterRef = useRef(null);
  const impactRadarRef = useRef(null);
  const impactWaterfallRef = useRef(null);
  const productsBarRef = useRef(null);
  const statsBubbleRef = useRef(null);

  // Panel ref for scroll reset
  const panelRef = useRef(null);

  // Reset sub-tab and scroll position of the panel when active tab, country, or operator changes
  useEffect(() => {
    setActiveSubTab('profile');
  }, [selectedCountry, selectedOperator]);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [activeTab, selectedCountry]);

  // Handle Chart rendering when activeTab, selectedCountry, or selectedOperator changes
  useEffect(() => {
    if (!countryData) return;

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

    const opData = selectedOperator ? (countryData.operators || []).find(o => o.operator === selectedOperator) : null;

    const getOpRadar = (op) => {
      const outbound = trendToScore(op.outbound_roaming);
      const inbound = trendToScore(op.inbound_roaming);
      const ott = trendToScore(op.ott_intl_calls);
      const arpu = trendToScore(op.arpu_growth);
      const fiveG = op.fiveG_pct || 0;
      const subGrowth = op.subscriber_growth_pct || 0;

      return {
        roaming_opportunity: (outbound + inbound) / 2,
        fraud_risk: ott,
        fiveG_upsell: Math.min(fiveG / 20, 5),
        arpu_pressure: 5 - arpu + 1,
        subscriber_growth: Math.min(subGrowth / 3 + 1, 5),
        regulatory_risk: trendToScore(op.regulation_impact || op.regulations || 'moderate')
      };
    };

    const r = opData ? getOpRadar(opData) : countryData.radar;

    // ─── OVERVIEW TAB CHARTS ───
    if (activeTab === 'overview') {
      const canvas = overviewRadarRef.current;
      if (canvas && r) {
        const ctx = canvas.getContext('2d');
        chartRefs.current['overview_radar'] = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['Roaming Opp.', 'Fraud Risk', '5G Upsell', 'ARPU Pressure', 'Sub Growth', 'Regulatory'],
            datasets: [{
              label: selectedOperator || selectedCountry || countryData.country || 'Overview',
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
      const ops = (countryData.operators || []).filter(o => o.market_share_pct);
      const doughnutCanvas = operatorsDoughnutRef.current;
      if (doughnutCanvas && ops.length) {
        const ctx = doughnutCanvas.getContext('2d');
        chartRefs.current['operators_doughnut'] = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ops.map(o => o.operator),
            datasets: [{
              data: ops.map(o => parseFloat(o.market_share_pct) || 0),
              backgroundColor: ops.map((o, idx) => {
                if (selectedOperator) {
                  return o.operator === selectedOperator
                    ? ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 6]
                    : 'rgba(200, 200, 200, 0.15)';
                }
                return ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 6];
              }),
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

      const sOps = (countryData.operators || []).filter(o => o.revenue_growth_score && o.sub_base_mln);
      const scatterCanvas = operatorsScatterRef.current;
      if (scatterCanvas && sOps.length) {
        const ctx = scatterCanvas.getContext('2d');
        chartRefs.current['operators_scatter'] = new Chart(ctx, {
          type: 'bubble',
          data: {
            datasets: sOps.map((o, i) => {
              const isSel = selectedOperator ? o.operator === selectedOperator : true;
              const baseColor = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 5];
              return {
                label: o.operator,
                data: [{
                  x: parseFloat(o.market_share_pct) || 0,
                  y: o.revenue_growth_score,
                  r: Math.max(5, Math.min(20, (o.sub_base_mln || 1) / 30))
                }],
                backgroundColor: isSel ? baseColor + 'CC' : 'rgba(200, 200, 200, 0.15)',
                borderColor: isSel ? baseColor : 'rgba(200, 200, 200, 0.3)',
              };
            })
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
    if (activeTab === 'account' && activeSubTab === 'impact') {
      const radarCanvas = impactRadarRef.current;
      if (radarCanvas && r) {
        const ctx = radarCanvas.getContext('2d');
        const regAvg = countryData.regional_averages;

        chartRefs.current['impact_radar'] = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['Roaming Opp.', 'Fraud Risk', '5G Upsell', 'ARPU Pressure', 'Sub Growth', 'Regulatory Risk'],
            datasets: [
              {
                label: selectedOperator || selectedCountry || countryData.country || 'Overview',
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

      const getOpWaterfall = (op) => {
        const outbound = trendToScore(op.outbound_roaming);
        const inbound = trendToScore(op.inbound_roaming);
        const roamIntensity = (outbound + inbound) / 2;
        const ott = op.ott_score || trendToScore(op.ott_intl_calls);
        const arpu = op.arpu_growth_score || trendToScore(op.arpu_growth);
        const profit = op.profitability_score || trendToScore(op.profitability);
        const fiveG = op.fiveG_pct || 0;

        const base = 100;
        const ott_impact = -(ott - 2) * 2.0;
        const arpu_impact = -(3 - arpu) * 1.5;
        const churn_impact = -(3 - profit) * 1.2;
        const roaming_upside = roamIntensity * 1.8;
        const fiveG_upside = (fiveG / 100) * 8.0;
        const net = base + ott_impact + arpu_impact + churn_impact + roaming_upside + fiveG_upside;

        return {
          base,
          ott_substitution: Math.round(ott_impact * 10) / 10,
          arpu_compression: Math.round(arpu_impact * 10) / 10,
          churn_pressure: Math.round(churn_impact * 10) / 10,
          roaming_upside: Math.round(roaming_upside * 10) / 10,
          fiveG_upside: Math.round(fiveG_upside * 10) / 10,
          net: Math.round(net * 10) / 10
        };
      };

      const wf = opData ? getOpWaterfall(opData) : countryData.waterfall;
      const wfCanvas = impactWaterfallRef.current;
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
            animation: {
              onComplete: (context) => {
                const chart = context.chart;
                const ctx = chart.ctx;
                ctx.font = '10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#333';
                chart.data.datasets.forEach((dataset, i) => {
                  const meta = chart.getDatasetMeta(i);
                  meta.data.forEach((bar, index) => {
                    const data = rawVals[index];
                    const text = `${data >= 0 ? '+' : ''}${data}%`;
                    ctx.fillText(text, bar.x, bar.y - 5);
                  });
                });
              }
            },
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
    if (activeTab === 'account' && activeSubTab === 'products') {
      const products = countryData.product_ranking || [];
      const barCanvas = productsBarRef.current;
      if (barCanvas && products.length) {
        const ctx = barCanvas.getContext('2d');
        chartRefs.current['products_bar'] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: products.map(p => (p.product || '').replace('–', '-').substring(0, 22)),
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
        .filter(([_, cv]) => countryData.region === 'Global' || cv.region === countryData.region)
        .slice(0, 40);
      const bubbleCanvas = statsBubbleRef.current;
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
  }, [selectedCountry, countryData, activeTab, activeSubTab, theme]);

  useEffect(() => {
    setActiveModal(null);
  }, [selectedCountry, selectedOperator]);

  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e) => {
    const top = e.target.scrollTop;
    if (top > 30) {
      if (!isScrolled) setIsScrolled(true);
    } else if (top < 10) {
      if (isScrolled) setIsScrolled(false);
    }
  };

  useEffect(() => {
    setIsScrolled(false);
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [activeTab, selectedCountry, selectedOperator]);

  if (!countryData) return null;

  const handleModalSave = (sectionName, newData) => {
    const currentSection = accountData[sectionName] || {};
    const newSection = newData[sectionName] || {};

    Object.keys(newSection).forEach(fieldName => {
      if (JSON.stringify(currentSection[fieldName]) !== JSON.stringify(newSection[fieldName])) {
        fetch('/api/save-override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            countryId: selectedCountry,
            operatorId: selectedOperator || 'Global',
            section: sectionName,
            fieldName,
            value: newSection[fieldName],
            updatedBy: 'Local User',
            baselineValue: currentSection[fieldName]
          })
        }).catch(err => console.error("Failed to save override", err));
      }
    });

    onUpdateAccountData(selectedCountry, newData);
  };

  const clr = CLUSTER_COLORS[countryData.cluster_name] || '#4A90D9';

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

  return (
    <div className={`dynamic-center-panel ${isScrolled ? 'is-scrolled' : ''}`}>
      {/* Dynamic Sticky Header Container using shared DashboardHeader */}
      <div className={`dynamic-header-wrapper ${isScrolled ? 'is-scrolled' : ''}`}>
        <DashboardHeader
          selectedCountry={selectedCountry}
          selectedOperator={selectedOperator}
          countryData={countryData}
          activeRegion={activeRegion}
          isScrolled={isScrolled}
          getFlagEmoji={getFlagEmoji}
          setSelectedCountry={setSelectedCountry}
          setSelectedOperator={setSelectedOperator}
          onExportReport={onExportReport}
          onExportPPT={onExportPPT}
          onCloseOverview={onCloseOverview}
        />
      </div>

      {/* Scrollable Container for Tab Contents */}
      <div className="dynamic-center-content" ref={panelRef} onScroll={handleScroll}>

        {/* ── TAB: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="tab-content active" style={{ padding: '12px 0 0 0', display: 'block' }}>
            <div style={{ padding: '0 0 12px 0' }}>
              <span
                className="cluster-tag"
                style={{
                  background: `${clr}22`,
                  color: clr,
                  border: `1px solid ${clr}44`,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontWeight: '600',
                  fontSize: '11px'
                }}
              >
                ◈ {countryData.cluster_name}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '12px' }}>
                {metadata.cluster_definitions?.[countryData.cluster_name] || ''}
              </span>
            </div>

            {countryData.anomaly_text && (
              <div className="anomaly-box" style={{ padding: '12px', borderRadius: '10px' }}>
                <div className="anomaly-icon" style={{ fontSize: '16px' }}>⚠</div>
                <div style={{ fontSize: '12px', lineHeight: '1.5' }}>{countryData.anomaly_text}</div>
              </div>
            )}

            <div className="responsive-grid-12" style={{ marginTop: '10px' }}>
              {countryData.top_product && (
                <div className="section" style={{ marginBottom: '0' }}>
                  <div className="section-title">Primary Strategic Recommendation</div>
                  <div className="product-card top" style={{ padding: '16px', borderRadius: '12px' }}>
                    <div className="product-top-badge" style={{ padding: '3px 10px', fontSize: '10px' }}>★ #1 RECOMMENDED FIT</div>
                    <div className="product-name" style={{ fontSize: '16px', marginTop: '6px' }}>{countryData.top_product.product}</div>
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
                    <div className="product-reason" style={{ fontSize: '11px', marginTop: '8px' }}>{countryData.top_product.reason}</div>
                  </div>
                </div>
              )}

              <div className="chart-wrap" style={{ margin: '0' }}>
                <div className="chart-title">Impact Dimensions Overview</div>
                <div className="chart-canvas-wrap" style={{ height: '200px' }}>
                  <canvas ref={overviewRadarRef} id="overview_radar"></canvas>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: OPERATORS ── */}
        {activeTab === 'operators' && (
          <div className="tab-content active" style={{ padding: '12px 0 0 0', display: 'block' }}>

            {/* Heatmap displayed first */}
            <div className="section">
              <div className="heatmap-wrap" style={{ border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-card)', padding: '16px' }}>
                <div className="section-title" style={{ marginBottom: '16px' }}>Operator Performance Heatmap (Click any row for details)</div>
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
                      </tr>
                    </thead>
                    <tbody>
                      {(countryData.operators || []).map((op, idx) => {
                        const cells = [
                          { val: op.sub_base_mln, fmt: v => v ? v + 'M' : '—', score: null },
                          { val: op.fiveG_pct, fmt: v => v !== null ? v + '%' : '—', score: op.fiveG_pct },
                          { val: op.subscriber_growth_pct, fmt: v => v !== null ? v + '%' : '—', score: (op.subscriber_growth_pct || 0) + 5 },
                          { val: op.arpu_growth_score, fmt: () => op.arpu_growth || '—', score: op.arpu_growth_score * 20 },
                          { val: op.revenue_growth_score, fmt: () => op.revenue_growth || '—', score: op.revenue_growth_score * 20 },
                          { val: op.profitability_score, fmt: () => op.profitability || '—', score: op.profitability_score * 20 },
                          { val: op.outbound_roaming_score, fmt: () => op.outbound_roaming || '—', score: op.outbound_roaming_score * 20 },
                          { val: op.inbound_roaming_score, fmt: () => op.inbound_roaming || '—', score: op.inbound_roaming_score * 20 },
                        ];

                        const isSelected = selectedOperator === op.operator;

                        return (
                          <tr
                            key={idx}
                            style={{ cursor: 'pointer', background: isSelected ? 'rgba(37, 99, 235, 0.15)' : '' }}
                            onClick={() => {
                              setSelectedOperator(op.operator);
                              setActiveTab('account');
                            }}
                          >
                            <td className="hm-op-name" style={{ borderLeft: isSelected ? '4px solid var(--blue)' : '' }}>
                              <div className="op-name" style={{ fontSize: '11px' }}>{op.operator}</div>
                              <div className="op-sub">
                                {op.prepaid_postpaid || ''}
                                {(!selectedCountry && op.countryName) ? ` • ${op.countryName}` : ''}
                              </div>
                            </td>
                            {cells.map((cell, cidx) => {
                              const sc = cell.score;
                              const bg = sc === null ? '' : hmColor(sc);
                              const textClr = sc !== null && sc < 20 ? '#fff' : 'var(--text-primary)';
                              return (
                                <td
                                  key={cidx}
                                  style={{
                                    background: bg,
                                    color: textClr,
                                    fontWeight: sc !== null ? '600' : 'normal',
                                    padding: '8px'
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

            {/* Dynamic Click Details Panel for selectedOperator */}
            {selectedOperator && (() => {
              const filteredAMC = amcData.filter(row => {
                const client = row.client_name.toLowerCase();
                const op = selectedOperator.toLowerCase();
                return client.includes(op) || op.includes(client);
              });

              const getCustomVersus = (compName, opName) => {
                switch (compName.toLowerCase()) {
                  case 'syniverse':
                    return `At ${opName}, Syniverse has legacy clearing connectivity, but Mobileum's modern AI Steering of Roaming (SoR) and Roaming DNA offer advanced QoE analytics and real-time steering.`;
                  case 'tomia':
                    return `Tomia focuses on basic settlement margins. Mobileum offers integrated signaling firewall security and eSIM testing, protecting ${opName} from bypass losses.`;
                  case 'subex':
                    return `Subex has legacy assurance deployments. Mobileum's RAID 9 SaaS-ready platform provides faster detection of bypass and SIM-box fraud for ${opName}.`;
                  case 'bics':
                    return `BICS is a routing partner but competes on active testing. Mobileum Universal Active Roaming Testing provides superior QoS assurance for ${opName}.`;
                  default:
                    return `Mobileum offers superior SaaS-ready analytics and real-time active intelligence compared to traditional vendor solutions.`;
                }
              };

              return (
                <div className="operator-click-details-panel" style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px',
                  margin: '20px 0',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                  animation: 'fadeIn 0.25s ease-out'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      {selectedOperator} — Financial Contracts (AMC) & Competitors
                    </h4>
                    <button
                      onClick={() => setSelectedOperator(null)}
                      style={{
                        background: 'var(--bg-card2)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}
                    >
                      ✕ Close details
                    </button>
                  </div>

                  <div className="responsive-grid-21">
                    {/* Column 1: AMC Contracts */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Outstanding AMC Contracts
                      </div>
                      {filteredAMC.length > 0 ? (
                        <div style={{ overflowX: 'auto', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px' }}>
                          <table className="op-table" style={{ width: '100%' }}>
                            <thead>
                              <tr>
                                <th>Contract ID</th>
                                <th>Business Unit</th>
                                <th style={{ textAlign: 'right' }}>Value</th>
                                <th>Due Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredAMC.map(row => (
                                <tr key={row.contract_id}>
                                  <td style={{ fontFamily: 'monospace', fontWeight: '700' }}>{row.contract_id}</td>
                                  <td>
                                    <span style={{ background: 'var(--bg-card3)', color: 'var(--text-primary)', padding: '1px 4px', borderRadius: '3px', fontSize: '9px' }}>
                                      {row.business_unit}
                                    </span>
                                  </td>
                                  <td style={{ fontWeight: '700', color: 'var(--text-primary)', textAlign: 'right' }}>
                                    ${row.outstanding_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </td>
                                  <td style={{ color: 'var(--text-muted)' }}>{row.due_date}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                          No outstanding AMC contracts found for {selectedOperator} in this market.
                        </div>
                      )}
                    </div>

                    {/* Column 2: Competitor Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Active Competitors & Mobileum Edge
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                        {competitorData.map(comp => (
                          <div key={comp.name} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', fontSize: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{comp.name}</strong>
                              <span style={{
                                fontSize: '8px',
                                fontWeight: '700',
                                background: comp.category.toLowerCase().includes('direct') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                color: comp.category.toLowerCase().includes('direct') ? 'var(--red)' : 'var(--blue-light)',
                                padding: '1px 6px',
                                borderRadius: '10px'
                              }}>
                                {comp.category}
                              </span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                              <strong>Key offering:</strong> {comp.key_offerings}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px', borderTop: '1px dashed var(--border)', paddingTop: '2px' }}>
                              <strong>Mobileum Edge:</strong> {getCustomVersus(comp.name, selectedOperator)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Charts displayed below Heatmap */}
            <div className="responsive-grid-2" style={{ marginBottom: '20px' }}>
              <div className="chart-wrap">
                <div className="chart-title">Market Share Distribution</div>
                <div style={{ height: '180px' }}>
                  <canvas ref={operatorsDoughnutRef} id="operators_doughnut"></canvas>
                </div>
              </div>
              <div className="chart-wrap">
                <div className="chart-title">Revenue Index vs Share Bubble Chart</div>
                <div style={{ height: '180px' }}>
                  <canvas ref={operatorsScatterRef} id="operators_scatter"></canvas>
                </div>
              </div>
            </div>

            {/* Individual profiles displayed at the bottom (Task #8: Collapsible Top 4 + More pattern) */}
            <div className="section" style={{ marginTop: '20px' }}>
              <div className="section-title">Individual Operator Profiles (Click card for details)</div>
              <CollapsibleList
                items={countryData.operators || []}
                initialCount={4}
                moreLabel="More operator profiles"
                listStyle={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}
                renderItem={(op, idx) => {
                  const capexText = op.capex_investment !== 'nan' ? op.capex_investment : '—';
                  const isSelected = selectedOperator === op.operator;
                  return (
                    <div
                      className="product-card"
                      key={idx}
                      style={{
                        margin: '0',
                        cursor: 'pointer',
                        borderColor: isSelected ? 'var(--blue)' : 'var(--border)',
                        borderWidth: isSelected ? '2px' : '1px',
                        background: isSelected ? 'rgba(37, 99, 235, 0.05)' : ''
                      }}
                      onClick={() => {
                        setSelectedOperator(op.operator);
                        setActiveTab('account');
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div className="product-name" style={{ fontSize: '14px' }}>{op.operator}</div>
                          <div className="product-cat">
                            {op.sub_base_mln ? op.sub_base_mln + 'M subs · ' : ''}
                            {op.market_share_pct || '?'}% share
                          </div>
                        </div>
                        <div
                          className="score-circle"
                          style={{
                            borderColor: getBadgeColor(op.profitability_score * 20).border,
                            backgroundColor: getBadgeColor(op.profitability_score * 20).bg,
                            color: getBadgeColor(op.profitability_score * 20).text,
                            width: '44px',
                            height: '44px',
                            flexDirection: 'column',
                            gap: '2px'
                          }}
                        >
                          <div style={{ fontSize: '13px' }}>{op.profitability_score}/5</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>HLTH</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                        <div>5G: <strong style={{ color: 'var(--text-primary)' }}>{op.fiveG_pct !== null ? op.fiveG_pct + '%' : '—'}</strong></div>
                        <div>ARPU: <strong style={{ color: 'var(--text-primary)' }}>{op.arpu_growth || '—'}</strong></div>
                        <div>Sub Growth: <strong style={{ color: 'var(--text-primary)' }}>{op.subscriber_growth_pct !== null ? op.subscriber_growth_pct + '%' : '—'}</strong></div>
                        <div>Capex: <strong style={{ color: 'var(--text-primary)' }}>{capexText.length > 25 ? capexText.substring(0, 22) + '…' : capexText}</strong></div>
                        <div>Outbound: <strong style={{ color: 'var(--text-primary)' }}>{(op.outbound_roaming || '—').substring(0, 15)}</strong></div>
                        <div>Top Routes: <strong style={{ color: 'var(--text-primary)' }}>{(op.top_roaming_countries || '—').substring(0, 20)}</strong></div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        )}

        {/* ── TAB: IMPACT ── */}
        {activeTab === 'account' && (
          <div className="tab-content active" style={{ padding: '0', display: 'block' }}>
            {accountData ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>

                {/* Nested Sub-navigation Bar */}
                <div id="sub-panel-tabs" style={{
                  display: 'flex',
                  gap: '6px',
                  borderBottom: '1px solid var(--border)',
                  padding: '6px 20px 6px 20px',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--bg-card)',
                  zIndex: 10,
                  flexShrink: 0
                }}>
                  {[
                    { key: 'profile', label: 'Account Profile' },
                    { key: 'impact', label: 'Impact Analysis' },
                    { key: 'products', label: 'Product Fit' },
                    { key: 'support', label: 'Support & AMC' },
                    { key: 'competitors', label: 'Competitors' },
                    { key: 'plan2026', label: 'Plan for 2026' }
                  ].map(subTab => (
                    <button
                      key={subTab.key}
                      className={`tab-btn sm ${activeSubTab === subTab.key ? 'active' : ''}`}
                      onClick={() => setActiveSubTab(subTab.key)}
                      style={{ padding: '4px 10px', fontSize: '10px' }}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>

                {activeSubTab === 'profile' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.25s ease-out', padding: '8px 12px' }}>
                    {/* Index Navigation Jump Bar */}
                    <div style={{
                      background: 'var(--bg-card2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      marginBottom: '2px'
                    }}>
                      {/* Quick Jump Bar */}
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center',
                        overflowX: 'auto'
                      }} className="hide-scrollbar">
                        <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px' }}>
                          Jump To:
                        </span>
                        {[
                          { id: 'product-section', label: 'Product Section' },
                          { id: 'financial-section', label: 'Financial Section' },
                          { id: 'renewal-section', label: 'Renewal Section' },
                          { id: 'customer-contacts-section', label: 'Customer Contacts' },
                          { id: 'health-section', label: 'Health of Solution' }
                        ].map(sec => (
                          <button
                            key={sec.id}
                            onClick={() => {
                              const el = document.getElementById(sec.id);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }}
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border)',
                              borderRadius: '20px',
                              padding: '4px 12px',
                              fontSize: '10px',
                              fontWeight: '600',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.15s ease',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = 'var(--blue)';
                              e.currentTarget.style.color = 'var(--blue)';
                              e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                              e.currentTarget.style.background = 'var(--bg-card)';
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--blue)' }}></span>
                            {sec.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Product Section */}
                    <div id="product-section" className="section" style={{ scrollMarginTop: '60px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', margin: '0 0 8px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                      {/* Navigation Breadcrumb & Back Action */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => {
                              if (setSelectedOperator) setSelectedOperator(null);
                              if (setActiveTab) setActiveTab('operators');
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
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            ← Back to Operator List
                          </button>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--blue)' }}>Product & Competitive Intelligence</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setActiveModal('history')}
                            className="form-trigger-btn"
                            style={{ background: 'var(--bg-card2)', color: 'var(--text-secondary)', padding: '4px 10px', fontSize: '10px' }}
                          >
                            History
                          </button>
                          <button
                            onClick={() => setActiveModal('product')}
                            className="form-trigger-btn"
                            disabled={isDataLoading}
                            style={{ opacity: isDataLoading ? 0.5 : 1, cursor: isDataLoading ? 'not-allowed' : 'pointer', padding: '4px 10px', fontSize: '10px' }}
                          >
                            Form
                          </button>
                        </div>
                      </div>

                      {/* 1. SECTION GROUPING: PRODUCTS LANDSCAPE TILE */}
                      <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Products Landscape</span>
                          <span style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)' }}>Mobileum vs Market Competitors</span>
                        </div>

                        {(() => {
                          const mobProds = accountData.productSection?.mobileumProducts || [];
                          const compProds = accountData.productSection?.competitionProducts || [];
                          const repComps = accountData.productSection?.replaceableCompetitors || [];

                          const mobCount = mobProds.length;
                          const compCount = compProds.length;
                          const repCount = repComps.length;

                          // Dynamic content-aware column ratio computation:
                          // Gives more horizontal space to tiles carrying heavier catalogs,
                          // while clamping so smaller tiles remain readable and don't collapse.
                          const w1 = Math.max(0.85, 0.85 + Math.sqrt(mobCount) * 0.75);
                          const w2 = Math.max(0.65, 0.65 + (compCount > 0 ? Math.sqrt(compCount) * 0.6 : 0));
                          const w3 = Math.max(0.70, 0.70 + Math.sqrt(repCount) * 0.7);
                          const totalW = w1 + w2 + w3;
                          const fr1 = Math.max(0.85, (w1 / totalW) * 3).toFixed(2);
                          const fr2 = Math.max(0.55, (w2 / totalW) * 3).toFixed(2);
                          const fr3 = Math.max(0.65, (w3 / totalW) * 3).toFixed(2);

                          return (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: `minmax(240px, ${fr1}fr) minmax(160px, ${fr2}fr) minmax(160px, ${fr3}fr)`,
                              gap: '10px',
                              alignItems: 'stretch'
                            }}>
                              {/* Tile 1: Mobileum Products */}
                              <div style={{ background: 'var(--bg-card3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>Mobileum Products</span>
                                  <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--blue)', background: 'rgba(37, 99, 235, 0.1)', padding: '1px 6px', borderRadius: '10px', marginLeft: 'auto' }}>
                                    {mobCount}
                                  </span>
                                  {renderEditedBadge('mobileumProducts', accountData.productSection)}
                                </div>
                                {mobCount > 0 ? (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {mobProds.map(item => (
                                      <span key={item} style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--blue)', border: '1px solid rgba(37, 99, 235, 0.2)', borderRadius: '5px', padding: '3px 7px', fontSize: '10px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 2px' }}>
                                    No products assigned
                                  </div>
                                )}
                              </div>

                              {/* Tile 2: Competition Products */}
                              <div style={{ background: 'var(--bg-card3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>Competition Products</span>
                                  <span style={{ fontSize: '9px', fontWeight: '700', color: '#b45309', background: 'rgba(245, 158, 11, 0.15)', padding: '1px 6px', borderRadius: '10px', marginLeft: 'auto' }}>
                                    {compCount}
                                  </span>
                                  {renderEditedBadge('competitionProducts', accountData.productSection)}
                                </div>
                                {compCount > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {compProds.map((item, idx) => {
                                      const name = typeof item === 'object' ? (item.name || '') : String(item);
                                      const isSelected = typeof item === 'object' ? item.selected !== false : true;
                                      return (
                                        <div
                                          key={idx}
                                          style={{
                                            fontSize: '10px',
                                            fontWeight: '700',
                                            color: isSelected ? '#b45309' : 'var(--red)',
                                            background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                                            border: `1px solid ${isSelected ? 'rgba(245, 158, 11, 0.35)' : 'rgba(239, 68, 68, 0.25)'}`,
                                            borderRadius: '6px',
                                            padding: '5px 8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '6px'
                                          }}
                                        >
                                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                                          <div
                                            style={{
                                              width: '15px',
                                              height: '15px',
                                              borderRadius: '4px',
                                              border: `1.5px solid ${isSelected ? '#b45309' : 'var(--red)'}`,
                                              background: isSelected ? '#b45309' : 'transparent',
                                              color: '#ffffff',
                                              fontSize: '10px',
                                              fontWeight: '900',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              flexShrink: 0
                                            }}
                                          >
                                            {isSelected ? '✓' : ''}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 2px' }}>
                                    None recorded
                                  </div>
                                )}
                              </div>

                              {/* Tile 3: Competitors to Replace */}
                              <div style={{ background: 'var(--bg-card3)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>Competitors to Replace</span>
                                  <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--red)', background: 'rgba(239, 68, 68, 0.1)', padding: '1px 6px', borderRadius: '10px', marginLeft: 'auto' }}>
                                    {repCount}
                                  </span>
                                  {renderEditedBadge('replaceableCompetitors', accountData.productSection)}
                                </div>
                                {repCount > 0 ? (
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: repCount > 5 ? 'repeat(auto-fill, minmax(85px, 1fr))' : '1fr',
                                    gap: '5px'
                                  }}>
                                    {repComps.map((item, idx) => {
                                      const raw = typeof item === 'object' ? (item.name || item.text || '') : String(item || '');
                                      const shortName = raw.includes('—') ? raw.split('—')[0].trim() : raw.includes('-') ? raw.split('-')[0].trim() : raw.split(' ')[0].trim();
                                      return (
                                        <div
                                          key={idx}
                                          style={{
                                            background: 'rgba(239, 68, 68, 0.08)',
                                            color: 'var(--red)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            borderRadius: '5px',
                                            padding: '4px 7px',
                                            fontSize: '9.5px',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                          }}
                                          title={raw}
                                        >
                                          <span style={{ fontSize: '10px', color: 'var(--red)', flexShrink: 0 }}>•</span>
                                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{shortName}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 2px' }}>
                                    None identified
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* 2. STRATEGIC SALES ANGLE & RISK ASSESSMENT TILE (Placed directly below Products Landscape!) */}
                      <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                          <span>Strategic Sales Angle & Risk Assessment</span>
                          <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '3px 8px', fontSize: '9px', fontWeight: '700' }}>
                            {accountData.productSection?.salesAngle?.panicRisk || 'High Panic Services Risk — Urgent Bypass / Revenue Leakage Exposure'}
                          </span>
                        </div>

                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          {accountData.productSection?.salesAngle?.narrative || `Target competitive replacement of legacy competitor systems with Mobileum AI Steering and Active Testing.`}
                        </div>

                        {/* 3 Sub-Tiles: Dynamically proportioned based on counts */}
                        {(() => {
                          const repComps = accountData.productSection?.replaceableCompetitors || [];
                          const productGaps = accountData.productSection?.productGaps || [];
                          const managedServ = accountData.productSection?.managedServicesPossibility || [];

                          const sc1 = repComps.length;
                          const sc2 = productGaps.length;
                          const sc3 = managedServ.length;

                          // Dynamic weighting formula
                          const sw1 = Math.max(0.7, 0.7 + Math.sqrt(sc1) * 0.85);
                          const sw2 = Math.max(0.7, 0.7 + Math.sqrt(sc2) * 0.75);
                          const sw3 = Math.max(0.7, 0.7 + Math.sqrt(sc3) * 0.75);
                          const sTotal = sw1 + sw2 + sw3;
                          const sFr1 = Math.max(0.65, (sw1 / sTotal) * 3).toFixed(2);
                          const sFr2 = Math.max(0.65, (sw2 / sTotal) * 3).toFixed(2);
                          const sFr3 = Math.max(0.65, (sw3 / sTotal) * 3).toFixed(2);

                          return (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: `minmax(180px, ${sFr1}fr) minmax(150px, ${sFr2}fr) minmax(150px, ${sFr3}fr)`,
                              gap: '10px',
                              alignItems: 'stretch'
                            }}>
                              {/* Sub-tile 1: Competitors to Replace */}
                              <div style={{ background: 'var(--bg-card3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>Competitors to Replace</span>
                                  <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--red)', background: 'rgba(239, 68, 68, 0.1)', padding: '1px 5px', borderRadius: '10px', marginLeft: 'auto' }}>
                                    {sc1}
                                  </span>
                                  {renderEditedBadge('replaceableCompetitors', accountData.productSection)}
                                </div>
                                {sc1 > 0 ? (
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: sc1 > 5 ? 'repeat(auto-fill, minmax(85px, 1fr))' : '1fr',
                                    gap: '4px'
                                  }}>
                                    {repComps.map((item, idx) => {
                                      const raw = typeof item === 'object' ? (item.name || item.text || '') : String(item || '');
                                      const shortName = raw.includes('—') ? raw.split('—')[0].trim() : raw.includes('-') ? raw.split('-')[0].trim() : raw.split(' ')[0].trim();
                                      return (
                                        <div
                                          key={idx}
                                          style={{
                                            background: 'rgba(239, 68, 68, 0.08)',
                                            color: 'var(--red)',
                                            border: '1px solid rgba(239, 68, 68, 0.18)',
                                            borderRadius: '4px',
                                            padding: '3px 6px',
                                            fontSize: '9.5px',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                          }}
                                          title={raw}
                                        >
                                          <span style={{ fontSize: '10px', color: 'var(--red)', flexShrink: 0 }}>•</span>
                                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{shortName}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                                    None identified
                                  </div>
                                )}
                              </div>

                              {/* Sub-tile 2: Product Gaps Proposed Solution */}
                              <div style={{ background: 'var(--bg-card3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>Product Gaps Proposed Solution</span>
                                  <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-secondary)', background: 'rgba(100, 116, 139, 0.12)', padding: '1px 5px', borderRadius: '10px', marginLeft: 'auto' }}>
                                    {sc2}
                                  </span>
                                  {renderEditedBadge('productGaps', accountData.productSection)}
                                </div>
                                {sc2 > 0 ? (
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: sc2 > 5 ? 'repeat(auto-fill, minmax(130px, 1fr))' : '1fr',
                                    gap: '5px'
                                  }}>
                                    {productGaps.map((item, idx) => (
                                      <div key={idx} style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>•</span> {item}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                                    None identified
                                  </div>
                                )}
                              </div>

                              {/* Sub-tile 3: Managed Services */}
                              <div style={{ background: 'var(--bg-card3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>Managed Services</span>
                                  <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--blue)', background: 'rgba(37, 99, 235, 0.1)', padding: '1px 5px', borderRadius: '10px', marginLeft: 'auto' }}>
                                    {sc3}
                                  </span>
                                  {renderEditedBadge('managedServicesPossibility', accountData.productSection)}
                                </div>
                                {sc3 > 0 ? (
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: sc3 > 5 ? 'repeat(auto-fill, minmax(130px, 1fr))' : '1fr',
                                    gap: '5px'
                                  }}>
                                    {managedServ.map((item, idx) => (
                                      <div key={idx} style={{ fontSize: '10px', color: 'var(--blue)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ color: 'var(--blue)', fontWeight: 'bold' }}>•</span> {item}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                                    None identified
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* 3. STRATEGY PLACEMENT & FIX FORM BUTTON (Placed after Strategic Sales Angle!) */}
                      <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Final Strategies & Execution Roadmap
                            {renderEditedBadge('finalStrategies', accountData.productSection)}
                          </div>
                          <button
                            onClick={() => setActiveModal('product')}
                            style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: '5px', padding: '4px 10px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            Fix Strategy Form
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(accountData.productSection?.finalStrategies || []).map((item, idx) => {
                            const text = typeof item === 'object' ? (item.text || '') : item;
                            const rtp = typeof item === 'object' && item.rtpStatus ? item.rtpStatus : 'NOT REQUESTED';
                            const eng = typeof item === 'object' && item.engagementType ? item.engagementType : 'PRODUCT';
                            return (
                              <div key={idx} className="strategy-row" style={{ background: 'var(--bg-card3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                                  • {text}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                                  <span className={`chip-rtp chip-rtp-${rtp.replace(/\s+/g, '').toLowerCase()}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                                    {rtp.toUpperCase()}
                                  </span>
                                  <span className="badge-engagement" style={{ fontSize: '9px', padding: '2px 6px' }}>{eng.toUpperCase()}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 4. FULL PLAN INTEGRATION (Plan for 2026 Quick View Tile) */}
                      {accountData.plan2026 && (
                        <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--blue)', textTransform: 'uppercase' }}>
                              Full 2026 Strategic Plan Integration
                            </span>
                            <button
                              onClick={() => setActiveSubTab('plan2026')}
                              style={{ background: 'var(--blue)', border: 'none', color: '#fff', borderRadius: '6px', padding: '5px 12px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.2)' }}
                            >
                              View Full 2026 Plan →
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-primary)' }}>
                            <div><strong>Pipeline Value:</strong> {accountData.plan2026.valueOfOpportunities}</div>
                            <div><strong>Trial Status:</strong> {accountData.plan2026.consultingTrialsGiven}</div>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            <strong>Product Focus Areas:</strong> {(accountData.plan2026.productsFocusedOn || []).join(', ')}
                          </div>
                        </div>
                      )}

                      {/* Dynamic Product Submissions Section */}
                      {(() => {
                        const currentProductSubmissions = (submissions || []).filter(sub =>
                          sub.type === 'product' &&
                          sub.country === (selectedCountry || 'Global') &&
                          sub.operator === (selectedOperator || 'Global')
                        );
                        if (currentProductSubmissions.length === 0) return null;
                        return (
                          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                            <h4 style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                              Submitted Product Requests ({currentProductSubmissions.length})
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                              {currentProductSubmissions.map(sub => (
                                <div key={sub.id} className="submission-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', position: 'relative' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: '700', color: 'var(--blue-light)' }}>{sub.companyName}</span>
                                    <span>{sub.timestamp}</span>
                                  </div>
                                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
                                    {sub.name} <span style={{ fontWeight: '400', color: 'var(--text-muted)', fontSize: '10px' }}>({sub.email})</span>
                                  </div>
                                  {sub.phone && (
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                      📞 {sub.phone}
                                    </div>
                                  )}
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'var(--bg-card3)', padding: '6px', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                                    {sub.requirements}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Financial Section */}
                    <div id="financial-section" className="section" style={{ scrollMarginTop: '90px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', margin: '0 0 10px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--teal)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Financial Section
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        <div
                          className="product-card"
                          onClick={() => {
                            setFinancialModalType('revenue');
                            setFinancialModalOpen(true);
                          }}
                          style={{
                            padding: '10px 12px',
                            margin: 0,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            background: 'rgba(16, 185, 129, 0.04)'
                          }}
                          title="Click to view full Revenue & Profit Analysis Dashboard & CSV export"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>1. Profit / Revenue Potential</div>
                            <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--green)', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>Analysis & Export</span>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--green)', marginTop: '4px' }}>
                            {accountData.financialSection?.profit || '—'}
                          </div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
                            Click for Annual & Quarterly reports →
                          </div>
                        </div>

                        <div
                          className="product-card"
                          onClick={() => {
                            setFinancialModalType('capex');
                            setFinancialModalOpen(true);
                          }}
                          style={{
                            padding: '10px 12px',
                            margin: 0,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            border: '1px solid rgba(37, 99, 235, 0.3)',
                            background: 'rgba(37, 99, 235, 0.04)'
                          }}
                          title="Click to view full Capex Investment Analysis Dashboard & CSV export"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>2. Capex Investment</div>
                            <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--blue)', background: 'rgba(37, 99, 235, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>Analysis & Export</span>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--blue)', marginTop: '4px' }}>
                            {accountData.financialSection?.capexInvestment || '—'}
                          </div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
                            Click for Annual & Quarterly reports →
                          </div>
                        </div>

                        <div className="product-card" style={{ padding: '10px 12px', margin: 0, cursor: 'default', gridColumn: '1 / -1' }}>
                          <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>3. Strategic Notes & Outlook (xxxx)</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                            {accountData.financialSection?.note || '—'}
                          </div>
                        </div>

                        {/* Live Investor Results & 3-Year Web Intelligence Banner */}
                        {(() => {
                          const FIN = finData || { groups: {}, operator_to_group: {} };
                          const targetName = selectedOperator || accountData?.name || (typeof selectedCountry === 'object' ? selectedCountry?.country_name : selectedCountry) || 'Operator';
                          const grpKey = FIN.operator_to_group ? FIN.operator_to_group[targetName] : null;
                          let gObj = grpKey && FIN.groups ? FIN.groups[grpKey] : null;
                          if (!gObj && FIN.groups) {
                            const low = String(targetName).toLowerCase();
                            for (const [k, v] of Object.entries(FIN.groups)) {
                              if (low.includes(k.toLowerCase()) || k.toLowerCase().includes(low)) {
                                gObj = v;
                                break;
                              }
                            }
                          }
                          const opLabel = gObj?.group || targetName;
                          const rawTrendLabel = gObj?.performance_trend_3yr?.label || 'PERFORMANCE GOING UP';
                          const trendLabel = rawTrendLabel.replace(/[📈📉📊🟢]/g, '').trim();
                          const summaryText = gObj?.performance_trend_3yr?.summary || `Integrates direct web-scraped investor reports & quarterly disclosures for ${opLabel}.`;

                          return (
                            <div
                              className="product-card"
                              style={{
                                padding: '10px 14px',
                                margin: 0,
                                gridColumn: '1 / -1',
                                background: 'rgba(59, 130, 246, 0.05)',
                                border: '1px solid rgba(59, 130, 246, 0.25)',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '10px'
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span>3-Year Investor & Financial Performance Intelligence ({opLabel})</span>
                                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--green)', padding: '2px 7px', borderRadius: '4px', fontSize: '9px', fontWeight: '800' }}>
                                    {trendLabel}
                                  </span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                                  {summaryText}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--green)', padding: '5px 10px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '700' }}>
                                  ✓ Verified Disclosures
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Renewal Section */}
                    <div id="renewal-section" className="section" style={{ scrollMarginTop: '90px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', margin: '0 0 10px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--purple)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Renewal Section
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                            1. AMC Renewal List
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(accountData.renewalSection?.amcRenewal || []).map((item, idx) => (
                              <div key={idx} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.name}</span>
                                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--green)' }}>{item.value}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Status:</span>
                                  <span style={{
                                    fontSize: '9px',
                                    fontWeight: '700',
                                    background: item.status.toLowerCase().includes('due') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    color: item.status.toLowerCase().includes('due') ? 'var(--yellow)' : 'var(--green)',
                                    padding: '1px 6px',
                                    borderRadius: '4px'
                                  }}>
                                    {item.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {(!accountData.renewalSection?.amcRenewal || accountData.renewalSection.amcRenewal.length === 0) && (
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No AMC renewals listed.</div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                            2. Managed Services Renewal
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(accountData.renewalSection?.managedServicesRenewal || []).map((item, idx) => (
                              <div key={idx} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.name}</span>
                                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--green)' }}>{item.value}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Status:</span>
                                  <span style={{
                                    fontSize: '9px',
                                    fontWeight: '700',
                                    background: item.status.toLowerCase().includes('ready') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                                    color: item.status.toLowerCase().includes('ready') ? 'var(--green)' : 'var(--blue)',
                                    padding: '1px 6px',
                                    borderRadius: '4px'
                                  }}>
                                    {item.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {(!accountData.renewalSection?.managedServicesRenewal || accountData.renewalSection.managedServicesRenewal.length === 0) && (
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No managed services renewals listed.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Contacts Section */}
                    <CustomerContactsSection
                      selectedOperator={selectedOperator}
                      selectedCountry={selectedCountry}
                      accountData={accountData}
                    />

                    {/* Health of Solution Section */}
                    <div id="health-section" className="section" style={{ scrollMarginTop: '90px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', margin: '0 0 10px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--red)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Health of Solution Section
                        {accountData.healthSection?.customerHealth && (
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#059669', background: '#d1fae5', border: '1px solid #34d399', padding: '2px 7px', borderRadius: '20px', marginLeft: '8px' }}>✓ SOURCED DATA (Health)</span>
                        )}
                      </div>

                      {accountData.healthSection?.customerHealth && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                          <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Overall Health Score</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '24px', fontWeight: '900', color: accountData.healthSection.customerHealth.summary.status === 'Green' ? '#059669' : accountData.healthSection.customerHealth.summary.status === 'Amber' ? '#D97706' : '#DC2626' }}>
                                {Math.round(accountData.healthSection.customerHealth.summary.health || 0)}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', background: accountData.healthSection.customerHealth.summary.status === 'Green' ? 'rgba(5, 150, 105, 0.15)' : accountData.healthSection.customerHealth.summary.status === 'Amber' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(220, 38, 38, 0.15)', color: accountData.healthSection.customerHealth.summary.status === 'Green' ? '#059669' : accountData.healthSection.customerHealth.summary.status === 'Amber' ? '#D97706' : '#DC2626' }}>
                                {accountData.healthSection.customerHealth.summary.status}
                              </span>
                            </div>
                          </div>
                          <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Health Breakdown</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span>Behavioral</span>
                                <span style={{ fontWeight: '700', color: Math.round(accountData.healthSection.customerHealth.summary.behavioral || 0) >= 80 ? '#059669' : Math.round(accountData.healthSection.customerHealth.summary.behavioral || 0) >= 50 ? '#D97706' : '#DC2626' }}>
                                  {Math.round(accountData.healthSection.customerHealth.summary.behavioral || 0)}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span>Financial</span>
                                <span style={{ fontWeight: '700', color: Math.round(accountData.healthSection.customerHealth.summary.financial || 0) >= 80 ? '#059669' : Math.round(accountData.healthSection.customerHealth.summary.financial || 0) >= 50 ? '#D97706' : '#DC2626' }}>
                                  {Math.round(accountData.healthSection.customerHealth.summary.financial || 0)}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span>Sentiment</span>
                                <span style={{ fontWeight: '700', color: Math.round(accountData.healthSection.customerHealth.summary.sentiment || 0) >= 80 ? '#059669' : Math.round(accountData.healthSection.customerHealth.summary.sentiment || 0) >= 50 ? '#D97706' : '#DC2626' }}>
                                  {Math.round(accountData.healthSection.customerHealth.summary.sentiment || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Top Factors Impacting Score</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {(accountData.healthSection.customerHealth.reasons || []).map((r, i) => (
                                <div key={i} style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>• {r}</div>
                              ))}
                              {(!accountData.healthSection.customerHealth.reasons || accountData.healthSection.customerHealth.reasons.length === 0) && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No major negative factors identified.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                            1. Installed Product-wise Support Tickets
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(!accountData.healthSection?.installedProductWiseSupportTicket || accountData.healthSection.installedProductWiseSupportTicket.length === 0) && (
                               <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px' }}>No recent support tickets found.</div>
                            )}
                            {(accountData.healthSection?.installedProductWiseSupportTicket || []).map((item, idx) => (
                              <div key={idx} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.product}</span>
                                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--red)' }}>{item.tickets} Tickets</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Trend:</span>
                                  <span style={{
                                    fontSize: '9px',
                                    fontWeight: '700',
                                    color: item.trend.toLowerCase().includes('improving') ? 'var(--green)' : item.trend.toLowerCase().includes('stable') ? 'var(--blue)' : 'var(--yellow)'
                                  }}>
                                    {item.trend}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                            2. Usage of Installed Products
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(!accountData.healthSection?.usageOfInstalledProducts || accountData.healthSection.usageOfInstalledProducts.length === 0) && (
                               <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px' }}>No product usage data found.</div>
                            )}
                            {(accountData.healthSection?.usageOfInstalledProducts || []).map((item, idx) => (
                              <div key={idx} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.product}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                                  {item.usage}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
                {activeSubTab === 'impact' && (
                  <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
                    <div className="responsive-grid-2" style={{ marginBottom: '20px' }}>
                      <div className="chart-wrap">
                        <div className="chart-title">Impact Radar — Country vs Regional Average</div>
                        <div className="chart-canvas-wrap" style={{ height: '240px' }}>
                          <canvas ref={impactRadarRef} id="impact_radar"></canvas>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '10px' }}>
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
                        <div className="chart-canvas-wrap" style={{ height: '240px' }}>
                          <canvas ref={impactWaterfallRef} id="impact_waterfall"></canvas>
                        </div>
                      </div>
                    </div>

                    <div className="responsive-grid-21">
                      <div className="section" style={{ marginBottom: 0 }}>
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', height: '100%', boxSizing: 'border-box' }}>
                          <div className="section-title" style={{ marginBottom: '16px' }}>Seasonal Roaming Calendar</div>
                          <div className="cal-grid" style={{ gap: '4px' }}>
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
                                    fontWeight: intensity >= 3 ? '600' : 'normal',
                                    padding: '8px 2px'
                                  }}
                                  title={`${m}: ${['No data', 'Minimal', 'Low', 'Moderate', 'High', 'Peak'][intensity] || 'Normal'} roaming`}
                                >
                                  {m}
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                            {['No data', 'Minimal', 'Moderate', 'High', 'Peak'].map((l, i) => {
                              const c = ['var(--bg-card3)', 'var(--bg-card3)', '#1e4080', '#1a5276', '#1abc9c'][i];
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--text-muted)' }} key={l}>
                                  <div style={{ width: '8px', height: '8px', background: c, borderRadius: '2px' }}></div>
                                  {l}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="section" style={{ marginBottom: 0 }}>
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', height: '100%', boxSizing: 'border-box' }}>
                          <div className="section-title" style={{ marginBottom: '16px' }}>Impact Analysis Dimensions</div>
                          {(() => {
                            const dims = [
                              { label: 'Outbound Roaming Impact', key: 'ia_outbound_impact' },
                              { label: 'Inbound Roaming Impact', key: 'ia_inbound_impact' },
                              { label: 'ARPU Impact', key: 'ia_arpu_impact' },
                              { label: 'App/OTT Substitution', key: 'ia_apps' },
                              { label: 'Revenue Growth Outlook', key: 'ia_rev_growth' },
                              { label: 'Profitability Outlook', key: 'ia_profitability' }
                            ];

                            const op0 = (countryData.operators && countryData.operators[0]) || {};
                            return dims.map(d => {
                              const val = op0[d.key] || '—';
                              const score = trendToScore(val);
                              const barClr = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#10b981'][score - 1] || '#3b82f6';
                              if (val === '—' || val === 'nan' || val === '') return null;
                              return (
                                <div key={d.key} style={{ marginBottom: '8px' }}>
                                  <div className="percentile-row" style={{ marginBottom: '2px' }}>
                                    <div className="perc-label" style={{ fontSize: '10px' }}>{d.label}</div>
                                    <div className="perc-bar" style={{ height: '4px' }}>
                                      <div className="perc-fill" style={{ width: `${(score / 5) * 100}%`, background: barClr }}></div>
                                    </div>
                                    <div className="perc-value" style={{ color: barClr, fontSize: '10px' }}>{score}/5</div>
                                  </div>
                                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: '128px' }}>
                                    {val.substring(0, 120)}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeSubTab === 'products' && (
                  <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
                    <div className="responsive-grid-12">
                      <div className="chart-wrap">
                        <div className="chart-title">Product Fit Score — All Mobileum Solutions</div>
                        <div className="chart-canvas-wrap" style={{ height: '260px' }}>
                          <canvas ref={productsBarRef} id="products_bar"></canvas>
                        </div>
                      </div>

                      <div className="section">
                        <div className="section-title">Priority Recommendations</div>
                        {(countryData.product_ranking || []).slice(0, 3).map((p, i) => {
                          const isTop = i === 0;
                          const barClr = p.score > 75 ? '#10b981' : p.score > 50 ? '#f59e0b' : '#3b82f6';
                          return (
                            <div className={`product-card ${isTop ? 'top' : ''}`} key={p.product} style={{ padding: '10px 12px' }}>
                              {isTop ? (
                                <div className="product-top-badge">★ #1 BEST FIT</div>
                              ) : (
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                                  #{i + 1} RECOMMENDED
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="product-name" style={{ fontSize: '12px' }}>{p.product}</div>
                                <div className="score-circle" style={{ borderColor: barClr, color: barClr, width: '28px', height: '28px', fontSize: '9px' }}>
                                  {p.score}
                                </div>
                              </div>
                              <div className="product-reason" style={{ fontSize: '10px', marginTop: '4px' }}>{p.reason}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="section" style={{ marginTop: '20px' }}>
                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                        <div className="section-title" style={{ marginBottom: '16px' }}>Full Product Ranking Table</div>
                        <div style={{ overflowX: 'auto' }}>
                          <table className="op-table" style={{ width: '100%' }}>
                            <thead>
                              <tr>
                                <th style={{ width: '40px' }}>#</th>
                                <th>Product</th>
                                <th style={{ width: '100px' }}>Score</th>
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
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div className="score-bar-bg" style={{ width: '50px', height: '4px' }}>
                                          <div className="score-bar-fill" style={{ width: `${p.score}%`, background: barClr, height: '100%' }}></div>
                                        </div>
                                        <span style={{ fontSize: '10px', fontWeight: '600', color: barClr }}>
                                          {p.score}
                                        </span>
                                      </div>
                                    </td>
                                    <td style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                      {p.reason}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeSubTab === 'support' && (
                  <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
                    <CustomerServiceTickets ticketData={ticketData} isLoading={isDataLoading} />
                    <OutstandingAMCTable amcData={amcData} isLoading={isDataLoading} />
                  </div>
                )}
                {activeSubTab === 'competitors' && (
                  <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
                    <CompetitorsTable competitorData={competitorData} />
                  </div>
                )}
                {activeSubTab === 'plan2026' && (
                  <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
                    {/* Navigation Back Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => setActiveSubTab('profile')}
                          style={{
                            background: 'var(--blue)',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '6px',
                            padding: '5px 12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 6px rgba(37,99,235,0.2)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                        >
                          ← Back to Account Profile
                        </button>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/</span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>Full 2026 Strategic Plan</span>
                      </div>
                      <button
                        onClick={() => {
                          if (setSelectedOperator) setSelectedOperator(null);
                          if (setActiveTab) setActiveTab('operators');
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '10px',
                          fontWeight: '600',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        ← Back to Operator List
                      </button>
                    </div>

                    {accountData?.plan2026 ? (
                      <div className="section" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--blue)', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <div>
                            <span>Mobileum 2026 Strategic Plan</span>
                            {accountData.productSection?.finalStrategies && (
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal', marginTop: '4px' }}>
                                RTP Status: {
                                  (() => {
                                    const strats = accountData.productSection.finalStrategies;
                                    const granted = strats.filter(s => s.rtpStatus === 'Granted').length;
                                    const pending = strats.filter(s => s.rtpStatus === 'Pending').length;
                                    return `${granted} Granted, ${pending} Pending`;
                                  })()
                                }
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setActiveModal('history')}
                              className="form-trigger-btn"
                              style={{ background: 'var(--bg-card2)', color: 'var(--text-secondary)' }}
                            >
                              History
                            </button>
                            <button
                              onClick={() => {
                                setActiveModal('plan');
                              }}
                              className="form-trigger-btn"
                              disabled={isDataLoading}
                              style={{ opacity: isDataLoading ? 0.5 : 1, cursor: isDataLoading ? 'not-allowed' : 'pointer' }}
                            >
                              Form
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {/* Recommended Products Table */}
                          <div>
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                              <div className="section-title" style={{ marginBottom: '16px' }}>
                                Recommended Products & Revenue Distribution
                                {renderEditedBadge('productsFocusedOn', accountData.plan2026)}
                              </div>
                              <div style={{ overflowX: 'auto' }}>
                                <table className="op-table" style={{ width: '100%' }}>
                                  <thead>
                                    <tr>
                                      <th style={{ width: '160px' }}>MOBILEUM PRODUCT USED</th>
                                      <th>PRODUCT NAME</th>
                                      <th style={{ width: '120px' }}>VALUE</th>
                                      <th style={{ width: '180px' }}>TYPE OF CHANNEL</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(accountData.plan2026.productsFocusedOn || []).map((product, idx) => {
                                      const state = getProductState(product);
                                      const val = getProductValue(idx, accountData.plan2026.valueOfOpportunities, (accountData.plan2026.productsFocusedOn || []).length);
                                      return (
                                        <tr key={product} style={{ borderBottom: idx === (accountData.plan2026.productsFocusedOn || []).length - 1 ? 'none' : '1px solid var(--border)', transition: 'background 0.2s' }}>
                                          <td style={{ padding: '10px 12px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                                              <input
                                                type="checkbox"
                                                checked={state.used}
                                                onChange={(e) => setProductStateValue(product, 'used', e.target.checked)}
                                                style={{
                                                  width: '15px',
                                                  height: '15px',
                                                  accentColor: 'var(--blue)',
                                                  cursor: 'pointer'
                                                }}
                                              />
                                              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Used</span>
                                            </label>
                                          </td>
                                          <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                            {product}
                                          </td>
                                          <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--green)' }}>
                                            {val}
                                          </td>
                                          <td style={{ padding: '10px 12px' }}>
                                            <div className="custom-select-wrapper">
                                              <select
                                                value={state.channel}
                                                onChange={(e) => setProductStateValue(product, 'channel', e.target.value)}
                                                className="custom-channel-select"
                                              >
                                                <option value="Licensed">Licensed</option>
                                                <option value="Mobileum Service">Mobileum Service</option>
                                              </select>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          {/* 2. Total Opportunities Value */}
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                              Total Value of Opportunities
                              {renderEditedBadge('valueOfOpportunities', accountData.plan2026)}
                            </div>
                            <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', display: 'inline-block' }}>
                              <strong style={{ fontSize: '15px', color: 'var(--green)' }}>{accountData.plan2026.valueOfOpportunities}</strong>
                            </div>
                          </div>

                          {/* 3. PoC or demo given */}
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                              PoC or Demo Delivered
                              {renderEditedBadge('pocOrDemoGiven', accountData.plan2026)}
                            </div>
                            <div className="product-card" style={{ padding: '12px 16px', margin: 0, cursor: 'default', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', borderRadius: '8px', background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                              {accountData.plan2026.pocOrDemoGiven}
                            </div>
                          </div>

                          {/* 4. Consulting trials given */}
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                              Consulting Trials Given & Next Steps
                              {renderEditedBadge('consultingTrialsGiven', accountData.plan2026)}
                            </div>
                            <div className="product-card hoverable-card" style={{ padding: '12px 16px', margin: 0, cursor: 'default', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', borderRadius: '8px', background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                              {accountData.plan2026.consultingTrialsGiven}
                            </div>
                          </div>

                          {/* 5. New Fields if they exist */}
                          {accountData.plan2026.winProbability && (
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                                Win Probability (%)
                                {renderEditedBadge('winProbability', accountData.plan2026)}
                              </div>
                              <div className="product-card hoverable-card" style={{ padding: '12px 16px', margin: 0, cursor: 'default', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', borderRadius: '8px', background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                                {accountData.plan2026.winProbability}
                              </div>
                            </div>
                          )}
                          {accountData.plan2026.weightedPipelineValue && (
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                                Weighted Pipeline Value
                                {renderEditedBadge('weightedPipelineValue', accountData.plan2026)}
                              </div>
                              <div className="product-card hoverable-card" style={{ padding: '12px 16px', margin: 0, cursor: 'default', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', borderRadius: '8px', background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                                {accountData.plan2026.weightedPipelineValue}
                              </div>
                            </div>
                          )}
                          {accountData.plan2026.quarterlyMilestoneBreakdown && (
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                                Quarterly Milestone Breakdown
                                {renderEditedBadge('quarterlyMilestoneBreakdown', accountData.plan2026)}
                              </div>
                              <div className="product-card hoverable-card" style={{ padding: '12px 16px', margin: 0, cursor: 'default', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', borderRadius: '8px', background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                                {accountData.plan2026.quarterlyMilestoneBreakdown}
                              </div>
                            </div>
                          )}
                          {accountData.plan2026.topTargetAccounts?.length > 0 && (
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                                Top Target Accounts
                                {renderEditedBadge('topTargetAccounts', accountData.plan2026)}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {accountData.plan2026.topTargetAccounts.map(item => (
                                  <span key={item} className="target-account-tag">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Plan Submissions Section for populated case */}
                          {(() => {
                            const currentPlanSubmissions = (submissions || []).filter(sub =>
                              sub.type === 'plan' &&
                              sub.country === (selectedCountry || 'Global') &&
                              sub.operator === (selectedOperator || 'Global')
                            );
                            if (currentPlanSubmissions.length === 0) return null;
                            return (
                              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                                <h4 style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                                  Submitted 2026 Plan Requests ({currentPlanSubmissions.length})
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                                  {currentPlanSubmissions.map(sub => (
                                    <div key={sub.id} className="submission-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', position: 'relative' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: '700', color: 'var(--blue-light)' }}>{sub.companyName}</span>
                                        <span>{sub.timestamp}</span>
                                      </div>
                                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                        {sub.name} <span style={{ fontWeight: '400', color: 'var(--text-muted)', fontSize: '11px' }}>({sub.email})</span>
                                      </div>
                                      {sub.phone && (
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                          📞 {sub.phone}
                                        </div>
                                      )}
                                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-card3)', padding: '8px', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                                        {sub.requirements}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="section" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--blue)', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span>2026 Strategic Plan</span>
                          <button
                            onClick={() => {
                              setFormType('plan');
                              setFormTitle('Submit 2026 Plan Details');
                              setActiveModal('genericPlan');
                            }}
                            className="form-trigger-btn"
                            disabled={isDataLoading}
                            style={{ opacity: isDataLoading ? 0.5 : 1, cursor: isDataLoading ? 'not-allowed' : 'pointer' }}
                          >
                            📝 Form
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>No 2026 plan details are available for this account yet.</div>

                        {/* Plan Submissions Section for empty case */}
                        {(() => {
                          const currentPlanSubmissions = (submissions || []).filter(sub =>
                            sub.type === 'plan' &&
                            sub.country === (selectedCountry || 'Global') &&
                            sub.operator === (selectedOperator || 'Global')
                          );
                          if (currentPlanSubmissions.length === 0) return null;
                          return (
                            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                              <h4 style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                                Submitted 2026 Plan Requests ({currentPlanSubmissions.length})
                              </h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                                {currentPlanSubmissions.map(sub => (
                                  <div key={sub.id} className="submission-card" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                      <span style={{ fontWeight: '700', color: 'var(--blue-light)' }}>{sub.companyName}</span>
                                      <span>{sub.timestamp}</span>
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                      {sub.name} <span style={{ fontWeight: '400', color: 'var(--text-muted)', fontSize: '11px' }}>({sub.email})</span>
                                    </div>
                                    {sub.phone && (
                                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                        📞 {sub.phone}
                                      </div>
                                    )}
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-card3)', padding: '8px', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                                      {sub.requirements}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Render Financial Reports below the Strategic Plan */}
                    <FinancialReports
                      operator={selectedOperator || selectedCountry || 'Global Market'}
                      country={selectedCountry}
                      operators={countryData?.operators}
                      operatorSelected={!!selectedOperator}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="section"><div className="section-title">Account insights</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No account insight is available for this market yet.</div></div>
            )}
          </div>
        )}

        {/* ── TAB: STATS PROFILE ── */}
        {activeTab === 'stats' && (
          <div className="tab-content active" style={{ padding: '12px 0 0 0', display: 'block' }}>
            <div className="responsive-grid-2">
              <div className="section" style={{ marginBottom: 0 }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                  <div className="section-title" style={{ marginBottom: '16px' }}>Position vs Region Peers Bubble Chart</div>
                  <div style={{ flex: 1, position: 'relative', minHeight: '220px' }}>
                    <canvas ref={statsBubbleRef} id="stats_bubble" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}></canvas>
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'center' }}>
                    X: Mobile Penetration · Y: GDP Growth · Size: Population · Color: Cluster
                  </div>
                </div>
              </div>

              <div className="section" style={{ marginBottom: 0 }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
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
                      { label: '5G Penetration (avg)', key: 'avg_5g', val: countryData.stats?.avg_5g, unit: '%', src: 'GSMA 2024' }
                    ];

                    return percMetrics.map(m => {
                      const perc = p[m.key];
                      if (perc === null || perc === undefined) return null;
                      const barClr = perc > 75 ? '#10b981' : perc > 50 ? '#3b82f6' : perc > 25 ? '#f59e0b' : '#ef4444';
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }} key={m.key}>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', width: '130px', flexShrink: 0, textAlign: 'left' }}>
                            {m.label}
                          </div>
                          <div className="perc-bar" style={{ flex: 1, height: '4px', background: 'var(--bg-card3)', borderRadius: '2px' }}>
                            <div className="perc-fill" style={{ width: `${perc}%`, background: barClr, height: '100%', borderRadius: '2px' }}></div>
                          </div>
                          <div style={{ fontSize: '9px', color: 'var(--text-primary)', fontWeight: '600', width: '70px', textAlign: 'right', flexShrink: 0 }}>
                            {typeof m.val === 'number' ? m.val.toFixed(0) + (m.unit === 'USD' ? ' USD' : '%') : '—'}
                          </div>
                          <div style={{ fontSize: '9px', fontWeight: '600', color: barClr, width: '30px', textAlign: 'right', flexShrink: 0 }}>
                            {perc}th
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
              {(() => {
                const peers = Object.entries(allCountries)
                  .filter(([k, cv]) => cv.cluster_name === countryData.cluster_name && k !== selectedCountry)
                  .slice(0, 4);

                if (peers.length > 0) {
                  return (
                    <div className="section" style={{ marginBottom: 0 }}>
                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                        <div className="section-title" style={{ marginBottom: '16px' }}>Cluster Peers — {countryData.cluster_name}</div>
                        <div style={{ overflowX: 'auto' }}>
                          <table className="op-table" style={{ width: '100%' }}>
                            <thead>
                              <tr>
                                <th>Country</th>
                                <th>Pen%</th>
                                <th>5G%</th>
                                <th>GDP Gr%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {peers.map(([pName, pv]) => (
                                <tr key={pName}>
                                  <td className="op-name" style={{ fontSize: '11px' }}>{getFlagEmoji(pv.iso)} {pName}</td>
                                  <td>{pv.mobile_penetration_pct?.toFixed(0) || '—'}%</td>
                                  <td>{pv.stats?.avg_5g?.toFixed(0) || '—'}%</td>
                                  <td>{pv.gdp_growth_pct?.toFixed(1) || '—'}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}

              <div className="section" style={{ marginBottom: 0 }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="section-title" style={{ marginBottom: '16px' }}>Fraud Risk Decomposition</div>
                  {(() => {
                    const op0 = (countryData.operators && countryData.operators[0]) || {};
                    const fraudDims = [
                      { label: 'OTT/App Substitution', score: op0.ott_score || 3 },
                      { label: 'Outbound Roaming', score: op0.outbound_roaming_score || 3 },
                      { label: 'Inbound Attack Surface', score: op0.inbound_roaming_score || 3 },
                      { label: 'Regulatory Gap', score: op0.regulatory_risk || 3 }
                    ];

                    const totalFraud = fraudDims.reduce((a, d) => a + d.score, 0);
                    const maxFraud = fraudDims.length * 5;
                    const fraudPct = Math.round((totalFraud / maxFraud) * 100);
                    const color = fraudPct > 70 ? 'var(--red)' : fraudPct > 50 ? 'var(--yellow)' : 'var(--green)';

                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, padding: '10px 0' }}>
                        <div style={{ textAlign: 'center', width: '80px', flexShrink: 0, paddingRight: '20px', borderRight: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '26px', fontWeight: '800', color }}>
                            {fraudPct}%
                          </div>
                          <div style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>
                            Index
                          </div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                          {fraudDims.map(d => {
                            const w = (d.score / 5) * 100;
                            const c = d.score >= 4 ? 'var(--red)' : d.score >= 3 ? 'var(--yellow)' : 'var(--green)';
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} key={d.label}>
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', width: '130px', flexShrink: 0, textAlign: 'left' }}>
                                  {d.label}
                                </div>
                                <div className="perc-bar" style={{ flex: 1, height: '4px', background: 'var(--bg-card3)', borderRadius: '2px' }}>
                                  <div className="perc-fill" style={{ width: `${w}%`, background: c, height: '100%', borderRadius: '2px' }}></div>
                                </div>
                                <div style={{ fontSize: '9px', fontWeight: '600', color: c, width: '20px', textAlign: 'right', flexShrink: 0 }}>
                                  {d.score}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: NARRATIVE REPORT ── */}
        {activeTab === 'narrative' && (
          <div className="tab-content active" style={{ padding: '12px 0 0 0', display: 'block' }}>
            {(() => {
              const op0 = (countryData.operators && countryData.operators[0]) || {};
              const isYoung = countryData.avg_age < 30;
              const isAging = countryData.avg_age > 42;
              const isHighGDP = countryData.gdp_per_capita_usd > 20000;
              const is5GLeader = (countryData.stats?.avg_5g || 0) > 60;
              const is5GLagging = (countryData.stats?.avg_5g || 0) < 15;
              const isRoamingHub = countryData.cluster_name.includes('Roaming Hub');
              const isFrontier = countryData.cluster_name === 'Frontier Market';
              const highFraud = countryData.stats?.fraud_score > 3.5;
              const operatorsStr = (countryData.operators || []).map(o => o.operator).join(', ');
              const topOp = (countryData.operators || []).reduce((a, b) => (a.sub_base_mln || 0) > (b.sub_base_mln || 0) ? a : b, { operator: '—' });
              const fiveGAvg = countryData.stats?.avg_5g?.toFixed(0) || '—';

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="narrative-block" style={{ margin: '0' }}>
                    <h4>Market Overview</h4>
                    <p>
                      <strong>{selectedCountry}</strong> is a{' '}
                      {isHighGDP ? 'high-income' : countryData.gdp_per_capita_usd > 5000 ? 'upper-middle income' : 'emerging market'}{' '}
                      country in the <strong>{countryData.region}</strong> region. With a population of{' '}
                      <strong>{countryData.population_mln ? countryData.population_mln.toFixed(0) + 'M' : '—'}</strong> and{' '}
                      {countryData.mobile_users_mln ? countryData.mobile_users_mln.toFixed(0) + 'M' : '—'} active mobile subscribers (
                      <strong>{countryData.mobile_penetration_pct ? countryData.mobile_penetration_pct.toFixed(0) + '%' : '—'} penetration</strong>
                      ), the market is served by <strong>{countryData.num_operators} operator{countryData.num_operators > 1 ? 's' : ''}</strong> (
                      {operatorsStr}). The dominant player is <strong>{topOp.operator}</strong>{' '}
                      {topOp.sub_base_mln ? `with ${topOp.sub_base_mln}M subscribers` : ''}.
                    </p>
                  </div>

                  <div className="narrative-block" style={{ margin: '0' }}>
                    <h4>Demographic & Digital Behavior</h4>
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

                  <div className="narrative-block" style={{ margin: '0' }}>
                    <h4>5G & Technology Landscape</h4>
                    <p>
                      Average 5G penetration across operators is <strong>{fiveGAvg}%</strong>.{' '}
                      {is5GLeader
                        ? `This is a 5G-advanced market where the eSIM, Steering of Roaming, and Roaming DNA products operate at full capability.`
                        : is5GLagging
                          ? `5G deployment is in early stages. This creates a strong opportunity for Mobileum's 5G Active Testing and Managed Services.`
                          : `5G deployment is progressing, presenting solid upsell opportunities.`}
                    </p>
                  </div>

                  <div className="narrative-block" style={{ margin: '0' }}>
                    <h4>Mobileum Strategic Opportunity</h4>
                    <p>
                      {highFraud && 'Fraud exposure is elevated. RAID 9 with AI-adaptive rules is recommended. '}
                      {isRoamingHub && 'Roaming hub dynamics make Steering of Roaming and Roaming DNA primary value drivers. '}
                      The recommended business model is:{' '}
                      <strong>
                        {op0.ia_recommended_biz_model && op0.ia_recommended_biz_model !== 'nan'
                          ? op0.ia_recommended_biz_model
                          : 'Evaluate based on operator financials'}
                      </strong>
                      .
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Reusable Form Modal */}
      {activeModal === 'genericPlan' && (
        <GenericFormModal
          isOpen={activeModal === 'genericPlan'}
          onClose={() => setActiveModal(null)}
          onSubmit={handleFormSubmit}
          title={formTitle}
        />
      )}
      {activeModal === 'product' && (
        <ProductEditModal
          isOpen={activeModal === 'product'}
          onClose={() => setActiveModal(null)}
          accountData={accountData}
          countryName={selectedCountry}
          onSave={(newData) => handleModalSave('productSection', newData)}
        />
      )}
      {activeModal === 'plan' && (
        <PlanEditModal
          isOpen={activeModal === 'plan'}
          onClose={() => setActiveModal(null)}
          accountData={accountData}
          countryName={selectedCountry}
          onSave={(newData) => handleModalSave('plan2026', newData)}
        />
      )}
      {activeModal === 'history' && (
        <HistoryModal
          isOpen={activeModal === 'history'}
          onClose={() => setActiveModal(null)}
          countryName={selectedCountry}
          operatorName={selectedOperator}
          onRestore={(section, fieldName, valueToRestore) => {
            if (section && fieldName) {
              const currentSectionData = accountData[section] || {};
              const updatedSectionData = { ...currentSectionData, [fieldName]: valueToRestore };
              onUpdateAccountData(selectedCountry, { ...accountData, [section]: updatedSectionData });
            } else {
              onUpdateAccountData(selectedCountry, { ...accountData, _forceRefresh: Date.now() });
            }
          }}
        />
      )}
      {financialModalOpen && (
        <FinancialAnalysisModal
          isOpen={financialModalOpen}
          onClose={() => setFinancialModalOpen(false)}
          type={financialModalType}
          accountData={accountData}
          countryName={selectedCountry}
          selectedOperator={selectedOperator}
          operators={countryData?.operators}
          onNavigateToPlan={() => {
            setActiveTab('account');
            setActiveSubTab('plan2026');
          }}
        />
      )}
    </div>
  );
}
