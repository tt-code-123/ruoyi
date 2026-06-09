<template>
  <div v-if="showToggle && !getIsMobile">
    <Select
      multiple
      v-model:value="selected"
      placeholder="选择租户"
      class="w-60"
      allowClear
      :option-label-prop="'title'"
      @select="onSelected"
      @deselect="onDeselect"
    >
      <template #suffixIcon>
        <Icon icon="mdi:company" />
      </template>
      <SelectOption
        v-for="item in tenantList"
        :key="item.tenantId"
        :value="item.tenantId"
        :title="item.companyName"
      >
        <div class="flex justify-between w-full">
          <span class="overflow-hidden">
            {{ item.companyName }}
          </span>
          <Tag color="blue">{{ item.tenantId }}</Tag>
        </div>
      </SelectOption>
    </Select>
  </div>
</template>

<script setup lang="ts">
  import { Select, Tag } from 'ant-design-vue';
  import { ref, computed, onMounted, unref } from 'vue';
  import { useUserStore } from '@/store/modules/user';
  import { RoleEnum } from '@/enums/roleEnum';
  import { tenantDynamicToggle, tenantDynamicClear } from '@/api/system/tenant';
  import { useGo } from '@/hooks/web/usePage';
  import { PageEnum } from '@/enums/pageEnum';
  import { useTabs } from '@/hooks/web/useTabs';
  import { useMessage } from '@/hooks/web/useMessage';
  import { useTenantStore } from '@/store/modules/tenant';
  import { storeToRefs } from 'pinia';
  import { useAppInject } from '@/hooks/web/useAppInject';
  import Icon from '@/components/Icon/Icon.vue';

  const SelectOption = Select.Option;

  /** 手机端不显示租户切换 */
  const { getIsMobile } = useAppInject();

  const { roleList } = useUserStore();
  const showToggle = computed<boolean>(() => {
    // 超级管理员 && 启用租户
    return roleList.includes(RoleEnum.SUPER_ADMIN) && unref(tenantEnabled);
  });

  // 上一次选择的租户
  const lastSelected = ref<string>();
  // 当前选择租户的id
  const selected = ref<string>();

  const tenantStore = useTenantStore();
  const { initTenant, setChecked } = tenantStore;
  const { tenantEnabled, tenantList } = storeToRefs(tenantStore);
  onMounted(async () => {
    if (!roleList.includes(RoleEnum.SUPER_ADMIN)) {
      return;
    }
    await initTenant();
  });

  const go = useGo();
  const { closeAll } = useTabs();
  const { createMessage } = useMessage();

  function close(checked: boolean) {
    // store设置状态
    setChecked(checked);
    // 需要关闭全部标签页
    closeAll();
    // 切换完加载首页
    go(PageEnum.BASE_HOME);
  }

  /**
   * 为什么要用any ide报错😅 实际类型为string
   */
  async function onSelected(tenantId: any, option: any) {
    if (unref(lastSelected) === tenantId) {
      // createMessage.info('选择一致');
      return;
    }
    await tenantDynamicToggle(tenantId);
    lastSelected.value = tenantId;
    createMessage.success('切换当前租户为: ' + option.title);
    close(true);
  }

  async function onDeselect() {
    await tenantDynamicClear();
    createMessage.success('还原为默认租户');
    lastSelected.value = '';
    close(false);
  }
</script>

<style scoped>
  :deep(.ant-tag) {
    margin-inline-end: 0;
  }
</style>
