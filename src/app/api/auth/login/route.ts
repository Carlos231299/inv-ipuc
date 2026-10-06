import { NextResponse } from "next/server";
import { checkLogin, sign, COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const { user, pass } = await req.json().catch(() => ({}));
  if (!user || !pass || !(await checkLogin(String(user), String(pass)))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, sign(String(user), Date.now() + 1000 * 60 * 60 * 24 * 7), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
