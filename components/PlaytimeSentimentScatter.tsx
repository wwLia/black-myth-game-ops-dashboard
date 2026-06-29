"use client";

import { useMemo } from "react";
import { ClientECharts } from "@/components/ClientECharts";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import type { Review } from "@/types/dashboard";

export type PlaytimeSentimentScatterProps = {
  reviews: Review[];
  selectedReviewId?: string;
  activeQuadrant: string;
  onQuadrantSelect: (quadrant: string) => void;
  onReviewClick: (reviewId: string) => void;
};

type ScatterPoint = [
  playtimeHours: number,
  sentimentScore: number,
  attentionScore: number,
  reviewId: string,
  userSegment: string,
  recommendation: string,
  sentiment: string,
  topic: string,
  summary: string,
];

type Quadrant = {
  id: string;
  name: string;
  judgement: string;
  action: string;
  actions: string[];
  filter: (review: Review) => boolean;
};

const scatterSampleLimit = 1200;
const thresholdHours = 10;
const quadrants: Quadrant[] = [
  {
    id: "early-risk",
    name: "早期流失风险",
    judgement: "性能、引导或购买预期问题",
    action: "排查首小时体验",
    actions: ["核验首小时体验与配置门槛", "准备安装、性能或引导 FAQ"],
    filter: (review) => review.playtimeHours < thresholdHours && isNegative(review),
  },
  {
    id: "deep-feedback",
    name: "深度反馈用户",
    judgement: "系统性或后期体验问题",
    action: "进入高优先级反馈池",
    actions: ["进入高优先级反馈处理清单", "提交策划或技术复核"],
    filter: (review) => review.playtimeHours >= thresholdHours && isNegative(review),
  },
  {
    id: "early-positive",
    name: "初期印象良好",
    judgement: "尚未形成深度口碑",
    action: "推动继续体验和内容触达",
    actions: ["推动继续体验内容触达", "沉淀新手阶段正向素材"],
    filter: (review) => review.playtimeHours < thresholdHours && !isNegative(review),
  },
  {
    id: "core-advocates",
    name: "核心口碑用户",
    judgement: "高价值传播人群",
    action: "UGC、攻略和社区激励",
    actions: ["筛选 UGC 与攻略素材", "邀请深度玩家参与社区内容"],
    filter: (review) => review.playtimeHours >= thresholdHours && !isNegative(review),
  },
];

const topicColors: Record<string, string> = {
  性能优化: "#38bdf8",
  战斗体验: "#f97316",
  剧情文化: "#a78bfa",
  美术音乐: "#34d399",
  价格购买: "#facc15",
  内容期待: "#fb7185",
  其他反馈: "#94a3b8",
};

export function PlaytimeSentimentScatter({
  reviews,
  selectedReviewId,
  activeQuadrant,
  onQuadrantSelect,
  onReviewClick,
}: PlaytimeSentimentScatterProps) {
  const validReviews = useMemo(() => reviews.filter(hasValidScatterPoint), [reviews]);
  const sampledReviews = useMemo(() => sampleReviews(validReviews, scatterSampleLimit, selectedReviewId), [
    validReviews,
    selectedReviewId,
  ]);
  const scatterPoints: ScatterPoint[] = sampledReviews.map((review) => [
    review.playtimeHours,
    review.sentimentScore,
    review.attentionScore,
    review.id,
    review.userSegmentGroup,
    review.recommendationGroup,
    review.sentimentText,
    review.topic,
    summarize(review.content),
  ]);
  const topics = Array.from(new Set(sampledReviews.map((review) => review.topic))).sort();
  const series = topics.map((topic) => ({
    name: topic,
    type: "scatter",
    data: scatterPoints.filter((point) => point[7] === topic),
    symbolSize: (value: ScatterPoint) => Math.min(30, Math.max(7, Math.sqrt(Math.max(0, value[2])) * 2.1)),
    itemStyle: {
      color: (params: { data: ScatterPoint }) => getPointColor(params.data),
      opacity: 0.78,
      borderColor: (params: { data: ScatterPoint }) => getPointBorderColor(params.data),
      borderWidth: 1,
    },
    emphasis: { focus: "series", itemStyle: { opacity: 1, borderWidth: 2 } },
  }));
  const quadrantStats = quadrants.map((quadrant) => {
    const quadrantReviews = validReviews.filter(quadrant.filter);
    const recommended = quadrantReviews.filter((review) => review.recommendationGroup === "推荐").length;
    return {
      ...quadrant,
      reviews: quadrantReviews,
      recommendRate: quadrantReviews.length ? (recommended / quadrantReviews.length) * 100 : 0,
      topTopics: topEntries(countBy(quadrantReviews, (review) => review.topic), 3).map(([topic]) => topic),
      examples: quadrantReviews.slice(0, 3),
    };
  });

  if (!validReviews.length) {
    return <ChartEmptyState height={360} />;
  }

  const option = {
    color: topics.map((topic) => topicColors[topic] ?? "#67e8f9"),
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(2,6,23,0.96)",
      borderColor: "rgba(103,232,249,0.28)",
      textStyle: { color: "#e2e8f0" },
      formatter: (params: { data: ScatterPoint }) => {
        const [playtimeHours, sentimentScore, attentionScore, , userSegment, recommendation, sentiment, topic, summary] =
          params.data;
        return [
          `<strong>${topic}</strong>`,
          `用户分层：${userSegment}`,
          `游戏时长：${playtimeHours.toFixed(1)}h`,
          `是否推荐：${formatTooltipTag(recommendation, recommendation.includes("不") ? "#fda4af" : "#86efac")}`,
          `情绪：${formatTooltipTag(`${sentiment} (${sentimentScore.toFixed(2)})`, sentimentScore < 0 ? "#fda4af" : sentimentScore > 0 ? "#86efac" : "#cbd5e1")}`,
          `关注度：${attentionScore.toFixed(1)}`,
          `评论摘要：${summary}`,
        ].join("<br/>");
      },
    },
    legend: {
      type: "scroll",
      top: 0,
      textStyle: { color: "#cbd5e1" },
      pageIconColor: "#67e8f9",
      pageTextStyle: { color: "#cbd5e1" },
    },
    grid: { left: 48, right: 24, top: 54, bottom: 44 },
    xAxis: {
      name: "游戏时长(h)",
      min: 0,
      max: 60,
      nameTextStyle: { color: "#94a3b8" },
      axisLabel: { color: "#94a3b8" },
      axisLine: { lineStyle: { color: "#334155" } },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.14)" } },
    },
    yAxis: {
      name: "情绪分",
      min: -1,
      max: 1,
      nameTextStyle: { color: "#94a3b8" },
      axisLabel: { color: "#94a3b8" },
      axisLine: { lineStyle: { color: "#334155" } },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.14)" } },
    },
    series,
    graphic: [
      rectGraphic("早期流失风险", 58, 188, "rgba(244,63,94,0.11)", "#fda4af"),
      rectGraphic("深度反馈用户", 382, 188, "rgba(245,158,11,0.11)", "#fde68a"),
      rectGraphic("初期印象良好", 58, 56, "rgba(34,211,238,0.08)", "#a5f3fc"),
      rectGraphic("核心口碑用户", 382, 56, "rgba(20,184,166,0.1)", "#99f6e4"),
      {
        type: "line",
        shape: { x1: 374, y1: 54, x2: 374, y2: 316 },
        style: { stroke: "rgba(125,211,252,0.55)", lineDash: [6, 6], lineWidth: 1 },
      },
      {
        type: "line",
        shape: { x1: 48, y1: 186, x2: 740, y2: 186 },
        style: { stroke: "rgba(125,211,252,0.55)", lineDash: [6, 6], lineWidth: 1 },
      },
    ],
  };

  return (
    <div className="space-y-4">
      <div className="ops-card-muted relative min-h-[360px] min-w-0 overflow-hidden rounded p-3">
        <DataSourceBadge sourceType="real" className="absolute right-3 top-2 z-10" />
        <ClientECharts
          option={option}
          style={{ width: "100%", height: 360 }}
          notMerge
          lazyUpdate
          onEvents={{
            click: (params: { data?: ScatterPoint }) => {
              const reviewId = params.data?.[3];
              if (reviewId) {
                onReviewClick(reviewId);
              }
            },
          }}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        {quadrantStats.map((quadrant) => (
          <article
            key={quadrant.id}
            onClickCapture={() => onQuadrantSelect(activeQuadrant === quadrant.id ? "全部" : quadrant.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onQuadrantSelect(activeQuadrant === quadrant.id ? "全部" : quadrant.id);
              }
            }}
            role="button"
            tabIndex={0}
            className={`ops-focus-ring rounded border p-3 text-left transition ${getQuadrantCardClassName(
              quadrant.id,
              activeQuadrant === quadrant.id,
            )}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">{quadrant.name}</h3>
              <span className="text-xs text-slate-400">{formatNumber(quadrant.reviews.length)} 条</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">{quadrant.judgement}</p>
            <p className="mt-1 text-xs leading-5 text-cyan-100">{quadrant.action}</p>
            <div className="mt-3 grid gap-2 text-xs">
              <span className="text-slate-300">{`推荐率：${quadrant.reviews.length ? `${quadrant.recommendRate.toFixed(1)}%` : "暂无可计算数据"}`}</span>
              <span className="text-slate-300">{`Top 主题：${quadrant.topTopics.join(" / ") || "暂无可计算数据"}`}</span>
              <span className="text-cyan-100">{`建议动作：${quadrant.actions.join("；")}`}</span>
            </div>
            <div className="mt-3 space-y-2">
              {quadrant.examples.map((review) => (
                <button
                  key={review.id}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onReviewClick(review.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.stopPropagation();
                      onReviewClick(review.id);
                    }
                  }}
                  className="ops-focus-ring block w-full rounded border border-slate-800 bg-slate-900/45 px-2 py-1 text-left text-xs leading-5 text-slate-300 hover:border-cyan-300/40"
                >
                  <span className="line-clamp-2">{review.content}</span>
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function rectGraphic(text: string, x: number, y: number, fill: string, textColor = "#cbd5e1") {
  return {
    type: "group",
    children: [
      {
        type: "rect",
        shape: { x, y, width: 300, height: 118 },
        style: { fill, stroke: "rgba(148,163,184,0.16)" },
      },
      {
        type: "text",
        left: x + 12,
        top: y + 10,
        style: { text, fill: textColor, font: "12px sans-serif" },
      },
    ],
  };
}

function getPointColor(point: ScatterPoint): string {
  const [playtimeHours, sentimentScore, , , , recommendation, sentiment] = point;
  const isNegativePoint = recommendation.includes("不") || sentiment.includes("负") || sentimentScore < 0;

  if (isNegativePoint && playtimeHours >= thresholdHours) {
    return "#f59e0b";
  }

  if (isNegativePoint) {
    return "#f43f5e";
  }

  if (sentimentScore > 0 && playtimeHours >= thresholdHours) {
    return "#34d399";
  }

  if (sentimentScore > 0) {
    return "#22d3ee";
  }

  return "#94a3b8";
}

function getPointBorderColor(point: ScatterPoint): string {
  const [playtimeHours, sentimentScore, , , , recommendation, sentiment] = point;
  const isNegativePoint = recommendation.includes("不") || sentiment.includes("负") || sentimentScore < 0;

  if (isNegativePoint && playtimeHours >= thresholdHours) {
    return "#fecdd3";
  }

  if (isNegativePoint) {
    return "#ffe4e6";
  }

  return "#e0f2fe";
}

function formatTooltipTag(label: string, color: string): string {
  return `<span style="display:inline-flex;border:1px solid ${color};color:${color};border-radius:999px;padding:1px 6px;background:rgba(15,23,42,0.72)">${label}</span>`;
}

function getQuadrantCardClassName(quadrantId: string, isActive: boolean): string {
  const baseClassName = isActive ? "shadow-[0_0_24px_rgba(34,211,238,0.14)]" : "hover:shadow-[0_0_18px_rgba(34,211,238,0.1)]";
  const toneClassName: Record<string, string> = {
    "early-risk": isActive
      ? "border-rose-300/65 bg-rose-300/10"
      : "border-rose-300/24 bg-rose-300/5 hover:border-rose-300/48",
    "deep-feedback": isActive
      ? "border-amber-300/70 bg-amber-300/10"
      : "border-amber-300/26 bg-amber-300/5 hover:border-amber-300/52",
    "early-positive": isActive
      ? "border-cyan-300/65 bg-cyan-300/10"
      : "border-cyan-300/22 bg-cyan-300/5 hover:border-cyan-300/46",
    "core-advocates": isActive
      ? "border-emerald-300/65 bg-emerald-300/10"
      : "border-emerald-300/22 bg-emerald-300/5 hover:border-emerald-300/46",
  };

  return `${baseClassName} ${toneClassName[quadrantId] ?? "border-slate-800 bg-slate-950/45 hover:border-cyan-300/35"}`;
}

function isNegative(review: Review): boolean {
  return review.recommendationGroup === "不推荐" || review.sentimentText === "负向" || review.sentimentScore < 0;
}

function hasValidScatterPoint(review: Review): boolean {
  return Number.isFinite(Number(review.playtimeHours)) && Number.isFinite(Number(review.sentimentScore));
}

function summarize(content: string): string {
  const trimmedContent = content.trim();
  return trimmedContent.length <= 64 ? trimmedContent : `${trimmedContent.slice(0, 64)}...`;
}

function sampleReviews(reviews: Review[], limit: number, selectedReviewId?: string): Review[] {
  if (reviews.length <= limit) {
    return reviews;
  }

  const sampledReviews: Review[] = [];
  const step = (reviews.length - 1) / (limit - 1);
  for (let index = 0; index < limit; index += 1) {
    sampledReviews.push(reviews[Math.round(index * step)]);
  }

  const selectedReview = selectedReviewId ? reviews.find((review) => review.id === selectedReviewId) : undefined;
  if (selectedReview && !sampledReviews.some((review) => review.id === selectedReview.id)) {
    sampledReviews[sampledReviews.length - 1] = selectedReview;
  }

  return sampledReviews;
}

function countBy<T, K>(items: T[], getKey: (item: T) => K): Map<K, number> {
  const counts = new Map<K, number>();
  items.forEach((item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
}

function topEntries<T>(counts: Map<T, number>, limit: number): Array<[T, number]> {
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function formatNumber(value: number): string {
  return value.toLocaleString("zh-CN");
}

function ChartEmptyState({ height }: { height: number }) {
  return (
    <div
      className="ops-card-muted flex items-center justify-center rounded text-sm text-slate-500"
      style={{ height }}
    >
      当前筛选条件下暂无真实评论散点数据
    </div>
  );
}
