const CARTO_KEY = import.meta.env.VITE_CARTO_KEY ?? '';

/** CARTO raster basemap URL. Without a key CARTO serves "API KEY REQUIRED" watermark tiles. */
export function cartoTileUrl(style: 'light_all' | 'dark_all' | 'dark_nolabels'): string {
  const url = `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`;
  return CARTO_KEY ? `${url}?key=${encodeURIComponent(CARTO_KEY)}` : url;
}
