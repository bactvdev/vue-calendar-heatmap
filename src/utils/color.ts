export function getColorForCount(
  count: number | null | undefined,
  max: number,
  color: { mainColor: string; mixBase?: string },
  darkMode: boolean
): string {
  const noDataColor = darkMode ? '#161b22' : '#ebedf0';
  const mixBase = color.mixBase ?? (darkMode ? 'black' : 'white');

  if (count === null || count === undefined || count <= 0) {
    return noDataColor;
  }

  const safeMax = max > 0 ? max : 1;
  const ratio = Math.min(count / safeMax, 1);
  const percent = Math.round(ratio * 100);

  return `color-mix(in srgb, ${color.mainColor} ${percent}%, ${mixBase})`;
}
