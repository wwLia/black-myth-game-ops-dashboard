"use client";

import { useEffect, useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsType } from "echarts";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import type { Review } from "@/types/dashboard";

export type PlaytimeSentimentScatterProps = {
  reviews: Review[];
  selectedReviewId?: string;
  interviewMode?: boolean;
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
type RendererClickEvent = { offsetX?: number; offsetY?: number; zrX?: number; zrY?: number };

const topicColors: Record<string, string> = {
  "性能优化": "#38bdf8",
  "战斗体验": "#f97316",
  "剧情文化": "#a78bfa",
  "美术音乐": "#34d399",
  "价格购买": "#facc15",
  "内容期待": "#fb7185",
  "其他反馈": "#94a3b8",
};
const scatterSampleLimit = 1500;

export function PlaytimeSentimentScatter({
  reviews,
  selectedReviewId,
  interviewMode = false,
  onReviewClick,
}: PlaytimeSentimentScatterProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const sampledReviews = useMemo(
    () => sampleReviews(reviews, scatterSampleLimit, selectedReviewId),
    [reviews, selectedReviewId],
  );
  const scatterPoints: ScatterPoint[] = useMemo(
    () =>
      sampledReviews.map((review): ScatterPoint => [
        review.playtimeHours,
        review.sentimentScore,
        review.attentionScore,
        review.id,
        review.userSegment,
        review.recommendation,
        review.sentimentText,
        review.topic,
        summarize(review.content),
      ]),
    [sampledReviews],
  );
  const topics = useMemo(
    () => Array.from(new Set(sampledReviews.map((review) => review.topic))).sort(),
    [sampledReviews],
  );
  const series = topics.map((topic) => ({
    name: topic,
    type: "scatter",
    data: sampledReviews
      .filter((review) => review.topic === topic)
      .map((review): ScatterPoint => scatterPoints.find((point) => point[3] === review.id)!),
    symbolSize: (value: ScatterPoint) => {
      const normalizedAttention = Math.max(0, value[2]);
      return Math.min(34, Math.max(7, Math.sqrt(normalizedAttention) * 2.2));
    },
    itemStyle: {
      color: topicColors[topic] ?? "#67e8f9",
      opacity: 0.72,
      borderColor: "#e0f2fe",
      borderWidth: 1,
    },
    emphasis: {
      focus: "series",
      itemStyle: { opacity: 1, borderWidth: 2 },
    },
    markLine: {
      silent: true,
      symbol: "none",
      label: {
        color: "#cbd5e1",
        formatter: (params: { name: string }) => params.name,
      },
      lineStyle: { color: "rgba(125,211,252,0.45)", type: "dashed", width: 1 },
      data: [
        { name: "2h 尝鲜边界", xAxis: 2 },
        { name: "10h 轻度/核心", xAxis: 10 },
        { name: "50h 深度边界", xAxis: 50 },
      ],
    },
  }));
  const handleChartReady = (chart: EChartsType) => {
    const renderer = chart.getZr();
    renderer.off("click");
    renderer.on("click", (event: RendererClickEvent) => {
      const x = event.offsetX ?? event.zrX ?? 0;
      const y = event.offsetY ?? event.zrY ?? 0;
      const [playtimeHours, sentimentScore] = chart.convertFromPixel(
        { xAxisIndex: 0, yAxisIndex: 0 },
        [x, y],
      ) as number[];
      const nearestPoint = findNearestPoint(scatterPoints, playtimeHours, sentimentScore);

      if (nearestPoint) {
        onReviewClick(nearestPoint[3]);
      }
    });
  };
  const handleContainerClick = (event: MouseEvent | PointerEvent | React.MouseEvent<HTMLDivElement>) => {
    const box = chartContainerRef.current?.getBoundingClientRect();

    if (!box || !scatterPoints.length) {
      return;
    }

    const playtimeHours = Math.min(60, Math.max(0, ((event.clientX - box.left) / box.width) * 60));
    const sentimentScore = 1 - Math.min(2, Math.max(0, ((event.clientY - box.top) / box.height) * 2));
    const nearestPoint = findNearestPoint(scatterPoints, playtimeHours, sentimentScore);

    if (nearestPoint) {
      onReviewClick(nearestPoint[3]);
    }
  };
  useEffect(() => {
    const container = chartContainerRef.current;

    if (!container) {
      return;
    }

    container.addEventListener("click", handleContainerClick, true);
    container.addEventListener("pointerdown", handleContainerClick, true);

    return () => {
      container.removeEventListener("click", handleContainerClick, true);
      container.removeEventListener("pointerdown", handleContainerClick, true);
    };
  });

  if (!reviews.length) {
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
          `是否推荐：${recommendation}`,
          `情绪：${sentiment} (${sentimentScore.toFixed(2)})`,
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
    graphic: selectedReviewId && !interviewMode
      ? [
          {
            type: "text",
            right: 20,
            bottom: 8,
            style: {
              text: "已选中评论",
              fill: "#67e8f9",
              font: "12px sans-serif",
            },
          },
        ]
      : [],
  };

  return (
    <div
      ref={chartContainerRef}
      className={interviewMode ? "relative rounded border border-amber-300/30 p-2 shadow-[0_0_32px_rgba(251,191,36,0.14)]" : "relative"}
      title={interviewMode ? "散点图：用游戏时长和情绪分定位不同用户层的口碑风险" : undefined}
    >
      {interviewMode ? (
        <p className="mb-2 rounded border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
          {"面试讲解：这张图把“玩了多久”和“态度如何”放在一起，用来识别低时长劝退和深度玩家负面反馈。"}
        </p>
      ) : null}
      <DataSourceBadge sourceType="real" className="absolute right-3 top-2 z-10" />
      <ReactECharts
        option={option}
        style={{ height: 360 }}
        notMerge
        lazyUpdate
        onChartReady={handleChartReady}
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
  );
}

function findNearestPoint(points: ScatterPoint[], playtimeHours: number, sentimentScore: number): ScatterPoint | undefined {
  return points
    .map((point) => ({
      point,
      distance: Math.abs(point[0] - playtimeHours) / 60 + Math.abs(point[1] - sentimentScore),
    }))
    .sort((pointA, pointB) => pointA.distance - pointB.distance)[0]?.point;
}

function summarize(content: string): string {
  const trimmedContent = content.trim();

  if (trimmedContent.length <= 64) {
    return trimmedContent;
  }

  return `${trimmedContent.slice(0, 64)}...`;
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

function ChartEmptyState({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center rounded border border-slate-800 bg-slate-950/45 text-sm text-slate-500"
      style={{ height }}
    >
      {"当前筛选条件下暂无真实评论散点数据"}
    </div>
  );
}
