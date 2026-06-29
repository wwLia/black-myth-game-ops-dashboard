"use client";

import { useEffect, useRef } from "react";
import { ClientECharts } from "@/components/ClientECharts";
import type { EChartsType } from "echarts";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import type { PlaytimeDistributionSegment } from "@/types/dashboard";

export type PlaytimeDistributionChartProps = {
  data: PlaytimeDistributionSegment[];
  activeSegment: string;
  onSegmentClick: (segment: string) => void;
};
type RendererClickEvent = { offsetX?: number; offsetY?: number; zrX?: number; zrY?: number };

export function PlaytimeDistributionChart({
  data,
  activeSegment,
  onSegmentClick,
}: PlaytimeDistributionChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const handleContainerClick = (event: MouseEvent | PointerEvent | React.MouseEvent<HTMLDivElement>) => {
    const box = chartContainerRef.current?.getBoundingClientRect();

    if (!box || !data.length) {
      return;
    }

    const ratio = (event.clientX - box.left) / box.width;
    const dataIndex = Math.min(data.length - 1, Math.max(0, Math.floor(ratio * data.length)));
    const segment = data[dataIndex]?.segment;

    if (segment) {
      onSegmentClick(segment);
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
      const segment = data[dataIndex]?.segment;

      if (segment) {
        onSegmentClick(segment);
      }
    });
  };

  if (!data.length) {
    return <ChartEmptyState height={320} />;
  }

  const safeData = data
    .map((item) => ({
      ...item,
      players: finiteNumber(item.players),
      recommendedReviews: finiteNumber(item.recommendedReviews),
      notRecommendedReviews: finiteNumber(item.notRecommendedReviews),
      recommendRate: finiteNumber(item.recommendRate),
    }))
    .filter((item) => item.range && item.players >= 0);

  if (!safeData.length) {
    return <ChartEmptyState height={320} />;
  }

  const option = {
    color: ["#38bdf8", "#34d399"],
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(2,6,23,0.94)",
      borderColor: "rgba(103,232,249,0.25)",
      textStyle: { color: "#e2e8f0" },
      formatter: (params: Array<{ name: string }>) => {
        const segment = safeData.find((item) => item.range === params[0]?.name);

        if (!segment) {
          return "";
        }

        return [
          `<strong>${segment.range}</strong>`,
          `评论数：${segment.players.toLocaleString("zh-CN")}`,
          `推荐数：${segment.recommendedReviews.toLocaleString("zh-CN")}`,
          `不推荐数：<span style="color:#fda4af">${segment.notRecommendedReviews.toLocaleString("zh-CN")}</span>`,
          `推荐率：${segment.recommendRate.toFixed(1)}%`,
        ].join("<br/>");
      },
    },
    legend: { top: 0, textStyle: { color: "#cbd5e1" } },
    grid: { left: 52, right: 48, top: 48, bottom: 42 },
    xAxis: {
      type: "category",
      data: safeData.map((item) => item.range),
      axisLabel: { color: "#94a3b8" },
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
        barWidth: 28,
        data: safeData.map((item) => ({
          value: item.players,
          itemStyle: {
            color:
              activeSegment === item.segment
                ? "#67e8f9"
                : item.notRecommendedReviews > item.recommendedReviews
                  ? {
                      type: "linear",
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: "#f59e0b" },
                        { offset: 1, color: "rgba(244,63,94,0.34)" },
                      ],
                    }
                  : {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                      { offset: 0, color: "#38bdf8" },
                      { offset: 1, color: "rgba(14,165,233,0.35)" },
                    ],
                  },
            borderColor: activeSegment === item.segment ? "#cffafe" : "rgba(125,211,252,0.25)",
            borderWidth: activeSegment === item.segment ? 2 : 1,
            borderRadius: [6, 6, 0, 0],
          },
        })),
        label: {
          show: true,
          position: "top",
          color: "#e2e8f0",
          formatter: (params: { dataIndex: number }) => safeData[params.dataIndex].players.toLocaleString("zh-CN"),
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
    <div ref={chartContainerRef} className="ops-card-muted relative min-h-[320px] min-w-0 overflow-hidden rounded p-3">
      <DataSourceBadge sourceType="real" className="absolute right-3 top-2 z-10" />
      <ClientECharts
        option={option}
        style={{ width: "100%", height: 320 }}
        onChartReady={handleChartReady}
        onEvents={{
          click: (params: { componentType?: string; seriesType?: string; name?: string }) => {
            if (params.componentType === "series" && params.seriesType === "bar" && params.name) {
              onSegmentClick(params.name);
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
      className="ops-card-muted flex items-center justify-center rounded text-sm text-slate-500"
      style={{ height }}
    >
      {"当前筛选条件下暂无真实评论时长分布数据"}
    </div>
  );
}
