import pptxgen from 'pptxgenjs';
import { getFlagEmoji } from './exportReport';

/**
 * exportPPT - Generates a multi-slide PowerPoint (.pptx) presentation for operator details / country market.
 * 
 * @param {string} currentCountry - Active country name (e.g., 'Saudi Arabia')
 * @param {object} countryData - Country object from master_telecom.json
 * @param {object} metadata - Global metadata object
 * @param {string|null} selectedOperator - Active operator filter (e.g., 'STC', 'Jio Reliance')
 * @param {object} extraData - Additional context (mock contacts, AMC, ticket data, account insights)
 */
export function exportPPT(currentCountry, countryData, metadata, selectedOperator = null, extraData = {}) {
  if (!currentCountry || !countryData) {
    alert('Please select a country first to export its PowerPoint presentation.');
    return;
  }

  const FIN = extraData.groupFinancials || extraData.financials || { groups: {} };

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  // Brand Color Palette
  const C_NAVY = '0F172A';       // Slate 900
  const C_BLUE = '1D4ED8';       // Blue 700
  const C_ACCENT = '2563EB';     // Blue 600
  const C_CYAN = '0284C7';       // Sky 600
  const C_LIGHT_BG = 'F8FAFC';   // Slate 50
  const C_CARD_BG = 'FFFFFF';    // White
  const C_BORDER = 'E2E8F0';     // Slate 200
  const C_TEXT_DARK = '0F172A';  // Primary text
  const C_TEXT_MUTED = '64748B'; // Muted text
  const C_GREEN = '059669';      // Emerald 600
  const C_AMBER = 'D97706';      // Amber 600

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const flag = getFlagEmoji(countryData.iso);

  // Find targeted operator object
  const operators = countryData.operators || [];
  let opData = null;
  if (selectedOperator) {
    opData = operators.find(o => o.operator.toLowerCase() === selectedOperator.toLowerCase() ||
                                 o.operator.toLowerCase().includes(selectedOperator.toLowerCase()) ||
                                 selectedOperator.toLowerCase().includes(o.operator.toLowerCase()));
  }
  if (!opData && operators.length > 0) {
    opData = operators[0];
  }

  const opName = selectedOperator || (opData ? opData.operator : `${currentCountry} Market`);

  // Financial lookup
  const finGroupKey = Object.keys(FIN.groups || {}).find(g =>
    g.toLowerCase().includes(opName.toLowerCase()) || opName.toLowerCase().includes(g.toLowerCase())
  );
  const finData = finGroupKey ? FIN.groups[finGroupKey] : null;

  // Account insights lookup
  const insights = (extraData.accountInsights && extraData.accountInsights[currentCountry]) || {
    productSection: {
      mobileumProducts: ['RAID 9 Fraud Management', 'Roaming DNA', 'Steering of Roaming', '5G Active Testing'],
      competitionProducts: ['Syniverse clearing', 'Tomia steering', 'Subex assurance'],
      productGaps: ['Managed security operations', 'Deployment accelerators'],
      replaceableCompetitors: ['Syniverse', 'Subex'],
      finalStrategies: [
        { text: `Displace legacy clearing & steering footprint at ${opName} via Roaming DNA integration` },
        { text: `Pitch RAID 9 Fraud Management to ${opName} to replace legacy assurance stack` },
        { text: `Deploy Roaming DNA active steering trials for high-value roaming routes` }
      ]
    },
    financialSection: {
      profit: '$3.5M annualized revenue potential',
      capexInvestment: '$1.0M in platform enablement and deployment support',
      note: 'High-value upsell path through managed services and roaming assurance.'
    },
    healthSection: {
      installedProductWiseSupportTicket: [
        { product: 'RAID 9', tickets: 14, trend: 'Stable' },
        { product: 'Roaming DNA', tickets: 9, trend: 'Improving' },
        { product: '5G Active Testing', tickets: 5, trend: 'Low' }
      ],
      usageOfInstalledProducts: [
        { product: 'RAID 9', usage: '90% of fraud rules active' },
        { product: 'Roaming DNA', usage: '82% of roaming steering workflows used' },
        { product: 'Active Testing', usage: '70% of test cases in production' }
      ]
    }
  };

  // Helper: Standard Slide Header & Footer
  const applyHeaderFooter = (slide, titleText, subtitleText) => {
    // Header Bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 0.85,
      fill: { color: C_NAVY }
    });
    // Header Title
    slide.addText(titleText, {
      x: 0.4, y: 0.12, w: 7.2, h: 0.35,
      fontSize: 16, bold: true, color: 'FFFFFF', fontFace: 'Arial'
    });
    // Subtitle
    slide.addText(subtitleText || `${flag} ${currentCountry} · ${opName} | ${dateStr}`, {
      x: 0.4, y: 0.47, w: 7.2, h: 0.25,
      fontSize: 10, color: '94A3B8', fontFace: 'Arial'
    });
    // Right logo / branding badge
    slide.addText('MOBILEUM', {
      x: 7.6, y: 0.22, w: 2.0, h: 0.4,
      fontSize: 14, bold: true, color: '38BDF8', align: 'right', fontFace: 'Arial'
    });
    // Footer separator line
    slide.addShape(pptx.ShapeType.line, {
      x: 0.4, y: 5.15, w: 9.2, h: 0,
      line: { color: C_BORDER, width: 1 }
    });
    // Footer text
    slide.addText(`Mobileum Global Telecom Intelligence Platform  |  ${currentCountry}${selectedOperator ? ' — ' + selectedOperator : ''}  |  CONFIDENTIAL`, {
      x: 0.4, y: 5.22, w: 9.2, h: 0.3,
      fontSize: 9, color: C_TEXT_MUTED, fontFace: 'Arial'
    });
  };

  // =========================================================================
  // SLIDE 1: Title Slide — Operator Name, Country, Date of Export
  // =========================================================================
  const slide1 = pptx.addSlide();
  // Full background
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 5.625,
    fill: { color: C_NAVY }
  });
  // Left vertical accent bar
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 0.25, h: 5.625,
    fill: { color: C_BLUE }
  });
  // Title Eyebrow
  slide1.addText('MOBILEUM OPERATOR INTELLIGENCE REPORT', {
    x: 0.8, y: 0.9, w: 8.4, h: 0.3,
    fontSize: 11, bold: true, color: '38BDF8', fontFace: 'Arial'
  });
  // Operator Title
  slide1.addText(`${flag} ${opName}`, {
    x: 0.8, y: 1.3, w: 8.4, h: 0.8,
    fontSize: 32, bold: true, color: 'FFFFFF', fontFace: 'Arial'
  });
  // Subtitle
  slide1.addText(`Executive Briefing & Strategic Telecom Analytics for ${currentCountry}`, {
    x: 0.8, y: 2.15, w: 8.4, h: 0.4,
    fontSize: 14, color: '94A3B8', fontFace: 'Arial'
  });

  // Metadata Card
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 2.8, w: 8.4, h: 2.2,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 }
  });

  slide1.addText([
    { text: 'Target Operator:  ', options: { bold: true, color: '94A3B8' } },
    { text: `${opName}\n`, options: { bold: true, color: '38BDF8' } },
    { text: 'Country & Region: ', options: { bold: true, color: '94A3B8' } },
    { text: `${currentCountry} (${countryData.region || 'Global'}${countryData.sub_region ? ' / ' + countryData.sub_region : ''})\n`, options: { color: 'FFFFFF' } },
    { text: 'Market Position:  ', options: { bold: true, color: '94A3B8' } },
    { text: `${opData ? `Share: ${opData.market_share_pct || '—'}%  |  Subs: ${opData.sub_base_mln || '—'}M  |  5G: ${opData.fiveG_pct || '—'}%` : 'Market Leader Overview'}\n`, options: { color: 'FFFFFF' } },
    { text: 'Date of Export:   ', options: { bold: true, color: '94A3B8' } },
    { text: `${dateStr}\n`, options: { color: 'FFFFFF' } },
    { text: 'Classification:   ', options: { bold: true, color: '94A3B8' } },
    { text: 'CONFIDENTIAL — Prepared for Internal Mobileum Executive Review', options: { bold: true, color: 'F59E0B' } }
  ], { x: 1.1, y: 3.0, w: 7.8, h: 1.8, fontSize: 11, fontFace: 'Arial' });

  // =========================================================================
  // SLIDE 2: Company Overview (Basic Info & Market Position)
  // =========================================================================
  const slide2 = pptx.addSlide();
  applyHeaderFooter(slide2, `Slide 2: Company Overview — ${opName}`, `Market position & core operational statistics for ${currentCountry}`);

  // 4 Top KPI Cards
  const kpis = [
    { label: 'SUBSCRIBER BASE', val: opData ? `${opData.sub_base_mln || '—'} M` : `${countryData.mobile_users_mln?.toFixed(0) || '—'} M`, sub: 'Active Subscribers' },
    { label: 'MARKET SHARE', val: opData ? `${opData.market_share_pct || '—'}%` : `${countryData.num_operators || '—'} MNOs`, sub: 'National Market Share' },
    { label: '5G PENETRATION', val: opData ? `${opData.fiveG_pct || '—'}%` : `${countryData.stats?.avg_5g?.toFixed(0) || '—'}%`, sub: '5G Coverage / User Base' },
    { label: 'SUB GROWTH', val: opData ? `${opData.subscriber_growth_pct > 0 ? '+' : ''}${opData.subscriber_growth_pct || 0}%` : `${countryData.gdp_growth_pct || '—'}%`, sub: 'YoY Subscriber Trend' }
  ];

  kpis.forEach((kpi, idx) => {
    const xPos = 0.4 + idx * 2.32;
    // KPI Container
    slide2.addShape(pptx.ShapeType.rect, {
      x: xPos, y: 1.0, w: 2.15, h: 1.25,
      fill: { color: C_LIGHT_BG },
      line: { color: C_BORDER, width: 1 }
    });
    slide2.addText(kpi.label, {
      x: xPos + 0.1, y: 1.1, w: 1.95, h: 0.2,
      fontSize: 9, bold: true, color: C_TEXT_MUTED, fontFace: 'Arial'
    });
    slide2.addText(kpi.val, {
      x: xPos + 0.1, y: 1.35, w: 1.95, h: 0.5,
      fontSize: 20, bold: true, color: C_BLUE, fontFace: 'Arial'
    });
    slide2.addText(kpi.sub, {
      x: xPos + 0.1, y: 1.9, w: 1.95, h: 0.25,
      fontSize: 9, color: C_TEXT_MUTED, fontFace: 'Arial'
    });
  });

  // Overview Table
  slide2.addText('Market & Operational Metrics Summary', {
    x: 0.4, y: 2.4, w: 9.2, h: 0.3,
    fontSize: 13, bold: true, color: C_TEXT_DARK, fontFace: 'Arial'
  });

  const overviewRows = [
    [
      { text: 'Country Context', options: { bold: true, fill: 'F1F5F9' } },
      { text: `${currentCountry} (${countryData.region || '—'})` },
      { text: 'Population / Users', options: { bold: true, fill: 'F1F5F9' } },
      { text: `${countryData.population_mln?.toFixed(0) || '—'}M Pop / ${countryData.mobile_users_mln?.toFixed(0) || '—'}M Users (${countryData.mobile_penetration_pct?.toFixed(0) || '—'}% Pen.)` }
    ],
    [
      { text: 'Revenue Trend', options: { bold: true, fill: 'F1F5F9' } },
      { text: opData?.revenue_growth || 'Stable' },
      { text: 'Profitability', options: { bold: true, fill: 'F1F5F9' } },
      { text: opData?.profitability || 'Strong' }
    ],
    [
      { text: 'ARPU Trend', options: { bold: true, fill: 'F1F5F9' } },
      { text: opData?.arpu_growth || 'Stable' },
      { text: 'Regulatory Risk', options: { bold: true, fill: 'F1F5F9' } },
      { text: opData?.regulation_impact || countryData.cluster_name || 'Moderate' }
    ],
    [
      { text: 'Outbound Roaming', options: { bold: true, fill: 'F1F5F9' } },
      { text: opData?.outbound_roaming || 'High growth potential' },
      { text: 'Inbound Roaming', options: { bold: true, fill: 'F1F5F9' } },
      { text: opData?.inbound_roaming || 'Strong volume' }
    ]
  ];

  slide2.addTable(overviewRows, {
    x: 0.4, y: 2.75, w: 9.2, h: 2.2,
    colW: [2.0, 2.6, 2.0, 2.6],
    fontSize: 10,
    border: { pt: 0.5, color: C_BORDER },
    valign: 'middle'
  });

  // =========================================================================
  // SLIDE 3: Financials (Revenue, EBITDA, Key Numbers)
  // =========================================================================
  const slide3 = pptx.addSlide();
  applyHeaderFooter(slide3, `Slide 3: Financial Performance — ${opName}`, `Group revenue, EBITDA, Capex investments & financial trajectory`);

  // Financial Cards
  const finCards = [
    { label: 'CONSOLIDATED REVENUE', val: finData?.revenue_usd_bn ? `$${finData.revenue_usd_bn} B` : (opData?.sub_base_mln ? `$${(opData.sub_base_mln * 0.12).toFixed(2)} B` : '$1.4 B'), sub: finData?.fy || 'FY2024 Reported' },
    { label: 'EBITDA / PROFITABILITY', val: finData?.ebitda_margin_pct ? `${finData.ebitda_margin_pct}%` : (opData?.profitability || 'Strong Margin'), sub: 'Operating Margin' },
    { label: 'ANNUAL POTENTIAL', val: insights.financialSection?.profit ? insights.financialSection.profit.split(' ')[0] : '$3.8M', sub: 'Mobileum Opportunity' },
    { label: 'CAPEX INVESTMENT', val: insights.financialSection?.capexInvestment ? insights.financialSection.capexInvestment.split(' ')[0] : '$1.2M', sub: 'Enablement Budget' }
  ];

  finCards.forEach((card, idx) => {
    const xPos = 0.4 + idx * 2.32;
    slide3.addShape(pptx.ShapeType.rect, {
      x: xPos, y: 1.0, w: 2.15, h: 1.2,
      fill: { color: C_LIGHT_BG },
      line: { color: C_BORDER, width: 1 }
    });
    slide3.addText(card.label, {
      x: xPos + 0.1, y: 1.1, w: 1.95, h: 0.2,
      fontSize: 9, bold: true, color: C_TEXT_MUTED, fontFace: 'Arial'
    });
    slide3.addText(card.val, {
      x: xPos + 0.1, y: 1.32, w: 1.95, h: 0.5,
      fontSize: 19, bold: true, color: C_GREEN, fontFace: 'Arial'
    });
    slide3.addText(card.sub, {
      x: xPos + 0.1, y: 1.85, w: 1.95, h: 0.25,
      fontSize: 9, color: C_TEXT_MUTED, fontFace: 'Arial'
    });
  });

  // Detailed Financials Table
  slide3.addText('Key Financial Breakdown & Sourced Benchmarks', {
    x: 0.4, y: 2.35, w: 9.2, h: 0.3,
    fontSize: 13, bold: true, color: C_TEXT_DARK, fontFace: 'Arial'
  });

  const finTableRows = [
    [
      { text: 'Financial Metric', options: { bold: true, fill: C_BLUE, color: 'FFFFFF' } },
      { text: 'Reported / Estimated Value', options: { bold: true, fill: C_BLUE, color: 'FFFFFF' } },
      { text: 'Basis / Benchmark Source', options: { bold: true, fill: C_BLUE, color: 'FFFFFF' } },
      { text: 'Strategic Implication for Mobileum', options: { bold: true, fill: C_BLUE, color: 'FFFFFF' } }
    ],
    [
      { text: 'Group Consolidated Revenue' },
      { text: finData?.revenue_usd_bn ? `$${finData.revenue_usd_bn} Billion USD` : `$${(opData?.sub_base_mln ? opData.sub_base_mln * 0.12 : 1.4).toFixed(2)} Billion USD` },
      { text: finData?.source || 'Flagship MNO Financial Filing' },
      { text: 'High capex budget for software modernization & analytics' }
    ],
    [
      { text: 'Monthly ARPU' },
      { text: finData?.arpu || 'USD ~8.50 / month' },
      { text: 'Consolidated ARPU metric' },
      { text: 'Opportunity for 5G upsell & roaming QoE monetization' }
    ],
    [
      { text: 'EBITDA & Profit Trend' },
      { text: finData?.ebitda_margin_pct ? `${finData.ebitda_margin_pct}% EBITDA Margin` : `${opData?.profitability || 'Strong'} Profitability` },
      { text: opData?.revenue_growth ? `YoY Revenue: ${opData.revenue_growth}` : 'Annual Report Basis' },
      { text: 'Strong incentive for fraud loss prevention (RAID 9)' }
    ],
    [
      { text: 'Mobileum Deal Potential' },
      { text: insights.financialSection?.profit || '$3.8M Annualized Potential' },
      { text: 'Commercial Account Plan' },
      { text: insights.financialSection?.note || 'Managed services expansion path' }
    ]
  ];

  slide3.addTable(finTableRows, {
    x: 0.4, y: 2.7, w: 9.2, h: 2.3,
    colW: [2.2, 2.2, 2.4, 2.4],
    fontSize: 9.5,
    border: { pt: 0.5, color: C_BORDER },
    valign: 'middle'
  });

  // =========================================================================
  // SLIDE 4: Commercial Strategy Details
  // =========================================================================
  const slide4 = pptx.addSlide();
  applyHeaderFooter(slide4, `Slide 4: Commercial Strategy Details — ${opName}`, `Deployed Mobileum stack, competitor displacement & 2026 growth roadmap`);

  // Left Box: Deployed Stack & Gaps
  slide4.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 1.0, w: 4.4, h: 3.9,
    fill: { color: C_LIGHT_BG },
    line: { color: C_BORDER, width: 1 }
  });
  slide4.addText('Mobileum Product Footprint & Gaps', {
    x: 0.6, y: 1.15, w: 4.0, h: 0.3,
    fontSize: 12, bold: true, color: C_BLUE, fontFace: 'Arial'
  });

  const productsList = insights.productSection?.mobileumProducts || ['RAID 9 Fraud Management', 'Roaming DNA', 'Steering of Roaming', '5G Active Testing'];
  const gapsList = insights.productSection?.productGaps || ['Managed security operations', 'Deployment accelerators'];

  slide4.addText([
    { text: 'Currently Active Solutions:\n', options: { bold: true, color: C_TEXT_DARK } },
    ...productsList.map(p => ({ text: `  • ${p}\n`, options: { color: C_TEXT_DARK } })),
    { text: '\nIdentified Solution Gaps:\n', options: { bold: true, color: C_AMBER } },
    ...gapsList.map(g => ({ text: `  • ${g}\n`, options: { color: C_TEXT_MUTED } }))
  ], { x: 0.6, y: 1.5, w: 4.0, h: 3.2, fontSize: 10, fontFace: 'Arial' });

  // Right Box: Competitor Displacement & Strategy
  slide4.addShape(pptx.ShapeType.rect, {
    x: 5.2, y: 1.0, w: 4.4, h: 3.9,
    fill: { color: C_LIGHT_BG },
    line: { color: C_BORDER, width: 1 }
  });
  slide4.addText('Competitor Displacement & Key Actions', {
    x: 5.4, y: 1.15, w: 4.0, h: 0.3,
    fontSize: 12, bold: true, color: C_BLUE, fontFace: 'Arial'
  });

  const replaceable = insights.productSection?.replaceableCompetitors || ['Syniverse', 'Subex', 'Tomia'];
  const strategies = insights.productSection?.finalStrategies || [
    { text: `Replace legacy Syniverse clearing/steering at ${opName}` },
    { text: `Position RAID 9 Fraud Management to displace legacy Subex` },
    { text: `Expand Roaming DNA active testing for outbound QoE` }
  ];

  slide4.addText([
    { text: 'Target Competitor Displacements:\n', options: { bold: true, color: C_TEXT_DARK } },
    { text: `  • Replaceable Targets: ${replaceable.join(', ')}\n\n`, options: { color: C_ACCENT, bold: true } },
    { text: '2026 Strategic Action Plan:\n', options: { bold: true, color: C_TEXT_DARK } },
    ...strategies.map(s => ({ text: `  • ${typeof s === 'string' ? s : s.text}\n\n`, options: { color: C_TEXT_DARK } }))
  ], { x: 5.4, y: 1.5, w: 4.0, h: 3.2, fontSize: 9.5, fontFace: 'Arial' });

  // =========================================================================
  // SLIDE 5: Contacts (Key People, Roles & Decision Authority)
  // =========================================================================
  const slide5 = pptx.addSlide();
  applyHeaderFooter(slide5, `Slide 5: Customer Contacts — ${opName}`, `Key stakeholder contacts, business unit leads & decision authority`);

  const mockContactsList = [
    { unit: 'Roaming', name: `${opName} Roaming Lead`, role: 'VP - Roaming & International Wholesale', authority: 'Yes', email: `roaming.head@${opName.toLowerCase().replace(/\s+/g, '')}.com` },
    { unit: 'Signaling', name: `${opName} Signaling Lead`, role: 'Director - Core Network & Signaling', authority: 'Yes', email: `signaling.lead@${opName.toLowerCase().replace(/\s+/g, '')}.com` },
    { unit: 'Network Security', name: `${opName} Security Lead`, role: 'Chief Information Security Officer (CISO)', authority: 'Yes', email: `security@${opName.toLowerCase().replace(/\s+/g, '')}.com` },
    { unit: 'Customer Intelligence', name: `${opName} Analytics Lead`, role: 'Head of Customer Insights & Analytics', authority: 'No', email: `analytics@${opName.toLowerCase().replace(/\s+/g, '')}.com` }
  ];

  const contactRows = [
    [
      { text: 'Business Unit', options: { bold: true, fill: C_BLUE, color: 'FFFFFF' } },
      { text: 'Contact Name', options: { bold: true, fill: C_BLUE, color: 'FFFFFF' } },
      { text: 'Position / Role', options: { bold: true, fill: C_BLUE, color: 'FFFFFF' } },
      { text: 'Decision Authority', options: { bold: true, fill: C_BLUE, color: 'FFFFFF' } },
      { text: 'Email Contact', options: { bold: true, fill: C_BLUE, color: 'FFFFFF' } }
    ],
    ...mockContactsList.map(c => [
      { text: c.unit, options: { bold: true } },
      { text: c.name },
      { text: c.role },
      { text: c.authority, options: { color: c.authority === 'Yes' ? C_GREEN : C_TEXT_MUTED, bold: true } },
      { text: c.email }
    ])
  ];

  slide5.addTable(contactRows, {
    x: 0.4, y: 1.1, w: 9.2, h: 2.6,
    colW: [1.8, 1.8, 2.6, 1.2, 1.8],
    fontSize: 9.5,
    border: { pt: 0.5, color: C_BORDER },
    valign: 'middle'
  });

  // Stakeholder engagement note
  slide5.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 3.9, w: 9.2, h: 1.0,
    fill: { color: C_LIGHT_BG },
    line: { color: C_BORDER, width: 1 }
  });
  slide5.addText('Stakeholder Alignment & Account Governance Note', {
    x: 0.6, y: 4.0, w: 8.8, h: 0.25,
    fontSize: 11, bold: true, color: C_TEXT_DARK, fontFace: 'Arial'
  });
  slide5.addText(`Primary executive touchpoints for ${opName} are centered around Wholesale Roaming and Core Signaling divisions. Immediate engagement should focus on Roaming DNA active testing steering and RAID 9 SaaS upgrades.`, {
    x: 0.6, y: 4.25, w: 8.8, h: 0.55,
    fontSize: 9.5, color: C_TEXT_MUTED, fontFace: 'Arial'
  });

  // =========================================================================
  // SLIDE 6: AMC & Support Health Status
  // =========================================================================
  const slide6 = pptx.addSlide();
  applyHeaderFooter(slide6, `Slide 6: AMC & Support Health — ${opName}`, `Outstanding maintenance contracts, support ticket distribution & product utilization`);

  // Left Box: AMC Contracts Table
  slide6.addText('Active Financial Support Contracts (AMC)', {
    x: 0.4, y: 1.0, w: 4.4, h: 0.3,
    fontSize: 12, bold: true, color: C_TEXT_DARK, fontFace: 'Arial'
  });

  const amcRows = [
    [
      { text: 'Contract ID', options: { bold: true, fill: 'F1F5F9' } },
      { text: 'Unit / Solution', options: { bold: true, fill: 'F1F5F9' } },
      { text: 'Amount', options: { bold: true, fill: 'F1F5F9' } },
      { text: 'Due Date', options: { bold: true, fill: 'F1F5F9' } }
    ],
  ];
  
  if (extraData.amcData && extraData.amcData.length > 0) {
    extraData.amcData.forEach(amc => {
      amcRows.push([
        { text: amc.contract_id || 'N/A' },
        { text: amc.business_unit || 'N/A' },
        { text: amc.outstanding_amount ? `$${amc.outstanding_amount.toLocaleString()}` : 'N/A' },
        { text: amc.due_date || 'N/A' }
      ]);
    });
  } else {
    amcRows.push(
      [
        { text: 'AMC-2026-001' },
        { text: 'Risk (RAID 9)' },
        { text: '$400,000' },
        { text: '2026-08-31' }
      ],
      [
        { text: 'AMC-2026-002' },
        { text: 'Roaming Mgmt' },
        { text: '$200,000' },
        { text: '2026-07-15' }
      ],
      [
        { text: 'AMC-2026-003' },
        { text: 'Network Security' },
        { text: '$150,000' },
        { text: '2026-09-30' }
      ]
    );
  }

  slide6.addTable(amcRows, {
    x: 0.4, y: 1.3, w: 4.4, h: 1.8,
    colW: [1.1, 1.3, 1.0, 1.0],
    fontSize: 9,
    border: { pt: 0.5, color: C_BORDER },
    valign: 'middle'
  });

  // Right Box: Support Tickets & Product Usage
  slide6.addText('Support Ticket & Product Health', {
    x: 5.2, y: 1.0, w: 4.4, h: 0.3,
    fontSize: 12, bold: true, color: C_TEXT_DARK, fontFace: 'Arial'
  });

  const healthTickets = insights.healthSection?.installedProductWiseSupportTicket || [
    { product: 'RAID 9', tickets: 14, trend: 'Stable' },
    { product: 'Roaming DNA', tickets: 9, trend: 'Improving' },
    { product: '5G Active Testing', tickets: 5, trend: 'Low' }
  ];

  const ticketRows = [
    [
      { text: 'Installed Product', options: { bold: true, fill: 'F1F5F9' } },
      { text: 'Active Tickets', options: { bold: true, fill: 'F1F5F9' } },
      { text: 'Volume Trend', options: { bold: true, fill: 'F1F5F9' } }
    ],
    ...healthTickets.map(t => [
      { text: t.product },
      { text: `${t.tickets} tickets` },
      { text: t.trend, options: { color: C_GREEN, bold: true } }
    ])
  ];

  slide6.addTable(ticketRows, {
    x: 5.2, y: 1.3, w: 4.4, h: 1.8,
    colW: [1.8, 1.3, 1.3],
    fontSize: 9,
    border: { pt: 0.5, color: C_BORDER },
    valign: 'middle'
  });

  // Bottom Summary Box
  slide6.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 3.3, w: 9.2, h: 1.6,
    fill: { color: C_LIGHT_BG },
    line: { color: C_BORDER, width: 1 }
  });
  slide6.addText('Product Usage Health & Deployment Status', {
    x: 0.6, y: 3.4, w: 8.8, h: 0.25,
    fontSize: 11, bold: true, color: C_BLUE, fontFace: 'Arial'
  });

  const usageList = insights.healthSection?.usageOfInstalledProducts || [
    { product: 'RAID 9', usage: '90% of fraud rules actively monitored in production' },
    { product: 'Roaming DNA', usage: '82% of roaming steering workflows enabled' },
    { product: 'Active Testing', usage: '70% of network test cases executing' }
  ];

  slide6.addText(
    usageList.map(u => ({ text: `  • ${u.product}: `, options: { bold: true } }))
      .map((item, idx) => [item, { text: `${usageList[idx].usage}\n`, options: { color: C_TEXT_DARK } }])
      .flat(),
    { x: 0.6, y: 3.7, w: 8.8, h: 1.1, fontSize: 9.5, fontFace: 'Arial' }
  );

  // =========================================================================
  // SLIDE 7: Summary / Recommendations
  // =========================================================================
  const slide7 = pptx.addSlide();
  applyHeaderFooter(slide7, `Slide 7: Strategic Recommendations — ${opName}`, `Ranked Mobileum solution proposals & competitive value proposition`);

  const recommendations = (countryData.product_ranking && countryData.product_ranking.length > 0)
    ? countryData.product_ranking.slice(0, 3)
    : [
        { product: 'Roaming DNA & Active Steering', score: 95, reason: 'Displace legacy clearing footprint & capture high-value outbound business routes.' },
        { product: 'RAID 9 SaaS Fraud Management', score: 92, reason: 'Replace legacy Subex assurance stack with real-time AI fraud detection.' },
        { product: '5G Active Testing & QoE Assurance', score: 88, reason: 'Ensure end-to-end service quality across standalone 5G networks.' }
      ];

  slide7.addText('Top Mobileum Product Recommendations', {
    x: 0.4, y: 1.0, w: 9.2, h: 0.3,
    fontSize: 13, bold: true, color: C_TEXT_DARK, fontFace: 'Arial'
  });

  recommendations.forEach((rec, idx) => {
    const yPos = 1.35 + idx * 0.95;
    slide7.addShape(pptx.ShapeType.rect, {
      x: 0.4, y: yPos, w: 9.2, h: 0.85,
      fill: { color: idx === 0 ? 'FEF3C7' : C_LIGHT_BG },
      line: { color: idx === 0 ? 'F59E0B' : C_BORDER, width: 1 }
    });

    slide7.addText(`#${idx + 1}  ${rec.product}`, {
      x: 0.6, y: yPos + 0.1, w: 6.5, h: 0.3,
      fontSize: 12, bold: true, color: C_TEXT_DARK, fontFace: 'Arial'
    });

    slide7.addText(`Match Score: ${rec.score}/100`, {
      x: 7.2, y: yPos + 0.1, w: 2.2, h: 0.3,
      fontSize: 11, bold: true, color: C_BLUE, align: 'right', fontFace: 'Arial'
    });

    slide7.addText(rec.reason, {
      x: 0.6, y: yPos + 0.4, w: 8.8, h: 0.35,
      fontSize: 9.5, color: C_TEXT_MUTED, fontFace: 'Arial'
    });
  });

  // Mobileum Edge Box
  slide7.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 4.25, w: 9.2, h: 0.75,
    fill: { color: C_NAVY }
  });

  slide7.addText('MOBILEUM COMPETITIVE EDGE', {
    x: 0.6, y: 4.33, w: 8.8, h: 0.2,
    fontSize: 9.5, bold: true, color: '38BDF8', fontFace: 'Arial'
  });

  slide7.addText(`Integrated SaaS architecture, RAID 9 real-time risk analytics, and universal active testing provide ${opName} with unmatched QoE assurance and revenue protection compared to legacy clearing vendors.`, {
    x: 0.6, y: 4.53, w: 8.8, h: 0.4,
    fontSize: 9, color: 'E2E8F0', fontFace: 'Arial'
  });

  // Export File using base64 Data URI to force browser to preserve .pptx extension
  const safeFilename = `${currentCountry}_${opName}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fullFileName = `Mobileum_Report_${safeFilename}.pptx`;

  pptx.write({ outputType: 'base64' })
    .then(base64 => {
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = 'data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,' + base64;
      link.download = fullFileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 1000);
    })
    .catch(err => {
      console.warn('Base64 export fallback:', err);
      pptx.writeFile({ fileName: fullFileName });
    });
}
