import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import {
  Plane, Shield, Zap, Droplets, Pickaxe, Trash2, Server, Factory, Building2,
  Anchor, Ship, TrainFront, Train, TramFront, Bus, Waves, Flag, Trees,
  Cross, Stethoscope, School, GraduationCap, Library, Drama, Film, Utensils,
  Coffee, Beer, Armchair, Landmark, Pill, Fuel, SquareParking, Church, Mail,
  ShoppingBag, AlertTriangle, MapPin,
  type LucideIcon,
} from 'lucide-react';
import type { FeatureCategory } from '../hooks/useOverpassFeatures';

// subtype string (from useOverpassFeatures.categorise) → Lucide glyph.
// Raw OSM amenity/shop values flow through as the subtype, so common ones
// (theatre, bench, cafe…) map directly without touching the categoriser.
const SUBTYPE_ICONS: Record<string, LucideIcon> = {
  // transit
  bus_stop: Bus,
  'railway:station': TrainFront,
  'railway:halt': Train,
  'railway:tram_stop': TramFront,
  'pt:station': TrainFront,
  station: TrainFront,
  subway: TrainFront,
  ferry_terminal: Ship,
  harbour: Anchor,
  // airport
  aerodrome: Plane,
  // water / green
  water: Waves,
  park: Trees,
  golf_course: Flag,
  // health / education
  hospital: Cross,
  clinic: Stethoscope,
  school: School,
  'school:primary': School,
  'school:secondary': School,
  university: GraduationCap,
  college: GraduationCap,
  library: Library,
  // leisure / food
  theatre: Drama,
  cinema: Film,
  restaurant: Utensils,
  fast_food: Utensils,
  cafe: Coffee,
  bar: Beer,
  pub: Beer,
  bench: Armchair,
  // services
  bank: Landmark,
  pharmacy: Pill,
  fuel: Fuel,
  parking: SquareParking,
  place_of_worship: Church,
  post_office: Mail,
  // industrial / hazard
  industrial: Factory,
  commercial: Building2,
  substation: Zap,
  wastewater: Droplets,
  quarry: Pickaxe,
  landfill: Trash2,
  data_center: Server,
  // military
  military: Shield,
};

const CATEGORY_ICONS: Record<FeatureCategory, LucideIcon> = {
  amenity: MapPin,
  industrial: Factory,
  airport: Plane,
  water: Waves,
  park: Trees,
  place: MapPin,
  transit: Bus,
  hazard: AlertTriangle,
  military: Shield,
  other: MapPin,
};

function pickIcon(subtype: string, category: FeatureCategory): LucideIcon {
  if (SUBTYPE_ICONS[subtype]) return SUBTYPE_ICONS[subtype];
  if (subtype.startsWith('shop:')) return ShoppingBag;
  return CATEGORY_ICONS[category] ?? MapPin;
}

// Memoised per (subtype, color, dim) — renderToStaticMarkup runs at most once
// per distinct glyph variant (~30), not per marker.
const iconCache = new Map<string, L.DivIcon>();

export function featureDivIcon(
  subtype: string,
  category: FeatureCategory,
  color: string,
  dim: boolean,
): L.DivIcon {
  const key = `${subtype}|${color}|${dim ? 'd' : 'f'}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const Icon = pickIcon(subtype, category);
  const svg = renderToStaticMarkup(<Icon size={15} color={color} strokeWidth={2.25} />);
  const html = `<div style="opacity:${dim ? 0.6 : 1};filter:drop-shadow(0 0 1.5px rgba(0,0,0,.95))">${svg}</div>`;
  const icon = L.divIcon({
    className: 'settl-feature-pin',
    html,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
  iconCache.set(key, icon);
  return icon;
}
