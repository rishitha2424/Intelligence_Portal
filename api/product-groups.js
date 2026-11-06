import { fetchSkygeni } from './_lib/data_layer.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const data = await fetchSkygeni();
    
    const pgMap = {};
    for (const r of data) {
        if (!r.product_group) continue;
        if (!pgMap[r.product_group]) {
            pgMap[r.product_group] = {
                product_group: r.product_group,
                accounts: new Set(),
                bus: new Set()
            };
        }
        pgMap[r.product_group].accounts.add(r.account_name);
        if (r.bu) pgMap[r.product_group].bus.add(r.bu);
    }
    
    const result = Object.values(pgMap).map(p => ({
        product_group: p.product_group,
        account_count: p.accounts.size,
        bus: Array.from(p.bus)
    }));
    
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product groups' });
  }
}
