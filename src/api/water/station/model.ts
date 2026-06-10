import type { BaseEntity, PageQuery } from '@/api/base';

export interface WaterStationQuery extends PageQuery {
  stationName?: string;
  stationCode?: string;
  stationType?: string;
  riverSystem?: string;
  waterRegion3?: string;
  city?: string;
  county?: string;
  stationBelong?: string;
}

export interface WaterStationVO extends BaseEntity {
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
  dataSeries?: number;
  avgRunoff5616?: number;
  avgRunoffDepth?: number;
  avgPrecip5616?: number;
  avgPrecip5624?: number;
  stationBelong?: string;
  remark?: string;
}

export type WaterStationForm = WaterStationVO;
