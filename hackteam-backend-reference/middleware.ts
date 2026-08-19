import { NextResponse, type NextRequest } from "next/server";

// Comma-separated list, e.g. "https://app.yourdomain.com,http://localhost:5173"
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim());

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    if (isAllowed) applyCors(res, origin);
    return res;
  }

  const res = NextResponse.next();
  if (isAllowed) applyCors(res, origin);
  return res;
}

function applyCors(res: NextResponse, origin: string) {
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export const config = {
  matcher: "/api/:path*",
};
