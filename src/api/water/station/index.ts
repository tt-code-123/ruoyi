import { defHttp } from '@/utils/http/axios';
import { ID, IDS, commonExport } from '@/api/base';
import type { WaterStationForm, WaterStationQuery, WaterStationVO } from './model';

enum Api {
  Station = '/water/station',
  StationList = '/water/station/list',
  StationImportAll = '/water/station/importAll',
  StationExport = '/water/station/export',
}

export function waterStationList(params?: WaterStationQuery) {
  return defHttp.get<WaterStationVO[]>({ url: Api.StationList, params });
}

export function waterStationInfo(stationId: ID) {
  return defHttp.get<WaterStationVO>({ url: `${Api.Station}/${stationId}` });
}

export function waterStationAdd(data: WaterStationForm) {
  return defHttp.postWithMsg<void>({ url: Api.Station, data });
}

export function waterStationUpdate(data: WaterStationForm) {
  return defHttp.putWithMsg<void>({ url: Api.Station, data });
}

export function waterStationRemove(ids: ID | IDS) {
  return defHttp.deleteWithMsg<void>({ url: `${Api.Station}/${ids}` });
}

export function waterStationImportAll(excelDir = 'import-excel') {
  return defHttp.postWithMsg<Record<string, number>>({
    url: Api.StationImportAll,
    params: { excelDir },
  });
}

export function waterStationExport(params?: WaterStationQuery) {
  return commonExport(Api.StationExport, params ?? {});
}
