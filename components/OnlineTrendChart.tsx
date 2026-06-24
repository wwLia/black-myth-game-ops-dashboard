"use client";

import { ClientECharts } from "@/components/ClientECharts";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import type { OpsEvent, PlayerTrendPoint } from "@/types/dashboard";

export type OnlineTrendChartProps = {
  data: PlayerTrendPoint[];
  opsEvents: OpsEvent[];
  onEventClick: (event: OpsEvent) => void;
};

type ChartClickParams = {
  componentType?: string;
  data?: {
    eventId?: string;
  };
};

export function OnlineTrendChart({ data, opsEvents, onEventClick }: OnlineTrendChartProps) {
  if (!data.length) {
    return <ChartEmptyState height={330} />;
  }

  const eventMap = new Map(opsEvents.map((event) => [event.event_id, event]));

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(2,6,23,0.96)",
      borderColor: "rgba(103,232,249,0.28)",
      textStyle: { color: "#e2e8f0" },
      formatter: (params: Array<{ dataIndex: number }>) => {
        const point = data[params[0].dataIndex];
        const event = point.event_id ? eventMap.get(point.event_id) : undefined;
        const eventLine = event
          ? `<br/><span style="color:#facc15">事件：${event.event_name}</span><br/><span style="color:#cbd5e1">${event.description}</span>`
          : "";

        return [
          `<strong>${formatTime(point.timestamp)}</strong>`,
          `在线人数：${point.online_players.toLocaleString("zh-CN")}`,
          `平台：${point.platform}`,
          `游戏：${point.game}${eventLine}`,
        ].join("<br/>");
      },
    },
    grid: { left: 56, right: 24, top: 42, bottom: 44 },
    xAxis: {
      type: "category",
      data: data.map((item) => formatTime(item.timestamp)),
      axisLine: { lineStyle: { color: "#334155" } },
      axisLabel: { color: "#94a3b8" },
    },
    yAxis: {
      type: "value",
      name: "在线人数",
      nameTextStyle: { color: "#94a3b8" },
      axisLabel: {
        color: "#94a3b8",
        formatter: (value: number) => `${(value / 10000).toFixed(0)}万`,
      },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.16)" } },
    },
    series: [
      {
        name: "在线人数",
        type: "line",
        smooth: true,
        data: data.map((item) => item.online_players),
        areaStyle: { color: "rgba(34,211,238,0.15)" },
        lineStyle: { color: "#22d3ee", width: 3 },
        itemStyle: { color: "#22d3ee" },
        markPoint: {
          symbol: "pin",
          symbolSize: 58,
          label: {
            color: "#0f172a",
            fontSize: 10,
            formatter: (params: { name: string }) => params.name,
          },
          itemStyle: { color: "#facc15" },
          data: data
            .map((item, index) => {
              const event = item.event_id ? eventMap.get(item.event_id) : undefined;

              return event
                ? {
                    name: event.event_name,
                    coord: [index, item.online_players],
                    value: event.event_name,
                    eventId: event.event_id,
                  }
                : null;
            })
            .filter(Boolean),
        },
      },
    ],
  };

  const onEvents = {
    click: (params: ChartClickParams) => {
      const eventId = params.componentType === "markPoint" ? params.data?.eventId : undefined;
      const event = eventId ? eventMap.get(eventId) : undefined;

      if (event) {
        onEventClick(event);
      }
    },
  };

  return (
    <div className="relative">
      <ClientECharts option={option} onEvents={onEvents} style={{ width: "100%", height: 330 }} notMerge lazyUpdate />
      <DataSourceBadge sourceType="mock" className="absolute right-3 top-2" />
      <span className="absolute right-3 top-11 text-xs text-slate-400">
        {"未来可接 Steam API / 内部埋点"}
      </span>
    </div>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return `${String(date.getHours()).padStart(2, "0")}:00`;
}

function ChartEmptyState({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center rounded border border-slate-800 bg-slate-950/45 text-sm text-slate-500"
      style={{ height }}
    >
      {"暂无 Mock 数据"}
    </div>
  );
}
