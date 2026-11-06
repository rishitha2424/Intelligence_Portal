import { query } from './_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { countryId, operatorId, section, fieldName, value, updatedBy, baselineValue } = req.body;

  if (!countryId || !section || !fieldName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const targetOperatorId = operatorId || 'Global';
  const targetUpdatedBy = updatedBy || 'Anonymous';

  if (process.env.DATA_SOURCE !== 'postgres') {
    return res.status(200).json({ success: true, mock: true });
  }

  try {
    // 1. Fetch current override to use as old_value
    const existingResult = await query(
      `SELECT value FROM country_overrides 
       WHERE country_id = $1 AND operator_id = $2 AND section = $3 AND field_name = $4`,
      [countryId, targetOperatorId, section, fieldName]
    );

    const oldValue = existingResult.rows.length > 0 ? existingResult.rows[0].value : (baselineValue !== undefined ? baselineValue : null);

    // 2. Upsert into country_overrides
    await query(
      `INSERT INTO country_overrides (country_id, operator_id, section, field_name, value, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (country_id, operator_id, section, field_name)
       DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [countryId, targetOperatorId, section, fieldName, typeof value === 'object' ? JSON.stringify(value) : value, targetUpdatedBy]
    );

    console.log("Attempting to insert into change_history:", {
      country_id: countryId,
      operator_id: targetOperatorId,
      section,
      field_name: fieldName,
      old_value: oldValue,
      new_value: value
    });

    // 3. Insert into change_history
    await query(
      `INSERT INTO change_history (country_id, operator_id, section, field_name, old_value, new_value, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [countryId, targetOperatorId, section, fieldName, typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue, typeof value === 'object' ? JSON.stringify(value) : value]
    );

    console.log('Successfully inserted into change_history');

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Unexpected error in save-override:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
