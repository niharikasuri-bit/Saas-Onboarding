import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from '../components/Icon';

/**
 * An interactive OpenStreetMap under the country search. It follows what they
 * type (once the name matches a country it knows, the map moves there), and they
 * pin their location by clicking the map. Keyboard: the map takes focus, the
 * arrow keys pan and + / - zoom, and "Pin map centre" drops the pin.
 * Prototype: a short list of country outlines (west, south, east, north), not a geocoder.
 */
const BOXES: Record<string, [number, number, number, number]> = {
  Bangladesh: [88.0, 20.7, 92.7, 26.6],
  Brazil: [-74.0, -33.8, -34.8, 5.3],
  'Burkina Faso': [-5.5, 9.4, 2.4, 15.1],
  Cameroon: [8.5, 1.7, 16.2, 13.1],
  Chad: [13.5, 7.4, 24.0, 23.5],
  'Democratic Republic of the Congo': [12.2, -13.5, 31.3, 5.4],
  Ethiopia: [33.0, 3.4, 48.0, 14.9],
  Ghana: [-3.3, 4.7, 1.2, 11.2],
  Haiti: [-74.5, 18.0, -71.6, 20.1],
  India: [68.1, 6.7, 97.4, 35.5],
  Indonesia: [95.0, -11.0, 141.0, 6.1],
  Kenya: [33.9, -4.7, 41.9, 5.0],
  Liberia: [-11.5, 4.3, -7.4, 8.6],
  Malawi: [32.7, -17.1, 35.9, -9.4],
  Mali: [-12.2, 10.1, 4.3, 25.0],
  Mozambique: [30.2, -26.9, 40.8, -10.5],
  Nepal: [80.0, 26.3, 88.2, 30.5],
  Niger: [0.2, 11.7, 16.0, 23.5],
  Nigeria: [2.7, 4.2, 14.7, 13.9],
  Pakistan: [60.9, 23.7, 77.8, 37.1],
  Philippines: [116.9, 4.6, 126.6, 21.1],
  Portugal: [-9.6, 36.9, -6.1, 42.2],
  Rwanda: [28.8, -2.9, 30.9, -1.0],
  Senegal: [-17.6, 12.3, -11.3, 16.7],
  'Sierra Leone': [-13.3, 6.9, -10.3, 10.0],
  'South Africa': [16.3, -34.8, 32.9, -22.1],
  'Sri Lanka': [79.6, 5.9, 81.9, 9.9],
  Tanzania: [29.3, -11.8, 40.4, -1.0],
  Uganda: [29.5, -1.5, 35.0, 4.2],
  Zambia: [21.9, -18.1, 33.7, -8.2],
  Zimbabwe: [25.2, -22.4, 33.1, -15.6],
};

function find(q: string) {
  const t = q.trim().toLowerCase();
  if (t.length < 3) return null;
  return Object.keys(BOXES).find((n) => n.toLowerCase() === t) ?? Object.keys(BOXES).find((n) => n.toLowerCase().startsWith(t)) ?? null;
}

export type Pin = { lat: number; lng: number };

/** The pin: an orange drop, drawn in CSS so no image files are needed. */
const PIN = L.divIcon({ className: 'osm-pin', html: '<span></span>', iconSize: [28, 28], iconAnchor: [14, 28] });

export function OsmMap({
  id,
  query,
  pin,
  onPin,
  error,
}: {
  id: string;
  query: string;
  pin: Pin | null;
  onPin: (p: Pin | null) => void;
  error?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const onPinRef = useRef(onPin);
  onPinRef.current = onPin;
  const [shown, setShown] = useState(() => find(query));

  // One map for the life of the step.
  useEffect(() => {
    if (!box.current) return;
    const m = L.map(box.current, { worldCopyJump: true, zoomControl: true }).setView([5, 20], 2);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    m.on('click', (e: L.LeafletMouseEvent) => onPinRef.current({ lat: e.latlng.lat, lng: e.latlng.lng }));
    map.current = m;
    // The map is the last thing laid out on the step; make sure it fills its box.
    setTimeout(() => m.invalidateSize(), 0);
    return () => {
      m.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  // Move to the country after a pause in typing.
  useEffect(() => {
    const t = setTimeout(() => setShown(find(query)), 400);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => {
    if (!map.current || !shown) return;
    const [w, s, e, n] = BOXES[shown];
    map.current.fitBounds([
      [s, w],
      [n, e],
    ]);
  }, [shown]);

  // Keep the marker in step with the pin.
  useEffect(() => {
    if (!map.current) return;
    if (!pin) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    if (marker.current) marker.current.setLatLng([pin.lat, pin.lng]);
    else marker.current = L.marker([pin.lat, pin.lng], { icon: PIN, keyboard: false, interactive: false }).addTo(map.current);
  }, [pin]);

  const fmt = (n: number) => n.toFixed(4);
  return (
    <div className={`osm-map${error ? ' has-error' : ''}`}>
      {error && (
        <p className="fld-error" id={`${id}-err`}>
          <span className="ux-visually-hidden">Error: </span>
          {error}
        </p>
      )}
      <div
        ref={box}
        id={id}
        className="osm-canvas"
        role="application"
        aria-label={`Map${shown ? ` of ${shown}` : ''}. Click to pin your location, or use the arrow keys to move and Pin map centre.`}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      <div className="osm-bar">
        <p className="osm-status" role="status">
          {pin ? (
            <>
              <Icon name="LocationOn" size={18} />
              Pinned at {fmt(pin.lat)}, {fmt(pin.lng)}
            </>
          ) : shown ? (
            `Showing ${shown}. Click the map to pin your location.`
          ) : (
            'Search for your country, then click the map to pin your location.'
          )}
        </p>
        <div className="osm-actions">
          <button
            type="button"
            className="osm-btn"
            onClick={() => {
              const c = map.current?.getCenter();
              if (c) onPin({ lat: c.lat, lng: c.lng });
            }}
          >
            <Icon name="LocationOn" size={18} />
            Pin map centre
          </button>
          {pin && (
            <button type="button" className="osm-btn" onClick={() => onPin(null)}>
              Clear pin
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
