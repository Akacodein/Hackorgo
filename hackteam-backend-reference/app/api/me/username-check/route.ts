import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/apiAuth";
import { isUsernameTaken, isValidUsernameFormat } from "@/lib/username";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const value = req.nextUrl.searchParams.get("value")?.trim().toLowerCase() ?? "";

  if (!isValidUsernameFormat(value)) {
    return NextResponse.json({ available: false, reason: "format" });
  }
  const taken = await isUsernameTaken(value, userId);
  return NextResponse.json({ available: !taken, reason: taken ? "taken" : null });
}
