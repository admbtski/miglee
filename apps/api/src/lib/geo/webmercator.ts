/**
 * WebMercator tile utilities for map clustering
 * Converts between lat/lng coordinates and tile coordinates
 */

export interface TileCoords {
  x: number;
  y: number;
}

export interface BBox {
  swLon: number;
  swLat: number;
  neLon: number;
  neLat: number;
}

export interface RegionCoords {
  z: number;
  x: number;
  y: number;
}

/**
 * Convert lng/lat to tile coordinates at zoom level z
 * @param lng Longitude (-180 to 180)
 * @param lat Latitude (-85.0511 to 85.0511)
 * @param z Zoom level (0-20)
 * @returns Tile coordinates {x, y}
 */
export function lngLatToTile(lng: number, lat: number, z: number): TileCoords {
  const n = Math.pow(2, z);
  const xtile = Math.floor(((lng + 180) / 360) * n);
  const ytile = Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      n
  );
  return { x: xtile, y: ytile };
}

/**
 * Convert tile coordinates to bounding box
 * @param x Tile X coordinate
 * @param y Tile Y coordinate
 * @param z Zoom level
 * @returns Bounding box {swLon, swLat, neLon, neLat}
 */
export function tileToBBox(x: number, y: number, z: number): BBox {
  const n = Math.pow(2, z);
  const lon1 = (x / n) * 360 - 180;
  const lat1 =
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  const lon2 = ((x + 1) / n) * 360 - 180;
  const lat2 =
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI;

  // SW..NE
  return { swLon: lon1, swLat: lat2, neLon: lon2, neLat: lat1 };
}

/**
 * Encode tile coordinates to a region token (base64)
 * @param z Zoom level
 * @param x Tile X coordinate
 * @param y Tile Y coordinate
 * @returns Base64 encoded region token
 */
export function encodeRegion(z: number, x: number, y: number): string {
  return Buffer.from(`${z}|${x}|${y}`).toString('base64');
}

/**
 * Decode region token to tile coordinates
 * @param token Base64 encoded region token
 * @returns Tile coordinates {z, x, y}
 */
export function decodeRegion(token: string): RegionCoords {
  const s = Buffer.from(token, 'base64').toString('utf8');
  const parts = s.split('|').map((v) => parseInt(v, 10));
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid region token: ${token}`);
  }
  return {
    z: parts[0]!,
    x: parts[1]!,
    y: parts[2]!,
  };
}

/**
 * Clamp a number between min and max
 * @param n Number to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Create GeoJSON Polygon from tile bounding box
 * @param x Tile X coordinate
 * @param y Tile Y coordinate
 * @param z Zoom level
 * @returns GeoJSON Polygon
 */
export function tileToGeoJsonPolygon(x: number, y: number, z: number) {
  const b = tileToBBox(x, y, z);
  return {
    type: 'Polygon' as const,
    coordinates: [
      [
        [b.swLon, b.swLat],
        [b.swLon, b.neLat],
        [b.neLon, b.neLat],
        [b.neLon, b.swLat],
        [b.swLon, b.swLat],
      ],
    ],
  };
}
