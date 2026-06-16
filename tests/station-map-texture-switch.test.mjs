import { readFileSync } from 'node:fs';

const source = readFileSync('src/views/qinghai/station-map/index.vue', 'utf8');

if (/watch\(\s*mapLayerState\s*,\s*\(\)\s*=>\s*\{\s*renderMapChart\(\);?\s*\}\s*\)/s.test(source)) {
  throw new Error('Base map changes must wait for the matching texture before rendering.');
}

if (!source.includes('mapTextureBaseMap.value === mapLayerState.baseMap')) {
  throw new Error('Map texture must only be used with the base map mode it was built for.');
}

if (!source.includes('mapTextureCache = new Map<BaseMapMode, HTMLCanvasElement>()')) {
  throw new Error('Base map textures should be cached after first load.');
}

if (!source.includes('cloneTextureCanvas')) {
  throw new Error('Cached textures should be cloned before passing them to ECharts-GL.');
}

if (!source.includes('renderMapChart(false)')) {
  throw new Error('Overlay toggles should update the map without clearing WebGL textures.');
}

if (!source.includes('detailTexture: texture ? markRaw(cloneTextureCanvas(texture)) : undefined')) {
  throw new Error('Each map render should pass ECharts-GL a fresh canvas texture instance.');
}
