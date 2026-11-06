import { resolveLogicalCustomer, cleanString } from './resolver.js';

// Safe API fetcher: handles 404s, 500s, and HTML responses (e.g. from static host SPA redirects)
async function tryApiFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      // Returned index.html fallback from a static server (e.g. serve, nginx)
      return null;
    }
    return await res.json();
  } catch (e) {
    return null;
  }
}

// Lazy-loaded static datasets fallback
let _cachedData = null;

async function getStaticDatasets() {
  if (_cachedData) return _cachedData;

  // 1. Try dynamic imports bundled by Vite (fast, zero network latency)
  try {
    const [
      customersMod,
      mappingMod,
      buMod,
      skygeniMod,
      kpiMod,
      statusMod
    ] = await Promise.all([
      import('../data/customers.json'),
      import('../data/customer_mapping.json'),
      import('../data/business_units.json'),
      import('../data/skygeni.json'),
      import('../data/kpi_definitions.json'),
      import('../data/data_status.json')
    ]);

    _cachedData = {
      customers: customersMod.default || customersMod,
      customerMapping: mappingMod.default || mappingMod,
      businessUnits: buMod.default || buMod,
      skygeni: skygeniMod.default || skygeniMod,
      kpiDefs: kpiMod.default || kpiMod,
      dataStatus: statusMod.default || statusMod
    };
    return _cachedData;
  } catch (err) {
    console.warn('[healthApi] Bundled JSON dynamic import failed, falling back to static files:', err);
  }

  // 2. Fallback to fetching static files from /data/, /data-source/, or /data-cache/
  const fetchFile = async (name) => {
    const candidatePaths = [
      `/data/${name}`,
      `/data-source/${name}`,
      `/data-cache/${name}`
    ];
    for (const p of candidatePaths) {
      try {
        const res = await fetch(p);
        if (res.ok) {
          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('text/html')) {
            return await res.json();
          }
        }
      } catch (e) {}
    }
    return [];
  };

  const [customers, customerMapping, businessUnits, skygeni, kpiDefs, dataStatus] = await Promise.all([
    fetchFile('customers.json'),
    fetchFile('customer_mapping.json'),
    fetchFile('business_units.json'),
    fetchFile('skygeni.json'),
    fetchFile('kpi_definitions.json'),
    fetchFile('data_status.json')
  ]);

  _cachedData = {
    customers: Array.isArray(customers) ? customers : [],
    customerMapping: Array.isArray(customerMapping) ? customerMapping : [],
    businessUnits: Array.isArray(businessUnits) ? businessUnits : [],
    skygeni: Array.isArray(skygeni) ? skygeni : [],
    kpiDefs: Array.isArray(kpiDefs) ? kpiDefs : [],
    dataStatus: dataStatus || { updated_on: 'Updated on: Aug. 18, 2026' }
  };
  return _cachedData;
}

// ==========================================
// Exported API Functions with Fallbacks
// ==========================================

export const fetchHealthData = async () => {
  const live = await tryApiFetch('/api/customer-health');
  if (live && Array.isArray(live) && live.length > 0) return live;

  const data = await getStaticDatasets();
  return data.customers;
};

export const fetchHealthDetail = async (customerName, country = '') => {
  const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
  const live = await tryApiFetch(`/api/customer-health-detail?customer=${encodeURIComponent(customerName)}${countryParam}`);
  if (live && live.summary) return live;

  // Client-side fallback resolution
  const { customers, customerMapping, businessUnits, kpiDefs } = await getStaticDatasets();
  const canonicalName = resolveLogicalCustomer(customerName, country, customers, customerMapping) || customerName;
  const cust = customers.find(c => cleanString(c.customer_name) === cleanString(canonicalName));

  if (!cust) {
    return { error: `Customer '${customerName}' not found in health dataset` };
  }

  const buData = businessUnits.filter(b => b.customer_name && cleanString(b.customer_name) === cleanString(cust.customer_name));

  // Compute top 5 reasons
  const getReasons = (scores, rawData) => {
    let reasons = [];
    for (const k in scores) {
      const def = kpiDefs.find(d => d.kpi_name === k);
      if (def && def.weight > 0) {
        const s = parseFloat(scores[k]);
        if (!isNaN(s)) {
          const pointsLost = def.weight * (100 - s) / 100;
          if (pointsLost > 0) {
            reasons.push({ kpi: k, pointsLost, score: s, raw: rawData[k] });
          }
        }
      }
    }
    reasons.sort((a, b) => b.pointsLost - a.pointsLost);
    return reasons.slice(0, 5).map(r => `${r.raw} ${r.kpi} (score ${r.score} of 100)`);
  };

  return {
    summary: cust,
    business_units: buData,
    reasons: getReasons(cust.scores || {}, cust.raw_data || {})
  };
};

export const fetchCustomerNames = async (customerName) => {
  const live = await tryApiFetch(`/api/customer-names?customer=${encodeURIComponent(customerName)}`);
  if (live) return live;

  const { customers, customerMapping } = await getStaticDatasets();
  const canonicalName = resolveLogicalCustomer(customerName, '', customers, customerMapping);
  if (!canonicalName) return { aliases: [] };

  const aliases = customerMapping
    .filter(m => cleanString(m.logical_customer) === cleanString(canonicalName))
    .map(m => m.value);

  return { canonical: canonicalName, aliases: Array.from(new Set(aliases)) };
};

export const fetchWhiteSpace = async (customerName, country = '') => {
  const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
  const live = await tryApiFetch(`/api/white-space-customer?customer=${encodeURIComponent(customerName)}${countryParam}`);
  if (live && live.business_units) return live;

  // Client-side fallback resolution
  const { customers, customerMapping, skygeni } = await getStaticDatasets();
  const canonicalName = resolveLogicalCustomer(customerName, country, customers, customerMapping) || customerName;

  const matchedMappings = customerMapping.filter(m =>
    cleanString(m.logical_customer) === cleanString(canonicalName) ||
    cleanString(m.value) === cleanString(canonicalName) ||
    cleanString(m.value) === cleanString(customerName) ||
    cleanString(m.logical_customer) === cleanString(customerName)
  );

  const customerAccountNames = new Set([
    cleanString(canonicalName),
    cleanString(customerName),
    ...matchedMappings.map(m => cleanString(m.value)),
    ...matchedMappings.map(m => cleanString(m.logical_customer))
  ]);

  let customerSkygeni = skygeni.filter(r => customerAccountNames.has(cleanString(r.account_name)));

  if (customerSkygeni.length === 0 && country) {
    const countryClean = cleanString(country);
    const countrySkygeni = skygeni.filter(r => cleanString(r.country) === countryClean || cleanString(r.raw_country) === countryClean);
    const custClean = cleanString(customerName);
    const matchedRow = countrySkygeni.find(r => {
      const accClean = cleanString(r.account_name);
      return accClean.includes(custClean) || custClean.includes(accClean) ||
             (custClean.split(' ')[0] && accClean.includes(custClean.split(' ')[0]));
    });
    if (matchedRow) {
      const matchedAcc = matchedRow.account_name;
      customerSkygeni = countrySkygeni.filter(r => cleanString(r.account_name) === cleanString(matchedAcc));
      customerAccountNames.add(cleanString(matchedAcc));
    }
  }

  const allBus = Array.from(new Set(skygeni.map(r => r.bu).filter(Boolean)));
  const buData = allBus.map(bu => {
    const buRows = customerSkygeni.filter(r => cleanString(r.bu) === cleanString(bu));
    const products = Array.from(new Set(buRows.map(r => r.product_group).filter(Boolean)));
    const owners = Array.from(new Set(buRows.map(r => r.account_owner).filter(Boolean)));
    return {
      bu,
      products,
      owners,
      covered: products.length > 0
    };
  });

  const regions = Array.from(new Set(customerSkygeni.map(r => r.region).filter(Boolean)));
  const peerSkygeni = skygeni.filter(r =>
    regions.includes(r.region) && !customerAccountNames.has(cleanString(r.account_name))
  );

  const peerPgCounts = {};
  for (const r of peerSkygeni) {
    if (!r.product_group) continue;
    if (!peerPgCounts[r.product_group]) peerPgCounts[r.product_group] = new Set();
    peerPgCounts[r.product_group].add(r.account_name);
  }

  const custPgSet = new Set(customerSkygeni.map(r => r.product_group));
  const peerSuggestions = [];
  for (const [pg, accounts] of Object.entries(peerPgCounts)) {
    if (accounts.size >= 3 && !custPgSet.has(pg)) {
      peerSuggestions.push({ product_group: pg, peer_count: accounts.size });
    }
  }
  peerSuggestions.sort((a, b) => b.peer_count - a.peer_count);

  return {
    canonical_customer: canonicalName,
    business_units: buData,
    peer_suggestions: peerSuggestions
  };
};

export const fetchAccounts = async () => {
  const live = await tryApiFetch('/api/accounts');
  if (live && Array.isArray(live) && live.length > 0) return live;

  const { skygeni } = await getStaticDatasets();
  const accountsMap = {};
  for (const r of skygeni) {
    if (!accountsMap[r.account_name]) {
      accountsMap[r.account_name] = {
        account_name: r.account_name,
        region: r.region,
        country: r.country,
        bus: new Set(),
        product_groups: new Set(),
        owners: new Set()
      };
    }
    if (r.bu) accountsMap[r.account_name].bus.add(r.bu);
    if (r.product_group) accountsMap[r.account_name].product_groups.add(r.product_group);
    if (r.account_owner) {
      r.account_owner.split(',').forEach(o => accountsMap[r.account_name].owners.add(o.trim()));
    }
  }

  return Object.values(accountsMap).map(a => ({
    ...a,
    bus: Array.from(a.bus),
    product_groups: Array.from(a.product_groups),
    product_group_count: a.product_groups.size,
    owners: Array.from(a.owners)
  }));
};

export const fetchProductGroups = async () => {
  const live = await tryApiFetch('/api/product-groups');
  if (live && Array.isArray(live) && live.length > 0) return live;

  const { skygeni } = await getStaticDatasets();
  const pgs = new Set();
  skygeni.forEach(r => {
    if (r.product_group) pgs.add(r.product_group);
  });
  return Array.from(pgs).sort();
};

export const fetchKpiDefs = async () => {
  const live = await tryApiFetch('/api/kpi-definitions');
  if (live && Array.isArray(live) && live.length > 0) return live;

  const { kpiDefs } = await getStaticDatasets();
  return kpiDefs;
};

export const fetchDataStatus = async () => {
  const live = await tryApiFetch('/api/data-status');
  if (live && live.updated_on) return live;

  const { dataStatus } = await getStaticDatasets();
  return dataStatus || { updated_on: 'Updated on: Aug. 18, 2026 (with data as of April 2026)' };
};
