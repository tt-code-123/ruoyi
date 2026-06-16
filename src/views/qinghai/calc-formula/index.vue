<template>
  <div class="calc-formula-home">
    <section class="formula-hero">
      <div>
        <p class="hero-kicker">CALCULATION FORMULA</p>
        <h2>计算公式管理</h2>
        <p>集中查看青海省水资源分析计算中的降水与地表水核心公式数据。</p>
      </div>
    </section>

    <section class="formula-entry-grid">
      <article
        v-for="item in formulaEntries"
        :key="item.path"
        class="formula-entry"
        @click="go(item.path)"
      >
        <div class="entry-icon">
          <Icon :icon="item.icon" :size="30" />
        </div>
        <div class="entry-content">
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
          <ul>
            <li v-for="formula in item.formulas" :key="formula">{{ formula }}</li>
          </ul>
        </div>
        <a-button type="primary">进入</a-button>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import Icon from '@/components/Icon/Icon.vue';

  defineOptions({ name: 'QinghaiCalcFormula' });

  const router = useRouter();

  const formulaEntries = [
    {
      title: '降水计算公式',
      path: '/qinghai/calc-formula/precipitation',
      icon: 'material-symbols:rainy-outline',
      description: '面向站点降水计算过程，支持按年份查看降水深、代表站比例、计算公式与结果。',
      formulas: ['多年平均降水量', '降水深计算', '降水量频率计算(皮尔逊川型分布)', '变差系数计算'],
    },
    {
      title: '地表水计算公式',
      path: '/qinghai/calc-formula/surface-water',
      icon: 'material-symbols:water',
      description: '面向分区地表水资源计算过程，支持按一级区、三级区、市州查看公式数据。',
      formulas: [
        '地表水资源总量',
        '天然径流量',
        '径流深',
        '产水模数',
        '可利用水量',
        '水量平衡方程',
      ],
    },
  ];

  function go(path: string) {
    router.push(path);
  }
</script>

<style scoped lang="less">
  .calc-formula-home {
    height: 100%;
    padding: 18px;
    overflow: hidden;
    color: #eff6ff;
    background:
      linear-gradient(rgba(59, 130, 246, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.035) 1px, transparent 1px),
      radial-gradient(circle at 22% 0, rgba(37, 99, 235, 0.18), transparent 28%),
      linear-gradient(180deg, #08111f, #020617);
    background-size:
      28px 28px,
      28px 28px,
      100% 100%,
      100% 100%;
  }

  .formula-hero {
    display: flex;
    align-items: center;
    min-height: 190px;
    padding: 28px 34px;
    background:
      linear-gradient(135deg, rgba(59, 130, 246, 0.18), transparent 32%),
      linear-gradient(315deg, rgba(14, 165, 233, 0.14), transparent 30%), rgba(12, 25, 52, 0.86);
    border: 1px solid rgba(96, 165, 250, 0.24);
    border-radius: 6px;
    box-shadow:
      inset 0 0 24px rgba(59, 130, 246, 0.08),
      0 16px 34px rgba(0, 0, 0, 0.28);
  }

  .hero-kicker {
    margin: 0 0 8px;
    font-size: 13px;
    color: #93c5fd;
  }

  .formula-hero h2 {
    margin: 0;
    font-size: 34px;
    font-weight: 700;
    letter-spacing: 0;
  }

  .formula-hero p:last-child {
    max-width: 680px;
    margin: 12px 0 0;
    font-size: 16px;
    line-height: 1.8;
    color: #bfdbfe;
  }

  .formula-entry-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    margin-top: 18px;
  }

  .formula-entry {
    display: grid;
    grid-template-columns: 58px minmax(0, 1fr) auto;
    gap: 18px;
    align-items: flex-start;
    min-height: 250px;
    padding: 24px;
    cursor: pointer;
    background:
      linear-gradient(135deg, rgba(56, 189, 248, 0.12), transparent 28%), rgba(9, 22, 48, 0.86);
    border: 1px solid rgba(96, 165, 250, 0.24);
    border-radius: 6px;
    transition:
      border-color 0.2s ease,
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .formula-entry:hover {
    border-color: rgba(125, 211, 252, 0.62);
    box-shadow: 0 18px 38px rgba(14, 165, 233, 0.16);
    transform: translateY(-2px);
  }

  .entry-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 58px;
    height: 58px;
    color: #bae6fd;
    background: rgba(37, 99, 235, 0.22);
    border: 1px solid rgba(125, 211, 252, 0.36);
    border-radius: 6px;
  }

  .entry-content h3 {
    margin: 0 0 10px;
    font-size: 22px;
    font-weight: 700;
  }

  .entry-content p {
    margin: 0;
    line-height: 1.7;
    color: #bfdbfe;
  }

  .entry-content ul {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 0;
    margin: 18px 0 0;
    list-style: none;
  }

  .entry-content li {
    padding: 7px 10px;
    font-size: 13px;
    color: #dbeafe;
    background: rgba(15, 45, 88, 0.74);
    border: 1px solid rgba(96, 165, 250, 0.24);
    border-radius: 4px;
  }
</style>
