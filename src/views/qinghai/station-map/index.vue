<template>
  <PageWrapper contentFullHeight>
    <div class="water-screen">
      <div ref="mapRef" class="screen-map">
        <template v-if="!tiandituReady">
          <div
            class="mock-map"
            :style="{ transform: `translate(${mockOffset.x}px, ${mockOffset.y}px)` }"
            @pointerdown="startMockDrag"
          >
            <div class="mock-province"></div>
            <button
              v-for="station in displayStations"
              :key="station.stationCode || station.stationId"
              type="button"
              class="mock-marker"
              :style="getMockMarkerStyle(station)"
              @click.stop="selectStation(station)"
            >
              <span></span>
            </button>
          </div>
          <div class="map-fallback-tip">天地图未加载，当前显示模拟底图</div>
        </template>
      </div>

      <div class="screen-vignette"></div>
      <header class="screen-header">
        <div class="header-side-line"></div>
        <div>
          <p>QINGHAI WATER RESOURCE DIGITAL MAP</p>
          <h1>青海省水资源一张图</h1>
        </div>
        <div class="header-meta">
          <span>{{ currentTime }}</span>
          <a-button size="small" ghost :loading="loading" @click="loadDashboard">刷新</a-button>
        </div>
      </header>

      <aside class="screen-panel left-panel">
        <section class="panel-section overview-section">
          <div class="panel-title">综合概览</div>
          <div class="overview-grid">
            <div v-for="item in overviewCards" :key="item.label" class="metric-cell">
              <strong>{{ item.value }}</strong>
              <span>{{ item.label }}</span>
            </div>
          </div>
        </section>

        <section class="panel-section station-rank-section">
          <div class="panel-title">站点流量排名</div>
          <div ref="stationRankChartRef" class="chart-box"></div>
        </section>

        <section class="panel-section basin-section">
          <div class="panel-title">流域分布</div>
          <div ref="basinChartRef" class="chart-box basin-chart"></div>
        </section>
      </aside>

      <aside class="screen-panel right-panel">
        <section class="panel-section filter-section">
          <div class="panel-title">地图筛选</div>
          <Select
            v-model:value="filters.stationType"
            allow-clear
            placeholder="站别"
            :options="stationTypeOptions"
          />
          <Select
            v-model:value="filters.riverSystem"
            allow-clear
            placeholder="水系"
            :options="riverSystemOptions"
          />
          <Select
            v-model:value="filters.waterRegion3"
            allow-clear
            placeholder="水资源三级区"
            :options="waterRegionOptions"
          />
        </section>

        <section class="panel-section division-rank-section">
          <div class="panel-title">分区水资源量排行</div>
          <div ref="divisionRankChartRef" class="chart-box"></div>
        </section>

        <section class="panel-section precip-trend-section">
          <div class="panel-title">降水趋势</div>
          <div ref="precipTrendChartRef" class="chart-box small"></div>
        </section>
      </aside>

      <footer class="bottom-panel">
        <div class="bottom-stat">
          <span>地图站点</span>
          <strong>{{ displayStations.length }}</strong>
        </div>
        <div class="bottom-stat">
          <span>行政分区</span>
          <strong>{{ divisionMapData.length }}</strong>
        </div>
        <div class="bottom-stat">
          <span>河流水系</span>
          <strong>{{ riverSystemData.length }}</strong>
        </div>
        <div class="bottom-stat">
          <span>当前站点</span>
          <strong>{{ selectedStation?.stationName || '未选择' }}</strong>
        </div>
      </footer>

      <transition name="detail-panel">
        <article v-if="selectedStation" class="station-detail">
          <button type="button" class="detail-close" @click="closeStationDetail">×</button>
          <span class="station-badge">{{ selectedStation.stationType || '站点' }}</span>
          <h2>{{ selectedStation.stationName }}</h2>
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
              <dt>年均径流量</dt>
              <dd>{{ formatNumber(selectedStation.avgRunoff5616) }} 亿m3</dd>
            </div>
            <div>
              <dt>年均降水量</dt>
              <dd>{{ formatNumber(selectedStation.avgPrecip5616) }} mm</dd>
            </div>
            <div>
              <dt>最新径流量</dt>
              <dd>{{ formatNumber(selectedStation.latestRunoff) }} 亿m3</dd>
            </div>
            <div>
              <dt>最新降水量</dt>
              <dd>{{ formatNumber(selectedStation.latestPrecip) }} mm</dd>
            </div>
          </dl>
          <div class="detail-extra">
            <span v-if="detailLoading">详情加载中...</span>
            <span v-else>{{ detailSummary }}</span>
          </div>
        </article>
      </transition>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import type { EChartsOption } from 'echarts';
  import type { Ref } from 'vue';
  import { Select } from 'ant-design-vue';
  import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
  import { PageWrapper } from '@/components/Page';
  import { useECharts } from '@/hooks/web/useECharts';
  import {
    waterBasinDistribution,
    waterDashboardOverview,
    waterDivisionMap,
    waterDivisionRanking,
    waterPrecipByRegion,
    waterPrecipTrend,
    waterRiverSystems,
    waterStationDetail,
    waterStationMap,
    waterStationRanking,
  } from '@/api/water/dashboard';
  import {
    WaterDashboardMap,
    WaterDivisionMapVO,
    WaterStationMapVO,
  } from '@/api/water/dashboard/model';

  defineOptions({ name: 'QinghaiStationMap' });

  interface TiandituLngLat {
    lng: number;
    lat: number;
  }

  interface TiandituMarker {
    addEventListener(type: 'click', handler: () => void): void;
  }

  interface TiandituMap {
    centerAndZoom(point: TiandituLngLat, zoom: number): void;
    addOverLay(marker: TiandituMarker): void;
    clearOverLays(): void;
    enableDrag?(): void;
    enableScrollWheelZoom?(): void;
  }

  interface TiandituNamespace {
    Map: new (container: HTMLElement | string) => TiandituMap;
    LngLat: new (longitude: number, latitude: number) => TiandituLngLat;
    Marker: new (point: TiandituLngLat) => TiandituMarker;
  }

  const QINGHAI_CENTER = {
    longitude: 96.0435,
    latitude: 35.7264,
    zoom: 7,
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
      avgRunoff5616: 7.225,
      avgPrecip5616: 318.8,
      latestRunoff: 7.6,
      latestPrecip: 326,
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
      avgRunoff5616: 199.6,
      avgPrecip5616: 406.2,
      latestRunoff: 208.1,
      latestPrecip: 421.4,
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
      avgRunoff5616: 2.85,
      avgPrecip5616: 360.5,
      latestRunoff: 2.9,
      latestPrecip: 372.8,
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
      avgRunoff5616: 12.4,
      avgPrecip5616: 168.3,
      latestRunoff: 11.7,
      latestPrecip: 174.2,
    },
  ];

  const FALLBACK_OVERVIEW: WaterDashboardMap = {
    stationCount: 245,
    hydrologyStationCount: 78,
    meteorologyStationCount: 96,
    divisionCount: 126,
    surfaceResourceTotal: 629.1,
    groundwaterResourceTotal: 84600,
  };

  const FALLBACK_BASIN = [
    { name: '黄河流域', value: 68 },
    { name: '长江流域', value: 34 },
    { name: '西北诸河', value: 24 },
  ];

  const mapRef = ref<HTMLElement>();
  const stationRankChartRef = ref<HTMLDivElement | null>(null);
  const basinChartRef = ref<HTMLDivElement | null>(null);
  const divisionRankChartRef = ref<HTMLDivElement | null>(null);
  const precipTrendChartRef = ref<HTMLDivElement | null>(null);
  const { setOptions: setStationRankOptions } = useECharts(
    stationRankChartRef as Ref<HTMLDivElement>,
    'dark',
  );
  const { setOptions: setBasinOptions } = useECharts(basinChartRef as Ref<HTMLDivElement>, 'dark');
  const { setOptions: setDivisionRankOptions } = useECharts(
    divisionRankChartRef as Ref<HTMLDivElement>,
    'dark',
  );
  const { setOptions: setPrecipTrendOptions } = useECharts(
    precipTrendChartRef as Ref<HTMLDivElement>,
    'dark',
  );

  const currentTime = ref('');
  const loading = ref(false);
  const detailLoading = ref(false);
  const tiandituReady = ref(false);
  const overview = ref<WaterDashboardMap>(FALLBACK_OVERVIEW);
  const stationMapData = ref<WaterStationMapVO[]>(FALLBACK_STATIONS);
  const riverSystemData = ref<WaterDashboardMap[]>([]);
  const divisionMapData = ref<WaterDivisionMapVO[]>([]);
  const selectedStation = ref<WaterStationMapVO | null>(null);
  const selectedStationDetail = ref<WaterDashboardMap | null>(null);
  const mockOffset = reactive({ x: 0, y: 0 });
  const filters = reactive({
    stationType: undefined as string | undefined,
    riverSystem: undefined as string | undefined,
    waterRegion3: undefined as string | undefined,
  });

  let tiandituMap: TiandituMap | null = null;
  let timer: number | undefined;
  let mockDragStart: {
    pointerId: number;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null = null;

  const displayStations = computed(() => {
    return stationMapData.value.filter((station) => {
      return (
        (!filters.stationType || station.stationType === filters.stationType) &&
        (!filters.riverSystem || station.riverSystem === filters.riverSystem) &&
        (!filters.waterRegion3 || station.waterRegion3 === filters.waterRegion3)
      );
    });
  });

  const overviewCards = computed(() => [
    { label: '站点总数', value: formatNumber(pickOverview('stationCount', 'totalStationCount')) },
    {
      label: '水文站',
      value: formatNumber(pickOverview('hydrologyStationCount', 'waterStationCount')),
    },
    {
      label: '气象站',
      value: formatNumber(pickOverview('meteorologyStationCount', 'weatherStationCount')),
    },
    { label: '行政分区', value: formatNumber(pickOverview('divisionCount', 'adminDivisionCount')) },
    {
      label: '地表水资源量',
      value: `${formatNumber(pickOverview('surfaceResourceTotal', 'surfaceWaterTotal'))} 亿m3`,
    },
    {
      label: '地下水资源量',
      value: `${formatNumber(pickOverview('groundwaterResourceTotal', 'groundwaterTotal'))} 万m3`,
    },
  ]);

  const detailSummary = computed(() => {
    if (!selectedStationDetail.value) {
      return '点击地图站点后展示接口返回的站点基础信息和近年趋势数据';
    }
    const keys = Object.keys(selectedStationDetail.value);
    return keys.length ? `已加载详情字段：${keys.slice(0, 6).join('、')}` : '暂无更多详情数据';
  });

  const stationTypeOptions = computed(() => buildOptions(stationMapData.value, 'stationType'));
  const riverSystemOptions = computed(() => buildOptions(stationMapData.value, 'riverSystem'));
  const waterRegionOptions = computed(() => buildOptions(stationMapData.value, 'waterRegion3'));

  onMounted(async () => {
    refreshTime();
    timer = window.setInterval(refreshTime, 1000 * 30);
    await nextTick();
    await initTiandituMap();
    await loadDashboard();
  });

  onBeforeUnmount(() => {
    tiandituMap?.clearOverLays();
    tiandituMap = null;
    if (timer) {
      window.clearInterval(timer);
    }
    window.removeEventListener('pointermove', handleMockDragMove);
    window.removeEventListener('pointerup', stopMockDrag);
  });

  watch(displayStations, () => {
    if (
      !displayStations.value.some(
        (station) => station.stationCode === selectedStation.value?.stationCode,
      )
    ) {
      closeStationDetail();
    }
    renderTiandituMarkers();
  });

  async function loadDashboard() {
    loading.value = true;
    try {
      const [
        overviewResult,
        stationsResult,
        riversResult,
        divisionsResult,
        stationRankResult,
        divisionRankResult,
        basinResult,
        precipByRegionResult,
      ] = await Promise.allSettled([
        waterDashboardOverview(),
        waterStationMap(),
        waterRiverSystems(),
        waterDivisionMap(),
        waterStationRanking({ limit: 12 }),
        waterDivisionRanking({ year: 0, limit: 10 }),
        waterBasinDistribution(),
        waterPrecipByRegion({ year: 0 }),
      ]);

      overview.value = getSettledValue(overviewResult, FALLBACK_OVERVIEW);
      stationMapData.value = getSettledValue(stationsResult, FALLBACK_STATIONS);
      riverSystemData.value = getSettledValue(riversResult, []);
      divisionMapData.value = getSettledValue(divisionsResult, []);
      renderTiandituMarkers();
      renderStationRankChart(getSettledValue(stationRankResult, stationMapData.value));
      renderDivisionRankChart(getSettledValue(divisionRankResult, divisionMapData.value));
      renderBasinChart(getSettledValue(basinResult, FALLBACK_BASIN));

      const firstStationCode = displayStations.value[0]?.stationCode;
      if (firstStationCode) {
        await loadPrecipTrend(firstStationCode);
      } else {
        renderPrecipTrendChart(getSettledValue(precipByRegionResult, []));
      }
    } finally {
      loading.value = false;
    }
  }

  async function initTiandituMap() {
    const token = import.meta.env.VITE_GLOB_TIANDITU_TOKEN;
    if (!token || !mapRef.value) {
      return;
    }

    try {
      await loadTiandituScript(token);
      const tianditu = getTiandituNamespace();
      if (!tianditu || !mapRef.value) {
        return;
      }

      tiandituMap = new tianditu.Map(mapRef.value);
      tiandituMap.centerAndZoom(
        new tianditu.LngLat(QINGHAI_CENTER.longitude, QINGHAI_CENTER.latitude),
        QINGHAI_CENTER.zoom,
      );
      tiandituMap.enableDrag?.();
      tiandituMap.enableScrollWheelZoom?.();
      tiandituReady.value = true;
      renderTiandituMarkers();
    } catch (error) {
      console.warn('天地图脚本加载失败，已切换为模拟底图。', error);
    }
  }

  function loadTiandituScript(token: string) {
    const scriptId = 'tianditu-js-sdk';
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src = `https://api.tianditu.gov.cn/api?v=4.0&tk=${token}`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Tianditu SDK load failed'));
      document.head.appendChild(script);
    });
  }

  function getTiandituNamespace() {
    return (window as unknown as { T?: TiandituNamespace }).T;
  }

  function renderTiandituMarkers() {
    if (!tiandituMap || !tiandituReady.value) {
      return;
    }

    const tianditu = getTiandituNamespace();
    if (!tianditu) {
      return;
    }

    tiandituMap.clearOverLays();
    displayStations.value.forEach((station) => {
      if (!isValidCoordinate(station)) {
        return;
      }
      const point = new tianditu.LngLat(Number(station.longitude), Number(station.latitude));
      const marker = new tianditu.Marker(point);
      marker.addEventListener('click', () => selectStation(station));
      tiandituMap?.addOverLay(marker);
    });
  }

  async function selectStation(station: WaterStationMapVO) {
    selectedStation.value = station;
    if (station.stationCode) {
      detailLoading.value = true;
      try {
        selectedStationDetail.value = await waterStationDetail(station.stationCode);
      } catch {
        selectedStationDetail.value = null;
      } finally {
        detailLoading.value = false;
      }
      await loadPrecipTrend(station.stationCode);
    }
  }

  function closeStationDetail() {
    selectedStation.value = null;
    selectedStationDetail.value = null;
  }

  async function loadPrecipTrend(stationCode: string) {
    try {
      const data = await waterPrecipTrend({ stationCode, startYear: 1956, endYear: 2016 });
      renderPrecipTrendChart(data);
    } catch {
      renderPrecipTrendChart([
        { year: 2019, value: 318 },
        { year: 2020, value: 332 },
        { year: 2021, value: 309 },
        { year: 2022, value: 346 },
        { year: 2023, value: 358 },
      ]);
    }
  }

  function renderStationRankChart(data: WaterDashboardMap[]) {
    const rows = data.slice(0, 12);
    setStationRankOptions(
      createBarOption(rows, ['stationName', 'name', 'label'], ['avgRunoff5616', 'value', 'runoff']),
    );
  }

  function renderDivisionRankChart(data: WaterDashboardMap[]) {
    const rows = data.slice(0, 10);
    setDivisionRankOptions(
      createBarOption(
        rows,
        ['level3Region', 'divName', 'name', 'city'],
        ['surfaceResource', 'value', 'resource'],
      ),
    );
  }

  function renderBasinChart(data: WaterDashboardMap[]) {
    const seriesData = data.map((item) => ({
      name: pickText(item, ['level1Region', 'basinName', 'name', 'label']),
      value: pickNumber(item, ['count', 'value', 'total']),
    }));

    setBasinOptions({
      color: ['#38bdf8', '#22c55e', '#f59e0b', '#a78bfa'],
      tooltip: { trigger: 'item' },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        top: 'middle',
        right: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#b7d9e8' },
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '66%'],
          center: ['34%', '50%'],
          avoidLabelOverlap: true,
          label: { show: false },
          labelLine: { show: false },
          data: seriesData,
        },
      ],
    });
  }

  function renderPrecipTrendChart(data: WaterDashboardMap[]) {
    const rows = data.length
      ? data
      : [
          { year: 2019, value: 318 },
          { year: 2020, value: 332 },
          { year: 2021, value: 309 },
          { year: 2022, value: 346 },
        ];
    const xData = rows.map((item) => pickText(item, ['year', 'name', 'label']));
    const yData = rows.map((item) => pickNumber(item, ['precipitation', 'avgPrecip', 'value']));

    setPrecipTrendOptions({
      color: ['#38bdf8'],
      tooltip: { trigger: 'axis' },
      grid: { left: 36, right: 16, top: 24, bottom: 28 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xData,
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
          symbolSize: 6,
          areaStyle: { color: 'rgba(56, 189, 248, 0.18)' },
          data: yData,
        },
      ],
    });
  }

  function createBarOption(
    data: WaterDashboardMap[],
    nameKeys: string[],
    valueKeys: string[],
  ): EChartsOption {
    const rows = data.length ? data : FALLBACK_STATIONS;
    const yData = rows.map((item) => pickText(item, nameKeys));
    const values = rows.map((item) => pickNumber(item, valueKeys));
    return {
      color: ['#22d3ee'],
      tooltip: { trigger: 'axis' },
      grid: { left: 68, right: 16, top: 18, bottom: 22 },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(148, 216, 232, 0.14)' } },
        axisLabel: { color: '#a9d5e7' },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: yData,
        axisLabel: { color: '#d7f7ff', width: 64, overflow: 'truncate' },
      },
      series: [
        {
          type: 'bar',
          barWidth: 10,
          data: values,
          itemStyle: {
            borderRadius: 5,
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
    };
  }

  function getMockMarkerStyle(station: WaterStationMapVO) {
    const longitudeMin = 89.4;
    const longitudeMax = 103.1;
    const latitudeMin = 31.6;
    const latitudeMax = 39.3;
    const left = ((Number(station.longitude) - longitudeMin) / (longitudeMax - longitudeMin)) * 100;
    const top = (1 - (Number(station.latitude) - latitudeMin) / (latitudeMax - latitudeMin)) * 100;
    return {
      left: `${Math.min(Math.max(left, 8), 92)}%`,
      top: `${Math.min(Math.max(top, 9), 91)}%`,
    };
  }

  function startMockDrag(event: PointerEvent) {
    const target = event.currentTarget as HTMLElement;
    mockDragStart = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX: mockOffset.x,
      offsetY: mockOffset.y,
    };
    target.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', handleMockDragMove);
    window.addEventListener('pointerup', stopMockDrag);
  }

  function handleMockDragMove(event: PointerEvent) {
    if (!mockDragStart || event.pointerId !== mockDragStart.pointerId) {
      return;
    }
    mockOffset.x = mockDragStart.offsetX + event.clientX - mockDragStart.x;
    mockOffset.y = mockDragStart.offsetY + event.clientY - mockDragStart.y;
  }

  function stopMockDrag() {
    mockDragStart = null;
    window.removeEventListener('pointermove', handleMockDragMove);
    window.removeEventListener('pointerup', stopMockDrag);
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

  function buildOptions(list: WaterStationMapVO[], field: keyof WaterStationMapVO) {
    return Array.from(new Set(list.map((item) => item[field]).filter(Boolean))).map((value) => ({
      label: String(value),
      value: String(value),
    }));
  }

  function getSettledValue<T>(result: PromiseSettledResult<T>, fallback: T) {
    return result.status === 'fulfilled' && result.value ? result.value : fallback;
  }

  function pickOverview(...keys: string[]) {
    return pickNumber(overview.value, keys);
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

  function formatNumber(value?: number) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
      return '-';
    }
    return Number.isInteger(numberValue) ? String(numberValue) : numberValue.toFixed(2);
  }
</script>

<style scoped lang="less">
  .water-screen {
    position: relative;
    height: calc(100vh - 88px);
    min-height: 760px;
    overflow: hidden;
    color: #dff7ff;
    background: #061623;
  }

  .screen-map {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    background: #0b2435;
  }

  .screen-vignette {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background:
      linear-gradient(
        90deg,
        rgba(5, 17, 28, 0.92) 0%,
        rgba(5, 17, 28, 0.24) 34%,
        rgba(5, 17, 28, 0.24) 66%,
        rgba(5, 17, 28, 0.92) 100%
      ),
      linear-gradient(
        180deg,
        rgba(5, 17, 28, 0.88) 0%,
        rgba(5, 17, 28, 0.08) 24%,
        rgba(5, 17, 28, 0.7) 100%
      );
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
    background: linear-gradient(180deg, rgba(7, 31, 48, 0.96), rgba(7, 31, 48, 0));

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

  .header-side-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(103, 232, 249, 0.66));
  }

  .header-meta {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: flex-end;
    font-weight: 700;
    color: #b7eaff;
  }

  .screen-panel {
    position: absolute;
    top: 100px;
    bottom: 78px;
    z-index: 4;
    display: grid;
    gap: 10px;
    width: min(25vw, 420px);
    min-width: 340px;
    overflow: hidden;
    pointer-events: auto;
  }

  .left-panel {
    left: 18px;
    grid-template-rows: minmax(178px, max-content) minmax(170px, 1fr) minmax(160px, 0.8fr);
  }

  .right-panel {
    right: 18px;
    grid-template-rows: minmax(160px, max-content) minmax(185px, 1fr) minmax(165px, 0.85fr);
  }

  .panel-section {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 12px;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(9, 37, 58, 0.9), rgba(8, 25, 41, 0.78));
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
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 800;
    color: #e0faff;
  }

  .overview-grid {
    display: grid;
    align-content: center;
    flex: 1 1 auto;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .metric-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 7px 6px;
    text-align: center;
    background: rgba(15, 52, 75, 0.68);
    border: 1px solid rgba(125, 211, 252, 0.16);
    border-radius: 6px;

    strong {
      display: block;
      font-size: 18px;
      line-height: 1.1;
      color: #67e8f9;
    }

    span {
      display: block;
      margin-top: 3px;
      font-size: 12px;
      line-height: 1.2;
      color: #a9cbd8;
    }
  }

  .chart-box {
    flex: 1 1 auto;
    min-height: 0;
    height: auto;
  }

  .chart-box.small {
    height: auto;
  }

  .station-rank-section {
    min-height: 0;
  }

  .basin-section {
    min-height: 0;
  }

  .basin-chart {
    height: auto;
  }

  .division-rank-section {
    min-height: 0;
  }

  .precip-trend-section {
    min-height: 0;
  }

  .filter-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
  }

  .filter-section :deep(.ant-select) {
    width: 100%;
    flex: 0 0 auto;
  }

  .filter-section :deep(.ant-select-selector) {
    color: #e0faff !important;
    background: rgba(6, 28, 45, 0.82) !important;
    border-color: rgba(56, 189, 248, 0.28) !important;
  }

  .filter-section :deep(.ant-select-selection-placeholder) {
    color: rgba(211, 241, 250, 0.64);
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
    background: rgba(8, 31, 48, 0.86);
    border: 1px solid rgba(56, 189, 248, 0.22);
    border-radius: 8px;

    span {
      display: block;
      font-size: 12px;
      color: #a9cbd8;
    }

    strong {
      display: block;
      margin-top: 4px;
      overflow: hidden;
      font-size: 20px;
      color: #e0faff;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .station-detail {
    position: absolute;
    bottom: 102px;
    left: 50%;
    z-index: 6;
    width: 420px;
    padding: 18px;
    background: linear-gradient(180deg, rgba(8, 34, 54, 0.96), rgba(6, 23, 38, 0.94));
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
    background: #67e8f9;
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

  .detail-extra {
    margin-top: 14px;
    padding-top: 12px;
    font-size: 12px;
    color: #9cd7ea;
    border-top: 1px solid rgba(148, 216, 232, 0.16);
  }

  .mock-map {
    position: absolute;
    inset: -90px;
    cursor: grab;
    touch-action: none;
    background:
      linear-gradient(120deg, rgba(56, 189, 248, 0.1) 0 1px, transparent 1px 100%),
      radial-gradient(circle at 44% 42%, rgba(34, 197, 94, 0.28), transparent 32%),
      radial-gradient(circle at 60% 58%, rgba(14, 165, 233, 0.22), transparent 34%),
      linear-gradient(145deg, #113047, #092033);
    background-size:
      48px 48px,
      auto,
      auto,
      auto;
  }

  .mock-map:active {
    cursor: grabbing;
  }

  .mock-province {
    position: absolute;
    top: 15%;
    left: 13%;
    width: 74%;
    height: 70%;
    background: linear-gradient(145deg, rgba(20, 184, 166, 0.34), rgba(56, 189, 248, 0.24));
    border: 2px solid rgba(103, 232, 249, 0.44);
    border-radius: 38% 54% 42% 48% / 48% 36% 54% 42%;
    box-shadow: 0 0 90px rgba(56, 189, 248, 0.18);
    transform: rotate(-8deg) skew(-5deg);
  }

  .mock-marker {
    position: absolute;
    z-index: 2;
    width: 28px;
    height: 28px;
    padding: 0;
    cursor: pointer;
    background: transparent;
    border: 0;
    transform: translate(-50%, -50%);

    span {
      position: absolute;
      inset: 4px;
      display: block;
      background: #67e8f9;
      border: 3px solid #e0faff;
      border-radius: 999px 999px 999px 0;
      box-shadow: 0 0 18px rgba(103, 232, 249, 0.72);
      transform: rotate(-45deg);
    }

    &::after {
      position: absolute;
      inset: -10px;
      content: '';
      border: 1px solid #67e8f9;
      border-radius: 999px;
      opacity: 0.35;
      animation: pulse 2.4s infinite;
    }
  }

  .map-fallback-tip {
    position: absolute;
    right: 50%;
    bottom: 104px;
    z-index: 3;
    padding: 7px 12px;
    font-weight: 700;
    color: #67e8f9;
    background: rgba(8, 31, 48, 0.86);
    border: 1px solid rgba(56, 189, 248, 0.22);
    border-radius: 6px;
    transform: translateX(50%);
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

  @keyframes pulse {
    0% {
      opacity: 0.35;
      transform: scale(0.8);
    }

    70% {
      opacity: 0;
      transform: scale(1.55);
    }

    100% {
      opacity: 0;
      transform: scale(1.55);
    }
  }

  @media (min-height: 900px) {
    .screen-panel {
      top: 108px;
      bottom: 88px;
      gap: 14px;
    }

    .left-panel {
      grid-template-rows: minmax(230px, max-content) minmax(210px, 1fr) minmax(190px, 0.85fr);
    }

    .right-panel {
      grid-template-rows: minmax(170px, max-content) minmax(220px, 1fr) minmax(190px, 0.85fr);
    }

    .panel-section {
      padding: 14px;
    }

    .panel-title {
      margin-bottom: 12px;
      font-size: 15px;
    }

    .metric-cell {
      min-height: 58px;
      padding: 9px 8px;

      strong {
        font-size: 22px;
      }
    }

    .overview-grid {
      gap: 10px;
    }
  }

  @media (max-width: 1280px) {
    .screen-panel {
      width: 330px;
      min-width: 330px;
    }

    .bottom-panel {
      right: 360px;
      left: 360px;
    }
  }
</style>
