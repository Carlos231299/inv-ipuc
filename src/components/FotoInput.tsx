"use client";
import { useState } from "react";

export default function FotoInput({ valor, onFoto }: { valor: string | null; onFoto: (f: string) => void }) {
  const [subiendo, setSubiendo] = useState(false);
  async function sel(file: File) {
    setSubiendo(true);
    try {
      // Comprimir en el cliente para no pesar en WhatsApp/servidor
      const bmp = await createImageBitmap(file);
      const max = 1024;
      const sc = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(bmp.width * sc); cv.height = Math.round(bmp.height * sc);
      cv.getContext("2d")!.drawImage(bmp, 0, 0, cv.width, cv.height);
      const blob = await new Promise<Blob>((r) => cv.toBlob((b) => r(b!), "image/jpeg", 0.82));
      const fd = new FormData();
      fd.append("foto", blob, "foto.jpg");
      const res = await fetch("/api/fotos", { method: "POST", body: fd });
      const j = await res.json();
      if (j.foto) onFoto(j.foto);
    } finally { setSubiendo(false); }
  }
  return (
    <div className="row">
      {valor ? <img className="foto" style={{ width: 90, height: 90 }} src={`/api/fotos?f=${encodeURIComponent(valor)}`} alt="foto" /> : <div className="ph" style={{ width: 90, height: 90 }}>📷</div>}
      <div className="grow">
        <label>Foto (cámara o galería)</label>
        <input type="file" accept="image/*" capture="environment" disabled={subiendo}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) sel(f); }} />
        {subiendo ? <div className="mut">Subiendo…</div> : null}
      </div>
    </div>
  );
}
