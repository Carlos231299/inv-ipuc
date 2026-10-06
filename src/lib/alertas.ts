"use client";
import Swal from "sweetalert2";

const NAVY = "#1e2f5e";
const GRIS = "#6c757d";

export async function confirmar(titulo: string, texto = "", ok = "Sí, continuar"): Promise<boolean> {
  const r = await Swal.fire({
    title: titulo, text: texto, icon: "warning",
    showCancelButton: true, confirmButtonText: ok, cancelButtonText: "Cancelar",
    confirmButtonColor: NAVY, cancelButtonColor: GRIS,
  });
  return r.isConfirmed;
}

export function exito(titulo: string) {
  Swal.fire({ icon: "success", title: titulo, showConfirmButton: false, timer: 1600 });
}

export function avisar(texto: string) {
  Swal.fire({ icon: "info", title: "Atención", text: texto, confirmButtonColor: NAVY });
}

export function fallar(texto: string) {
  Swal.fire({ icon: "error", title: "No se pudo", text: texto, confirmButtonColor: NAVY });
}

// Pide el motivo por el que alguien queda Sin grupo (null = canceló)
export async function pedirMotivo(nombre: string): Promise<string | null> {
  const r = await Swal.fire({
    title: `Sacar a ${nombre}`,
    text: "Quedará en Sin grupo. ¿Motivo?",
    input: "text",
    inputPlaceholder: "Ej: no participa por motivos personales…",
    showCancelButton: true, confirmButtonText: "Sacar del grupo", cancelButtonText: "Cancelar",
    confirmButtonColor: NAVY, cancelButtonColor: GRIS,
    inputValidator: (v) => (!v.trim() ? "Escribe el motivo" : undefined),
  });
  return r.isConfirmed ? r.value.trim() : null;
}
