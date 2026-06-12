<template>
  <div class="qinghai-screen-layout">
    <header class="screen-shell-header">
      <div class="screen-shell-mark">
        <span>QINGHAI HYDROLOGY</span>
      </div>
      <div class="screen-shell-title">
        <p>QINGHAI WATER RESOURCE Analysis and Calculation Software</p>
        <h1>青海省水资源分析计算软件</h1>
      </div>
      <div class="screen-shell-time">{{ currentTime }}</div>
    </header>

    <nav class="screen-shell-nav" aria-label="青海水文页面导航">
      <button
        v-for="item in navItems"
        :key="item.path"
        type="button"
        class="screen-shell-nav-item"
        :class="{ 'is-active': route.path === item.path }"
        @click="go(item.path)"
      >
        <Icon :icon="item.icon" :size="18" />
        <span>{{ item.title }}</span>
      </button>
    </nav>

    <main class="screen-shell-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import Icon from '@/components/Icon/Icon.vue';

  defineOptions({ name: 'QinghaiScreenLayout' });

  const route = useRoute();
  const router = useRouter();
  const currentTime = ref('');
  const navItems = [
    {
      title: '站点地图',
      path: '/qinghai/station-map',
      icon: 'gis:map-poi',
    },
    {
      title: '站点基础信息',
      path: '/qinghai/station-data',
      icon: 'material-symbols:database-outline',
    },
    {
      title: '站点数据',
      path: '/qinghai/monthly-precip',
      icon: 'material-symbols:rainy-outline',
    },
  ];

  let timer: number | undefined;

  onMounted(() => {
    refreshTime();
    timer = window.setInterval(refreshTime, 1000 * 30);
  });

  onBeforeUnmount(() => {
    if (timer) {
      window.clearInterval(timer);
    }
  });

  function go(path: string) {
    if (route.path !== path) {
      router.push(path);
    }
  }

  function refreshTime() {
    currentTime.value = new Date().toLocaleString('zh-CN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<style scoped lang="less">
  .qinghai-screen-layout {
    --screen-bg: #030914;
    --screen-panel: rgba(8, 28, 56, 0.78);
    --screen-line: rgba(103, 232, 249, 0.34);
    --screen-cyan: #67e8f9;
    --screen-blue: #38bdf8;
    --screen-violet: #8b5cf6;
    --screen-text: #e6fbff;
    position: relative;
    width: 100vw;
    height: 100vh;
    min-width: 1180px;
    min-height: 0;
    overflow: hidden;
    color: var(--screen-text);
    background:
      linear-gradient(rgba(103, 232, 249, 0.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(103, 232, 249, 0.045) 1px, transparent 1px),
      radial-gradient(circle at 50% 36%, rgba(14, 165, 233, 0.2), transparent 34%),
      radial-gradient(circle at 14% 18%, rgba(129, 140, 248, 0.16), transparent 26%),
      radial-gradient(circle at 86% 76%, rgba(139, 92, 246, 0.14), transparent 28%),
      linear-gradient(180deg, #030914 0%, #061e3c 48%, #020612 100%);
    background-size:
      32px 32px,
      32px 32px,
      100% 100%,
      100% 100%,
      100% 100%,
      100% 100%;
  }

  .qinghai-screen-layout::before,
  .qinghai-screen-layout::after {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    content: '';
  }

  .qinghai-screen-layout::before {
    background:
      linear-gradient(90deg, transparent, rgba(103, 232, 249, 0.2), transparent),
      linear-gradient(
        180deg,
        rgba(129, 140, 248, 0.1),
        transparent 24%,
        transparent 72%,
        rgba(56, 189, 248, 0.12)
      );
    mask-image: linear-gradient(180deg, transparent 0, #000 12%, #000 88%, transparent 100%);
  }

  .qinghai-screen-layout::after {
    border: 1px solid rgba(103, 232, 249, 0.12);
    box-shadow: inset 0 0 80px rgba(56, 189, 248, 0.08);
  }

  .screen-shell-header {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: 260px 1fr 260px;
    align-items: center;
    height: 86px;
    padding: 14px 28px 8px;
    background:
      linear-gradient(180deg, rgba(2, 8, 23, 0.96), rgba(2, 8, 23, 0.24), transparent),
      linear-gradient(
        90deg,
        transparent,
        rgba(56, 189, 248, 0.2),
        rgba(129, 140, 248, 0.1),
        transparent
      );
    border-bottom: 1px solid rgba(103, 232, 249, 0.2);
  }

  .screen-shell-mark,
  .screen-shell-time {
    font-size: 13px;
    font-weight: 800;
    color: #c7f7ff;
  }

  .screen-shell-mark span {
    display: inline-flex;
    padding: 7px 12px;
    background: rgba(2, 8, 23, 0.42);
    border: 1px solid rgba(103, 232, 249, 0.3);
    border-radius: 4px;
    box-shadow: inset 0 0 14px rgba(103, 232, 249, 0.08);
  }

  .screen-shell-time {
    justify-self: end;
  }

  .screen-shell-title {
    text-align: center;

    p {
      margin: 0;
      font-size: 12px;
      font-weight: 800;
      color: var(--screen-cyan);
      letter-spacing: 0;
      text-shadow: 0 0 12px rgba(103, 232, 249, 0.72);
    }

    h1 {
      margin: 2px 0 0;
      font-size: 34px;
      font-weight: 900;
      line-height: 1.2;
      color: #f0fbff;
      text-shadow:
        0 0 10px rgba(103, 232, 249, 0.9),
        0 0 24px rgba(56, 189, 248, 0.42),
        0 0 38px rgba(129, 140, 248, 0.22);
    }
  }

  .screen-shell-nav {
    position: relative;
    z-index: 3;
    display: flex;
    gap: 12px;
    justify-content: center;
    height: 48px;
    padding-top: 6px;
  }

  .screen-shell-nav-item {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
    min-width: 136px;
    height: 34px;
    padding: 0 18px;
    color: #c7f7ff;
    cursor: pointer;
    background:
      linear-gradient(135deg, rgba(14, 165, 233, 0.16), rgba(129, 140, 248, 0.08)),
      rgba(2, 8, 23, 0.48);
    border: 1px solid rgba(103, 232, 249, 0.34);
    border-radius: 4px;
    box-shadow:
      inset 0 0 16px rgba(103, 232, 249, 0.08),
      0 0 18px rgba(56, 189, 248, 0.12);
    transition:
      color 0.18s ease,
      border-color 0.18s ease,
      background 0.18s ease,
      box-shadow 0.18s ease;

    &:hover,
    &.is-active {
      color: #ffffff;
      background:
        linear-gradient(135deg, rgba(14, 165, 233, 0.34), rgba(129, 140, 248, 0.16)),
        rgba(2, 8, 23, 0.6);
      border-color: rgba(103, 232, 249, 0.78);
      box-shadow:
        inset 0 0 18px rgba(103, 232, 249, 0.12),
        0 0 24px rgba(56, 189, 248, 0.24);
    }
  }

  .screen-shell-content {
    position: relative;
    z-index: 1;
    height: calc(100vh - 134px);
    padding: 0 18px 18px;
    overflow: hidden;
  }
</style>
