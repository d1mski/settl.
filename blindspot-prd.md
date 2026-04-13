# Blind Spot — Location Intelligence for Relocation Decisions

## PRD v1.0

---

## 1. Overview

A single-page React application that generates a comprehensive environmental profile for any location on Earth. The user enters coordinates (or an address), and the tool fetches and visualises historical weather, building orientation, natural hazard history, solar exposure, air quality, and local context data to surface blind spots that are invisible during a property viewing but matter daily once you live there.

The core insight: property viewings happen on a single day. This tool shows you what the other 364 days look like.

## 2. Problem Statement

When relocating or choosing a property, people make decisions based on a single visit. They cannot feel the prevailing winter wind, know how often it floods, whether the building faces the summer afternoon sun, how seismically active the area is, or what industrial facilities sit upwind. Estate agents won't volunteer this information. Municipality data is buried in PDFs in local languages. This tool aggregates free, global data sources and presents a unified risk and comfort profile for any coordinate pair.

## 3. Target Users

- People relocating internationally (especially expats unfamiliar with local climate patterns)
- Property buyers and renters evaluating multiple locations
- Remote workers choosing where to base themselves
- Architects and developers assessing sites
- Anyone comparing two addresses before signing a lease

## 4. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React 18+, TypeScript, Tailwind CSS | Dimi's established stack |
| Charts | Recharts + custom SVG (wind roses, sun path) | Flexible, no heavy deps |
| Maps | Leaflet + OpenStreetMap tiles | Free, no API key |
| Solar calc | SunCalc (npm) | Client-side, no API needed |
| Hosting | Cloudflare Pages | Static, fast, free tier |
| Backend | None for v1 (all client-side API calls) | All data sources support CORS |

## 5. Data Sources (all free, no API key unless noted)

### 5.1 Open-Meteo Archive API — Weather & Climate

**Endpoint**: `GET https://archive-api.open-meteo.com/v1/archive`

Provides hourly data from 1940 to ~5 days ago at 9-25km resolution.

**Variables to fetch (hourly)**:
```
wind_speed_10m, wind_direction_10m, wind_gusts_10m,
temperature_2m, relative_humidity_2m,
precipitation, rain, snowfall,
cloud_cover,
shortwave_radiation
```

**Variables to fetch (daily)**:
```
temperature_2m_max, temperature_2m_min, temperature_2m_mean,
precipitation_sum, rain_sum, snowfall_sum, precipitation_hours,
wind_speed_10m_max, wind_gusts_10m_max, wind_direction_10m_dominant,
sunshine_duration,
uv_index_max
```

**Key params**: `latitude`, `longitude`, `start_date`, `end_date`, `timezone=auto`

**Response includes**: resolved `latitude`, `longitude`, `elevation` (useful for grid cell warning).

**Limits**: Cap end_date at `today - 7 days`. Default lookback: 12 months. Max single request: ~2 years.

**Units**: Default km/h, celsius, mm. Support client-side conversion to other units.

### 5.2 Open-Meteo Air Quality API

**Endpoint**: `GET https://air-quality-api.open-meteo.com/v1/air-quality`

**Variables**: `pm10, pm2_5, nitrogen_dioxide, ozone, european_aqi`

Provides hourly data. Use `past_days=92` for 3-month lookback from current date.

### 5.3 Open-Meteo Elevation API

**Endpoint**: `GET https://api.open-meteo.com/v1/elevation?latitude=X&longitude=Y`

Returns elevation in metres. Use for terrain context.

### 5.4 OpenStreetMap Overpass API — Building Footprints & Nearby Features

**Endpoint**: `https://overpass-api.de/api/interpreter`

**Method**: POST with `data=` parameter containing Overpass QL query.

**Building footprint query**:
```
[out:json][timeout:10];
way["building"](around:50, {lat}, {lon});
out body geom;
```

Returns polygon nodes for any building within 50m of the coordinate. From the polygon vertices, calculate:
- Building compass orientation (angle of the longest edge relative to north)
- Which facade faces which direction
- Building footprint area
- Number of levels (from `building:levels` tag if present)

**Nearby features query** (for context within 1km radius):
```
[out:json][timeout:15];
(
  node["amenity"](around:1000, {lat}, {lon});
  way["amenity"](around:1000, {lat}, {lon});
  node["industrial"](around:2000, {lat}, {lon});
  way["industrial"](around:2000, {lat}, {lon});
  way["landuse"="industrial"](around:2000, {lat}, {lon});
  node["aeroway"="aerodrome"](around:5000, {lat}, {lon});
  way["aeroway"="aerodrome"](around:5000, {lat}, {lon});
  way["waterway"](around:1000, {lat}, {lon});
  way["natural"="water"](around:1000, {lat}, {lon});
  way["leisure"="park"](around:1000, {lat}, {lon});
  node["place"](around:2000, {lat}, {lon});
);
out body center;
```

This surfaces: industrial zones, airports, parks, water bodies, amenities. Categorise results into "risk/nuisance" vs "amenity" buckets.

### 5.5 USGS Earthquake Catalog API

**Endpoint**: `GET https://earthquake.usgs.gov/fdsnws/event/1/query`

**Params**:
```
format=geojson
latitude={lat}
longitude={lon}
maxradiuskm=100
starttime={10_years_ago}
endtime={today}
minmagnitude=3.0
orderby=magnitude
limit=100
```

Returns earthquake events within 100km over the past 10 years. Display magnitude, distance, depth.

### 5.6 Wikipedia Geosearch API — Local Context

**Endpoint**: `GET https://en.wikipedia.org/w/api.php`

**Params**:
```
action=query
list=geosearch
gscoord={lat}|{lon}
gsradius=10000
gslimit=10
format=json
origin=*
```

Returns up to 10 Wikipedia articles within 10km. Useful for identifying the area (is it near an industrial port? a national park? a military base? a historical disaster site?). Fetch article extracts with a follow-up query using `prop=extracts&exintro=true` for each page ID.

For Greek locations, also query `el.wikipedia.org` since coverage is often better for local places.

### 5.7 SunCalc (npm library, client-side only)

No API call needed. `suncalc` npm package computes:
- Sunrise, sunset, solar noon for any date and location
- Sun position (altitude, azimuth) at any time
- Moon phases

Use this to calculate:
- Annual sunshine window for each building facade (cross-reference with building orientation from OSM)
- Golden hour / shadow analysis
- Days with very short daylight (winter depression risk)
- Whether the living room faces afternoon sun in summer (overheating) or never gets direct light (damp risk)

### 5.8 Nominatim Reverse Geocoding (OpenStreetMap)

**Endpoint**: `GET https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json`

Converts coordinates to a human-readable address. Also returns the country code (needed to localise Wikipedia queries and determine which natural hazard datasets are relevant).

## 6. Feature Modules

### M1: Location Input

- Two input modes: decimal coordinates or free-text address (geocoded via Nominatim)
- "Paste DMS" parser for formats like `38°17'18.7"N 21°46'13.9"E`
- Optional: compare two locations side by side (same as the original wind tool concept)
- Map preview (Leaflet with OSM tiles) showing a pin at the entered location
- Reverse geocode result displayed as a human-readable label

### M2: Climate Profile

**Data**: Open-Meteo Archive API (12 months hourly + daily)

**Visualisations**:
- **Temperature heatmap**: 12 months x 24 hours grid showing average temperature by hour and month. Reveals whether summers are unbearable at 3pm or winters drop below zero at night.
- **Monthly rainfall bars**: Total precipitation per month with rain-day count overlay.
- **Humidity chart**: Monthly mean relative humidity. Flag months above 70% (mould risk) or below 30% (dry skin, static).
- **Sunshine hours**: Monthly totals from `sunshine_duration`. Compare against a reference (e.g. London ~1500 hrs/year, Athens ~2800 hrs/year).
- **UV index**: Monthly max UV with WHO exposure guidance (1-2 low, 3-5 moderate, 6-7 high, 8-10 very high, 11+ extreme).
- **Extreme weather summary**: Count of days exceeding thresholds. Days above 35C, days below 0C, days with precipitation > 20mm, days with wind gusts > 60 km/h.

### M3: Wind Analysis

**Data**: Open-Meteo Archive API (12 months hourly)

**Visualisations**:
- **Wind rose**: 16 directions, 5 speed bins (0-5, 5-10, 10-20, 20-30, 30+ km/h), stacked petals
- **Prevailing wind + building overlay**: If building footprint is found (M5), overlay the wind rose with the building outline showing which facades face into the prevailing wind vs are sheltered. This is the key insight.
- **Monthly wind speed bars**: Mean and max gust per month
- **Calm vs strong wind percentages**
- **Wind chill note**: Flag if mean winter wind speed + mean winter temperature combine to produce a significant wind chill effect

**Implementation note (from v0 learnings)**: When innerRadius is 0 in the wind rose SVG, draw a wedge from centre, not an arc with zero radius.

### M4: Sun & Shadow Analysis

**Data**: SunCalc library (client-side) + building orientation from M5

**Visualisations**:
- **Sun path arc diagram**: SVG showing the sun's path across the sky for winter solstice, equinox, and summer solstice. Indicates sunrise/sunset azimuth and max altitude.
- **Facade sunlight table**: For each building face (from M5 orientation), calculate hours of direct sunlight on the winter solstice and summer solstice. Identify which rooms likely get morning vs afternoon sun.
- **Daylight duration chart**: Monthly average daylight hours.
- **Golden hour / blue hour times**: For photographers or people who care about evening light.

### M5: Building Orientation & Context

**Data**: Overpass API

**Visualisations**:
- **Building footprint map**: Render the building polygon on a mini Leaflet map, coloured by facade direction (N=blue, S=yellow, E=orange, W=purple).
- **Compass overlay**: Show the building's longest axis angle relative to north.
- **Facade direction labels**: "Front faces SSW (210°)", "Rear faces NNE (30°)".
- **Building metadata**: Levels, type (residential, commercial), roof shape if tagged.

**Fallback**: If no building is found at the coordinates in OSM (common in rural areas or areas with incomplete mapping), display a message: "No building footprint found in OpenStreetMap at these coordinates. You can manually enter the building's orientation." Provide a compass dial input where the user can set the front-door direction.

### M6: Natural Hazards

**Data**: USGS Earthquake API + derived risk indicators

**Visualisations**:
- **Earthquake history map**: Leaflet map showing circles (radius = magnitude) for all M3.0+ earthquakes within 100km in the past 10 years. Colour by depth (shallow = red, deep = blue).
- **Earthquake frequency chart**: Bar chart of event count by year.
- **Magnitude distribution**: Histogram of magnitudes.
- **Seismic risk summary**: "X events of M3.0+ in 10 years within 100km. Largest: M{x} at {distance}km on {date}."
- **Flood/fire indicators**: Currently no free global API covers these well. For v1, use the Wikipedia nearby results to flag if any nearby article mentions "flood", "fire", "landslide", "tsunami" in its extract. This is imperfect but surfaces known historical events. Flag as "Local context" rather than "risk assessment".

### M7: Air Quality

**Data**: Open-Meteo Air Quality API (3 months)

**Visualisations**:
- **AQI timeline**: Daily European AQI over the past 3 months. Colour-coded by WHO guidance bands.
- **Pollutant breakdown**: PM2.5, PM10, NO2, O3 averages with context (WHO recommended limits).
- **Seasonal note**: If data shows AQI spikes, note if correlated with wind direction (cross-reference M3). "AQI peaks when wind blows from {direction}" = likely upwind pollution source.

### M8: Local Context & Points of Interest

**Data**: Wikipedia Geosearch API + Overpass API nearby features

**Visualisations**:
- **Nearby Wikipedia articles**: List with distance, title, and extract snippet. Click to open full article.
- **Nuisance/risk features map**: Overlay on Leaflet map showing: industrial zones (orange), airports (red), major roads (grey), landfills (brown) within 2-5km.
- **Amenity features map**: Parks (green), water bodies (blue), schools, hospitals, supermarkets within 1km.
- **Distance to nearest**: Table showing distance to nearest hospital, supermarket, school, pharmacy, public transport stop.

### M9: Comparison Mode

Allow entering two locations and viewing all modules side by side. Identical to single-location mode but with dual columns and a "delta" summary highlighting the biggest differences.

### M10: Export & Share

- **PDF report**: Generate a printable summary (use browser print CSS or a PDF library).
- **CSV export**: Raw hourly weather data for the selected period.
- **Share link**: Encode coordinates and settings in URL query params so a link can be shared.

## 7. UI Design Specification

### Layout

- Dark theme (background `#0B1120`, cards `#0D1526`, borders `#1a2540`)
- JetBrains Mono for data, clean sans-serif for prose
- Max width 960px, centred
- Tab navigation across modules: Climate | Wind | Sun | Building | Hazards | Air | Context
- Each tab loads its data lazily on first visit (don't fetch everything upfront)
- Responsive: single column below 768px

### Colour System

| Use | Colour |
|-----|--------|
| Location A | `#42A5F5` (blue) |
| Location B | `#FF8A65` (orange) |
| Risk / danger | `#E53935` (red) |
| Warning | `#FFA726` (amber) |
| Good / safe | `#66BB6A` (green) |
| Neutral data | `#8899AA` (grey) |
| Background | `#0B1120` |
| Card | `#0D1526` |
| Border | `#1a2540` |

### Loading States

Each module shows its own loading skeleton. Modules fetch independently. A failed module shows an error with a Retry button but does not block other modules.

## 8. API Call Summary per Location

| API | Calls | Approx payload | CORS | Key needed |
|-----|-------|-----------------|------|------------|
| Open-Meteo Archive (hourly) | 1 | ~200KB | Yes | No |
| Open-Meteo Archive (daily) | 1 | ~50KB | Yes | No |
| Open-Meteo Air Quality | 1 | ~30KB | Yes | No |
| Open-Meteo Elevation | 1 | <1KB | Yes | No |
| Overpass (building) | 1 | ~5KB | Yes | No |
| Overpass (nearby features) | 1 | ~20KB | Yes | No |
| USGS Earthquakes | 1 | ~30KB | Yes | No |
| Wikipedia Geosearch | 1 | ~5KB | Yes | No |
| Wikipedia Extracts | 1-10 | ~20KB | Yes | No |
| Nominatim Reverse Geocode | 1 | ~2KB | Yes | No |
| **Total per location** | **~10-20** | **~360KB** | | |

All APIs are free for non-commercial use. Nominatim requires a `User-Agent` header and rate limiting (max 1 req/sec). Overpass should include `[timeout:10]` in queries.

## 9. Building Orientation Algorithm

Given a building polygon from Overpass (list of lat/lon vertices):

1. Convert vertices to a local Cartesian projection (simple equirectangular approximation is fine for a single building)
2. For each consecutive pair of vertices, calculate the edge length and bearing (angle from north)
3. Identify the longest edge (this is typically the primary facade direction)
4. The building's "orientation" is the bearing of this longest edge
5. The four cardinal facade directions are: longest-edge bearing, +90°, +180°, +270°
6. Label these as "Front", "Right side", "Rear", "Left side" (or let the user assign which is which)
7. Cross-reference with prevailing wind direction (M3) and sun path (M4)

**Edge case**: L-shaped or complex buildings may have multiple significant edges. For v1, use the single longest edge. For v2, consider using a minimum bounding rectangle approach.

## 10. Performance

- Fetch modules lazily (only when the tab is first opened)
- Cache all fetched data in React state so switching tabs doesn't re-fetch
- Debounce coordinate input changes (500ms)
- Process large arrays (8760 hourly readings) in single-pass loops, not multiple filter/map chains
- Use `Promise.all` for independent API calls within the same module
- Abort ongoing fetches if coordinates change mid-flight (AbortController)
- Nominatim: respect 1 req/sec rate limit

## 11. Error Handling

- Each module handles its own errors independently
- Display the API error message + a Retry button per module
- If Overpass times out (common for large areas), suggest reducing the search radius
- If USGS returns no results, display "No significant seismic activity recorded within 100km in the past 10 years" (this is a positive signal, not an error)
- If Wikipedia returns no nearby articles, display "No geotagged Wikipedia articles within 10km"
- Network-level failures: show a generic "Could not reach {service name}. Check your connection." message

## 12. Grid Resolution Warning

Open-Meteo resolves coordinates to the nearest grid cell (9km for ECMWF IFS, 25km for ERA5). The response includes the resolved `latitude` and `longitude`. Always display:

- User-entered coordinates
- API-resolved coordinates
- Distance between them (Haversine)
- If in comparison mode and both locations resolve to the same cell, show a prominent warning

## 13. Localisation Considerations

- Detect country from Nominatim reverse geocode
- Query both English and local-language Wikipedia (e.g. `el.wikipedia.org` for Greece, `de.wikipedia.org` for Germany)
- Display wind speed in units appropriate to the country (km/h for Europe, mph for US/UK, m/s for scientific)
- Temperature in Celsius for most of the world, Fahrenheit for US
- Allow manual unit override

## 14. Out of Scope (v1)

- User accounts, saved locations, or persistent storage
- Street-level noise measurement
- Crime statistics (no free global API)
- Property price data
- School quality ratings
- Public transport route planning
- 3D building shadow simulation
- Historical flood map overlays (no free global raster source)
- Mobile app (responsive web only)
- Server-side rendering or backend

## 15. Future Considerations (v2+)

- **Google Street View embed**: Show the view from each compass direction at the coordinate
- **Noise estimation**: Use proximity to roads (OSM highway tags) + airports + railways as a noise proxy
- **Flood risk**: Integrate with European Flood Awareness System (EFAS) or similar regional APIs as they become available
- **Climate projection**: Show how temperature and precipitation are trending (compare 2015-2025 vs 2005-2015)
- **Multi-location scoring**: Rank 3+ locations on a weighted scorecard the user can customise
- **Building-specific shadow simulation**: Using building heights and sun path to estimate shadow coverage on adjacent buildings

## 16. Acceptance Criteria

1. User enters coordinates and sees the Climate tab populated within 5 seconds
2. All 7 tabs load independently; a failure in one does not block the others
3. Building orientation is correctly calculated and displayed as a compass diagram
4. Wind rose shows prevailing direction overlaid with building orientation when building data is available
5. Earthquake map correctly plots events scaled by magnitude with distance labels
6. Wikipedia nearby articles are displayed with extracts and links
7. Comparison mode shows two locations side by side with visual deltas
8. Works without any API keys or backend
9. Works in Chrome, Firefox, Safari (latest)
10. Full page loads under 1MB total JS bundle (excluding map tiles)
11. Share link correctly encodes location and restores state on load

## 17. File Structure (suggested)

```
src/
  components/
    LocationInput.tsx       # Coordinate/address input + DMS parser
    MapPreview.tsx          # Leaflet map with pin
    ModuleTabs.tsx          # Tab navigation
    modules/
      ClimateModule.tsx     # M2: Temperature, rain, humidity, UV
      WindModule.tsx         # M3: Wind roses, monthly charts
      SunModule.tsx          # M4: Sun path, facade sunlight
      BuildingModule.tsx     # M5: Building footprint, orientation
      HazardsModule.tsx      # M6: Earthquake history
      AirQualityModule.tsx   # M7: AQI timeline
      ContextModule.tsx      # M8: Wikipedia, nearby features
    charts/
      WindRose.tsx           # Custom SVG wind rose
      SunPathArc.tsx         # Custom SVG sun path diagram
      HeatmapGrid.tsx        # Temperature heatmap
      BuildingCompass.tsx     # Building orientation compass
    ui/
      StatCard.tsx
      ErrorBoundary.tsx
      LoadingSkeleton.tsx
  hooks/
    useOpenMeteo.ts          # Fetch + cache weather data
    useOverpass.ts           # Fetch + cache OSM data
    useEarthquakes.ts        # Fetch + cache USGS data
    useWikipedia.ts          # Fetch + cache Wikipedia data
    useSunCalc.ts            # SunCalc computations
  utils/
    coordinates.ts           # DMS parser, Haversine, projections
    buildingOrientation.ts   # Polygon analysis, longest edge
    windRoseData.ts          # Bin hourly data into rose format
    units.ts                 # Unit conversion helpers
  types/
    index.ts                 # Shared TypeScript interfaces
```
