<template>
  <PageWrapper contentFullHeight>
    <div class="water-screen">
      <header class="screen-header">
        <div class="header-line"></div>
        <div class="header-title">
          <p>QINGHAI WATER RESOURCE DIGITAL MAP</p>
          <h1>青海省水资源一张图</h1>
        </div>
        <div class="header-tools">
          <span>{{ currentTime }}</span>
          <a-button size="small" ghost :loading="loading" @click="loadDashboard">刷新</a-button>
        </div>
      </header>

      <main class="map-stage">
        <div ref="mapChartRef" class="map-chart"></div>
      </main>

      <aside class="screen-panel left-panel">
        <section class="panel-section">
          <div class="panel-title">站点类型图例</div>
          <div class="legend-list">
            <div
              v-for="item in stationLegend"
              :key="item.type"
              class="legend-item"
              :class="{ 'legend-item-inactive': !isStationTypeVisible(item.type) }"
              role="button"
              tabindex="0"
              @click="toggleStationType(item.type)"
              @keydown.enter.prevent="toggleStationType(item.type)"
              @keydown.space.prevent="toggleStationType(item.type)"
            >
              <i :style="{ background: item.color }"></i>
              <span>{{ item.type }}</span>
              <strong>{{ item.count }}</strong>
            </div>
          </div>
        </section>
      </aside>

      <aside class="screen-panel right-panel">
        <section class="panel-section">
          <div class="panel-title">流域站点占比</div>
          <div ref="basinRatioChartRef" class="chart-box"></div>
        </section>

        <section class="panel-section">
          <div class="panel-title">行政区站点数量统计</div>
          <div ref="divisionChartRef" class="chart-box"></div>
        </section>
      </aside>

      <footer class="bottom-panel">
        <div v-for="item in bottomStationStats" :key="item.type" class="bottom-stat">
          <Icon class="bottom-stat-icon" :icon="item.icon" :size="28" />
          <div>
            <span>{{ item.label }}</span>
            <strong>{{ item.count }}</strong>
          </div>
        </div>
      </footer>

      <transition name="detail-panel">
        <article v-if="selectedStation" class="station-detail">
          <button type="button" class="detail-close" @click="closeStationDetail">×</button>
          <span
            class="station-badge"
            :style="{ background: getStationColor(selectedStation.stationType) }"
          >
            {{ selectedStation.stationType || '站点' }}
          </span>
          <h2>{{ selectedStation.stationName || '-' }}</h2>
          <p
            >{{ selectedStation.riverSystem || '-' }} / {{ selectedStation.waterRegion3 || '-' }}</p
          >
          <dl>
            <div>
              <dt>测站编码</dt>
              <dd>{{ selectedStation.stationCode || '-' }}</dd>
            </div>
            <div>
              <dt>地区</dt>
              <dd>{{ selectedStation.city || '-' }} {{ selectedStation.county || '' }}</dd>
            </div>
            <div>
              <dt>经纬度</dt>
              <dd>{{ formatCoordinate(selectedStation.longitude, selectedStation.latitude) }}</dd>
            </div>
            <div>
              <dt>高程</dt>
              <dd>{{ formatNumber(selectedStation.elevation) }} m</dd>
            </div>
            <div>
              <dt>年均径流量</dt>
              <dd>{{ formatNumber(selectedStation.avgRunoff5616) }} 亿m³</dd>
            </div>
            <div>
              <dt>年均降水量</dt>
              <dd>{{ formatNumber(selectedStation.avgPrecip5616) }} mm</dd>
            </div>
          </dl>
          <div v-if="trendRows.length" ref="detailTrendChartRef" class="detail-chart"></div>
          <div v-else class="detail-extra">{{
            detailLoading ? '详情加载中...' : detailSummary
          }}</div>
        </article>
      </transition>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import type { Ref } from 'vue';
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import Icon from '@/components/Icon/Icon.vue';
  import { PageWrapper } from '@/components/Page';
  import { useECharts } from '@/hooks/web/useECharts';
  import {
    waterDivisionMap,
    waterStationCountByCity,
    waterStationCountByDivision,
    waterStationDetail,
    waterStationMap,
    waterStationTypeRatio,
  } from '@/api/water/dashboard';
  import type {
    WaterChartRatioVO,
    WaterCityStationCountVO,
    WaterDashboardMap,
    WaterDivisionMapVO,
    WaterStationMapVO,
  } from '@/api/water/dashboard/model';
  import * as qinghaiGeoJson from './geo/qinghai.json';

  defineOptions({ name: 'QinghaiStationMap' });

  const QINGHAI_MAP_NAME = 'qinghai-water';
  const QINGHAI_CENTER: [number, number] = [96.04, 35.72];
  const SELECTED_STATION_SERIES_ID = 'selected-station-effect';
  const MAP_AREA_COLOR = '#073b73';
  const MAP_EMPHASIS_COLOR = '#0f5fa8';
  const MAP_BORDER_COLOR = '#93c5fd';
  const STATION_COLORS: Record<string, string> = {
    水文: '#38bdf8',
    气象: '#f59e0b',
    雨量: '#22c55e',
    中小河流: '#a78bfa',
  };

  const FALLBACK_STATIONS: WaterStationMapVO[] = [
    {
      stationId: 1,
      stationCode: '40100100',
      stationName: '黄河沿',
      stationType: '水文',
      riverSystem: '黄河干流',
      waterRegion3: '河源至玛曲',
      city: '果洛州',
      county: '玛多县',
      longitude: 98.1667,
      latitude: 34.8833,
      elevation: 4211,
      avgRunoff5616: 7.225,
      avgPrecip5616: 318.8,
    },
    {
      stationId: 2,
      stationCode: '40100300',
      stationName: '唐乃亥',
      stationType: '水文',
      riverSystem: '黄河干流',
      waterRegion3: '玛曲至龙羊峡',
      city: '海南州',
      county: '兴海县',
      longitude: 100.1538,
      latitude: 35.4989,
      elevation: 2665,
      avgRunoff5616: 199.6,
      avgPrecip5616: 406.2,
    },
    {
      stationId: 3,
      stationCode: 'QHLAKE01',
      stationName: '青海湖',
      stationType: '气象',
      riverSystem: '青海湖水系',
      waterRegion3: '青海湖流域',
      city: '海南州',
      county: '共和县',
      longitude: 100.2452,
      latitude: 36.8964,
      elevation: 3196,
      avgPrecip5616: 360.5,
    },
    {
      stationId: 4,
      stationCode: 'CDM01',
      stationName: '柴达木盆地东部',
      stationType: '雨量',
      riverSystem: '西北诸河',
      waterRegion3: '柴达木盆地东部',
      city: '海西州',
      county: '德令哈市',
      longitude: 97.3608,
      latitude: 37.3694,
      elevation: 2980,
      avgPrecip5616: 168.3,
    },
  ];

  const mapChartRef = ref<HTMLDivElement | null>(null);
  const basinRatioChartRef = ref<HTMLDivElement | null>(null);
  const divisionChartRef = ref<HTMLDivElement | null>(null);
  const detailTrendChartRef = ref<HTMLDivElement | null>(null);
  const {
    setOptions: setMapOptions,
    echarts,
    getInstance: getMapInstance,
  } = useECharts(mapChartRef as Ref<HTMLDivElement>, 'dark');
  const { setOptions: setBasinRatioOptions } = useECharts(
    basinRatioChartRef as Ref<HTMLDivElement>,
    'dark',
  );
  const { setOptions: setDivisionOptions } = useECharts(
    divisionChartRef as Ref<HTMLDivElement>,
    'dark',
  );
  const { setOptions: setDetailTrendOptions } = useECharts(
    detailTrendChartRef as Ref<HTMLDivElement>,
    'dark',
  );

  const currentTime = ref('');
  const loading = ref(false);
  const detailLoading = ref(false);
  const stationTypeRatio = ref<WaterChartRatioVO[]>([]);
  const stationCountByDivision = ref<WaterChartRatioVO[]>([]);
  const stationCountByCity = ref<WaterCityStationCountVO[]>([]);
  const stationMapData = ref<WaterStationMapVO[]>(FALLBACK_STATIONS);
  const hiddenStationTypes = ref<string[]>([]);
  const divisionMapData = ref<WaterDivisionMapVO[]>([]);
  const selectedStation = ref<WaterStationMapVO | null>(null);
  const selectedStationDetail = ref<WaterDashboardMap | null>(null);
  const trendRows = ref<WaterDashboardMap[]>([]);

  let timer: number | undefined;

  const allValidStations = computed(() =>
    stationMapData.value.filter((station) => isValidCoordinate(station)),
  );

  const displayStations = computed(() =>
    allValidStations.value.filter(
      (station) => !station.stationType || isStationTypeVisible(station.stationType),
    ),
  );

  const stationLegend = computed(() => {
    const types = Array.from(
      new Set([
        ...Object.keys(STATION_COLORS),
        ...allValidStations.value
          .map((station) => station.stationType)
          .filter((type): type is string => Boolean(type)),
      ]),
    );
    return types.map((type) => ({
      type,
      color: getStationColor(type),
      count: allValidStations.value.filter((station) => station.stationType === type).length,
    }));
  });

  const bottomStationStats = computed(() => [
    {
      label: '气象站点',
      type: '气象',
      icon: 'mdi:weather-partly-cloudy',
      count: countVisibleStationsByType('气象'),
    },
    {
      label: '水文站点',
      type: '水文',
      icon: 'mdi:waves-arrow-up',
      count: countVisibleStationsByType('水文'),
    },
    {
      label: '中小河流站点',
      type: '中小河流',
      icon: 'mdi:waves',
      count: countVisibleStationsByType('中小河流'),
    },
    {
      label: '雨量站点',
      type: '雨量',
      icon: 'mdi:weather-pouring',
      count: countVisibleStationsByType('雨量'),
    },
  ]);

  const detailSummary = computed(() => {
    if (!selectedStationDetail.value) {
      return '暂无更多详情数据';
    }
    const keys = Object.keys(selectedStationDetail.value);
    return keys.length ? `已加载详情字段：${keys.slice(0, 6).join('、')}` : '暂无更多详情数据';
  });

  onMounted(async () => {
    echarts.registerMap(QINGHAI_MAP_NAME, qinghaiGeoJson as any);
    bindMapClick();
    refreshTime();
    timer = window.setInterval(refreshTime, 1000 * 30);
    await loadDashboard();
  });

  onBeforeUnmount(() => {
    if (timer) {
      window.clearInterval(timer);
    }
  });

  watch(displayStations, () => {
    if (
      selectedStation.value &&
      !displayStations.value.some(
        (station) => station.stationCode === selectedStation.value?.stationCode,
      )
    ) {
      closeStationDetail();
    }
    renderMapChart();
  });

  async function loadDashboard() {
    loading.value = true;
    try {
      const [
        typeRatioResult,
        divisionCountResult,
        cityCountResult,
        stationMapResult,
        divisionMapResult,
      ] = await Promise.allSettled([
        waterStationTypeRatio(),
        waterStationCountByDivision(),
        waterStationCountByCity(),
        waterStationMap(),
        waterDivisionMap(),
      ]);

      stationTypeRatio.value = getSettledValue(typeRatioResult, []);
      stationCountByDivision.value = getSettledValue(divisionCountResult, []);
      stationCountByCity.value = getSettledValue(cityCountResult, []);
      stationMapData.value = getSettledValue(stationMapResult, FALLBACK_STATIONS);
      divisionMapData.value = getSettledValue(divisionMapResult, []);
      renderMapChart();
      renderBasinRatioChart();
      renderDivisionChart();
    } finally {
      loading.value = false;
    }
  }

  function bindMapClick() {
    nextTick(() => {
      const instance = getMapInstance();
      instance?.off('click');
      instance?.on('click', (params: any) => {
        if (
          params?.componentSubType === 'scatter' ||
          params?.componentSubType === 'effectScatter'
        ) {
          selectStation(params.data.raw);
        }
      });
    });
  }

  function renderMapChart() {
    setMapOptions({
      tooltip: {
        trigger: 'item',
        formatter(params: any) {
          const raw = params.data?.raw;
          if (!raw) {
            return `${params.name}<br/>站点 ${displayStations.value.length} 个`;
          }
          return [
            `<strong>${raw.stationName || '-'}</strong>`,
            `站别：${raw.stationType || '-'}`,
            `地区：${raw.city || '-'} ${raw.county || ''}`,
            `水系：${raw.riverSystem || '-'}`,
          ].join('<br/>');
        },
      },
      geo: createMapGeoOption(),
      series: [
        {
          id: 'station-scatter',
          type: 'scatter',
          coordinateSystem: 'geo',
          symbolSize: 9,
          zlevel: 3,
          data: displayStations.value.map(toScatterData),
        },
        {
          id: SELECTED_STATION_SERIES_ID,
          type: 'effectScatter',
          coordinateSystem: 'geo',
          symbolSize: 13,
          rippleEffect: { brushType: 'stroke', scale: 3 },
          zlevel: 4,
          data: getSelectedStationData(),
        },
      ],
    });
    bindMapClick();
  }

  function createMapGeoOption() {
    return {
      map: QINGHAI_MAP_NAME,
      roam: true,
      zoom: 1.18,
      center: QINGHAI_CENTER,
      scaleLimit: { min: 0.9, max: 6 },
      itemStyle: {
        areaColor: MAP_AREA_COLOR,
        borderColor: MAP_BORDER_COLOR,
        borderWidth: 1.5,
        shadowBlur: 22,
        shadowColor: 'rgba(35, 128, 205, 0.34)',
      },
      emphasis: {
        itemStyle: { areaColor: MAP_EMPHASIS_COLOR },
        label: { color: '#fff' },
      },
      label: {
        show: true,
        color: '#dff7ff',
        fontWeight: 700,
      },
    };
  }

  function renderBasinRatioChart() {
    const rows = stationTypeRatio.value.length ? stationTypeRatio.value : buildStationTypeRatio();

    setBasinRatioOptions({
      color: Object.values(STATION_COLORS),
      tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 个 ({d}%)' },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { color: '#b7d9e8' },
      },
      series: [
        {
          type: 'pie',
          radius: ['48%', '68%'],
          center: ['50%', '44%'],
          label: {
            color: '#dff7ff',
            formatter: '{b}\n{d}%',
          },
          data: rows.map((item) => ({
            name: item.name || '站点',
            value: Number(item.value || 0),
          })),
        },
      ],
    });
  }

  function renderDivisionChart() {
    const rows = (
      stationCountByDivision.value.length
        ? stationCountByDivision.value
        : stationCountByCity.value.map((item) => ({ name: item.city, value: item.count }))
    ).slice(0, 12);

    setDivisionOptions({
      color: ['#38bdf8'],
      tooltip: { trigger: 'axis' },
      grid: { left: 74, right: 22, top: 20, bottom: 28 },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(148, 216, 232, 0.14)' } },
        axisLabel: { color: '#a9d5e7' },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: rows.map((item) => item.name || '未知'),
        axisLabel: { color: '#d7f7ff', width: 70, overflow: 'truncate' },
      },
      series: [
        {
          type: 'bar',
          barWidth: 12,
          data: rows.map((item) => Number(item.value || 0)),
          itemStyle: {
            borderRadius: 6,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#0ea5e9' },
                { offset: 1, color: '#93c5fd' },
              ],
            },
          },
        },
      ],
    });
  }

  async function selectStation(station: WaterStationMapVO) {
    selectedStation.value = station;
    selectedStationDetail.value = null;
    trendRows.value = [];
    updateSelectedStationEffect();
    if (!station.stationCode) {
      return;
    }
    detailLoading.value = true;
    try {
      const detail = await waterStationDetail(station.stationCode);
      selectedStationDetail.value = detail;
      trendRows.value = pickTrendRows(detail);
      await nextTick();
      renderDetailTrendChart();
    } finally {
      detailLoading.value = false;
    }
  }

  function renderDetailTrendChart() {
    if (!trendRows.value.length) {
      return;
    }
    setDetailTrendOptions({
      color: ['#93c5fd', '#60a5fa'],
      tooltip: { trigger: 'axis' },
      grid: { left: 36, right: 16, top: 18, bottom: 24 },
      xAxis: {
        type: 'category',
        data: trendRows.value.map((item) => pickText(item, ['year', 'name', 'label'])),
        axisLabel: { color: '#a9d5e7' },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(148, 216, 232, 0.14)' } },
        axisLabel: { color: '#a9d5e7' },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          name: '趋势',
          data: trendRows.value.map((item) =>
            pickNumber(item, ['runoff', 'flow', 'precipitation', 'precip', 'value']),
          ),
        },
      ],
    });
  }

  function closeStationDetail() {
    selectedStation.value = null;
    selectedStationDetail.value = null;
    trendRows.value = [];
    updateSelectedStationEffect();
  }

  function toggleStationType(type: string) {
    hiddenStationTypes.value = isStationTypeVisible(type)
      ? [...hiddenStationTypes.value, type]
      : hiddenStationTypes.value.filter((item) => item !== type);
  }

  function isStationTypeVisible(type: string) {
    return !hiddenStationTypes.value.includes(type);
  }

  function countVisibleStationsByType(type: string) {
    return displayStations.value.filter((station) => station.stationType === type).length;
  }

  function updateSelectedStationEffect() {
    getMapInstance()?.setOption({
      series: [
        {
          id: SELECTED_STATION_SERIES_ID,
          data: getSelectedStationData(),
        },
      ],
    });
  }

  function getSelectedStationData() {
    return selectedStation.value ? [toScatterData(selectedStation.value)] : [];
  }

  function toScatterData(station: WaterStationMapVO) {
    const color = getStationColor(station.stationType);
    return {
      name: station.stationName,
      value: [Number(station.longitude), Number(station.latitude), 1],
      raw: station,
      itemStyle: {
        color,
        borderColor: '#fff',
        borderWidth: 1.5,
        shadowBlur: 12,
        shadowColor: color,
      },
    };
  }

  function buildStationTypeRatio() {
    const total = displayStations.value.length || 1;
    return stationLegend.value.map((item) => ({
      name: item.type,
      value: item.count,
      ratio: Number(((item.count / total) * 100).toFixed(2)),
    }));
  }

  function pickTrendRows(detail: WaterDashboardMap | null) {
    if (!detail) {
      return [];
    }
    const rows = [
      detail.trend,
      detail.trends,
      detail.recentTrend,
      detail.recentTrends,
      detail.flowTrend,
      detail.precipTrend,
      detail.yearTrend,
    ].find((item) => Array.isArray(item));
    return Array.isArray(rows) ? rows.slice(-5) : [];
  }

  function getSettledValue<T>(result: PromiseSettledResult<T>, fallback: T) {
    return result.status === 'fulfilled' && result.value ? result.value : fallback;
  }

  function pickText(item: WaterDashboardMap, keys: string[]) {
    for (const key of keys) {
      const value = item?.[key];
      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
    }
    return '-';
  }

  function pickNumber(item: WaterDashboardMap, keys: string[]) {
    for (const key of keys) {
      const value = Number(item?.[key]);
      if (Number.isFinite(value)) {
        return value;
      }
    }
    return 0;
  }

  function isValidCoordinate(station: WaterStationMapVO) {
    return Number.isFinite(Number(station.longitude)) && Number.isFinite(Number(station.latitude));
  }

  function getStationColor(type?: string) {
    return STATION_COLORS[type || ''] || '#f472b6';
  }

  function formatNumber(value?: number) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
      return '-';
    }
    return Number.isInteger(numberValue) ? numberValue.toLocaleString() : numberValue.toFixed(2);
  }

  function formatCoordinate(longitude?: number, latitude?: number) {
    if (!Number.isFinite(Number(longitude)) || !Number.isFinite(Number(latitude))) {
      return '-';
    }
    return `${Number(longitude).toFixed(4)}, ${Number(latitude).toFixed(4)}`;
  }

  function refreshTime() {
    currentTime.value = new Date().toLocaleString('zh-CN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<style scoped lang="less">
  .water-screen {
    position: relative;
    height: calc(100vh - 88px);
    min-height: 760px;
    overflow: hidden;
    color: #dff7ff;
    background:
      linear-gradient(rgba(147, 197, 253, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(147, 197, 253, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(2, 8, 23, 0.96), rgba(8, 31, 62, 0.22) 43%, rgba(2, 8, 23, 0.96)),
      linear-gradient(180deg, #020817, #092f66 52%, #020817);
    background-size:
      28px 28px,
      28px 28px,
      100% 100%,
      100% 100%;
  }

  .water-screen::before,
  .water-screen::after {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    content: '';
  }

  .water-screen::before {
    background:
      linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.18), transparent),
      linear-gradient(
        180deg,
        rgba(147, 197, 253, 0.07),
        transparent 22%,
        transparent 78%,
        rgba(147, 197, 253, 0.07)
      );
    mask-image: linear-gradient(180deg, transparent 0, #000 14%, #000 86%, transparent 100%);
  }

  .water-screen::after {
    background:
      repeating-linear-gradient(
        0deg,
        rgba(255, 255, 255, 0.035) 0,
        rgba(255, 255, 255, 0.035) 1px,
        transparent 1px,
        transparent 7px
      ),
      linear-gradient(
        115deg,
        transparent 0 42%,
        rgba(96, 165, 250, 0.08) 43% 44%,
        transparent 45% 100%
      ),
      linear-gradient(
        65deg,
        transparent 0 50%,
        rgba(59, 130, 246, 0.08) 51% 52%,
        transparent 53% 100%
      );
    opacity: 0.7;
  }

  .screen-header {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    z-index: 5;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    height: 94px;
    padding: 16px 28px;
    text-align: center;
    background:
      linear-gradient(180deg, rgba(3, 15, 33, 0.98), rgba(3, 15, 33, 0)),
      linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.16), transparent);
    border-bottom: 1px solid rgba(147, 197, 253, 0.1);
  }

  .header-line {
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(147, 197, 253, 0.9),
      rgba(96, 165, 250, 0.5),
      transparent
    );
    box-shadow: 0 0 18px rgba(96, 165, 250, 0.54);
  }

  .header-title {
    p {
      margin: 0;
      font-size: 12px;
      font-weight: 700;
      color: #7dd3fc;
      text-shadow: 0 0 12px rgba(125, 211, 252, 0.68);
    }

    h1 {
      margin: 2px 0 0;
      font-size: 34px;
      font-weight: 900;
      color: #f0fbff;
      text-shadow:
        0 0 12px rgba(147, 197, 253, 0.82),
        0 0 34px rgba(96, 165, 250, 0.28);
    }
  }

  .header-tools {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: flex-end;
    font-weight: 700;
    color: #b7eaff;
  }

  .header-tools :deep(.ant-btn) {
    color: #dff7ff;
    background: rgba(6, 28, 55, 0.46);
    border-color: rgba(147, 197, 253, 0.45);
    box-shadow:
      inset 0 0 16px rgba(147, 197, 253, 0.08),
      0 0 18px rgba(96, 165, 250, 0.16);
  }

  .map-stage {
    position: absolute;
    inset: 74px 250px 74px;
    z-index: 1;
  }

  .map-stage::before,
  .map-stage::after {
    position: absolute;
    inset: 5% 8%;
    pointer-events: none;
    content: '';
  }

  .map-stage::before {
    background:
      linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.08), transparent),
      linear-gradient(180deg, transparent, rgba(96, 165, 250, 0.1), transparent);
    border: 1px solid rgba(147, 197, 253, 0.08);
    box-shadow:
      inset 0 0 80px rgba(147, 197, 253, 0.08),
      0 0 90px rgba(96, 165, 250, 0.08);
    transform: skewX(-6deg);
  }

  .map-stage::after {
    inset: 13% 18%;
    border: 1px solid rgba(125, 211, 252, 0.12);
    box-shadow:
      0 0 36px rgba(147, 197, 253, 0.11),
      inset 0 0 36px rgba(147, 197, 253, 0.05);
    transform: skewX(8deg);
  }

  .map-chart {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
  }

  .screen-panel {
    position: absolute;
    top: 104px;
    bottom: 82px;
    z-index: 4;
    display: grid;
    gap: 10px;
    width: min(22vw, 350px);
    min-width: 300px;
    overflow: hidden;
  }

  .left-panel {
    left: 18px;
    grid-template-rows: minmax(160px, max-content) 1fr;
  }

  .right-panel {
    right: 18px;
    grid-template-rows: 1fr 1.1fr;
  }

  .panel-section {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 14px;
    overflow: hidden;
    background:
      linear-gradient(135deg, rgba(147, 197, 253, 0.12), transparent 22%),
      linear-gradient(180deg, rgba(12, 45, 92, 0.74), rgba(2, 8, 23, 0.74));
    border: 1px solid rgba(147, 197, 253, 0.3);
    border-radius: 8px;
    backdrop-filter: blur(12px);
    box-shadow:
      inset 0 0 34px rgba(147, 197, 253, 0.08),
      0 0 0 1px rgba(125, 211, 252, 0.04),
      0 20px 56px rgba(0, 0, 0, 0.34);
  }

  .panel-section::before {
    position: absolute;
    top: 0;
    right: 16px;
    left: 16px;
    height: 1px;
    content: '';
    background: linear-gradient(90deg, transparent, #93c5fd, rgba(96, 165, 250, 0.72), transparent);
    box-shadow: 0 0 18px rgba(96, 165, 250, 0.66);
  }

  .panel-section::after {
    position: absolute;
    top: 13px;
    right: 13px;
    width: 7px;
    height: 7px;
    content: '';
    border-top: 1px solid rgba(147, 197, 253, 0.76);
    border-right: 1px solid rgba(147, 197, 253, 0.76);
  }

  .panel-title {
    position: relative;
    padding-left: 12px;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 800;
    color: #e0faff;
    text-shadow: 0 0 12px rgba(96, 165, 250, 0.52);
  }

  .panel-title::before {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 0;
    width: 3px;
    content: '';
    background: #93c5fd;
    box-shadow: 0 0 12px rgba(96, 165, 250, 0.76);
  }

  .filter-section {
    gap: 8px;
  }

  .filter-section :deep(.ant-select) {
    width: 100%;
  }

  .filter-section :deep(.ant-select-selector) {
    color: #e0faff !important;
    background: rgba(6, 28, 55, 0.84) !important;
    border-color: rgba(56, 189, 248, 0.28) !important;
  }

  .filter-section :deep(.ant-select-selection-placeholder) {
    color: rgba(211, 241, 250, 0.64);
  }

  .legend-list {
    display: grid;
    gap: 9px;
  }

  .legend-item {
    display: grid;
    grid-template-columns: 12px 1fr auto;
    gap: 10px;
    align-items: center;
    min-height: 34px;
    padding: 0 8px;
    color: #dff7ff;
    cursor: pointer;
    user-select: none;
    border-radius: 6px;
    outline: none;
    background: rgba(2, 8, 23, 0.28);
    border: 1px solid transparent;
    transition:
      opacity 0.18s ease,
      background 0.18s ease,
      border-color 0.18s ease,
      box-shadow 0.18s ease;

    &:hover,
    &:focus-visible {
      background: rgba(96, 165, 250, 0.1);
      border-color: rgba(147, 197, 253, 0.22);
      box-shadow: inset 0 0 18px rgba(147, 197, 253, 0.07);
    }

    i {
      width: 10px;
      height: 10px;
      border: 1px solid #fff;
      border-radius: 999px;
      box-shadow:
        0 0 10px currentColor,
        0 0 20px currentColor;
    }

    strong {
      color: #93c5fd;
    }
  }

  .legend-item-inactive {
    opacity: 0.42;

    i {
      background: transparent !important;
    }
  }

  .chart-box {
    flex: 1 1 auto;
    min-height: 0;
  }

  .bottom-panel {
    position: absolute;
    right: 24%;
    bottom: 18px;
    left: 24%;
    z-index: 4;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .bottom-stat {
    position: relative;
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    min-height: 62px;
    padding: 10px 12px;
    overflow: hidden;
    background:
      linear-gradient(135deg, rgba(147, 197, 253, 0.14), transparent 30%),
      linear-gradient(180deg, rgba(12, 45, 92, 0.84), rgba(2, 8, 23, 0.8));
    border: 1px solid rgba(147, 197, 253, 0.28);
    border-radius: 8px;
    box-shadow:
      inset 0 0 22px rgba(147, 197, 253, 0.07),
      0 18px 40px rgba(0, 0, 0, 0.28);

    &::before {
      position: absolute;
      top: 0;
      right: 12px;
      left: 12px;
      height: 1px;
      content: '';
      background: linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.78), transparent);
    }

    span,
    strong {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      font-size: 12px;
      color: #a7dff0;
    }

    strong {
      margin-top: 4px;
      font-size: 20px;
      color: #e0faff;
      text-shadow: 0 0 14px rgba(96, 165, 250, 0.64);
    }
  }

  .bottom-stat-icon {
    justify-self: center;
    color: #93c5fd;
    filter: drop-shadow(0 0 10px rgba(96, 165, 250, 0.5));
  }

  .station-detail {
    position: absolute;
    bottom: 102px;
    left: 50%;
    z-index: 6;
    width: 440px;
    padding: 18px;
    background:
      linear-gradient(135deg, rgba(147, 197, 253, 0.14), transparent 26%),
      linear-gradient(180deg, rgba(12, 45, 92, 0.96), rgba(2, 8, 23, 0.94));
    border: 1px solid rgba(147, 197, 253, 0.38);
    border-radius: 8px;
    box-shadow:
      inset 0 0 34px rgba(147, 197, 253, 0.07),
      0 22px 72px rgba(0, 0, 0, 0.42),
      0 0 38px rgba(96, 165, 250, 0.1);
    backdrop-filter: blur(14px);
    transform: translateX(-50%);

    h2 {
      margin: 8px 0 6px;
      font-size: 22px;
      font-weight: 900;
      color: #f0fbff;
      text-shadow: 0 0 16px rgba(96, 165, 250, 0.58);
    }

    p {
      margin: 0 0 14px;
      color: #a9cbd8;
    }

    dl {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 0;
    }

    dt {
      font-size: 12px;
      color: #8fb9c9;
    }

    dd {
      margin: 2px 0 0;
      font-weight: 800;
      color: #e0faff;
    }
  }

  .station-badge {
    display: inline-flex;
    padding: 3px 10px;
    font-size: 12px;
    font-weight: 800;
    color: #061623;
    border-radius: 6px;
    box-shadow: 0 0 16px rgba(96, 165, 250, 0.18);
  }

  .detail-close {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    font-size: 18px;
    line-height: 24px;
    color: #dff7ff;
    cursor: pointer;
    background: rgba(96, 165, 250, 0.12);
    border: 1px solid rgba(147, 197, 253, 0.26);
    border-radius: 50%;
  }

  .detail-chart {
    height: 150px;
    margin-top: 14px;
  }

  .detail-extra {
    margin-top: 14px;
    padding-top: 12px;
    font-size: 12px;
    color: #9cd7ea;
    border-top: 1px solid rgba(148, 216, 232, 0.16);
  }

  .detail-panel-enter-active,
  .detail-panel-leave-active {
    transition: all 0.2s ease;
  }

  .detail-panel-enter-from,
  .detail-panel-leave-to {
    opacity: 0;
    transform: translate(-50%, 12px);
  }

  @media (max-width: 1280px) {
    .screen-panel {
      width: 300px;
      min-width: 300px;
    }

    .map-stage {
      right: 220px;
      left: 220px;
    }

    .bottom-panel {
      right: 320px;
      left: 320px;
    }
  }
</style>
