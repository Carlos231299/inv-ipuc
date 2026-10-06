import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/auth";

export async function GET() {
  const res = NextResponse.redirect(new URL("/login", process.env.APP_URL || "http://localhost:3000"));
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
