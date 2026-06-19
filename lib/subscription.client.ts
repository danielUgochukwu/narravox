"use client";

import { useAuth } from "@clerk/nextjs";
import type { PlanType } from "./subscription-constants";

export function useUserPlan(): PlanType {
  const { isSignedIn, has } = useAuth();
  if (!isSignedIn) return "free";
  if (has({ plan: "pro" })) return "pro";
  if (has({ plan: "standard" })) return "standard";
  return "free";
}
