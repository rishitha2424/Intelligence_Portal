import { fetchDataStatus, fetchCustomerHealth, fetchSkygeni } from './_lib/data_layer.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const statusData = await fetchDataStatus();
    const skygeniUpdatedOn = Array.isArray(statusData) ? statusData.find(s => s.key === 'skygeni_updated_on')?.value : (statusData.updated_on || 'Unknown Date');
    
    res.status(200).json({
        skygeni_updated_on: skygeniUpdatedOn,
        mode: process.env.DATA_SOURCE || 'json',
        files: ['health.xlsx', 'mapping.xlsx', 'skygeni.xlsx']
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch data status' });
  }
}
