export function exportReport(currentCountry, countryData, metadata, selectedOperator = null) {
  if (!currentCountry || !countryData) {
    alert('Please select a country first to export its report.');
    return;
  }
  const v = countryData;
  const date = new Date().toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'});
  const targetOp = selectedOperator;
  const filteredOperators = targetOp 
    ? v.operators.filter(op => op.operator.toLowerCase().includes(targetOp.toLowerCase()) || targetOp.toLowerCase().includes(op.operator.toLowerCase()))
    : v.operators;
  const opsToRender = (filteredOperators && filteredOperators.length > 0) ? filteredOperators : v.operators;

  const printWin = window.open('', '_blank');
  printWin.document.write(`<!DOCTYPE html><html><head>
    <title>Mobileum Intelligence Report — ${currentCountry}${targetOp ? ' (' + targetOp + ')' : ''}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:30px;color:#111;line-height:1.5}
      h1{color:#1d4ed8;font-size:20px}h2{color:#2563eb;font-size:14px;margin-top:20px;border-bottom:1px solid #ddd;padding-bottom:4px}
      table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}
      th{background:#1d4ed8;color:#fff;padding:6px 10px;text-align:left}
      td{padding:6px 10px;border-bottom:1px solid #eee}
      .kpi{display:inline-block;background:#f0f6ff;border:1px solid #ddd;border-radius:6px;padding:8px 12px;margin:4px;min-width:120px}
      .kpi-label{font-size:9px;color:#666;text-transform:uppercase}
      .kpi-value{font-size:18px;font-weight:700;color:#1d4ed8}
      .top-badge{background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:8px 12px;margin-top:10px}
      .footer{margin-top:30px;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:10px}
      .highlight-row{background:#eff6ff;font-weight:bold}
    </style></head><body>
    <h1>🌐 Mobileum Global Telecom Intelligence Report</h1>
    <p style="color:#666;font-size:12px">Generated: ${date} | Confidential ${targetOp ? ' | Filtered for Operator: ' + targetOp : ''}</p>
    <h2>${getFlagEmoji(v.iso)} ${currentCountry} — ${v.region}${v.sub_region ? ' / ' + v.sub_region : ''}${targetOp ? ' (' + targetOp + ')' : ''}</h2>
    <div>
      <div class="kpi"><div class="kpi-label">Population</div><div class="kpi-value">${v.population_mln?.toFixed(0)||'—'}M</div></div>
      <div class="kpi"><div class="kpi-label">Mobile Users</div><div class="kpi-value">${v.mobile_users_mln?.toFixed(0)||'—'}M</div></div>
      <div class="kpi"><div class="kpi-label">Penetration</div><div class="kpi-value">${v.mobile_penetration_pct?.toFixed(0)||'—'}%</div></div>
      <div class="kpi"><div class="kpi-label">GDP Growth</div><div class="kpi-value">${v.gdp_growth_pct||'—'}%</div></div>
      <div class="kpi"><div class="kpi-label">5G Avg</div><div class="kpi-value">${v.stats?.avg_5g?.toFixed(0)||'—'}%</div></div>
      <div class="kpi"><div class="kpi-label">Avg Age</div><div class="kpi-value">${v.avg_age||'—'} yrs</div></div>
    </div>
    <h2>Operators (${opsToRender.length}${targetOp ? ' Filtered' : ''})</h2>
    <table><tr><th>Operator</th><th>Subs (M)</th><th>Market Share</th><th>5G %</th><th>Revenue Trend</th><th>Profitability</th></tr>
    ${opsToRender.map(op => {
      const isSel = targetOp && op.operator.toLowerCase().includes(targetOp.toLowerCase());
      return `<tr class="${isSel ? 'highlight-row' : ''}"><td>${op.operator}</td><td>${op.sub_base_mln||'—'}</td><td>${op.market_share_pct||'—'}%</td><td>${op.fiveG_pct||'—'}%</td><td>${op.revenue_growth||'—'}</td><td>${op.profitability||'—'}</td></tr>`;
    }).join('')}
    </table>
    <h2>Top Mobileum Recommendations</h2>
    ${v.product_ranking?.slice(0,5).map((p,i) => `
      <div class="top-badge" style="${i===0?'':'background:#f9fafb;border-color:#ddd;'}">
        <strong>#${i+1} ${p.product}</strong> — Score: ${p.score}/100<br>
        <span style="font-size:11px;color:#555">${p.reason}</span>
      </div>`).join('')}
    <h2>Market Cluster</h2>
    <p><strong>${v.cluster_name}</strong><br>${v.cluster_play || ''}</p>
    ${v.anomaly_text ? `<h2>Statistical Anomaly</h2><p style="background:#fffbeb;padding:8px;border-left:3px solid #f59e0b">${v.anomaly_text}</p>` : ''}
    <div class="footer">
      <strong>Data Sources:</strong> ${metadata.data_sources?.join(' | ') || ''}<br>
      Mobileum Global Telecom Intelligence Platform · ${date}
    </div>
    </body></html>`);
  printWin.document.close();
  printWin.print();
}

const ISO3_TO_ISO2 = {
  AFG: 'af', ALB: 'al', DZA: 'dz', AND: 'ad', AGO: 'ao', ARG: 'ar', ARM: 'am', AUS: 'au', AUT: 'at', AZE: 'az',
  BHS: 'bs', BHR: 'bh', BGD: 'bd', BRB: 'bb', BLR: 'by', BEL: 'be', BLZ: 'bz', BEN: 'bj', BTN: 'bt', BOL: 'bo',
  BIH: 'ba', BWA: 'bw', BRA: 'br', BRN: 'bn', BGR: 'bg', BFA: 'bf', BDI: 'bi', KHM: 'kh', CMR: 'cm', CAN: 'ca',
  CPV: 'cv', CAF: 'cf', TCD: 'td', CHL: 'cl', CHN: 'cn', COL: 'co', COM: 'km', COG: 'cg', COD: 'cd', CRI: 'cr',
  CIV: 'ci', HRV: 'hr', CUB: 'cu', CYP: 'cy', CZE: 'cz', DNK: 'dk', DJI: 'dj', DMA: 'dm', DOM: 'do', ECU: 'ec',
  EGY: 'eg', SLV: 'sv', GNQ: 'gq', ERI: 'er', EST: 'ee', SWZ: 'sz', ETH: 'et', FJI: 'fj', FIN: 'fi', FRA: 'fr',
  GAB: 'ga', GMB: 'gm', GEO: 'ge', DEU: 'de', GHA: 'gh', GRC: 'gr', GRD: 'gd', GTM: 'gt', GIN: 'gn', GNB: 'gw',
  GUY: 'gy', HTI: 'ht', HND: 'hn', HUN: 'hu', ISL: 'is', IND: 'in', IDN: 'id', IRN: 'ir', IRQ: 'iq', IRL: 'ie',
  ISR: 'il', ITA: 'it', JAM: 'jm', JPN: 'jp', JOR: 'jo', KAZ: 'kz', KEN: 'ke', KIR: 'ki', PRK: 'kp', KOR: 'kr',
  KWT: 'kw', KGZ: 'kg', LAO: 'la', LVA: 'lv', LBN: 'lb', LSO: 'ls', LBR: 'lr', LBY: 'ly', LIE: 'li', LTU: 'lt',
  LUX: 'lu', MKD: 'mk', MDG: 'mg', MWI: 'mw', MYS: 'my', MDV: 'mv', MLI: 'ml', MLT: 'mt', MHL: 'mh', MRT: 'mr',
  MUS: 'mu', MEX: 'mx', FSM: 'fm', MDA: 'md', MCO: 'mc', MNG: 'mn', MNE: 'me', MAR: 'ma', MOZ: 'mz', MMR: 'mm',
  NAM: 'na', NRU: 'nr', NPL: 'np', NLD: 'nl', NZL: 'nz', NIC: 'ni', NER: 'ne', NGA: 'ng', NOR: 'no', OMN: 'om',
  PAK: 'pk', PLW: 'pw', PSE: 'ps', PAN: 'pa', PNG: 'pg', PRY: 'py', PER: 'pe', PHL: 'ph', POL: 'pl', PRT: 'pt',
  QAT: 'qa', ROU: 'ro', RUS: 'ru', RWA: 'rw', KNA: 'kn', LCA: 'lc', VCT: 'vc', WSM: 'ws', SMR: 'sm', STP: 'st',
  SAU: 'sa', SEN: 'sn', SRB: 'rs', SYC: 'sc', SLE: 'sl', SGP: 'sg', SVK: 'sk', SVN: 'si', SLB: 'sb', SOM: 'so',
  ZAF: 'za', SSD: 'ss', ESP: 'es', LKA: 'lk', SDN: 'sd', SUR: 'sr', SWE: 'se', CHE: 'ch', SYR: 'sy', TWN: 'tw',
  TJK: 'tj', TZA: 'tz', THA: 'th', TLS: 'tl', TGO: 'tg', TON: 'to', TTO: 'tt', TUN: 'tn', TUR: 'tr', TKM: 'tm',
  TUV: 'tv', UGA: 'ug', UKR: 'ua', ARE: 'ae', GBR: 'gb', USA: 'us', URY: 'uy', UZB: 'uz', VUT: 'vu', VEN: 've',
  VNM: 'vn', YEM: 'ye', ZMB: 'zm', ZWE: 'zw', XKX: 'xk'
};

export function getFlagImgUrl(iso) {
  if (!iso || iso === 'UNK') return null;
  const code = (iso.length === 2 ? iso : ISO3_TO_ISO2[iso.toUpperCase()]) || iso.toLowerCase();
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

export function getFlagEmoji(iso) {
  if (!iso || iso === 'UNK') return '🌐';
  const iso2 = (iso.length === 2 ? iso : ISO3_TO_ISO2[iso.toUpperCase()]) || null;
  if (iso2 && iso2.length === 2) {
    const codePoints = iso2
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  return '🌐';
}
