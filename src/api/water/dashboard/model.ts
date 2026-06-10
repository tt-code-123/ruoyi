export interface WaterDashboardQuery {
  stationType?: string;
  riverSystem?: string;
  waterRegion3?: string;
  level1Region?: string;
  level2Region?: string;
  level3Region?: string;
  stationCode?: string;
  startYear?: number;
  endYear?: number;
  year?: number;
  limit?: number;
}

export interface WaterStationCountByTypeVO {
  type?: string;
  count?: number;
  ratio?: number;
}

export interface WaterChartRatioVO {
  name?: string;
  value?: number;
  ratio?: number;
}

export interface WaterCityStationCountVO {
  city?: string;
  count?: number;
}

export interface WaterStationMapVO {
  stationId?: number;
  stationCode?: string;
  stationName?: string;
  stationType?: string;
  riverSystem?: string;
  riverName?: string;
  waterRegion3?: string;
  city?: string;
  county?: string;
  drainageArea?: number;
  longitude?: number;
  latitude?: number;
  elevation?: number;
  establishYear?: string;
  avgRunoff5616?: number;
  avgRunoffDepth?: number;
  avgPrecip5616?: number;
  stationBelong?: string;
  latestRunoff?: number;
  latestPrecip?: number;
}

export interface WaterDivisionMapVO {
  divId?: number;
  divCode?: string;
  level1Region?: string;
  level2Region?: string;
  level3Region?: string;
  city?: string;
  county?: string;
  totalArea?: number;
  surfaceResource?: number;
  runoffDepth?: number;
  groundwaterResource?: number;
  precipitation?: number;
  centerLng?: number;
  centerLat?: number;
}

export type WaterDashboardMap = Record<string, any>;
