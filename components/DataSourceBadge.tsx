import type { SourceType } from "@/types/dashboard";
import { cn } from "@/lib/utils";

export type DataSourceBadgeProps = {
  sourceType: SourceType;
  label?: string;
  className?: string;
};

const defaultLabel: Record<SourceType, string> = {
  real: "真实数据",
  mock: "Mock 数据",
};

const badgeClassName: Record<SourceType, string> = {
  real: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  mock: "border-amber-300/25 bg-amber-300/10 text-amber-100",
};

export function DataSourceBadge({ sourceType, label, className }: DataSourceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-1 text-xs font-medium",
        badgeClassName[sourceType],
        className,
      )}
    >
      {label ?? defaultLabel[sourceType]}
    </span>
  );
}
