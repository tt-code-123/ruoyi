<template>
  <BasicModal
    v-bind="$attrs"
    title="导入站点数据"
    @register="registerInnerModal"
    @ok="handleSubmit"
    @cancel="clearFileList"
  >
    <UploadDragger
      v-model:fileList="fileList"
      :maxCount="1"
      :showUploadList="true"
      :beforeUpload="beforeUpload"
      accept=".xls,.xlsx"
    >
      <p class="ant-upload-drag-icon">
        <inbox-outlined />
      </p>
      <p class="ant-upload-text">点击或拖拽 Excel 文件到此处上传</p>
      <p class="ant-upload-hint">支持 .xls、.xlsx 文件</p>
    </UploadDragger>
  </BasicModal>
</template>

<script setup lang="ts">
  import { ref, unref } from 'vue';
  import { InboxOutlined } from '@ant-design/icons-vue';
  import { message, Upload } from 'ant-design-vue';
  import type { UploadFile } from 'ant-design-vue/es/upload/interface';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { waterMonthlyPrecipImport } from '@/api/water/monthlyPrecip';

  const UploadDragger = Upload.Dragger;

  defineOptions({ name: 'QinghaiMonthlyPrecipImportModal' });

  const emit = defineEmits(['register', 'reload']);

  const fileList = ref<UploadFile[]>([]);
  const [registerInnerModal, { modalLoading, closeModal }] = useModalInner();

  function beforeUpload(file: File) {
    const isExcel = /\.(xls|xlsx)$/i.test(file.name);
    if (!isExcel) {
      message.warning('请选择 Excel 文件');
      return Upload.LIST_IGNORE;
    }
    return false;
  }

  async function handleSubmit() {
    if (fileList.value.length !== 1) {
      message.warning('请选择一个 Excel 文件');
      return;
    }

    try {
      modalLoading(true);
      await waterMonthlyPrecipImport(unref(fileList)[0].originFileObj!);
      message.success('导入完成');
      emit('reload');
      closeModal();
      clearFileList();
    } finally {
      modalLoading(false);
    }
  }

  function clearFileList() {
    fileList.value = [];
  }
</script>
