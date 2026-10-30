import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { ArrowUpRight, Cat, Dog, Plus, Rabbit, X } from "lucide-react";
import { clinicIdentity, productBrand } from "./branding.ts";
import type { Brand, Patient } from "./domain.ts";
import { CLINIC_SAVED_EVENT } from "./store.ts";

export function Mark({
  brand,
  small = false,
}: {
  brand: Brand;
  small?: boolean;
}) {
  const { isProduct, initials } = clinicIdentity(brand);
  return (
    <span
      aria-hidden="true"
      className={`brand-mark ${small ? "small" : ""} ${brand.logo ? "custom-logo" : ""}`}
    >
      {brand.logo ? (
        <img src={brand.logo} alt="" />
      ) : isProduct ? (
        <svg viewBox="0 0 64 64" fill="none">
          <path
            d={productBrand.arc}
            stroke="currentColor"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <circle cx="46" cy="32" r="6" fill="var(--accent)" />
        </svg>
      ) : (
        <span className="clinic-initials">{initials}</span>
      )}
    </span>
  );
}
export function PetIcon({
  patient,
  large = false,
}: {
  patient: Patient;
  large?: boolean;
}) {
  const Icon =
    patient.species === "Gato"
      ? Cat
      : patient.species === "Perro"
        ? Dog
        : Rabbit;
  return (
    <span
      className={`pet-icon ${patient.species === "Gato" ? "cat" : ""} ${large ? "large" : ""}`}
    >
      <Icon strokeWidth={1.5} />
    </span>
  );
}
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      type="button"
      className={`button ${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Plus />
      </span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
export function Heading({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  );
}
export function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className={`badge ${tone}`}>
      <i />
      {children}
    </span>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="form-error">
      {message}
    </p>
  ) : null;
}
export function Modal({
  title,
  description,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const edited = useRef(false);
  const close = useRef(onClose);
  close.current = onClose;
  const [confirmLeave, setConfirmLeave] = useState(false);
  const requestClose = () =>
    edited.current ? setConfirmLeave(true) : close.current();
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    // Protect an unfinished form when Back or a reload would leave the document.
    // Browsers decide the wording of this standard unsaved-changes prompt.
    const markEdited = () => {
      edited.current = true;
    };
    const markSaved = () => {
      edited.current = false;
      setConfirmLeave(false);
    };
    const protectDraft = (event: BeforeUnloadEvent) => {
      if (!edited.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    dialog.addEventListener("input", markEdited);
    dialog.addEventListener("change", markEdited);
    window.addEventListener("beforeunload", protectDraft);
    window.addEventListener(CLINIC_SAVED_EVENT, markSaved);
    // Reserve a single same-document Back step. Reuse it between dialogs rather
    // than adding a new history entry for every form. This also works where the
    // browser suppresses beforeunload prompts. Never change another origin.
    const keepFormStep = () => {
      if (!history.state?.cercavetFormStep)
        history.pushState({ ...history.state, cercavetFormStep: true }, "");
    };
    keepFormStep();
    const onBack = () => {
      if (history.state?.cercavetFormStep) return;
      if (edited.current) {
        keepFormStep();
        setConfirmLeave(true);
      } else close.current();
    };
    window.addEventListener("popstate", onBack);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("beforeunload", protectDraft);
      window.removeEventListener(CLINIC_SAVED_EVENT, markSaved);
      window.removeEventListener("popstate", onBack);
      dialog.removeEventListener("input", markEdited);
      dialog.removeEventListener("change", markEdited);
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus();
      // Closed by saving or the close button: drop the reserved step so the
      // next Back leaves the page at once. A dialog opening in its place keeps it.
      window.setTimeout(() => {
        if (
          history.state?.cercavetFormStep &&
          !document.querySelector("dialog.modal[open]")
        )
          history.back();
      });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      aria-labelledby="dialog-title"
      aria-describedby={description ? "dialog-desc" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
    >
      <header className="modal-header">
        <div>
          <div className="eyebrow">ESPACIO DE LA CLÍNICA</div>
          <h2 id="dialog-title">{title}</h2>
          {description && <p id="dialog-desc">{description}</p>}
        </div>
        <button
          className="icon-button"
          aria-label="Cerrar ventana"
          onClick={requestClose}
        >
          <X />
        </button>
      </header>
      <div className="modal-body">
        {confirmLeave && (
          <div className="note-box leave-confirm" role="alert">
            <strong>Tienes cambios sin guardar.</strong>
            <p>
              Puedes seguir editando o descartar este formulario. Los registros
              ya guardados se conservan.
            </p>
            <div className="form-actions">
              <Button onClick={() => setConfirmLeave(false)}>
                Seguir editando
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  edited.current = false;
                  close.current();
                }}
              >
                Descartar cambios y cerrar
              </Button>
            </div>
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowUpRight size={15} />
    </button>
  );
}
