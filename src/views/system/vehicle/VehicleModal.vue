<template>
  <BasicModal
    v-bind="$attrs"
    :title="title"
    @register="registerInnerModal"
    @ok="handleSubmit"
    @cancel="resetForm"
  >
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script setup lang="ts">
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { BasicForm, useForm } from '@/components/Form';
  import { computed, ref, unref } from 'vue';
  import { vehicleInfo, vehicleAdd, vehicleUpdate } from '@/api/system/vehicle';
  import { modalSchemas } from './vehicle.data';

  defineOptions({ name: 'VehicleModal' });

  const emit = defineEmits(['register', 'reload']);

  const isUpdate = ref<boolean>(false);
  const title = computed<string>(() => {
    return isUpdate.value ? '编辑车辆信息' : '新增车辆信息';
  });

  const [registerInnerModal, { modalLoading, closeModal }] = useModalInner(
    async (data: { record?: Recordable; update: boolean }) => {
      modalLoading(true);
      const { record, update } = data;
      isUpdate.value = update;
      if (update && record) {
        const ret = await vehicleInfo(record.id);
        console.log(ret);
        ret.importCertificateNumber =  ret.importCertificateNumber
                                            ?  [ret.importCertificateNumber]
          : [];
        await setFieldsValue(ret);
      }
      modalLoading(false);
    },
  );

  const [registerForm, { setFieldsValue, resetForm, validate }] = useForm({
    labelWidth: 100,
    showActionButtonGroup: false,
    baseColProps: { span: 24 },
    schemas: modalSchemas,
  });

  async function handleSubmit() {
    try {
      modalLoading(true);
      const data = await validate();

      //文件字段是一个 只有一个元素的字符串数组。 提取为 字符串
// 处理 importCertificateNumber 字段
      if (data.importCertificateNumber && data.importCertificateNumber.length > 0) {
        data.importCertificateNumber = data.importCertificateNumber[0];
      } else {
        data.importCertificateNumber = '';
      }

// 处理 vehicleInspectionReport 字段
      if (data.vehicleInspectionReport && data.vehicleInspectionReport.length > 0) {
        data.vehicleInspectionReport = data.vehicleInspectionReport[0];
      } else {
        data.vehicleInspectionReport = '';
      }

// 处理 vehicleConsistencyCertificate 字段
      if (data.vehicleConsistencyCertificate && data.vehicleConsistencyCertificate.length > 0) {
        data.vehicleConsistencyCertificate = data.vehicleConsistencyCertificate[0];
      } else {
        data.vehicleConsistencyCertificate = '';
      }

// 处理 vehicleInformationSheet 字段
      if (data.vehicleInformationSheet && data.vehicleInformationSheet.length > 0) {
        data.vehicleInformationSheet = data.vehicleInformationSheet[0];
      } else {
        data.vehicleInformationSheet = '';
      }

// 处理 gasolineVehicleEnvironmentalList 字段
      if (data.gasolineVehicleEnvironmentalList && data.gasolineVehicleEnvironmentalList.length > 0) {
        data.gasolineVehicleEnvironmentalList = data.gasolineVehicleEnvironmentalList[0];
      } else {
        data.gasolineVehicleEnvironmentalList = '';
      }

// 处理 unifiedInvoice 字段
      if (data.unifiedInvoice && data.unifiedInvoice.length > 0) {
        data.unifiedInvoice = data.unifiedInvoice[0];
      } else {
        data.unifiedInvoice = '';
      }

// 处理 unifiedTaxReceipt 字段
      if (data.unifiedTaxReceipt && data.unifiedTaxReceipt.length > 0) {
        data.unifiedTaxReceipt = data.unifiedTaxReceipt[0];
      } else {
        data.unifiedTaxReceipt = '';
      }

// 处理 unifiedRegistration 字段
      if (data.unifiedRegistration && data.unifiedRegistration.length > 0) {
        data.unifiedRegistration = data.unifiedRegistration[0];
      } else {
        data.unifiedRegistration = '';
      }


      if (unref(isUpdate)) {
        await vehicleUpdate(data);
      } else {
        await vehicleAdd(data);
      }
      emit('reload');
      closeModal();
      await resetForm();
    } catch (e) {
      console.warn(e);
    } finally {
      modalLoading(false);
    }
  }
</script>

<style scoped></style>
