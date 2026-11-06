import { fetchCustomerMapping, fetchCustomerHealth } from './_lib/data_layer.js';
import { resolveLogicalCustomer } from './_lib/resolver.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { customer, country } = req.query;
  if (!customer) return res.status(400).json({ error: 'Missing customer parameter' });
  
  try {
    const [healthData, allMappings] = await Promise.all([
      fetchCustomerHealth(),
      fetchCustomerMapping()
    ]);
    
    const canonicalName = resolveLogicalCustomer(customer, country, healthData, allMappings) || customer;
    const data = await fetchCustomerMapping(canonicalName);
    res.status(200).json(data);
  } catch (err) {
    console.error("Error in customer-names:", err);
    res.status(500).json({ error: 'Failed to fetch customer names' });
  }
}
