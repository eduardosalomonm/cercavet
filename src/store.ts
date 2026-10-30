import { useCallback, useEffect, useRef, useState } from "react";
import { parseState, STORAGE_KEY } from "./domain.ts";
import type { ClinicState } from "./domain.ts";
import { createDemo, restoreDemo } from "./seed.ts";
import { migrateDemoIdentity } from "./identity.ts";

export const CLINIC_SAVED_EVENT = "cercavet:stored";

// The last stored text this tab read or wrote. Saving a draft on every
// keystroke then skips a full parse unless another tab changed the data.
let stored: { raw: string; state: ClinicState } | undefined;
export function readStored(raw: string): ClinicState {
  if (stored?.raw !== raw)
    stored = { raw, state: migrateDemoIdentity(parseState(raw)) };
  return stored.state;
}
function writeStored(state: ClinicState) {
  const raw = JSON.stringify(state);
  localStorage.setItem(STORAGE_KEY, raw);
  stored = { raw, state };
}

export function useClinic() {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return {
        data: raw ? readStored(raw) : createDemo(),
        error: "",
      };
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
  const [, refreshDay] = useState(0);
  useEffect(() => {
    const refresh = () => refreshDay((n) => n + 1);
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  const commit = useCallback(
    (change: (data: ClinicState) => ClinicState, message = "") => {
      try {
        if (loadError)
          throw new Error("Recupera los datos guardados antes de continuar.");
        const raw = localStorage.getItem(STORAGE_KEY);
        const next = change(raw ? readStored(raw) : current.current);
        writeStored(next);
        current.current = next;
        setData(next);
        // A successful local save also clears unsaved-form protection when
        // a followup stays open after recording a contact or a response.
        window.dispatchEvent(new Event(CLINIC_SAVED_EVENT));
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
      const next = restoreDemo(current.current);
      writeStored(next);
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
        const next = event.newValue ? readStored(event.newValue) : createDemo();
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
