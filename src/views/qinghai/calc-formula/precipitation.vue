<template>
  <div class="calc-formula-screen">
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button @click="goBack">返回管理页</a-button>
      </template>
    </BasicTable>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { BasicTable, useTable } from '@/components/Table';
  import type { FormSchema } from '@/components/Form';
  import {
    waterPrecipitationCalcFormulaList,
    waterPrecipitationCalcFormulaYears,
  } from '@/api/water/calcFormula';
  import { precipitationColumns } from './precipitation.data';

  defineOptions({ name: 'QinghaiPrecipitationCalcFormula' });

  const DEFAULT_YEAR_COLUMN_TITLE = '1956-2000(mm)';

  const router = useRouter();
  const yearOptions = ref<{ label: string; value: number }[]>([]);

  const searchSchemas: FormSchema[] = [
    {
      label: '年份',
      field: 'yearLabel',
      component: 'Select',
      componentProps: () => ({
        allowClear: true,
        options: yearOptions.value,
        placeholder: '请选择年份',
        onChange: (value) => {
          updateYearColumnTitle(value ? String(value) : DEFAULT_YEAR_COLUMN_TITLE);
        },
      }),
    },
  ];

  const [registerTable, { getForm, reload, setColumns }] = useTable({
    title: '降水计算公式',
    api: waterPrecipitationCalcFormulaList,
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
    columns: getPrecipitationColumns(DEFAULT_YEAR_COLUMN_TITLE),
  });

  onMounted(async () => {
    const years = await waterPrecipitationCalcFormulaYears();
    yearOptions.value = years.map((year) => ({
      label: String(year),
      value: year,
    }));

    const firstYear = years[0];
    if (firstYear) {
      await getForm().setFieldsValue({ yearLabel: firstYear });
      updateYearColumnTitle(String(firstYear));
      await reload();
    }
  });

  function goBack() {
    router.push('/qinghai/calc-formula');
  }

  function getPrecipitationColumns(yearColumnTitle: string) {
    return precipitationColumns.map((column) =>
      column.dataIndex === 'yearPrecipDepth' ? { ...column, title: yearColumnTitle } : column,
    );
  }

  function updateYearColumnTitle(yearColumnTitle: string) {
    setColumns(getPrecipitationColumns(yearColumnTitle));
  }
</script>

<style scoped lang="less">
  @import './sharedStyle.less';
</style>
