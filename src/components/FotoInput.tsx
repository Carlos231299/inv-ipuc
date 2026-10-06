"use client";
import { useRef, useState } from "react";

export default function FotoInput({ valor, onFoto }: { valor: string | null; onFoto: (f: string) => void }) {
  const [subiendo, setSubiendo] = useState(false);
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);

  async function sel(file: File) {
    setSubiendo(true);
    try {
      // Comprimir en el cliente para no pesar en el servidor
      const bmp = await createImageBitmap(file);
      const max = 1024;
      const sc = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(bmp.width * sc));
      cv.height = Math.max(1, Math.round(bmp.height * sc));
      cv.getContext("2d")!.drawImage(bmp, 0, 0, cv.width, cv.height);
      const blob = await new Promise<Blob>((res, rej) =>
        cv.toBlob((b) => (b ? res(b) : rej(new Error("img"))), "image/jpeg", 0.82));
      const fd = new FormData();
      fd.append("foto", blob, "foto.jpg");
      const r = await fetch("/api/fotos", { method: "POST", body: fd });
      const j = await r.json();
      if (j.foto) onFoto(j.foto);
    } finally { setSubiendo(false); }
  }
  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) sel(f);
  }

  return (
    <div className="row">
      {valor ? (
        <img className="foto" style={{ width: 90, height: 90 }} src={`/api/fotos?f=${encodeURIComponent(valor)}`} alt="foto" />
      ) : (
        <div className="ph" style={{ width: 90, height: 90 }}>📷</div>
      )}
      <div className="grow">
        <label>Foto</label>
        <div className="btnrow" style={{ margin: "2px 0 6px" }}>
          <button type="button" className="btn sm" disabled={subiendo} onClick={() => cam.current?.click()}>📷 Cámara</button>
          <button type="button" className="btn sec sm" disabled={subiendo} onClick={() => gal.current?.click()}>🖼️ Galería</button>
        </div>
        <input ref={cam} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={onPick} />
        <input ref={gal} type="file" accept="image/*" style={{ display: "none" }} onChange={onPick} />
        {subiendo ? <div className="mut">Subiendo…</div> : null}
      </div>
    </div>
  );
}
