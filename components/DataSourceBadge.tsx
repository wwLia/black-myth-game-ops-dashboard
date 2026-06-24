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
  real: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  derived: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  mock: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  future: "border-slate-300/20 bg-slate-300/10 text-slate-200",
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
