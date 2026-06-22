export interface IpLocation {
  lat: number;
  lon: number;
}

/**
 * Coarse location from the visitor's IP (ISP-level), used only to pick a
 * sensible initial map center. No browser permission prompt — that is reserved
 * for the explicit "use my location" crosshair button. Returns null on any
 * failure; the caller keeps its default view.
 */
export async function fetchIpLocation(signal?: AbortSignal): Promise<IpLocation | null> {
  try {
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const lat = parseFloat(data.latitude);
    const lon = parseFloat(data.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}
