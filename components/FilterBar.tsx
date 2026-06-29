"use client";

import type { DashboardFilters } from "@/types/dashboard";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { cn } from "@/lib/utils";

export type FilterBarProps = {
  filters: DashboardFilters;
  interviewMode: boolean;
  options: {
    recommendations: string[];
    sentiments: string[];
    topics: string[];
    userSegments: string[];
    urgencies: string[];
    dateRanges: string[];
  };
  onFiltersChange: (filters: DashboardFilters) => void;
  onResetFilters: () => void;
  onInterviewModeChange: (enabled: boolean) => void;
};

export function FilterBar({
  filters,
  interviewMode,
  options,
  onFiltersChange,
  onResetFilters,
  onInterviewModeChange,
}: FilterBarProps) {
  const updateFilter = (key: keyof DashboardFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <section className="ops-panel rounded-lg p-4">
      <div className="ops-section-header flex flex-col gap-4 pl-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="ops-section-title text-lg font-semibold">{"全局筛选器"}</h2>
          <p className="ops-section-subtitle mt-1 text-sm">
            {"全局筛选器基于真实 Steam 评论样本，更新后 KPI、图表与评论列表同步刷新。"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label
            className="ops-focus-ring flex h-10 cursor-pointer items-center gap-3 rounded border border-amber-300/25 bg-amber-300/10 px-3 text-sm text-amber-100 transition hover:border-amber-300/45 hover:bg-amber-300/15"
            title="开启后会高亮适合面试讲解的核心业务模块"
          >
            <span>{"面试展示模式"}</span>
            <input
              type="checkbox"
              checked={interviewMode}
              onChange={(event) => onInterviewModeChange(event.target.checked)}
              className="h-4 w-4 accent-cyan-300"
            />
          </label>

          <button
            type="button"
            onClick={onResetFilters}
            className="ops-focus-ring h-10 rounded border border-cyan-300/30 bg-cyan-300/10 px-4 text-sm text-cyan-100 transition hover:border-cyan-300/55 hover:bg-cyan-300/20"
          >
            {"重置筛选"}
          </button>
        </div>
      </div>

      {interviewMode ? (
        <div className="mt-4 rounded border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
          {"已选中：真实评论数据模块，建议优先讲解 KPI、散点图和高优先级反馈池。"}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SelectField
          label="是否推荐"
          options={options.recommendations}
          value={filters.recommendation}
          onChange={(value) => updateFilter("recommendation", value)}
        />
        <SelectField
          label="评论情绪"
          options={options.sentiments}
          value={filters.sentiment}
          onChange={(value) => updateFilter("sentiment", value)}
        />
        <SelectField
          label="评论主题"
          options={options.topics}
          value={filters.topic}
          onChange={(value) => updateFilter("topic", value)}
        />
        <SelectField
          label="用户分层"
          options={options.userSegments}
          value={filters.user_segment}
          onChange={(value) => updateFilter("user_segment", value)}
        />
        <SelectField
          label="优先级"
          options={options.urgencies}
          value={filters.urgency}
          onChange={(value) => updateFilter("urgency", value)}
        />
        {hasUsableDates(options.dateRanges) ? (
          <SelectField
            label="发布日期"
            options={options.dateRanges}
            value={filters.dateRange}
            onChange={(value) => updateFilter("dateRange", value)}
          />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-cyan-300/15 pt-3 text-xs text-slate-400">
        <DataSourceBadge sourceType="real" />
        <span>{"数据平台：Steam；未来可扩展其他平台，当前不生成跨平台结论。"}</span>
      </div>
    </section>
  );
}

type SelectFieldProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

function SelectField({ label, options, value, onChange }: SelectFieldProps) {
  const visibleOptions = options.includes(value) ? options : [value, ...options];

  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-400">{label}</span>
      <select
        className={cn(
          "ops-filter-select ops-focus-ring w-full rounded px-3 py-2 text-sm outline-none transition",
          getFilterToneClass(label, value),
        )}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {visibleOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function getFilterToneClass(label: string, value: string): string {
  if (value === "全部") {
    return "";
  }

  if (value.includes("不推荐") || value.includes("负向") || value.includes("风险")) {
    return "is-negative";
  }

  if (value.includes("推荐") || value.includes("正向")) {
    return "is-positive";
  }

  if (label.includes("优先级") && value.includes("高")) {
    return "is-high";
  }

  return "";
}

function hasUsableDates(dateRanges: string[]): boolean {
  return dateRanges.some((dateRange) => dateRange !== "全部" && /^\d{4}-\d{2}-\d{2}/.test(dateRange));
}
