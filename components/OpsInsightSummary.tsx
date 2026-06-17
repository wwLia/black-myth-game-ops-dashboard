"use client";

import { DataSourceBadge } from "@/components/DataSourceBadge";
import type { Review } from "@/types/dashboard";

export type OpsInsightSummaryProps = {
  reviews: Review[];
};

type TopicCount = {
  topic: string;
  count: number;
};

export function OpsInsightSummary({ reviews }: OpsInsightSummaryProps) {
  const summary = buildSummary(reviews);

  return (
    <section className="rounded-lg border border-cyan-300/15 bg-slate-950/60 p-4 shadow-[0_0_28px_rgba(14,165,233,0.08)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">{"运营洞察摘要"}</h2>
          <p className="mt-1 text-xs text-slate-400">{"基于当前筛选后的评论自动计算"}</p>
        </div>
        <DataSourceBadge sourceType="real" />
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <InsightMetric label="评论数" value={formatNumber(summary.totalReviews)} />
        <InsightMetric label="推荐率" value={formatPercent(summary.recommendRate)} />
        <InsightMetric label="不推荐数" value={formatNumber(summary.notRecommendedReviews)} />
        <InsightMetric label="负面占比" value={formatPercent(summary.negativeRate)} />
        <InsightMetric label="Top 3 主题" value={summary.topTopicsText} />
        <InsightMetric label="平均游戏时长" value={`${summary.avgPlaytime.toFixed(1)}h`} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {summary.insights.map((insight, index) => (
          <div key={insight} className="rounded border border-slate-800 bg-slate-900/45 p-3">
            <p className="text-xs text-cyan-200">{`洞察 ${index + 1}`}</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">{insight}</p>
          </div>
        ))}
      </div>

      {summary.totalReviews < 20 ? (
        <p className="mt-3 rounded border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
          {"当前筛选样本较少，结论仅供参考"}
        </p>
      ) : null}
    </section>
  );
}

function InsightMetric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded border border-slate-800 bg-slate-950/45 p-3 ${className ?? ""}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-100">{value}</p>
    </div>
  );
}

function buildSummary(reviews: Review[]) {
  const totalReviews = reviews.length;
  const recommendedReviews = reviews.filter((review) => review.recommendationGroup === "推荐").length;
  const notRecommendedReviews = reviews.filter((review) => review.recommendationGroup === "不推荐").length;
  const negativeReviews = reviews.filter(isNegativeReview).length;
  const playtimeSum = reviews.reduce((sum, review) => sum + review.playtimeHours, 0);
  const topicCounts = buildTopicCounts(reviews);
  const topTopics = [...topicCounts].sort((topicA, topicB) => topicB.count - topicA.count).slice(0, 3);

  return {
    totalReviews,
    recommendRate: totalReviews ? recommendedReviews / totalReviews : 0,
    notRecommendedReviews,
    negativeReviews,
    negativeRate: totalReviews ? negativeReviews / totalReviews : 0,
    topTopicsText: topTopics.length ? topTopics.map((topic) => `${topic.topic} ${topic.count}`).join(" / ") : "暂无数据",
    avgPlaytime: totalReviews ? playtimeSum / totalReviews : 0,
    insights: buildInsights(reviews, topTopics),
  };
}

function buildTopicCounts(reviews: Review[]): TopicCount[] {
  const topicMap = new Map<string, TopicCount>();

  reviews.forEach((review) => {
    const currentTopic = topicMap.get(review.topic) ?? { topic: review.topic, count: 0 };
    currentTopic.count += 1;
    topicMap.set(review.topic, currentTopic);
  });

  return Array.from(topicMap.values());
}

function buildInsights(reviews: Review[], topTopics: TopicCount[]): string[] {
  if (!reviews.length) {
    return [
      "当前筛选下暂无评论，需先放宽筛选条件。",
      "暂无足够数据判断主要负面来源。",
      "暂无可执行的分层运营优先级判断。",
    ];
  }

  const negativeSegments = buildNegativeSegments(reviews);
  const lowPlaytimeNegativeCount = reviews.filter(
    (review) => isNegativeReview(review) && review.playtimeHours <= 2,
  ).length;
  const totalNegativeReviews = reviews.filter(isNegativeReview).length;
  const topNegativeSegment = negativeSegments[0];

  return [
    `当前主要声量来自${topTopics.map((topic) => topic.topic).join("和") || "少量主题"}。`,
    topNegativeSegment
      ? `${topNegativeSegment.segment}用户的负面评论最多，需结合时长和主题优先复盘。`
      : "当前暂无明显负面用户分层，建议继续观察新增评论。",
    lowPlaytimeNegativeCount > 0
      ? `低时长不推荐评论有 ${formatNumber(lowPlaytimeNegativeCount)} 条，可能与新手体验、性能或购买预期有关。`
      : `当前共 ${formatNumber(totalNegativeReviews)} 条负面评论，需持续跟踪负面占比变化。`,
  ];
}

function buildNegativeSegments(reviews: Review[]) {
  const segmentMap = new Map<string, number>();

  reviews.forEach((review) => {
    if (isNegativeReview(review)) {
      segmentMap.set(review.userSegmentGroup, (segmentMap.get(review.userSegmentGroup) ?? 0) + 1);
    }
  });

  return Array.from(segmentMap.entries())
    .sort((segmentA, segmentB) => segmentB[1] - segmentA[1])
    .map(([segment, count]) => ({ segment, count }));
}

function isNegativeReview(review: Review): boolean {
  return review.recommendationGroup === "不推荐" || review.sentimentText === "负向";
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("zh-CN");
}
