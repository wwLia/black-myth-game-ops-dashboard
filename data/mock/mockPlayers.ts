import type {
  KpiMetric,
  PlaytimeDistributionSegment,
  PlaytimeSentimentPoint,
} from "@/types/dashboard";

export const kpiMetrics: KpiMetric[] = ([
  {
    id: "current-online",
    label: "\u5f53\u524d\u5728\u7ebf\u4eba\u6570",
    value: "1,763,480",
    change: "+8.4% vs \u6628\u65e5\u540c\u65f6\u6bb5",
    trend: "up",
    accent: "cyan",
  },
  {
    id: "peak-online",
    label: "24\u5c0f\u65f6\u5cf0\u503c",
    value: "1,842,300",
    change: "+12.6% vs \u6628\u65e5",
    trend: "up",
    accent: "cyan",
  },
  {
    id: "positive-rate",
    label: "\u597d\u8bc4\u7387",
    value: "93.8%",
    change: "+1.1pt \u8fd17\u65e5",
    trend: "up",
    accent: "green",
  },
  {
    id: "negative-reviews",
    label: "\u8d1f\u9762\u8bc4\u8bba\u6570",
    value: "1,284",
    change: "-6.3% \u8fd124\u5c0f\u65f6",
    trend: "down",
    accent: "rose",
  },
  {
    id: "today-news",
    label: "\u4eca\u65e5\u65b0\u95fb\u6570",
    value: "37",
    change: "9 \u6761\u9ad8\u5f71\u54cd\u65b0\u95fb",
    trend: "up",
    accent: "amber",
  },
] as const).map((metric) => ({ ...metric, source_type: "mock" }));

export const playtimeDistribution: PlaytimeDistributionSegment[] = ([
  { id: "d-1", range: "0-2h", players: 1860000, recommendedReviews: 781200, notRecommendedReviews: 1078800, recommendRate: 42, percentage: 8.2, segment: "\u65e9\u671f\u6d41\u5931" },
  { id: "d-2", range: "2-5h", players: 2360000, recommendedReviews: 1840800, notRecommendedReviews: 519200, recommendRate: 78, percentage: 10.2, segment: "\u8f7b\u5ea6\u4f53\u9a8c" },
  { id: "d-3", range: "5-20h", players: 9160000, recommendedReviews: 8152400, notRecommendedReviews: 1007600, recommendRate: 89, percentage: 40.1, segment: "\u4e3b\u7ebf\u63a8\u8fdb" },
  { id: "d-4", range: "20-60h", players: 6810000, recommendedReviews: 6401400, notRecommendedReviews: 408600, recommendRate: 94, percentage: 29.8, segment: "\u6df1\u5ea6\u63a2\u7d22" },
  { id: "d-5", range: "60h+", players: 2680000, recommendedReviews: 2599600, notRecommendedReviews: 80400, recommendRate: 97, percentage: 11.7, segment: "\u786c\u6838\u6536\u96c6" },
] as const).map((segment) => ({ ...segment, source_type: "mock" }));

export const playtimeSentiment: PlaytimeSentimentPoint[] = ([
  { id: "newcomer", segment: "\u8f7b\u5ea6\u4f53\u9a8c", avgPlaytimeHours: 4.2, positiveRate: 78, reviewCount: 4200 },
  { id: "story", segment: "\u4e3b\u7ebf\u63a8\u8fdb", avgPlaytimeHours: 16.8, positiveRate: 89, reviewCount: 12600 },
  { id: "explore", segment: "\u6df1\u5ea6\u63a2\u7d22", avgPlaytimeHours: 38.5, positiveRate: 94, reviewCount: 9800 },
  { id: "hardcore", segment: "\u786c\u6838\u6536\u96c6", avgPlaytimeHours: 86.3, positiveRate: 97, reviewCount: 3600 },
  { id: "churn", segment: "\u65e9\u671f\u6d41\u5931", avgPlaytimeHours: 1.6, positiveRate: 42, reviewCount: 1900 },
] as const).map((segment) => ({ ...segment, source_type: "mock" }));
