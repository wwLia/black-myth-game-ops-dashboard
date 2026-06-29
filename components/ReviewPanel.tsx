"use client";

import { useMemo, useState } from "react";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import type { Review } from "@/types/dashboard";
import { cn } from "@/lib/utils";

export type ReviewPanelProps = {
  reviews: Review[];
  selectedReviewId?: string;
  onSelectedReviewChange: (reviewId: string) => void;
};

const sentimentClassName: Record<Review["sentiment"], string> = {
  positive: "ops-tone-positive",
  neutral: "ops-tone-neutral",
  negative: "ops-tone-negative",
};

const emptyStateText = "暂无评论数据";

export function ReviewPanel({ reviews, selectedReviewId, onSelectedReviewChange }: ReviewPanelProps) {
  const [expandedReviewIds, setExpandedReviewIds] = useState<Set<string>>(new Set());
  const selectedReview = useMemo(
    () => reviews.find((review) => review.id === selectedReviewId) ?? reviews[0],
    [reviews, selectedReviewId],
  );
  const selectedReviewIndex = selectedReview ? reviews.findIndex((review) => review.id === selectedReview.id) : 0;

  if (!reviews.length) {
    return (
      <div className="ops-card-muted rounded px-4 py-8 text-center text-sm text-slate-400">
        {emptyStateText}
      </div>
    );
  }

  return (
    <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <DataSourceBadge sourceType="real" className="absolute right-3 top-3 z-20" />
      <div className="ops-scrollbar max-h-[460px] overflow-y-auto rounded border border-cyan-300/20">
        <div className="sticky top-0 z-10 border-b border-cyan-300/15 bg-slate-900/95 px-4 py-3 pr-24 text-xs font-medium text-slate-400 backdrop-blur sm:pr-56">
          {"阿里云天池 Steam 评论"} · {reviews.length} {"条"}
        </div>

        <div className="ops-review-surface space-y-3 p-3">
          {reviews.slice(0, 30).map((review, index) => {
            const isExpanded = expandedReviewIds.has(review.id);

            return (
            <button
              key={review.id}
              type="button"
              onClick={() => {
                onSelectedReviewChange(review.id);
                setExpandedReviewIds((currentIds) => {
                  const nextIds = new Set(currentIds);
                  if (nextIds.has(review.id)) {
                    nextIds.delete(review.id);
                  } else {
                    nextIds.add(review.id);
                  }
                  return nextIds;
                });
              }}
              className={cn(
                "ops-focus-ring block w-full rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-left text-sm text-slate-300 transition hover:border-cyan-300/40 hover:bg-cyan-300/5",
                selectedReview?.id === review.id && "border-cyan-300/45 bg-cyan-300/10",
                review.sentiment === "negative" && "hover:border-rose-300/50",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-100">{formatPlayerLabel(index)}</span>
                <MetaPill>{review.platform}</MetaPill>
                <MetaPill>{review.game}</MetaPill>
                <MetaPill>{review.userSegment}</MetaPill>
                <MetaPill>{`${review.playtimeHours.toFixed(1)}h`}</MetaPill>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={cn("ops-badge inline-flex rounded border px-2 py-1 text-xs", sentimentClassName[review.sentiment])}>
                  {review.sentimentText}
                </span>
                <span className={cn("ops-badge inline-flex rounded border px-2 py-1 text-xs", getRecommendationClassName(review.recommendation))}>
                  {review.recommendation}
                </span>
                <span className={cn("ops-badge inline-flex rounded border px-2 py-1 text-xs", getUrgencyClassName(review.urgency))}>
                  {review.urgency}
                </span>
                <span className="text-xs text-cyan-100">{review.topic}</span>
              </div>

              <p className={cn("mt-3 leading-6 text-slate-300", !isExpanded && "line-clamp-3")}>{review.content}</p>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{review.suggestedAction}</p>
            </button>
          );
          })}
        </div>
      </div>

      {selectedReview ? (
        <ReviewDetail review={selectedReview} authorLabel={formatPlayerLabel(selectedReviewIndex)} />
      ) : null}
    </div>
  );
}

function ReviewDetail({ review, authorLabel }: { review: Review; authorLabel: string }) {
  return (
    <aside className="ops-panel ops-scrollbar max-h-[460px] overflow-y-auto rounded p-4 text-sm text-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">{"完整评论"}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{authorLabel}</h3>
        </div>
        <span className={cn("ops-badge inline-flex rounded border px-2 py-1 text-xs", sentimentClassName[review.sentiment])}>
          {review.sentimentText}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <DetailItem label="平台" value={review.platform} />
        <DetailItem label="游戏" value={review.game} />
        <DetailItem label="用户分层" value={review.userSegment} />
        <DetailItem label="游戏时长" value={`${review.playtimeHours.toFixed(1)}h`} />
        <DetailItem label="是否推荐" value={review.recommendation} />
        <DetailItem label="优先级" value={review.urgency} />
        <DetailItem label="主题" value={review.topic} className="col-span-2" />
      </div>

      <section className="mt-5">
        <h4 className="text-xs font-medium text-slate-400">{"评论内容"}</h4>
        <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-200">{review.content}</p>
      </section>

      <section className="mt-5 border-t border-slate-800 pt-4">
        <h4 className="text-xs font-medium text-slate-400">{"运营建议"}</h4>
        <p className="mt-2 leading-6 text-cyan-100">{review.suggestedAction}</p>
      </section>
    </aside>
  );
}

function MetaPill({ children }: { children: string }) {
  return (
    <span className="ops-badge ops-tone-neutral rounded border px-2 py-1 text-xs">
      {children}
    </span>
  );
}

function DetailItem({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("ops-card rounded p-3", className)}>
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 text-slate-100">{value}</p>
    </div>
  );
}

function getRecommendationClassName(recommendation: string): string {
  return recommendation.includes("不") ? "ops-tone-negative" : "ops-tone-positive";
}

function getUrgencyClassName(urgency: string): string {
  if (urgency.includes("高")) {
    return "ops-priority-high";
  }

  if (urgency.includes("中")) {
    return "ops-tone-warning";
  }

  if (urgency.includes("低")) {
    return "ops-tone-neutral";
  }

  return "ops-tone-cyan";
}

function formatPlayerLabel(index: number): string {
  return `玩家 ${String(Math.max(0, index) + 1).padStart(3, "0")}`;
}
