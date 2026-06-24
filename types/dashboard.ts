export type Platform = "Steam";

export type Sentiment = "positive" | "neutral" | "negative";
export type SourceType = "real" | "derived" | "mock" | "future";

export type KpiMetric = {
  id: string;
  source_type: SourceType;
  label: string;
  value: string;
  change: string;
  source?: string;
  trend: "up" | "down" | "flat";
  accent: "cyan" | "green" | "amber" | "rose";
};

export type PlayerTrendPoint = {
  source_type: SourceType;
  timestamp: string;
  online_players: number;
  platform: string;
  game: string;
  event_id: string | null;
};

export type OpsEvent = {
  source_type: SourceType;
  event_id: string;
  event_name: string;
  event_type: string;
  start_time: string;
  end_time: string;
  description: string;
  related_metric: string;
  expected_impact: string;
};

export type PlaytimeDistributionSegment = {
  id: string;
  source_type: SourceType;
  range: string;
  players: number;
  recommendedReviews: number;
  notRecommendedReviews: number;
  recommendRate: number;
  percentage: number;
  segment: string;
};

export type PlaytimeSentimentPoint = {
  id: string;
  source_type: SourceType;
  segment: string;
  avgPlaytimeHours: number;
  positiveRate: number;
  reviewCount: number;
};

export type TopicDistributionPoint = {
  id: string;
  source_type: SourceType;
  topic: string;
  reviewCount: number;
  recommendedReviews: number;
  notRecommendedReviews: number;
  recommendRate: number;
};

export type ReviewTopic = string;

export type Review = {
  id: string;
  source_type: SourceType;
  author: string;
  platform: Platform;
  platformRaw: string;
  game: string;
  userSegment: string;
  userSegmentGroup: string;
  topic: ReviewTopic;
  sentiment: Sentiment;
  sentimentText: string;
  sentimentScore: number;
  recommendation: string;
  recommendationGroup: string;
  playtimeHours: number;
  attentionScore: number;
  content: string;
  suggestedAction: string;
  urgency: string;
  urgencyGroup: string;
  createdAt: string;
};

export type ReviewCategorySummary = {
  source_type: SourceType;
  topic: ReviewTopic;
  count: number;
  positiveRate: number;
  keywords: string[];
};

export type TopicNode = {
  id: string;
  source_type: SourceType;
  label: string;
  type: "topic" | Sentiment;
  weight: number;
};

export type TopicEdge = {
  id: string;
  source_type: SourceType;
  source: string;
  target: string;
  strength: number;
};

export type TopicNetworkData = {
  nodes: TopicNode[];
  edges: TopicEdge[];
};

export type NewsSentiment = "positive" | "neutral" | "negative";

export type NewsItem = {
  id: string;
  source_type: SourceType;
  title: string;
  source: string;
  published_at: string;
  category: string;
  keywords: string[];
  summary: string;
  relevance_score: number;
  sentiment: NewsSentiment;
  related_games: string[];
};

export type RadarMetric = {
  source_type: SourceType;
  metric: string;
  score: number;
  benchmark: number;
};

export type WukongReview = {
  review_id: string;
  user_id?: string;
  user_name?: string;
  platform: string;
  game?: string;
  published_date: string;
  published_date_raw?: string;
  recommendation?: string;
  is_recommended?: boolean;
  playtime_hours: number;
  user_segment?: string;
  content_clean: string;
  content?: string;
  content_length?: number;
  topic?: string;
  sentiment?: string;
  sentiment_score?: number;
  attention_score?: number;
  urgency?: string;
  suggested_action?: string;
};

export type DashboardAggregates = {
  dataset?: {
    name?: string;
    source_note?: string;
    platform?: string;
    date_range?: string[];
  };
  kpis?: {
    total_reviews?: number;
    recommended_reviews?: number;
    not_recommended_reviews?: number;
    recommend_rate?: number;
    avg_playtime_hours?: number;
    median_playtime_hours?: number;
    max_playtime_hours?: number;
    empty_comments?: number;
    duplicate_user_links?: number;
  };
  by_date?: Array<{
    date: string;
    review_count: number;
    recommended?: number;
    not_recommended?: number;
    recommend_rate?: number;
    avg_playtime_hours?: number;
  }>;
  playtime_segments?: Array<{
    segment: string;
    review_count: number;
    recommended?: number;
    not_recommended?: number;
    recommend_rate?: number;
    avg_playtime_hours?: number;
  }>;
  topic_distribution?: Array<{
    topic: string;
    review_count: number;
    recommended?: number;
    not_recommended?: number;
    negative_sentiment?: number;
    recommend_rate?: number;
  }>;
  high_priority_reviews?: WukongReview[];
};

export type DashboardFilters = {
  platform: string;
  recommendation: string;
  sentiment: string;
  topic: string;
  user_segment: string;
  urgency: string;
  dateRange: string;
  quadrant: string;
};

export type DashboardViewData = {
  updatedAt: string;
  kpiMetrics: KpiMetric[];
  onlineTrend: PlayerTrendPoint[];
  opsEvents: OpsEvent[];
  playtimeDistribution: PlaytimeDistributionSegment[];
  playtimeSentiment: PlaytimeSentimentPoint[];
  reviews: Review[];
  allReviews: Review[];
  newsItems: NewsItem[];
  newsRadarMetrics: RadarMetric[];
  filters: {
    platforms: string[];
    recommendations: string[];
    sentiments: string[];
    topics: string[];
    userSegments: string[];
    urgencies: string[];
    dateRanges: string[];
    defaults: DashboardFilters;
  };
};
