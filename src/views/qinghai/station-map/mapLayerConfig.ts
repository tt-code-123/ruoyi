export type BaseMapMode = 'vector' | 'imagery';

export interface MapLayerState {
  baseMap: BaseMapMode;
  showBoundary: boolean;
  showLabels: boolean;
  showStations: boolean;
}

export interface BaseMapOption {
  label: string;
  topColor: string;
  sideColor: string;
  borderColor: string;
  shading: 'lambert' | 'realistic';
}

export const BASE_MAP_OPTIONS: Record<BaseMapMode, BaseMapOption> = {
  vector: {
    label: '矢量底图',
    topColor: '#0b3b74',
    sideColor: '#031327',
    borderColor: '#8bb8ff',
    shading: 'lambert',
  },
  imagery: {
    label: '影像底图',
    topColor: '#17424d',
    sideColor: '#071b22',
    borderColor: '#7fd5ff',
    shading: 'realistic',
  },
};

export const DEFAULT_MAP_LAYER_STATE: MapLayerState = {
  baseMap: 'vector',
  showBoundary: true,
  showLabels: true,
  showStations: true,
};

export function getBaseMapOption(baseMap: BaseMapMode) {
  return BASE_MAP_OPTIONS[baseMap] || BASE_MAP_OPTIONS.vector;
}
