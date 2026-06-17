import type { KpiMetric } from "@/types/dashboard";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { cn } from "@/lib/utils";

export type KpiCardsProps = {
  metrics: KpiMetric[];
  interviewMode?: boolean;
};

const accentClassName: Record<KpiMetric["accent"], string> = {
  cyan: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
  green: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  amber: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  rose: "border-rose-300/25 bg-rose-300/10 text-rose-200",
};

export function KpiCards({ metrics, interviewMode = false }: KpiCardsProps) {
  return (
    <section className="space-y-3">
      {interviewMode ? (
        <p className="rounded border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
          {"面试讲解：这组 KPI 直接回答“当前口碑如何”，是从真实评论样本提炼的运营概览。"}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => (
        <article
          key={metric.id}
          className={cn(
            "rounded-lg border p-4 shadow-[0_0_26px_rgba(8,145,178,0.1)]",
            accentClassName[metric.accent],
            interviewMode &&
              metric.source_type === "real" &&
              "ring-2 ring-amber-300/60 shadow-[0_0_32px_rgba(251,191,36,0.18)]",
          )}
          title={interviewMode ? "真实评论 KPI：展示当前筛选下的核心口碑指标" : undefined}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-300">{metric.label}</p>
            <span className="rounded border border-white/10 px-2 py-1 text-xs uppercase">{metric.trend}</span>
          </div>
          <strong className="mt-3 block text-3xl font-semibold text-white">{metric.value}</strong>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span>{metric.change}</span>
            <DataSourceBadge sourceType={metric.source_type} className="text-[11px]" />
          </div>
        </article>
      ))}
      </div>
    </section>
  );
}
