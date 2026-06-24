"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { EChartsType } from "echarts";

type ClientEChartsProps = {
  option: unknown;
  style?: React.CSSProperties;
  className?: string;
  notMerge?: boolean;
  lazyUpdate?: boolean;
  onChartReady?: (chart: EChartsType) => void;
  onEvents?: Record<string, (...params: never[]) => void>;
};

export function ClientECharts({
  option,
  style,
  className,
  notMerge = false,
  lazyUpdate = false,
  onChartReady,
  onEvents,
}: ClientEChartsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const chart = echarts.init(container, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    chart.setOption(option as echarts.EChartsOption, { notMerge, lazyUpdate });
    onChartReady?.(chart);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;

    if (!chart) {
      return;
    }

    chart.setOption(option as echarts.EChartsOption, { notMerge, lazyUpdate });
  }, [lazyUpdate, notMerge, option]);

  useEffect(() => {
    const chart = chartRef.current;

    if (!chart || !onEvents) {
      return;
    }

    Object.entries(onEvents).forEach(([eventName, handler]) => {
      chart.on(eventName, handler as never);
    });

    return () => {
      Object.entries(onEvents).forEach(([eventName, handler]) => {
        chart.off(eventName, handler as never);
      });
    };
  }, [onEvents]);

  return <div ref={containerRef} className={className} style={style} />;
}
