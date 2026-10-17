import { useState } from "react";
import {
  Check,
  Download,
  ImagePlus,
  RotateCcw,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import { localDate, saveBrand, themes } from "./domain.ts";
import type { Brand, ClinicState } from "./domain.ts";
import { download, type Commit } from "./store.ts";
import { Button, ErrorMessage, Heading, Mark } from "./ui.tsx";

export function Settings({
  data,
  commit,
  onReset,
}: {
  data: ClinicState;
  commit: Commit;
  onReset: () => void;
}) {
  const [brand, setBrand] = useState<Brand>(data.brand);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof Brand>(key: K, value: Brand[K]) => {
    setBrand((b) => ({ ...b, [key]: value }));
    setSaved(false);
  };
  async function upload(file: File | undefined) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Elige una imagen PNG, JPG o WebP.");
      return;
    }
    if (file.size > 300_000) {
      setError("El logo debe pesar menos de 300 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      set("logo", String(reader.result));
      setError("");
    };
    reader.onerror = () => setError("No se pudo leer esa imagen.");
    reader.readAsDataURL(file);
  }
  return (
    <>
      <Heading
        eyebrow="IDENTIDAD DE LA CLÍNICA"
        title="Tu nombre. Tu manera de cuidar."
      >
        Personaliza el espacio que verá tu equipo.
      </Heading>
      <div className="settings-grid">
        <form
          className="panel settings-form"
          onSubmit={(e) => {
            e.preventDefault();
            const error = commit(
              (s) => saveBrand(s, brand),
              "Identidad de la clínica actualizada.",
            );
            setError(error);
            if (!error) setSaved(true);
          }}
        >
          <div className="section-heading">
            <h2>Marca y contacto</h2>
            <span className="count">01</span>
          </div>
          <label>
            Nombre de la clínica
            <input
              value={brand.name}
              maxLength={60}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </label>
          <label>
            Una frase que os represente
            <input
              value={brand.tagline}
              maxLength={100}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </label>
          <label>
            Profesional de la agenda
            <input
              value={brand.veterinarian}
              maxLength={80}
              onChange={(e) => set("veterinarian", e.target.value)}
              required
            />
          </label>
          <div className="form-grid">
            <label>
              Correo de contacto
              <input
                type="email"
                value={brand.email}
                maxLength={150}
                onChange={(e) => set("email", e.target.value)}
              />
            </label>
            <label>
              Teléfono
              <input
                type="tel"
                value={brand.phone}
                maxLength={30}
                onChange={(e) => set("phone", e.target.value)}
              />
            </label>
          </div>
          <div className="section-heading settings-divider">
            <h2>Identidad visual</h2>
            <span className="count">02</span>
          </div>
          <label className="upload-label">
            <ImagePlus size={21} />
            <span>
              <strong>
                {brand.logo ? "Cambiar logotipo" : "Añadir vuestro logotipo"}
              </strong>
              <small>PNG, JPG o WebP · Hasta 300 KB</small>
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-label="Subir logotipo de la clínica"
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </label>
          {brand.logo && (
            <button
              type="button"
              className="inline-button"
              onClick={() => set("logo", "")}
            >
              <X size={14} />
              Usar símbolo de la clínica
            </button>
          )}
          <fieldset className="theme-field">
            <legend>Color de la clínica</legend>
            <div>
              {Object.entries(themes).map(([key, theme]) => (
                <label
                  key={key}
                  className={brand.theme === key ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="theme"
                    checked={brand.theme === key}
                    onChange={() => set("theme", key as Brand["theme"])}
                  />
                  <i style={{ background: theme.primary }} />
                  {theme.label}
                  {brand.theme === key && <Check size={15} />}
                </label>
              ))}
            </div>
          </fieldset>
          <ErrorMessage message={error} />
          <div className="form-actions">
            {saved && (
              <span className="saved-label">
                <Check size={15} />
                Cambios guardados
              </span>
            )}
            <Button type="submit">
              <Save size={16} />
              Guardar identidad
            </Button>
          </div>
        </form>
        <aside>
          <div
            className="brand-preview"
            style={
              {
                "--primary": themes[brand.theme].primary,
                "--accent": themes[brand.theme].accent,
              } as React.CSSProperties
            }
          >
            <span className="eyebrow">ASÍ SE VERÁ TU CLÍNICA</span>
            <Mark brand={brand} />
            <h2>{brand.name || "Tu clínica"}</h2>
            <p>{brand.tagline}</p>
            <div className="preview-rule" />
            <span>{brand.veterinarian}</span>
            <small>{brand.email}</small>
          </div>
          <section className="panel compact-panel local-data">
            <ShieldCheck size={23} />
            <h3>Datos de esta demostración</h3>
            <p>
              Se guardan en este navegador. Puedes descargar una copia antes de
              reiniciar los ejemplos.
            </p>
            <Button
              variant="secondary"
              onClick={() =>
                download(
                  `cercavet-copia-${localDate()}.json`,
                  JSON.stringify(data, null, 2),
                )
              }
            >
              <Download size={16} />
              Exportar datos
            </Button>
            <button className="quiet-button" onClick={onReset}>
              <RotateCcw size={14} />
              Restaurar datos de ejemplo
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
