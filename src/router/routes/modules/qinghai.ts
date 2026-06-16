import type { AppRouteModule } from '@/router/types';

import { QINGHAI_SCREEN_LAYOUT } from '@/router/constant';

const qinghai: AppRouteModule = {
  path: '/qinghai',
  name: 'Qinghai',
  component: QINGHAI_SCREEN_LAYOUT,
  redirect: '/qinghai/station-map',
  meta: {
    orderNo: 18,
    icon: 'gis:map-poi',
    title: '青海水文',
    ignoreAuth: true,
    hideMenu: true,
  },
  children: [
    {
      path: 'station-map',
      name: 'QinghaiStationMap',
      component: () => import('@/views/qinghai/station-map/index.vue'),
      meta: {
        title: '站点地图',
        ignoreAuth: true,
        hideMenu: true,
      },
    },
    {
      path: 'station-data',
      name: 'QinghaiStationData',
      component: () => import('@/views/qinghai/station-data/index.vue'),
      meta: {
        title: '站点基础信息',
        ignoreAuth: true,
        hideMenu: true,
      },
    },
    {
      path: 'monthly-precip',
      name: 'QinghaiMonthlyPrecip',
      component: () => import('@/views/qinghai/monthly-precip/index.vue'),
      meta: {
        title: '站点数据',
        ignoreAuth: true,
        hideMenu: true,
      },
    },
    {
      path: 'calc-formula',
      name: 'QinghaiCalcFormula',
      component: () => import('@/views/qinghai/calc-formula/index.vue'),
      meta: {
        title: '计算公式管理',
        ignoreAuth: true,
        hideMenu: true,
      },
    },
    {
      path: 'calc-formula/precipitation',
      name: 'QinghaiPrecipitationCalcFormula',
      component: () => import('@/views/qinghai/calc-formula/precipitation.vue'),
      meta: {
        title: '降水计算公式',
        ignoreAuth: true,
        hideMenu: true,
      },
    },
    {
      path: 'calc-formula/surface-water',
      name: 'QinghaiSurfaceWaterCalcFormula',
      component: () => import('@/views/qinghai/calc-formula/surface-water.vue'),
      meta: {
        title: '地表水计算公式',
        ignoreAuth: true,
        hideMenu: true,
      },
    },
  ],
};

export default qinghai;
