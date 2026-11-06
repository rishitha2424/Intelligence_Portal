import kamMappingJson from './kam_mapping.json';

export const KAM_MAPPING = kamMappingJson;

export const getAllKams = () => {
  const kams = new Set(Object.values(KAM_MAPPING));
  return Array.from(kams).sort();
};

export const getKamByCountry = (countryName) => {
  if (!countryName) return 'Unassigned';
  return KAM_MAPPING[countryName] || 'Unassigned';
};

export const getCountriesByKam = (kamName) => {
  if (!kamName) return [];
  return Object.entries(KAM_MAPPING)
    .filter(([_, kam]) => kam === kamName)
    .map(([country]) => country)
    .sort();
};

export const getKamsByRegion = (region, countriesData) => {
  if (!region || region === 'all') {
    return getAllKams();
  }

  const kamsInRegion = new Set();
  Object.entries(KAM_MAPPING).forEach(([country, kam]) => {
    const cData = countriesData ? countriesData[country] : null;
    let countryRegion = cData?.region;
    
    // Normalize MECA to MENA if present
    if (countryRegion === 'MECA' || countryRegion === 'MECA/EU Overlap') {
      countryRegion = 'MENA';
    }

    if (countryRegion === region) {
      kamsInRegion.add(kam);
    }
  });

  return Array.from(kamsInRegion).sort();
};

export const getRegionsByKam = (kamName, countriesData) => {
  if (!kamName) return [];
  const regions = new Set();
  const countries = getCountriesByKam(kamName);
  
  countries.forEach(country => {
    const cData = countriesData ? countriesData[country] : null;
    let r = cData?.region;
    if (r === 'MECA' || r === 'MECA/EU Overlap') r = 'MENA';
    if (r) regions.add(r);
  });

  return Array.from(regions).sort();
};
