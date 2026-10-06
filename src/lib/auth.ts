import { createHmac, timingSafeEqual, scryptSync } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { cookies } from "next/headers";
import { DATA_DIR } from "./db";
import { COOKIE } from "./auth-edge";

function secret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  const f = join(DATA_DIR, ".secret");
  mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(f)) {
    const s = createHmac("sha256", Math.random().toString()).digest("hex");
    writeFileSync(f, s, { mode: 0o600 });
    return s;
  }
  return readFileSync(f, "utf8").trim();
}

export function sign(user: string, exp: number): string {
  const body = Buffer.from(JSON.stringify({ user, exp })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verify(token: string | undefined): string | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const want = createHmac("sha256", secret()).update(body).digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  } catch { return null; }
  try {
    const { user, exp } = JSON.parse(Buffer.from(body, "base64url").toString());
    if (Date.now() > exp) return null;
    return user as string;
  } catch { return null; }
}

export async function sessionUser(): Promise<string | null> {
  const c = await cookies();
  return verify(c.get(COOKIE)?.value);
}

export async function requireUser(): Promise<string> {
  const u = await sessionUser();
  if (!u) throw new Error("NO_AUTH");
  return u;
}

function scryptHex(pass: string, saltHex: string): string {
  return scryptSync(pass, Buffer.from(saltHex, "hex"), 64).toString("hex");
}

export async function checkLogin(user: string, pass: string): Promise<boolean> {
  const wantUser = process.env.ADMIN_USER || "Gerson19";
  if (user !== wantUser) return false;
  const hash = process.env.ADMIN_PASS_HASH;
  const salt = process.env.ADMIN_SALT;
  if (hash && salt) {
    const calc = scryptHex(pass, salt);
    try {
      return timingSafeEqual(Buffer.from(calc, "hex"), Buffer.from(hash, "hex"));
    } catch { return false; }
  }
  // Desarrollo: permite ADMIN_PASS en texto plano (nunca se sube al servidor)
  if (process.env.ADMIN_PASS) return pass === process.env.ADMIN_PASS;
  return false;
}

export { COOKIE };
