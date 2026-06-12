<template>
  <div class="station-data-screen">
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
          @click="downloadExcel(waterStationExport, '站点基础信息列表', getForm().getFieldsValue())"
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
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
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
    title: '站点基础信息列表',
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
  .station-data-screen {
    height: 100%;
    padding: 0;
    overflow: hidden;
    color: #e6fbff;
  }

  .station-overview {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 0 0 12px;
  }

  .overview-card {
    position: relative;
    display: flex;
    gap: 14px;
    align-items: center;
    min-height: 88px;
    padding: 14px 16px;
    overflow: hidden;
    background:
      linear-gradient(135deg, rgba(103, 232, 249, 0.16), transparent 34%),
      linear-gradient(315deg, rgba(129, 140, 248, 0.12), transparent 38%), rgba(6, 22, 48, 0.82);
    border: 1px solid rgba(103, 232, 249, 0.28);
    border-radius: 6px;
    box-shadow:
      inset 0 0 18px rgba(103, 232, 249, 0.08),
      0 10px 28px rgba(0, 0, 0, 0.24),
      0 0 18px rgba(56, 189, 248, 0.08);
  }

  .overview-card::before {
    position: absolute;
    top: 0;
    right: 14px;
    left: 14px;
    height: 1px;
    content: '';
    background: linear-gradient(
      90deg,
      transparent,
      rgba(103, 232, 249, 0.9),
      rgba(129, 140, 248, 0.5),
      transparent
    );
  }

  .overview-card-icon {
    display: inline-flex;
    flex: 0 0 48px;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    color: #67e8f9;
    background: rgba(14, 165, 233, 0.16);
    border: 1px solid rgba(103, 232, 249, 0.24);
    border-radius: 6px;
    box-shadow:
      inset 0 0 12px rgba(103, 232, 249, 0.08),
      0 0 16px rgba(56, 189, 248, 0.12);

    &.is-weather {
      color: #fbbf24;
      background: rgba(251, 191, 36, 0.14);
    }

    &.is-rain {
      color: #60a5fa;
      background: rgba(96, 165, 250, 0.14);
    }

    &.is-river {
      color: #22d3ee;
      background: rgba(34, 211, 238, 0.14);
    }

    &.is-hydrology {
      color: #2dd4bf;
      background: rgba(45, 212, 191, 0.14);
    }
  }

  .overview-card-content {
    min-width: 0;

    span,
    em {
      display: block;
      color: #a7f3ff;
      font-style: normal;
    }

    strong {
      display: block;
      margin: 6px 0 2px;
      font-size: 28px;
      line-height: 1;
      color: #f0fbff;
      text-shadow:
        0 0 12px rgba(103, 232, 249, 0.56),
        0 0 22px rgba(56, 189, 248, 0.22);
    }
  }

  .station-data-screen :deep(.vben-basic-table) {
    height: calc(100% - 100px);
    padding: 14px;
    overflow: hidden;
    background:
      linear-gradient(135deg, rgba(103, 232, 249, 0.14), transparent 26%),
      linear-gradient(315deg, rgba(129, 140, 248, 0.1), transparent 30%), rgba(4, 18, 42, 0.82);
    border: 1px solid rgba(103, 232, 249, 0.24);
    border-radius: 6px;
    box-shadow:
      inset 0 0 20px rgba(103, 232, 249, 0.08),
      0 12px 32px rgba(0, 0, 0, 0.28);
  }

  .station-data-screen :deep(.vben-basic-table-form-container) {
    padding: 0;
    background: transparent;
  }

  .station-data-screen :deep(.vben-basic-form) {
    padding: 14px 14px 4px;
    margin-bottom: 8px;
    background:
      linear-gradient(90deg, rgba(103, 232, 249, 0.08), transparent 52%), rgba(2, 8, 23, 0.2);
    border: 1px solid rgba(103, 232, 249, 0.12);
    border-radius: 4px;
  }

  .station-data-screen :deep(.ant-form),
  .station-data-screen :deep(.ant-table-wrapper),
  .station-data-screen :deep(.ant-table),
  .station-data-screen :deep(.ant-table-container),
  .station-data-screen :deep(.ant-table-content) {
    color: #dff7ff;
    background: transparent;
  }

  .station-data-screen :deep(.ant-table-title),
  .station-data-screen :deep(.vben-basic-table-header__title),
  .station-data-screen :deep(.vben-basic-title),
  .station-data-screen :deep(.vben-basic-table-title) {
    color: #f0fbff;
    font-weight: 800;
    text-shadow:
      0 0 12px rgba(103, 232, 249, 0.58),
      0 0 22px rgba(56, 189, 248, 0.22);
  }

  .station-data-screen :deep(.ant-table-thead > tr > th) {
    color: #c7f7ff;
    background: rgba(10, 38, 76, 0.92);
    border-bottom: 1px solid rgba(103, 232, 249, 0.22);
  }

  .station-data-screen :deep(.ant-table-thead > tr > th.ant-table-cell-fix-right),
  .station-data-screen :deep(.ant-table-tbody > tr > td.ant-table-cell-fix-right) {
    background: linear-gradient(90deg, rgba(4, 18, 42, 0.98), rgba(10, 38, 76, 0.98)), #06162e;
    box-shadow:
      -10px 0 18px rgba(2, 8, 23, 0.46),
      inset 1px 0 0 rgba(103, 232, 249, 0.18);
  }

  .station-data-screen :deep(.ant-table-tbody > tr > td) {
    color: #dff7ff;
    background: rgba(3, 14, 34, 0.54);
    border-bottom: 1px solid rgba(103, 232, 249, 0.12);
  }

  .station-data-screen :deep(.ant-table-tbody > tr:hover > td) {
    background: rgba(14, 165, 233, 0.16);
  }

  .station-data-screen :deep(.ant-input),
  .station-data-screen :deep(.ant-input-affix-wrapper),
  .station-data-screen :deep(.ant-picker),
  .station-data-screen :deep(.ant-select-selector) {
    color: #e6fbff;
    background: rgba(2, 8, 23, 0.68) !important;
    border-color: rgba(103, 232, 249, 0.28) !important;
    box-shadow:
      inset 0 0 14px rgba(103, 232, 249, 0.08),
      0 0 12px rgba(56, 189, 248, 0.08);
  }

  .station-data-screen :deep(.ant-input-affix-wrapper .ant-input) {
    background: transparent !important;
    border-color: transparent !important;
    box-shadow: none;
  }

  .station-data-screen :deep(.ant-input::placeholder),
  .station-data-screen :deep(.ant-select-selection-placeholder),
  .station-data-screen :deep(.ant-picker-input > input::placeholder) {
    color: rgba(211, 241, 250, 0.56);
  }

  .station-data-screen :deep(.ant-form-item-label > label),
  .station-data-screen :deep(.ant-pagination),
  .station-data-screen :deep(.ant-pagination-total-text),
  .station-data-screen :deep(.ant-select-selection-item),
  .station-data-screen :deep(.ant-picker-input > input),
  .station-data-screen :deep(.ant-select-arrow),
  .station-data-screen :deep(.ant-picker-suffix),
  .station-data-screen :deep(.ant-input-prefix),
  .station-data-screen :deep(.ant-input-suffix) {
    color: #c7f7ff;
  }

  .station-data-screen :deep(.ant-pagination-item),
  .station-data-screen :deep(.ant-pagination-prev .ant-pagination-item-link),
  .station-data-screen :deep(.ant-pagination-next .ant-pagination-item-link),
  .station-data-screen :deep(.ant-pagination-options-quick-jumper input) {
    background: rgba(2, 8, 23, 0.62);
    border-color: rgba(103, 232, 249, 0.26);
  }

  .station-data-screen :deep(.ant-pagination-item a),
  .station-data-screen :deep(.ant-pagination-prev .ant-pagination-item-link),
  .station-data-screen :deep(.ant-pagination-next .ant-pagination-item-link),
  .station-data-screen :deep(.ant-pagination-jump-prev .ant-pagination-item-container),
  .station-data-screen :deep(.ant-pagination-jump-next .ant-pagination-item-container),
  .station-data-screen :deep(.ant-pagination-options-quick-jumper),
  .station-data-screen :deep(.ant-pagination-options-quick-jumper input) {
    color: #c7f7ff;
  }

  .station-data-screen :deep(.ant-pagination-item-active) {
    background: linear-gradient(135deg, rgba(14, 165, 233, 0.92), rgba(37, 99, 235, 0.92));
    border-color: rgba(103, 232, 249, 0.72);
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.24);
  }

  .station-data-screen :deep(.ant-pagination-item-active a) {
    color: #ffffff;
  }

  .station-data-screen :deep(.ant-pagination-disabled .ant-pagination-item-link),
  .station-data-screen :deep(.ant-pagination-item-ellipsis) {
    color: rgba(199, 247, 255, 0.42);
  }

  .station-data-screen :deep(.ant-btn-default) {
    color: #e6fbff;
    background:
      linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(129, 140, 248, 0.06)),
      rgba(2, 8, 23, 0.5);
    border-color: rgba(103, 232, 249, 0.32);
    box-shadow: inset 0 0 12px rgba(103, 232, 249, 0.06);
  }

  .station-data-screen :deep(.ant-btn-primary) {
    background: linear-gradient(135deg, #0ea5e9, #2563eb);
    border-color: rgba(103, 232, 249, 0.52);
    box-shadow: 0 0 18px rgba(56, 189, 248, 0.22);
  }

  .station-data-screen :deep(.ant-btn-primary.ant-btn-background-ghost) {
    color: #67e8f9;
    background: rgba(14, 165, 233, 0.1);
    border-color: rgba(103, 232, 249, 0.44);
  }

  .station-data-screen :deep(.ant-btn-primary.ant-btn-dangerous.ant-btn-background-ghost) {
    color: #fca5a5;
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(252, 165, 165, 0.42);
  }

  .station-data-screen :deep(.ant-btn-primary.ant-btn-dangerous.is-disabled),
  .station-data-screen :deep(.ant-btn-primary.ant-btn-dangerous.is-disabled:hover) {
    color: rgba(252, 165, 165, 0.62);
    cursor: not-allowed;
    background: rgba(127, 29, 29, 0.2);
    border-color: rgba(252, 165, 165, 0.28);
    box-shadow: none;
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
