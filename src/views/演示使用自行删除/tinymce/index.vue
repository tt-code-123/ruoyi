<template>
  <PageWrapper>
    <div class="flex w-full flex-col gap-16px">
      <Alert type="info">
        <template #message> 使用自托管(本地)TinyMCE, 没有key的限制, 尽情享受吧! </template>
      </Alert>
      <Tinymce v-model="content" :height="800" />
    </div>
  </PageWrapper>
</template>
<script setup lang="ts">
  import { Tinymce } from '@/components/Tinymce';
  import { ref } from 'vue';
  import { PageWrapper } from '@/components/Page';
  import { Alert } from 'ant-design-vue';

  const content = ref('');
</script>

<style scoped></style>
