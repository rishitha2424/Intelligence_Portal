import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchHealthData } from '../utils/healthApi';

import { getKamByCountry, getCountryRegionInKam } from '../data/kamData';
import countriesGeoJson from '../data/countries_geo.json';

export const buildCountryTooltip = (name, countries) => {
  const v = name ? countries[name] : null;
  const label = name || '?';
  const kamName = name ? getKamByCountry(name) : 'No Key Account Manager assigned';
  const excelRegion = name ? getCountryRegionInKam(name) : null;
  const region = excelRegion || (v ? v.region : '');

  let tip = `<strong>${label}</strong>`;
  tip += `<br><span style="color:#2563eb;font-weight:600">KAM: ${kamName}</span>`;
  if (region) {
    tip += `<br><span style="color:var(--text-muted, #64748b)">${region}</span>`;
  }
  if (v) {
    const opNames = v.operators ? v.operators.map(o => o.operator).join(', ') : '';
    const numOps = v.num_operators !== undefined ? v.num_operators : (v.operators ? v.operators.length : 0);
    tip += `<br>Operators (${numOps}): <strong>${opNames}</strong>`;
    if (v.cluster_name) {
      tip += `<br>Cluster: ${v.cluster_name}`;
    }
    if (v.stats?.avg_5g) {
      tip += `<br>5G: ${v.stats.avg_5g.toFixed(0)}%`;
    }
  }
  return tip;
};

const CLUSTER_COLORS = {
  'Frontier': '#E74C3C',
  'Emerging': '#F39C12',
  'Growth': '#1ABC9C',
  'Mature': '#4A90D9',
  'Advanced': '#9B59B6',
  'Mature & Saturated': '#9B59B6',
  'High Growth Exposed': '#F39C12',
  'Roaming Hub': '#1ABC9C',
  'Emerging Opportunity': '#2ECC71',
  'Regulatory Transition': '#7F8C8D',
  'Unknown': '#7F8C8D'
};

export default function MapComponent({
  countries,
  currentLens,
  activeRegion,
  selectedKam = null,
  kamCountries = [],
  onSelectCountry,
  theme
}) {
  const [globalHealthData, setGlobalHealthData] = useState(null);

  useEffect(() => {
    fetchHealthData().then(data => setGlobalHealthData(data)).catch(err => console.error("Failed to load health data for map:", err));
  }, []);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geojsonLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const labelsLayerRef = useRef(null);

  // Helper colors
  const scoreToColor = (score, palette) => {
    if (score === null || score === undefined) return '#1e3054';
    const s = Math.max(0, Math.min(100, score));
    if (palette === 'fraud') {
      if (s < 20) return '#1ABC9C';
      if (s < 40) return '#F39C12';
      if (s < 60) return '#E67E22';
      if (s < 80) return '#E74C3C';
      return '#C0392B';
    }
    if (palette === 'heat') {
      if (s < 20) return '#1e3054';
      if (s < 40) return '#1A5276';
      if (s < 60) return '#2471A3';
      if (s < 80) return '#2980B9';
      return '#1ABC9C';
    }
    if (palette === 'arpu') {
      if (s < 25) return '#27AE60';
      if (s < 50) return '#F39C12';
      if (s < 75) return '#E67E22';
      return '#E74C3C';
    }
    return '#4A90D9';
  };

  const getCountryColor = (countryName, lens) => {
    if (lens === 'none') {
      return theme === 'light' ? '#94a3b8' : '#475569';
    }
    const v = countries[countryName];
    if (!v) return theme === 'light' ? '#cbd5e1' : '#1e2d4a';
    
    if (lens === 'health' && globalHealthData) {
      const normC = (c) => {
        if (!c) return '';
        const s = c.trim().toLowerCase();
        if (s === 'uae' || s.includes('united arab emirates')) return 'uae';
        if (s === 'usa' || s === 'united states' || s === 'united states of america') return 'usa';
        if (s === 'uk' || s === 'united kingdom') return 'uk';
        if (s === 'ivory coast' || s === "cote d'ivoire") return "cote d'ivoire";
        if (s === 'congo' || s === 'dr congo') return 'dr congo';
        return s;
      };
      const targetNorm = normC(countryName);

      // Find all operators in this country and average their health
      const countryHealths = globalHealthData.filter(h => h.country && normC(h.country) === targetNorm && h.health != null);
      if (countryHealths.length > 0) {
        const avgHealth = countryHealths.reduce((sum, h) => sum + parseFloat(h.health), 0) / countryHealths.length;
        // Re-use heatmap logic or green-to-red based on score
        if (avgHealth >= 80) return '#059669'; // Green
        if (avgHealth >= 60) return '#D97706'; // Amber
        return '#DC2626'; // Red
      }
      return theme === 'light' ? '#cbd5e1' : '#1e2d4a'; // no health data
    }
    switch (lens) {
      case 'cluster':
        return CLUSTER_COLORS[v.cluster_name] || '#4A90D9';
      case 'fraud': {
        const s = v.stats?.fraud_score || 3;
        const pct = ((s - 1) / 4) * 100;
        return scoreToColor(pct, 'fraud');
      }
      case 'fiveG': {
        const f = v.stats?.avg_5g || 0;
        return scoreToColor(f, 'heat');
      }
      case 'roaming': {
        const r = (((v.stats?.roaming_intensity || 3) - 1) / 4) * 100;
        return scoreToColor(r, 'heat');
      }
      case 'arpu': {
        const ap = v.radar?.arpu_pressure || 3;
        const pct = ((5 - ap) / 4) * 100;
        return scoreToColor(pct, 'arpu');
      }
      default:
        return CLUSTER_COLORS[v.cluster_name] || '#4A90D9';
    }
  };

  // Geojson NAME (often abbreviated) -> the key actually used in our data.
  const NAME_ALIASES = {
    'dem. rep. congo': 'DR Congo', 'democratic republic of the congo': 'DR Congo',
    'congo': 'Congo (Brazzaville)', 'republic of the congo': 'Congo (Brazzaville)',
    "côte d'ivoire": "Cote d'Ivoire", 'ivory coast': "Cote d'Ivoire",
    'central african rep.': 'Central African Republic',
    's. sudan': 'South Sudan', 'eq. guinea': 'Equatorial Guinea',
    'eswatini': 'Eswatini', 'swaziland': 'Eswatini',
    'são tomé and principe': 'Sao Tome and Principe', 'são tomé and príncipe': 'Sao Tome and Principe',
    'russia': 'Russia', 'russian federation': 'Russia',
    'united states of america': 'United States', 'united states': 'United States',
    'czechia': 'Czech Republic', 'czech rep.': 'Czech Republic',
    'bosnia and herz.': 'Bosnia and Herzegovina', 'dominican rep.': 'Dominican Republic',
    'south korea': 'South Korea', 'republic of korea': 'South Korea',
    'north korea': 'North Korea', 'dem. rep. korea': 'North Korea',
    'macedonia': 'North Macedonia', 'lao pdr': 'Laos', 'burma': 'Myanmar',
    'viet nam': 'Vietnam', 'united republic of tanzania': 'Tanzania',
    'w. sahara': 'Western Sahara', 'solomon is.': 'Solomon Islands',
  };

  const resolveKey = (raw) => {
    if (!raw) return null;
    if (countries[raw]) return raw;
    const up = raw.toUpperCase();
    if (countries[up]) return up;
    for (const key of Object.keys(countries)) {
      if (key.toUpperCase() === up) return key;
    }
    const alias = NAME_ALIASES[raw.toLowerCase().trim()];
    if (alias) {
      if (countries[alias]) return alias;
      for (const key of Object.keys(countries)) {
        if (key.toUpperCase() === alias.toUpperCase()) return key;
      }
    }
    return null;
  };

  const findCountryName = (props) => {
    const candidates = [props.NAME, props.ADMIN, props.NAME_LONG, props.SOVEREIGNT, props.NAME_EN, props.BRK_NAME];
    for (const c of candidates) {
      const k = resolveKey(c);
      if (k) return k;
    }
    return null;
  };

  const styleFeature = (feature) => {
    const name = findCountryName(feature.properties);
    const hasData = !!name && !!countries[name];

    // If a KAM is selected, highlight only that KAM's countries
    if (selectedKam) {
      const isKamCountry = !!name && kamCountries && kamCountries.some(c => {
        if (!c) return false;
        const cLower = c.toLowerCase().trim();
        const nLower = name.toLowerCase().trim();
        if (cLower === nLower) return true;
        if (NAME_ALIASES[cLower] && NAME_ALIASES[cLower].toLowerCase() === nLower) return true;
        if (NAME_ALIASES[nLower] && NAME_ALIASES[nLower].toLowerCase() === cLower) return true;
        if ((cLower === 'uk' || cLower === 'united kingdom') && (nLower === 'uk' || nLower === 'united kingdom')) return true;
        if ((cLower === 'usa' || cLower === 'united states') && (nLower === 'usa' || nLower === 'united states')) return true;
        if ((cLower === 'ivory coast' || cLower === "cote d'ivoire") && (nLower === 'ivory coast' || nLower === "cote d'ivoire")) return true;
        if ((cLower === 'congo' || cLower === 'congo (brazzaville)') && (nLower === 'congo' || nLower === 'congo (brazzaville)')) return true;
        return false;
      });
      if (isKamCountry) {
        return {
          fillColor: '#2563eb', // Prominent highlight color
          fillOpacity: 0.88,
          color: '#ffffff',
          weight: 1.5,
          opacity: 1
        };
      } else {
        return {
          fillColor: theme === 'light' ? '#e2e8f0' : '#1e293b',
          fillOpacity: 0.12,
          color: theme === 'light' ? '#cbd5e1' : '#334155',
          weight: 0.5,
          opacity: 0.4
        };
      }
    }

    const color = name ? getCountryColor(name, currentLens) : (theme === 'light' ? '#cbd5e1' : '#1e2d4a');

    // Determine region dimming
    let opacity = hasData ? 0.75 : 0.15;
    if (hasData && activeRegion !== 'all') {
      const v = countries[name];
      if (v.region !== activeRegion && !v.region.startsWith(activeRegion)) {
        opacity = 0.1;
      } else {
        opacity = 0.85;
      }
    }

    return {
      fillColor: color,
      fillOpacity: opacity,
      color: hasData ? (theme === 'light' ? '#64748b88' : '#ffffff22') : (theme === 'light' ? '#e2e8f0' : '#1e3054'),
      weight: 0.5,
      opacity: 1
    };
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;
    let isMounted = true;

    const map = L.map(mapRef.current, {
      center: [20, 10],
      zoom: 2.5,
      zoomControl: true,
      attributionControl: false,
      minZoom: 1.5,
      maxZoom: 8,
      preferCanvas: true
    });

    mapInstanceRef.current = map;

    // Use Esri Light Gray Base (clean, no labels, very similar to Carto Positron)
    const tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    
    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 16,
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    map.createPane('labels');
    map.getPane('labels').style.zIndex = 450;
    map.getPane('labels').style.pointerEvents = 'none';

    // No raster label layer - all labels are custom HTML from GeoJSON
    const labelsLayer = null;

    labelsLayerRef.current = labelsLayer;

    // Render GeoJSON layer
    const initGeoJsonLayer = (geo) => {
      if (!isMounted) return;
      const layer = L.geoJSON(geo, {
        style: styleFeature,
        onEachFeature: (feature, layer) => {
          const name = findCountryName(feature.properties);
          const v = name ? countries[name] : null;

          layer.on({
            mouseover: (e) => {
              const l = e.target;
              const tip = buildCountryTooltip(name, countries);
              l.bindTooltip(tip, {
                className: 'custom-tooltip',
                sticky: true
              }).openTooltip();
            },
            mouseout: () => { },
            click: () => {
              if (v) onSelectCountry(name);
            }
          });

          // Add country name label - clean custom HTML label from GeoJSON
          if (name) {
            const bounds = layer.getBounds();
            const center = bounds.getCenter();
            L.marker(center, {
              icon: L.divIcon({
                className: 'country-label',
                html: `<span>${name}</span>`,
                iconSize: [100, 20],
                iconAnchor: [50, 10],
                pointerEvents: 'none'
              }),
              pane: 'labels'
            }).addTo(map);
          }
        }
      }).addTo(map);

      geojsonLayerRef.current = layer;

      // Add static continent labels
      const continents = [
        { name: 'Europe', coords: [50.0, 15.0] },
        { name: 'Asia', coords: [45.0, 80.0] },
        { name: 'Africa', coords: [10.0, 20.0] },
        { name: 'North America', coords: [45.0, -100.0] },
        { name: 'South America', coords: [-15.0, -60.0] },
        { name: 'Oceania', coords: [-25.0, 135.0] }
      ];

      continents.forEach(c => {
        const icon = L.divIcon({
          className: 'continent-label',
          html: `<span style="font-weight: 800; font-size: 13px; color: #ffffff; text-shadow: 0px 1px 3px rgba(0,0,0,0.95), 0px 0px 6px rgba(0,0,0,0.8); letter-spacing: 0.5px; text-transform: uppercase;">${c.name}</span>`,
          iconSize: [120, 24],
          iconAnchor: [60, 12]
        });
        L.marker(c.coords, {
          icon,
          interactive: false,
          pane: 'labels'
        }).addTo(map);
      });
    };

    const renderFallbackCircles = () => {
      if (!isMounted) return;
      Object.entries(countries).forEach(([name, v]) => {
        if (!v.lat || !v.lng) return;
        const color = getCountryColor(name, currentLens);
        const radius = Math.max(4, Math.min(12, (v.num_operators || 1) * 2));
        const marker = L.circleMarker([v.lat, v.lng], {
          radius,
          fillColor: color,
          fillOpacity: 0.8,
          color: theme === 'light' ? '#64748b44' : '#ffffff22',
          weight: 0.5
        }).addTo(map);

        marker.on('click', () => onSelectCountry(name));
        const tip = buildCountryTooltip(name, countries);
        marker.bindTooltip(tip, {
          className: 'custom-tooltip',
          sticky: true
        });
      });
    };

    // Load GeoJSON locally from bundled JSON or public local path
    if (countriesGeoJson && countriesGeoJson.features) {
      try {
        initGeoJsonLayer(countriesGeoJson);
      } catch (err) {
        console.error('GeoJSON render error, falling back to local fetch:', err);
        fetch('/data/countries.geojson')
          .then(r => r.json())
          .then(geo => initGeoJsonLayer(geo))
          .catch(() => renderFallbackCircles());
      }
    } else {
      fetch('/data/countries.geojson')
        .then(r => r.json())
        .then(geo => initGeoJsonLayer(geo))
        .catch(() => renderFallbackCircles());
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. React to Theme Swapping
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    // Remove old base layer
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    // Remove old labels layer if present
    if (labelsLayerRef.current) {
      mapInstanceRef.current.removeLayer(labelsLayerRef.current);
    }

    // Use Esri Light Gray Base (clean, no labels, very similar to Carto Positron)
    const tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    
    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 16,
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = tileLayer;

    // No raster label layer - all labels are custom HTML
    if (labelsLayerRef.current) {
      mapInstanceRef.current.removeLayer(labelsLayerRef.current);
    }
    labelsLayerRef.current = null;

    // Refresh geojson styles
    if (geojsonLayerRef.current) {
      geojsonLayerRef.current.setStyle(styleFeature);
    }
  }, [theme]);

  // 3. React to Lens, Region, and KAM Filter Changes
  useEffect(() => {
    if (geojsonLayerRef.current) {
      geojsonLayerRef.current.setStyle(styleFeature);
    }

    // If KAM is selected, zoom map to KAM's countries
    if (mapInstanceRef.current && selectedKam && kamCountries && kamCountries.length > 0) {
      const bounds = L.latLngBounds();
      let hasBounds = false;

      // Try bounds from GeoJSON features first
      if (geojsonLayerRef.current) {
        geojsonLayerRef.current.eachLayer(layer => {
          if (layer.feature && layer.feature.properties) {
            const name = findCountryName(layer.feature.properties);
            if (name && kamCountries.includes(name) && layer.getBounds) {
              bounds.extend(layer.getBounds());
              hasBounds = true;
            }
          }
        });
      }

      // Fallback or complement with countries[name].lat / lng
      if (!hasBounds) {
        kamCountries.forEach(cName => {
          const cData = countries[cName];
          if (cData && cData.lat && cData.lng) {
            bounds.extend([cData.lat, cData.lng]);
            hasBounds = true;
          }
        });
      }

      if (hasBounds && bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 5,
          animate: true,
          duration: 0.8
        });
      }
    } else if (mapInstanceRef.current && !selectedKam) {
      if (activeRegion !== 'all') {
        const regionBounds = {
          'MENA': [[10, -10], [50, 80]],
          'Europe': [[35, -10], [72, 40]],
          'APAC': [[-45, 60], [55, 180]],
          'LATAM': [[-60, -145], [75, -30]],
          'Africa': [[-35, -20], [38, 52]]
        };
        if (regionBounds[activeRegion]) {
          mapInstanceRef.current.fitBounds(regionBounds[activeRegion]);
        }
      } else {
        mapInstanceRef.current.setView([20, 10], 2.5);
      }
    }

    if (mapInstanceRef.current) {
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    }
  }, [currentLens, activeRegion, selectedKam, kamCountries]);

  return <div id="map" ref={mapRef} style={{ height: '100%', width: '100%' }}></div>;
}
