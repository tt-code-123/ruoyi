import { BasicColumn } from '@/components/Table';
import { FormSchema } from '@/components/Form';
import { getDictOptions } from '@/utils/dict';
import { useRender } from '@/hooks/component/useRender';
import {userOption} from "@/api/system/user";

export const formSchemas: FormSchema[] = [
  {
    label: '型号',
    field: 'model',
    component: 'Input',
  },
  {
    label: '所属客户',
    field: 'customerId',
    component: 'ApiSelect',
    componentProps: {
      showSearch: true,
      optionFilterProp: 'label',
      alwaysLoad: true,
      async api() {
        const data = await userOption();
        return data.map((item) => ({
          label: item.userName,
          value: item.userId,
        }));
      },
    },
  },
  {
    label: '证明书编号',
    field: 'certificateNumber',
    component: 'Input',
  },
  {
    label: '车架号(VIN)',
    field: 'vin',
    component: 'Input',
  },
  {
    label: '发动机号',
    field: 'engineNumber',
    component: 'Input',
  },
  {
    label: '车主信息',
    field: 'ownerInfo',
    component: 'Input',
  },
  {
    label: '发票套数',
    field: 'invoiceCount',
    component: 'Input',
  },
  {
    label: '进度',
    field: 'progress',
    component: 'Select',
      componentProps: {
        options: getDictOptions('license_progress')
      },
  },
  {
    label: '进口证明书',
    field: 'importCertificateNumber',
    component: 'Input',
  },
  {
    label: '进口机动车辆随车检验单',
    field: 'vehicleInspectionReport',
    component: 'Input',
  },
  {
    label: '车辆一致性证书',
    field: 'vehicleConsistencyCertificate',
    component: 'Input',
  },
  {
    label: '车辆电子信息单',
    field: 'vehicleInformationSheet',
    component: 'Input',
  },
  {
    label: '轻型汽油车环保信息随车清单',
    field: 'gasolineVehicleEnvironmentalList',
    component: 'Input',
  },
  {
    label: '机动车销售统一发票联',
    field: 'unifiedInvoice',
    component: 'Input',
  },
  {
    label: '机动车销售统一报税联',
    field: 'unifiedTaxReceipt',
    component: 'Input',
  },
  {
    label: '机动车销售统一注册登记联',
    field: 'unifiedRegistration',
    component: 'Input',
  },
];

const { renderDict } = useRender();
export const columns: BasicColumn[] = [
  // {
  //   title: 'ID',
  //   dataIndex: 'id',
  // },
  {
    title: '所属客户',
    dataIndex: 'customerName',
  },
  {
    title: '型号',
    dataIndex: 'model',
  },
  {
    title: '证明书编号',
    dataIndex: 'certificateNumber',
  },
  {
    title: '车架号(VIN)',
    dataIndex: 'vin',
  },
  {
    title: '发动机号',
    dataIndex: 'engineNumber',
  },
  {
    title: '车主信息',
    dataIndex: 'ownerInfo',
  },
  {
    title: '发票套数',
    dataIndex: 'invoiceCount',
  },
  {
    title: '进度',
    dataIndex: 'progress',
      customRender: ({ value }) => renderDict(value, 'license_progress'),
  },
  {
    title: '进口证明书',
    dataIndex: 'importCertificateNumber',
  },
  {
    title: '进口机动车辆随车检验单',
    dataIndex: 'vehicleInspectionReport',
  },
  {
    title: '车辆一致性证书',
    dataIndex: 'vehicleConsistencyCertificate',
  },
  {
    title: '车辆电子信息单',
    dataIndex: 'vehicleInformationSheet',
  },
  {
    title: '轻型汽油车环保信息随车清单',
    dataIndex: 'gasolineVehicleEnvironmentalList',
  },
  {
    title: '机动车销售统一发票联',
    dataIndex: 'unifiedInvoice',
  },
  {
    title: '机动车销售统一报税联',
    dataIndex: 'unifiedTaxReceipt',
  },
  {
    title: '机动车销售统一注册登记联',
    dataIndex: 'unifiedRegistration',
  },
];

export const modalSchemas: FormSchema[] = [
  {
    label: 'ID',
    field: 'id',
    required: false,
    component: 'Input',
      show: false,
  },
  {
    label: '所属客户',
    field: 'customerId',
    component: 'ApiSelect',
    componentProps: {
      showSearch: true,
      optionFilterProp: 'label',
      alwaysLoad: true,
      async api() {
        const data = await userOption();
        return data.map((item) => ({
          label: item.userName,
          value: item.userId,
        }));
      },
    },
  },
  {
    label: '型号',
    field: 'model',
    required: false,
    component: 'Input',
  },
  {
    label: '证明书编号',
    field: 'certificateNumber',
    required: false,
    component: 'Input',
  },
  {
    label: '车架号(VIN)',
    field: 'vin',
    required: true,
    component: 'Input',
  },
  {
    label: '发动机号',
    field: 'engineNumber',
    required: false,
    component: 'Input',
  },
  {
    label: '车主信息',
    field: 'ownerInfo',
    required: true,
    component: 'Input',
  },
  {
    label: '发票套数',
    field: 'invoiceCount',
    required: true,
    component: 'Input',
  },
  {
    label: '进度',
    field: 'progress',
    required: true,
    component: 'Select',
      componentProps: {
        options: getDictOptions('license_progress')
      },
  },
  {
    label: '进口证明书',
    field: 'importCertificateNumber',
    required: false,
    component: 'ImageUpload',
      /**
      * 注意这里获取为数组 需要自行定义回显/提交
      */
      componentProps: {
        //文件大小
        maxSize: 100 * 1024 * 1024,
        // accept: ['xlsx'], // 不支持type/*的写法 建议使用拓展名
        maxNumber: 1, // 最大上传文件数
        resultField: 'url', // 上传成功后返回的字段名 默认url 可选['ossId', 'url', 'fileName']
      },
  },
  {
    label: '进口机动车辆随车检验单',
    field: 'vehicleInspectionReport',
    required: false,
    component: 'ImageUpload',
      /**
      * 注意这里获取为数组 需要自行定义回显/提交
      */
      componentProps: {
        //文件大小
        maxSize: 100 * 1024 * 1024,
        // accept: ['xlsx'], // 不支持type/*的写法 建议使用拓展名
        // maxNumber: 1, // 最大上传文件数
        // resultField: 'url', // 上传成功后返回的字段名 默认url 可选['ossId', 'url', 'fileName']
      },
  },
  {
    label: '车辆一致性证书',
    field: 'vehicleConsistencyCertificate',
    required: false,
    component: 'ImageUpload',
      /**
      * 注意这里获取为数组 需要自行定义回显/提交
      */
      componentProps: {
        //文件大小
        maxSize: 100 * 1024 * 1024,
        // accept: ['xlsx'], // 不支持type/*的写法 建议使用拓展名
        // maxNumber: 1, // 最大上传文件数
        // resultField: 'url', // 上传成功后返回的字段名 默认url 可选['ossId', 'url', 'fileName']
      },
  },
  {
    label: '车辆电子信息单',
    field: 'vehicleInformationSheet',
    required: false,
    component: 'ImageUpload',
      /**
      * 注意这里获取为数组 需要自行定义回显/提交
      */
      componentProps: {
        //文件大小
        maxSize: 100 * 1024 * 1024,
        // accept: ['xlsx'], // 不支持type/*的写法 建议使用拓展名
        // maxNumber: 1, // 最大上传文件数
        // resultField: 'url', // 上传成功后返回的字段名 默认url 可选['ossId', 'url', 'fileName']
      },
  },
  {
    label: '轻型汽油车环保信息随车清单',
    field: 'gasolineVehicleEnvironmentalList',
    required: false,
    component: 'ImageUpload',
      /**
      * 注意这里获取为数组 需要自行定义回显/提交
      */
      componentProps: {
        //文件大小
        maxSize: 100 * 1024 * 1024,
        // accept: ['xlsx'], // 不支持type/*的写法 建议使用拓展名
        // maxNumber: 1, // 最大上传文件数
        // resultField: 'url', // 上传成功后返回的字段名 默认url 可选['ossId', 'url', 'fileName']
      },
  },
  {
    label: '机动车销售统一发票联',
    field: 'unifiedInvoice',
    required: false,
    component: 'ImageUpload',
      /**
      * 注意这里获取为数组 需要自行定义回显/提交
      */
      componentProps: {
        //文件大小
        maxSize: 100 * 1024 * 1024,
        // accept: ['xlsx'], // 不支持type/*的写法 建议使用拓展名
        // maxNumber: 1, // 最大上传文件数
        // resultField: 'url', // 上传成功后返回的字段名 默认url 可选['ossId', 'url', 'fileName']
      },
  },
  {
    label: '机动车销售统一报税联',
    field: 'unifiedTaxReceipt',
    required: false,
    component: 'ImageUpload',
      /**
      * 注意这里获取为数组 需要自行定义回显/提交
      */
      componentProps: {
        //文件大小
        maxSize: 100 * 1024 * 1024,
        // accept: ['xlsx'], // 不支持type/*的写法 建议使用拓展名
        // maxNumber: 1, // 最大上传文件数
        // resultField: 'url', // 上传成功后返回的字段名 默认url 可选['ossId', 'url', 'fileName']
      },
  },
  {
    label: '机动车销售统一注册登记联',
    field: 'unifiedRegistration',
    required: false,
    component: 'ImageUpload',
      /**
      * 注意这里获取为数组 需要自行定义回显/提交
      */
      componentProps: {
        //文件大小
        maxSize: 100 * 1024 * 1024,
        // accept: ['xlsx'], // 不支持type/*的写法 建议使用拓展名
        // maxNumber: 1, // 最大上传文件数
        // resultField: 'url', // 上传成功后返回的字段名 默认url 可选['ossId', 'url', 'fileName']
      },
  },
];
