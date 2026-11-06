import { query } from './_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { countryId, operatorId } = req.query;

  if (!countryId) {
    return res.status(400).json({ error: 'Missing countryId' });
  }

  if (process.env.DATA_SOURCE !== 'postgres') {
    return res.status(200).json({});
  }

  try {
    const result = await query(
      `SELECT section, field_name, value 
       FROM country_overrides 
       WHERE country_id = $1 AND operator_id = $2`,
      [countryId, operatorId || 'Global']
    );

    // Transform into a nested object: { [section]: { [fieldName]: value } }
    const overrides = {};
    for (const row of result.rows) {
      if (!overrides[row.section]) {
        overrides[row.section] = {};
      }
      overrides[row.section][row.field_name] = row.value;
    }

    return res.status(200).json(overrides);
  } catch (err) {
    console.warn('Unexpected error in get-overrides:', err.message);
    return res.status(200).json({});
  }
}
