import { readFileSync } from 'node:fs';

const source = readFileSync('src/views/qinghai/station-map/index.vue', 'utf8');

if (source.includes('站点类型图例')) {
  throw new Error('Station type legend should be removed from the map side panel.');
}

if (!/class="bottom-stat"[\s\S]*@click="toggleStationType\(item\.type\)"/.test(source)) {
  throw new Error('Bottom station stats should toggle station type visibility.');
}

if (!source.includes("'bottom-stat-inactive': !isStationTypeVisible(item.type)")) {
  throw new Error('Bottom station stats should expose inactive state for hidden station types.');
}

if (!source.includes("'--station-type-color': item.color")) {
  throw new Error('Bottom station stats should inherit station type colors.');
}

if (!source.includes('color: getStationColor(')) {
  throw new Error('Bottom station stat data should include each station type color.');
}

if (!/\.map-stage\s*\{[\s\S]*left:\s*16px;/.test(source)) {
  throw new Error('Map stage should shift left into the removed legend area.');
}
