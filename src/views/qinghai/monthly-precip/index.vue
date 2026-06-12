<template>
  <div class="station-data-screen">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button @click="handleImport">导入</a-button>
        <a-button @click="handleExport"> 导出 </a-button>
        <a-button
          type="primary"
          danger
          :disabled="!selected"
          @click="multipleRemove(waterMonthlyPrecipRemove)"
        >
          删除
        </a-button>
        <a-button type="primary" @click="handleAdd">新增站点数据</a-button>
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
                  title: `是否删除[${record.stationName || record.stationCode}-${record.year}]的站点数据?`,
                  confirm: handleDelete.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>

    <MonthlyPrecipModal @register="registerModal" @reload="reload" />
    <MonthlyPrecipImportModal @register="registerImportModal" @reload="reload" />
  </div>
</template>

<script setup lang="ts">
  import { downloadExcel } from '@/utils/file/download';
  import { BasicTable, TableAction, useTable } from '@/components/Table';
  import { useModal } from '@/components/Modal';
  import { IconEnum } from '@/enums/appEnum';
  import {
    waterMonthlyPrecipList,
    waterMonthlyPrecipRemove,
    waterMonthlyPrecipExport,
  } from '@/api/water/monthlyPrecip';
  import MonthlyPrecipImportModal from './MonthlyPrecipImportModal.vue';
  import MonthlyPrecipModal from './MonthlyPrecipModal.vue';
  import { columns, searchSchemas } from './monthlyPrecip.data';
  import dayjs from 'dayjs';

  defineOptions({ name: 'QinghaiMonthlyPrecip' });

  const [registerModal, { openModal }] = useModal();
  const [registerImportModal, { openModal: openImportModal }] = useModal();
  const [registerTable, { reload, multipleRemove, selected, getForm }] = useTable({
    rowSelection: {
      type: 'checkbox',
    },
    title: '站点数据列表',
    api: waterMonthlyPrecipList,
    rowKey: 'id',
    showIndexColumn: true,
    useSearchForm: true,
    pagination: {
      pageSize: 20,
    },
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
    beforeFetch(params) {
      return {
        ...params,
        year: params.year ? dayjs(params.year).format('YYYY') : '',
      };
    },
  });

  function handleExport() {
    const formData = getForm().getFieldsValue();
    downloadExcel(waterMonthlyPrecipExport, '站点数据列表', {
      ...formData,
      year: formData.year ? dayjs(formData.year).format('YYYY') : '',
    });
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
    await waterMonthlyPrecipRemove(record.id);
    await reload();
  }
</script>

<style scoped lang="less">
  .station-data-screen {
    height: 100%;
    padding: 0;
    overflow: hidden;
    color: #eff6ff;
    background:
      linear-gradient(rgba(59, 130, 246, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.035) 1px, transparent 1px),
      radial-gradient(circle at 22% 0, rgba(37, 99, 235, 0.18), transparent 28%),
      linear-gradient(180deg, #08111f, #020617);
    background-size:
      28px 28px,
      28px 28px,
      100% 100%,
      100% 100%;
  }

  .station-data-screen :deep(.vben-basic-table) {
    height: 100%;
    padding: 14px;
    overflow: hidden;
    background:
      linear-gradient(135deg, rgba(59, 130, 246, 0.14), transparent 26%),
      linear-gradient(315deg, rgba(37, 99, 235, 0.1), transparent 30%),
      linear-gradient(180deg, rgba(23, 37, 70, 0.9), rgba(13, 24, 48, 0.92));
    border: 1px solid rgba(59, 130, 246, 0.24);
    border-radius: 6px;
    box-shadow:
      inset 0 0 20px rgba(59, 130, 246, 0.08),
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
      linear-gradient(90deg, rgba(59, 130, 246, 0.1), transparent 52%), rgba(15, 30, 61, 0.58);
    border: 1px solid rgba(79, 121, 214, 0.22);
    border-radius: 4px;
  }

  .station-data-screen :deep(.ant-form),
  .station-data-screen :deep(.ant-table-wrapper),
  .station-data-screen :deep(.ant-table),
  .station-data-screen :deep(.ant-table-container),
  .station-data-screen :deep(.ant-table-content) {
    color: #f3f7ff;
    background: transparent;
  }

  .station-data-screen :deep(.ant-table-title),
  .station-data-screen :deep(.vben-basic-table-header__title),
  .station-data-screen :deep(.vben-basic-title),
  .station-data-screen :deep(.vben-basic-table-title) {
    color: #f8fbff;
    font-weight: 800;
    text-shadow:
      0 0 12px rgba(59, 130, 246, 0.58),
      0 0 22px rgba(59, 130, 246, 0.22);
  }

  .station-data-screen :deep(.ant-table-thead > tr > th) {
    color: #d8e2f3;
    background: rgba(24, 55, 106, 0.94);
    border-bottom: 1px solid rgba(79, 121, 214, 0.34);
  }

  .station-data-screen :deep(.ant-table-thead > tr > th.ant-table-cell-fix-left),
  .station-data-screen :deep(.ant-table-tbody > tr > td.ant-table-cell-fix-left),
  .station-data-screen :deep(.ant-table-thead > tr > th.ant-table-cell-fix-right),
  .station-data-screen :deep(.ant-table-tbody > tr > td.ant-table-cell-fix-right) {
    background: linear-gradient(90deg, rgba(18, 38, 76, 0.98), rgba(24, 55, 106, 0.98)), #12264c;
    box-shadow:
      -10px 0 18px rgba(2, 8, 23, 0.46),
      inset 1px 0 0 rgba(59, 130, 246, 0.18);
  }

  .station-data-screen :deep(.ant-table-tbody > tr > td) {
    color: #f3f7ff;
    background: rgba(15, 30, 61, 0.72);
    border-bottom: 1px solid rgba(79, 121, 214, 0.18);
  }

  .station-data-screen :deep(.ant-table-tbody > tr:hover > td) {
    background: rgba(37, 99, 235, 0.24);
  }

  .station-data-screen :deep(.ant-input),
  .station-data-screen :deep(.ant-input-affix-wrapper),
  .station-data-screen :deep(.ant-input-number),
  .station-data-screen :deep(.ant-picker),
  .station-data-screen :deep(.ant-select-selector) {
    color: #eff6ff;
    background: rgba(15, 30, 61, 0.78) !important;
    border-color: rgba(79, 121, 214, 0.36) !important;
    box-shadow:
      inset 0 0 14px rgba(59, 130, 246, 0.08),
      0 0 12px rgba(59, 130, 246, 0.08);
  }

  .station-data-screen :deep(.ant-input::placeholder),
  .station-data-screen :deep(.ant-select-selection-placeholder),
  .station-data-screen :deep(.ant-picker-input > input::placeholder) {
    color: rgba(203, 213, 225, 0.56);
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
    color: #d8e2f3;
  }

  .station-data-screen :deep(.ant-btn-default) {
    color: #eff6ff;
    background:
      linear-gradient(135deg, rgba(29, 78, 216, 0.12), rgba(37, 99, 235, 0.06)),
      rgba(2, 8, 23, 0.5);
    border-color: rgba(59, 130, 246, 0.32);
    box-shadow: inset 0 0 12px rgba(59, 130, 246, 0.06);
  }

  .station-data-screen :deep(.ant-btn-primary) {
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
    border-color: rgba(59, 130, 246, 0.52);
    box-shadow: 0 0 18px rgba(59, 130, 246, 0.22);
  }

  .station-data-screen :deep(.ant-btn-primary.ant-btn-background-ghost) {
    color: #7aa7f7;
    background: rgba(29, 78, 216, 0.1);
    border-color: rgba(59, 130, 246, 0.44);
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
</style>
