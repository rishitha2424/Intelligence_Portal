import { fetchCustomerHealth } from './_lib/data_layer.js';

export default async function handler(req, res) {
  try {
    const healthData = await fetchCustomerHealth();
    
    // We want to return a list of operators that should be injected into the UI
    const operatorsToInject = healthData.map(c => {
      // In health data, customer_name is usually "Operator Country"
      // We can try to guess the country if it's the last word(s)
      const parts = c.customer_name.split(' ');
      let country = parts.length > 1 ? parts.pop() : 'Unknown';
      let operator = parts.join(' ');

      // Fix known country aliases
      if (country.toLowerCase() === 'usa') country = 'United States';
      if (country.toLowerCase() === 'uae') country = 'UAE'; // master_telecom.json uses "UAE"
      if (country.toLowerCase() === 'uk') country = 'United Kingdom';

      // Special cases
      if (c.customer_name === 'Orange Middle East and Africa') {
         country = 'Senegal'; // Or a default region country
         operator = c.customer_name;
      }
      if (c.customer_name === 'Bayobab (MTN GlobalConnect)') {
         country = 'South Africa';
         operator = c.customer_name;
      }
      if (c.customer_name === 'STC Saudi Arabia') {
         country = 'Saudi Arabia';
         operator = 'STC';
      }
      if (c.customer_name === 'Mobily Saudi Arabia') {
         country = 'Saudi Arabia';
         operator = 'Mobily';
      }
      if (c.customer_name === 'NTT Docomo Japan') {
         country = 'Japan';
         operator = 'NTT Docomo';
      }
      
      return {
         original: c.customer_name,
         country,
         operator
      };
    });

    res.status(200).json(operatorsToInject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch' });
  }
}
