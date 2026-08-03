# vue3-calendar-heatmap-ts

A lightweight, GitHub-style calendar/activity heatmap component for **Vue 3**, written in **TypeScript**. No runtime dependencies besides Vue itself.

## Install

```bash
npm install vue3-calendar-heatmap-ts
```

## Usage

```vue
<script setup lang="ts">
import { CalendarHeatmap } from 'vue3-calendar-heatmap-ts';
import 'vue3-calendar-heatmap-ts/style.css'; // required — component styles ship as a separate CSS file

const values = [
  { date: '2025-01-03', count: 4 },
  { date: '2025-01-04', count: 0 },
  { date: '2025-01-10', count: 12 },
  // days not present here are treated as "no data"
];
</script>

<template>
  <CalendarHeatmap
    :values="values"
    start-date="2025-01-01"
    end-date="2025-12-31"
    :round="2"
    :dark-mode="false"
    :range-color="['#ebedf0', '#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127']"
    no-data-text="No activity"
    :tooltip-formatter="(v) => `${v.count} events on ${v.date}`"
  />
</template>
```

> Note: component styles are built as a separate CSS file (`dist/calendar-heatmap.css`, exposed as `vue3-calendar-heatmap-ts/style.css`). Always import it once in your app entry point.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `values` | `Array<{ date: Date \| string; count: number; [key: string]: unknown }>` | — (required) | Data points. Any day in the range without a matching entry is treated as "no data". |
| `startDate` | `string` | — (required) | Inclusive start of the rendered range, e.g. `'2025-01-01'`. |
| `endDate` | `string` | — (required) | Inclusive end of the rendered range, e.g. `'2025-12-31'`. |
| `round` | `number` (0-5) | `0` | Corner rounding of each cell. `0` = square, `5` = full circle (mapped linearly to `border-radius`). |
| `darkMode` | `boolean` | `false` | Uses a built-in dark color scheme when `rangeColor` isn't provided. |
| `rangeColor` | `string[]` | light/dark default palette | Color progression — see below. |
| `max` | `number` | highest count in `values` | Upper bound used to distribute `rangeColor[2..]` across counts. |
| `noDataText` | `string \| null` | `null` | Tooltip text for days with no matching entry. `null` shows no tooltip for those days. |
| `tooltipFormatter` | `(value) => string` | built-in formatter | Formats the tooltip for days that **do** have a matching entry. |
| `vertical` | `boolean` | `false` | Renders weeks as rows instead of columns. |

Emits: `day-click` — fired with `{ date, count, data }` when a rendered day cell is clicked.

### `rangeColor` semantics

```
rangeColor[0] -> color for days with NO entry in `values` at all
rangeColor[1] -> color for days with an entry whose count is 0
rangeColor[2..] -> distributed evenly across counts from 1 up to `max`
```

For example, with the default palette and no `max` override, the color scale is stretched across the highest count value found in `values`.

## Development

```bash
npm install
npm run dev     # playground at src/../playground, exercising all props
npm run build    # builds dist/ (ESM + UMD + .d.ts + css) for publishing
```

## Publishing

```bash
npm run build
npm publish
```

## License

MIT
