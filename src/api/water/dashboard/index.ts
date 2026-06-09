import { defHttp } from '@/utils/http/axios';
import {
  WaterDashboardMap,
  WaterDashboardQuery,
  WaterDivisionMapVO,
  WaterStationMapVO,
} from './model';

enum Api {
  Overview = '/water/dashboard/overview',
  StationMap = '/water/dashboard/map/stations',
  StationDetail = '/water/dashboard/map/stationDetail/',
  RiverSystems = '/water/dashboard/map/riverSystems',
  DivisionMap = '/water/dashboard/map/divisions',
  StationRanking = '/water/dashboard/stationRanking',
  DivisionRanking = '/water/dashboard/divisionRanking',
  BasinDistribution = '/water/dashboard/basinDistribution',
  PrecipTrend = '/water/dashboard/precipTrend',
  PrecipByRegion = '/water/dashboard/precipByRegion',
}

export function waterDashboardOverview() {
  return defHttp.get<WaterDashboardMap>({ url: Api.Overview });
}

export function waterStationMap(params?: WaterDashboardQuery) {
  return defHttp.get<WaterStationMapVO[]>({ url: Api.StationMap, params });
}

export function waterStationDetail(stationCode: string) {
  return defHttp.get<WaterDashboardMap>({ url: `${Api.StationDetail}${stationCode}` });
}

export function waterRiverSystems() {
  return defHttp.get<WaterDashboardMap[]>({ url: Api.RiverSystems });
}

export function waterDivisionMap(params?: WaterDashboardQuery) {
  return defHttp.get<WaterDivisionMapVO[]>({ url: Api.DivisionMap, params });
}

export function waterStationRanking(params?: WaterDashboardQuery) {
  return defHttp.get<WaterDashboardMap[]>({ url: Api.StationRanking, params });
}

export function waterDivisionRanking(params?: WaterDashboardQuery) {
  return defHttp.get<WaterDashboardMap[]>({ url: Api.DivisionRanking, params });
}

export function waterBasinDistribution() {
  return defHttp.get<WaterDashboardMap[]>({ url: Api.BasinDistribution });
}

export function waterPrecipTrend(params: WaterDashboardQuery) {
  return defHttp.get<WaterDashboardMap[]>({ url: Api.PrecipTrend, params });
}

export function waterPrecipByRegion(params?: WaterDashboardQuery) {
  return defHttp.get<WaterDashboardMap[]>({ url: Api.PrecipByRegion, params });
}
