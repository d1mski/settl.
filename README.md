# settl. — Location Intelligence

Neighborhood-level intelligence for any location on Earth. Drop a pin and get climate, air quality, sun exposure, wind patterns, natural hazards, and nearby context — all from free, open APIs. No keys required.

![MIT License](https://img.shields.io/badge/license-MIT-green)

## What it does

- **Climate** — temperature, precipitation, and seasonal heatmaps via Open-Meteo
- **Air Quality** — real-time AQI, PM2.5, pollen, and pollutant breakdown
- **Sun** — sun path arc, golden hour, daylight duration using SunCalc
- **Wind** — wind rose chart, prevailing direction, and speed distribution
- **Hazards** — recent earthquakes (USGS) and active wildfires (NASA FIRMS)
- **Context** — schools, hospitals, transit, parks, and POIs via OpenStreetMap Overpass
- **Building** — orientation compass, facade analysis, and solar exposure
- **Risk Synthesis** — aggregated risk signals with severity scoring
- **Compare** — side-by-side A/B location comparison
- **Saved Locations** — bookmark and revisit places (localStorage + IndexedDB)

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Leaflet · Recharts · Framer Motion

## Getting started

```bash
git clone https://github.com/d1mski/settl-location-intelligence.git
cd settl-location-intelligence
npm install
npm run dev
```

No API keys, no `.env` file — everything runs against free public APIs.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript check only |

## APIs used

All free, no auth required:

- [Open-Meteo](https://open-meteo.com/) — weather, climate, air quality
- [Nominatim](https://nominatim.org/) — geocoding and reverse geocoding
- [Overpass API](https://overpass-api.de/) — OpenStreetMap feature queries
- [USGS Earthquake API](https://earthquake.usgs.gov/fdsnws/event/1/) — seismic activity
- [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) — active fire data

## License

[MIT](LICENSE)
