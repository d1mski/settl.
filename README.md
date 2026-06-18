# settl. - Location Intelligence.

Pin a location, see what it's actually like to live there. Climate, wind, sun, air quality, hazards, what's nearby. A full year of data on one screen. Free, no API keys.

![MIT License](https://img.shields.io/badge/license-MIT-green)

## The backstory

I was about to relocate to a new area. The house was great, the neighborhood looked good. But the area is known for high winds, and that was my major blind spot. Would I be able to leave the house with a small kid in winter without getting soaked and blasted by gale-force gusts? That kind of thing doesn't show up on a house listing or a weekend visit in June.

That one question opened up a bigger one: what does a full year actually look like at this exact spot? When it rains, does it pour? My kid's bedroom faces west. Does it turn into an oven every summer afternoon?

The data exists. It's just scattered across a dozen free APIs. This is my attempt at putting it all on one screen.

## What you get

Temperature, precipitation, and seasonal heatmaps from Open-Meteo historical data. Wind roses showing prevailing direction and speed distribution across the year. Sun path, golden hour timing, daylight hours, and how much direct sun each side of a building gets (calculated with SunCalc). Real-time air quality including AQI, PM2.5, pollen, and pollutant breakdown.

Recent earthquakes from USGS and active wildfires from NASA FIRMS. Schools, hospitals, transit stops, and parks pulled from OpenStreetMap. Building orientation and facade analysis. Everything gets rolled into a risk overview with severity scoring.

You can compare two locations side by side and bookmark spots you're considering.

## Run it

```bash
git clone https://github.com/d1mski/settl..git
cd settl.
npm install
npm run dev
```

No `.env` file, no API keys. Everything hits free public endpoints.

## Built with

React 18, TypeScript, Vite, Tailwind CSS, Leaflet, Recharts, Framer Motion

## Where the data comes from

All free, no auth needed:

- [Open-Meteo](https://open-meteo.com/) for weather, climate history, and air quality
- [Nominatim](https://nominatim.org/) for geocoding
- [Overpass](https://overpass-api.de/) for OpenStreetMap queries
- [USGS](https://earthquake.usgs.gov/fdsnws/event/1/) for earthquake data
- [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) for wildfire detection

## License

[MIT](LICENSE)
