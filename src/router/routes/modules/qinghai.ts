import type { AppRouteModule } from '@/router/types';

import { LAYOUT } from '@/router/constant';

const qinghai: AppRouteModule = {
  path: '/qinghai',
  name: 'Qinghai',
  component: LAYOUT,
  redirect: '/qinghai/station-map',
  meta: {
    orderNo: 18,
    icon: 'gis:map-poi',
    title: '青海一张图',
  },
  children: [
    {
      path: 'station-map',
      name: 'QinghaiStationMap',
      component: () => import('@/views/qinghai/station-map/index.vue'),
      meta: {
        title: '站点地图',
      },
    },
    {
      path: 'station-data',
      name: 'QinghaiStationData',
      component: () => import('@/views/qinghai/station-data/index.vue'),
      meta: {
        title: '基础数据',
      },
    },
  ],
};

export default qinghai;
