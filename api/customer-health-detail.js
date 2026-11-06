import { fetchCustomerHealth, fetchCustomerHealthBU, fetchKpiDefs, fetchCustomerMapping } from './_lib/data_layer.js';
import { resolveLogicalCustomer } from './_lib/resolver.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { customer, country } = req.query;
  if (!customer) return res.status(400).json({ error: 'Missing customer parameter' });
  
  try {
    const healthData = await fetchCustomerHealth();
    const mappings = await fetchCustomerMapping();
    
    const canonicalName = resolveLogicalCustomer(customer, country, healthData, mappings);
    const cust = canonicalName ? healthData.find(c => c.customer_name.toLowerCase() === canonicalName.toLowerCase()) : null;
    
    if (!cust) {
      return res.status(404).json({ error: `Customer '${customer}' not found in health dataset` });
    }
    
    const buData = await fetchCustomerHealthBU(cust.customer_name);
    const kpiDefs = await fetchKpiDefs();
    
    // Top 5 reasons computation
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
    
    res.status(200).json({
        summary: cust,
        business_units: buData,
        reasons: getReasons(cust.scores || {}, cust.raw_data || {})
    });
  } catch (err) {
    console.error("Error in customer-health-detail:", err);
    res.status(500).json({ error: 'Failed to fetch customer detail' });
  }
}
