<template>
  <BasicModal
    v-bind="$attrs"
    :title="title"
    :width="960"
    @register="registerInnerModal"
    @ok="handleSubmit"
    @cancel="resetForm"
  >
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script setup lang="ts">
  import { computed, ref, unref } from 'vue';
  import { BasicForm, useForm } from '@/components/Form';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { waterStationAdd, waterStationInfo, waterStationUpdate } from '@/api/water/station';
  import { modalSchemas } from './station.data';

  defineOptions({ name: 'QinghaiStationModal' });

  const emit = defineEmits(['register', 'reload']);
  const isUpdate = ref(false);

  const title = computed(() => (isUpdate.value ? '编辑站点' : '新增站点'));

  const [registerForm, { resetForm, setFieldsValue, validate }] = useForm({
    layout: 'vertical',
    showActionButtonGroup: false,
    rowProps: { gutter: [12, 4] },
    baseColProps: { xs: 24, sm: 24, md: 12 },
    schemas: modalSchemas,
  });

  const [registerInnerModal, { closeModal, modalLoading }] = useModalInner(
    async (data: { record?: Recordable; update: boolean }) => {
      modalLoading(true);
      await resetForm();
      isUpdate.value = data.update;
      if (data.update && data.record?.stationId) {
        const ret = await waterStationInfo(data.record.stationId);
        await setFieldsValue(ret);
      } else if (data.record) {
        await setFieldsValue(data.record);
      }
      modalLoading(false);
    },
  );

  async function handleSubmit() {
    try {
      modalLoading(true);
      const data = await validate();
      if (unref(isUpdate)) {
        await waterStationUpdate(data);
      } else {
        await waterStationAdd(data);
      }
      emit('reload');
      closeModal();
      await resetForm();
    } finally {
      modalLoading(false);
    }
  }
</script>
