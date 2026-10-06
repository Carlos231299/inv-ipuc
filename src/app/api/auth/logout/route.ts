import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/auth";

export async function GET() {
  // Location RELATIVA: el navegador la resuelve contra el host real
  // (nuevo URL con req.url heredaba el host interno 0.0.0.0:3000 tras nginx)
  const res = new NextResponse(null, {
    status: 307,
    headers: { Location: "/login" },
  });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
