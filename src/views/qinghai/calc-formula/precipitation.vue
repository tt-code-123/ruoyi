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

  const router = useRouter();
  const yearOptions = ref<{ label: string; value: number }[]>([]);

  const searchSchemas: FormSchema[] = [
    {
      label: '年份',
      field: 'year',
      component: 'Select',
      componentProps: () => ({
        allowClear: true,
        options: yearOptions.value,
        placeholder: '请选择年份',
      }),
    },
  ];

  const [registerTable] = useTable({
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
    columns: precipitationColumns,
  });

  onMounted(async () => {
    const years = await waterPrecipitationCalcFormulaYears();
    yearOptions.value = years.map((year) => ({
      label: String(year),
      value: year,
    }));
  });

  function goBack() {
    router.push('/qinghai/calc-formula');
  }
</script>

<style scoped lang="less">
  @import './sharedStyle.less';
</style>
