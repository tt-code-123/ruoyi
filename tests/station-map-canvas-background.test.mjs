import { readFileSync } from 'node:fs';

const source = readFileSync('src/views/qinghai/station-map/index.vue', 'utf8');

if (source.includes("environment: 'rgba(0,0,0,0)'")) {
  throw new Error('Map canvas environment should use a scene color instead of transparent black.');
}

if (!source.includes('MAP_CANVAS_BACKGROUND')) {
  throw new Error('Map canvas background color should be defined explicitly.');
}
