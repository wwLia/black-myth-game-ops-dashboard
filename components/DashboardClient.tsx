"use client";

import { useMemo, useState, type ReactNode } from "react";
import { FilterBar } from "@/components/FilterBar";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { HighPriorityFeedbackPanel } from "@/components/HighPriorityFeedbackPanel";
import { KpiCards } from "@/components/KpiCards";
import { NewsRadar } from "@/components/NewsRadar";
import { OnlineTrendChart } from "@/components/OnlineTrendChart";
import { OpsInsightSummary } from "@/components/OpsInsightSummary";
import { PlaytimeDistributionChart } from "@/components/PlaytimeDistributionChart";
import { PlaytimeSentimentScatter } from "@/components/PlaytimeSentimentScatter";
import { ReviewPanel } from "@/components/ReviewPanel";
import { TopicDistributionChart } from "@/components/TopicDistributionChart";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useFilteredReviews } from "@/hooks/useFilteredReviews";
import type {
  DashboardFilters,
  DashboardViewData,
  KpiMetric,
  OpsEvent,
  PlaytimeDistributionSegment,
  Review,
  TopicDistributionPoint,
} from "@/types/dashboard";

type DashboardClientProps = {
  dashboardData: DashboardViewData;
};

type DashboardPanelProps = {
  title: string;
  subtitle: string;
  interviewMode?: boolean;
  businessTooltip?: string;
  children: ReactNode;
};

export function DashboardClient({ dashboardData }: DashboardClientProps) {
  const [interviewMode, setInterviewMode] = useState(false);
  const defaultFilters = dashboardData.filters.defaults;
  const {
    filters,
    selectedReviewId,
    selectedOpsEvent,
    setFilters,
    setSelectedReviewId,
    updateTopicFilter,
    updateUserSegmentFilter,
    selectOpsEvent,
    resetDashboardState,
  } = useDashboardFilters(defaultFilters);
  const filteredReviews = useFilteredReviews(dashboardData.allReviews, filters);

  const kpiMetrics = useMemo(
    () => buildFilteredKpiMetrics(filteredReviews, dashboardData.kpiMetrics),
    [dashboardData.kpiMetrics, filteredReviews],
  );

  const playtimeDistribution = useMemo(
    () => buildFilteredPlaytimeDistribution(filteredReviews),
    [filteredReviews],
  );
  const topicDistribution = useMemo(() => buildFilteredTopicDistribution(filteredReviews), [filteredReviews]);
  const highPriorityReviews = useMemo(() => buildHighPriorityFeedback(filteredReviews), [filteredReviews]);
  const visibleReviews = useMemo(
    () => buildVisibleReviews(filteredReviews, selectedReviewId),
    [filteredReviews, selectedReviewId],
  );
  const selectedOpsEventReviews = useMemo(
    () => (selectedOpsEvent ? getReviewsInEventRange(dashboardData.allReviews, selectedOpsEvent) : []),
    [dashboardData.allReviews, selectedOpsEvent],
  );
  const handleInterviewModeChange = (enabled: boolean) => {
    setInterviewMode(enabled);

    if (enabled) {
      resetDashboardState();
    }
  };

  return (
    <div className="mx-auto max-w-[1720px] space-y-5">
      <DashboardHeader updatedAt={dashboardData.updatedAt} />

      <KpiCards metrics={kpiMetrics} interviewMode={interviewMode} />

      <FilterBar
        filters={filters}
        interviewMode={interviewMode}
        options={{
          platforms: dashboardData.filters.platforms,
          recommendations: dashboardData.filters.recommendations,
          sentiments: dashboardData.filters.sentiments,
          topics: dashboardData.filters.topics,
          userSegments: dashboardData.filters.userSegments,
          urgencies: dashboardData.filters.urgencies,
        }}
        onFiltersChange={setFilters}
        onResetFilters={resetDashboardState}
        onInterviewModeChange={handleInterviewModeChange}
      />

      <section className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <DashboardPanel
          title="在线人数趋势"
          subtitle="展示 Mock 数据的近 24 小时在线趋势，未来可接 Steam API 或内部埋点"
          interviewMode={interviewMode}
          businessTooltip="用于展示未来可接入实时在线人数和运营事件的联动思路。"
        >
          <OnlineTrendChart
            data={dashboardData.onlineTrend}
            opsEvents={dashboardData.opsEvents}
            onEventClick={selectOpsEvent}
          />
          <OpsEventDetailPanel event={selectedOpsEvent} reviews={selectedOpsEventReviews} />
        </DashboardPanel>

        <DashboardPanel
          title="游戏时长分布"
          subtitle="按累计游玩时长观察用户分层"
          interviewMode={interviewMode}
          businessTooltip="用于观察不同游玩深度的用户规模和推荐率差异。"
        >
          <PlaytimeDistributionChart
            data={playtimeDistribution}
            activeSegment={filters.user_segment}
            onSegmentClick={updateUserSegmentFilter}
          />
        </DashboardPanel>
      </section>

      <OpsInsightSummary reviews={filteredReviews} />

      <DashboardPanel
        title="评论主题分布"
        subtitle="展示各主题评论数与推荐率，低推荐率主题会标注需关注"
        interviewMode={interviewMode}
        businessTooltip="用于快速看出玩家最关心的问题领域，并识别低推荐率主题。"
      >
        <TopicDistributionChart
          data={topicDistribution}
          activeTopic={filters.topic}
          onTopicClick={updateTopicFilter}
        />
      </DashboardPanel>

      <section className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <DashboardPanel
          title="游戏时长与评论情绪"
          subtitle="真实评论级散点：X 轴为游戏时长，Y 轴为情绪分，点大小代表关注度"
          interviewMode={interviewMode}
          businessTooltip="核心模块：将用户深度和评论情绪结合，用于定位体验风险。"
        >
          <PlaytimeSentimentScatter
            reviews={filteredReviews}
            selectedReviewId={selectedReviewId}
            interviewMode={interviewMode}
            onReviewClick={setSelectedReviewId}
          />
        </DashboardPanel>

        <DashboardPanel
          title="高优先级反馈"
          subtitle="聚焦不推荐、负向情绪、长时长且需运营介入的真实评论"
          interviewMode={interviewMode}
          businessTooltip="核心模块：把最需要处理的评论沉淀成运营反馈池。"
        >
          <HighPriorityFeedbackPanel
            reviews={highPriorityReviews}
            selectedReviewId={selectedReviewId}
            interviewMode={interviewMode}
            onReviewClick={setSelectedReviewId}
          />
        </DashboardPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr]">
        <DashboardPanel
          title="评论列表"
          subtitle="展示当前筛选后的阿里云天池 Steam 评论"
          interviewMode={interviewMode}
          businessTooltip="用于回到原始评论语料，验证图表和洞察的具体样本。"
        >
          <ReviewPanel
            reviews={visibleReviews}
            selectedReviewId={selectedReviewId}
            onSelectedReviewChange={setSelectedReviewId}
          />
        </DashboardPanel>
      </section>

      <DashboardPanel
        title="行业新闻列表"
        subtitle="跟踪市场热度、媒体声量、直播曝光与竞品压力"
        interviewMode={interviewMode}
        businessTooltip="展示外部行业信号如何与评论分析结合，当前使用 Mock 数据。"
      >
        <NewsRadar metrics={dashboardData.newsRadarMetrics} news={dashboardData.newsItems} />
      </DashboardPanel>
    </div>
  );
}

function OpsEventDetailPanel({ event, reviews }: { event?: OpsEvent; reviews: Review[] }) {
  if (!event) {
    return (
      <div className="mt-4 rounded border border-slate-800 bg-slate-950/45 p-4 text-sm text-slate-400">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DataSourceBadge sourceType="mock" />
          <span className="text-xs text-slate-500">{"点击折线图事件节点查看期间评论"}</span>
        </div>
      </div>
    );
  }

  const reviewCount = reviews.length;
  const recommendedReviews = reviews.filter((review) => review.recommendationGroup === "推荐").length;
  const recommendRate = reviewCount ? `${((recommendedReviews / reviewCount) * 100).toFixed(1)}%` : "--";
  const topTopics = getTopTopics(reviews);

  return (
    <div className="mt-4 rounded border border-cyan-300/20 bg-slate-950/50 p-4 text-sm text-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <DataSourceBadge sourceType={event.source_type} />
          <h3 className="mt-2 text-base font-semibold text-white">{event.event_name}</h3>
          <p className="mt-1 text-xs text-slate-400">{`${formatEventTime(event.start_time)} - ${formatEventTime(event.end_time)}`}</p>
        </div>
        <span className="rounded border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">
          {event.event_type}
        </span>
      </div>

      <p className="mt-3 leading-6 text-slate-300">{event.description}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <EventMetric label="事件期间评论数" value={formatNumber(reviewCount)} />
        <EventMetric label="推荐率" value={recommendRate} />
        <EventMetric label="主要主题" value={topTopics.length ? topTopics.join(" / ") : "暂无数据"} />
      </div>

      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <EventMetric label="关联指标" value={event.related_metric} />
        <EventMetric label="预期影响" value={event.expected_impact} />
      </div>
    </div>
  );
}

function EventMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/45 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-100">{value}</p>
    </div>
  );
}

function DashboardHeader({ updatedAt }: { updatedAt: string }) {
  return (
    <header className="rounded-lg border border-cyan-300/15 bg-slate-950/60 p-4 shadow-[0_0_28px_rgba(14,165,233,0.08)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Game Ops Command Center</p>
          <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
            {"黑神话：悟空运营数据大屏"}
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            {"基于真实 Steam 评论样本的运营监控视图，优先观察 KPI、筛选条件与核心图表。"}
          </p>
        </div>
        <span className="text-xs text-slate-500">{`最后更新：${updatedAt}`}</span>
      </div>
    </header>
  );
}

function DashboardPanel({ title, subtitle, interviewMode = false, businessTooltip, children }: DashboardPanelProps) {
  return (
    <section className="rounded-lg border border-cyan-300/15 bg-slate-950/60 p-4 shadow-[0_0_28px_rgba(14,165,233,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {interviewMode && businessTooltip ? (
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-xs text-cyan-100"
                title={businessTooltip}
              >
                {"?"}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>
        <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
      </div>
      {children}
    </section>
  );
}

function getReviewsInEventRange(reviews: Review[], event: OpsEvent): Review[] {
  const dateRange = getDateRangeFromEvent(event);
  const [start, end = start] = dateRange.split("~");

  return reviews.filter((review) => review.createdAt >= start && review.createdAt <= end);
}

function getDateRangeFromEvent(event: OpsEvent): string {
  const startDate = getDateFromTimestamp(event.start_time);
  const endDate = getDateFromTimestamp(event.end_time);

  return startDate === endDate ? startDate : `${startDate}~${endDate}`;
}

function getDateFromTimestamp(timestamp: string): string {
  return timestamp.slice(0, 10);
}

function formatEventTime(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return `${timestamp.slice(0, 10)} ${String(date.getHours()).padStart(2, "0")}:00`;
}

function getTopTopics(reviews: Review[]): string[] {
  const topicCounts = new Map<string, number>();

  reviews.forEach((review) => {
    topicCounts.set(review.topic, (topicCounts.get(review.topic) ?? 0) + 1);
  });

  return Array.from(topicCounts.entries())
    .sort((topicA, topicB) => topicB[1] - topicA[1])
    .slice(0, 3)
    .map(([topic]) => topic);
}

function buildFilteredKpiMetrics(reviews: Review[], baseMetrics: KpiMetric[]): KpiMetric[] {
  const totalReviews = reviews.length;
  const recommendedReviews = reviews.filter((review) => review.recommendationGroup === "推荐").length;
  const notRecommendedReviews = reviews.filter((review) => review.recommendationGroup === "不推荐").length;
  const playtimes = reviews.map((review) => review.playtimeHours);
  const avgPlaytime = totalReviews ? playtimes.reduce((sum, value) => sum + value, 0) / totalReviews : 0;
  const currentOnlineMetric = baseMetrics.find((metric) => metric.id === "current-online");
  const realSource = "真实评论数据";

  return [
    {
      id: "total-reviews",
      source_type: "real",
      label: "评论总数",
      value: formatNumber(totalReviews),
      change: "当前筛选样本",
      source: realSource,
      trend: "flat",
      accent: "cyan",
    },
    {
      id: "positive-rate",
      source_type: "real",
      label: "好评率",
      value: totalReviews ? `${((recommendedReviews / totalReviews) * 100).toFixed(1)}%` : "--",
      change: `${formatNumber(recommendedReviews)} 条推荐评论`,
      source: realSource,
      trend: "up",
      accent: "green",
    },
    {
      id: "negative-reviews",
      source_type: "real",
      label: "不推荐评论数",
      value: formatNumber(notRecommendedReviews),
      change: `${formatNumber(totalReviews)} 条评论样本`,
      source: realSource,
      trend: "down",
      accent: "rose",
    },
    {
      id: "avg-playtime-hours",
      source_type: "real",
      label: "平均游戏时长",
      value: `${avgPlaytime.toFixed(1)}h`,
      change: "当前筛选样本平均值",
      source: realSource,
      trend: "flat",
      accent: "amber",
    },
    ...(currentOnlineMetric ? [{ ...currentOnlineMetric, source_type: "mock" as const, source: "Mock 数据" }] : []),
  ];
}

function buildFilteredPlaytimeDistribution(reviews: Review[]): PlaytimeDistributionSegment[] {
  if (!reviews.length) {
    return [];
  }

  const segmentOrder = ["尝鲜用户", "轻度体验", "核心推进", "深度玩家"];
  const segmentCounts = new Map<string, Review[]>();

  reviews.forEach((review) => {
    const segment = review.userSegmentGroup || "未分层";
    const currentReviews = segmentCounts.get(segment) ?? [];
    currentReviews.push(review);
    segmentCounts.set(segment, currentReviews);
  });

  const orderedSegments = [
    ...segmentOrder.filter((segment) => segmentCounts.has(segment)),
    ...Array.from(segmentCounts.keys()).filter((segment) => !segmentOrder.includes(segment)).sort(),
  ];
  const total = reviews.length;

  return orderedSegments.map((segment, index) => {
    const segmentReviews = segmentCounts.get(segment) ?? [];
    const count = segmentReviews.length;
    const recommendedReviews = segmentReviews.filter((review) => review.recommendationGroup === "推荐").length;
    const notRecommendedReviews = segmentReviews.filter((review) => review.recommendationGroup === "不推荐").length;

    return {
      id: `filtered-playtime-${index}`,
      source_type: "real",
      range: segment,
      players: count,
      recommendedReviews,
      notRecommendedReviews,
      recommendRate: count ? Number(((recommendedReviews / count) * 100).toFixed(1)) : 0,
      percentage: Number(((count / total) * 100).toFixed(1)),
      segment,
    };
  });
}

function buildFilteredTopicDistribution(reviews: Review[]): TopicDistributionPoint[] {
  if (!reviews.length) {
    return [];
  }

  const topicOrder = [
    "性能优化",
    "战斗体验",
    "剧情文化",
    "美术音乐",
    "价格购买",
    "内容期待",
    "其他反馈",
  ];
  const topicCounts = new Map<string, Review[]>();

  reviews.forEach((review) => {
    const topic = review.topic || "其他反馈";
    const currentReviews = topicCounts.get(topic) ?? [];
    currentReviews.push(review);
    topicCounts.set(topic, currentReviews);
  });

  const orderedTopics = [
    ...topicOrder.filter((topic) => topicCounts.has(topic)),
    ...Array.from(topicCounts.keys()).filter((topic) => !topicOrder.includes(topic)).sort(),
  ];

  return orderedTopics.map((topic, index) => {
    const topicReviews = topicCounts.get(topic) ?? [];
    const reviewCount = topicReviews.length;
    const recommendedReviews = topicReviews.filter((review) => review.recommendationGroup === "推荐").length;
    const notRecommendedReviews = topicReviews.filter((review) => review.recommendationGroup === "不推荐").length;

    return {
      id: `filtered-topic-${index}`,
      source_type: "real",
      topic,
      reviewCount,
      recommendedReviews,
      notRecommendedReviews,
      recommendRate: reviewCount ? Number(((recommendedReviews / reviewCount) * 100).toFixed(1)) : 0,
    };
  });
}

function buildHighPriorityFeedback(reviews: Review[]): Review[] {
  const priorityTopics = new Set(["性能优化", "战斗体验", "Bug 问题", "价格购买"]);

  return reviews
    .filter(
      (review) =>
        review.recommendationGroup === "不推荐" &&
        review.sentimentText === "负向" &&
        review.playtimeHours > 10 &&
        priorityTopics.has(review.topic) &&
        review.urgencyGroup === "高",
    )
    .sort((reviewA, reviewB) => {
      const attentionCompare = reviewB.attentionScore - reviewA.attentionScore;

      if (attentionCompare !== 0) {
        return attentionCompare;
      }

      return reviewB.playtimeHours - reviewA.playtimeHours;
    });
}

function formatNumber(value: number): string {
  return value.toLocaleString("zh-CN");
}

function buildVisibleReviews(reviews: Review[], selectedReviewId: string | undefined): Review[] {
  const firstPage = reviews.slice(0, 50);

  if (!selectedReviewId || firstPage.some((review) => review.id === selectedReviewId)) {
    return firstPage;
  }

  const selectedReview = reviews.find((review) => review.id === selectedReviewId);

  return selectedReview ? [selectedReview, ...firstPage.slice(0, 49)] : firstPage;
}
