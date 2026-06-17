"use client";

import { DataSourceBadge } from "@/components/DataSourceBadge";
import type { Review } from "@/types/dashboard";
import { cn } from "@/lib/utils";

export type HighPriorityFeedbackPanelProps = {
  reviews: Review[];
  selectedReviewId?: string;
  interviewMode?: boolean;
  onReviewClick: (reviewId: string) => void;
};

const sentimentClassName: Record<Review["sentiment"], string> = {
  positive: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  neutral: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  negative: "border-rose-300/25 bg-rose-300/10 text-rose-200",
};

export function HighPriorityFeedbackPanel({
  reviews,
  selectedReviewId,
  interviewMode = false,
  onReviewClick,
}: HighPriorityFeedbackPanelProps) {
  const visibleReviews = reviews.slice(0, 10);

  return (
    <div
      className={cn(
        "relative rounded border border-rose-300/20 bg-slate-950/35",
        interviewMode && "ring-2 ring-amber-300/60 shadow-[0_0_32px_rgba(251,191,36,0.16)]",
      )}
      title={interviewMode ? "高优先级反馈池：把最需运营介入的负面评论放在一起" : undefined}
    >
      <DataSourceBadge sourceType="real" className="absolute right-3 top-3" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 pt-12">
        <div>
          <p className="text-xs text-rose-200">{"高优先级反馈池"}</p>
          <p className="mt-1 text-xs text-slate-500">
            {`已命中 ${reviews.length.toLocaleString("zh-CN")} 条，默认展示前 10 条`}
          </p>
          {interviewMode ? (
            <p className="mt-2 max-w-2xl rounded border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm leading-6 text-amber-100">
              {"面试讲解：这里不是简单列差评，而是按情绪、时长、主题和优先级筛出最值得立刻处理的运营反馈。"}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => console.log("运营反馈池", visibleReviews)}
          className="rounded border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-xs text-rose-100 transition hover:bg-rose-300/20"
        >
          {"导出运营反馈池"}
        </button>
      </div>

      {visibleReviews.length ? (
        <div className="max-h-[520px] space-y-3 overflow-y-auto p-3">
          {visibleReviews.map((review, index) => (
            <button
              key={review.id}
              type="button"
              onClick={() => onReviewClick(review.id)}
              className={cn(
                "block w-full rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-left transition hover:border-rose-300/45 hover:bg-rose-300/5",
                selectedReviewId === review.id && "border-rose-300/55 bg-rose-300/10",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-rose-300/30 bg-rose-300/10 px-2 py-1 text-xs text-rose-100">
                  {`#${String(index + 1).padStart(2, "0")}`}
                </span>
                <MetaPill>{review.userSegmentGroup}</MetaPill>
                <MetaPill>{`${review.playtimeHours.toFixed(1)}h`}</MetaPill>
                <MetaPill>{review.topic}</MetaPill>
                <span className={cn("rounded border px-2 py-1 text-xs", sentimentClassName[review.sentiment])}>
                  {review.sentimentText}
                </span>
                <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200">
                  {review.recommendationGroup}
                </span>
              </div>

              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-200">{review.content}</p>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-cyan-100">{review.suggestedAction}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-sm text-slate-500">
          {"当前筛选条件下暂无高优先级反馈"}
        </div>
      )}
    </div>
  );
}

function MetaPill({ children }: { children: string }) {
  return (
    <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-400">
      {children}
    </span>
  );
}
