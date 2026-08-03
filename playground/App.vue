<script setup lang="ts">
import { ref } from 'vue';
import CalendarHeatmap from '../src/CalendarHeatmap.vue';
import type { HeatmapValue } from '../src/types';

function randomValues(): HeatmapValue[] {
  const values: HeatmapValue[] = [];
  const start = new Date(2025, 0, 1);
  for (let i = 0; i < 300; i++) {
    if (Math.random() < 0.35) continue; // leave gaps -> "no data" days
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    values.push({
      date: d.toISOString().slice(0, 10),
      count: Math.floor(Math.random() * 12),
      note: 'demo entry',
    });
  }
  return values;
}

const values = ref<HeatmapValue[]>(randomValues());
const darkMode = ref(false);
const vertical = ref(false);
const round = ref(2);

function formatTooltip(v: HeatmapValue): string {
  return `${v.count} events — ${v.date}`;
}
</script>

<template>
  <div :style="{ background: darkMode ? 'hsl(0 0% 3.9%)' : 'hsl(0 0% 98%)', padding: '24px', minHeight: '100vh' }">
    <div style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center;">
      <label><input type="checkbox" v-model="darkMode" /> dark mode</label>
      <label><input type="checkbox" v-model="vertical" /> vertical</label>
      <label>round: <input type="range" min="0" max="5" v-model.number="round" /> {{ round }}</label>
    </div>

    <CalendarHeatmap :values="values" start-date="2025-02-01" end-date="2025-08-03" :round="round" :dark-mode="darkMode"
      :color="{ mainColor: 'hsl(330 80% 60%)' }" :vertical="vertical" no-data-text="No activity"
      :tooltip-formatter="formatTooltip" @day-click="(c) => console.log('clicked', c)" />
  </div>
</template>
