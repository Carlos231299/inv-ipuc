import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/auth";

export async function GET(req: Request) {
  // Redirección relativa al host entrante (funciona tras nginx y en local;
  // APP_URL apuntaba al :3000 interno y dejaba la salida en blanco)
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
