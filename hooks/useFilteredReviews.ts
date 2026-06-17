"use client";

import { useMemo } from "react";
import { filterReviews } from "@/lib/filters/filterReviews";
import type { DashboardFilters, Review } from "@/types/dashboard";

export function useFilteredReviews(reviews: Review[], filters: DashboardFilters): Review[] {
  return useMemo(() => filterReviews(reviews, filters), [reviews, filters]);
}
