import type { SourceType } from "@/types/dashboard";
import { cn } from "@/lib/utils";

export type DataSourceBadgeProps = {
  sourceType: SourceType;
  label?: string;
  className?: string;
};

const defaultLabel: Record<SourceType, string> = {
  real: "真实样本",
  derived: "分析推导",
  mock: "Mock 演示",
  future: "未来可接入",
};

const badgeClassName: Record<SourceType, string> = {
  real: "ops-badge-real",
  derived: "ops-badge-derived",
  mock: "ops-badge-mock",
  future: "ops-badge-future",
};

export function DataSourceBadge({ sourceType, label, className }: DataSourceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-1 text-xs font-medium",
        "ops-badge",
        badgeClassName[sourceType],
        className,
      )}
    >
      {label ?? defaultLabel[sourceType]}
    </span>
  );
}
