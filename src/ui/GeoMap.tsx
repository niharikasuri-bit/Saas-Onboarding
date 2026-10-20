import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { countryBounds } from './OsmMap';

/**
 * Where a geography is, on OpenStreetMap: centred on it with a pin and its name.
 * Prototype: known centres for DIGIT's ready-made geographies; a geography they
 * created falls back to its country's outline, then to the world.
 */
const CENTRES: Record<string, [number, number, number]> = {
  nairobi: [-1.2864, 36.8172, 11],
  mombasa: [-4.0435, 39.6682, 11],
  kisumu: [-0.0917, 34.768, 10],
  kampala: [0.3476, 32.5825, 12],
  lagos: [6.5244, 3.3792, 10],
  punjab: [31.1471, 75.3412, 7],
  odisha: [20.9517, 85.0985, 7],
  maputo: [-25.9692, 32.5732, 11],
  addis: [9.03, 38.74, 11],
  freetown: [8.4657, -13.2317, 12],
};

const PIN = L.divIcon({ className: 'osm-pin', html: '<span></span>', iconSize: [28, 28], iconAnchor: [14, 28] });

export function GeoMap({ id, name, country }: { id: string; name: string; country: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!box.current) return;
    const m = L.map(box.current, { zoomControl: false, worldCopyJump: true });
    L.control.zoom({ position: 'bottomright' }).addTo(m);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    const c = CENTRES[id];
    const b = countryBounds(country);
    if (c) m.setView([c[0], c[1]], c[2]);
    else if (b) m.fitBounds(b);
    else m.setView([5, 20], 2);
    const at = c ? L.latLng(c[0], c[1]) : m.getCenter();
    L.marker(at, { icon: PIN, keyboard: false, interactive: false })
      .addTo(m)
      .bindTooltip(name, { permanent: true, direction: 'top', offset: [0, -30], className: 'gm-label' });
    setTimeout(() => m.invalidateSize(), 0);
    return () => {
      m.remove();
    };
  }, [id, name, country]);
  return (
    <div className="gm">
      <div ref={box} className="gm-canvas" role="application" aria-label={`Map showing where ${name} is, in ${country}. Use the arrow keys to move and plus or minus to zoom.`} />
    </div>
  );
}
