import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyEdge } from "./lib/session";
import { COOKIE } from "./lib/auth-edge";

export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (p === "/login" || p.startsWith("/api/auth") || p.startsWith("/_next") || p === "/favicon.ico") {
    return NextResponse.next();
  }
  const user = await verifyEdge(req.cookies.get(COOKIE)?.value, process.env.AUTH_SECRET || "");
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
