import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';

/**
 * A location picker: search (and Use my location) above the map, the pin fixed
 * in the centre, zoom at the bottom right, and they move the map (drag, scroll, arrow
 * keys, or search) to put their place under it. "Use my location" jumps there.
 * A card at the bottom says what's selected; Next confirms it.
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

/** The country (of the ones it knows) a point falls in, smallest outline first. */
export function countryAt(p: { lat: number; lng: number }) {
  const hits = Object.entries(BOXES).filter(([, [w, s, e, n]]) => p.lng >= w && p.lng <= e && p.lat >= s && p.lat <= n);
  hits.sort((a, b) => (a[1][2] - a[1][0]) * (a[1][3] - a[1][1]) - (b[1][2] - b[1][0]) * (b[1][3] - b[1][1]));
  return hits[0]?.[0] ?? null;
}

/** A country's outline as Leaflet bounds, if it's one the prototype knows. */
export function countryBounds(name: string): [[number, number], [number, number]] | null {
  const b = BOXES[name];
  return b ? [[b[1], b[0]], [b[3], b[2]]] : null;
}

function find(q: string) {
  const t = q.trim().toLowerCase();
  if (t.length < 3) return null;
  return Object.keys(BOXES).find((n) => n.toLowerCase() === t) ?? Object.keys(BOXES).find((n) => n.toLowerCase().startsWith(t)) ?? null;
}

export type Pin = { lat: number; lng: number };

export function OsmMap({
  id,
  query,
  pin,
  onPin,
  search,
  apiRef,
}: {
  id: string;
  query: string;
  /** The selected point: the map centre, once they've moved the map or searched. */
  pin: Pin | null;
  onPin: (p: Pin | null) => void;
  /** The search box, above the map. */
  search: React.ReactNode;
  /** Lets the page put Use my location wherever it likes (it sits in the title row). */
  apiRef?: React.MutableRefObject<{ locate: () => void } | null>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const onPinRef = useRef(onPin);
  onPinRef.current = onPin;
  const [shown, setShown] = useState(() => find(query));
  const [locating, setLocating] = useState('');

  // One map for the life of the step. Wherever the map comes to rest is the selection.
  useEffect(() => {
    if (!box.current) return;
    const m = L.map(box.current, { worldCopyJump: true, zoomControl: false }).setView([5, 20], 2);
    L.control.zoom({ position: 'bottomright' }).addTo(m);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    map.current = m;
    m.invalidateSize();
    // From here on, wherever the map comes to rest (drag, zoom, keys, search, my location) is the selection.
    const t = setTimeout(
      () =>
        m.on('moveend', () => {
          const c = m.getCenter();
          onPinRef.current({ lat: c.lat, lng: c.lng });
        }),
      300,
    );
    return () => {
      clearTimeout(t);
      m.remove();
      map.current = null;
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

  const useMyLocation = () => {
    if (!navigator.geolocation) return setLocating('Your browser can’t share your location. Search or move the map instead.');
    setLocating('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating('');
        if (!map.current) return;
            map.current.setView([pos.coords.latitude, pos.coords.longitude], 12);
      },
      () => setLocating('Couldn’t get your location. Search or move the map instead.'),
      { timeout: 10000 },
    );
  };

  if (apiRef) apiRef.current = { locate: useMyLocation };
  const place = pin ? countryAt(pin) : null;
  const fmt = (n: number) => n.toFixed(4);
  return (
    <div className="osm-map">
      {/* Search on the left, Use my location on the right, just above the map */}
      <div className="osm-above">
        {search}
        <Button variation="secondary" icon="MyLocation" label="Use my location" onClick={useMyLocation} />
      </div>
      <div className="osm-frame">
        <div
          ref={box}
          id={id}
          className="osm-canvas"
          role="application"
          aria-label="Map. Move it with the arrow keys, or drag it, to put your location under the pin in the centre."
        />
        {/* The pin never moves; the map moves under it. */}
        <span className="osm-centre" aria-hidden="true">
          <span className="osm-pin-mark" />
        </span>
        <div className="osm-float osm-selected">
          <p role="status">
            {locating ||
              (pin ? (
                <>
                  <Icon name="LocationOn" size={18} />
                  <strong>{place ?? 'Selected location'}</strong>
                  <span className="osm-coords">
                    {fmt(pin.lat)}, {fmt(pin.lng)}
                  </span>
                </>
              ) : (
                'Search for a place, or move the map to put the pin on your location.'
              ))}
          </p>
        </div>
      </div>
    </div>
  );
}
