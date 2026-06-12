import { defHttp } from '@/utils/http/axios';
import { ID, IDS } from '@/api/base';
import type {
  WaterMonthlyPrecipForm,
  WaterMonthlyPrecipQuery,
  WaterMonthlyPrecipVO,
} from './model';

enum Api {
  MonthlyPrecip = '/water/monthlyPrecip',
  MonthlyPrecipList = '/water/monthlyPrecip/list',
  MonthlyPrecipImport = '/water/monthlyPrecip/import',
}

export function waterMonthlyPrecipList(params?: WaterMonthlyPrecipQuery) {
  return defHttp.get<WaterMonthlyPrecipVO[]>({ url: Api.MonthlyPrecipList, params });
}

export function waterMonthlyPrecipInfo(id: ID) {
  return defHttp.get<WaterMonthlyPrecipVO>({ url: `${Api.MonthlyPrecip}/${id}` });
}

export function waterMonthlyPrecipAdd(data: WaterMonthlyPrecipForm) {
  return defHttp.postWithMsg<void>({ url: Api.MonthlyPrecip, data });
}

export function waterMonthlyPrecipUpdate(data: WaterMonthlyPrecipForm) {
  return defHttp.putWithMsg<void>({ url: Api.MonthlyPrecip, data });
}

export function waterMonthlyPrecipRemove(ids: ID | IDS) {
  return defHttp.deleteWithMsg<void>({ url: `${Api.MonthlyPrecip}/${ids}` });
}

export function waterMonthlyPrecipImport(file: File | Blob) {
  return defHttp.uploadFile<number>(
    {
      url: Api.MonthlyPrecipImport,
    },
    {
      file,
    },
  );
}
