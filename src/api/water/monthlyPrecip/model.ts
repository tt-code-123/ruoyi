import type { BaseEntity, PageQuery } from '@/api/base';

export interface WaterMonthlyPrecipQuery extends PageQuery {
  stationCode?: string;
  stationName?: string;
  year?: number;
}

export interface WaterMonthlyPrecipVO extends BaseEntity {
  id?: number;
  stationId?: number;
  stationCode?: string;
  stationName?: string;
  year?: number;
  month01?: number;
  month02?: number;
  month03?: number;
  month04?: number;
  month05?: number;
  month06?: number;
  month07?: number;
  month08?: number;
  month09?: number;
  month10?: number;
  month11?: number;
  month12?: number;
  annualTotal?: number;
  remark?: string;
}

export type WaterMonthlyPrecipForm = WaterMonthlyPrecipVO;
