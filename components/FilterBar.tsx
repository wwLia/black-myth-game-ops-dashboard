"use client";

import type { DashboardFilters } from "@/types/dashboard";
import { DataSourceBadge } from "@/components/DataSourceBadge";

export type FilterBarProps = {
  filters: DashboardFilters;
  interviewMode: boolean;
  options: {
    platforms: string[];
    recommendations: string[];
    sentiments: string[];
    topics: string[];
    userSegments: string[];
    urgencies: string[];
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
    <section className="rounded-lg border border-cyan-300/15 bg-slate-950/60 p-4 shadow-[0_0_28px_rgba(14,165,233,0.08)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">{"全局筛选器"}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {"全局筛选器基于真实 Steam 评论样本，更新后 KPI、图表与评论列表同步刷新。"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label
            className="flex h-10 cursor-pointer items-center gap-3 rounded border border-amber-300/25 bg-amber-300/10 px-3 text-sm text-amber-100 transition hover:bg-amber-300/15"
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
            className="h-10 rounded border border-cyan-300/30 bg-cyan-300/10 px-4 text-sm text-cyan-100 transition hover:bg-cyan-300/20"
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
          label="平台"
          options={options.platforms}
          value={filters.platform}
          onChange={(value) => updateFilter("platform", value)}
        />
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
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3 text-xs text-slate-400">
        <DataSourceBadge sourceType="real" />
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
        className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-cyan-300"
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
