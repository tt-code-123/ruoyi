import { defHttp } from '@/utils/http/axios';
import type {
  PrecipitationCalcFormulaQuery,
  PrecipitationCalcFormulaVO,
  SurfaceWaterCalcFormulaQuery,
  SurfaceWaterCalcFormulaVO,
} from './model';

enum Api {
  PrecipitationList = '/water/calc-formula/precipitation/list',
  PrecipitationYears = '/water/calc-formula/precipitation/years',
  SurfaceWaterList = '/water/calc-formula/surface-water/list',
  SurfaceWaterLevel1Regions = '/water/calc-formula/surface-water/level1-regions',
  SurfaceWaterLevel3Regions = '/water/calc-formula/surface-water/level3-regions',
}

export function waterPrecipitationCalcFormulaList(params?: PrecipitationCalcFormulaQuery) {
  return defHttp.get<PrecipitationCalcFormulaVO[]>({ url: Api.PrecipitationList, params });
}

export function waterPrecipitationCalcFormulaYears() {
  return defHttp.get<number[]>({ url: Api.PrecipitationYears });
}

export function waterSurfaceWaterCalcFormulaList(params?: SurfaceWaterCalcFormulaQuery) {
  return defHttp.get<SurfaceWaterCalcFormulaVO[]>({ url: Api.SurfaceWaterList, params });
}

export function waterSurfaceWaterLevel1Regions() {
  return defHttp.get<string[]>({ url: Api.SurfaceWaterLevel1Regions });
}

export function waterSurfaceWaterLevel3Regions(level1Region: string) {
  return defHttp.get<string[]>({
    url: Api.SurfaceWaterLevel3Regions,
    params: { level1Region },
  });
}
