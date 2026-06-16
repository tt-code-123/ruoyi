import type { BasicColumn } from '@/components/Table';

export const precipitationColumns: BasicColumn[] = [
  {
    title: '分区编号',
    dataIndex: 'divCode',
    width: 110,
  },
  {
    title: '测站名',
    dataIndex: 'stationName',
    width: 130,
  },
  {
    title: 'Point_ID',
    dataIndex: 'pointId',
    width: 90,
  },
  {
    title: '站高程(m)',
    dataIndex: 'elevation',
    width: 110,
  },
  {
    title: '降水深(mm)',
    dataIndex: 'precipDepth',
    width: 120,
  },
  {
    title: '代表站',
    dataIndex: 'refStation',
    width: 140,
  },
  {
    title: '代表站高程(m)',
    dataIndex: 'refStationElevation',
    width: 140,
  },
  {
    title: '1956-2000(mm)',
    dataIndex: 'yearPrecipDepth',
    width: 140,
  },
  {
    title: '比例',
    dataIndex: 'ratio',
    width: 90,
  },
  {
    title: '计算公式',
    dataIndex: 'formula',
    width: 220,
  },
  {
    title: '结果',
    dataIndex: 'result',
    width: 100,
  },
];
