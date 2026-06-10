<template>
  <PageWrapper dense>
    <div class="station-overview">
      <div v-for="item in overviewCards" :key="item.type" class="overview-card">
        <span class="overview-card-icon" :class="getStationTypeClass(item.type)">
          <Icon :icon="getStationTypeIcon(item.type)" :size="28" />
        </span>
        <div class="overview-card-content">
          <span>{{ item.type }}</span>
          <strong>{{ formatNumber(item.count) }}</strong>
          <em>{{ formatRatio(item.ratio) }}</em>
        </div>
      </div>
    </div>

    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button @click="handleImport">导入</a-button>
        <a-button
          @click="downloadExcel(waterStationExport, '站点信息列表', getForm().getFieldsValue())"
        >
          导出
        </a-button>
        <a-button
          type="primary"
          danger
          :disabled="!selected"
          @click="multipleRemove(waterStationRemove)"
        >
          删除
        </a-button>
        <a-button type="primary" @click="handleAdd">新增站点</a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            stopButtonPropagation
            :actions="[
              {
                label: '编辑',
                icon: IconEnum.EDIT,
                type: 'primary',
                ghost: true,
                onClick: handleEdit.bind(null, record),
              },
              {
                label: '删除',
                icon: IconEnum.DELETE,
                type: 'primary',
                danger: true,
                ghost: true,
                popConfirm: {
                  placement: 'left',
                  title: `是否删除站点[${record.stationName || record.stationCode}]?`,
                  confirm: handleDelete.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>

    <StationModal @register="registerModal" @reload="handleReload" />
    <StationImportModal @register="registerImportModal" @reload="handleReload" />
  </PageWrapper>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { PageWrapper } from '@/components/Page';
  import { BasicTable, TableAction, useTable } from '@/components/Table';
  import { useModal } from '@/components/Modal';
  import Icon from '@/components/Icon/Icon.vue';
  import { IconEnum } from '@/enums/appEnum';
  import { downloadExcel } from '@/utils/file/download';
  import { waterStationCountByType } from '@/api/water/dashboard';
  import type { WaterStationCountByTypeVO } from '@/api/water/dashboard/model';
  import { waterStationExport, waterStationList, waterStationRemove } from '@/api/water/station';
  import StationImportModal from './StationImportModal.vue';
  import StationModal from './StationModal.vue';
  import { columns, searchSchemas } from './station.data';

  defineOptions({ name: 'QinghaiStationData' });

  const overviewCards = ref<WaterStationCountByTypeVO[]>([]);

  const [registerModal, { openModal }] = useModal();
  const [registerImportModal, { openModal: openImportModal }] = useModal();
  const [registerTable, { reload, multipleRemove, selected, getForm }] = useTable({
    rowSelection: {
      type: 'checkbox',
    },
    title: '站点信息列表',
    api: waterStationList,
    rowKey: 'stationId',
    showIndexColumn: true,
    useSearchForm: true,
    formConfig: {
      schemas: searchSchemas,
      baseColProps: {
        xs: 24,
        sm: 12,
        md: 8,
        lg: 6,
      },
    },
    columns,
    actionColumn: {
      width: 180,
      title: '操作',
      key: 'action',
      fixed: 'right',
    },
  });

  onMounted(loadOverview);

  async function loadOverview() {
    overviewCards.value = await waterStationCountByType();
  }

  function handleAdd() {
    openModal(true, { update: false });
  }

  function handleImport() {
    openImportModal(true);
  }

  function handleEdit(record: Recordable) {
    openModal(true, { record, update: true });
  }

  async function handleDelete(record: Recordable) {
    await waterStationRemove(record.stationId);
    await handleReload();
  }

  async function handleReload() {
    await Promise.all([reload(), loadOverview()]);
  }

  function formatNumber(value?: number) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue.toLocaleString() : '0';
  }

  function formatRatio(value?: number) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? `${numberValue}%` : '占比 -';
  }

  function getStationTypeIcon(type?: string) {
    if (type?.includes('气象')) {
      return 'material-symbols:partly-cloudy-day-outline';
    }
    if (type?.includes('雨量')) {
      return 'material-symbols:rainy-outline';
    }
    if (type?.includes('中小河流')) {
      return 'material-symbols:water';
    }
    if (type?.includes('水文')) {
      return 'material-symbols:water-drop-outline';
    }
    return 'material-symbols:location-on-outline';
  }

  function getStationTypeClass(type?: string) {
    if (type?.includes('气象')) {
      return 'is-weather';
    }
    if (type?.includes('雨量')) {
      return 'is-rain';
    }
    if (type?.includes('中小河流')) {
      return 'is-river';
    }
    if (type?.includes('水文')) {
      return 'is-hydrology';
    }
    return 'is-default';
  }
</script>

<style scoped lang="less">
  .station-overview {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 16px 16px 0;
  }

  .overview-card {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 88px;
    padding: 14px 16px;
    background: #fff;
    border: 1px solid #edf1f7;
    border-radius: 8px;
  }

  .overview-card-icon {
    display: inline-flex;
    flex: 0 0 48px;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    color: #1677ff;
    background: #eaf4ff;
    border-radius: 8px;

    &.is-weather {
      color: #d97706;
      background: #fff7e6;
    }

    &.is-rain {
      color: #2563eb;
      background: #eff6ff;
    }

    &.is-river {
      color: #0891b2;
      background: #ecfeff;
    }

    &.is-hydrology {
      color: #0f766e;
      background: #f0fdfa;
    }
  }

  .overview-card-content {
    min-width: 0;

    span,
    em {
      display: block;
      color: #6b7280;
      font-style: normal;
    }

    strong {
      display: block;
      margin: 6px 0 2px;
      font-size: 28px;
      line-height: 1;
      color: #1f2937;
    }
  }

  @media (max-width: 1200px) {
    .station-overview {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 576px) {
    .station-overview {
      grid-template-columns: 1fr;
    }
  }
</style>
