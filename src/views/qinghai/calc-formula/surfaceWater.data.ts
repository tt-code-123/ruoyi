import type { BasicColumn } from '@/components/Table';

export const surfaceWaterColumns: BasicColumn[] = [
  {
    title: '一级区',
    dataIndex: 'level1Region',
    width: 130,
  },
  {
    title: '二级区',
    dataIndex: 'level2Region',
    width: 150,
  },
  {
    title: '三级区',
    dataIndex: 'level3Region',
    width: 160,
  },
  {
    title: '市州行政区',
    dataIndex: 'city',
    width: 120,
  },
  {
    title: '县级行政区',
    dataIndex: 'county',
    width: 120,
  },
  {
    title: '编号',
    dataIndex: 'id',
    width: 90,
  },
  {
    title: '分区编号',
    dataIndex: 'divCode',
    width: 110,
  },
  {
    title: '面积',
    dataIndex: 'totalArea',
    width: 110,
  },
  {
    title: '代表站（计算公式）',
    dataIndex: 'formula',
    width: 150,
  },
];
