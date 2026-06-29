"use client";

import { DataSourceBadge } from "@/components/DataSourceBadge";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/dashboard";

export type FeedbackItem = {
  id: string;
  topic: string;
  userType: string;
  evidence: string;
  impact: string;
  risk: string;
  owner: string;
  action: string;
  status: string;
  representative: Review;
  reviewCount: number;
};

export type HighPriorityFeedbackPanelProps = {
  items: FeedbackItem[];
  selectedReviewId?: string;
  onReviewClick: (reviewId: string) => void;
  onStatusChange: (itemId: string, status: string) => void;
};

const statuses = ["待验证", "处理中", "已回应", "持续观察"];
export function HighPriorityFeedbackPanel({
  items,
  selectedReviewId,
  onReviewClick,
  onStatusChange,
}: HighPriorityFeedbackPanelProps) {
  const pendingCount = items.filter((item) => item.status === "待验证").length;
  const highImpactCount = items.filter((item) => item.impact === "高").length;
  const teamCount = new Set(items.map((item) => item.owner)).size;
  const topRisk = topEntry(items.map((item) => item.risk)) ?? "暂无可计算数据";

  return (
    <div className="ops-panel relative rounded">
      <DataSourceBadge sourceType="derived" className="absolute right-3 top-3" />
      <div className="border-b border-cyan-300/15 px-4 py-3 pr-28">
        <p className="text-xs text-rose-200">闭环摘要</p>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          <SummaryMetric label="待验证问题数" value={pendingCount.toLocaleString("zh-CN")} className="ops-tone-neutral" />
          <SummaryMetric label="高影响问题数" value={highImpactCount.toLocaleString("zh-CN")} className="ops-priority-high" />
          <SummaryMetric label="涉及团队数" value={teamCount.toLocaleString("zh-CN")} />
          <SummaryMetric label="Top 业务风险" value={topRisk} className={getRiskClassName(topRisk)} />
          <SummaryMetric label="当前筛选范围" value={`${items.length.toLocaleString("zh-CN")} 个主题问题`} />
        </div>
      </div>

      {items.length ? (
        <div className="ops-scrollbar max-h-[620px] space-y-3 overflow-y-auto p-3">
          {items.map((item, index) => (
            <article
              key={item.id}
              className={cn(
                "ops-feedback-item rounded-lg border border-slate-800 bg-slate-950/60 p-4 pl-5",
                getFeedbackItemClassName(item.impact, item.risk),
                selectedReviewId === item.representative.id && "border-rose-300/55 bg-rose-300/10",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="ops-badge ops-tone-negative rounded border px-2 py-1 text-xs">
                      {`#${String(index + 1).padStart(2, "0")}`}
                    </span>
                    <h3 className="text-sm font-semibold text-white">{item.topic}</h3>
                    <MetaPill>{item.userType}</MetaPill>
                    <MetaPill>{`${item.reviewCount.toLocaleString("zh-CN")} 条相关评论`}</MetaPill>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    不声明问题已确认，仅作为建议验证、需要复核或建议观察的跨团队处理项。
                  </p>
                </div>
                <label className="text-xs text-slate-400">
                  当前状态
                  <select
                    value={item.status}
                    onChange={(event) => onStatusChange(item.id, event.target.value)}
                    className={cn(
                      "ops-filter-select ops-focus-ring mt-1 block rounded px-2 py-1 text-slate-200 outline-none",
                      getStatusClassName(item.status),
                    )}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-3 grid gap-2 text-xs md:grid-cols-5">
                <InfoBox label="证据强度" value={item.evidence} className={getEvidenceClassName(item.evidence)} />
                <InfoBox label="影响等级" value={item.impact} className={getImpactClassName(item.impact)} />
                <InfoBox label="业务风险" value={item.risk} className={getRiskClassName(item.risk)} />
                <InfoBox label="建议负责人" value={item.owner} className={getTeamClassName(item.owner)} />
                <InfoBox label="建议动作" value={item.action} className={getActionClassName(item.action)} />
              </div>

              <button
                type="button"
                onClick={() => onReviewClick(item.representative.id)}
                className="ops-focus-ring mt-3 block w-full rounded border border-slate-800 bg-slate-900/45 p-3 text-left text-sm leading-6 text-slate-300 transition hover:border-cyan-300/40"
              >
                <span className="mb-1 block text-xs text-slate-500">典型评论</span>
                <span className="line-clamp-3">{item.representative.content}</span>
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-sm text-slate-500">当前筛选条件下暂无高优先级反馈</div>
      )}
    </div>
  );
}

function SummaryMetric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("ops-card rounded p-3", className)}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-slate-100" title={value}>
        {value}
      </p>
    </div>
  );
}

function InfoBox({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("ops-card rounded p-2", className)}>
      <p className="font-medium text-slate-400">{label}</p>
      <p className="mt-1 leading-5 text-slate-100">{value}</p>
    </div>
  );
}

function MetaPill({ children }: { children: string }) {
  return <span className="ops-badge ops-tone-neutral rounded border px-2 py-1 text-xs">{children}</span>;
}

function getFeedbackItemClassName(impact: string, risk: string): string {
  if (impact.includes("高")) {
    return "is-high";
  }

  if (risk.includes("风险")) {
    return "is-risk";
  }

  return "";
}

function getRiskClassName(risk: string): string {
  if (risk.includes("退款")) {
    return "border-red-400/45 bg-red-400/10 text-red-100";
  }

  if (risk.includes("口碑")) {
    return "ops-tone-negative";
  }

  if (risk.includes("传播")) {
    return "ops-tone-mock";
  }

  if (risk.includes("理解")) {
    return "ops-tone-cyan";
  }

  if (risk.includes("体验")) {
    return "ops-tone-warning";
  }

  return "ops-tone-neutral";
}

function getEvidenceClassName(level: string): string {
  if (level.includes("高")) {
    return "ops-tone-warning";
  }

  if (level.includes("中")) {
    return "ops-tone-cyan";
  }

  return "ops-tone-neutral";
}

function getImpactClassName(level: string): string {
  if (level.includes("高")) {
    return "ops-priority-high";
  }

  if (level.includes("中")) {
    return "ops-tone-warning";
  }

  return "ops-tone-cyan";
}

function getTeamClassName(team: string): string {
  if (team.includes("技术")) {
    return "ops-tone-cyan";
  }

  if (team.includes("策划")) {
    return "ops-tone-purple";
  }

  if (team.includes("发行")) {
    return "ops-tone-purple";
  }

  if (team.includes("社区")) {
    return "ops-tone-positive";
  }

  if (team.includes("客服")) {
    return "ops-tone-blue";
  }

  if (team.includes("运营")) {
    return "ops-tone-warning";
  }

  return "ops-tone-neutral";
}

function getActionClassName(action: string): string {
  if (/修复/.test(action)) {
    return "ops-tone-negative";
  }

  if (/复核|排查|FAQ/.test(action)) {
    return "ops-tone-warning";
  }

  if (/验证|核查/.test(action)) {
    return "ops-tone-cyan";
  }

  if (/解释|说明/.test(action)) {
    return "ops-tone-purple";
  }

  if (/攻略|制作/.test(action)) {
    return "ops-tone-positive";
  }

  if (/观察/.test(action)) {
    return "ops-tone-neutral";
  }

  return "ops-tone-cyan";
}

function getStatusClassName(status: string): string {
  if (status.includes("处理")) {
    return "is-high";
  }

  if (status.includes("回应")) {
    return "ops-tone-positive";
  }

  if (status.includes("观察")) {
    return "ops-tone-cyan";
  }

  return "ops-tone-warning";
}

function topEntry(values: string[]): string | undefined {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
}
