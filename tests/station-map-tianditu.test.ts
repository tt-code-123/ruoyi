import {
  getTiandituTileRange,
  getTiandituTileUrl,
} from '../src/views/qinghai/station-map/mapLayerConfig';

const vectorUrl: string = getTiandituTileUrl('vector', {
  token: 'test-token',
  zoom: 7,
  row: 18,
  col: 98,
});
const imageryUrl: string = getTiandituTileUrl('imagery', {
  token: 'test-token',
  zoom: 7,
  row: 18,
  col: 98,
});
const range = getTiandituTileRange({ minLng: 89, maxLng: 103, minLat: 31, maxLat: 40 }, 7);

if (!vectorUrl.includes('/vec_c/wmts') || !imageryUrl.includes('/img_c/wmts')) {
  throw new Error('Expected Tianditu vector and imagery WMTS endpoints.');
}

if (range.minCol > range.maxCol || range.minRow > range.maxRow) {
  throw new Error('Expected a drawable tile range.');
}
