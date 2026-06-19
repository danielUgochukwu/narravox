"use server";

import { auth } from "@clerk/nextjs/server";
import VoiceSession from "@/database/models/voice-session.model";
import SessionQuota from "@/database/models/session-quota.model";
import { connectToDatabase } from "@/database/mongoose";
import { EndSessionResult, StartSessionResult } from "@/types";
import {
  getCurrentBillingPeriodStart,
  PLAN_LIMITS,
} from "@/lib/subscription-constants";
import { getUserPlan } from "@/lib/subscription.server";

export const startVoiceSession = async (
  clerkId: string,
  bookId: string
): Promise<StartSessionResult> => {
  try {
    await connectToDatabase();

    const { userId } = await auth();
    if (!userId || userId !== clerkId) {
      return { success: false, error: "Unauthorized" };
    }

    const plan = await getUserPlan();
    const limits = PLAN_LIMITS[plan];
    const billingPeriodStart = getCurrentBillingPeriodStart();

    if (limits.maxSessionsPerMonth !== Infinity) {
      // Atomically reserve a quota slot. findOneAndUpdate serializes concurrent
      // writes to the same counter document, preventing TOCTOU bypasses.
      // When count >= limit, upsert collides with the unique index (code 11000).
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await SessionQuota.findOneAndUpdate(
            { clerkId: userId, billingPeriodStart, count: { $lt: limits.maxSessionsPerMonth } },
            { $inc: { count: 1 } },
            { upsert: true }
          );
          break;
        } catch (err: any) {
          // Retry once: concurrent first-session inserts can both miss the doc
          // and race to create it; only the second attempt clarifies the cause.
          if (err.code === 11000 && attempt === 0) continue;
          if (err.code === 11000) {
            return {
              success: false,
              error: `You've used all ${limits.maxSessionsPerMonth} voice sessions for this month on the ${plan} plan. Upgrade to continue.`,
              isBillingError: true,
            };
          }
          throw err;
        }
      }
    }

    const session = await VoiceSession.create({
      clerkId,
      bookId,
      startedAt: new Date(),
      billingPeriodStart,
      durationSeconds: 0,
    });

    return {
      success: true,
      sessionId: session._id.toString(),
      maxDurationMinutes: limits.maxDurationMinutes,
    };
  } catch (error) {
    console.error("Error starting voice session:", error);
    return {
      success: false,
      error: "Failed to start voice session. Please try again later.",
    };
  }
};

export const endVoiceSession = async (
  sessionId: string,
  durationSeconds: number
): Promise<EndSessionResult> => {
  try {
    await connectToDatabase();

    const result = await VoiceSession.findByIdAndUpdate(sessionId, {
      endedAt: new Date(),
      durationSeconds,
    });

    if (!result) return { success: false, error: "Session not found." };

    return { success: true };
  } catch (error) {
    console.error("Error ending voice session:", error);
    return { success: false, error: "Failed to end voice session." };
  }
};
