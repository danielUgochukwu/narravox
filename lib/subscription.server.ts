import { auth, clerkClient } from "@clerk/nextjs/server";

export async function getUserPlan(): Promise<string> {
  const { userId } = await auth();
  if (!userId) return "free";

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const plan = user.publicMetadata?.plan;

  if (typeof plan === "string" && plan) return plan;
  return "free";
}
