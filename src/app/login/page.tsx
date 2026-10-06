import LoginForm from "@/components/LoginForm";

export default function Login() {
  return (
    <div className="loginwrap">
      <div className="loginbox">
        <h1>📦 Inventario IPUC 19</h1>
        <p className="mut">Maicao — Altos del Parrantial · Acceso del encargado</p>
        <LoginForm />
      </div>
    </div>
  );
}
