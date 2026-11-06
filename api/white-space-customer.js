import { fetchCustomerMapping, fetchSkygeni, fetchCustomerHealth } from './_lib/data_layer.js';
import { resolveLogicalCustomer, cleanString } from './_lib/resolver.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { customer, country } = req.query;
  if (!customer) return res.status(400).json({ error: 'Missing customer parameter' });
  
  try {
    const [healthData, allMappings, skygeni] = await Promise.all([
      fetchCustomerHealth(),
      fetchCustomerMapping(),
      fetchSkygeni()
    ]);
    
    // 1. Resolve to canonical LogicalCustomer name
    const canonicalName = resolveLogicalCustomer(customer, country, healthData, allMappings) || customer;
    
    // 2. Collect all recognized alias names for this customer
    const matchedMappings = allMappings.filter(m => 
      cleanString(m.logical_customer) === cleanString(canonicalName) ||
      cleanString(m.value) === cleanString(canonicalName) ||
      cleanString(m.value) === cleanString(customer) ||
      cleanString(m.logical_customer) === cleanString(customer)
    );
    
    const customerAccountNames = new Set([
      cleanString(canonicalName),
      cleanString(customer),
      ...matchedMappings.map(m => cleanString(m.value)),
      ...matchedMappings.map(m => cleanString(m.logical_customer))
    ]);
    
    // 3. Filter SkyGeni records matching any of this customer's account names
    let customerSkygeni = skygeni.filter(r => customerAccountNames.has(cleanString(r.account_name)));

    // Fallback: If no records found, try matching within the specific country in SkyGeni
    if (customerSkygeni.length === 0 && country) {
      const countryClean = cleanString(country);
      const countrySkygeni = skygeni.filter(r => cleanString(r.country) === countryClean || cleanString(r.raw_country) === countryClean);
      const custClean = cleanString(customer);
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
    
    // Peer suggestions: used by >= 3 other accounts in the same region, but not by this customer
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
    
    res.status(200).json({
      canonical_customer: canonicalName,
      business_units: buData,
      peer_suggestions: peerSuggestions
    });
  } catch (err) {
    console.error("Error in white-space-customer:", err);
    res.status(500).json({ error: 'Failed to fetch white space data' });
  }
}
