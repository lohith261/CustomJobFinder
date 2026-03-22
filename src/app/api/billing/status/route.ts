import { getRequiredUserId } from "@/lib/auth-helpers";
import { getUserPlan } from "@/lib/quota";

export async function GET() {
  const result = await getRequiredUserId();
  if ("error" in result) return result.error;
  const plan = await getUserPlan(result.userId);
  return Response.json(plan);
}
