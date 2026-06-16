<template>
  <div class="water-screen">
    <div class="map-toolbar">
      <a-button size="small" ghost :loading="loading" @click="loadDashboard">刷新</a-button>
      <button
        v-for="item in baseMapControls"
        :key="item.key"
        type="button"
        class="map-tool-button"
        :class="{ 'map-tool-button-off': !item.active }"
        @click="setBaseMap(item.key)"
      >
        {{ item.label }}
      </button>
      <button
        v-for="item in overlayLayerControls"
        :key="item.key"
        type="button"
        class="map-tool-button"
        :class="{ 'map-tool-button-off': !item.active }"
        @click="toggleMapLayer(item.key)"
      >
        {{ item.label }}
      </button>
    </div>
    <main ref="mapStageRef" class="map-stage" @wheel.passive="handleMapWheel">
      <div ref="mapChartRef" class="map-chart"></div>
      <div v-if="mapLayerState.showStations" class="station-marker-layer">
        <button
          v-for="marker in stationMarkers"
          :key="marker.stationKey"
          :ref="(element) => setStationMarkerElement(marker.stationKey, element)"
          type="button"
          class="station-marker"
          :class="{ 'station-marker-selected': marker.isSelected }"
          :style="{
            '--station-color': marker.color,
          }"
          :title="marker.station.stationName"
          @click.stop="selectStation(marker.station)"
        ></button>
      </div>
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
        <p>{{ selectedStation.riverSystem || '-' }} / {{ selectedStation.waterRegion3 || '-' }}</p>
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
        <!-- <div v-else class="detail-extra">{{ detailLoading ? '详情加载中...' : detailSummary }}</div> -->
      </article>
    </transition>
  </div>
</template>

<script setup lang="ts">
  import type { EChartsOption } from 'echarts';
  import type { ComponentPublicInstance, Ref } from 'vue';
  import {
    computed,
    markRaw,
    nextTick,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import Icon from '@/components/Icon/Icon.vue';
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
  import qinghaiGeoJson from './geo/qinghai.json';
  import {
    type BaseMapMode,
    buildMapTexture,
    DEFAULT_MAP_LAYER_STATE,
    getBaseMapOption,
    type MapLayerState,
  } from './mapLayerConfig';

  defineOptions({ name: 'QinghaiStationMap' });

  const QINGHAI_MAP_NAME = 'qinghai-water';
  const QINGHAI_CENTER: [number, number] = [96.04, 35.72];
  type RegisteredMapSource = Parameters<typeof echarts.registerMap>[1];
  const MAP_AREA_COLOR = '#0b2a5a';
  const MAP_EMPHASIS_COLOR = '#123f85';
  const QINGHAI_GEO_JSON = qinghaiGeoJson as unknown as RegisteredMapSource;
  const STATION_COLORS: Record<string, string> = {
    水文: '#2563eb',
    气象: '#f59e0b',
    雨量: '#06b6d4',
    中小河流: '#a855f7',
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

  const mapStageRef = ref<HTMLDivElement | null>(null);
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
  const mapLayerState = reactive<MapLayerState>({ ...DEFAULT_MAP_LAYER_STATE });
  const mapTexture = shallowRef<HTMLCanvasElement | null>(null);
  const stationMarkers = computed<StationMarkerView[]>(() =>
    displayStations.value.map((station) => {
      const stationKey = getStationKey(station);
      return {
        station,
        stationKey,
        color: getStationColor(station.stationType),
        isSelected: stationKey === selectedStationKey.value,
      };
    }),
  );

  let isRefreshingDashboard = false;
  let isMapRendered = false;
  let chartRenderedHandler: (() => void) | undefined;
  let markerUpdateFrame = 0;
  let continuousMarkerUpdateFrame = 0;
  let continuousMarkerUpdateUntil = 0;
  let qinghaiGeoBounds: GeoBounds | undefined;
  let mapTextureRequestId = 0;
  const stationMarkerElements = new Map<string, HTMLElement>();

  interface StationMarkerView {
    station: WaterStationMapVO;
    stationKey: string;
    color: string;
    isSelected: boolean;
  }

  interface GeoBounds {
    minLng: number;
    maxLng: number;
    minLat: number;
    maxLat: number;
  }

  const allValidStations = computed(() =>
    stationMapData.value.filter((station) => isValidCoordinate(station)),
  );

  const displayStations = computed(() =>
    allValidStations.value.filter(
      (station) => !station.stationType || isStationTypeVisible(station.stationType),
    ),
  );

  const stationTypeCounts = computed(() => countStationsByType(allValidStations.value));

  const visibleStationTypeCounts = computed(() => countStationsByType(displayStations.value));

  const selectedStationKey = computed(() =>
    selectedStation.value ? getStationKey(selectedStation.value) : '',
  );

  const baseMapControls = computed(() => [
    {
      key: 'vector' as const,
      label: getBaseMapOption('vector').label,
      active: mapLayerState.baseMap === 'vector',
    },
    {
      key: 'imagery' as const,
      label: getBaseMapOption('imagery').label,
      active: mapLayerState.baseMap === 'imagery',
    },
  ]);

  const overlayLayerControls = computed(() => [
    { key: 'showBoundary' as const, label: '边界', active: mapLayerState.showBoundary },
    { key: 'showLabels' as const, label: '标签', active: mapLayerState.showLabels },
    { key: 'showStations' as const, label: '站点', active: mapLayerState.showStations },
  ]);

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
      count: stationTypeCounts.value.get(type) || 0,
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

  onMounted(async () => {
    echarts.registerMap(QINGHAI_MAP_NAME, QINGHAI_GEO_JSON);
    loadMapTexture();
    await loadDashboard();
  });

  onBeforeUnmount(() => {
    const instance = getMapInstance();
    if (instance && chartRenderedHandler) {
      instance.off('rendered', chartRenderedHandler);
      instance.off('finished', chartRenderedHandler);
    }
    if (markerUpdateFrame) {
      window.cancelAnimationFrame(markerUpdateFrame);
    }
    if (continuousMarkerUpdateFrame) {
      window.cancelAnimationFrame(continuousMarkerUpdateFrame);
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
    if (isRefreshingDashboard) {
      return;
    }
    nextTick(updateStationMarkers);
  });

  watch(mapLayerState, () => {
    renderMapChart();
  });

  watch(
    () => mapLayerState.baseMap,
    () => {
      loadMapTexture();
    },
  );

  async function loadDashboard() {
    loading.value = true;
    isRefreshingDashboard = true;
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
      isRefreshingDashboard = false;
      renderMapChart();
      renderBasinRatioChart();
      renderDivisionChart();
    } finally {
      isRefreshingDashboard = false;
      loading.value = false;
    }
  }

  function bindMapEvents() {
    nextTick(() => {
      const instance = getMapInstance();
      if (!instance) {
        return;
      }
      if (chartRenderedHandler) {
        instance.off('rendered', chartRenderedHandler);
        instance.off('finished', chartRenderedHandler);
      }
      chartRenderedHandler = () => {
        scheduleStationMarkerUpdate();
      };
      instance.on('rendered', chartRenderedHandler);
      instance.on('finished', chartRenderedHandler);
      scheduleStationMarkerUpdate();
    });
  }

  function renderMapChart() {
    const mapOptions: EChartsOption & {
      geo3D: ReturnType<typeof createMapGeo3DOption>;
      series: ReturnType<typeof createMapSeriesOptions>;
    } = {
      tooltip: { show: false },
      geo3D: createMapGeo3DOption(),
      series: createMapSeriesOptions(),
    };
    void setMapOptions(mapOptions).then(() => {
      getMapInstance()?.getZr().refresh();
      scheduleStationMarkerUpdate();
    });
    isMapRendered = true;
    bindMapEvents();
  }

  function createMapGeo3DOption() {
    const baseMapOption = getBaseMapOption(mapLayerState.baseMap);
    const materialOption = {
      detailTexture: mapTexture.value || undefined,
      textureTiling: 1,
      textureOffset: 0,
    };
    return {
      map: QINGHAI_MAP_NAME,
      roam: false,
      regionHeight: 5.8,
      center: QINGHAI_CENTER,
      boxHeight: 12,
      boxDepth: 84,
      boxWidth: 108,
      environment: 'rgba(0,0,0,0)',
      shading: baseMapOption.shading,
      itemStyle: {
        color: baseMapOption.surfaceColor || MAP_AREA_COLOR,
        opacity: baseMapOption.surfaceOpacity,
        borderColor: mapLayerState.showBoundary
          ? baseMapOption.borderColor
          : 'rgba(122, 167, 247, 0.08)',
        borderWidth: mapLayerState.showBoundary ? 1.2 : 0.25,
      },
      emphasis: {
        itemStyle: { color: MAP_EMPHASIS_COLOR },
        label: { color: '#fff' },
      },
      label: {
        show: mapLayerState.showLabels,
        color: '#fff',
        fontSize: 15,
        fontWeight: 500,
      },
      realisticMaterial: {
        ...materialOption,
        roughness: mapLayerState.baseMap === 'imagery' ? 0.82 : 0.56,
        metalness: 0,
      },
      lambertMaterial: materialOption,
      colorMaterial: materialOption,
      light: {
        main: {
          intensity: mapLayerState.baseMap === 'imagery' ? 1.2 : 1.05,
          shadow: false,
          alpha: 38,
          beta: 18,
        },
        ambient: {
          intensity: mapLayerState.baseMap === 'imagery' ? 0.36 : 0.46,
        },
      },
      postEffect: {
        enable: true,
        bloom: {
          enable: true,
          bloomIntensity: mapLayerState.baseMap === 'imagery' ? 0.16 : 0.24,
        },
        SSAO: {
          enable: true,
          radius: 2,
          intensity: 1.12,
        },
      },
      viewControl: {
        projection: 'perspective',
        autoRotate: false,
        distance: 106,
        alpha: 42,
        beta: -8,
        center: [0, 0, 0],
        rotateSensitivity: 0,
        zoomSensitivity: 1.1,
        panSensitivity: 0,
      },
    };
  }

  function createMapSeriesOptions() {
    return [];
  }

  async function loadMapTexture() {
    const requestId = ++mapTextureRequestId;
    const bounds = getQinghaiGeoBounds();
    const texture = await buildMapTexture(mapLayerState.baseMap, bounds);
    if (requestId !== mapTextureRequestId) {
      return;
    }
    mapTexture.value = texture ? markRaw(texture) : null;
    renderMapChart();
  }

  function renderBasinRatioChart() {
    const rows = stationTypeRatio.value.length ? stationTypeRatio.value : buildStationTypeRatio();

    setBasinRatioOptions({
      color: Object.values(STATION_COLORS),
      tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 个 ({d}%)' },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { color: '#c8d6f2' },
      },
      series: [
        {
          type: 'pie',
          radius: ['48%', '68%'],
          center: ['50%', '44%'],
          label: {
            color: '#e7edf8',
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
      color: ['#3b82f6'],
      tooltip: { trigger: 'axis' },
      grid: { left: 74, right: 22, top: 20, bottom: 28 },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(59, 130, 246, 0.14)' } },
        axisLabel: { color: '#c8d6f2' },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: rows.map((item) => item.name || '未知'),
        axisLabel: { color: '#e7edf8', width: 70, overflow: 'truncate' },
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
                { offset: 0, color: '#1d4ed8' },
                { offset: 1, color: '#7aa7f7' },
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
      color: ['#7aa7f7', '#3b82f6'],
      tooltip: { trigger: 'axis' },
      grid: { left: 36, right: 16, top: 18, bottom: 24 },
      xAxis: {
        type: 'category',
        data: trendRows.value.map((item) => pickText(item, ['year', 'name', 'label'])),
        axisLabel: { color: '#c8d6f2' },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(59, 130, 246, 0.14)' } },
        axisLabel: { color: '#c8d6f2' },
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

  function setBaseMap(baseMap: BaseMapMode) {
    if (mapLayerState.baseMap === baseMap) {
      return;
    }
    mapLayerState.baseMap = baseMap;
  }

  function toggleMapLayer(
    key: keyof Pick<MapLayerState, 'showBoundary' | 'showLabels' | 'showStations'>,
  ) {
    mapLayerState[key] = !mapLayerState[key];
  }

  function isStationTypeVisible(type: string) {
    return !hiddenStationTypes.value.includes(type);
  }

  function countVisibleStationsByType(type: string) {
    return visibleStationTypeCounts.value.get(type) || 0;
  }

  function updateSelectedStationEffect() {
    updateStationMarkers();
  }

  function handleMapWheel() {
    startContinuousStationMarkerUpdate(420);
  }

  function updateStationMarkers() {
    if (!isMapRendered) {
      renderMapChart();
      return;
    }
    scheduleStationMarkerUpdate();
  }

  function startContinuousStationMarkerUpdate(duration = 240) {
    extendContinuousStationMarkerUpdate(duration);
    if (!continuousMarkerUpdateFrame) {
      runContinuousStationMarkerUpdate();
    }
  }

  function extendContinuousStationMarkerUpdate(duration = 240) {
    continuousMarkerUpdateUntil = getNow() + duration;
  }

  function runContinuousStationMarkerUpdate() {
    refreshStationMarkers();
    if (getNow() < continuousMarkerUpdateUntil) {
      continuousMarkerUpdateFrame = window.requestAnimationFrame(runContinuousStationMarkerUpdate);
      return;
    }
    continuousMarkerUpdateFrame = 0;
    scheduleStationMarkerUpdate();
  }

  function scheduleStationMarkerUpdate() {
    if (typeof window === 'undefined') {
      return;
    }
    if (markerUpdateFrame) {
      window.cancelAnimationFrame(markerUpdateFrame);
    }
    markerUpdateFrame = window.requestAnimationFrame(() => {
      markerUpdateFrame = 0;
      refreshStationMarkers();
    });
  }

  function getNow() {
    return typeof performance === 'undefined' ? Date.now() : performance.now();
  }

  function refreshStationMarkers() {
    const instance = getMapInstance();
    const chartElement = mapChartRef.value;
    if (!instance || !chartElement || !mapLayerState.showStations) {
      stationMarkerElements.forEach((element) => {
        element.style.display = 'none';
      });
      return;
    }
    const chartRect = chartElement.getBoundingClientRect();
    stationMarkers.value.forEach((marker) => {
      const element = stationMarkerElements.get(marker.stationKey);
      if (!element) {
        return;
      }
      const point = projectStationToPixel(instance, marker.station, chartRect);
      if (!point) {
        element.style.display = 'none';
        return;
      }
      element.style.display = 'block';
      element.style.transform = `translate3d(${point[0]}px, ${point[1]}px, 0) translate(-50%, -50%)`;
    });
  }

  function setStationMarkerElement(
    stationKey: string,
    element: Element | ComponentPublicInstance | null,
  ) {
    if (element instanceof HTMLElement) {
      stationMarkerElements.set(stationKey, element);
      scheduleStationMarkerUpdate();
      return;
    }
    stationMarkerElements.delete(stationKey);
  }

  function projectStationToPixel(
    instance: any,
    station: WaterStationMapVO,
    chartRect: DOMRect,
  ): [number, number] | null {
    const longitude = Number(station.longitude);
    const latitude = Number(station.latitude);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return null;
    }
    const geo3DPoint = projectStationByGeo3DCamera(instance, longitude, latitude, chartRect);
    if (geo3DPoint) {
      return geo3DPoint;
    }
    try {
      const point = instance.convertToPixel({ geo3DIndex: 0 }, [longitude, latitude, 0]);
      if (isFinitePixel(point)) {
        return [point[0], point[1]];
      }
    } catch (error) {
      // ECharts-GL does not expose convertToPixel consistently across builds.
    }
    return projectStationByGeoBounds(longitude, latitude, chartRect);
  }

  function projectStationByGeo3DCamera(
    instance: any,
    longitude: number,
    latitude: number,
    chartRect: DOMRect,
  ): [number, number] | null {
    const geo3D = instance.getModel?.()?.getComponent?.('geo3D')?.coordinateSystem;
    const viewGL = geo3D?.viewGL;
    const camera = viewGL?.camera;
    const viewport = viewGL?.viewport;
    if (!geo3D?.dataToPoint || !camera?.viewMatrix || !camera?.projectionMatrix || !viewport) {
      return null;
    }
    camera.update?.(true);
    const worldPoint = geo3D.dataToPoint([longitude, latitude, 0]);
    const ndcPoint = transformWorldToNdc(
      worldPoint,
      camera.viewMatrix.array,
      camera.projectionMatrix.array,
    );
    if (!ndcPoint) {
      return null;
    }
    const left = viewport.x + ((ndcPoint[0] + 1) / 2) * viewport.width;
    const top = chartRect.height - (viewport.y + ((ndcPoint[1] + 1) / 2) * viewport.height);
    return [left, top];
  }

  function transformWorldToNdc(
    point: number[],
    viewMatrix: ArrayLike<number>,
    projectionMatrix: ArrayLike<number>,
  ): [number, number] | null {
    const viewPoint = transformPoint4(point[0], point[1], point[2], 1, viewMatrix);
    const clipPoint = transformPoint4(
      viewPoint[0],
      viewPoint[1],
      viewPoint[2],
      viewPoint[3],
      projectionMatrix,
    );
    if (!clipPoint[3]) {
      return null;
    }
    return [clipPoint[0] / clipPoint[3], clipPoint[1] / clipPoint[3]];
  }

  function transformPoint4(x: number, y: number, z: number, w: number, matrix: ArrayLike<number>) {
    return [
      matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12] * w,
      matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13] * w,
      matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14] * w,
      matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15] * w,
    ];
  }

  function projectStationByGeoBounds(
    longitude: number,
    latitude: number,
    chartRect: DOMRect,
  ): [number, number] | null {
    const bounds = getQinghaiGeoBounds();
    const lngSpan = bounds.maxLng - bounds.minLng;
    const latSpan = bounds.maxLat - bounds.minLat;
    if (!lngSpan || !latSpan) {
      return null;
    }
    const xRatio = (longitude - bounds.minLng) / lngSpan;
    const yRatio = (bounds.maxLat - latitude) / latSpan;
    const left = chartRect.width * (0.14 + xRatio * 0.72);
    const top = chartRect.height * (0.18 + yRatio * 0.58);
    return [left, top];
  }

  function getQinghaiGeoBounds() {
    if (qinghaiGeoBounds) {
      return qinghaiGeoBounds;
    }
    const bounds = {
      minLng: Infinity,
      maxLng: -Infinity,
      minLat: Infinity,
      maxLat: -Infinity,
    };
    collectCoordinateBounds(QINGHAI_GEO_JSON, bounds);
    qinghaiGeoBounds = bounds;
    return bounds;
  }

  function collectCoordinateBounds(value: any, bounds: GeoBounds) {
    if (!Array.isArray(value)) {
      if (value && typeof value === 'object') {
        Object.values(value).forEach((item) => collectCoordinateBounds(item, bounds));
      }
      return;
    }
    if (typeof value[0] === 'number' && typeof value[1] === 'number') {
      bounds.minLng = Math.min(bounds.minLng, value[0]);
      bounds.maxLng = Math.max(bounds.maxLng, value[0]);
      bounds.minLat = Math.min(bounds.minLat, value[1]);
      bounds.maxLat = Math.max(bounds.maxLat, value[1]);
      return;
    }
    value.forEach((item) => collectCoordinateBounds(item, bounds));
  }

  function isFinitePixel(value: unknown): value is [number, number] {
    return (
      Array.isArray(value) && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]))
    );
  }

  function countStationsByType(stations: WaterStationMapVO[]) {
    return stations.reduce((counts, station) => {
      if (station.stationType) {
        counts.set(station.stationType, (counts.get(station.stationType) || 0) + 1);
      }
      return counts;
    }, new Map<string, number>());
  }

  function getStationKey(station: WaterStationMapVO) {
    return String(
      station.stationCode ||
        station.stationId ||
        `${station.stationName || '-'}-${station.longitude || '-'}-${station.latitude || '-'}`,
    );
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
    return STATION_COLORS[type || ''] || '#2563eb';
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
</script>

<style scoped lang="less">
  .water-screen {
    --cyber-bg: #020617;
    --cyber-panel: rgba(8, 13, 28, 0.82);
    --cyber-panel-strong: rgba(15, 23, 42, 0.92);
    --cyber-blue: #3b82f6;
    --cyber-blue-soft: rgba(59, 130, 246, 0.38);
    --cyber-accent: #7aa7f7;
    --cyber-indigo: #2563eb;
    --cyber-violet: #1e40af;
    --cyber-line: rgba(59, 130, 246, 0.32);
    --cyber-text: #eff6ff;
    position: relative;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    color: var(--cyber-text);
    background:
      linear-gradient(rgba(59, 130, 246, 0.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.055) 1px, transparent 1px),
      radial-gradient(circle at 50% 38%, rgba(29, 78, 216, 0.26), transparent 35%),
      radial-gradient(circle at 16% 18%, rgba(37, 99, 235, 0.2), transparent 28%),
      radial-gradient(circle at 82% 82%, rgba(30, 64, 175, 0.18), transparent 28%),
      linear-gradient(90deg, rgba(2, 6, 23, 0.98), rgba(8, 25, 58, 0.68) 48%, rgba(2, 6, 23, 0.98)),
      linear-gradient(180deg, #020617, #061226 48%, #020617);
    background-size:
      30px 30px,
      30px 30px,
      100% 100%,
      100% 100%,
      100% 100%,
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
      linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.22), transparent),
      linear-gradient(
        180deg,
        rgba(37, 99, 235, 0.12),
        transparent 20%,
        transparent 78%,
        rgba(59, 130, 246, 0.12)
      ),
      linear-gradient(180deg, transparent 0 48%, rgba(59, 130, 246, 0.1) 49%, transparent 51% 100%);
    mask-image: linear-gradient(180deg, transparent 0, #000 14%, #000 86%, transparent 100%);
  }

  .water-screen::after {
    background:
      linear-gradient(
        115deg,
        transparent 0 39%,
        rgba(59, 130, 246, 0.14) 40% 40.4%,
        transparent 41% 100%
      ),
      linear-gradient(
        65deg,
        transparent 0 55%,
        rgba(37, 99, 235, 0.12) 56% 56.4%,
        transparent 57% 100%
      );
    opacity: 0.72;
  }

  .map-toolbar {
    position: absolute;
    top: 10px;
    right: 18px;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
    max-width: min(560px, calc(100% - 36px));
  }

  .map-toolbar :deep(.ant-btn),
  .map-tool-button {
    height: 24px;
    padding: 0 10px;
    font-size: 12px;
    line-height: 22px;
    color: #eff6ff;
    cursor: pointer;
    background: linear-gradient(135deg, rgba(29, 78, 216, 0.18), rgba(37, 99, 235, 0.08));
    border-color: rgba(59, 130, 246, 0.46);
    border-style: solid;
    border-width: 1px;
    border-radius: 4px;
    box-shadow:
      inset 0 0 16px rgba(59, 130, 246, 0.1),
      0 0 18px rgba(59, 130, 246, 0.18);
    transition:
      opacity 0.18s ease,
      border-color 0.18s ease,
      box-shadow 0.18s ease;
  }

  .map-tool-button:hover,
  .map-tool-button:focus-visible {
    border-color: rgba(147, 197, 253, 0.78);
    outline: none;
    box-shadow:
      inset 0 0 16px rgba(59, 130, 246, 0.14),
      0 0 20px rgba(59, 130, 246, 0.28);
  }

  .map-tool-button-off {
    color: rgba(203, 213, 225, 0.68);
    background: rgba(2, 8, 23, 0.56);
    border-color: rgba(59, 130, 246, 0.18);
    box-shadow: inset 0 0 10px rgba(15, 23, 42, 0.28);
  }

  .map-stage {
    position: absolute;
    inset: 0 250px 56px;
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
      linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.12), transparent),
      linear-gradient(180deg, transparent, rgba(37, 99, 235, 0.1), transparent);
    border: 1px solid rgba(59, 130, 246, 0.12);
    box-shadow:
      inset 0 0 42px rgba(59, 130, 246, 0.08),
      0 0 38px rgba(59, 130, 246, 0.08);
    transform: skewX(-6deg);
  }

  .map-stage::after {
    inset: 13% 18%;
    border: 1px solid rgba(37, 99, 235, 0.14);
    box-shadow:
      0 0 18px rgba(37, 99, 235, 0.1),
      inset 0 0 18px rgba(59, 130, 246, 0.06);
    transform: skewX(8deg);
  }

  .map-chart {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
  }

  .station-marker-layer {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }

  .station-marker {
    --station-color: #2563eb;
    position: absolute;
    display: none;
    width: 10px;
    height: 10px;
    padding: 0;
    pointer-events: auto;
    cursor: pointer;
    background: var(--station-color);
    border: 2px solid rgba(255, 255, 255, 0.92);
    border-radius: 50%;
    box-shadow:
      0 0 0 1px rgba(2, 8, 23, 0.54),
      0 0 10px color-mix(in srgb, var(--station-color), transparent 20%);
    will-change: transform;
    transition:
      width 0.16s ease,
      height 0.16s ease,
      border-color 0.16s ease,
      box-shadow 0.16s ease;
  }

  .station-marker:hover,
  .station-marker:focus-visible,
  .station-marker-selected {
    width: 13px;
    height: 13px;
    border-color: #fff;
    outline: none;
    box-shadow:
      0 0 0 2px rgba(2, 8, 23, 0.64),
      0 0 16px color-mix(in srgb, var(--station-color), transparent 8%);
  }

  .screen-panel {
    position: absolute;
    top: 34px;
    bottom: 72px;
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
      linear-gradient(135deg, rgba(59, 130, 246, 0.16), transparent 24%),
      linear-gradient(315deg, rgba(37, 99, 235, 0.1), transparent 28%),
      linear-gradient(180deg, var(--cyber-panel-strong), var(--cyber-panel));
    border: 1px solid var(--cyber-line);
    border-radius: 6px;
    box-shadow:
      inset 0 0 20px rgba(59, 130, 246, 0.08),
      inset 0 -1px 0 rgba(37, 99, 235, 0.16),
      0 12px 30px rgba(0, 0, 0, 0.34),
      0 0 22px rgba(59, 130, 246, 0.08);
  }

  .panel-section::before {
    position: absolute;
    top: 0;
    right: 16px;
    left: 16px;
    height: 1px;
    content: '';
    background: linear-gradient(
      90deg,
      transparent,
      var(--cyber-accent),
      var(--cyber-indigo),
      transparent
    );
    box-shadow:
      0 0 18px rgba(59, 130, 246, 0.56),
      0 0 24px rgba(37, 99, 235, 0.22);
  }

  .panel-section::after {
    position: absolute;
    top: 13px;
    right: 13px;
    width: 7px;
    height: 7px;
    content: '';
    border-top: 1px solid rgba(59, 130, 246, 0.86);
    border-right: 1px solid rgba(37, 99, 235, 0.72);
  }

  .panel-title {
    position: relative;
    padding-left: 12px;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 800;
    color: #f8fbff;
    letter-spacing: 0;
    text-shadow:
      0 0 10px rgba(59, 130, 246, 0.54),
      0 0 18px rgba(59, 130, 246, 0.24);
  }

  .panel-title::before {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 0;
    width: 3px;
    content: '';
    background: linear-gradient(180deg, var(--cyber-accent), var(--cyber-indigo));
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.76);
  }

  .filter-section {
    gap: 8px;
  }

  .filter-section :deep(.ant-select) {
    width: 100%;
  }

  .filter-section :deep(.ant-select-selector) {
    color: #eff6ff !important;
    background: rgba(2, 8, 23, 0.82) !important;
    border-color: rgba(59, 130, 246, 0.34) !important;
    box-shadow: inset 0 0 14px rgba(59, 130, 246, 0.08);
  }

  .filter-section :deep(.ant-select-selection-placeholder) {
    color: rgba(203, 213, 225, 0.64);
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
    color: #e7edf8;
    cursor: pointer;
    user-select: none;
    border-radius: 4px;
    outline: none;
    background:
      linear-gradient(90deg, rgba(59, 130, 246, 0.08), transparent 48%), rgba(2, 8, 23, 0.34);
    border: 1px solid rgba(59, 130, 246, 0.08);
    transition:
      opacity 0.18s ease,
      background 0.18s ease,
      border-color 0.18s ease,
      box-shadow 0.18s ease;

    &:hover,
    &:focus-visible {
      background:
        linear-gradient(90deg, rgba(59, 130, 246, 0.16), rgba(37, 99, 235, 0.08) 58%, transparent),
        rgba(2, 8, 23, 0.42);
      border-color: rgba(59, 130, 246, 0.34);
      box-shadow:
        inset 0 0 18px rgba(59, 130, 246, 0.1),
        0 0 16px rgba(59, 130, 246, 0.1);
    }

    i {
      width: 10px;
      height: 10px;
      border: 1px solid #fff;
      border-radius: 999px;
      box-shadow:
        0 0 8px currentColor,
        0 0 18px currentColor;
    }

    strong {
      color: var(--cyber-accent);
      text-shadow: 0 0 10px rgba(59, 130, 246, 0.42);
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
    bottom: 8px;
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
      linear-gradient(135deg, rgba(59, 130, 246, 0.18), transparent 30%),
      linear-gradient(315deg, rgba(37, 99, 235, 0.12), transparent 36%),
      linear-gradient(180deg, rgba(7, 26, 62, 0.9), rgba(2, 8, 23, 0.82));
    border: 1px solid rgba(59, 130, 246, 0.28);
    border-radius: 6px;
    box-shadow:
      inset 0 0 14px rgba(59, 130, 246, 0.08),
      0 10px 24px rgba(0, 0, 0, 0.28),
      0 0 18px rgba(59, 130, 246, 0.08);

    &::before {
      position: absolute;
      top: 0;
      right: 12px;
      left: 12px;
      height: 1px;
      content: '';
      background: linear-gradient(
        90deg,
        transparent,
        rgba(59, 130, 246, 0.9),
        rgba(37, 99, 235, 0.5),
        transparent
      );
    }

    &::after {
      position: absolute;
      right: 10px;
      bottom: 8px;
      width: 34px;
      height: 1px;
      content: '';
      background: rgba(37, 99, 235, 0.5);
      box-shadow: 0 0 12px rgba(37, 99, 235, 0.34);
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
      color: #c8d6f2;
    }

    strong {
      margin-top: 4px;
      font-size: 20px;
      color: #eff6ff;
      text-shadow:
        0 0 12px rgba(59, 130, 246, 0.68),
        0 0 22px rgba(59, 130, 246, 0.28);
    }
  }

  .bottom-stat-icon {
    justify-self: center;
    color: var(--cyber-accent);
    filter: drop-shadow(0 0 9px rgba(59, 130, 246, 0.54));
  }

  .station-detail {
    position: absolute;
    bottom: 88px;
    left: 50%;
    z-index: 6;
    width: 440px;
    padding: 18px;
    background:
      linear-gradient(135deg, rgba(59, 130, 246, 0.18), transparent 28%),
      linear-gradient(315deg, rgba(37, 99, 235, 0.12), transparent 34%),
      linear-gradient(180deg, rgba(7, 26, 62, 0.98), rgba(2, 8, 23, 0.95));
    border: 1px solid rgba(59, 130, 246, 0.4);
    border-radius: 6px;
    box-shadow:
      inset 0 0 20px rgba(59, 130, 246, 0.08),
      inset 0 -1px 0 rgba(37, 99, 235, 0.18),
      0 18px 46px rgba(0, 0, 0, 0.38),
      0 0 26px rgba(59, 130, 246, 0.12);
    transform: translateX(-50%);

    &::before {
      position: absolute;
      top: 0;
      right: 18px;
      left: 18px;
      height: 1px;
      content: '';
      background: linear-gradient(
        90deg,
        transparent,
        var(--cyber-accent),
        var(--cyber-indigo),
        transparent
      );
      box-shadow: 0 0 16px rgba(59, 130, 246, 0.56);
    }

    h2 {
      margin: 8px 0 6px;
      font-size: 22px;
      font-weight: 900;
      color: #f8fbff;
      text-shadow:
        0 0 12px rgba(59, 130, 246, 0.66),
        0 0 24px rgba(37, 99, 235, 0.18);
    }

    p {
      margin: 0 0 14px;
      color: #b6c2d6;
    }

    dl {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 0;
    }

    dt {
      font-size: 12px;
      color: #7aa7f7;
    }

    dd {
      margin: 2px 0 0;
      font-weight: 800;
      color: #eff6ff;
    }
  }

  .station-badge {
    display: inline-flex;
    padding: 3px 10px;
    font-size: 12px;
    font-weight: 800;
    color: #061623;
    border-radius: 4px;
    box-shadow:
      0 0 12px rgba(59, 130, 246, 0.24),
      0 0 18px rgba(37, 99, 235, 0.12);
  }

  .detail-close {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    font-size: 18px;
    line-height: 24px;
    color: #e7edf8;
    cursor: pointer;
    background: rgba(2, 8, 23, 0.52);
    border: 1px solid rgba(59, 130, 246, 0.34);
    border-radius: 50%;
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.12);
  }

  .detail-chart {
    height: 150px;
    margin-top: 14px;
  }

  .detail-extra {
    margin-top: 14px;
    padding-top: 12px;
    font-size: 12px;
    color: #c8d6f2;
    border-top: 1px solid rgba(59, 130, 246, 0.18);
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
