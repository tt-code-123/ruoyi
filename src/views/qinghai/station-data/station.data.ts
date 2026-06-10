import type { BasicColumn } from '@/components/Table';
import type { FormSchema } from '@/components/Form';

const stationTypeOptions = [
  { label: '水文', value: '水文' },
  { label: '气象', value: '气象' },
  { label: '雨量', value: '雨量' },
  { label: '中小河流', value: '中小河流' },
];

export const searchSchemas: FormSchema[] = [
  {
    label: '站名',
    field: 'stationName',
    component: 'Input',
  },
  {
    label: '测站编码',
    field: 'stationCode',
    component: 'Input',
  },
  {
    label: '站别',
    field: 'stationType',
    component: 'Select',
    componentProps: {
      options: stationTypeOptions,
    },
  },
  {
    label: '市州',
    field: 'city',
    component: 'Input',
  },
  {
    label: '水系',
    field: 'riverSystem',
    component: 'Input',
  },
  {
    label: '三级区',
    field: 'waterRegion3',
    component: 'Input',
  },
];

export const columns: BasicColumn[] = [
  {
    title: '测站编码',
    dataIndex: 'stationCode',
    width: 130,
  },
  {
    title: '站名',
    dataIndex: 'stationName',
    width: 150,
  },
  {
    title: '站别',
    dataIndex: 'stationType',
    width: 100,
  },
  {
    title: '水系',
    dataIndex: 'riverSystem',
    width: 150,
  },
  {
    title: '河流',
    dataIndex: 'riverName',
    width: 130,
  },
  {
    title: '水资源三级区',
    dataIndex: 'waterRegion3',
    width: 180,
  },
  {
    title: '市州',
    dataIndex: 'city',
    width: 110,
  },
  {
    title: '县区',
    dataIndex: 'county',
    width: 120,
  },
  {
    title: '经度',
    dataIndex: 'longitude',
    width: 100,
  },
  {
    title: '纬度',
    dataIndex: 'latitude',
    width: 100,
  },
  {
    title: '高程(m)',
    dataIndex: 'elevation',
    width: 100,
  },
  {
    title: '站点归属',
    dataIndex: 'stationBelong',
    width: 110,
  },
];

export const modalSchemas: FormSchema[] = [
  {
    label: '站点ID',
    field: 'stationId',
    component: 'Input',
    show: false,
  },
  {
    label: '测站编码',
    field: 'stationCode',
    component: 'Input',
    required: true,
  },
  {
    label: '站名',
    field: 'stationName',
    component: 'Input',
    required: true,
  },
  {
    label: '站别',
    field: 'stationType',
    component: 'Select',
    required: true,
    componentProps: {
      options: stationTypeOptions,
    },
  },
  {
    label: '水系',
    field: 'riverSystem',
    component: 'Input',
  },
  {
    label: '河流',
    field: 'riverName',
    component: 'Input',
  },
  {
    label: '三级区',
    field: 'waterRegion3',
    component: 'Input',
  },
  {
    label: '市州',
    field: 'city',
    component: 'Input',
  },
  {
    label: '县区',
    field: 'county',
    component: 'Input',
  },
  {
    label: '经度',
    field: 'longitude',
    component: 'InputNumber',
    required: true,
    componentProps: {
      precision: 6,
      style: { width: '100%' },
    },
  },
  {
    label: '纬度',
    field: 'latitude',
    component: 'InputNumber',
    required: true,
    componentProps: {
      precision: 6,
      style: { width: '100%' },
    },
  },
  {
    label: '集水面积',
    field: 'drainageArea',
    component: 'InputNumber',
    componentProps: {
      precision: 2,
      style: { width: '100%' },
    },
  },
  {
    label: '高程',
    field: 'elevation',
    component: 'InputNumber',
    componentProps: {
      precision: 2,
      style: { width: '100%' },
    },
  },
  {
    label: '设站年月',
    field: 'establishYear',
    component: 'Input',
  },
  {
    label: '站点归属',
    field: 'stationBelong',
    component: 'Input',
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
    colProps: { span: 24 },
  },
];
