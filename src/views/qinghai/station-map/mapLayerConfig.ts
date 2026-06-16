export type BaseMapMode = 'vector' | 'imagery';

export interface MapLayerState {
  baseMap: BaseMapMode;
  showBoundary: boolean;
  showLabels: boolean;
  showStations: boolean;
}

export interface BaseMapOption {
  label: string;
  surfaceColor: string;
  borderColor: string;
  shading: 'lambert' | 'realistic';
  surfaceOpacity: number;
}

export interface GeoTileBounds {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

export const BASE_MAP_OPTIONS: Record<BaseMapMode, BaseMapOption> = {
  vector: {
    label: '矢量地图',
    surfaceColor: '#ffffff',
    borderColor: '#8bb8ff',
    shading: 'lambert',
    surfaceOpacity: 1,
  },
  imagery: {
    label: '影像地图',
    surfaceColor: '#ffffff',
    borderColor: '#8fe6ff',
    shading: 'realistic',
    surfaceOpacity: 1,
  },
};

export const DEFAULT_MAP_LAYER_STATE: MapLayerState = {
  baseMap: 'vector',
  showBoundary: true,
  showLabels: true,
  showStations: true,
};

const LOCAL_TEXTURE_WIDTH = 1024;
const LOCAL_TEXTURE_HEIGHT = 768;
const localTextureCache = new Map<string, HTMLCanvasElement>();

export function getBaseMapOption(baseMap: BaseMapMode) {
  return BASE_MAP_OPTIONS[baseMap] || BASE_MAP_OPTIONS.vector;
}

export async function buildMapTexture(baseMap: BaseMapMode, bounds: GeoTileBounds) {
  if (!isValidBounds(bounds) || typeof document === 'undefined') {
    return null;
  }

  const cacheKey = getTextureCacheKey(baseMap, bounds, 0);
  const cachedTexture = localTextureCache.get(cacheKey);
  if (cachedTexture) {
    return cachedTexture;
  }

  const canvas = document.createElement('canvas');
  canvas.width = LOCAL_TEXTURE_WIDTH;
  canvas.height = LOCAL_TEXTURE_HEIGHT;

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  if (baseMap === 'imagery') {
    drawImageryTexture(context, canvas.width, canvas.height);
  } else {
    drawVectorTexture(context, canvas.width, canvas.height);
  }

  localTextureCache.set(cacheKey, canvas);
  return canvas;
}

function drawVectorTexture(context: CanvasRenderingContext2D, width: number, height: number) {
  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, '#eaf5ff');
  background.addColorStop(0.48, '#cfe7ff');
  background.addColorStop(1, '#f6fbff');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = 0.22;
  context.strokeStyle = '#5aa6d6';
  context.lineWidth = 1;
  for (let x = 64; x < width; x += 96) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x - 120, height);
    context.stroke();
  }
  for (let y = 52; y < height; y += 88) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y + 70);
    context.stroke();
  }
  context.restore();

  drawRiverPath(context, width, height, '#2f8fd3', 0.68, 8);
  drawRiverPath(context, width, height, '#62b8ef', 0.48, 3);
  drawTextureLabels(context, width, height, '#1e5c91');
}

function drawImageryTexture(context: CanvasRenderingContext2D, width: number, height: number) {
  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, '#31523d');
  background.addColorStop(0.34, '#66744b');
  background.addColorStop(0.68, '#766f56');
  background.addColorStop(1, '#24475d');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  drawTerrainPatch(context, width * 0.2, height * 0.2, width * 0.42, '#95a36a', 0.28);
  drawTerrainPatch(context, width * 0.68, height * 0.34, width * 0.5, '#283f2f', 0.24);
  drawTerrainPatch(context, width * 0.45, height * 0.7, width * 0.54, '#846f4c', 0.26);
  drawTerrainPatch(context, width * 0.82, height * 0.78, width * 0.32, '#294f68', 0.3);

  drawRiverPath(context, width, height, '#7cc7ee', 0.46, 7);
  drawRiverPath(context, width, height, '#cff7ff', 0.28, 2);
  drawTextureLabels(context, width, height, 'rgba(235, 247, 255, 0.74)');
}

function drawTerrainPatch(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha: number,
) {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = gradient;
  context.fillRect(0, 0, LOCAL_TEXTURE_WIDTH, LOCAL_TEXTURE_HEIGHT);
  context.restore();
}

function drawRiverPath(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  alpha: number,
  lineWidth: number,
) {
  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(width * 0.06, height * 0.42);
  context.bezierCurveTo(
    width * 0.24,
    height * 0.28,
    width * 0.36,
    height * 0.52,
    width * 0.52,
    height * 0.42,
  );
  context.bezierCurveTo(
    width * 0.68,
    height * 0.31,
    width * 0.78,
    height * 0.52,
    width * 0.95,
    height * 0.4,
  );
  context.stroke();

  context.beginPath();
  context.moveTo(width * 0.22, height * 0.74);
  context.bezierCurveTo(
    width * 0.36,
    height * 0.62,
    width * 0.42,
    height * 0.68,
    width * 0.52,
    height * 0.55,
  );
  context.bezierCurveTo(
    width * 0.6,
    height * 0.46,
    width * 0.65,
    height * 0.5,
    width * 0.74,
    height * 0.34,
  );
  context.stroke();
  context.restore();
}

function drawTextureLabels(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
) {
  context.save();
  context.fillStyle = color;
  context.font = '600 28px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.globalAlpha = 0.58;
  context.fillText('QINGHAI', width * 0.5, height * 0.5);
  context.font = '500 18px sans-serif';
  context.globalAlpha = 0.42;
  context.fillText('WATER STATIONS', width * 0.5, height * 0.56);
  context.restore();
}

function getTextureCacheKey(baseMap: BaseMapMode, bounds: GeoTileBounds, zoom: number) {
  return [
    baseMap,
    zoom,
    bounds.minLng.toFixed(6),
    bounds.maxLng.toFixed(6),
    bounds.minLat.toFixed(6),
    bounds.maxLat.toFixed(6),
  ].join(':');
}

function isValidBounds(bounds: GeoTileBounds) {
  return (
    Number.isFinite(bounds.minLng) &&
    Number.isFinite(bounds.maxLng) &&
    Number.isFinite(bounds.minLat) &&
    Number.isFinite(bounds.maxLat) &&
    bounds.maxLng > bounds.minLng &&
    bounds.maxLat > bounds.minLat
  );
}
