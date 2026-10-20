import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { countryBounds } from './OsmMap';
import type { GeoRow } from '../lib/model';

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

export function GeoMap({ id, name, country, rows = [], levels = [] }: { id: string; name: string; country: string; rows?: GeoRow[]; levels?: string[] }) {
  const shaped = rows.filter((r) => r.geo);
  const pointed = rows.filter((r) => !r.geo && r.latlong && pointOf(r.latlong));
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
    // Shape files: each outline, named; the map fits them
    const drawn = L.featureGroup().addTo(m);
    shaped.forEach((r) => {
      L.geoJSON(r.geo as GeoJSON.GeoJsonObject, { style: { color: '#C84C0E', weight: 2, fillColor: '#C84C0E', fillOpacity: 0.12 } })
        .bindTooltip(`${r.name} (${levels[r.level] ?? ''})`, { sticky: true, className: 'gm-label' })
        .addTo(drawn);
    });
    // Lat / long without a shape: a dot
    pointed.forEach((r) => {
      L.circleMarker(pointOf(r.latlong!)!, { radius: 6, color: '#fff', weight: 2, fillColor: '#0B4B66', fillOpacity: 1 })
        .bindTooltip(r.name, { direction: 'top', className: 'gm-label' })
        .addTo(drawn);
    });
    const bounds = drawn.getBounds();
    if (bounds.isValid()) m.fitBounds(bounds, { padding: [24, 24], maxZoom: 13 });
    else {
      const at = c ? L.latLng(c[0], c[1]) : m.getCenter();
      L.marker(at, { icon: PIN, keyboard: false, interactive: false })
        .addTo(m)
        .bindTooltip(name, { permanent: true, direction: 'top', offset: [0, -30], className: 'gm-label' });
    }
    setTimeout(() => m.invalidateSize(), 0);
    return () => {
      m.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, name, country, rows]);
  return (
    <div className="gm">
      <div ref={box} className="gm-canvas" role="application" aria-label={`Map showing ${shaped.length ? `the outlines of ${shaped.length} ${shaped.length === 1 ? 'geography' : 'geographies'} in ${name}` : `where ${name} is, in ${country}`}. Use the arrow keys to move and plus or minus to zoom.`} />
      {/* What the map shows, in words */}
      <p className="gm-key">
        {shaped.length ? (
          <>
            <span className="gm-swatch" aria-hidden="true" />
            Shape files: {shaped.map((r) => r.name).join(', ')}
          </>
        ) : (
          'No shape files yet. Edit a geography in the tree to upload its outline.'
        )}
      </p>
    </div>
  );
}

/** "12.97, 77.59" as a point, or null. */
function pointOf(v: string): [number, number] | null {
  const m = v.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}
