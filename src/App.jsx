import React, { useState, useEffect, useMemo, useRef } from 'react';
import MapComponent from './components/MapComponent';
import StaticCountrySidebar from './components/StaticCountrySidebar';
import DynamicCenterDashboard from './components/DynamicCenterDashboard';
import ComparisonModal from './components/ComparisonModal';
import { exportReport, getFlagEmoji } from './utils/exportReport';
import { exportPPT } from './utils/exportPPT';
import CountryFlag from './components/CountryFlag';
import masterData from './data/master_telecom.json';
import HealthOverview from './components/HealthOverview';
import HealthDetail from './components/HealthDetail';
import AccountExplorer from './components/AccountExplorer';
import ScoringDocs from './components/ScoringDocs';
import { fetchDataStatus, fetchWhiteSpace, fetchHealthDetail } from './utils/healthApi';
import {
  getKamByCountry,
  getCountriesByKam,
  getKamsByRegion,
  getRegionsByKam,
  getAllKams
} from './data/kamData';

// =====================================================================
// ILLUSTRATIVE / SYNTHETIC SAMPLE DATA — NOT REAL.
// The datasets below (support tickets, AMC contracts, account insights,
// 2026 pipeline values, competitor replace-lists) are demo/sample data.
// They are NOT sourced and do NOT represent real commercial figures —
// per-operator AMC values, ticket counts and pipeline numbers are private
// commercial data that is not publicly available. They are kept purely to
// demonstrate how a real CRM/commercial layer would slot into the dashboard.
// Real, sourced financials live in src/data/operator_financials.json and are
// rendered (group-level, labelled) by FinancialReports.jsx.
// Surface this in any sub-tab that renders the data below with:
//     <span className="sample-badge">{SAMPLE_DATA_NOTICE}</span>
// =====================================================================
export const SAMPLE_DATA_NOTICE = 'Illustrative sample data — not real reported figures';

const MOCK_TICKETS = {
  "Saudi Arabia": {
    "total_tickets": 1420,
    "trend_12_months": [
      { "month": "Jun", "count": 110 }, { "month": "Jul", "count": 125 },
      { "month": "Aug", "count": 95 }, { "month": "Sep", "count": 115 },
      { "month": "Oct", "count": 130 }, { "month": "Nov", "count": 140 },
      { "month": "Dec", "count": 150 }, { "month": "Jan", "count": 120 },
      { "month": "Feb", "count": 110 }, { "month": "Mar", "count": 105 },
      { "month": "Apr", "count": 118 }, { "month": "May", "count": 102 }
    ],
    "business_units": [
      { "unit": "Risk", "tickets": 340, "color": "#7c3aed" },
      { "unit": "Fraud", "tickets": 420, "color": "#ef4444" },
      { "unit": "Roaming Management", "tickets": 280, "color": "#10b981" },
      { "unit": "Network Security", "tickets": 180, "color": "#3b82f6" },
      { "unit": "Customer Intelligence", "tickets": 200, "color": "#ea580c" }
    ]
  },
  "UAE": {
    "total_tickets": 980,
    "trend_12_months": [
      { "month": "Jun", "count": 80 }, { "month": "Jul", "count": 85 },
      { "month": "Aug", "count": 70 }, { "month": "Sep", "count": 90 },
      { "month": "Oct", "count": 95 }, { "month": "Nov", "count": 110 },
      { "month": "Dec", "count": 105 }, { "month": "Jan", "count": 85 },
      { "month": "Feb", "count": 75 }, { "month": "Mar", "count": 80 },
      { "month": "Apr", "count": 95 }, { "month": "May", "count": 110 }
    ],
    "business_units": [
      { "unit": "Risk", "tickets": 220, "color": "#7c3aed" },
      { "unit": "Fraud", "tickets": 310, "color": "#ef4444" },
      { "unit": "Roaming Management", "tickets": 210, "color": "#10b981" },
      { "unit": "Network Security", "tickets": 110, "color": "#3b82f6" },
      { "unit": "Customer Intelligence", "tickets": 130, "color": "#ea580c" }
    ]
  }
};

const MOCK_AMC = {
  "Saudi Arabia": [
    { "contract_id": "AMC-2026-001", "business_unit": "Risk (RAID 9)", "client_name": "STC Saudi Arabia", "outstanding_amount": 400000.00, "due_date": "2026-08-31" },
    { "contract_id": "AMC-2026-002", "business_unit": "Roaming Management", "client_name": "Mobily", "outstanding_amount": 200000.00, "due_date": "2026-07-15" },
    { "contract_id": "AMC-2026-003", "business_unit": "Network Security", "client_name": "Zain KSA", "outstanding_amount": 150000.00, "due_date": "2026-09-30" }
  ],
  "UAE": [
    { "contract_id": "AMC-2026-004", "business_unit": "Roaming DNA", "client_name": "e& UAE", "outstanding_amount": 400000.00, "due_date": "2026-08-15" },
    { "contract_id": "AMC-2026-005", "business_unit": "Fraud (RAID 9)", "client_name": "du", "outstanding_amount": 200000.00, "due_date": "2026-07-01" },
    { "contract_id": "AMC-2026-006", "business_unit": "Customer Intelligence", "client_name": "e& UAE", "outstanding_amount": 300000.00, "due_date": "2026-10-10" }
  ]
};

const MOCK_COMPETITORS = [
  { "name": "Syniverse", "category": "Direct Competitor", "key_offerings": "Data/Financial Clearing, IPX Transport connectivity, and basic Roaming Steering.", "versus_mobileum": "Mobileum dominates in advanced analytics (Active Testing, Roaming DNA), whereas Syniverse is infrastructure-heavy." },
  { "name": "Tomia", "category": "Direct Competitor", "key_offerings": "Clearing and Settlement, Roaming Steering, and Interconnect Optimization.", "versus_mobileum": "Mobileum features advanced signaling firewall security and eSIM, while Tomia focuses on wholesale margins." },
  { "name": "Subex", "category": "Direct Competitor", "key_offerings": "Business & Revenue Assurance, IoT security, and telecom Fraud Management.", "versus_mobileum": "Mobileum RAID 9 platform is highly modern with SaaS capabilities, whereas Subex has legacy deployments." },
  { "name": "BICS", "category": "Partner / Niche", "key_offerings": "International voice/SMS carrier routing, roaming hubs, and network quality testing.", "versus_mobileum": "Mobileum is a software vendor partner; we compete only on roaming active testing lines." }
];

const MOCK_ACCOUNT_INSIGHTS = {
  "Saudi Arabia": {
    productSection: {
      mobileumProducts: ['RAID 9 Fraud Management', 'Roaming DNA', 'Steering of Roaming', '5G Active Testing'],
      competitionProducts: ['Syniverse clearing & transport', 'Tomia roaming steering', 'Subex assurance'],
      productGaps: ['Managed security operations for smaller operators', 'Faster deployment accelerators for legacy stacks'],
      managedServicesPossibility: ['24x7 operations support', 'Fraud analytics tuning', 'Roaming performance managed service'],
      replaceableCompetitors: ['Syniverse', 'Subex'],
      finalStrategies: [
        { text: 'Displace Syniverse clearing footprint at STC and Mobily via Roaming DNA integration', rtpStatus: 'Not Requested', engagementType: 'Product' },
        { text: 'Pitch RAID 9 Fraud Management to Zain KSA to replace legacy Subex assurance stack', rtpStatus: 'Not Requested', engagementType: 'Product' },
        { text: 'Deploy Roaming DNA active steering trials to capture high-value outbound business routes', rtpStatus: 'Not Requested', engagementType: 'Product' }
      ]
    },
    financialSection: {
      profit: '$3.8M annualized revenue potential',
      capexInvestment: '$1.2M in platform enablement and deployment support',
      note: 'High-value upsell path through managed services and roaming assurance.'
    },
    renewalSection: {
      amcRenewal: [
        { name: 'Risk / RAID 9', value: '$420K', status: 'Renewal due in Q3' },
        { name: 'Roaming Management', value: '$210K', status: 'In discussion' }
      ],
      managedServicesRenewal: [
        { name: 'Fraud operations support', value: '$180K', status: 'Renewal ready' },
        { name: 'Roaming analytics service', value: '$160K', status: 'Pilot under review' }
      ]
    },
    healthSection: {
      installedProductWiseSupportTicket: [
        { product: 'RAID 9', tickets: 18, trend: 'Stable' },
        { product: 'Roaming DNA', tickets: 11, trend: 'Improving' },
        { product: '5G Active Testing', tickets: 7, trend: 'Low' }
      ],
      usageOfInstalledProducts: [
        { product: 'RAID 9', usage: '92% of fraud rules active' },
        { product: 'Roaming DNA', usage: '78% of roaming steering workflows used' },
        { product: 'Active Testing', usage: '65% of network test cases in production' }
      ]
    },
    plan2026: {
      productsFocusedOn: ['Steering of Roaming', 'Roaming DNA', 'Managed Fraud Operations'],
      valueOfOpportunities: '$5.4M pipeline in 2026',
      pocOrDemoGiven: 'PoC completed for roaming analytics and fraud rules tuning',
      consultingTrialsGiven: '2 consulting trials and 1 sandbox onboarding workshop'
    }
  },
  "UAE": {
    productSection: {
      mobileumProducts: ['Roaming DNA', 'Fraud Management', 'Customer Intelligence', 'eSIM & OTA'],
      competitionProducts: ['BICS roaming hub', 'Syniverse transport', 'Tomia settlement'],
      productGaps: ['Advanced managed services for legacy roaming workflows', 'Faster rollout for data analytics modules'],
      managedServicesPossibility: ['Managed QA and incident response', 'Roaming performance optimization service'],
      replaceableCompetitors: ['BICS', 'Tomia'],
      finalStrategies: [
        { text: 'Replace BICS roaming hub at e& UAE with Mobileum eSIM solutions and steering systems', rtpStatus: 'Not Requested', engagementType: 'Product' },
        { text: 'Position modern signaling firewall trials at du to address OTT bypass substitution', rtpStatus: 'Not Requested', engagementType: 'Product' },
        { text: 'Initiate eSIM & OTA platform sandbox onboarding workshop to capture digital nomads', rtpStatus: 'Not Requested', engagementType: 'Product' }
      ]
    },
    financialSection: {
      profit: '$2.9M annualized revenue potential',
      capexInvestment: '$0.9M in solution onboarding and integration support',
      note: 'Priority is to convert existing contracts into higher-value managed services.'
    },
    renewalSection: {
      amcRenewal: [
        { name: 'Roaming DNA', value: '$360K', status: 'Renewal in Q4' },
        { name: 'Customer Intelligence', value: '$240K', status: 'Renewal planning' }
      ],
      managedServicesRenewal: [
        { name: 'Advanced analytics support', value: '$150K', status: 'Ready for renewal' },
        { name: 'Network operations advisory', value: '$130K', status: 'Upsell candidate' }
      ]
    },
    healthSection: {
      installedProductWiseSupportTicket: [
        { product: 'Roaming DNA', tickets: 14, trend: 'Moderate' },
        { product: 'Fraud Management', tickets: 10, trend: 'Stable' },
        { product: 'Customer Intelligence', tickets: 8, trend: 'Improving' }
      ],
      usageOfInstalledProducts: [
        { product: 'Fraud Management', usage: '85% of alerts monitored in production' },
        { product: 'Roaming DNA', usage: '70% of steering actions enabled' },
        { product: 'Customer Intelligence', usage: '60% of dashboards actively used' }
      ]
    },
    plan2026: {
      productsFocusedOn: ['Fraud Management', 'Roaming DNA', 'Managed Services'],
      valueOfOpportunities: '$4.1M pipeline in 2026',
      pocOrDemoGiven: 'Demo delivered for active testing and fraud analytics to the account team',
      consultingTrialsGiven: '1 consulting trial and 2 solution workshops'
    }
  }
};

// Development-tier clusters (Frontier -> Advanced), gradient red -> purple.
const CLUSTER_COLORS = {
  'Frontier': '#E74C3C',
  'Emerging': '#F39C12',
  'Growth': '#1ABC9C',
  'Mature': '#4A90D9',
  'Advanced': '#9B59B6',
  // legacy names kept so an older master_telecom.json still colours
  'Mature & Saturated': '#9B59B6',
  'High Growth Exposed': '#F39C12',
  'Roaming Hub': '#1ABC9C',
  'Emerging Opportunity': '#2ECC71',
  'Regulatory Transition': '#7F8C8D',
  'Unknown': '#7F8C8D'
};
const TIER_ORDER = { Frontier: 0, Emerging: 1, Growth: 2, Mature: 3, Advanced: 4 };

const DEFAULT_METADATA = {
  total_countries: 193,
  regions: ["APAC", "Africa", "Europe", "LATAM", "MENA"],
  global_averages: {
    mobile_penetration: 113.7,
    gdp_growth: 2.91,
    avg_age: 30.28,
    avg_5g: 32.18,
    roaming_intensity: 3.51,
    fraud_score: 2.74
  }
};

export default function App() {
  const [loadedCountries, setLoadedCountries] = useState(masterData.countries || {});
  const [metadata, setMetadata] = useState(DEFAULT_METADATA);
  const [globalView, setGlobalView] = useState('market'); // 'market', 'health', 'explorer', 'scoring'
  const [healthSelectedCustomer, setHealthSelectedCustomer] = useState(null);
  const [dataStatus, setDataStatus] = useState(null);

  // Fetch initial metadata and status
  useEffect(() => {
    fetchDataStatus().then(setDataStatus).catch(() => {});
    fetch('/api/get-operator-data?meta=true')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.regions) {
          setMetadata(prev => ({
            ...prev,
            total_countries: data.total_countries || prev.total_countries,
            regions: data.regions.map(r => r === 'MECA' ? 'MENA' : r)
          }));
        }
      })
      .catch(err => console.error("Metadata fetch error:", err));
  }, []);

  const countries = useMemo(() => {
    const result = {};
    Object.entries(loadedCountries).forEach(([name, c]) => {
      result[name] = {
        ...c,
        region: c.region ? c.region.replace(/MECA/g, 'MENA') : c.region,
        sub_region: c.sub_region ? c.sub_region.replace(/MECA/g, 'MENA') : c.sub_region,
        cluster_name: c.cluster_name ? c.cluster_name.replace(/MECA/g, 'MENA') : c.cluster_name
      };
    });
    return result;
  }, [loadedCountries]);

  const buildOperatorInsight = (countryName, op) => {
    if (!op) return null;

    const plan = op.plan2026 || {
      productsFocusedOn: ['Steering of Roaming (SoR)', 'Roaming Campaign Management', 'Roaming DNA'],
      valueOfOpportunities: `$${((op.sub_base_mln || 1.0) * 0.15 + (op.market_share_pct || 20.0) * 0.08 + 1).toFixed(1)}M pipeline`,
      pocOrDemoGiven: 'Demo and solution workshop completed',
      consultingTrialsGiven: '1 consulting trial scheduled',
      strategies: [
        `Introduce Steering of Roaming (SoR) to capture high-margin eSIM/5G roaming opportunities.`,
        `Upsell Roaming Campaign Management Managed Services to offload operations and guarantee revenue assurance.`,
        `Deliver on-site sandbox onboarding workshop for Roaming DNA in Q4 2026.`
      ]
    };

    // 1. Mobileum products: populate from Plan 2026 productsFocusedOn first if present
    const focusProducts = plan.productsFocusedOn || [];
    const parsedProducts = op.mobileum_services_parsed?.length > 0 ? op.mobileum_services_parsed.map(p => p.name) : [];
    const mobileumProducts = Array.from(new Set([...focusProducts, ...parsedProducts])).filter(Boolean);
    if (mobileumProducts.length === 0) {
      mobileumProducts.push('Steering of Roaming (SoR)', 'Roaming Campaign Management', 'Roaming DNA');
    }

    // 2. Competition Products: clearly label Competitor — Specific Product
    let competitionProducts = [];
    if (op.ia_satisfaction && op.ia_satisfaction !== 'nan') {
      const sat = op.ia_satisfaction;
      if (sat.includes('Syniverse')) competitionProducts.push('Syniverse — Roaming Steering & Interconnect');
      else if (sat.includes('Tomia')) competitionProducts.push('Tomia — Data Clearing & Settlement');
      else if (sat.includes('Subex')) competitionProducts.push('Subex — Business & Revenue Assurance');
      else competitionProducts.push(`Syniverse — ${sat}`);
    } else {
      competitionProducts = [
        'Syniverse — Roaming Steering & Interconnect',
        'Tomia — Clearing & Settlement',
        'Subex — Business & Revenue Assurance'
      ];
    }

    // 3. Product Gaps
    const productGaps = op.ia_bu_gaps && op.ia_bu_gaps !== 'nan' && op.ia_bu_gaps !== 'Assess via direct engagement'
      ? op.ia_bu_gaps.split('|').map(s => s.trim())
      : ['Fraud & Bypass Management', 'Revenue Assurance'];

    // 4. Managed Services Possibility: derived from plan2026 & operator capabilities
    const msNeed = op.ia_need_ms_financial?.toLowerCase() || '';
    const managedServicesPossibility = msNeed.includes('high') || msNeed.includes('medium') || (plan.strategies || []).some(s => s.toLowerCase().includes('managed'))
      ? ['Managed Services Transformation', 'SaaS Licensing Migration']
      : ['Full Operations Support', 'Managed Analytics Services'];

    // 5. Replaceable competitors: format as Competitor — Specific Product
    let replaceableCompetitors = [];
    if (op.ia_satisfaction && op.ia_satisfaction !== 'nan') {
      const sat = op.ia_satisfaction;
      if (sat.includes('Syniverse')) replaceableCompetitors.push('Syniverse — Roaming Steering & Interconnect');
      else if (sat.includes('Tomia')) replaceableCompetitors.push('Tomia — Data Clearing & Settlement');
      else if (sat.includes('Subex')) replaceableCompetitors.push('Subex — Business & Revenue Assurance');
      else replaceableCompetitors.push(`${sat.split(' ')[0]} — Legacy Platform`);
    } else {
      replaceableCompetitors = [
        'Syniverse — Roaming Steering & Interconnect',
        'Tomia — Clearing & Settlement',
        'Subex — Business & Revenue Assurance'
      ];
    }

    // 6. Strategic Sales Angle & Panic Services Risk Assessment
    const panicServicesProb = msNeed.includes('high') || productGaps.some(g => g.toLowerCase().includes('fraud') || g.toLowerCase().includes('bypass'))
      ? 'High Panic Services Risk — Urgent Bypass / Revenue Leakage Exposure'
      : 'Moderate Opportunity — SaaS & Managed Services Expansion';

    const salesAngle = {
      narrative: `Position Mobileum AI-Powered Steering & Fraud Protection to replace legacy competitor platforms (${replaceableCompetitors.slice(0, 2).map(c => c.split(' — ')[0]).join(', ')}). Target immediate resolution for key gaps (${productGaps.join(', ')}).`,
      panicRisk: panicServicesProb,
      targetReplacements: replaceableCompetitors,
      gapCoverage: productGaps
    };

    // 7. Final Strategies: formatted as { text: 'Operator: Action for Product', rtpStatus: 'Not Requested', engagementType: 'Product' }
    const rawStrategies = (plan.strategies && plan.strategies.length > 0)
      ? plan.strategies
      : [
          `Introduce Steering of Roaming (SoR) to capture high-margin eSIM/5G roaming opportunities.`,
          `Upsell Roaming Campaign Management Managed Services to offload operations and guarantee revenue assurance.`,
          `Deliver on-site sandbox onboarding workshop for Roaming DNA in Q4 2026.`
        ];

    const finalStrategies = rawStrategies.map(s => {
      let text = typeof s === 'object' ? (s.text || '') : s;
      if (!text.toLowerCase().startsWith(op.operator.toLowerCase())) {
        text = `${op.operator}: ${text}`;
      }
      return {
        text,
        rtpStatus: typeof s === 'object' && s.rtpStatus ? s.rtpStatus : 'Not Requested',
        engagementType: typeof s === 'object' && s.engagementType ? s.engagementType : 'Product'
      };
    });

    let revPot = 2.5;
    if (plan.valueOfOpportunities) {
      const match = plan.valueOfOpportunities.match(/\$?([0-9.]+)/);
      if (match) revPot = parseFloat(match[1]);
    }
    const capexVal = Math.max(0.2, parseFloat(((op.sub_base_mln || 1.0) * 0.08 + (op.market_share_pct || 20.0) * 0.02).toFixed(1)));

    let note = "";
    if (op.financial_comments && op.financial_comments !== 'nan') {
      note = op.financial_comments;
    } else {
      note = `Financial metrics indicate ${op.profitability || 'stable'} profitability with a ${op.revenue_growth || 'stable'} revenue trend in ${countryName}.`;
    }

    const amcList = [];
    const amcBase = Math.max(40, Math.round((op.sub_base_mln || 1.0) * 30 + (op.market_share_pct || 20.0) * 1.5));
    mobileumProducts.slice(0, 2).forEach((prod, i) => {
      const val = i === 0 ? amcBase : Math.round(amcBase * 0.6);
      amcList.push({
        name: `${prod} AMC Support`,
        value: `$${val}K`,
        status: i === 0 ? 'Renewal due Q4 2026' : 'Active Contract'
      });
    });

    const managedServicesRenewal = [];
    const msBase = Math.max(50, Math.round((op.sub_base_mln || 1.0) * 20 + (op.market_share_pct || 20.0) * 1.0));
    managedServicesRenewal.push({
      name: `${op.operator} - Managed Support`,
      value: `$${msBase}K`,
      status: msNeed.includes('high') ? 'Renewal Pending' : 'Active Support'
    });

    const installedProductWiseSupportTicket = [];
    const usageOfInstalledProducts = [];

    return {
      productSection: {
        mobileumProducts,
        competitionProducts,
        productGaps,
        managedServicesPossibility,
        replaceableCompetitors,
        finalStrategies,
        salesAngle
      },
      financialSection: {
        profit: `$${revPot.toFixed(1)}M Projected Potential`,
        capexInvestment: `$${capexVal.toFixed(1)}M Capex Enabled`,
        note
      },
      renewalSection: {
        amcRenewal: amcList,
        managedServicesRenewal
      },
      healthSection: {
        installedProductWiseSupportTicket,
        usageOfInstalledProducts
      },
      plan2026: plan
    };
  };

  const buildCountryInsight = (countryName, countryData) => {
    if (!countryData || !countryData.operators || countryData.operators.length === 0) return null;

    const ops = countryData.operators;
    let totalRevPot = 0;
    let totalCapex = 0;
    const allProducts = new Set();
    const allCompetitors = new Set();
    const allGaps = new Set();
    const allStrategies = [];
    const amcRenewal = [];
    const managedServicesRenewal = [];
    const installedTicketsMap = {};
    const usageMap = {};

    ops.forEach((op, opIdx) => {
      const opInsight = buildOperatorInsight(countryName, op);
      if (!opInsight) return;

      const rMatch = opInsight.financialSection.profit.match(/\$?([0-9.]+)/);
      if (rMatch) totalRevPot += parseFloat(rMatch[1]);

      const cMatch = opInsight.financialSection.capexInvestment.match(/\$?([0-9.]+)/);
      if (cMatch) totalCapex += parseFloat(cMatch[1]);

      opInsight.productSection.mobileumProducts.forEach(p => allProducts.add(p));
      opInsight.productSection.competitionProducts.forEach(p => allCompetitors.add(p));
      opInsight.productSection.productGaps.forEach(p => allGaps.add(p));
      opInsight.productSection.finalStrategies.forEach(s => {
        if (typeof s === 'object') {
          allStrategies.push(s);
        } else {
          allStrategies.push({ text: `${op.operator}: ${s}`, rtpStatus: 'Not Requested', engagementType: 'Product' });
        }
      });

      opInsight.renewalSection.amcRenewal.forEach(amc => {
        amcRenewal.push({
          name: `${op.operator} - ${amc.name}`,
          value: amc.value,
          status: amc.status
        });
      });
      opInsight.renewalSection.managedServicesRenewal.forEach(ms => {
        managedServicesRenewal.push({
          name: ms.name,
          value: ms.value,
          status: ms.status
        });
      });

      opInsight.healthSection.installedProductWiseSupportTicket.forEach(t => {
        if (!installedTicketsMap[t.product]) {
          installedTicketsMap[t.product] = { tickets: 0, trend: t.trend };
        }
        installedTicketsMap[t.product].tickets += t.tickets;
      });
      opInsight.healthSection.usageOfInstalledProducts.forEach(u => {
        usageMap[u.product] = (usageMap[u.product] || '') + `; ${op.operator}: ${u.usage}`;
      });
    });

    return {
      productSection: {
        mobileumProducts: Array.from(allProducts),
        competitionProducts: Array.from(allCompetitors),
        productGaps: Array.from(allGaps),
        managedServicesPossibility: ['Managed Services Transformation', 'SaaS Licensing Migration'],
        replaceableCompetitors: ['Syniverse', 'Tomia', 'Subex'],
        finalStrategies: allStrategies.slice(0, 4)
      },
      financialSection: {
        profit: `$${totalRevPot.toFixed(1)}M Projected Potential`,
        capexInvestment: `$${totalCapex.toFixed(1)}M Capex Enabled`,
        note: `Country-level strategic insights representing ${ops.length} active operators in ${countryName}.`
      },
      renewalSection: {
        amcRenewal: amcRenewal.slice(0, 4),
        managedServicesRenewal: managedServicesRenewal.slice(0, 2)
      },
      healthSection: {
        installedProductWiseSupportTicket: Object.entries(installedTicketsMap).map(([prod, info]) => ({
          product: prod,
          tickets: info.tickets,
          trend: info.trend
        })),
        usageOfInstalledProducts: Object.entries(usageMap).map(([prod, txt]) => ({
          product: prod,
          usage: txt.startsWith(';') ? txt.substring(2) : txt
        }))
      },
      plan2026: {
        productsFocusedOn: Array.from(allProducts).slice(0, 3),
        valueOfOpportunities: `$${totalRevPot.toFixed(1)}M pipeline`,
        pocOrDemoGiven: 'Demos and PoCs run across country operators.',
        consultingTrialsGiven: 'Solution sandbox workshops scheduled.'
      }
    };
  };

  const getDynamicCountryTickets = (cName, cData) => {
    if (!cData || !cData.operators || cData.operators.length === 0) {
      return {
        total_tickets: 0,
        trend_12_months: [],
        business_units: []
      };
    }

    let total = 0;
    const buTickets = {
      "Risk": 0, "Fraud": 0, "Roaming Management": 0, "Network Security": 0, "Customer Intelligence": 0
    };
    const buColors = {
      "Risk": "#7c3aed", "Fraud": "#ef4444", "Roaming Management": "#10b981", "Network Security": "#3b82f6", "Customer Intelligence": "#ea580c"
    };

    cData.operators.forEach(op => {
      const sub = op.sub_base_mln || 1.0;
      const mkt = op.market_share_pct || 20.0;
      const opTickets = Math.max(5, Math.round(sub * 3 + mkt * 0.5 + 15));
      total += opTickets;

      const gaps = op.ia_bu_gaps?.toLowerCase() || '';
      let riskW = 0.2, fraudW = 0.2, roamW = 0.3, netW = 0.15, custW = 0.15;
      if (gaps.includes('fraud')) fraudW += 0.15;
      if (gaps.includes('revenue') || gaps.includes('assurance')) riskW += 0.15;
      if (gaps.includes('managed')) roamW += 0.1;
      if (gaps.includes('testing')) netW += 0.1;

      const sum = riskW + fraudW + roamW + netW + custW;
      buTickets["Risk"] += Math.round(opTickets * (riskW / sum));
      buTickets["Fraud"] += Math.round(opTickets * (fraudW / sum));
      buTickets["Roaming Management"] += Math.round(opTickets * (roamW / sum));
      buTickets["Network Security"] += Math.round(opTickets * (netW / sum));
      buTickets["Customer Intelligence"] += Math.round(opTickets * (custW / sum));
    });

    const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
    const trend_12_months = months.map((m, idx) => {
      const avg = total / 12;
      const factor = 1 + Math.sin(idx / 1.5) * 0.15 + (Math.random() * 0.1 - 0.05);
      return { month: m, count: Math.max(1, Math.round(avg * factor)) };
    });

    const business_units = Object.entries(buTickets).map(([unit, tickets]) => ({
      unit,
      tickets: tickets || 1,
      color: buColors[unit]
    }));

    return {
      total_tickets: total,
      trend_12_months,
      business_units
    };
  };

  const [theme, setTheme] = useState('light');
  const [selectedCountry, setSelectedCountry] = useState(null);

  // Fetch single country data dynamically from API route
  useEffect(() => {
    if (!selectedCountry) return;
    const cName = typeof selectedCountry === 'object' ? (selectedCountry.country_name || selectedCountry.country) : selectedCountry;
    if (!cName) return;

    if (loadedCountries[cName] && loadedCountries[cName].isDbFetched) return;

    fetch(`/api/get-operator-data?country=${encodeURIComponent(cName)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.country) {
          const countryObj = {
            ...(loadedCountries[cName] || {}),
            ...data.country,
            isDbFetched: true,
            operators: (data.operators && data.operators.length > 0
              ? data.operators
              : (loadedCountries[cName]?.operators || [])
            ).map(op => {
              if (typeof op.impact_analysis === 'object' && op.impact_analysis) {
                return { ...op.impact_analysis, ...op, operator: op.operator_name || op.operator };
              }
              return { ...op, operator: op.operator_name || op.operator };
            })
          };
          setLoadedCountries(prev => ({
            ...prev,
            [cName]: countryObj
          }));
        }
      })
      .catch(err => console.error(`Error fetching country data for ${cName}:`, err));
  }, [selectedCountry, loadedCountries]);

  const [currentLens, setCurrentLens] = useState('cluster');
  const [activeRegion, setActiveRegion] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [compareList, setCompareList] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [showGlobalOverview, setShowGlobalOverview] = useState(false);

  // KAM Filter States & Dropdowns
  const LENS_OPTIONS = [
    { key: 'cluster', label: 'Market Cluster' },
    { key: 'fraud', label: 'Fraud Risk' },
    { key: 'fiveG', label: '5G Readiness' },
    { key: 'roaming', label: 'Roaming Intensity' },
    { key: 'arpu', label: 'ARPU Pressure' }
  ];
  const [selectedKam, setSelectedKam] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // 'lens' | 'kam' | null
  const [kamSearchQuery, setKamSearchQuery] = useState('');
  const lensDropdownRef = useRef(null);
  const kamDropdownRef = useRef(null);

  // Outside click listener: only one list is open at a time, clicking outside closes it
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        openDropdown &&
        lensDropdownRef.current && !lensDropdownRef.current.contains(e.target) &&
        kamDropdownRef.current && !kamDropdownRef.current.contains(e.target)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [openDropdown]);

  // When activeRegion is selected, get KAMs who handle countries in that region
  const availableKams = useMemo(() => {
    return getKamsByRegion(activeRegion, countries);
  }, [activeRegion, countries]);

  const filteredKams = useMemo(() => {
    if (!kamSearchQuery.trim()) return availableKams;
    const q = kamSearchQuery.toLowerCase().trim();
    return availableKams.filter(k => k.toLowerCase().includes(q));
  }, [availableKams, kamSearchQuery]);

  const kamCountriesList = useMemo(() => {
    return selectedKam ? getCountriesByKam(selectedKam) : [];
  }, [selectedKam]);

  const kamRegionsList = useMemo(() => {
    return selectedKam ? getRegionsByKam(selectedKam, countries) : [];
  }, [selectedKam, countries]);

  const [ticketData, setTicketData] = useState(null);
  const [amcData, setAmcData] = useState([]);
  const [competitorData, setCompetitorData] = useState([]);
  const [accountData, setAccountData] = useState(null);
  const [accountDataOverrides, setAccountDataOverrides] = useState({});
  const [submissions, setSubmissions] = useState([]);

  const handleAddSubmission = (formData) => {
    setSubmissions(prev => [
      ...prev,
      {
        ...formData,
        id: Date.now(),
        country: selectedCountry || 'Global',
        operator: selectedOperator || 'Global',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('operators');
  const [selectedOperator, setSelectedOperator] = useState(null);

  const handleUpdateAccountData = (country, newData) => {
    setAccountDataOverrides(prev => ({
      ...prev,
      [country]: newData
    }));
  };

  const aggregateRegionData = (regionName) => {
    const activeCountriesList = Object.entries(countries).filter(([name, c]) => {
      if (regionName === 'all') return true;
      return c.region === regionName;
    });

    if (activeCountriesList.length === 0) return null;

    const num_operators = activeCountriesList.reduce((sum, [_, c]) => sum + (c.num_operators || 0), 0);

    const statsKeys = ['mobile_penetration', 'gdp_growth', 'avg_age', 'avg_5g', 'avg_sub_growth', 'avg_market_health', 'fraud_score', 'roaming_intensity', 'internet_users', 'gdp_per_capita', 'population', 'mobile_users'];
    const stats = {};
    statsKeys.forEach(k => {
      const vals = activeCountriesList.map(([_, c]) => c.stats?.[k]).filter(v => v !== undefined && v !== null && !isNaN(v));
      stats[k] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });

    const radarKeys = ['roaming_opportunity', 'fraud_risk', 'fiveG_upsell', 'arpu_pressure', 'subscriber_growth', 'regulatory_risk'];
    const radar = {};
    radarKeys.forEach(k => {
      const vals = activeCountriesList.map(([_, c]) => c.radar?.[k]).filter(v => v !== undefined && v !== null && !isNaN(v));
      radar[k] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 3.0;
    });

    const waterfallKeys = ['base', 'ott_substitution', 'arpu_compression', 'churn_pressure', 'roaming_upside', 'fiveG_upside', 'net'];
    const waterfall = {};
    waterfallKeys.forEach(k => {
      const vals = activeCountriesList.map(([_, c]) => c.waterfall?.[k]).filter(v => v !== undefined && v !== null && !isNaN(v));
      waterfall[k] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0.0;
    });

    const seasonal_roaming = {};
    for (let m = 1; m <= 12; m++) {
      const vals = activeCountriesList.map(([_, c]) => c.seasonal_roaming?.[m]).filter(v => v !== undefined && v !== null);
      seasonal_roaming[m] = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 1;
    }

    const productScores = {};
    activeCountriesList.forEach(([_, c]) => {
      if (c.product_ranking) {
        c.product_ranking.forEach(pr => {
          if (!productScores[pr.product]) {
            productScores[pr.product] = { scores: [], reasons: [] };
          }
          productScores[pr.product].scores.push(pr.score);
          productScores[pr.product].reasons.push(pr.reason);
        });
      }
    });

    const product_ranking = Object.entries(productScores).map(([prod, data]) => {
      const score = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
      return {
        product: prod,
        score: score,
        reason: `Aggregated fit for ${regionName === 'all' ? 'global' : regionName} region: average match score is ${score}%.`
      };
    }).sort((a, b) => b.score - a.score);

    const top_product = product_ranking.length > 0 ? product_ranking[0] : null;

    const operators = activeCountriesList.flatMap(([name, c]) =>
      (c.operators || []).map(op => ({ ...op, countryName: name }))
    );

    return {
      country: regionName === 'all' ? 'Global Overview' : `${regionName} Region`,
      region: regionName === 'all' ? 'Global' : regionName,
      sub_region: 'Aggregated Region Analysis',
      iso: 'WLD',
      num_operators,
      operators,
      stats,
      percentiles: stats,
      regional_averages: stats,
      radar,
      waterfall,
      seasonal_roaming,
      product_ranking,
      cluster_name: regionName === 'all' ? 'Global Markets' : `${regionName} Markets`,
      anomaly_text: null,
      top_product,
      anomaly_z_score: 0
    };
  };

  const getAggregatedTickets = (regionName) => {
    let total = 0;
    const buTickets = {};
    const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
      const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
      return { month: months[i], count: 0 };
    });

    Object.entries(MOCK_TICKETS).forEach(([country, data]) => {
      const cv = countries[country];
      if (cv && (regionName === 'all' || cv.region === regionName)) {
        total += data.total_tickets;
        data.trend_12_months.forEach((t, idx) => {
          monthlyTrend[idx].count += t.count;
        });
        data.business_units.forEach(bu => {
          if (!buTickets[bu.unit]) {
            buTickets[bu.unit] = { tickets: 0, color: bu.color };
          }
          buTickets[bu.unit].tickets += bu.tickets;
        });
      }
    });

    if (total === 0) {
      return {
        total_tickets: 4200,
        trend_12_months: monthlyTrend.map(m => ({ ...m, count: Math.floor(Math.random() * 200) + 150 })),
        business_units: [
          { unit: "Risk", tickets: 1200, color: "#7c3aed" },
          { unit: "Fraud", tickets: 1500, color: "#ef4444" },
          { unit: "Roaming Management", tickets: 800, color: "#10b981" },
          { unit: "Network Security", tickets: 400, color: "#3b82f6" },
          { unit: "Customer Intelligence", tickets: 300, color: "#ea580c" }
        ]
      };
    }

    return {
      total_tickets: total,
      trend_12_months: monthlyTrend,
      business_units: Object.entries(buTickets).map(([unit, info]) => ({
        unit,
        tickets: info.tickets,
        color: info.color
      }))
    };
  };

  const getAggregatedAMC = (regionName) => {
    const list = [];
    Object.entries(countries).forEach(([cName, cData]) => {
      if (regionName === 'all' || cData.region === regionName) {
        cData.operators?.forEach((op, opIdx) => {
          const opInsight = buildOperatorInsight(cName, op);
          if (opInsight) {
            opInsight.renewalSection.amcRenewal.forEach((amc, idx) => {
              const val = parseFloat(amc.value.replace(/[^0-9.]/g, '')) * 1000;
              list.push({
                contract_id: `AMC-2026-${op.operator.substring(0, 3).toUpperCase()}-${opIdx}-${idx}`,
                business_unit: amc.name.replace(' AMC Support', ''),
                client_name: `${op.operator} (${cName})`,
                outstanding_amount: val,
                due_date: `2026-11-${15 + idx * 5}`
              });
            });
          }
        });
      }
    });
    return list;
  };

  const getAggregatedAccountData = (regionName) => {
    const activeCountriesList = Object.entries(countries).filter(([name, c]) => {
      return regionName === 'all' || c.region === regionName;
    });

    if (activeCountriesList.length === 0) {
      return {
        productSection: { mobileumProducts: [], competitionProducts: [], productGaps: [], managedServicesPossibility: [], replaceableCompetitors: [], finalStrategies: [] },
        financialSection: { profit: '$0.0M Projected Potential', capexInvestment: '$0.0M Capex Enabled', note: 'No data' },
        renewalSection: { amcRenewal: [], managedServicesRenewal: [] },
        healthSection: { installedProductWiseSupportTicket: [], usageOfInstalledProducts: [] },
        plan2026: { productsFocusedOn: [], valueOfOpportunities: '$0.0M pipeline', pocOrDemoGiven: '', consultingTrialsGiven: '' }
      };
    }

    let totalRevPot = 0;
    let totalCapex = 0;
    const allProducts = new Set();
    const allCompetitors = new Set();
    const allGaps = new Set();
    const allStrategies = [];
    const amcRenewal = [];
    const managedServicesRenewal = [];
    const installedTicketsMap = {};
    const usageMap = {};

    activeCountriesList.forEach(([cName, cData]) => {
      const countryInsight = buildCountryInsight(cName, cData);
      if (!countryInsight) return;

      const rMatch = countryInsight.financialSection.profit.match(/\$?([0-9.]+)/);
      if (rMatch) totalRevPot += parseFloat(rMatch[1]);

      const cMatch = countryInsight.financialSection.capexInvestment.match(/\$?([0-9.]+)/);
      if (cMatch) totalCapex += parseFloat(cMatch[1]);

      countryInsight.productSection.mobileumProducts.forEach(p => allProducts.add(p));
      countryInsight.productSection.competitionProducts.forEach(p => allCompetitors.add(p));
      countryInsight.productSection.productGaps.forEach(p => allGaps.add(p));
      countryInsight.productSection.finalStrategies.forEach(s => allStrategies.push(s));

      countryInsight.renewalSection.amcRenewal.forEach(amc => {
        amcRenewal.push(amc);
      });
      countryInsight.renewalSection.managedServicesRenewal.forEach(ms => {
        managedServicesRenewal.push(ms);
      });

      countryInsight.healthSection.installedProductWiseSupportTicket.forEach(t => {
        if (!installedTicketsMap[t.product]) {
          installedTicketsMap[t.product] = { tickets: 0, trend: t.trend };
        }
        installedTicketsMap[t.product].tickets += t.tickets;
      });
      countryInsight.healthSection.usageOfInstalledProducts.forEach(u => {
        usageMap[u.product] = (usageMap[u.product] || '') + `; ${u.product}: ${u.usage}`;
      });
    });

    return {
      productSection: {
        mobileumProducts: Array.from(allProducts).slice(0, 6),
        competitionProducts: Array.from(allCompetitors).slice(0, 4),
        productGaps: Array.from(allGaps).slice(0, 4),
        managedServicesPossibility: ['Managed Services Transformation', 'SaaS Licensing Migration'],
        replaceableCompetitors: ['Syniverse', 'Tomia', 'Subex'],
        finalStrategies: allStrategies.slice(0, 5)
      },
      financialSection: {
        profit: `$${totalRevPot.toFixed(1)}M Projected Potential`,
        capexInvestment: `$${totalCapex.toFixed(1)}M Capex Enabled`,
        note: `Aggregated regional financial plan for the ${regionName === 'all' ? 'global' : regionName} markets.`
      },
      renewalSection: {
        amcRenewal: amcRenewal.slice(0, 5),
        managedServicesRenewal: managedServicesRenewal.slice(0, 3)
      },
      healthSection: {
        installedProductWiseSupportTicket: Object.entries(installedTicketsMap).slice(0, 5).map(([prod, info]) => ({
          product: prod,
          tickets: info.tickets,
          trend: info.trend
        })),
        usageOfInstalledProducts: Object.entries(usageMap).slice(0, 5).map(([prod, txt]) => ({
          product: prod,
          usage: 'Aggregated regional solution usage'
        }))
      },
      plan2026: {
        productsFocusedOn: Array.from(allProducts).slice(0, 4),
        valueOfOpportunities: `$${totalRevPot.toFixed(1)}M pipeline`,
        pocOrDemoGiven: 'Demos and PoCs run across region operators.',
        consultingTrialsGiven: 'Solution sandbox workshops scheduled.'
      }
    };
  };

  useEffect(() => {
    setIsDataLoading(true);
    let isMounted = true;

    const loadData = async () => {
      if (!selectedCountry) {
        const tickets = getAggregatedTickets(activeRegion);
        const amcs = getAggregatedAMC(activeRegion);
        const accountInsight = getAggregatedAccountData(activeRegion);

        if (!isMounted) return;
        setTicketData(tickets);
        setAmcData(amcs);
        setCompetitorData(MOCK_COMPETITORS);
        setAccountData(accountInsight);
        setIsDataLoading(false);
        return;
      }

      const cData = countries[selectedCountry];
      let tickets = getDynamicCountryTickets(selectedCountry, cData);

      let ops = cData?.operators || [];
      const amcs = [];
      ops.forEach((op, opIdx) => {
        const opInsight = buildOperatorInsight(selectedCountry, op);
        if (opInsight) {
          opInsight.renewalSection.amcRenewal.forEach((amc, idx) => {
            const val = parseFloat(amc.value.replace(/[^0-9.]/g, '')) * 1000;
            amcs.push({
              contract_id: `AMC-2026-OP${opIdx}-${idx}`,
              business_unit: amc.name.replace(' AMC Support', ''),
              client_name: op.operator,
              outstanding_amount: val,
              due_date: `2026-11-${15 + idx * 5}`
            });
          });
        }
      });

      let opInsight = buildCountryInsight(selectedCountry, cData);
      if (selectedOperator) {
        const opData = ops.find(o => o.operator === selectedOperator);
        opInsight = buildOperatorInsight(selectedCountry, opData);
        
        // Phase 2 & 3: Integrate Account Explorer (SkyGeni) and Customer Health real mapped data
        try {
          // In mapping.xlsx and health data, the customer name is often a combination of operator and country (e.g. "STC Saudi Arabia")
          // If selectedOperator doesn't already end with the country name, append it to form the logical customer name.
          let logicalCustomer = selectedOperator;
          const countryMap = {
            'United States': 'USA',
            'United Kingdom': 'UK',
            'United Arab Emirates': 'UAE',
            'JAPAN': 'Japan'
          };
          // Some map elements use all caps (e.g. JAPAN). Capitalize normally if not in map.
          let mappedCountry = countryMap[selectedCountry] || selectedCountry;
          if (mappedCountry === mappedCountry.toUpperCase() && mappedCountry.length > 3) {
             mappedCountry = mappedCountry.charAt(0) + mappedCountry.slice(1).toLowerCase();
          }
          
          const exactOperatorMatchOverrides = [
            'Bayobab (MTN GlobalConnect)',
            'Orange Middle East and Africa'
          ];

          if (exactOperatorMatchOverrides.includes(selectedOperator)) {
             logicalCustomer = selectedOperator;
          } else if (mappedCountry && !logicalCustomer.toLowerCase().includes(mappedCountry.toLowerCase())) {
             logicalCustomer = `${selectedOperator} ${mappedCountry}`;
          }
          
          const [wsData, healthData] = await Promise.all([
             fetchWhiteSpace(selectedOperator, selectedCountry),
             fetchHealthDetail(selectedOperator, selectedCountry)
          ]);
          
          if (wsData && wsData.business_units && wsData.business_units.length > 0) {
            // Rebuild amcData using real SkyGeni business_units
            const newAmcs = [];
            let contractCounter = 1;
            wsData.business_units.filter(bu => bu.covered).forEach(bu => {
               newAmcs.push({
                 contract_id: `AMC-SKYGENI-${contractCounter++}`,
                 business_unit: bu.bu,
                 client_name: selectedOperator,
                 outstanding_amount: Math.round(Math.random() * 300000 + 100000), // AMC values are not in skygeni, using synthetic value but real BU presence
                 due_date: '2026-12-31'
               });
            });
            amcs.length = 0; 
            amcs.push(...newAmcs);
            
            // Inject SkyGeni products and peer suggestions into Account Profile
            const allProducts = wsData.business_units.flatMap(b => b.products);
            if (allProducts.length > 0) {
              opInsight.productSection.mobileumProducts = allProducts;
            }
            if (wsData.peer_suggestions && wsData.peer_suggestions.length > 0) {
              opInsight.productSection.replaceableCompetitors = wsData.peer_suggestions.map(p => p.product_group);
            }
          }
          
          if (healthData && healthData.summary) {
            opInsight.healthSection.customerHealth = healthData;
              
              if (healthData.business_units && healthData.business_units.length > 0) {
                 const realTickets = healthData.business_units.map(bu => {
                    const t = (bu.raw_data && bu.raw_data["Total S1+S2+S3 Tickets created last 3 months"]) || 0;
                    const csat = (bu.raw_data && bu.raw_data["CSAT"]) || "Green";
                    return {
                       product: bu.bu_name_or_count,
                       tickets: t,
                       trend: csat === "Green" ? "Stable" : "Needs Attention"
                    };
                 });
                 realTickets.sort((a,b) => b.tickets - a.tickets);
                 
                 opInsight.healthSection.installedProductWiseSupportTicket = realTickets;
                 
                 const usageMap = realTickets.map(bu => {
                     return {
                        product: bu.product,
                        usage: `Active deployment for ${bu.product} BU. Monitoring performance and SLA metrics.`
                     };
                 });
                 opInsight.healthSection.usageOfInstalledProducts = usageMap;
              }
            }
        } catch(e) {
          console.error("Failed to fetch skygeni or health data", e);
        }
      }

      // Fetch overrides from backend
      let backendOverrides = {};
      try {
        const res = await fetch(`/api/get-overrides?countryId=${encodeURIComponent(selectedCountry)}&operatorId=${encodeURIComponent(selectedOperator || 'Global')}`);
        if (res.ok) {
          backendOverrides = await res.json();
        }
      } catch (err) {
        console.warn("Could not fetch overrides from backend; falling back to local state.", err);
      }

      if (!isMounted) return;

      setTicketData(tickets);
      setAmcData(amcs);
      setCompetitorData(MOCK_COMPETITORS);

      // Merge backend overrides onto opInsight
      let mergedInsight = { ...opInsight };
      if (backendOverrides && Object.keys(backendOverrides).length > 0) {
        for (const section in backendOverrides) {
          if (!mergedInsight[section]) mergedInsight[section] = {};
          // track which fields are edited
          mergedInsight[section]._editedFields = mergedInsight[section]._editedFields || {};
          for (const fieldName in backendOverrides[section]) {
            mergedInsight[section][fieldName] = backendOverrides[section][fieldName];
            mergedInsight[section]._editedFields[fieldName] = true;
          }
        }
      }

      // Then merge local unsaved overrides (if any, e.g., from immediate saves)
      if (accountDataOverrides[selectedCountry]) {
        for (const section in accountDataOverrides[selectedCountry]) {
          if (!mergedInsight[section]) mergedInsight[section] = {};
          mergedInsight[section] = { ...mergedInsight[section], ...accountDataOverrides[selectedCountry][section] };
        }
      }

      setAccountData(mergedInsight);
      setIsDataLoading(false);

      // Merge complete
    };

    // Add a slight artificial delay for UI smoothness if desired, or just call immediately
    const timer = setTimeout(() => {
      loadData();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedCountry, selectedOperator, activeRegion, accountDataOverrides]);

  // Reset tab and operator on country change
  useEffect(() => {
    setActiveTab('operators');
    setSelectedOperator(null);
  }, [selectedCountry]);

  // Reset operator selection on tab change if moving away from operator/account context
  useEffect(() => {
    if (activeTab !== 'account' && activeTab !== 'operators') {
      setSelectedOperator(null);
    }
  }, [activeTab]);

  // Sync theme state with DOM element class for CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
  }, [theme]);

  // Handle search typing
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const queryLower = q.toLowerCase().trim();
    const matches = Object.keys(countries)
      .filter(c => c.toLowerCase().includes(queryLower))
      .slice(0, 10);
    setSearchResults(matches);
  };

  const handleSelectSearchItem = (name) => {
    setSelectedCountry(name);
    setSearchQuery('');
    setSearchResults([]);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const openCompareModal = () => {
    if (selectedCountry && compareList.length < 3 && !compareList.includes(selectedCountry)) {
      setCompareList(prev => [...prev, selectedCountry]);
    }
    setIsCompareOpen(true);
  };

  const removeCompare = (name) => {
    setCompareList(prev => prev.filter(c => c !== name));
  };

  const renderKamDropdownMenu = () => (
    <div
      className="filter-dropdown-menu"
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        width: '280px',
        maxHeight: '360px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
        padding: '8px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 4px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>
          {activeRegion !== 'all' ? `${activeRegion} KAMs` : 'Key Account Managers'} ({availableKams.length})
        </span>
        {selectedKam && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedKam(null);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '11px',
              color: 'var(--blue)',
              cursor: 'pointer',
              fontWeight: '600',
              padding: '2px 4px'
            }}
          >
            Clear (✕)
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder={`Search ${activeRegion !== 'all' ? activeRegion : ''} KAM...`}
        value={kamSearchQuery}
        onChange={e => setKamSearchQuery(e.target.value)}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: '11px',
          background: 'var(--bg-card2)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--text-primary)',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />

      <div style={{ overflowY: 'auto', maxHeight: '250px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {filteredKams.length === 0 ? (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '16px', textAlign: 'center' }}>
            No KAMs found in {activeRegion !== 'all' ? activeRegion : 'portal'}
          </div>
        ) : (
          filteredKams.map(kam => {
            const isSelected = selectedKam === kam;
            const cList = getCountriesByKam(kam);
            const regs = getRegionsByKam(kam, countries);
            return (
              <button
                key={kam}
                onClick={() => {
                  setSelectedKam(kam);
                  setOpenDropdown(null);
                  setSelectedCountry(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  fontSize: '12px',
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? '#ffffff' : 'var(--text-primary)',
                  background: isSelected ? 'var(--blue)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background 0.15s ease'
                }}
                onMouseOver={e => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--bg-card2)';
                }}
                onMouseOut={e => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div>
                  <div style={{ fontSize: '12px' }}>{kam}</div>
                  <div style={{ fontSize: '10px', opacity: isSelected ? 0.9 : 0.6, fontWeight: '400', marginTop: '1px' }}>
                    {cList.length} {cList.length === 1 ? 'country' : 'countries'} · {regs.join(', ')}
                  </div>
                </div>
                {isSelected && <span style={{ fontSize: '12px' }}>✓</span>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* TOP BAR */}
      <div id="topbar">
        <div className="logo">
          <div className="logo-dot"></div>
          MOBILEUM
          <span className="subtitle">GLOBAL TELECOM INTELLIGENCE PLATFORM</span>
        </div>
        <div className="spacer"></div>
        <div className="stats-bar">
          <div className="stat-pill">Countries <span>{metadata.total_countries}</span></div>
          <div className="stat-pill">Operators <span>{metadata.total_operators}</span></div>
          <div className="stat-pill">Regions <span>5</span></div>
        </div>

        <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Dark/Light Mode">
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            id="search-box"
            placeholder="Search country..."
            value={searchQuery}
            onChange={handleSearchChange}
            autoComplete="off"
          />
          {searchResults.length > 0 && (
            <div id="search-results">
              {searchResults.map(c => (
                <div
                  key={c}
                  className="search-item"
                  onClick={() => handleSelectSearchItem(c)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CountryFlag iso={countries[c]?.iso} country={c} size="small" />
                    <span>{c}</span>
                  </span>{' '}
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                    {countries[c].region}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
          {/* FILTER BAR */}
          {/* FILTER BAR */}
          <div id="filterbar">
            {/* 1. Top filter bar: show only two buttons, "Map Lens" and "KAM" */}
            <div className="filter-dropdown-wrapper" ref={lensDropdownRef} style={{ position: 'relative' }}>
              <button
                id="btn-map-lens"
                className={`filter-btn ${openDropdown === 'lens' ? 'active' : ''}`}
                onClick={() => setOpenDropdown(prev => prev === 'lens' ? null : 'lens')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Map Lens</span>
                <span style={{ fontSize: '8px', opacity: 0.8 }}>▼</span>
              </button>
              {openDropdown === 'lens' && (
                <div
                  className="filter-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    minWidth: '190px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                    padding: '6px',
                    zIndex: 10000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Map Lens
                  </div>
                  {LENS_OPTIONS.map(lens => {
                    const isSelected = currentLens === lens.key;
                    return (
                      <button
                        key={lens.key}
                        onClick={() => {
                          setCurrentLens(lens.key);
                          setOpenDropdown(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          fontSize: '12px',
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? '#ffffff' : 'var(--text-primary)',
                          background: isSelected ? 'var(--blue)' : 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseOver={e => {
                          if (!isSelected) e.currentTarget.style.background = 'var(--bg-card2)';
                        }}
                        onMouseOut={e => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span>{lens.label}</span>
                        {isSelected && <span style={{ fontSize: '12px' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="filter-dropdown-wrapper" ref={kamDropdownRef} style={{ position: 'relative' }}>
              <button
                id="btn-kam"
                className={`filter-btn ${openDropdown === 'kam' || selectedKam ? 'active' : ''}`}
                onClick={() => setOpenDropdown(prev => prev === 'kam' ? null : 'kam')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>{selectedKam ? `KAM: ${selectedKam}` : 'KAM'}</span>
                <span style={{ fontSize: '8px', opacity: 0.8 }}>▼</span>
              </button>
              {openDropdown === 'kam' && renderKamDropdownMenu()}
            </div>

            <div className="filter-sep"></div>

            {/* Region row */}
            <span className="lens-label">REGION:</span>
            {['all', 'MENA', 'Europe', 'APAC', 'LATAM', 'Africa'].map(region => (
              <button
                key={region}
                className={`filter-btn ${activeRegion === region ? 'active' : ''}`}
                onClick={() => {
                  setActiveRegion(region);
                  setSelectedCountry(null);
                  if (selectedKam && region !== 'all') {
                    const kamsInNewRegion = getKamsByRegion(region, countries);
                    if (!kamsInNewRegion.includes(selectedKam)) {
                      setSelectedKam(null);
                    }
                  }
                }}
              >
                {region === 'all' ? 'All Regions' : region}
              </button>
            ))}

            <div className="filter-sep"></div>

            <button
              className={`filter-btn ${showGlobalOverview && !selectedCountry ? 'active' : ''}`}
              onClick={() => {
                setSelectedCountry(null);
                setShowGlobalOverview(prev => !prev);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Global Overview
            </button>

            <div className="filter-sep"></div>

            <button className="filter-btn" onClick={openCompareModal}>
              Compare Countries
            </button>
          </div>

      {/* MAIN APP CONTAINER */}
      <div id="app">
        <div className="app-main-layout">

          {selectedCountry ? (
            // SIDE-BY-SIDE VIEW: Country Context Sidebar & Dynamic Operator Details (No Map)
            <>
              {/* Left Panel: Static Country Sidebar */}
              <StaticCountrySidebar
                selectedCountry={selectedCountry}
                countryData={countries[selectedCountry]}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onClose={() => {
                  setSelectedCountry(null);
                  setSelectedOperator(null);
                }}
                getFlagEmoji={getFlagEmoji}
                selectedOperator={selectedOperator}
                onSelectOperator={(opName) => {
                  setSelectedOperator(opName);
                  if (opName) {
                    setActiveTab('account');
                  } else {
                    setActiveTab('operators');
                  }
                }}
              />

              {/* Right Panel: Dynamic Operator Details Dashboard */}
              <div className="dashboard-wrapper">
                <DynamicCenterDashboard
                  selectedCountry={selectedCountry}
                  countryData={countries[selectedCountry]}
                  allCountries={countries}
                  metadata={metadata}
                  getFlagEmoji={getFlagEmoji}
                  theme={theme}
                  ticketData={ticketData}
                  amcData={amcData}
                  competitorData={competitorData}
                  accountData={accountData}
                  isDataLoading={isDataLoading}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  selectedOperator={selectedOperator}
                  setSelectedOperator={setSelectedOperator}
                  setSelectedCountry={setSelectedCountry}
                  submissions={submissions}
                  onAddSubmission={handleAddSubmission}
                  onUpdateAccountData={handleUpdateAccountData}
                  activeRegion={activeRegion}
                  setActiveRegion={setActiveRegion}
                  onCloseOverview={() => { }}
                  onExportReport={() => exportReport(selectedCountry, countries[selectedCountry], metadata, selectedOperator, {
                    accountInsights: { [selectedCountry]: accountData },
                    amcData: amcData,
                    ticketData: MOCK_TICKETS[selectedCountry],
                    competitors: MOCK_COMPETITORS
                  })}
                  onExportPPT={() => exportPPT(selectedCountry, countries[selectedCountry], metadata, selectedOperator, {
                    accountInsights: { [selectedCountry]: accountData },
                    amcData: amcData,
                    ticketData: MOCK_TICKETS[selectedCountry],
                    competitors: MOCK_COMPETITORS
                  })}
                />
              </div>
            </>
          ) : (
            // MAP VIEW: Show map when no country is selected
            <>
              {/* Left panel: Map */}
              <div style={{ display: showGlobalOverview ? 'none' : 'flex' }} className="map-view-wrapper">
                <div className="map-view-container">
                  {selectedKam ? (
                    <div className="kam-sidebar" style={{
                      width: '320px',
                      background: 'var(--bg-card)',
                      borderRight: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      overflow: 'hidden',
                      zIndex: 10
                    }}>
                      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Key Account Manager
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                              {selectedKam}
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedKam(null)}
                            title="Clear KAM filter"
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              color: 'var(--text-muted)'
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        {/* Regions handled */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
                          {kamRegionsList.map(reg => (
                            <span key={reg} style={{
                              fontSize: '10px',
                              fontWeight: '600',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: 'var(--bg-card2)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-secondary)'
                            }}>
                              {reg}
                            </span>
                          ))}
                        </div>

                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                          {kamCountriesList.length} {kamCountriesList.length === 1 ? 'country' : 'countries'} managed
                        </div>
                      </div>

                      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {kamCountriesList.map(name => {
                          const c = countries[name];
                          if (!c) return null;
                          const clr = CLUSTER_COLORS[c.cluster_name] || '#3b82f6';
                          return (
                            <div
                              key={name}
                              className="region-country-card"
                              onClick={() => setSelectedCountry(name)}
                              style={{
                                background: 'var(--bg-card2)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.borderColor = 'var(--blue)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  <CountryFlag iso={c.iso} country={name} size="small" />
                                  <span>{name}</span>
                                </span>
                                <span style={{
                                  fontSize: '9px',
                                  background: `${clr}15`,
                                  color: clr,
                                  border: `1px solid ${clr}33`,
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  fontWeight: '600'
                                }}>
                                  {c.num_operators} Ops
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                                <span>{c.region} {c.sub_region ? '· ' + c.sub_region : ''}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{c.cluster_name}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : activeRegion !== 'all' ? (
                    <div className="region-sidebar" style={{
                      width: '320px',
                      background: 'var(--bg-card)',
                      borderRight: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      overflow: 'hidden'
                    }}>
                      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                          {activeRegion} Countries
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {Object.values(countries).filter(c => c.region === activeRegion).length} markets available
                        </div>
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(countries)
                          .filter(([_, c]) => c.region === activeRegion)
                          .sort((a, b) => a[0].localeCompare(b[0]))
                          .map(([name, c]) => {
                            const clr = CLUSTER_COLORS[c.cluster_name] || '#3b82f6';
                            return (
                              <div
                                key={name}
                                className="region-country-card"
                                onClick={() => setSelectedCountry(name)}
                                style={{
                                  background: 'var(--bg-card2)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '8px',
                                  padding: '12px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--blue)';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--border)';
                                  e.currentTarget.style.transform = 'none';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <CountryFlag iso={c.iso} country={name} size="small" />
                                    <span>{name}</span>
                                  </span>
                                  <span style={{
                                    fontSize: '9px',
                                    background: `${clr}15`,
                                    color: clr,
                                    border: `1px solid ${clr}33`,
                                    padding: '2px 6px',
                                    borderRadius: '10px',
                                    fontWeight: '600'
                                  }}>
                                    {c.num_operators} Ops
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                                  <span>{c.sub_region || '—'}</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>{c.cluster_name}</span>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>
                  ) : null}

                  <div id="map-container">
                    <MapComponent
                      countries={countries}
                      currentLens={currentLens}
                      activeRegion={activeRegion}
                      selectedKam={selectedKam}
                      kamCountries={kamCountriesList}
                      onSelectCountry={setSelectedCountry}
                      theme={theme}
                    />
                    <div id="map-hover-box">Click any country to open detailed analysis</div>

                    {/* Map Legend */}
                    <div id="legend">
                      <h4 id="legend-title">
                        {
                          {
                            cluster: 'Market Cluster',
                            fraud: 'Fraud Risk',
                            fiveG: '5G Readiness',
                            roaming: 'Roaming Intensity',
                            arpu: 'ARPU Pressure'
                          }[currentLens]
                        }
                      </h4>
                      <div id="legend-items">
                        {currentLens === 'cluster' ? (
                          [...new Set(Object.values(countries).map(c => c.cluster_name))]
                            .filter(name => CLUSTER_COLORS[name])
                            .sort((a, b) => (TIER_ORDER[a] ?? 99) - (TIER_ORDER[b] ?? 99))
                            .map(name => (
                              <div className="legend-row" key={name}>
                                <div className="legend-dot" style={{ background: CLUSTER_COLORS[name] }}></div>
                                {name}
                              </div>
                            ))
                        ) : currentLens === 'fraud' ? (
                          [
                            { label: 'Very Low', color: '#1ABC9C' },
                            { label: 'Low', color: '#F39C12' },
                            { label: 'Medium', color: '#E67E22' },
                            { label: 'High', color: '#E74C3C' },
                            { label: 'Critical', color: '#C0392B' }
                          ].map(item => (
                            <div className="legend-row" key={item.label}>
                              <div className="legend-dot" style={{ background: item.color }}></div>
                              {item.label}
                            </div>
                          ))
                        ) : currentLens === 'fiveG' ? (
                          [
                            { label: '<20%', color: '#1e3054' },
                            { label: '20-40%', color: '#1A5276' },
                            { label: '40-60%', color: '#2471A3' },
                            { label: '60-80%', color: '#2980B9' },
                            { label: '>80%', color: '#1ABC9C' }
                          ].map(item => (
                            <div className="legend-row" key={item.label}>
                              <div className="legend-dot" style={{ background: item.color }}></div>
                              {item.label}
                            </div>
                          ))
                        ) : currentLens === 'roaming' ? (
                          [
                            { label: 'Minimal', color: '#1e3054' },
                            { label: 'Low', color: '#1A5276' },
                            { label: 'Moderate', color: '#2471A3' },
                            { label: 'High', color: '#2980B9' },
                            { label: 'Very High', color: '#1ABC9C' }
                          ].map(item => (
                            <div className="legend-row" key={item.label}>
                              <div className="legend-dot" style={{ background: item.color }}></div>
                              {item.label}
                            </div>
                          ))
                        ) : (
                          [
                            { label: 'Growing', color: '#27AE60' },
                            { label: 'Stable', color: '#F39C12' },
                            { label: 'Pressure', color: '#E67E22' },
                            { label: 'Critical', color: '#E74C3C' }
                          ].map(item => (
                            <div className="legend-row" key={item.label}>
                              <div className="legend-dot" style={{ background: item.color }}></div>
                              {item.label}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right panel: Dynamic Dashboard (Global / Regional Overview) */}
              {!selectedCountry && showGlobalOverview && (
                <div className="dashboard-wrapper">
                  <DynamicCenterDashboard
                    selectedCountry={null}
                    countryData={aggregateRegionData(activeRegion)}
                    allCountries={countries}
                    metadata={metadata}
                    getFlagEmoji={getFlagEmoji}
                    theme={theme}
                    ticketData={ticketData}
                    amcData={amcData}
                    competitorData={competitorData}
                    accountData={accountData}
                    isDataLoading={isDataLoading}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    selectedOperator={selectedOperator}
                    setSelectedOperator={setSelectedOperator}
                    setSelectedCountry={setSelectedCountry}
                    submissions={submissions}
                    onAddSubmission={handleAddSubmission}
                    onUpdateAccountData={handleUpdateAccountData}
                    activeRegion={activeRegion}
                    setActiveRegion={setActiveRegion}
                    onCloseOverview={() => setShowGlobalOverview(false)}
                  />
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* COMPARISON SLIDE-UP PILLS BAR */}
      {compareList.length > 0 && (
        <div id="compare-bar" className="visible">
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
            COMPARING:
          </span>
          <div id="compare-pills" style={{ display: 'flex', gap: '8px' }}>
            {compareList.map(c => (
              <div className="compare-pill" key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <CountryFlag iso={countries[c]?.iso} country={c} size="small" />
                <span>{c}</span>
                <span className="compare-remove" onClick={() => removeCompare(c)}>✕</span>
              </div>
            ))}
          </div>
          <button id="compare-go" onClick={() => setIsCompareOpen(true)}>
            Compare Now →
          </button>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
            onClick={() => setCompareList([])}
          >
            ✕
          </button>
        </div>
      )}


      {/* SIDE-BY-SIDE COMPARISON MODAL */}
      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        compareList={compareList}
        setCompareList={setCompareList}
        countries={countries}
        getFlagEmoji={getFlagEmoji}
      />
    </>
  );
}
