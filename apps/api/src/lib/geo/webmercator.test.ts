import { describe, it, expect } from '@jest/globals';
import {
  lngLatToTile,
  tileToBBox,
  encodeRegion,
  decodeRegion,
  clamp,
  tileToGeoJsonPolygon,
} from './webmercator';

describe('WebMercator utilities', () => {
  describe('lngLatToTile', () => {
    it('should convert Warsaw coordinates to tile at zoom 10', () => {
      const result = lngLatToTile(21.0122, 52.2297, 10);
      expect(result.x).toBe(568);
      expect(result.y).toBe(336);
    });

    it('should convert New York coordinates to tile at zoom 12', () => {
      const result = lngLatToTile(-74.006, 40.7128, 12);
      expect(result.x).toBe(1205);
      expect(result.y).toBe(1539);
    });

    it('should handle edge case at equator and prime meridian', () => {
      const result = lngLatToTile(0, 0, 8);
      expect(result.x).toBe(128);
      expect(result.y).toBe(128);
    });

    it('should handle negative coordinates', () => {
      const result = lngLatToTile(-122.4194, 37.7749, 10); // San Francisco
      expect(result.x).toBe(163);
      expect(result.y).toBe(395);
    });
  });

  describe('tileToBBox', () => {
    it('should convert tile coordinates to bounding box', () => {
      const bbox = tileToBBox(568, 336, 10);

      // Check that coordinates are reasonable
      expect(bbox.swLon).toBeGreaterThan(20);
      expect(bbox.swLon).toBeLessThan(22);
      expect(bbox.neLon).toBeGreaterThan(20);
      expect(bbox.neLon).toBeLessThan(22);
      expect(bbox.swLat).toBeGreaterThan(51);
      expect(bbox.swLat).toBeLessThan(53);
      expect(bbox.neLat).toBeGreaterThan(51);
      expect(bbox.neLat).toBeLessThan(53);

      // Check that NE is greater than SW
      expect(bbox.neLon).toBeGreaterThan(bbox.swLon);
      expect(bbox.neLat).toBeGreaterThan(bbox.swLat);
    });

    it('should produce a larger bbox at lower zoom levels', () => {
      const bbox1 = tileToBBox(128, 128, 8);
      const bbox2 = tileToBBox(256, 256, 9);

      const size1 = (bbox1.neLon - bbox1.swLon) * (bbox1.neLat - bbox1.swLat);
      const size2 = (bbox2.neLon - bbox2.swLon) * (bbox2.neLat - bbox2.swLat);

      expect(size1).toBeGreaterThan(size2);
    });
  });

  describe('round-trip tile conversion', () => {
    it('should correctly convert coordinates to tile and back to bbox containing original point', () => {
      const lng = 21.0122;
      const lat = 52.2297;
      const zoom = 12;

      const tile = lngLatToTile(lng, lat, zoom);
      const bbox = tileToBBox(tile.x, tile.y, zoom);

      // Original point should be within the tile's bounding box
      expect(lng).toBeGreaterThanOrEqual(bbox.swLon);
      expect(lng).toBeLessThanOrEqual(bbox.neLon);
      expect(lat).toBeGreaterThanOrEqual(bbox.swLat);
      expect(lat).toBeLessThanOrEqual(bbox.neLat);
    });

    it('should handle multiple zoom levels', () => {
      const lng = -0.1276; // London
      const lat = 51.5074;

      for (let zoom = 2; zoom <= 12; zoom++) {
        const tile = lngLatToTile(lng, lat, zoom);
        const bbox = tileToBBox(tile.x, tile.y, zoom);

        expect(lng).toBeGreaterThanOrEqual(bbox.swLon);
        expect(lng).toBeLessThanOrEqual(bbox.neLon);
        expect(lat).toBeGreaterThanOrEqual(bbox.swLat);
        expect(lat).toBeLessThanOrEqual(bbox.neLat);
      }
    });
  });

  describe('encodeRegion and decodeRegion', () => {
    it('should encode and decode region token', () => {
      const z = 10;
      const x = 568;
      const y = 336;

      const token = encodeRegion(z, x, y);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      const decoded = decodeRegion(token);
      expect(decoded.z).toBe(z);
      expect(decoded.x).toBe(x);
      expect(decoded.y).toBe(y);
    });

    it('should handle large tile coordinates', () => {
      const z = 12;
      const x = 4095;
      const y = 4095;

      const token = encodeRegion(z, x, y);
      const decoded = decodeRegion(token);

      expect(decoded.z).toBe(z);
      expect(decoded.x).toBe(x);
      expect(decoded.y).toBe(y);
    });

    it('should produce different tokens for different coordinates', () => {
      const token1 = encodeRegion(10, 100, 200);
      const token2 = encodeRegion(10, 100, 201);
      const token3 = encodeRegion(10, 101, 200);
      const token4 = encodeRegion(11, 100, 200);

      expect(token1).not.toBe(token2);
      expect(token1).not.toBe(token3);
      expect(token1).not.toBe(token4);
      expect(token2).not.toBe(token3);
    });
  });

  describe('clamp', () => {
    it('should clamp value between min and max', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
      expect(clamp(5, 5, 5)).toBe(5);
    });

    it('should work with negative ranges', () => {
      expect(clamp(-5, -10, 0)).toBe(-5);
      expect(clamp(-15, -10, 0)).toBe(-10);
      expect(clamp(5, -10, 0)).toBe(0);
    });
  });

  describe('tileToGeoJsonPolygon', () => {
    it('should create valid GeoJSON Polygon', () => {
      const geojson = tileToGeoJsonPolygon(568, 336, 10);

      expect(geojson.type).toBe('Polygon');
      expect(Array.isArray(geojson.coordinates)).toBe(true);
      expect(geojson.coordinates.length).toBe(1);
      expect(geojson.coordinates[0].length).toBe(5);

      // First and last coordinates should be the same (closed polygon)
      const first = geojson.coordinates[0][0];
      const last = geojson.coordinates[0][4];
      expect(first[0]).toBe(last[0]);
      expect(first[1]).toBe(last[1]);
    });

    it('should create polygon with correct coordinate order', () => {
      const geojson = tileToGeoJsonPolygon(100, 100, 8);
      const coords = geojson.coordinates[0];

      // Check that it forms a proper rectangle
      // SW corner
      const sw = coords[0];
      // NW corner
      const nw = coords[1];
      // NE corner
      const ne = coords[2];
      // SE corner
      const se = coords[3];

      // SW and NW should have same longitude
      expect(sw[0]).toBe(nw[0]);
      // NE and SE should have same longitude
      expect(ne[0]).toBe(se[0]);
      // SW and SE should have same latitude
      expect(sw[1]).toBe(se[1]);
      // NW and NE should have same latitude
      expect(nw[1]).toBe(ne[1]);
    });
  });

  describe('clustering scenario', () => {
    it('should group points in the same tile', () => {
      // Multiple points in Warsaw that should fall in the same tile at zoom 10
      const points = [
        { lng: 21.0122, lat: 52.2297 }, // Warsaw center
        { lng: 21.015, lat: 52.23 }, // Nearby
        { lng: 21.01, lat: 52.229 }, // Nearby
      ];

      const zoom = 10;
      const tiles = points.map((p) => lngLatToTile(p.lng, p.lat, zoom));

      // All points should be in the same tile at this zoom level
      expect(tiles[0].x).toBe(tiles[1].x);
      expect(tiles[0].y).toBe(tiles[1].y);
      expect(tiles[0].x).toBe(tiles[2].x);
      expect(tiles[0].y).toBe(tiles[2].y);
    });

    it('should separate distant points into different tiles', () => {
      const warsaw = { lng: 21.0122, lat: 52.2297 };
      const krakow = { lng: 19.945, lat: 50.0647 };

      const zoom = 8;
      const tile1 = lngLatToTile(warsaw.lng, warsaw.lat, zoom);
      const tile2 = lngLatToTile(krakow.lng, krakow.lat, zoom);

      // These cities should be in different tiles
      expect(tile1.x !== tile2.x || tile1.y !== tile2.y).toBe(true);
    });
  });
});
