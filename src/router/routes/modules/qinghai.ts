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
  ],
};

export default qinghai;
