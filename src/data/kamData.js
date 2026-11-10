import excelKamData from './excel_kam_data.json' with { type: 'json' };

export const KAM_DATA = excelKamData;

// Country aliases for normalization between Excel and Master
const COUNTRY_ALIASES = {
  'uk': 'United Kingdom',
  'united kingdom': 'United Kingdom',
  'usa': 'United States',
  'united states': 'United States',
  'ivory coast': "Cote d'Ivoire",
  "cote d'ivoire": "Cote d'Ivoire",
  'congo': 'Congo (Brazzaville)',
  'congo (brazzaville)': 'Congo (Brazzaville)',
  'dr congo': 'DR Congo',
  'czech republic': 'Czech Republic'
};

// Map lowercase country to canonical Excel country name
const LOWER_TO_EXCEL_COUNTRY = {};
Object.keys(excelKamData.country_to_kams || {}).forEach(c => {
  LOWER_TO_EXCEL_COUNTRY[c.toLowerCase()] = c;
});
// Add aliases
LOWER_TO_EXCEL_COUNTRY['uk'] = 'UK';
LOWER_TO_EXCEL_COUNTRY['united kingdom'] = 'UK';
LOWER_TO_EXCEL_COUNTRY['usa'] = 'USA';
LOWER_TO_EXCEL_COUNTRY['united states'] = 'USA';
LOWER_TO_EXCEL_COUNTRY['ivory coast'] = 'Ivory Coast';
LOWER_TO_EXCEL_COUNTRY["cote d'ivoire"] = 'Ivory Coast';
LOWER_TO_EXCEL_COUNTRY['congo'] = 'Congo';
LOWER_TO_EXCEL_COUNTRY['congo (brazzaville)'] = 'Congo';
LOWER_TO_EXCEL_COUNTRY['dr congo'] = 'DR Congo';

/**
 * Get all KAM names from Excel (Sheet1).
 */
export const getAllKams = () => {
  return excelKamData.all_kams || [];
};

/**
 * Get the KAM name(s) for a given country.
 * Returns "No Key Account Manager assigned" if country has no KAM in Excel.
 */
export const getKamByCountry = (countryName) => {
  if (!countryName) return 'No Key Account Manager assigned';
  const raw = String(countryName).trim();
  const lower = raw.toLowerCase();

  // Try alias / lower match
  const excelCountry = LOWER_TO_EXCEL_COUNTRY[lower];
  if (excelCountry && excelKamData.country_to_kams[excelCountry]?.length > 0) {
    return excelKamData.country_to_kams[excelCountry].join(', ');
  }

  // Direct case-sensitive or case-insensitive search in country_to_kams
  if (excelKamData.country_to_kams[raw]?.length > 0) {
    return excelKamData.country_to_kams[raw].join(', ');
  }

  for (const [c, kList] of Object.entries(excelKamData.country_to_kams || {})) {
    if (c.toLowerCase() === lower && kList?.length > 0) {
      return kList.join(', ');
    }
  }

  return 'No Key Account Manager assigned';
};

/**
 * Get the unique countries managed by a KAM from Excel.
 */
export const getCountriesByKam = (kamName) => {
  if (!kamName) return [];
  return excelKamData.kam_to_countries[kamName] || [];
};

/**
 * Get KAMs that operate in a given region based on Excel.
 */
export const getKamsByRegion = (region, countriesData) => {
  if (!region || region === 'all') {
    return getAllKams();
  }

  const normRegion = region.trim().toLowerCase();
  const kamsInRegion = (excelKamData.all_kams || []).filter(kam => {
    const regs = excelKamData.kam_to_regions[kam] || [];
    return regs.some(r => {
      const rLower = r.toLowerCase();
      if (rLower === normRegion) return true;
      if (normRegion === 'latam' && (rLower === 'north america' || rLower === 'latam')) return true;
      return false;
    });
  });

  return kamsInRegion.sort();
};

/**
 * Get the regions for a KAM from Excel.
 */
export const getRegionsByKam = (kamName, countriesData) => {
  if (!kamName) return [];
  const regs = excelKamData.kam_to_regions[kamName] || [];
  return regs.map(r => {
    if (r.toUpperCase() === 'AFRICA') return 'Africa';
    if (r.toUpperCase() === 'EUROPE') return 'Europe';
    return r;
  }).sort();
};

/**
 * Get the region assigned to a country in Excel for the KAM panel.
 * E.g., for Sri Lanka returns 'APAC'.
 */
export const getCountryRegionInKam = (countryName) => {
  if (!countryName) return null;
  const raw = String(countryName).trim();
  const lower = raw.toLowerCase();
  const excelCountry = LOWER_TO_EXCEL_COUNTRY[lower] || raw;
  return excelKamData.country_to_region[excelCountry] || excelKamData.country_to_region[raw] || null;
};
