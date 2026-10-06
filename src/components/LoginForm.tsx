"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const r = useRouter();
  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, pass }),
    });
    if (res.ok) r.push("/");
    else setErr("Usuario o contraseña incorrectos.");
  }
  return (
    <form onSubmit={entrar}>
      {err ? <div className="err">{err}</div> : null}
      <label>Usuario</label>
      <input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" required />
      <label>Contraseña</label>
      <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" required />
      <button className="btn" style={{ width: "100%", marginTop: 8 }} type="submit">Entrar</button>
    </form>
  );
}
