import type { BuildingData, BuildingFacade, Coordinates } from '../types';
import { cardinal } from './coordinates';

const EARTH_RADIUS_M = 6371000;

interface ProjectedPoint {
  x: number;
  y: number;
}

function project(center: Coordinates, point: Coordinates): ProjectedPoint {
  const latRad = (center.lat * Math.PI) / 180;
  const x =
    ((point.lon - center.lon) * Math.PI) / 180 *
    EARTH_RADIUS_M *
    Math.cos(latRad);
  const y = ((point.lat - center.lat) * Math.PI) / 180 * EARTH_RADIUS_M;
  return { x, y };
}

function edgeBearing(a: ProjectedPoint, b: ProjectedPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const rad = Math.atan2(dx, dy);
  return ((rad * 180) / Math.PI + 360) % 360;
}

function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function shoelaceArea(points: ProjectedPoint[]): number {
  let sum = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

function dedupeRing(polygon: Coordinates[]): Coordinates[] {
  if (polygon.length < 2) return polygon;
  const first = polygon[0];
  const last = polygon[polygon.length - 1];
  if (first.lat === last.lat && first.lon === last.lon) {
    return polygon.slice(0, -1);
  }
  return polygon;
}

export interface PolygonAnalysis {
  polygon: Coordinates[];
  areaSqm: number;
  longestEdgeBearing: number;
  facades: BuildingFacade[];
}

export function analyseBuildingPolygon(input: Coordinates[]): PolygonAnalysis {
  const polygon = dedupeRing(input);
  if (polygon.length < 3) {
    return { polygon, areaSqm: 0, longestEdgeBearing: 0, facades: [] };
  }

  const center = polygon[0];
  const projected = polygon.map((v) => project(center, v));

  let longestLength = 0;
  let longestBearing = 0;
  for (let i = 0; i < projected.length; i++) {
    const a = projected[i];
    const b = projected[(i + 1) % projected.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len > longestLength) {
      longestLength = len;
      longestBearing = edgeBearing(a, b);
    }
  }

  const normalBearing = normalizeDegrees(longestBearing + 90);
  const facadeLabels: Array<BuildingFacade['label']> = ['Front', 'Right', 'Rear', 'Left'];
  const facades: BuildingFacade[] = facadeLabels.map((label, i) => {
    const bearing = normalizeDegrees(normalBearing + i * 90);
    return { label, bearing, cardinal: cardinal(bearing) };
  });

  return {
    polygon,
    areaSqm: shoelaceArea(projected),
    longestEdgeBearing: normalizeDegrees(longestBearing),
    facades,
  };
}

export function emptyBuilding(): BuildingData {
  return {
    found: false,
    polygon: [],
    areaSqm: 0,
    levels: null,
    type: null,
    longestEdgeBearing: 0,
    facades: [],
    matchDistanceM: null,
  };
}
