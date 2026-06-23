# settl. [Location Intelligence]

Pin a location, see what it's actually like to live there. Climate, wind, sun, air quality, hazards, what's nearby. A full year of data on one screen. Free, no API keys.

![MIT License](https://img.shields.io/badge/license-MIT-green)

<img width="1792" height="1033" alt="image" src="https://github.com/user-attachments/assets/860aa7d3-859f-4b2c-bea3-652c468e1eb8" />




## The backstory

House listings tell you everything except what it's actually like to live there.

I was about to move. Good house, good neighborhood — but nothing about the things you live with daily. The area gets high winds: could I get out the door with a toddler in January without being knocked sideways? My kid's bedroom faces west — does it bake every summer afternoon? 

None of that shows up in a listing or a sunny weekend visit in May.

The data exists — climate, wind, sun, earthquakes, wildfires, nearby amenities and POIs. It's just scattered across a dozen free APIs. This puts it all on one screen, for any address.

## What you get

Temperature, precipitation, and seasonal heatmaps from Open-Meteo historical data. Wind roses showing prevailing direction and speed distribution across the year. Sun path, golden hour timing, daylight hours, and how much direct sun each side of a building gets (calculated with SunCalc). Real-time air quality including AQI, PM2.5, pollen, and pollutant breakdown.

Recent earthquakes from USGS and active wildfires from NASA FIRMS. Schools, hospitals, transit stops, and parks pulled from OpenStreetMap. Building orientation and facade analysis. Everything gets rolled into a risk overview with severity scoring.

You can compare two locations side by side and bookmark spots you're considering.
<p align="center">
  <img width="45%" src="https://github.com/user-attachments/assets/438311c8-d907-4d21-8845-9b09f5702f60" />
  <img width="45%" src="https://github.com/user-attachments/assets/6a060b4a-5260-453a-9d99-7edc7506262d" />
  <br/>
  <img width="45%" src="https://github.com/user-attachments/assets/bb541a10-15c1-4e50-b6df-f50e388b08da" />
  <img width="45%" src="https://github.com/user-attachments/assets/c486a4c9-e52f-46a5-aedb-519a4c526d3d" />
</p>


## Modules

The app is organized into six modules. You pick a location on the map, then drill into whichever angle matters to you.

**Climate** pulls a full year of historical daily data from Open-Meteo. You get monthly temperature and precipitation charts, a heatmap grid showing day-by-day patterns across the year, extreme day counts (how many days above 35C, below 0C, etc.), and UV index bands. Enough to see whether summers are brutal or winters are mild before you experience them.

**Wind** builds a wind rose from hourly historical data, so you can see which direction wind comes from most often and how hard it blows. There's a seasonal breakdown too, because wind in January and wind in July can be completely different stories.

**Sun** calculates the sun path arc for any date using SunCalc, shows golden hour and daylight duration across the year, and (if building footprint data exists in OpenStreetMap) estimates how many hours of direct sun each facade of a building gets. Useful for figuring out which rooms get cooked in summer.

**Air quality** shows real-time AQI, PM2.5, pollen counts, and individual pollutant levels over time. All from Open-Meteo's air quality API.

**Hazards** maps recent earthquakes within range (USGS data) and active wildfire detections (NASA FIRMS satellite data). Each gets a mini map and magnitude/intensity charts.

**Context** pulls nearby points of interest from OpenStreetMap via the Overpass API: schools, hospitals, clinics, transit stops, parks, and bodies of water. It also grabs relevant Wikipedia articles about the area so you get some local background. The nearest feature of each type is shown with distance.

### Other features

There's an overview mode that summarizes all modules on one screen with severity indicators, so you can get the headline picture without drilling into each one. Compare mode lets you pin two locations and see their data side by side. Saved locations persist in your browser (IndexedDB) so you can come back to spots you're evaluating.

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
