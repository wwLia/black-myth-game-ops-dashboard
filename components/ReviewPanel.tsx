"use client";

import { useMemo } from "react";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import type { Review } from "@/types/dashboard";
import { cn } from "@/lib/utils";

export type ReviewPanelProps = {
  reviews: Review[];
  selectedReviewId?: string;
  onSelectedReviewChange: (reviewId: string) => void;
};

const sentimentClassName: Record<Review["sentiment"], string> = {
  positive: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  neutral: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  negative: "border-rose-300/25 bg-rose-300/10 text-rose-200",
};

const urgencyClassName = "border-cyan-300/20 bg-cyan-300/10 text-cyan-100";
const emptyStateText = "暂无评论数据";

export function ReviewPanel({ reviews, selectedReviewId, onSelectedReviewChange }: ReviewPanelProps) {
  const selectedReview = useMemo(
    () => reviews.find((review) => review.id === selectedReviewId) ?? reviews[0],
    [reviews, selectedReviewId],
  );
  const selectedReviewIndex = selectedReview ? reviews.findIndex((review) => review.id === selectedReview.id) : 0;

  if (!reviews.length) {
    return (
      <div className="rounded border border-slate-700/70 bg-slate-950/45 px-4 py-8 text-center text-sm text-slate-400">
        {emptyStateText}
      </div>
    );
  }

  return (
    <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <DataSourceBadge sourceType="real" className="absolute right-3 top-3 z-20" />
      <div className="max-h-[420px] overflow-y-auto rounded border border-slate-700/70">
        <div className="sticky top-0 z-10 border-b border-slate-700/70 bg-slate-900/95 px-4 py-3 pr-56 text-xs font-medium text-slate-400 backdrop-blur">
          {"阿里云天池 Steam 评论"} · {reviews.length} {"条"}
        </div>

        <div className="space-y-3 bg-slate-950/35 p-3">
          {reviews.map((review, index) => (
            <button
              key={review.id}
              type="button"
              onClick={() => onSelectedReviewChange(review.id)}
              className={cn(
                "block w-full rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-left text-sm text-slate-300 transition hover:border-cyan-300/40 hover:bg-cyan-300/5",
                selectedReview?.id === review.id && "border-cyan-300/45 bg-cyan-300/10",
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
                <span className={cn("inline-flex rounded border px-2 py-1 text-xs", sentimentClassName[review.sentiment])}>
                  {review.sentimentText}
                </span>
                <span className="inline-flex rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200">
                  {review.recommendation}
                </span>
                <span className={cn("inline-flex rounded border px-2 py-1 text-xs", urgencyClassName)}>
                  {review.urgency}
                </span>
                <span className="text-xs text-cyan-100">{review.topic}</span>
              </div>

              <p className="mt-3 line-clamp-3 leading-6 text-slate-300">{review.content}</p>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{review.suggestedAction}</p>
            </button>
          ))}
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
    <aside className="max-h-[420px] overflow-y-auto rounded border border-cyan-300/20 bg-slate-950/60 p-4 text-sm text-slate-300 shadow-[0_0_28px_rgba(14,165,233,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">{"完整评论"}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{authorLabel}</h3>
        </div>
        <span className={cn("inline-flex rounded border px-2 py-1 text-xs", sentimentClassName[review.sentiment])}>
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
        <p className="mt-2 line-clamp-3 whitespace-pre-wrap leading-6 text-slate-200">{review.content}</p>
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
    <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-400">
      {children}
    </span>
  );
}

function DetailItem({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("rounded border border-slate-800 bg-slate-900/45 p-3", className)}>
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 text-slate-100">{value}</p>
    </div>
  );
}

function formatPlayerLabel(index: number): string {
  return `玩家 ${String(Math.max(0, index) + 1).padStart(3, "0")}`;
}
