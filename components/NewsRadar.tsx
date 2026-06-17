"use client";

import { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import type { NewsItem, NewsSentiment, RadarMetric } from "@/types/dashboard";
import { cn } from "@/lib/utils";

export type NewsRadarProps = {
  metrics: RadarMetric[];
  news: NewsItem[];
};

const sentimentClassName: Record<NewsSentiment, string> = {
  positive: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  neutral: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  negative: "border-rose-300/25 bg-rose-300/10 text-rose-200",
};

const sentimentLabel: Record<NewsSentiment, string> = {
  positive: "正向",
  neutral: "中性",
  negative: "负向",
};

export function NewsRadar({ metrics, news }: NewsRadarProps) {
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(news[0]?.id ?? null);
  const filteredNews = useMemo(
    () => (activeKeyword ? news.filter((item) => item.keywords.includes(activeKeyword)) : news),
    [activeKeyword, news],
  );

  const option = {
    tooltip: {},
    legend: { bottom: 0, textStyle: { color: "#cbd5e1" } },
    radar: {
      radius: "64%",
      indicator: metrics.map((item) => ({ name: item.metric, max: 100 })),
      axisName: { color: "#cbd5e1" },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.2)" } },
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.24)" } },
      splitArea: { areaStyle: { color: ["rgba(15,23,42,0.55)", "rgba(8,47,73,0.28)"] } },
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: metrics.map((item) => item.score),
            name: "黑神话相关热度",
            areaStyle: { color: "rgba(34,211,238,0.18)" },
            lineStyle: { color: "#22d3ee" },
          },
          {
            value: metrics.map((item) => item.benchmark),
            name: "行业基准",
            areaStyle: { color: "rgba(251,191,36,0.1)" },
            lineStyle: { color: "#fbbf24" },
          },
        ],
      },
    ],
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.86fr_1.14fr]">
      <div className="relative rounded border border-slate-800 bg-slate-950/35">
        <ReactECharts option={option} style={{ height: 340 }} />
        <DataSourceBadge sourceType="mock" className="absolute right-3 top-3" />
        <span className="absolute right-3 top-12 text-xs text-slate-400">
          {"未来可接 NewsAPI / RSS / GDELT"}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-400">
          <span>
            {activeKeyword
              ? `关键词筛选：${activeKeyword} / ${filteredNews.length} 条`
              : `全部 Mock 行业新闻 / ${filteredNews.length} 条`}
          </span>
          {activeKeyword ? (
            <button
              type="button"
              onClick={() => setActiveKeyword(null)}
              className="rounded border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-cyan-100"
            >
              {"清除关键词"}
            </button>
          ) : null}
        </div>

        <div className="max-h-[520px] space-y-3 overflow-y-auto">
          {filteredNews.map((item) => {
            const isExpanded = expandedNewsId === item.id;

            return (
              <article key={item.id} className="rounded border border-slate-700/70 bg-slate-950/50 p-3">
                <button
                  type="button"
                  onClick={() => setExpandedNewsId(isExpanded ? null : item.id)}
                  className="block w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium leading-6 text-slate-100">{item.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.source} · {item.published_at} · {item.category}
                      </p>
                    </div>
                    <span className={cn("shrink-0 rounded border px-2 py-1 text-xs", sentimentClassName[item.sentiment])}>
                      {sentimentLabel[item.sentiment]}
                    </span>
                  </div>
                </button>

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.keywords.map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => setActiveKeyword(keyword)}
                      className={cn(
                        "rounded border px-2 py-1 text-xs transition",
                        activeKeyword === keyword
                          ? "border-cyan-300/45 bg-cyan-300/15 text-cyan-100"
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-cyan-300/35 hover:text-cyan-100",
                      )}
                    >
                      {keyword}
                    </button>
                  ))}
                </div>

                {isExpanded ? (
                  <div className="mt-3 border-t border-slate-800 pt-3">
                    <p className="text-sm leading-6 text-slate-300">{item.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{`相关度：${item.relevance_score}`}</span>
                      <span>{`关联游戏：${item.related_games.join(" / ")}`}</span>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
