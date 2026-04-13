import L from 'leaflet';

function makeReticleIcon(color: string, label: string): L.DivIcon {
  const html = `
    <div class="hud-pin" style="--pin-color:${color};">
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <circle cx="16" cy="16" r="11" fill="none" stroke="${color}" stroke-width="1.4" opacity="0.95"/>
        <circle cx="16" cy="16" r="6" fill="${color}" fill-opacity="0.18" stroke="${color}" stroke-width="1"/>
        <circle cx="16" cy="16" r="1.6" fill="${color}"/>
        <line x1="16" y1="0" x2="16" y2="6" stroke="${color}" stroke-width="1.2"/>
        <line x1="16" y1="26" x2="16" y2="32" stroke="${color}" stroke-width="1.2"/>
        <line x1="0" y1="16" x2="6" y2="16" stroke="${color}" stroke-width="1.2"/>
        <line x1="26" y1="16" x2="32" y2="16" stroke="${color}" stroke-width="1.2"/>
      </svg>
      <span class="hud-pin-label" style="color:${color};">${label}</span>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'hud-pin-wrapper',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export const iconA = makeReticleIcon('#7eeaff', 'A');
export const iconB = makeReticleIcon('#ffb347', 'B');
