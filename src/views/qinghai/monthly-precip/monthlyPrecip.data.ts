import type { BasicColumn } from '@/components/Table';
import type { FormSchema } from '@/components/Form';

const monthColumns: BasicColumn[] = Array.from({ length: 12 }, (_, index) => {
  const month = String(index + 1).padStart(2, '0');
  return {
    title: `${index + 1}月(mm)`,
    dataIndex: `month${month}`,
    width: 100,
  };
});

const monthFormSchemas: FormSchema[] = Array.from({ length: 12 }, (_, index) => {
  const month = String(index + 1).padStart(2, '0');
  return {
    label: `${index + 1}月降水量(mm)`,
    field: `month${month}`,
    component: 'InputNumber',
    componentProps: {
      min: 0,
      precision: 2,
      style: { width: '100%' },
    },
  };
});

export const searchSchemas: FormSchema[] = [
  {
    label: '站名',
    field: 'stationName',
    component: 'Input',
  },
  {
    label: '编码',
    field: 'stationCode',
    component: 'Input',
  },
  {
    label: '年份',
    field: 'year',
    component: 'DatePicker',
    componentProps: {
      picker: 'year',
      style: { width: '100%' },
    },
  },
];

export const columns: BasicColumn[] = [
  {
    title: '站名',
    dataIndex: 'stationName',
    width: 140,
  },
  {
    title: '编码',
    dataIndex: 'stationCode',
    width: 120,
  },
  {
    title: '年份',
    dataIndex: 'year',
    width: 90,
  },
  ...monthColumns,
  {
    title: '年降水总量(mm)',
    dataIndex: 'annualTotal',
    width: 150,
  },
  {
    title: '备注',
    dataIndex: 'remark',
    width: 180,
  },
];

export const modalSchemas: FormSchema[] = [
  {
    label: 'ID',
    field: 'id',
    component: 'Input',
    show: false,
  },
  {
    label: '站名',
    field: 'stationId',
    slot: 'stationSelect',
    required: true,
  },
  {
    label: '编码',
    field: 'stationCode',
    component: 'Input',
    required: true,
  },
  {
    label: '站名',
    field: 'stationName',
    component: 'Input',
    show: false,
  },
  {
    label: '年份',
    field: 'year',
    component: 'DatePicker',
    required: true,
    componentProps: {
      picker: 'year',
      valueFormat: 'YYYY',
      style: { width: '100%' },
    },
  },
  ...monthFormSchemas,
  {
    label: '年降水总量(mm)',
    field: 'annualTotal',
    component: 'InputNumber',
    componentProps: {
      min: 0,
      precision: 2,
      style: { width: '100%' },
    },
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
    colProps: { span: 24 },
  },
];
