"use client";

import { useCallback, useState } from "react";
import type { DashboardFilters, OpsEvent } from "@/types/dashboard";

export function useDashboardFilters(defaultFilters: DashboardFilters) {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [selectedReviewId, setSelectedReviewId] = useState<string | undefined>();
  const [selectedOpsEvent, setSelectedOpsEvent] = useState<OpsEvent | undefined>();

  const updateFilters = useCallback((nextFilters: DashboardFilters) => {
    setFilters(nextFilters);
  }, []);

  const updateTopicFilter = useCallback((topic: string) => {
    setFilters((currentFilters) => ({ ...currentFilters, topic }));
  }, []);

  const updateUserSegmentFilter = useCallback((userSegment: string) => {
    setFilters((currentFilters) => ({ ...currentFilters, user_segment: userSegment }));
  }, []);

  const selectReview = useCallback((reviewId: string) => {
    setSelectedReviewId(reviewId);
  }, []);

  const selectOpsEvent = useCallback((event: OpsEvent) => {
    setSelectedOpsEvent(event);
  }, []);

  const resetDashboardState = useCallback(() => {
    setFilters(defaultFilters);
    setSelectedReviewId(undefined);
    setSelectedOpsEvent(undefined);
  }, [defaultFilters]);

  return {
    filters,
    selectedReviewId,
    selectedOpsEvent,
    setFilters: updateFilters,
    setSelectedReviewId: selectReview,
    setSelectedOpsEvent,
    updateTopicFilter,
    updateUserSegmentFilter,
    selectOpsEvent,
    resetDashboardState,
  };
}
