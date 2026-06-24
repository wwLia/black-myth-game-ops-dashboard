"use client";

import { useMemo, useState, type ReactNode } from "react";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { FilterBar } from "@/components/FilterBar";
import { HighPriorityFeedbackPanel } from "@/components/HighPriorityFeedbackPanel";
import { KpiCards } from "@/components/KpiCards";
import { NewsRadar } from "@/components/NewsRadar";
import { OnlineTrendChart } from "@/components/OnlineTrendChart";
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
  SourceType,
  TopicDistributionPoint,
} from "@/types/dashboard";

type DashboardClientProps = {
  dashboardData: DashboardViewData;
};

type DashboardPanelProps = {
  title: string;
  subtitle: string;
  sourceType?: SourceType;
  children: ReactNode;
};

type SummaryItem = {
  fact: string;
  judgement: string;
  action: string;
  owner: string;
};

const ALL = "全部";
const noDataText = "暂无可计算数据";
const highPlaytimeThreshold = 10;
const deepSegments = new Set(["核心推进", "深度玩家"]);

export function DashboardClient({ dashboardData }: DashboardClientProps) {
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
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  const filteredReviews = useFilteredReviews(dashboardData.allReviews, filters);
  const dataBoundary = useMemo(() => buildDataBoundary(dashboardData.allReviews, filteredReviews, filters), [
    dashboardData.allReviews,
    filteredReviews,
    filters,
  ]);
  const kpiMetrics = useMemo(() => buildDecisionKpis(filteredReviews), [filteredReviews]);
  const playtimeDistribution = useMemo(() => buildFilteredPlaytimeDistribution(filteredReviews), [filteredReviews]);
  const topicDistribution = useMemo(() => buildFilteredTopicDistribution(filteredReviews), [filteredReviews]);
  const summary = useMemo(() => buildExecutiveSummary(filteredReviews), [filteredReviews]);
  const feedbackItems = useMemo(() => buildFeedbackItems(filteredReviews, statuses), [filteredReviews, statuses]);
  const publishingActions = useMemo(() => buildPublishingActions(filteredReviews, feedbackItems), [
    feedbackItems,
    filteredReviews,
  ]);
  const visibleReviews = useMemo(() => buildVisibleReviews(filteredReviews, selectedReviewId), [
    filteredReviews,
    selectedReviewId,
  ]);
  const selectedOpsEventReviews = useMemo(
    () => (selectedOpsEvent ? getReviewsInEventRange(dashboardData.allReviews, selectedOpsEvent) : []),
    [dashboardData.allReviews, selectedOpsEvent],
  );

  const setQuadrantFilter = (quadrant: string) => {
    setFilters({ ...filters, quadrant });
  };

  const updateFeedbackStatus = (itemId: string, status: string) => {
    setStatuses((currentStatuses) => ({ ...currentStatuses, [itemId]: status }));
  };

  return (
    <div className="mx-auto max-w-[1720px] space-y-5">
      <DashboardHeader updatedAt={dashboardData.updatedAt} boundary={dataBoundary} />

      <KpiCards metrics={kpiMetrics} />

      <ExecutiveSummary reviews={filteredReviews} findings={summary.findings} actions={summary.actions} />

      <DashboardPanel title="问题定位" subtitle="所有图表读取当前统一筛选后的 Steam 评论样本。" sourceType="real">
        <div className="space-y-4">
          <FilterBar
            filters={filters}
            interviewMode={false}
            options={{
              recommendations: dashboardData.filters.recommendations,
              sentiments: dashboardData.filters.sentiments,
              topics: dashboardData.filters.topics,
              userSegments: dashboardData.filters.userSegments,
              urgencies: dashboardData.filters.urgencies,
              dateRanges: dashboardData.filters.dateRanges,
            }}
            onFiltersChange={setFilters}
            onResetFilters={resetDashboardState}
            onInterviewModeChange={() => undefined}
          />
          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <PlaytimeDistributionChart
              data={playtimeDistribution}
              activeSegment={filters.user_segment}
              onSegmentClick={updateUserSegmentFilter}
            />
            <TopicDistributionChart data={topicDistribution} activeTopic={filters.topic} onTopicClick={updateTopicFilter} />
          </div>
          <SentimentDistribution reviews={filteredReviews} />
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="玩家价值决策四象限"
        subtitle="X 轴为游戏时长，Y 轴为评论情绪分；点击象限后联动全局评论样本。"
        sourceType="derived"
      >
        <PlaytimeSentimentScatter
          reviews={filteredReviews}
          selectedReviewId={selectedReviewId}
          activeQuadrant={filters.quadrant}
          onQuadrantSelect={setQuadrantFilter}
          onReviewClick={setSelectedReviewId}
        />
      </DashboardPanel>

      <DashboardPanel
        title="行动闭环：高优先级反馈处理清单"
        subtitle="按风险、证据、责任团队、建议动作和当前状态组织跨团队处理项。"
        sourceType="derived"
      >
        <HighPriorityFeedbackPanel
          items={feedbackItems}
          selectedReviewId={selectedReviewId}
          onReviewClick={setSelectedReviewId}
          onStatusChange={updateFeedbackStatus}
        />
      </DashboardPanel>

      <DashboardPanel
        title="发行与传播机会"
        subtitle="根据当前评论样本生成风险侧和机会侧建议，不包含销量、ROI 或跨语言推断。"
        sourceType="derived"
      >
        <PublishingActionPanel data={publishingActions} />
      </DashboardPanel>

      <DashboardPanel
        title="评论样本核验"
        subtitle="默认最多展示 30 条，列表内部滚动；点击四象限或反馈项中的典型评论可定位到这里。"
        sourceType="real"
      >
        <ReviewPanel reviews={visibleReviews} selectedReviewId={selectedReviewId} onSelectedReviewChange={setSelectedReviewId} />
      </DashboardPanel>

      <DashboardPanel
        title="方法、局限性和未来接入"
        subtitle="说明真实样本、分析推导、Mock 演示和未来可接入数据的边界。"
        sourceType="future"
      >
        <MethodAndLimitations boundary={dataBoundary} />
      </DashboardPanel>

      <DashboardPanel
        title="未来数据接入示意"
        subtitle="当前为 Mock 演示，不参与管理层摘要和真实业务结论计算。"
        sourceType="mock"
      >
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <OnlineTrendChart data={dashboardData.onlineTrend} opsEvents={dashboardData.opsEvents} onEventClick={selectOpsEvent} />
            <OpsEventDetailPanel event={selectedOpsEvent} reviews={selectedOpsEventReviews} />
          </div>
          <NewsRadar metrics={dashboardData.newsRadarMetrics} news={dashboardData.newsItems} />
        </div>
      </DashboardPanel>
    </div>
  );
}

function DashboardHeader({ updatedAt, boundary }: { updatedAt: string; boundary: ReturnType<typeof buildDataBoundary> }) {
  return (
    <header className="rounded-lg border border-cyan-300/15 bg-slate-950/60 p-4 shadow-[0_0_28px_rgba(14,165,233,0.08)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Game Ops Decision Prototype</p>
          <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">黑神话：悟空发行运营决策看板</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            基于真实 Steam 评论样本与明确规则推导，帮助发行、商务和运营负责人判断优先问题、责任团队和下一步动作。
          </p>
        </div>
        <span className="text-xs text-slate-500">{`最后更新：${updatedAt}`}</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <BoundaryItem label="数据来源" value="阿里云天池 Steam 评论样本" sourceType="real" />
        <BoundaryItem label="数据平台" value="Steam；未来可扩展其他平台" sourceType="real" />
        <BoundaryItem label="样本数量" value={`${formatNumber(boundary.totalSamples)} 条真实评论`} sourceType="real" />
        <BoundaryItem label="样本覆盖时间" value={boundary.dateRange} sourceType="real" />
        <BoundaryItem label="当前分析范围" value={boundary.filterText} sourceType="derived" />
      </div>
    </header>
  );
}

function BoundaryItem({ label, value, sourceType }: { label: string; value: string; sourceType: SourceType }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/55 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">{label}</p>
        <DataSourceBadge sourceType={sourceType} className="text-[10px]" />
      </div>
      <p className="mt-2 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}

function DashboardPanel({ title, subtitle, sourceType = "real", children }: DashboardPanelProps) {
  return (
    <section className="rounded-lg border border-cyan-300/15 bg-slate-950/60 p-4 shadow-[0_0_28px_rgba(14,165,233,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <DataSourceBadge sourceType={sourceType} />
          </div>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>
        <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
      </div>
      {children}
    </section>
  );
}

function ExecutiveSummary({
  reviews,
  findings,
  actions,
}: {
  reviews: Review[];
  findings: SummaryItem[];
  actions: SummaryItem[];
}) {
  return (
    <section className="rounded-lg border border-cyan-300/15 bg-slate-950/60 p-4 shadow-[0_0_28px_rgba(14,165,233,0.08)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-white">管理层摘要：核心发现与建议动作</h2>
            <DataSourceBadge sourceType="derived" />
          </div>
          <p className="mt-1 text-xs text-slate-400">基于当前筛选后的评论样本动态计算，不使用 Mock 数据。</p>
        </div>
        {reviews.length < 20 ? (
          <span className="rounded border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
            当前筛选样本较少，结论仅供参考。
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SummaryColumn title="3 个核心发现" items={findings} />
        <SummaryColumn title="3 个建议动作" items={actions} />
      </div>
    </section>
  );
}

function SummaryColumn({ title, items }: { title: string; items: SummaryItem[] }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/45 p-3">
      <h3 className="text-sm font-semibold text-cyan-100">{title}</h3>
      <div className="mt-3 grid gap-3">
        {items.map((item, index) => (
          <article key={`${title}-${index}`} className="rounded border border-slate-800 bg-slate-900/35 p-3 text-sm">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500">{`#${index + 1}`}</span>
              <span className="rounded border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">
                {item.owner}
              </span>
            </div>
            <p className="leading-6 text-slate-300">
              <span className="text-slate-100">事实：</span>
              {item.fact}
            </p>
            <p className="mt-1 leading-6 text-slate-300">
              <span className="text-slate-100">判断：</span>
              {item.judgement}
            </p>
            <p className="mt-1 leading-6 text-cyan-100">
              <span className="text-slate-100">动作：</span>
              {item.action}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function SentimentDistribution({ reviews }: { reviews: Review[] }) {
  const counts = countBy(reviews, (review) => review.sentimentText || "中性");
  const total = reviews.length || 1;
  const sentiments = ["正向", "中性", "负向"];

  return (
    <div className="rounded border border-slate-800 bg-slate-950/45 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">情绪分布</h3>
        <DataSourceBadge sourceType="derived" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {sentiments.map((sentiment) => {
          const count = counts.get(sentiment) ?? 0;
          return (
            <div key={sentiment} className="rounded border border-slate-800 bg-slate-900/35 p-3">
              <p className="text-xs text-slate-500">{sentiment}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{formatNumber(count)}</p>
              <div className="mt-2 h-2 overflow-hidden rounded bg-slate-800">
                <div className="h-full bg-cyan-300" style={{ width: `${(count / total) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PublishingActionPanel({ data }: { data: ReturnType<typeof buildPublishingActions> }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <PublishingColumn title="风险侧" items={data.risks} tone="rose" />
        <PublishingColumn title="机会侧" items={data.opportunities} tone="emerald" />
      </div>
      <div className="rounded border border-slate-800 bg-slate-950/45 p-3 text-sm text-slate-300">
        未来接入多语言评论后，可支持海外本地化和文化理解分析。
      </div>
    </div>
  );
}

function PublishingColumn({
  title,
  items,
  tone,
}: {
  title: string;
  items: ReturnType<typeof buildPublishingActions>["risks"];
  tone: "rose" | "emerald";
}) {
  const titleClassName = tone === "rose" ? "text-rose-100" : "text-emerald-100";

  return (
    <div className="rounded border border-slate-800 bg-slate-950/45 p-3">
      <h3 className={`text-sm font-semibold ${titleClassName}`}>{title}</h3>
      <div className="mt-3 grid gap-3">
        {items.map((item, index) => (
          <article key={`${title}-${index}`} className="rounded border border-slate-800 bg-slate-900/35 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-medium text-white">{item.title}</h4>
              <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
                {item.owner}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">{item.evidence}</p>
            <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
              <MetaBox label="目标人群" value={item.audience} />
              <MetaBox label="推荐渠道" value={item.channel} />
              <MetaBox label="内容形式" value={item.format} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function MethodAndLimitations({ boundary }: { boundary: ReturnType<typeof buildDataBoundary> }) {
  return (
    <div className="space-y-3">
      <details className="rounded border border-slate-800 bg-slate-950/45 p-3" open>
        <summary className="cursor-pointer text-sm font-semibold text-white">数据与方法说明</summary>
        <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
          <MethodItem label="数据来源" value="阿里云天池 Steam 评论样本；Steam 是否推荐为原始态度字段。" />
          <MethodItem label="样本数量" value={`${formatNumber(boundary.totalSamples)} 条真实评论。`} />
          <MethodItem label="样本覆盖时间" value={boundary.dateRange} />
          <MethodItem label="空评论处理" value="空文本不计入有效评论数，展示为“该用户未填写文本评论”。" />
          <MethodItem label="重复评论处理" value="当前前端不删除真实样本；如接入稳定用户键，可在数据层去重并记录口径。" />
          <MethodItem label="情绪分类规则" value="正向、负向和中性由推荐状态与文本规则轻量推导，不是官方标签。" />
          <MethodItem label="主题分类规则" value="主题基于文本关键词和预处理字段归类，不代表 Steam 官方分类。" />
          <MethodItem label="时长分层标准" value="沿用现有尝鲜、轻度体验、核心推进、深度玩家分层；四象限高低时长边界为 10 小时。" />
          <MethodItem label="优先级逻辑" value="由不推荐/负向态度、主题、时长和现有优先级字段共同推导。" />
          <MethodItem label="数据边界" value="真实样本用于统计，分析推导用于判断，Mock 演示仅展示未来接入形态，未来接入不参与当前结论。" />
        </div>
      </details>
      <details className="rounded border border-slate-800 bg-slate-950/45 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-white">当前局限性</summary>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300 md:grid-cols-2">
          <li>Steam 评论用户不代表全部玩家。</li>
          <li>评论用户可能具有更强表达意愿，存在自选择偏差。</li>
          <li>情绪分类是轻量规则法，可能误判反讽、玩梗和复杂语境。</li>
          <li>游戏时长是发表评论时记录的时长，不代表最终游玩时长。</li>
          <li>当前缺少内部行为、销量、退款、愿望单、留存和版本埋点数据。</li>
          <li>当前没有跨平台数据，不能生成 PS、Xbox 或其他平台结论。</li>
          <li>不能仅凭评论证明某项改动与销量或留存存在因果关系。</li>
          <li>Mock 数据不能用于支持真实业务结论。</li>
        </ul>
      </details>
      <div className="rounded border border-slate-800 bg-slate-950/45 p-3">
        <h3 className="text-sm font-semibold text-white">未来可接入数据</h3>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
          {[
            "Steam Web API",
            "Steamworks 或内部实时在线数据",
            "版本、补丁和活动节点",
            "销量、退款、愿望单",
            "游戏内行为、留存和关卡数据",
            "社区和客服工单",
            "媒体、KOL 和代理商传播数据",
          ].map((item) => (
            <span key={item} className="rounded border border-slate-700 bg-slate-900/45 px-2 py-1">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MethodItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/35 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 leading-6">{value}</p>
    </div>
  );
}

function MetaBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/45 p-2">
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 text-slate-100">{value}</p>
    </div>
  );
}

function OpsEventDetailPanel({ event, reviews }: { event?: OpsEvent; reviews: Review[] }) {
  if (!event) {
    return (
      <div className="mt-4 rounded border border-slate-800 bg-slate-950/45 p-4 text-sm text-slate-400">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DataSourceBadge sourceType="mock" />
          <span className="text-xs text-slate-500">点击折线图事件节点查看对应期间评论样本。</span>
        </div>
      </div>
    );
  }

  const reviewCount = reviews.length;
  const recommendedReviews = reviews.filter((review) => review.recommendationGroup === "推荐").length;
  const recommendRate = reviewCount ? `${((recommendedReviews / reviewCount) * 100).toFixed(1)}%` : noDataText;
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
        <MetaBox label="事件期间评论数" value={formatNumber(reviewCount)} />
        <MetaBox label="推荐率" value={recommendRate} />
        <MetaBox label="主要主题" value={topTopics.length ? topTopics.join(" / ") : noDataText} />
      </div>
    </div>
  );
}

function buildDecisionKpis(reviews: Review[]): KpiMetric[] {
  const validReviews = reviews.filter((review) => hasRealContent(review));
  const recommendedReviews = validReviews.filter((review) => review.recommendationGroup === "推荐");
  const notRecommendedReviews = validReviews.filter((review) => review.recommendationGroup === "不推荐");
  const negativeReviews = validReviews.filter(isNegativeReview);
  const highPriorityNegativeReviews = negativeReviews.filter(isHighPriorityNegative);
  const deepNegativeReviews = notRecommendedReviews.filter((review) => deepSegments.has(review.userSegmentGroup));
  const topNegativeTopic = getTopTopic(negativeReviews);
  const dateRange = getDateRange(validReviews);
  const realSource = "Steam 评论真实样本及直接统计";
  const derivedSource = "基于当前筛选样本的规则推导";

  return [
    {
      id: "valid-reviews",
      source_type: "real",
      label: "有效评论数",
      value: formatNumber(validReviews.length),
      change: "存在非空文本的评论",
      source: realSource,
      trend: "flat",
      accent: "cyan",
    },
    {
      id: "recommend-rate",
      source_type: "real",
      label: "推荐率",
      value: validReviews.length ? `${((recommendedReviews.length / validReviews.length) * 100).toFixed(1)}%` : noDataText,
      change: `${formatNumber(recommendedReviews.length)} 条推荐评论`,
      source: realSource,
      trend: "up",
      accent: "green",
    },
    {
      id: "not-recommended",
      source_type: "real",
      label: "不推荐评论数",
      value: formatNumber(notRecommendedReviews.length),
      change: "Steam 原始态度字段",
      source: realSource,
      trend: "down",
      accent: "rose",
    },
    {
      id: "high-priority-negative",
      source_type: "derived",
      label: "高优先级负评数",
      value: formatNumber(highPriorityNegativeReviews.length),
      change: "不推荐或负向且命中优先级规则",
      source: derivedSource,
      trend: "down",
      accent: "rose",
    },
    {
      id: "deep-negative-share",
      source_type: "derived",
      label: "深度玩家负评占比",
      value: notRecommendedReviews.length
        ? `${((deepNegativeReviews.length / notRecommendedReviews.length) * 100).toFixed(1)}%`
        : noDataText,
      change: "核心推进与深度玩家负评 / 全部不推荐",
      source: derivedSource,
      trend: "flat",
      accent: "amber",
    },
    {
      id: "top-negative-topic",
      source_type: "derived",
      label: "Top 负面主题",
      value: topNegativeTopic ?? noDataText,
      change: "不推荐或负向评论最多的主题",
      source: derivedSource,
      trend: "flat",
      accent: "cyan",
    },
    {
      id: "sample-date-range",
      source_type: "real",
      label: "样本覆盖时间",
      value: dateRange,
      change: "真实数据中的最早和最晚发布日期",
      source: realSource,
      trend: "flat",
      accent: "cyan",
    },
  ];
}

function buildExecutiveSummary(reviews: Review[]) {
  const negativeReviews = reviews.filter(isNegativeReview);
  const positiveReviews = reviews.filter((review) => review.recommendationGroup === "推荐" || review.sentimentText === "正向");
  const topNegativeTopic = getTopTopic(negativeReviews) ?? "暂无明显负面主题";
  const topPositiveTopic = getTopTopic(positiveReviews) ?? "暂无明显正向主题";
  const deepNegativeCount = negativeReviews.filter((review) => review.playtimeHours >= highPlaytimeThreshold).length;
  const earlyNegativeCount = negativeReviews.length - deepNegativeCount;
  const topOwner = inferOwner(topNegativeTopic);

  return {
    findings: [
      {
        fact: `当前筛选样本中，不推荐或负向评论最多集中在“${topNegativeTopic}”。`,
        judgement: "该主题更适合先进入问题定位，而不是直接形成公开业务结论。",
        action: "将该主题加入反馈处理清单，核验典型评论与相关样本。",
        owner: topOwner,
      },
      {
        fact: `高时长负向样本 ${formatNumber(deepNegativeCount)} 条，低时长负向样本 ${formatNumber(earlyNegativeCount)} 条。`,
        judgement: deepNegativeCount >= earlyNegativeCount ? "当前更偏向深度体验后的系统性意见。" : "当前更偏向早期体验或购买预期落差。",
        action: deepNegativeCount >= earlyNegativeCount ? "优先复核中后期体验和系统反馈。" : "优先排查首小时体验、配置和引导说明。",
        owner: deepNegativeCount >= earlyNegativeCount ? "策划" : "技术",
      },
      {
        fact: `正向评论中较突出的主题为“${topPositiveTopic}”。`,
        judgement: "该主题可作为传播素材候选，但仍需要人工复核语境。",
        action: "沉淀典型评论，用于社区内容、KOL 脚本或媒体 Brief 的素材池。",
        owner: "发行",
      },
    ],
    actions: [
      {
        fact: `“${topNegativeTopic}”在负向样本中出现频率最高。`,
        judgement: "需要先验证主题是否集中于同类体验问题。",
        action: "建议验证并准备 FAQ 或说明草稿。",
        owner: topOwner,
      },
      {
        fact: `当前筛选后共有 ${formatNumber(reviews.length)} 条评论样本。`,
        judgement: reviews.length < 20 ? "样本较少，结论稳定性有限。" : "样本量可支持一次轻量运营判断。",
        action: reviews.length < 20 ? "扩大筛选范围后再做对外表达。" : "将高影响问题分配给责任团队并追踪状态。",
        owner: "运营",
      },
      {
        fact: `正向主题“${topPositiveTopic}”可被提炼为传播素材。`,
        judgement: "更适合做内容放大，不适合生成销量或 ROI 结论。",
        action: "筛选高时长正向评论，制作攻略、UGC 或媒体 Brief 素材。",
        owner: "社区",
      },
    ],
  };
}

function buildFeedbackItems(reviews: Review[], statuses: Record<string, string>) {
  const candidateReviews = reviews.filter(isNegativeReview);
  const topicGroups = groupBy(candidateReviews, (review) => review.topic || "其他反馈");
  const items = Array.from(topicGroups.entries())
    .map(([topic, topicReviews]) => {
      const representative = [...topicReviews].sort((a, b) => b.attentionScore - a.attentionScore)[0];
      const owner = inferOwner(topic);
      const risk = inferRisk(topic, topicReviews);
      const impact = inferImpact(topicReviews);
      const evidence = inferEvidence(topicReviews.length, candidateReviews.length);
      const itemId = `feedback-${topic}`;

      return {
        id: itemId,
        topic,
        userType: getTopTopicLabel(topicReviews.map((review) => review.userSegmentGroup)) ?? "未分层",
        evidence,
        impact,
        risk,
        owner,
        action: inferAction(topic, owner),
        status: statuses[itemId] ?? "待验证",
        representative,
        reviewCount: topicReviews.length,
        reviews: topicReviews,
      };
    })
    .sort((a, b) => levelRank(b.impact) - levelRank(a.impact) || b.reviewCount - a.reviewCount);

  return items.slice(0, 10);
}

function buildPublishingActions(reviews: Review[], feedbackItems: ReturnType<typeof buildFeedbackItems>) {
  const negativeTop = feedbackItems.slice(0, 3);
  const positiveReviews = reviews.filter((review) => review.recommendationGroup === "推荐" || review.sentimentText === "正向");
  const positiveTopics = topEntries(countBy(positiveReviews, (review) => review.topic), 3).map(([topic]) => topic);
  const deepPositiveTopics = topEntries(
    countBy(
      positiveReviews.filter((review) => review.playtimeHours >= highPlaytimeThreshold),
      (review) => review.topic,
    ),
    3,
  ).map(([topic]) => topic);
  const contentTopics = positiveTopics.filter((topic) => /Boss|战斗|音乐|美术|场景|文化|剧情/.test(topic)).slice(0, 2);

  return {
    risks: (negativeTop.length ? negativeTop : []).map((item) => ({
      title: `${item.topic}：建议先${item.owner === "社区" ? "准备 FAQ 或攻略" : "内部验证"}`,
      evidence: `当前筛选样本中相关负向评论 ${formatNumber(item.reviewCount)} 条，证据强度为${item.evidence}，影响等级为${item.impact}。`,
      audience: "受影响玩家与社区讨论人群",
      channel: item.owner === "社区" ? "FAQ / 攻略" : "社区公告 / 开发者内容",
      format: item.owner === "技术" || item.owner === "策划" ? "验证结论后再公开说明" : "说明草稿与问答清单",
      owner: item.owner,
    })),
    opportunities: [
      {
        title: `正向传播主题：${positiveTopics.join(" / ") || noDataText}`,
        evidence: positiveTopics.length ? "来自当前筛选样本中的推荐或正向评论主题统计。" : "当前筛选样本缺少可计算正向主题。",
        audience: "潜在玩家、媒体与 KOL",
        channel: "媒体 Brief / KOL 视频",
        format: "主题卖点与典型评论摘录",
        owner: "发行",
      },
      {
        title: `深度正向玩家主题：${deepPositiveTopics.join(" / ") || noDataText}`,
        evidence: "仅统计游戏时长不低于 10 小时的正向或推荐评论。",
        audience: "核心玩家与攻略内容受众",
        channel: "攻略 / UGC 活动",
        format: "玩法亮点、挑战路线和社区征集",
        owner: "社区",
      },
      {
        title: `内容素材候选：${contentTopics.join(" / ") || positiveTopics[0] || noDataText}`,
        evidence: "从正向主题中筛选适合内容表达的 Boss、音乐、美术、场景或文化相关主题。",
        audience: "内容创作者与代理商",
        channel: "开发者内容 / 媒体 Brief",
        format: "素材包、脚本要点和视觉卖点",
        owner: "发行",
      },
    ],
  };
}

function buildFilteredPlaytimeDistribution(reviews: Review[]): PlaytimeDistributionSegment[] {
  const segmentOrder = ["尝鲜用户", "轻度体验", "核心推进", "深度玩家"];
  const segmentCounts = groupBy(reviews, (review) => review.userSegmentGroup || "未分层");
  const orderedSegments = [
    ...segmentOrder.filter((segment) => segmentCounts.has(segment)),
    ...Array.from(segmentCounts.keys()).filter((segment) => !segmentOrder.includes(segment)).sort(),
  ];
  const total = reviews.length || 1;

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
  const topicCounts = groupBy(reviews, (review) => review.topic || "其他反馈");

  return Array.from(topicCounts.entries())
    .map(([topic, topicReviews], index): TopicDistributionPoint => {
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
    })
    .sort((a, b) => b.reviewCount - a.reviewCount);
}

function buildDataBoundary(allReviews: Review[], filteredReviews: Review[], filters: DashboardFilters) {
  const dateRange = getDateRange(allReviews.filter((review) => review.createdAt));
  const filterText = [
    filters.recommendation !== ALL ? `推荐=${filters.recommendation}` : "",
    filters.sentiment !== ALL ? `情绪=${filters.sentiment}` : "",
    filters.topic !== ALL ? `主题=${filters.topic}` : "",
    filters.user_segment !== ALL ? `时长分层=${filters.user_segment}` : "",
    filters.urgency !== ALL ? `优先级=${filters.urgency}` : "",
    filters.dateRange !== ALL ? `日期=${filters.dateRange}` : "",
    filters.quadrant !== ALL ? `四象限=${quadrantName(filters.quadrant)}` : "",
  ].filter(Boolean);

  return {
    totalSamples: allReviews.length,
    filteredSamples: filteredReviews.length,
    dateRange,
    filterText: filterText.length ? `${filterText.join("；")}；当前 ${formatNumber(filteredReviews.length)} 条` : `全部 Steam 评论；当前 ${formatNumber(filteredReviews.length)} 条`,
  };
}

function buildVisibleReviews(reviews: Review[], selectedReviewId: string | undefined): Review[] {
  const firstPage = reviews.slice(0, 30);

  if (!selectedReviewId || firstPage.some((review) => review.id === selectedReviewId)) {
    return firstPage;
  }

  const selectedReview = reviews.find((review) => review.id === selectedReviewId);
  return selectedReview ? [selectedReview, ...firstPage.slice(0, 29)] : firstPage;
}

function getReviewsInEventRange(reviews: Review[], event: OpsEvent): Review[] {
  const start = event.start_time.slice(0, 10);
  const end = event.end_time.slice(0, 10);
  return reviews.filter((review) => review.createdAt >= start && review.createdAt <= end);
}

function getTopTopics(reviews: Review[]): string[] {
  return topEntries(countBy(reviews, (review) => review.topic), 3).map(([topic]) => topic);
}

function getTopTopic(reviews: Review[]): string | undefined {
  return topEntries(countBy(reviews, (review) => review.topic), 1)[0]?.[0];
}

function getTopTopicLabel(values: string[]): string | undefined {
  return topEntries(countBy(values, (value) => value), 1)[0]?.[0];
}

function getDateRange(reviews: Review[]): string {
  const dates = reviews.map((review) => review.createdAt).filter((date) => /^\d{4}-\d{2}-\d{2}/.test(date)).sort();
  return dates.length ? `${dates[0]} ~ ${dates[dates.length - 1]}` : noDataText;
}

function isNegativeReview(review: Review): boolean {
  return review.recommendationGroup === "不推荐" || review.sentimentText === "负向" || review.sentiment === "negative";
}

function isHighPriorityNegative(review: Review): boolean {
  return isNegativeReview(review) && (review.urgencyGroup === "高" || review.playtimeHours >= highPlaytimeThreshold);
}

function hasRealContent(review: Review): boolean {
  return Boolean(review.content.trim()) && review.content !== "该用户未填写文本评论";
}

function inferOwner(topic: string): string {
  if (/性能|掉帧|崩溃|Bug|配置|安装/.test(topic)) {
    return "技术";
  }

  if (/Boss|难度|地图|战斗|引导|内容/.test(topic)) {
    return "策划";
  }

  if (/舆情|媒体|传播|价格|购买/.test(topic)) {
    return "发行";
  }

  if (/攻略|FAQ|机制|沟通|剧情|文化/.test(topic)) {
    return "社区";
  }

  return "社区";
}

function inferRisk(topic: string, reviews: Review[]): string {
  if (/价格|购买|退款/.test(topic)) {
    return "退款风险";
  }

  if (/舆情|媒体|传播/.test(topic)) {
    return "传播风险";
  }

  if (/引导|机制|剧情|文化/.test(topic)) {
    return "理解成本";
  }

  if (reviews.some((review) => review.playtimeHours >= highPlaytimeThreshold)) {
    return "口碑风险";
  }

  return "体验风险";
}

function inferAction(topic: string, owner: string): string {
  if (owner === "技术") {
    return /性能|Bug|崩溃/.test(topic) ? "建议验证并准备修复排期" : "建议验证配置与兼容性问题";
  }

  if (owner === "策划") {
    return "需要复核体验路径并持续观察";
  }

  if (owner === "发行") {
    return "建议准备说明，验证后再公开回应";
  }

  return /攻略|机制|引导/.test(topic) ? "建议制作攻略或发布 FAQ" : "建议观察并准备社区解释";
}

function inferEvidence(count: number, total: number): string {
  const share = total ? count / total : 0;
  if (count >= 20 || share >= 0.35) {
    return "高";
  }

  if (count >= 8 || share >= 0.18) {
    return "中";
  }

  return "低";
}

function inferImpact(reviews: Review[]): string {
  const highUrgency = reviews.filter((review) => review.urgencyGroup === "高").length;
  const deepNegative = reviews.filter((review) => review.playtimeHours >= highPlaytimeThreshold).length;

  if (highUrgency >= 3 || deepNegative >= 8 || reviews.length >= 20) {
    return "高";
  }

  if (highUrgency >= 1 || deepNegative >= 3 || reviews.length >= 8) {
    return "中";
  }

  return "低";
}

function levelRank(level: string): number {
  return level === "高" ? 3 : level === "中" ? 2 : 1;
}

function quadrantName(quadrant: string): string {
  const names: Record<string, string> = {
    "early-risk": "早期流失风险",
    "deep-feedback": "深度反馈用户",
    "early-positive": "初期印象良好",
    "core-advocates": "核心口碑用户",
  };

  return names[quadrant] ?? "全部";
}

function formatEventTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return `${timestamp.slice(0, 10)} ${String(date.getHours()).padStart(2, "0")}:00`;
}

function topEntries<T>(counts: Map<T, number>, limit: number): Array<[T, number]> {
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function countBy<T, K>(items: T[], getKey: (item: T) => K): Map<K, number> {
  const counts = new Map<K, number>();
  items.forEach((item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
}

function groupBy<T, K>(items: T[], getKey: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  items.forEach((item) => {
    const key = getKey(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  });
  return groups;
}

function formatNumber(value: number): string {
  return value.toLocaleString("zh-CN");
}
