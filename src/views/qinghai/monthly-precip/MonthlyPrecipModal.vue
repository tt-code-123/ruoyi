<template>
  <BasicModal
    v-bind="$attrs"
    :title="title"
    :width="1040"
    @register="registerInnerModal"
    @ok="handleSubmit"
    @cancel="resetForm"
  >
    <BasicForm @register="registerForm">
      <template #stationSelect="{ model, field }">
        <Select
          v-model:value="model[field]"
          :filter-option="false"
          :loading="stationLoading"
          :options="stationOptions"
          allow-clear
          show-search
          placeholder="请选择站名"
          style="width: 100%"
          @change="handleStationChange"
          @dropdown-visible-change="handleStationDropdownVisibleChange"
          @popup-scroll="handleStationPopupScroll"
          @search="handleStationSearch"
        >
          <template #notFoundContent>
            <Spin v-if="stationLoading" size="small" />
            <span v-else>暂无数据</span>
          </template>
        </Select>
      </template>
    </BasicForm>
  </BasicModal>
</template>

<script setup lang="ts">
  import dayjs from 'dayjs';
  import { computed, ref, unref } from 'vue';
  import { Select, Spin } from 'ant-design-vue';
  import type { SelectValue } from 'ant-design-vue/es/select';
  import { BasicForm, useForm } from '@/components/Form';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { useDebounceFn } from '@vueuse/core';
  import {
    waterMonthlyPrecipAdd,
    waterMonthlyPrecipInfo,
    waterMonthlyPrecipUpdate,
  } from '@/api/water/monthlyPrecip';
  import { waterStationList } from '@/api/water/station';
  import type { WaterStationVO } from '@/api/water/station/model';
  import { modalSchemas } from './monthlyPrecip.data';

  defineOptions({ name: 'QinghaiMonthlyPrecipModal' });

  const emit = defineEmits(['register', 'reload']);
  const isUpdate = ref(false);
  const stationPageSize = 20;
  const stationPageNum = ref(1);
  const stationTotal = ref(0);
  const stationKeyword = ref('');
  const stationLoading = ref(false);
  const stationHasMore = ref(true);
  const stationOptions = ref<StationOption[]>([]);

  const title = computed(() => (isUpdate.value ? '编辑站点数据' : '新增站点数据'));

  interface StationOption {
    label: string;
    value: number;
    stationId: number;
    stationName: string;
    stationCode?: string;
  }

  const [registerForm, { resetForm, setFieldsValue, validate }] = useForm({
    layout: 'vertical',
    showActionButtonGroup: false,
    rowProps: { gutter: [12, 4] },
    baseColProps: { xs: 24, sm: 24, md: 8, lg: 6 },
    schemas: modalSchemas,
  });

  const [registerInnerModal, { closeModal, modalLoading }] = useModalInner(
    async (data: { record?: Recordable; update: boolean }) => {
      modalLoading(true);
      await resetForm();
      resetStationOptions();
      isUpdate.value = data.update;
      let currentStation: Partial<WaterStationVO> | undefined;
      if (data.update && data.record?.id) {
        const ret = await waterMonthlyPrecipInfo(data.record.id);
        currentStation = ret;
        await setFieldsValue({
          ...ret,
          year: ret.year ? String(ret.year) : null,
        });
      } else if (data.record) {
        currentStation = data.record;
        await setFieldsValue(data.record);
      }
      await loadStationOptions(true);
      ensureStationOption(currentStation);
      modalLoading(false);
    },
  );

  async function handleSubmit() {
    try {
      modalLoading(true);
      const data = await validate();
      const station = findStationOption(data.stationId);
      const submitData = {
        ...data,
        stationId: data.stationId,
        stationName: station?.stationName || data.stationName,
        stationCode: station?.stationCode || data.stationCode,
        year: Number(dayjs(data.year).format('YYYY')),
      };
      if (unref(isUpdate)) {
        await waterMonthlyPrecipUpdate(submitData);
      } else {
        await waterMonthlyPrecipAdd(submitData);
      }
      emit('reload');
      closeModal();
      await resetForm();
    } finally {
      modalLoading(false);
    }
  }

  function resetStationOptions() {
    stationPageNum.value = 1;
    stationTotal.value = 0;
    stationKeyword.value = '';
    stationHasMore.value = true;
    stationOptions.value = [];
  }

  function getStationRows(res: unknown) {
    if (Array.isArray(res)) {
      return { rows: res as WaterStationVO[], total: res.length, hasTotal: false };
    }
    const data = (res || {}) as Recordable;
    const rows = Array.isArray(data.rows)
      ? data.rows
      : Array.isArray(data.records)
        ? data.records
        : Array.isArray(data.list)
          ? data.list
          : [];
    const hasTotal = data.total !== undefined || data.totalCount !== undefined;
    return {
      rows: rows as WaterStationVO[],
      total: Number(data.total ?? data.totalCount ?? rows.length),
      hasTotal,
    };
  }

  function toStationOption(station?: Partial<WaterStationVO>): StationOption | null {
    if (!station?.stationId || !station.stationName) {
      return null;
    }
    return {
      label: station.stationName,
      value: station.stationId,
      stationId: station.stationId,
      stationName: station.stationName,
      stationCode: station.stationCode,
    };
  }

  function ensureStationOption(station?: Partial<WaterStationVO>) {
    const option = toStationOption(station);
    if (!option || stationOptions.value.some((item) => item.stationId === option.stationId)) {
      return;
    }
    stationOptions.value = [option, ...stationOptions.value];
  }

  function findStationOption(stationId?: SelectValue) {
    return stationOptions.value.find((item) => item.stationId === Number(stationId));
  }

  async function loadStationOptions(reset = false) {
    if (stationLoading.value || (!reset && !stationHasMore.value)) {
      return;
    }
    if (reset) {
      stationPageNum.value = 1;
      stationHasMore.value = true;
    }
    try {
      stationLoading.value = true;
      const res = await waterStationList({
        pageNum: stationPageNum.value,
        pageSize: stationPageSize,
        stationName: stationKeyword.value,
      });
      const { rows, total, hasTotal } = getStationRows(res);
      const nextOptions = rows
        .map((station) => toStationOption(station))
        .filter(Boolean) as StationOption[];
      const merged = reset ? nextOptions : [...stationOptions.value, ...nextOptions];
      const optionMap = new Map<number, StationOption>();
      merged.forEach((item) => optionMap.set(item.stationId, item));
      stationOptions.value = Array.from(optionMap.values());
      stationTotal.value = total;
      stationHasMore.value = hasTotal
        ? stationOptions.value.length < total
        : rows.length >= stationPageSize;
      if (stationHasMore.value) {
        stationPageNum.value += 1;
      }
    } finally {
      stationLoading.value = false;
    }
  }

  function handleStationDropdownVisibleChange(visible: boolean) {
    if (visible && stationOptions.value.length === 0) {
      loadStationOptions(true);
    }
  }

  function handleStationPopupScroll(event: UIEvent) {
    const target = event.target as HTMLElement;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
      loadStationOptions();
    }
  }

  const handleStationSearch = useDebounceFn((value: string) => {
    stationKeyword.value = value?.trim() || '';
    loadStationOptions(true);
  }, 300);

  async function handleStationChange(value: SelectValue) {
    const station = findStationOption(value);
    await setFieldsValue({
      stationId: value,
      stationName: station?.stationName || '',
      stationCode: station?.stationCode || '',
    });
  }
</script>
