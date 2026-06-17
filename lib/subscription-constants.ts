export const getCurrentBillingPeriodStart = (): Date => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
};

export const PLAN_LIMITS: Record<string, { maxBooks: number }> = {
  free: { maxBooks: 5 },
  pro: { maxBooks: 100 },
};
