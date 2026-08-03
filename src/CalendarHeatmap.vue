<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import type { CalendarHeatmapProps, DayCell, HeatmapValue } from './types';
import { toDate, formatKey, addDays, startOfWeek, MONTH_LABELS, WEEKDAY_LABELS } from './utils/date';
import { getColorForCount } from './utils/color';

const props = withDefaults(defineProps<CalendarHeatmapProps>(), {
  round: 3,
  darkMode: false,
  max: undefined,
  noDataText: null,
  tooltipFormatter: undefined,
  vertical: false,
  color: () => ({
    mainColor: '#171717'
  })
});

const emit = defineEmits<{
  (e: 'day-click', cell: { date: Date; count: number | null; data: HeatmapValue | null }): void;
}>();

const rangeStart = computed(() => toDate(props.startDate));
const rangeEnd = computed(() => toDate(props.endDate));

const valuesMap = computed<Map<string, HeatmapValue>>(() => {
  const map = new Map<string, HeatmapValue>();
  for (const v of props.values ?? []) {
    map.set(formatKey(toDate(v.date)), v);
  }
  return map;
});

const computedMax = computed<number>(() => {
  if (typeof props.max === 'number' && props.max > 0) return props.max;
  let m = 0;
  for (const v of props.values ?? []) {
    if (typeof v.count === 'number' && v.count > m) m = v.count;
  }
  return m > 0 ? m : 1;
});

const radius = computed<string>(() => {
  const r = Math.min(5, Math.max(0, props.round ?? 0));
  return `${(r / 5) * 50}%`;
});

/** Full weeks (Sun-Sat) spanning [startDate, endDate], padded at both ends. */
const weeks = computed<DayCell[][]>(() => {
  const start = rangeStart.value;
  const end = rangeEnd.value;
  const gridStart = startOfWeek(start);

  const result: DayCell[][] = [];
  let cursor = gridStart;

  while (cursor <= end) {
    const week: DayCell[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(cursor, i);
      const inRange = date >= start && date <= end;
      const key = formatKey(date);
      const data = inRange ? valuesMap.value.get(key) ?? null : null;
      week.push({
        date,
        key,
        count: data ? data.count : null,
        data,
        inRange,
      });
    }
    result.push(week);
    cursor = addDays(cursor, 7);
  }
  return result;
});

/** One label per week column/row: the month name if it differs from the previous week, else ''. */
const monthLabels = computed<string[]>(() => {
  let prevMonth = -1;
  return weeks.value.map((week) => {
    const anchor = week.find((c) => c.inRange) ?? week[0];
    const month = anchor.date.getMonth();
    if (month !== prevMonth) {
      prevMonth = month;
      return MONTH_LABELS[month];
    }
    return '';
  });
});

/** One label per weekday row/column (index 0=Sun..6=Sat). Only Mon/Wed/Fri are shown. */
const weekdayLabels = computed<string[]>(() => {
  const shownIndexes = new Set([1, 3, 5]); // Mon, Wed, Fri
  return WEEKDAY_LABELS.map((label, i) => (shownIndexes.has(i) ? label : ''));
});

function cellStyle(cell: DayCell) {
  if (!cell.inRange) {
    return { visibility: 'hidden' as const };
  }

  return {
    backgroundColor: getColorForCount(cell.count, computedMax.value, props.color, props.darkMode),
    borderRadius: radius.value,
  };
}

function defaultTooltip(cell: DayCell): string {
  const count = cell.count ?? 0;
  return `${count} ${count === 1 ? 'contribution' : 'contributions'} on ${cell.key}`;
}

function tooltipText(cell: DayCell): string | null {
  if (!cell.inRange) return null;
  if (!cell.data) {
    return props.noDataText ?? null;
  }
  if (props.tooltipFormatter) {
    return props.tooltipFormatter(cell.data);
  }
  return defaultTooltip(cell);
}

function onCellClick(cell: DayCell) {
  if (!cell.inRange) return;
  emit('day-click', { date: cell.date, count: cell.count, data: cell.data });
}

interface TooltipState {
  visible: boolean;
  html: string;
  top: number;
  left: number;
}

const tooltip = ref<TooltipState>({ visible: false, html: '', top: 0, left: 0 });

function showTooltip(cell: DayCell, event: MouseEvent) {
  const html = tooltipText(cell);
  if (!html) return;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  tooltip.value = {
    visible: true,
    html,
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX + rect.width / 2,
  };
}

function hideTooltip() {
  tooltip.value.visible = false;
}

// Tooltip position is computed relative to the viewport on hover; if the
// page scrolls while a tooltip is open it would drift out of place, so just
// hide it instead of tracking scroll continuously.
function handleScroll() {
  if (tooltip.value.visible) hideTooltip();
}

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', handleScroll, true);
  onUnmounted(() => window.removeEventListener('scroll', handleScroll, true));
}

</script>

<template>
  <div class="vch__wrapper" :class="{ 'vch__dark': darkMode, 'vch__vertical': vertical }">
    <div class="vch__container" :class="vertical ? 'vch__container--vertical' : 'vch__container--horizontal'">
      <div class="vch__corner" />

      <div class="vch__month-labels"
        :class="vertical ? 'vch__month-labels--vertical' : 'vch__month-labels--horizontal'">
        <span v-for="(label, i) in monthLabels" :key="i" class="vch__label-cell">{{ label }}</span>
      </div>

      <div class="vch__weekday-labels"
        :class="vertical ? 'vch__weekday-labels--vertical' : 'vch__weekday-labels--horizontal'">
        <span v-for="(label, i) in weekdayLabels" :key="i" class="vch__label-cell">{{ label }}</span>
      </div>

      <div class="vch__grid" :class="vertical ? 'vch__grid--vertical' : 'vch__grid--horizontal'">
        <div v-for="(week, wi) in weeks" :key="wi" class="vch__week">
          <div v-for="(cell, di) in week" :key="di" class="vch__day"
            :class="{ 'vch__day--has-tooltip': tooltipText(cell) }" :style="cellStyle(cell)"
            :aria-label="cell.inRange ? cell.key : undefined" @click="onCellClick(cell)"
            @mouseenter="showTooltip(cell, $event)" @mouseleave="hideTooltip" />
        </div>
      </div>
      <Teleport to="body">
        <div v-if="tooltip.visible" class="vch__tooltip" :class="{ 'vch__tooltip--dark': darkMode }"
          :style="{ top: `${tooltip.top}px`, left: `${tooltip.left}px` }" v-html="tooltip.html" />
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.vch__wrapper {
  --vch-cell-size: 14px;
  --vch-cell-gap: 4px;
  --vch-text-color: #24292f;
  display: inline-block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  color: var(--vch-text-color);
}

.vch__wrapper.vch__dark {
  --vch-text-color: #c9d1d9;
}

.vch__container--horizontal {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    'corner   month'
    'weekday  grid';
  gap: 4px;
}

.vch__container--vertical {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    'corner   weekday'
    'month    grid';
  gap: 4px;
}

.vch__corner {
  grid-area: corner;
}

/* --- Labels (shared) --- */
.vch__month-labels,
.vch__weekday-labels {
  display: flex;
  font-size: 10px;
  line-height: 1;
  color: var(--vch-text-color);
  opacity: 0.75;
}

.vch__label-cell {
  white-space: nowrap;
}

/* --- Month labels --- */
.vch__month-labels {
  grid-area: month;
}

.vch__month-labels--horizontal {
  flex-direction: row;
  gap: var(--vch-cell-gap);
  margin-bottom: 8px;
}

.vch__month-labels--horizontal .vch__label-cell {
  width: var(--vch-cell-size);
  overflow: visible;
}

.vch__month-labels--vertical {
  flex-direction: column;
  gap: var(--vch-cell-gap);
  margin-right: 8px;
}

.vch__month-labels--vertical .vch__label-cell {
  height: var(--vch-cell-size);
  display: flex;
  align-items: center;
}

/* --- Weekday labels (Mon/Wed/Fri only) --- */
.vch__weekday-labels {
  grid-area: weekday;
}

.vch__weekday-labels--horizontal {
  flex-direction: column;
  gap: var(--vch-cell-gap);
  align-items: flex-end;
  padding-right: 8px;
}

.vch__weekday-labels--horizontal .vch__label-cell {
  height: var(--vch-cell-size);
  display: flex;
  align-items: center;
}

.vch__weekday-labels--vertical {
  flex-direction: row;
  gap: var(--vch-cell-gap);
  align-items: flex-end;
  padding-bottom: 8px;
}

.vch__weekday-labels--vertical .vch__label-cell {
  width: var(--vch-cell-size);
  display: flex;
  justify-content: center;
}

/* --- Grid --- */
.vch__grid {
  grid-area: grid;
  display: flex;
  gap: var(--vch-cell-gap);
}

.vch__grid--horizontal {
  flex-direction: row;
}

.vch__grid--horizontal .vch__week {
  display: flex;
  flex-direction: column;
  gap: var(--vch-cell-gap);
}

.vch__grid--vertical {
  flex-direction: column;
}

.vch__grid--vertical .vch__week {
  display: flex;
  flex-direction: row;
  gap: var(--vch-cell-gap);
}

.vch__day {
  width: var(--vch-cell-size);
  height: var(--vch-cell-size);
  background-color: #ebedf0;
  cursor: default;
  position: relative;
}

.vch__day--has-tooltip {
  cursor: pointer;
}

.vch__tooltip {
  position: absolute;
  transform: translate(-50%, calc(-100% - 8px));
  background: #1f2328;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1.3;
  max-width: 240px;
  pointer-events: none;
  z-index: 1000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
}

.vch__tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #1f2328;
}

.vch__tooltip--dark {
  background: #e6edf3;
  color: #1f2328;
}

.vch__tooltip--dark::after {
  border-top-color: #e6edf3;
}
</style>
