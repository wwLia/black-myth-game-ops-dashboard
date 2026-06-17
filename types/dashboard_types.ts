export type Sentiment = '正向' | '中性' | '负向';
export type Urgency = '高' | '中' | '低';

export interface WukongReview {
  review_id: string;
  user_id: string;
  user_name: string;
  platform: 'Steam';
  game: 'Black Myth: Wukong';
  published_date: string;
  published_date_raw: string;
  recommendation: '推荐' | '不推荐';
  is_recommended: boolean;
  playtime_hours: number;
  user_segment: '尝鲜用户(0-2h)' | '轻度体验(2-10h)' | '核心推进(10-50h)' | '深度玩家(50h+)';
  content_clean: string;
  content_length: number;
  topic: string;
  sentiment: Sentiment;
  sentiment_score: number;
  attention_score: number;
  urgency: Urgency;
  suggested_action: string;
}

export interface DashboardAggregates {
  dataset: {
    name: string;
    source_note: string;
    platform: string;
    date_range: string[];
  };
  kpis: {
    total_reviews: number;
    recommended_reviews: number;
    not_recommended_reviews: number;
    recommend_rate: number;
    avg_playtime_hours: number;
    median_playtime_hours: number;
    max_playtime_hours: number;
    empty_comments: number;
    duplicate_user_links: number;
  };
  by_date: Array<{
    date: string;
    review_count: number;
    recommended: number;
    not_recommended: number;
    recommend_rate: number;
    avg_playtime_hours: number;
  }>;
  playtime_segments: Array<{
    segment: string;
    review_count: number;
    recommended: number;
    not_recommended: number;
    recommend_rate: number;
    avg_playtime_hours: number;
  }>;
  topic_distribution: Array<{
    topic: string;
    review_count: number;
    recommended: number;
    not_recommended: number;
    negative_sentiment: number;
    recommend_rate: number;
  }>;
}
