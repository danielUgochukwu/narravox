export type PlanType = "free" | "standard" | "pro";

export interface PlanLimits {
  maxBooks: number;
  maxSessionsPerMonth: number;
  maxDurationMinutes: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: { maxBooks: 1, maxSessionsPerMonth: 5, maxDurationMinutes: 5 },
  standard: { maxBooks: 10, maxSessionsPerMonth: 100, maxDurationMinutes: 15 },
  pro: { maxBooks: 100, maxSessionsPerMonth: Infinity, maxDurationMinutes: 60 },
};

export const getCurrentBillingPeriodStart = (): Date => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
  );
};
