import { useCallback, useEffect, useRef, useState } from "react";
import { parseState, STORAGE_KEY } from "./domain.ts";
import type { ClinicState } from "./domain.ts";
import { createDemo } from "./seed.ts";

export function useClinic() {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return { data: raw ? parseState(raw) : createDemo(), error: "" };
    } catch (error) {
      return {
        data: createDemo(),
        error:
          error instanceof Error
            ? error.message
            : "No se puede leer el almacenamiento.",
      };
    }
  });
  const [data, setData] = useState(initial.data);
  const current = useRef(data);
  const [loadError, setLoadError] = useState(initial.error);
  const [notice, setNotice] = useState("");
  const commit = useCallback(
    (change: (data: ClinicState) => ClinicState, message = "") => {
      try {
        if (loadError)
          throw new Error("Recupera los datos guardados antes de continuar.");
        const next = change(current.current);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        current.current = next;
        setData(next);
        if (message) setNotice(message);
        return "";
      } catch (error) {
        return error instanceof DOMException
          ? "No se pudo guardar. El navegador puede tener el almacenamiento lleno o bloqueado. Exporta una copia antes de continuar."
          : error instanceof Error
            ? error.message
            : "No se pudo guardar el cambio.";
      }
    },
    [loadError],
  );
  const reset = () => {
    try {
      const next = { ...createDemo(), brand: current.current.brand };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      current.current = next;
      setData(next);
      setLoadError("");
      setNotice("Datos de ejemplo restaurados. La identidad se ha conservado.");
      return "";
    } catch {
      return "No se puede escribir en el almacenamiento de este navegador.";
    }
  };
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try {
        const next = event.newValue ? parseState(event.newValue) : createDemo();
        current.current = next;
        setData(next);
        setLoadError("");
        setNotice("Se han actualizado los datos desde otra pestaña.");
      } catch {
        setLoadError(
          "Los datos modificados en otra pestaña no se pueden leer.",
        );
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);
  return { data, commit, reset, loadError, notice, setNotice };
}
export type Commit = ReturnType<typeof useClinic>["commit"];
export function download(
  filename: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
