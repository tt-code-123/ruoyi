<template>
  <PageWrapper dense>
    <div class="station-overview">
      <div v-for="item in overviewCards" :key="item.type" class="overview-card">
        <span>{{ item.type }}</span>
        <strong>{{ formatNumber(item.count) }}</strong>
        <em>{{ formatRatio(item.ratio) }}</em>
      </div>
    </div>

    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button :loading="importing" @click="handleImportAll">导入</a-button>
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
  </PageWrapper>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { message } from 'ant-design-vue';
  import { PageWrapper } from '@/components/Page';
  import { BasicTable, TableAction, useTable } from '@/components/Table';
  import { useModal } from '@/components/Modal';
  import { IconEnum } from '@/enums/appEnum';
  import { downloadExcel } from '@/utils/file/download';
  import { waterStationCountByType } from '@/api/water/dashboard';
  import type { WaterStationCountByTypeVO } from '@/api/water/dashboard/model';
  import {
    waterStationExport,
    waterStationImportAll,
    waterStationList,
    waterStationRemove,
  } from '@/api/water/station';
  import StationModal from './StationModal.vue';
  import { columns, searchSchemas } from './station.data';

  defineOptions({ name: 'QinghaiStationData' });

  const importing = ref(false);
  const overviewCards = ref<WaterStationCountByTypeVO[]>([]);

  const [registerModal, { openModal }] = useModal();
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

  function handleEdit(record: Recordable) {
    openModal(true, { record, update: true });
  }

  async function handleDelete(record: Recordable) {
    await waterStationRemove(record.stationId);
    await handleReload();
  }

  async function handleImportAll() {
    try {
      importing.value = true;
      await waterStationImportAll();
      message.success('导入任务已完成');
      await handleReload();
    } finally {
      importing.value = false;
    }
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
</script>

<style scoped lang="less">
  .station-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 12px;
  }

  .overview-card {
    min-height: 88px;
    padding: 14px 16px;
    background: #fff;
    border: 1px solid #edf1f7;
    border-radius: 8px;

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
</style>
