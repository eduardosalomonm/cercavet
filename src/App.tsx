import { useEffect, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  Menu,
  MessageCircle,
  PawPrint,
  Plus,
  Settings2,
  ShieldCheck,
  Syringe,
  X,
} from "lucide-react";
import {
  capitalizeFirst,
  clinicToday,
  formatDate,
  STORAGE_KEY,
  themes,
} from "./domain.ts";
import { clinicFavicon } from "./branding.ts";
import { download, useClinic } from "./store.ts";
import { AppointmentForm, FollowupForm, PatientForm } from "./forms.tsx";
import {
  Agenda,
  Followups,
  PatientDetails,
  Patients,
  Today,
} from "./workspace.tsx";
import { Visit } from "./consultation.tsx";
import { Settings } from "./settings.tsx";
import { Vaccinations } from "./vaccinations.tsx";
import { Button, ErrorMessage, Mark, Modal } from "./ui.tsx";

type View =
  | "today"
  | "agenda"
  | "patients"
  | "followups"
  | "vaccinations"
  | "settings"
  | "visit";
type Overlay =
  | { type: "appointment"; patientId?: string; followupId?: string }
  | { type: "patient" }
  | { type: "patientDetail"; id: string }
  | { type: "followup"; id: string }
  | { type: "reset" }
  | { type: "guide" }
  | null;
const navigation = [
  { id: "today" as const, label: "Hoy", icon: LayoutDashboard },
  { id: "agenda" as const, label: "Agenda", icon: CalendarDays },
  { id: "patients" as const, label: "Pacientes", icon: PawPrint },
  { id: "vaccinations" as const, label: "Vacunas", icon: Syringe },
  { id: "followups" as const, label: "Seguimientos", icon: MessageCircle },
];
export default function App() {
  const { data, commit, reset, loadError, notice } = useClinic();
  const [view, setView] = useState<View>("today");
  const [appointmentId, setAppointmentId] = useState("");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [vaccinationPatientId, setVaccinationPatientId] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [resetError, setResetError] = useState("");
  const colors = themes[data.brand.theme];
  const title =
    view === "visit"
      ? "Consulta"
      : view === "settings"
        ? "Tu clínica"
        : navigation.find((n) => n.id === view)?.label;
  const activeFollowups = data.followups.filter(
    (f) => f.status !== "closed",
  ).length;
  function navigate(next: View) {
    setView(next);
    if (next === "vaccinations") setVaccinationPatientId("");
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const onVisit = (id: string) => {
    setOverlay(null);
    setAppointmentId(id);
    navigate("visit");
  };
  const onBook = (patientId?: string) =>
    setOverlay({ type: "appointment", patientId });
  const onFollowup = (id: string) => setOverlay({ type: "followup", id });
  const onVaccinations = (patientId: string) => {
    setOverlay(null);
    navigate("vaccinations");
    setVaccinationPatientId(patientId);
  };
  useEffect(() => {
    document.title = `${title} · ${data.brand.name}`;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", colors.primary);
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icon) icon.href = clinicFavicon(data.brand);
  }, [data.brand, title, colors.primary]);
  const props = { data, onVisit, onBook, onFollowup };
  const selectedFollowup =
    overlay?.type === "followup"
      ? data.followups.find((f) => f.id === overlay.id)
      : undefined;
  const selectedPatient =
    overlay?.type === "patientDetail"
      ? data.patients.find((p) => p.id === overlay.id)
      : undefined;
  const style = {
    "--primary": colors.primary,
    "--primary-soft": colors.soft,
    "--accent": colors.accent,
  } as CSSProperties;
  if (loadError)
    return (
      <main className="recovery" style={style}>
        <ShieldCheck size={32} />
        <h1>No hemos podido abrir los datos guardados.</h1>
        <p>{loadError}</p>
        <p>
          Los datos existentes no se han sobrescrito. Descarga una copia antes
          de restaurar los ejemplos.
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            try {
              download(
                "cercavet-recuperacion.json",
                localStorage.getItem(STORAGE_KEY) || "{}",
              );
            } catch {
              setResetError("No se puede leer el almacenamiento.");
            }
          }}
        >
          Descargar copia para recuperación
        </Button>
        <Button variant="danger" onClick={() => setOverlay({ type: "reset" })}>
          Restaurar ejemplos
        </Button>
        <ErrorMessage message={resetError} />
        {overlay?.type === "reset" && (
          <Modal
            title="Restaurar la demostración"
            onClose={() => setOverlay(null)}
          >
            <p>
              Esto sustituirá los datos guardados en este navegador por ejemplos
              nuevos.
            </p>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setOverlay(null)}>
                Volver
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const error = reset();
                  setResetError(error);
                  if (!error) setOverlay(null);
                }}
              >
                Restaurar ejemplos
              </Button>
            </div>
          </Modal>
        )}
      </main>
    );
  return (
    <div className="app" style={style}>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      {mobileMenu && (
        <button
          className="sidebar-shade"
          aria-label="Cerrar navegación"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <aside
        className={`sidebar ${mobileMenu ? "open" : ""}`}
        aria-label="Navegación principal"
      >
        <button className="brand" onClick={() => navigate("today")}>
          <Mark brand={data.brand} />
          <span>
            <strong>{data.brand.name}</strong>
            <small>ESPACIO DE LA CLÍNICA</small>
          </span>
        </button>
        <button
          className="mobile-close icon-button"
          aria-label="Cerrar menú"
          onClick={() => setMobileMenu(false)}
        >
          <X />
        </button>
        <div className="sidebar-section-label">EL DÍA A DÍA</div>
        <nav>
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id || (view === "visit" && id === "agenda") ? "active" : ""}`}
              aria-current={view === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={19} strokeWidth={1.7} />
              <span>{label}</span>
              {id === "followups" && activeFollowups > 0 && (
                <small>{activeFollowups}</small>
              )}
              {view === id && id !== "followups" && (
                <span className="nav-dot" />
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-section-label settings-label">TU ESPACIO</div>
        <button
          className={`nav-item ${view === "settings" ? "active" : ""}`}
          aria-current={view === "settings" ? "page" : undefined}
          onClick={() => navigate("settings")}
        >
          <Settings2 size={19} strokeWidth={1.7} />
          <span>Identidad de la clínica</span>
        </button>
        <div className="sidebar-bottom">
          <button
            className="sidebar-help"
            onClick={() => {
              setOverlay({ type: "guide" });
              setMobileMenu(false);
            }}
          >
            <span className="help-icon">
              <ClipboardList size={20} />
            </span>
            <strong>Un recorrido completo</strong>
            <p>
              De la primera cita
              <br />
              al próximo encuentro.
            </p>
            <span>
              Explorar la demo <ArrowRight size={16} />
            </span>
          </button>
          <div className="demo-indicator">
            <i />
            <span>Demostración local</span>
            <button
              aria-label="Información sobre la demostración"
              onClick={() => setOverlay({ type: "guide" })}
            >
              <CircleHelp size={15} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir navegación"
              aria-expanded={mobileMenu}
              onClick={() => setMobileMenu(true)}
            >
              <Menu />
            </button>
            <span>{data.brand.name}</span>
            <ChevronRight size={13} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            <span className="today-label">
              {capitalizeFirst(formatDate(clinicToday(data), true))}
            </span>
            <span className="topbar-divider" />
            <span className="profile-avatar">
              {data.brand.veterinarian
                .replace(/^(Dra?\.?\s*)/, "")
                .split(" ")
                .slice(0, 2)
                .map((s) => s[0])
                .join("")}
            </span>
            <span className="profile-name">
              {data.brand.veterinarian}
              <small>Profesional</small>
            </span>
          </div>
        </header>
        <main id="main" className="main-content">
          {view === "today" && <Today {...props} onNavigate={navigate} />}
          {view === "agenda" && <Agenda {...props} />}
          {view === "patients" && (
            <Patients
              data={data}
              onAdd={() => setOverlay({ type: "patient" })}
              onPatient={(p) => setOverlay({ type: "patientDetail", id: p.id })}
            />
          )}
          {view === "vaccinations" && (
            <Vaccinations
              key={vaccinationPatientId}
              data={data}
              commit={commit}
              onFollowup={onFollowup}
              initialPatientId={vaccinationPatientId}
            />
          )}
          {view === "followups" && <Followups {...props} />}
          {view === "settings" && (
            <Settings
              data={data}
              commit={commit}
              onReset={() => {
                setResetError("");
                setOverlay({ type: "reset" });
              }}
            />
          )}
          {view === "visit" &&
            data.appointments.some((a) => a.id === appointmentId) && (
              <Visit
                key={appointmentId}
                data={data}
                appointmentId={appointmentId}
                commit={commit}
                onBack={() => navigate("agenda")}
                onFollowup={onFollowup}
              />
            )}
        </main>
        <footer className="workspace-footer">
          <span>{data.brand.tagline}</span>
          <span>Datos de ejemplo · Guardado en este navegador</span>
        </footer>
      </div>
      <div className="toast-region" role="status" aria-live="polite">
        {notice && (
          <div className="toast">
            <Check size={18} />
            {notice}
          </div>
        )}
      </div>
      {overlay?.type === "appointment" && (
        <Modal
          title={overlay.followupId ? "Volvemos a vernos" : "Una nueva visita"}
          description={
            overlay.followupId
              ? "Programa la revisión del paciente."
              : "Reserva un momento para cuidar."
          }
          onClose={() => setOverlay(null)}
        >
          <AppointmentForm
            key={overlay.followupId || overlay.patientId || "new"}
            data={data}
            commit={commit}
            onDone={() => setOverlay(null)}
            patientId={overlay.patientId}
            followupId={overlay.followupId}
          />
        </Modal>
      )}
      {overlay?.type === "patient" && (
        <Modal
          title="Su historia empieza aquí"
          description="Añade el paciente y los datos de su familia."
          onClose={() => setOverlay(null)}
        >
          <PatientForm commit={commit} onDone={() => setOverlay(null)} />
        </Modal>
      )}
      {selectedPatient && (
        <Modal
          title={`La ficha de ${selectedPatient.name}`}
          onClose={() => setOverlay(null)}
        >
          <PatientDetails
            data={data}
            patient={selectedPatient}
            onBook={() => onBook(selectedPatient.id)}
            onVaccinations={() => onVaccinations(selectedPatient.id)}
            onVisit={onVisit}
          />
        </Modal>
      )}
      {selectedFollowup && (
        <Modal title="Seguimos en contacto" onClose={() => setOverlay(null)}>
          <FollowupForm
            key={selectedFollowup.id}
            data={data}
            followup={selectedFollowup}
            commit={commit}
            onVisit={onVisit}
            onBook={() =>
              setOverlay({
                type: "appointment",
                patientId: selectedFollowup.patientId,
                followupId: selectedFollowup.id,
              })
            }
          />
        </Modal>
      )}
      {overlay?.type === "reset" && (
        <Modal
          title="Restaurar datos de ejemplo"
          description="Se sustituirán las citas, pacientes, consultas, vacunas y seguimientos de esta demostración. Se conservará la identidad de la clínica."
          onClose={() => setOverlay(null)}
        >
          <ErrorMessage message={resetError} />
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setOverlay(null)}>
              Conservar datos
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const error = reset();
                setResetError(error);
                if (!error) {
                  setOverlay(null);
                  navigate("today");
                }
              }}
            >
              Restaurar ejemplos
            </Button>
          </div>
        </Modal>
      )}
      {overlay?.type === "guide" && (
        <Modal
          title="Prueba una atención completa"
          description="Todo el recorrido funciona con datos de ejemplo."
          onClose={() => setOverlay(null)}
        >
          <ol className="guide-list">
            <li>
              <span>01</span>
              <div>
                <strong>Recibe a un paciente</strong>
                <p>
                  Abre una cita confirmada desde la agenda e inicia la consulta.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Registra la visita</strong>
                <p>
                  Añade valoración e indicaciones y elige cuándo hacer el
                  seguimiento.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Continúa el contacto</strong>
                <p>
                  Registra un contacto de prueba y la respuesta del propietario.
                </p>
              </div>
            </li>
            <li>
              <span>04</span>
              <div>
                <strong>Reserva la revisión</strong>
                <p>La nueva cita quedará vinculada a la visita anterior.</p>
              </div>
            </li>
          </ol>
          <div className="note-box">
            <strong>También puedes probar las vacunas</strong>
            <p>
              Abre Vacunas: hay próximas dosis vencidas, para hoy y futuras.
              Registra una aplicación o continúa su seguimiento.
            </p>
          </div>
          <div className="simulation-note">
            <ShieldCheck size={19} />
            <p>
              No hay envíos, usuarios reales ni servicios conectados. Los
              cambios se guardan en este navegador. Para otra clínica, cambia la
              identidad desde el menú.
            </p>
          </div>
          <div className="form-actions">
            <Button
              onClick={() => {
                setOverlay(null);
                navigate("agenda");
              }}
            >
              Abrir agenda
              <ArrowRight size={16} />
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
