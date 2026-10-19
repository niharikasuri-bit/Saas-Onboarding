import { useEffect, useState } from 'react';

/**
 * A live OpenStreetMap view under the country field. It follows what they type:
 * once the name matches a country it knows, the map moves there; otherwise it
 * shows the world. Prototype: a short list of country outlines (west, south,
 * east, north), not a geocoder.
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
const WORLD: [number, number, number, number] = [-170, -58, 180, 78];

function find(q: string) {
  const t = q.trim().toLowerCase();
  if (t.length < 3) return null;
  return Object.keys(BOXES).find((n) => n.toLowerCase() === t) ?? Object.keys(BOXES).find((n) => n.toLowerCase().startsWith(t)) ?? null;
}

export function OsmMap({ query }: { query: string }) {
  // Wait for a pause in typing before moving the map.
  const [shown, setShown] = useState(() => find(query));
  useEffect(() => {
    const t = setTimeout(() => setShown(find(query)), 400);
    return () => clearTimeout(t);
  }, [query]);
  const [w, s, e, n] = shown ? BOXES[shown] : WORLD;
  return (
    <figure className="osm-map">
      <iframe
        title={shown ? `Map of ${shown}` : 'World map'}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${w},${s},${e},${n}&layer=mapnik`}
        loading="lazy"
      />
      {/* The embed carries OpenStreetMap's own credit line. */}
      <figcaption>{shown ? `Showing ${shown}` : 'Type a country to see it on the map.'}</figcaption>
    </figure>
  );
}
