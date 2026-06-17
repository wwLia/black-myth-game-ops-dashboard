import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  industryNewsItems as mockNewsItems,
  industryNewsRadarMetrics as mockNewsRadarMetrics,
} from "@/data/mock/mockIndustryNews";
import { mockOnlinePlayers } from "@/data/mock/mockOnlinePlayers";
import { mockOpsEvents } from "@/data/mock/mockOpsEvents";
import { kpiMetrics as mockKpiMetrics } from "@/data/mock/mockPlayers";
import type {
  DashboardAggregates,
  DashboardViewData,
  KpiMetric,
  Platform,
  PlayerTrendPoint,
  PlaytimeDistributionSegment,
  PlaytimeSentimentPoint,
  Review,
  Sentiment,
  WukongReview,
} from "@/types/dashboard";

type WukongDataResult = {
  realData: {
    reviews: WukongReview[];
    aggregates: DashboardAggregates | null;
  };
  mockData: {
    kpiMetrics: KpiMetric[];
    onlineTrend: PlayerTrendPoint[];
  };
  dashboardData: DashboardViewData;
};

const REVIEW_FILE = "wukong_reviews_sample.json";
const AGGREGATE_FILE = "wukong_aggregates.json";

export async function loadWukongData(): Promise<WukongDataResult> {
  const [realReviews, realAggregates] = await Promise.all([
    readJsonFromDataFile<WukongReview[]>(REVIEW_FILE, []),
    readAggregatesFromDataFile(),
  ]);

  const realData = {
    reviews: Array.isArray(realReviews) ? realReviews : [],
    aggregates: realAggregates,
  };

  const mockData = {
    kpiMetrics: mockKpiMetrics,
    onlineTrend: mockOnlinePlayers,
  };

  const dashboardData: DashboardViewData = {
    updatedAt: getUpdatedAt(realData.aggregates),
    kpiMetrics: buildKpiMetrics(realData.aggregates, mockData.kpiMetrics),
    onlineTrend: mockData.onlineTrend,
    opsEvents: mockOpsEvents,
    playtimeDistribution: buildPlaytimeDistribution(realData.aggregates) ?? [],
    playtimeSentiment: buildPlaytimeSentiment(realData.aggregates) ?? [],
    reviews: buildReviews(realData.reviews, realData.aggregates) ?? [],
    allReviews: buildReviews(realData.reviews, realData.aggregates, Number.POSITIVE_INFINITY) ?? [],
    newsItems: mockNewsItems,
    newsRadarMetrics: mockNewsRadarMetrics,
    filters: buildFilters(realData.reviews, realData.aggregates),
  };

  return { realData, mockData, dashboardData };
}

async function readJsonFromDataFile<T>(fileName: string, fallback: T): Promise<T> {
  const candidates = [
    path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "data", fileName),
    path.join(/*turbopackIgnore: true*/ process.cwd(), "data", fileName),
  ];

  for (const filePath of candidates) {
    try {
      const file = await readFile(filePath, "utf8");
      return JSON.parse(file) as T;
    } catch {
      // Try the next supported location, then fall back to mock-backed defaults.
    }
  }

  return fallback;
}

async function readAggregatesFromDataFile(): Promise<DashboardAggregates | null> {
  const candidates = [
    path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "data", AGGREGATE_FILE),
    path.join(/*turbopackIgnore: true*/ process.cwd(), "data", AGGREGATE_FILE),
  ];

  for (const filePath of candidates) {
    try {
      const file = await readFile(filePath, "utf8");

      try {
        return JSON.parse(file) as DashboardAggregates;
      } catch {
        const partialAggregates = extractAggregateKpis(file);

        if (partialAggregates) {
          return partialAggregates;
        }
      }
    } catch {
      // Try the next supported location, then fall back to mock-backed defaults.
    }
  }

  return null;
}

function buildKpiMetrics(
  aggregates: DashboardAggregates | null,
  mockMetrics: KpiMetric[],
): KpiMetric[] {
  const kpis = aggregates?.kpis;
  const mockMetricById = new Map(mockMetrics.map((metric) => [metric.id, metric]));
  const mockRealtimeSource = "\u004d\u006f\u0063\u006b \u6570\u636e";

  if (!kpis) {
    const currentOnline = annotateMockMetric(mockMetricById.get("current-online"), mockRealtimeSource);
    return currentOnline ? [currentOnline] : [];
  }

  const realSource = "\u963f\u91cc\u4e91\u5929\u6c60 Steam \u8bc4\u8bba\u6570\u636e";
  const realMetrics: KpiMetric[] = [
    {
      id: "total-reviews",
      source_type: "real",
      label: "\u8bc4\u8bba\u603b\u6570",
      value: formatNumber(kpis.total_reviews ?? 0),
      change: "\u0053\u0074\u0065\u0061\u006d \u8bc4\u8bba\u6837\u672c",
      source: realSource,
      trend: "flat",
      accent: "cyan",
    },
    {
      id: "positive-rate",
      source_type: "real",
      label: "\u597d\u8bc4\u7387",
      value: typeof kpis.recommend_rate === "number" ? `${(kpis.recommend_rate * 100).toFixed(1)}%` : "--",
      change: `${formatNumber(kpis.recommended_reviews ?? 0)} \u6761\u63a8\u8350\u8bc4\u8bba`,
      source: realSource,
      trend: "up",
      accent: "green",
    },
    {
      id: "negative-reviews",
      source_type: "real",
      label: "\u8d1f\u9762\u8bc4\u8bba\u6570",
      value: formatNumber(kpis.not_recommended_reviews ?? 0),
      change: `${formatNumber(kpis.total_reviews ?? 0)} \u6761\u8bc4\u8bba\u6837\u672c`,
      source: realSource,
      trend: "down",
      accent: "rose",
    },
    {
      id: "avg-playtime-hours",
      source_type: "real",
      label: "\u5e73\u5747\u6e38\u620f\u65f6\u957f",
      value: formatHours(kpis.avg_playtime_hours),
      change: "\u5e73\u5747\u7d2f\u8ba1\u6e38\u73a9\u65f6\u957f",
      source: realSource,
      trend: "flat",
      accent: "amber",
    },
    {
      id: "median-playtime-hours",
      source_type: "real",
      label: "\u4e2d\u4f4d\u6570\u6e38\u620f\u65f6\u957f",
      value: formatHours(kpis.median_playtime_hours),
      change: "\u4e2d\u4f4d\u6570\u7d2f\u8ba1\u6e38\u73a9\u65f6\u957f",
      source: realSource,
      trend: "flat",
      accent: "amber",
    },
  ];

  const currentOnline = annotateMockMetric(mockMetricById.get("current-online"), mockRealtimeSource);
  return [
    ...realMetrics,
    ...[currentOnline].filter((metric): metric is KpiMetric => Boolean(metric)),
  ];

  function annotateMockMetric(metric: KpiMetric | undefined, source?: string): KpiMetric | undefined {
    if (!metric) {
      return undefined;
    }

    return {
      ...metric,
      source_type: "mock",
      source: source ?? mockRealtimeSource,
    };
  }
}

function extractAggregateKpis(file: string): DashboardAggregates | null {
  const kpisMatch = file.match(/"kpis"\s*:\s*\{([\s\S]*?)\s*\}/);
  const body = kpisMatch?.[1];

  if (!body) {
    return null;
  }

  const readNumber = (field: string) => {
    const match = body.match(new RegExp(`"${field}"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`));
    return match ? Number(match[1]) : undefined;
  };

  const kpis: DashboardAggregates["kpis"] = {
    total_reviews: readNumber("total_reviews"),
    recommended_reviews: readNumber("recommended_reviews"),
    not_recommended_reviews: readNumber("not_recommended_reviews"),
    recommend_rate: readNumber("recommend_rate"),
    avg_playtime_hours: readNumber("avg_playtime_hours"),
    median_playtime_hours: readNumber("median_playtime_hours"),
    max_playtime_hours: readNumber("max_playtime_hours"),
  };

  return Object.values(kpis).some((value) => typeof value === "number") ? { kpis } : null;
}

function formatHours(value: number | undefined): string {
  return typeof value === "number" ? `${value.toFixed(1)}h` : "--";
}

function buildPlaytimeDistribution(
  aggregates: DashboardAggregates | null,
): PlaytimeDistributionSegment[] | null {
  const segments = aggregates?.playtime_segments;

  if (!segments?.length) {
    return null;
  }

  const total = segments.reduce((sum, segment) => sum + segment.review_count, 0) || 1;

  return segments.map((segment, index) => ({
    id: `real-playtime-${index}`,
    source_type: "real",
    range: segment.segment,
    players: segment.review_count,
    recommendedReviews: segment.recommended ?? 0,
    notRecommendedReviews: segment.not_recommended ?? 0,
    recommendRate: Number(((segment.recommend_rate ?? 0) * 100).toFixed(1)),
    percentage: Number(((segment.review_count / total) * 100).toFixed(1)),
    segment: segment.segment,
  }));
}

function buildPlaytimeSentiment(
  aggregates: DashboardAggregates | null,
): PlaytimeSentimentPoint[] | null {
  const segments = aggregates?.playtime_segments;

  if (!segments?.length) {
    return null;
  }

  return segments.map((segment, index) => ({
    id: `real-sentiment-${index}`,
    source_type: "real",
    segment: segment.segment,
    avgPlaytimeHours: segment.avg_playtime_hours ?? 0,
    positiveRate: Number(((segment.recommend_rate ?? 0) * 100).toFixed(1)),
    reviewCount: segment.review_count,
  }));
}

function buildReviews(
  reviews: WukongReview[],
  aggregates: DashboardAggregates | null,
  limit = 50,
): Review[] | null {
  const sourceReviews = reviews.length ? reviews : (aggregates?.high_priority_reviews ?? []);

  if (!sourceReviews.length) {
    return null;
  }

  return [...sourceReviews]
    .sort(compareReviews)
    .slice(0, limit)
    .map((review, index) => ({
      id: review.review_id || `real-review-${index}`,
      source_type: "real",
      author: `\u73a9\u5bb6 ${String(index + 1).padStart(3, "0")}`,
      platform: normalizePlatform(review.platform),
      platformRaw: review.platform || "Steam",
      game: review.game || "Black Myth: Wukong",
      userSegment: review.user_segment || "\u672a\u5206\u5c42",
      userSegmentGroup: normalizeUserSegment(review.user_segment),
      topic: review.topic || "\u5176\u4ed6\u53cd\u9988",
      sentiment: normalizeSentiment(review),
      sentimentText: review.sentiment || sentimentTextFromRecommendation(review),
      sentimentScore: Number(review.sentiment_score ?? 0),
      recommendation: review.recommendation || recommendationTextFromReview(review),
      recommendationGroup: recommendationTextFromReview(review),
      playtimeHours: Number(review.playtime_hours ?? 0),
      attentionScore: Number(review.attention_score ?? 0),
      content: normalizeCommentContent(review.content_clean, review.content),
      suggestedAction: review.suggested_action || "\u6682\u65e0\u8fd0\u8425\u5efa\u8bae",
      urgency: review.urgency || "\u672a\u6807\u6ce8",
      urgencyGroup: normalizeUrgency(review.urgency),
      createdAt: review.published_date || "",
    }));
}

function compareReviews(a: WukongReview, b: WukongReview): number {
  const dateCompare = (b.published_date || "").localeCompare(a.published_date || "");

  if (dateCompare !== 0) {
    return dateCompare;
  }

  const urgencyCompare = urgencyRank(b.urgency) - urgencyRank(a.urgency);

  if (urgencyCompare !== 0) {
    return urgencyCompare;
  }

  return (b.attention_score ?? 0) - (a.attention_score ?? 0);
}

function urgencyRank(urgency: string | undefined): number {
  if (!urgency) {
    return 0;
  }

  if (urgency.includes("\u9ad8")) {
    return 3;
  }

  if (urgency.includes("\u4e2d")) {
    return 2;
  }

  if (urgency.includes("\u4f4e")) {
    return 1;
  }

  return 0;
}

function normalizeCommentContent(contentClean: string | undefined, content: string | undefined): string {
  const fallback = "\u8be5\u7528\u6237\u672a\u586b\u5199\u6587\u672c\u8bc4\u8bba";
  const trimmedContent = contentClean?.trim() || content?.trim();

  return trimmedContent?.length ? trimmedContent : fallback;
}

function normalizeUserSegment(segment: string | undefined): string {
  if (!segment) {
    return "\u672a\u5206\u5c42";
  }

  if (segment.includes("\u5c1d\u9c9c")) {
    return "\u5c1d\u9c9c\u7528\u6237";
  }

  if (segment.includes("\u8f7b\u5ea6")) {
    return "\u8f7b\u5ea6\u4f53\u9a8c";
  }

  if (segment.includes("\u6838\u5fc3")) {
    return "\u6838\u5fc3\u63a8\u8fdb";
  }

  if (segment.includes("\u6df1\u5ea6")) {
    return "\u6df1\u5ea6\u73a9\u5bb6";
  }

  return segment;
}

function normalizeUrgency(urgency: string | undefined): string {
  if (!urgency) {
    return "\u672a\u6807\u6ce8";
  }

  if (urgency.includes("\u9ad8")) {
    return "\u9ad8";
  }

  if (urgency.includes("\u4e2d")) {
    return "\u4e2d";
  }

  if (urgency.includes("\u4f4e")) {
    return "\u4f4e";
  }

  return urgency;
}

function buildFilters(reviews: WukongReview[], aggregates: DashboardAggregates | null) {
  const platforms = uniqueStrings(reviews.map((review) => review.platform)).filter(Boolean);
  const dateRange = aggregates?.dataset?.date_range;
  const dates = uniqueStrings(reviews.map((review) => review.published_date)).sort();

  return {
    platforms: ["\u5168\u90e8", ...(platforms.length ? platforms : ["Steam"])],
    recommendations: ["\u5168\u90e8", "\u63a8\u8350", "\u4e0d\u63a8\u8350"],
    sentiments: ["\u5168\u90e8", "\u6b63\u5411", "\u4e2d\u6027", "\u8d1f\u5411"],
    topics: [
      "\u5168\u90e8",
      "\u6027\u80fd\u4f18\u5316",
      "\u6218\u6597\u4f53\u9a8c",
      "\u5267\u60c5\u6587\u5316",
      "\u7f8e\u672f\u97f3\u4e50",
      "\u4ef7\u683c\u8d2d\u4e70",
      "\u5185\u5bb9\u671f\u5f85",
      "\u5176\u4ed6\u53cd\u9988",
    ],
    userSegments: ["\u5168\u90e8", "\u5c1d\u9c9c\u7528\u6237", "\u8f7b\u5ea6\u4f53\u9a8c", "\u6838\u5fc3\u63a8\u8fdb", "\u6df1\u5ea6\u73a9\u5bb6"],
    urgencies: ["\u5168\u90e8", "\u9ad8", "\u4e2d", "\u4f4e"],
    dateRanges: ["\u5168\u90e8", ...(dates.length ? dates : (dateRange ?? []))],
    defaults: {
      platform: "\u5168\u90e8",
      recommendation: "\u5168\u90e8",
      sentiment: "\u5168\u90e8",
      topic: "\u5168\u90e8",
      user_segment: "\u5168\u90e8",
      urgency: "\u5168\u90e8",
      dateRange: "\u5168\u90e8",
    },
  };
}

function normalizePlatform(platform: string): Platform {
  if (platform === "PS5" || platform === "Xbox" || platform === "WeGame") {
    return platform;
  }

  return "Steam";
}

function normalizeSentiment(review: WukongReview): Sentiment {
  if (review.is_recommended === true) {
    return "positive";
  }

  if (review.is_recommended === false) {
    return "negative";
  }

  if (typeof review.sentiment_score === "number") {
    if (review.sentiment_score > 0.2) {
      return "positive";
    }

    if (review.sentiment_score < -0.2) {
      return "negative";
    }
  }

  return "neutral";
}

function sentimentTextFromRecommendation(review: WukongReview): string {
  if (review.is_recommended === true) {
    return "\u6b63\u5411";
  }

  if (review.is_recommended === false) {
    return "\u8d1f\u5411";
  }

  return "\u4e2d\u6027";
}

function recommendationTextFromReview(review: WukongReview): string {
  if (review.is_recommended === true) {
    return "\u63a8\u8350";
  }

  if (review.is_recommended === false) {
    return "\u4e0d\u63a8\u8350";
  }

  return "\u672a\u6807\u6ce8";
}

function getUpdatedAt(aggregates: DashboardAggregates | null): string {
  const dateRange = aggregates?.dataset?.date_range;
  return dateRange?.[dateRange.length - 1] ?? "2026-06-16 20:30:00";
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function formatNumber(value: number): string {
  return value.toLocaleString("zh-CN");
}
