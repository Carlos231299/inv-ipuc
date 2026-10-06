// Verificación de sesión apta para el Edge runtime (sin módulos node:*)
function b64url(buf: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(buf));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function deb64url(s: string): string {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  return atob(b + "=".repeat((4 - (b.length % 4)) % 4));
}

export async function verifyEdge(token: string | undefined, secret: string): Promise<string | null> {
  if (!token || !secret) return null;
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const body = token.slice(0, i), sig = token.slice(i + 1);
  try {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const want = b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
    if (sig.length !== want.length) return null;
    let d = 0;
    for (let k = 0; k < sig.length; k++) d |= sig.charCodeAt(k) ^ want.charCodeAt(k);
    if (d !== 0) return null;
    const { user, exp } = JSON.parse(deb64url(body));
    if (Date.now() > exp) return null;
    return user as string;
  } catch { return null; }
}
