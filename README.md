# settl.

Drop a pin anywhere on Earth. See what it's actually like to live there — climate, wind, sun, air quality, hazards, what's nearby. A full year of data, one screen. No API keys, no signup, all free.

![MIT License](https://img.shields.io/badge/license-MIT-green)

## The backstory

I moved to a new area. The house was great, neighborhood looked fine. What nobody mentioned was the wind.

Turns out, stepping outside with a toddler in winter meant getting absolutely hammered by sideways rain and gale-force gusts. That kind of thing doesn't show up on a house listing or a weekend visit in June.

So I started digging. Can I see what the wind's like here across a whole year? What about rainfall — when it rains, does it pour? My kid's bedroom faces west — does it turn into an oven every summer afternoon?

Turns out, the data exists. It's just scattered across a dozen free APIs that nobody's bothered to stitch together. So that's what this is — one place to get the full picture of a location before you sign a lease or a mortgage.

## What you get

- **Climate** — temperature, precipitation, seasonal heatmaps (Open-Meteo historical data)
- **Wind** — wind rose, prevailing direction, speed distribution across the year
- **Sun** — sun path, golden hour, daylight hours, building solar exposure (SunCalc)
- **Air quality** — AQI, PM2.5, pollen, pollutant breakdown
- **Hazards** — recent earthquakes (USGS), active wildfires (NASA FIRMS)
- **Nearby** — schools, hospitals, transit, parks, POIs (OpenStreetMap)
- **Building** — orientation, facade analysis, how much sun each side gets
- **Risk overview** — everything above rolled into severity signals
- **Compare mode** — A/B two locations side by side
- **Saved locations** — bookmark spots you're considering

## Run it

```bash
git clone https://github.com/d1mski/settl..git
cd settl.
npm install
npm run dev
```

That's it. No `.env`, no API keys. Everything hits free public endpoints.

## Built with

React 18 · TypeScript · Vite · Tailwind CSS · Leaflet · Recharts · Framer Motion

## Where the data comes from

Everything's free and open, no auth needed:

- [Open-Meteo](https://open-meteo.com/) — weather, climate history, air quality
- [Nominatim](https://nominatim.org/) — geocoding
- [Overpass](https://overpass-api.de/) — OpenStreetMap queries
- [USGS](https://earthquake.usgs.gov/fdsnws/event/1/) — earthquake data
- [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) — wildfire detection

## License

[MIT](LICENSE) — do whatever you want with it.
