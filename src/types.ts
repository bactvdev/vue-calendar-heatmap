/**
 * A single data point fed into the heatmap. Extra arbitrary keys are allowed
 * and will be passed through to `tooltipFormatter`.
 */
export interface HeatmapValue {
  date: Date | string;
  count: number;
  [key: string]: unknown;
}

/**
 * Called for any day that has a matching entry in `values`.
 * Receives the original value object (date/count plus any extra fields).
 */
export type TooltipFormatter = (value: HeatmapValue) => string;

export interface CalendarHeatmapProps {
  /** The data points to render. */
  values: HeatmapValue[];
  /** Inclusive start of the rendered range, e.g. '2024-01-01'. */
  startDate: string;
  /** Inclusive end of the rendered range, e.g. '2024-12-31'. */
  endDate: string;
  /**
   * 0-5. Controls corner rounding of each day cell.
   * 0 = square corners, 5 = full circle. Defaults to 0.
   */
  round?: number;
  /** Enables the built-in dark color scheme when `rangeColor` is not provided. */
  darkMode?: boolean;
  /**
   * Upper bound used to distribute rangeColor[2..] across count values.
   * Defaults to the highest count found in `values`.
   */
  max?: number;
  /**
   * Tooltip text shown for days that have no matching entry in `values`.
   * `null` (default) means no tooltip is shown for those days.
   */
  noDataText?: string | null;
  /** Formats the tooltip text for days that DO have a matching entry. */
  tooltipFormatter?: TooltipFormatter;
  /** Renders weeks as rows instead of columns. Defaults to false. */
  vertical?: boolean;

  /** Color progression for the heatmap. **/
  color?: {
    mainColor: string
    mixBase?: string
  };
}

/** Internal representation of a single day cell in the grid. */
export interface DayCell {
  date: Date;
  key: string;
  count: number | null;
  data: HeatmapValue | null;
  /** false for padding cells that fall outside [startDate, endDate]. */
  inRange: boolean;
}
