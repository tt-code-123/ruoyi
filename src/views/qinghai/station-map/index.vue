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
          <div class="panel-title">站点图例</div>
          <div class="legend-list">
            <div v-for="item in stationLegend" :key="item.type" class="legend-item">
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
        <div class="bottom-stat">
          <span>当前站点</span>
          <strong>{{ displayStations.length }}</strong>
        </div>
        <div class="bottom-stat">
          <span>市州统计</span>
          <strong>{{ stationCountByCity.length }}</strong>
        </div>
        <div class="bottom-stat">
          <span>分区数据</span>
          <strong>{{ divisionMapData.length }}</strong>
        </div>
        <div class="bottom-stat">
          <span>选中站点</span>
          <strong>{{ selectedStation?.stationName || '未选择' }}</strong>
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
  const MAP_AREA_COLOR = '#082b5f';
  const MAP_EMPHASIS_COLOR = '#0d3f86';
  const MAP_BORDER_COLOR = '#2b8bd7';
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
  const divisionMapData = ref<WaterDivisionMapVO[]>([]);
  const selectedStation = ref<WaterStationMapVO | null>(null);
  const selectedStationDetail = ref<WaterDashboardMap | null>(null);
  const trendRows = ref<WaterDashboardMap[]>([]);

  let timer: number | undefined;

  const displayStations = computed(() =>
    stationMapData.value.filter((station) => isValidCoordinate(station)),
  );

  const stationLegend = computed(() => {
    const types = Array.from(
      new Set([
        ...Object.keys(STATION_COLORS),
        ...displayStations.value.map((station) => station.stationType).filter(Boolean),
      ]),
    );
    return types.map((type) => ({
      type,
      color: getStationColor(type),
      count: displayStations.value.filter((station) => station.stationType === type).length,
    }));
  });

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
          ...createMapGeoOption(),
          type: 'map',
          data: getMapRegionData(),
        },
        {
          type: 'scatter',
          coordinateSystem: 'geo',
          symbolSize: 9,
          zlevel: 3,
          data: displayStations.value.map(toScatterData),
        },
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          symbolSize: 13,
          rippleEffect: { brushType: 'stroke', scale: 3 },
          zlevel: 4,
          data: selectedStation.value ? [toScatterData(selectedStation.value)] : [],
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
                { offset: 1, color: '#67e8f9' },
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
    renderMapChart();
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
      color: ['#67e8f9', '#22c55e'],
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
    renderMapChart();
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

  function getMapRegionData() {
    const features = (qinghaiGeoJson as any).features || [];
    return features.map((feature: any) => ({
      name: feature?.properties?.name,
      value: displayStations.value.length,
    }));
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
      radial-gradient(circle at 50% 45%, rgba(14, 78, 142, 0.32), transparent 38%),
      linear-gradient(
        90deg,
        rgba(5, 17, 34, 0.94),
        rgba(5, 17, 34, 0.1) 42%,
        rgba(5, 17, 34, 0.94)
      ),
      linear-gradient(180deg, #041226, #071d38 58%, #041226);
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
    background: linear-gradient(180deg, rgba(6, 24, 48, 0.98), rgba(6, 24, 48, 0));
  }

  .header-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(103, 232, 249, 0.66));
  }

  .header-title {
    p {
      margin: 0;
      font-size: 12px;
      font-weight: 700;
      color: #67e8f9;
    }

    h1 {
      margin: 2px 0 0;
      font-size: 34px;
      font-weight: 900;
      color: #f0fbff;
      text-shadow: 0 0 18px rgba(56, 189, 248, 0.8);
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

  .map-stage {
    position: absolute;
    inset: 74px 250px 74px;
    z-index: 1;
  }

  .map-chart {
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
    padding: 12px;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(8, 32, 62, 0.9), rgba(5, 20, 42, 0.78));
    border: 1px solid rgba(56, 189, 248, 0.24);
    border-radius: 8px;
    box-shadow:
      inset 0 0 28px rgba(14, 165, 233, 0.08),
      0 18px 44px rgba(0, 0, 0, 0.26);
  }

  .panel-section::before {
    position: absolute;
    top: 0;
    left: 14px;
    width: 68px;
    height: 2px;
    content: '';
    background: #67e8f9;
    box-shadow: 0 0 16px rgba(103, 232, 249, 0.8);
  }

  .panel-title {
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 800;
    color: #e0faff;
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
    gap: 10px;
  }

  .legend-item {
    display: grid;
    grid-template-columns: 12px 1fr auto;
    gap: 10px;
    align-items: center;
    color: #dff7ff;

    i {
      width: 10px;
      height: 10px;
      border: 1px solid #fff;
      border-radius: 999px;
      box-shadow: 0 0 12px currentColor;
    }

    strong {
      color: #67e8f9;
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
    min-height: 62px;
    padding: 10px 12px;
    background: rgba(8, 31, 58, 0.86);
    border: 1px solid rgba(56, 189, 248, 0.22);
    border-radius: 8px;

    span,
    strong {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      font-size: 12px;
      color: #a9cbd8;
    }

    strong {
      margin-top: 4px;
      font-size: 20px;
      color: #e0faff;
    }
  }

  .station-detail {
    position: absolute;
    bottom: 102px;
    left: 50%;
    z-index: 6;
    width: 440px;
    padding: 18px;
    background: linear-gradient(180deg, rgba(8, 34, 64, 0.96), rgba(6, 23, 44, 0.94));
    border: 1px solid rgba(103, 232, 249, 0.34);
    border-radius: 8px;
    box-shadow: 0 22px 72px rgba(0, 0, 0, 0.36);
    transform: translateX(-50%);

    h2 {
      margin: 8px 0 6px;
      font-size: 22px;
      font-weight: 900;
      color: #f0fbff;
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
    background: rgba(148, 216, 232, 0.14);
    border: 1px solid rgba(148, 216, 232, 0.2);
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
