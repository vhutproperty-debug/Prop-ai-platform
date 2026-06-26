import { MISSION_CONTROL_DASHBOARD_CACHE_TTL_MS } from "@/config/mission-control";
import type {
  MissionControlDashboardData,
  MissionControlFilter,
} from "@/types/mission-control";

interface DashboardCacheEntry {
  key: string;
  data: MissionControlDashboardData;
  expiresAt: number;
}

let dashboardCache: DashboardCacheEntry | null = null;

export function missionControlFilterCacheKey(
  filter?: MissionControlFilter
): string {
  return JSON.stringify(filter ?? {});
}

export function getCachedDashboard(
  filter?: MissionControlFilter
): MissionControlDashboardData | null {
  const key = missionControlFilterCacheKey(filter);
  if (!dashboardCache || dashboardCache.key !== key) return null;
  if (Date.now() >= dashboardCache.expiresAt) {
    dashboardCache = null;
    return null;
  }
  return dashboardCache.data;
}

export function setCachedDashboard(
  filter: MissionControlFilter | undefined,
  data: MissionControlDashboardData
): void {
  dashboardCache = {
    key: missionControlFilterCacheKey(filter),
    data,
    expiresAt: Date.now() + MISSION_CONTROL_DASHBOARD_CACHE_TTL_MS,
  };
}
