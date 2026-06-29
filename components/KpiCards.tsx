import type { KpiMetric } from "@/types/dashboard";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { cn } from "@/lib/utils";

export type KpiCardsProps = {
  metrics: KpiMetric[];
  interviewMode?: boolean;
};

const accentClassName: Record<KpiMetric["accent"], string> = {
  cyan: "text-cyan-100",
  green: "text-emerald-100",
  amber: "text-amber-100",
  rose: "text-rose-100",
};

const highPriorityKpiIds = new Set(["high-priority-negative", "deep-negative-share"]);
const riskKpiIds = new Set(["not-recommended", "top-negative-topic"]);

export function KpiCards({ metrics, interviewMode = false }: KpiCardsProps) {
  return (
    <section className="space-y-3">
      {interviewMode ? (
        <p className="rounded border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
          {"面试讲解：这组 KPI 直接回答“当前口碑如何”，是从真实评论样本提炼的运营概览。"}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {metrics.map((metric) => (
        <article
          key={metric.id}
          className={cn(
            "ops-kpi-card rounded-lg border p-4 pt-5 shadow-[0_0_26px_rgba(8,145,178,0.1)]",
            accentClassName[metric.accent],
            getKpiVariantClassName(metric.id),
            riskKpiIds.has(metric.id) && "ops-kpi-risk",
            highPriorityKpiIds.has(metric.id) && "ops-kpi-priority",
            interviewMode &&
              metric.source_type === "real" &&
              "ring-2 ring-amber-300/60 shadow-[0_0_32px_rgba(251,191,36,0.18)]",
          )}
          title={interviewMode ? "真实评论 KPI：展示当前筛选下的核心口碑指标" : undefined}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-300">{metric.label}</p>
            <span
              className={cn(
                "rounded border border-white/10 px-2 py-1 text-xs uppercase",
                (riskKpiIds.has(metric.id) || highPriorityKpiIds.has(metric.id)) && "ops-priority-high",
              )}
            >
              {riskKpiIds.has(metric.id) || highPriorityKpiIds.has(metric.id) ? "!" : metric.trend}
            </span>
          </div>
          <strong className="mt-3 block text-4xl font-semibold tracking-normal text-white">{metric.value}</strong>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="leading-5 text-slate-300">{metric.change}</span>
            <DataSourceBadge sourceType={metric.source_type} className="text-[11px]" />
          </div>
        </article>
      ))}
      </div>
    </section>
  );
}

function getKpiVariantClassName(metricId: string): string {
  if (metricId === "recommend-rate") {
    return "ops-kpi-green";
  }

  if (metricId === "sample-date-range") {
    return "ops-kpi-purple";
  }

  return "";
}
