// Shared Entity Normalization and Resolution Module
// Handles whitespace errors, accents, uppercase/lowercase discrepancies, and abbreviations

export function cleanString(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics / accents (e.g. é -> e, ç -> c)
    .replace(/[\u00a0\u200b]/g, ' ') // replace non-breaking spaces and zero-width spaces
    .replace(/\s+/g, ' ')           // collapse multiple spaces
    .trim()
    .toLowerCase();
}

export function normalizeCountry(country) {
  const c = cleanString(country);
  const countryAliases = {
    'uae': 'uae',
    'united arab emirates': 'uae',
    'united arab emirates - africa': 'uae',
    'usa': 'united states',
    'united states': 'united states',
    'united states of america': 'united states',
    'uk': 'united kingdom',
    'united kingdom': 'united kingdom',
    'great britain': 'united kingdom',
    'ivory coast': "cote d'ivoire",
    "cote d'ivoire": "cote d'ivoire",
    'congo': 'dr congo',
    'dr congo': 'dr congo',
    'democratic republic of the congo': 'dr congo',
    'ksa': 'saudi arabia',
    'saudi arabia': 'saudi arabia'
  };
  return countryAliases[c] || c;
}

// Known mappings between Website Operator Names + Country and Excel Canonical LogicalCustomer
const OPERATOR_COUNTRY_MAP = {
  // United States
  'at&t mobility|united states': 'AT&T USA',
  'at&t|united states': 'AT&T USA',
  'verizon|united states': 'Verizon USA',
  't-mobile us|united states': 'T-Mobile USA',
  't-mobile|united states': 'T-Mobile USA',
  'dish wireless|united states': 'Dish USA',
  'dish|united states': 'Dish USA',
  'syniverse|united states': 'Syniverse USA',
  'tracfone|united states': 'Verizon USA',

  // Saudi Arabia
  'stc|saudi arabia': 'STC Saudi Arabia',
  'mobily|saudi arabia': 'Mobily Saudi Arabia',
  'zain ksa|saudi arabia': 'Zain Saudi Arabia',
  'zain|saudi arabia': 'Zain Saudi Arabia',
  'zain saudi arabia|saudi arabia': 'Zain Saudi Arabia',

  // Japan
  'ntt docomo|japan': 'NTT Docomo Japan',
  'softbank|japan': 'SoftBank Japan',
  'rakuten mobile|japan': 'Rakuten Japan',
  'rakuten|japan': 'Rakuten Japan',

  // UAE
  'e& (etisalat)|uae': 'Etisalat UAE',
  'etisalat|uae': 'Etisalat UAE',
  'e&|uae': 'Etisalat UAE',
  'du|uae': 'Du UAE',

  // Australia
  'optus (singtel)|australia': 'Optus Australia',
  'optus|australia': 'Optus Australia',
  'telstra|australia': 'Telstra Australia',
  'tpg telecom (vodafone au)|australia': 'TPG Australia',
  'tpg telecom|australia': 'TPG Australia',
  'tpg|australia': 'TPG Australia',

  // Bangladesh
  'grameenphone (telenor)|bangladesh': 'Grameenphone Bangladesh',
  'grameenphone|bangladesh': 'Grameenphone Bangladesh',

  // Thailand
  'true move h (true corp)|thailand': 'True Move Thailand',
  'true move|thailand': 'True Move Thailand',
  'truemove h|thailand': 'True Move Thailand',

  // Mexico
  'telcel|mexico': 'Telcel Mexico',
  'america movil|mexico': 'America Movil Group Mexico',

  // Canada
  'bell mobility|canada': 'Bell Canada',
  'bell|canada': 'Bell Canada',
  'telus|canada': 'TELUS Canada',
  'telus mobility|canada': 'TELUS Canada',

  // Spain
  'orange spain|spain': 'Orange Spain',
  'telefonica spain|spain': 'Telefonica Spain',
  'telefonica espana (movistar)|spain': 'Telefonica Spain',
  'movistar|spain': 'Telefonica Spain',

  // Germany
  'telekom deutschland|germany': 'Deutsche Telekom Germany',
  'deutsche telekom_t-mobile group|germany': 'Deutsche Telekom Germany',
  'deutsche telekom|germany': 'Deutsche Telekom Germany',
  'telefonica deutschland (o2)|germany': 'Telefonica Germany',
  'telefonica deutschland gmbh|germany': 'Telefonica Germany',
  'o2 germany|germany': 'Telefonica Germany',

  // France
  'orange france|france': 'Orange France',
  'orange|france': 'Orange France',
  'oinis france|france': 'OINIS France',

  // Italy
  'tim (telecom italia)|italy': 'TIM Italy',
  'telecom italia group|italy': 'TIM Italy',
  'tim|italy': 'TIM Italy',

  // Sweden
  'telia sverige|sweden': 'TeliaSonera Sweden',
  'telia company (group) - sweden|sweden': 'TeliaSonera Sweden',
  'telia|sweden': 'TeliaSonera Sweden',

  // Portugal
  'nos portugal|portugal': 'NOS Portugal',
  'nos comunicacoes|portugal': 'NOS Portugal',
  'nos|portugal': 'NOS Portugal',

  // Singapore
  'singtel|singapore': 'SingTel Singapore',
  'singtel mobile|singapore': 'SingTel Singapore',

  // Indonesia
  'telkomsel|indonesia': 'Telkomsel Indonesia',

  // Angola
  'unitel angola|angola': 'Unitel Angola',
  'unitel|angola': 'Unitel Angola',

  // Argentina
  'claro argentina|argentina': 'Claro Argentina',
  'claro|argentina': 'Claro Argentina',

  // Taiwan
  'taiwan mobile|taiwan': 'Taiwan Mobile Taiwan',

  // Senegal / Africa
  'sonatel (orange)|senegal': 'Orange Middle East and Africa',
  'orange middle east and africa|senegal': 'Orange Middle East and Africa',
  'orange mea|senegal': 'Orange Middle East and Africa',

  // Global / Bayobab
  'bayobab (mtn globalconnect)|south africa': 'Bayobab (MTN GlobalConnect)',
  'bayobab (mtn globalconnect)|uae': 'Bayobab (MTN GlobalConnect)',
  'bayobab (mtn globalconnect)|unknown': 'Bayobab (MTN GlobalConnect)'
};

/**
 * Resolves any incoming operator/customer query into a canonical LogicalCustomer name.
 * 
 * @param {string} customerQuery - Operator name, customer name, or alias
 * @param {string} countryHint - Optional country name or code
 * @param {Array} healthData - Array of customer health rows
 * @param {Array} mappingData - Array of customer mapping rows
 * @returns {string|null} - Canonical logical_customer string (e.g. "AT&T USA", "STC Saudi Arabia")
 */
export function resolveLogicalCustomer(customerQuery, countryHint = '', healthData = [], mappingData = []) {
  if (!customerQuery) return null;

  const rawClean = cleanString(customerQuery);
  const countryClean = normalizeCountry(countryHint);

  // 1. Check known operator + country mapping
  if (countryClean) {
    const key = `${rawClean}|${countryClean}`;
    if (OPERATOR_COUNTRY_MAP[key]) {
      return OPERATOR_COUNTRY_MAP[key];
    }
  }

  // Check operator alone in key prefix
  for (const [k, canonical] of Object.entries(OPERATOR_COUNTRY_MAP)) {
    const [opPart, cPart] = k.split('|');
    if (rawClean === opPart) {
      if (!countryClean || countryClean === cPart) {
        return canonical;
      }
    }
  }

  // 2. Direct match in healthData
  if (healthData && healthData.length > 0) {
    const direct = healthData.find(c => cleanString(c.customer_name) === rawClean);
    if (direct) return direct.customer_name;
  }

  // 3. Search in mappingData (both logical_customer and value)
  if (mappingData && mappingData.length > 0) {
    if (countryClean) {
      const countryMatch = mappingData.find(m => 
        (cleanString(m.value) === rawClean || cleanString(m.logical_customer) === rawClean) &&
        (cleanString(m.logical_customer).includes(countryClean) || normalizeCountry(m.logical_customer) === countryClean)
      );
      if (countryMatch) return countryMatch.logical_customer;
    }

    // Exact match on value
    const valMatch = mappingData.find(m => cleanString(m.value) === rawClean);
    if (valMatch) return valMatch.logical_customer;

    // Exact match on logical_customer
    const logMatch = mappingData.find(m => cleanString(m.logical_customer) === rawClean);
    if (logMatch) return logMatch.logical_customer;
  }

  // 4. Try stripping parentheses, e.g. "e& (Etisalat)" -> "e&", "Etisalat"
  const parensMatch = customerQuery.match(/\((.*?)\)/);
  const insideParens = parensMatch ? cleanString(parensMatch[1]) : '';
  const outsideParens = cleanString(customerQuery.replace(/\(.*?\)/g, ''));

  if (insideParens) {
    if (countryClean) {
      const key = `${insideParens}|${countryClean}`;
      if (OPERATOR_COUNTRY_MAP[key]) return OPERATOR_COUNTRY_MAP[key];
    }
    for (const [k, canonical] of Object.entries(OPERATOR_COUNTRY_MAP)) {
      const [opPart] = k.split('|');
      if (insideParens === opPart) return canonical;
    }
    if (mappingData && mappingData.length > 0) {
      const mMatch = mappingData.find(m => cleanString(m.value) === insideParens || cleanString(m.logical_customer) === insideParens);
      if (mMatch) return mMatch.logical_customer;
    }
    if (healthData && healthData.length > 0) {
      const hMatch = healthData.find(c => cleanString(c.customer_name) === insideParens);
      if (hMatch) return hMatch.customer_name;
    }
  }

  if (outsideParens && outsideParens !== rawClean) {
    if (countryClean) {
      const key = `${outsideParens}|${countryClean}`;
      if (OPERATOR_COUNTRY_MAP[key]) return OPERATOR_COUNTRY_MAP[key];
    }
    for (const [k, canonical] of Object.entries(OPERATOR_COUNTRY_MAP)) {
      const [opPart] = k.split('|');
      if (outsideParens === opPart) return canonical;
    }
    if (mappingData && mappingData.length > 0) {
      const mMatch = mappingData.find(m => cleanString(m.value) === outsideParens || cleanString(m.logical_customer) === outsideParens);
      if (mMatch) return mMatch.logical_customer;
    }
  }

  // 5. Fallback: Check if rawClean contains canonical customer name or vice versa
  if (healthData && healthData.length > 0) {
    const fuzzy = healthData.find(c => {
      const cClean = cleanString(c.customer_name);
      return rawClean.includes(cClean) || cClean.includes(rawClean);
    });
    if (fuzzy) return fuzzy.customer_name;
  }

  return null;
}
