import type { DashboardFilters, Review } from "@/types/dashboard";

const ALL = "\u5168\u90e8";

export function filterReviews(reviews: Review[], filters: DashboardFilters): Review[] {
  return reviews.filter((review) => {
    return (
      matchesAll(filters.recommendation, review.recommendationGroup) &&
      matchesAll(filters.sentiment, review.sentimentText) &&
      matchesAll(filters.topic, review.topic) &&
      matchesAll(filters.user_segment, review.userSegmentGroup) &&
      matchesAll(filters.urgency, review.urgencyGroup) &&
      matchesDateRange(review.createdAt, filters.dateRange) &&
      matchesQuadrant(review, filters.quadrant)
    );
  });
}

function matchesAll(filterValue: string, reviewValue: string): boolean {
  return filterValue === ALL || filterValue === reviewValue;
}

function matchesDateRange(date: string, dateRange: string): boolean {
  if (dateRange === ALL) {
    return true;
  }

  const [start, end] = dateRange.split("~").map((value) => value.trim());

  if (!end) {
    return date === start;
  }

  return date >= start && date <= end;
}

function matchesQuadrant(review: Review, quadrant: string): boolean {
  if (quadrant === ALL) {
    return true;
  }

  const highPlaytime = review.playtimeHours >= 10;
  const positive = review.sentimentScore >= 0 || review.sentimentText === "正向" || review.recommendationGroup === "推荐";

  if (quadrant === "early-risk") {
    return !highPlaytime && !positive;
  }

  if (quadrant === "deep-feedback") {
    return highPlaytime && !positive;
  }

  if (quadrant === "early-positive") {
    return !highPlaytime && positive;
  }

  if (quadrant === "core-advocates") {
    return highPlaytime && positive;
  }

  return true;
}
