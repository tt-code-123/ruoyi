import { readFileSync } from 'node:fs';

const source = readFileSync('src/views/qinghai/station-map/index.vue', 'utf8');

if (/convertToPixel\s*\(\s*\{\s*geo3DIndex\s*:/.test(source)) {
  throw new Error(
    'Avoid convertToPixel({ geo3DIndex }) because ECharts warns before geo3D is ready.',
  );
}
