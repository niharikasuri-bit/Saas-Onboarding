// shpjs ships no types: a zipped shapefile (or { shp }) in, GeoJSON out.
declare module 'shpjs' {
  type Out = GeoJSON.FeatureCollection | GeoJSON.FeatureCollection[];
  export default function shp(input: ArrayBuffer | { shp: ArrayBuffer; dbf?: ArrayBuffer; prj?: string }): Promise<Out>;
}
