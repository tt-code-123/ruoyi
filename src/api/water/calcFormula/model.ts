import type { PageQuery } from '@/api/base';

export interface PrecipitationCalcFormulaQuery extends PageQuery {
  year?: number | string;
}

export interface PrecipitationCalcFormulaVO {
  id?: number;
  divCode?: string;
  stationCode?: string;
  stationName?: string;
  pointId?: number;
  year?: number;
  elevation?: number;
  longitude?: number;
  latitude?: number;
  precipDepth?: number;
  refStation?: string;
  refStationElevation?: number;
  avgPrecip5624?: number;
  ratio?: number;
  formula?: string;
  result?: number;
}

export interface SurfaceWaterCalcFormulaQuery extends PageQuery {
  level1Region?: string;
  level3Region?: string;
  city?: string;
}

export interface SurfaceWaterCalcFormulaVO {
  id?: number;
  divCode?: string;
  divName?: string;
  level1Region?: string;
  level2Region?: string;
  level3Region?: string;
  city?: string;
  county?: string;
  totalArea?: number;
  stationName?: string;
  elevation?: number;
  longitude?: number;
  latitude?: number;
  precipDepth?: number;
  refStation?: string;
  refStationElevation?: number;
  avgPrecip5624?: number;
  ratio?: number;
  formula?: string;
  result?: number;
}
