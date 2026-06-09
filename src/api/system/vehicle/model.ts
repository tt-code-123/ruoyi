import { BaseEntity, PageQuery } from '@/api/base';

export interface VehicleVO {
  /**
   * ID
   */
  id: string | number;

  /**
   * 型号
   */
  model: string;

  /**
   * 证明书编号
   */
  certificateNumber: string;

  /**
   * 车架号(VIN)
   */
  vin: string;

  /**
   * 发动机号
   */
  engineNumber: string;

  /**
   * 车主信息
   */
  ownerInfo: string;

  /**
   * 发票套数
   */
  invoiceCount: number;

  /**
   * 进度
   */
  progress: string;

  /**
   * 进口证明书
   */
  importCertificateNumber: string;

  /**
   * 进口机动车辆随车检验单
   */
  vehicleInspectionReport: string;

  /**
   * 车辆一致性证书
   */
  vehicleConsistencyCertificate: string;

  /**
   * 车辆电子信息单
   */
  vehicleInformationSheet: string;

  /**
   * 轻型汽油车环保信息随车清单
   */
  gasolineVehicleEnvironmentalList: string;

  /**
   * 机动车销售统一发票联
   */
  unifiedInvoice: string;

  /**
   * 机动车销售统一报税联
   */
  unifiedTaxReceipt: string;

  /**
   * 机动车销售统一注册登记联
   */
  unifiedRegistration: string;

}

export interface VehicleForm extends BaseEntity {
  /**
   * ID
   */
  id?: string | number;

  /**
   * 型号
   */
  model?: string;

  /**
   * 证明书编号
   */
  certificateNumber?: string;

  /**
   * 车架号(VIN)
   */
  vin?: string;

  /**
   * 发动机号
   */
  engineNumber?: string;

  /**
   * 车主信息
   */
  ownerInfo?: string;

  /**
   * 发票套数
   */
  invoiceCount?: number;

  /**
   * 进度
   */
  progress?: string;

  /**
   * 进口证明书
   */
  importCertificateNumber?: string;

  /**
   * 进口机动车辆随车检验单
   */
  vehicleInspectionReport?: string;

  /**
   * 车辆一致性证书
   */
  vehicleConsistencyCertificate?: string;

  /**
   * 车辆电子信息单
   */
  vehicleInformationSheet?: string;

  /**
   * 轻型汽油车环保信息随车清单
   */
  gasolineVehicleEnvironmentalList?: string;

  /**
   * 机动车销售统一发票联
   */
  unifiedInvoice?: string;

  /**
   * 机动车销售统一报税联
   */
  unifiedTaxReceipt?: string;

  /**
   * 机动车销售统一注册登记联
   */
  unifiedRegistration?: string;

}

export interface VehicleQuery extends PageQuery {
  /**
   * 型号
   */
  model?: string;

  /**
   * 证明书编号
   */
  certificateNumber?: string;

  /**
   * 车架号(VIN)
   */
  vin?: string;

  /**
   * 发动机号
   */
  engineNumber?: string;

  /**
   * 车主信息
   */
  ownerInfo?: string;

  /**
   * 发票套数
   */
  invoiceCount?: number;

  /**
   * 进度
   */
  progress?: string;

  /**
   * 进口证明书
   */
  importCertificateNumber?: string;

  /**
   * 进口机动车辆随车检验单
   */
  vehicleInspectionReport?: string;

  /**
   * 车辆一致性证书
   */
  vehicleConsistencyCertificate?: string;

  /**
   * 车辆电子信息单
   */
  vehicleInformationSheet?: string;

  /**
   * 轻型汽油车环保信息随车清单
   */
  gasolineVehicleEnvironmentalList?: string;

  /**
   * 机动车销售统一发票联
   */
  unifiedInvoice?: string;

  /**
   * 机动车销售统一报税联
   */
  unifiedTaxReceipt?: string;

  /**
   * 机动车销售统一注册登记联
   */
  unifiedRegistration?: string;

  /**
    * 日期范围参数
    */
  params?: any;
}
