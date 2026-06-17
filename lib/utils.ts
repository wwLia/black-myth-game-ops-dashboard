export function formatCompactNumber(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)} 亿`;
  }

  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)} 万`;
  }

  return value.toLocaleString("zh-CN");
}

export function cn(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}
