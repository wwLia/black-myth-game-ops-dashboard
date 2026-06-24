"use client";

import { useEffect, useRef } from "react";
import { ClientECharts } from "@/components/ClientECharts";
import type { EChartsType } from "echarts";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import type { TopicDistributionPoint } from "@/types/dashboard";

export type TopicDistributionChartProps = {
  data: TopicDistributionPoint[];
  activeTopic: string;
  onTopicClick: (topic: string) => void;
};

const attentionThreshold = 70;
type RendererClickEvent = { offsetX?: number; offsetY?: number; zrX?: number; zrY?: number };

export function TopicDistributionChart({ data, activeTopic, onTopicClick }: TopicDistributionChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const handleContainerClick = (event: MouseEvent | PointerEvent | React.MouseEvent<HTMLDivElement>) => {
    const box = chartContainerRef.current?.getBoundingClientRect();

    if (!box || !data.length) {
      return;
    }

    const ratio = (event.clientX - box.left) / box.width;
    const dataIndex = Math.min(data.length - 1, Math.max(0, Math.floor(ratio * data.length)));
    const topic = data[dataIndex]?.topic;

    if (topic) {
      onTopicClick(topic);
    }
  };
  useEffect(() => {
    const container = chartContainerRef.current;

    if (!container) {
      return;
    }

    container.addEventListener("click", handleContainerClick, true);
    container.addEventListener("pointerdown", handleContainerClick, true);

    return () => {
      container.removeEventListener("click", handleContainerClick, true);
      container.removeEventListener("pointerdown", handleContainerClick, true);
    };
  });
  const handleChartReady = (chart: EChartsType) => {
    const renderer = chart.getZr();
    renderer.off("click");
    renderer.on("click", (event: RendererClickEvent) => {
      const x = event.offsetX ?? event.zrX ?? 0;
      const y = event.offsetY ?? event.zrY ?? 0;
      const convertedValue = chart.convertFromPixel({ xAxisIndex: 0 }, [x, y]);
      const rawIndex = Array.isArray(convertedValue) ? convertedValue[0] : convertedValue;
      const dataIndex = Math.round(Number(rawIndex));
      const topic = data[dataIndex]?.topic;

      if (topic) {
        onTopicClick(topic);
      }
    });
  };

  if (!data.length) {
    return <ChartEmptyState height={330} />;
  }

  const safeData = data
    .map((item) => ({
      ...item,
      reviewCount: finiteNumber(item.reviewCount),
      recommendedReviews: finiteNumber(item.recommendedReviews),
      notRecommendedReviews: finiteNumber(item.notRecommendedReviews),
      recommendRate: finiteNumber(item.recommendRate),
    }))
    .filter((item) => item.topic && item.reviewCount >= 0);

  if (!safeData.length) {
    return <ChartEmptyState height={330} />;
  }

  const option = {
    color: ["#22d3ee", "#34d399"],
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(2,6,23,0.96)",
      borderColor: "rgba(103,232,249,0.28)",
      textStyle: { color: "#e2e8f0" },
      formatter: (params: Array<{ name: string }>) => {
        const topic = safeData.find((item) => item.topic === params[0]?.name);

        if (!topic) {
          return "";
        }

        const attentionNote =
          topic.reviewCount > 0 && topic.recommendRate < attentionThreshold
            ? "<br/><span style=\"color:#fb7185\">需关注</span>"
            : "";

        return [
          `<strong>${topic.topic}</strong>`,
          `评论数：${topic.reviewCount.toLocaleString("zh-CN")}`,
          `推荐数：${topic.recommendedReviews.toLocaleString("zh-CN")}`,
          `不推荐数：${topic.notRecommendedReviews.toLocaleString("zh-CN")}`,
          `推荐率：${topic.recommendRate.toFixed(1)}%${attentionNote}`,
        ].join("<br/>");
      },
    },
    legend: { top: 0, textStyle: { color: "#cbd5e1" } },
    grid: { left: 52, right: 48, top: 48, bottom: 72 },
    xAxis: {
      type: "category",
      data: safeData.map((item) => item.topic),
      axisLabel: { color: "#94a3b8", interval: 0, rotate: 22 },
      axisLine: { lineStyle: { color: "#334155" } },
    },
    yAxis: [
      {
        type: "value",
        name: "评论数",
        nameTextStyle: { color: "#94a3b8" },
        axisLabel: { color: "#94a3b8" },
        splitLine: { lineStyle: { color: "rgba(148,163,184,0.16)" } },
      },
      {
        type: "value",
        name: "推荐率",
        min: 0,
        max: 100,
        nameTextStyle: { color: "#94a3b8" },
        axisLabel: { color: "#94a3b8", formatter: "{value}%" },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "评论数",
        type: "bar",
        barWidth: 24,
        data: safeData.map((item) => ({
          value: item.reviewCount,
          itemStyle: {
            color:
              activeTopic === item.topic
                ? "#67e8f9"
                : item.reviewCount > 0 && item.recommendRate < attentionThreshold
                  ? "rgba(251,113,133,0.72)"
                  : {
                      type: "linear",
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: "#22d3ee" },
                        { offset: 1, color: "rgba(14,165,233,0.32)" },
                      ],
                    },
            borderColor: activeTopic === item.topic ? "#cffafe" : "rgba(125,211,252,0.22)",
            borderWidth: activeTopic === item.topic ? 2 : 1,
            borderRadius: [6, 6, 0, 0],
          },
        })),
        label: {
          show: true,
          position: "top",
          color: "#e2e8f0",
          formatter: (params: { dataIndex: number }) => safeData[params.dataIndex].reviewCount.toLocaleString("zh-CN"),
        },
      },
      {
        name: "推荐率",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        symbolSize: 8,
        data: safeData.map((item) => item.recommendRate),
        lineStyle: { color: "#34d399", width: 3 },
        itemStyle: { color: "#34d399", borderColor: "#bbf7d0", borderWidth: 1 },
        markLine: {
          silent: true,
          symbol: "none",
          label: { color: "#fb7185", formatter: "关注阈值 70%" },
          lineStyle: { color: "rgba(251,113,133,0.46)", type: "dashed" },
          data: [{ yAxis: attentionThreshold }],
        },
        label: {
          show: true,
          position: "top",
          color: "#bbf7d0",
          formatter: (params: { value: number }) => `${Number(params.value).toFixed(1)}%`,
        },
      },
    ],
  };

  return (
    <div ref={chartContainerRef} className="relative min-h-[330px] min-w-0">
      <DataSourceBadge sourceType="real" className="absolute right-3 top-2 z-10" />
      <ClientECharts
        option={option}
        style={{ width: "100%", height: 330 }}
        onChartReady={handleChartReady}
        onEvents={{
          click: (params: { componentType?: string; seriesType?: string; name?: string }) => {
            if (params.componentType === "series" && params.seriesType === "bar" && params.name) {
              onTopicClick(params.name);
            }
          },
        }}
      />
    </div>
  );
}

function finiteNumber(value: number): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function ChartEmptyState({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center rounded border border-slate-800 bg-slate-950/45 text-sm text-slate-500"
      style={{ height }}
    >
      {"当前筛选条件下暂无真实评论主题分布数据"}
    </div>
  );
}
