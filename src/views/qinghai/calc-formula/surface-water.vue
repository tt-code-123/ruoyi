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
    waterSurfaceWaterCalcFormulaList,
    waterSurfaceWaterLevel1Regions,
    waterSurfaceWaterLevel3Regions,
  } from '@/api/water/calcFormula';
  import { surfaceWaterColumns } from './surfaceWater.data';

  defineOptions({ name: 'QinghaiSurfaceWaterCalcFormula' });

  const router = useRouter();
  const level1Options = ref<{ label: string; value: string }[]>([]);
  const level3Options = ref<{ label: string; value: string }[]>([]);

  const searchSchemas: FormSchema[] = [
    {
      label: '一级区',
      field: 'level1Region',
      component: 'Select',
      componentProps: ({ formModel }: { formModel: Recordable }) => ({
        allowClear: true,
        options: level1Options.value,
        placeholder: '请选择一级区',
        onChange: async (value) => {
          formModel.level3Region = undefined;
          level3Options.value = [];
          if (typeof value === 'string' && value) {
            const regions = await waterSurfaceWaterLevel3Regions(value);
            level3Options.value = regions.map((region) => ({
              label: region,
              value: region,
            }));
          }
        },
      }),
    },
    {
      label: '三级区',
      field: 'level3Region',
      component: 'Select',
      componentProps: ({ formModel }: { formModel: Recordable }) => ({
        allowClear: true,
        disabled: !formModel.level1Region,
        options: level3Options.value,
        placeholder: '请选择三级区',
      }),
    },
    {
      label: '市州',
      field: 'city',
      component: 'Input',
      componentProps: {
        placeholder: '请输入市州',
      },
    },
  ];

  const [registerTable] = useTable({
    title: '地表水计算公式',
    api: waterSurfaceWaterCalcFormulaList,
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
    columns: surfaceWaterColumns,
  });

  onMounted(async () => {
    const regions = await waterSurfaceWaterLevel1Regions();
    level1Options.value = regions.map((region) => ({
      label: region,
      value: region,
    }));
  });

  function goBack() {
    router.push('/qinghai/calc-formula');
  }
</script>

<style scoped lang="less">
  @import './sharedStyle.less';
</style>
