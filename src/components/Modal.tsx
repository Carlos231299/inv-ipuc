"use client";
import { useEffect } from "react";

export default function Modal({ titulo, onCerrar, children }: {
  titulo: string; onCerrar: () => void; children: React.ReactNode;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [onCerrar]);

  return (
    <div className="movl" onClick={onCerrar}>
      <div className="movc" onClick={(e) => e.stopPropagation()}>
        <div className="row">
          <div className="t grow">{titulo}</div>
          <button className="btn sec sm" onClick={onCerrar}>✕</button>
        </div>
        <div style={{ marginTop: 8 }}>{children}</div>
      </div>
    </div>
  );
}
