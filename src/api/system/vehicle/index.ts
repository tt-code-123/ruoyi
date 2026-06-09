import { defHttp } from '@/utils/http/axios';
import { ID, IDS, commonExport } from '@/api/base';
import { VehicleVO, VehicleForm, VehicleQuery } from './model';

/**
 * 查询车辆信息列表
 * @param params
 * @returns
 */
export function vehicleList(params?: VehicleQuery) {
  return defHttp.get<VehicleVO[]>({ url: '/system/vehicle/list', params });
}

/**
 * 导出车辆信息列表
 * @param params
 * @returns
 */
export function vehicleExport(params?: VehicleQuery) {
  return commonExport('/system/vehicle/export', params ?? {});
}

/**
 * 查询车辆信息详细
 * @param id id
 * @returns
 */
export function vehicleInfo(id: ID) {
  return defHttp.get<VehicleVO>({ url: '/system/vehicle/' + id });
}

/**
 * 新增车辆信息
 * @param data
 * @returns
 */
export function vehicleAdd(data: VehicleForm) {
  return defHttp.postWithMsg<void>({ url: '/system/vehicle', data });
}

/**
 * 更新车辆信息
 * @param data
 * @returns
 */
export function vehicleUpdate(data: VehicleForm) {
  return defHttp.putWithMsg<void>({ url: '/system/vehicle', data });
}

/**
 * 删除车辆信息
 * @param id id
 * @returns
 */
export function vehicleRemove(id: ID | IDS) {
  return defHttp.deleteWithMsg<void>({ url: '/system/vehicle/' + id });
}
