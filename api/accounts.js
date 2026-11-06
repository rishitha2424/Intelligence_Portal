import { fetchSkygeni } from './_lib/data_layer.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const data = await fetchSkygeni();
    
    // Grouping by account
    const accountsMap = {};
    for (const r of data) {
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
    
    let result = Object.values(accountsMap).map(a => ({
        ...a,
        bus: Array.from(a.bus),
        product_groups: Array.from(a.product_groups),
        product_group_count: a.product_groups.size,
        owners: Array.from(a.owners)
    }));
    
    // Filters could be applied here based on req.query
    
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
}
