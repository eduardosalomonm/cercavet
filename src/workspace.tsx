import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MessageCircle,
  Plus,
  Search,
  Stethoscope,
} from "lucide-react";
import { formatDate, localDate, offsetDate, statusLabels } from "./domain.ts";
import type { Appointment, ClinicState, Followup, Patient } from "./domain.ts";
import { Badge, Button, Empty, Heading, PetIcon, TextLink } from "./ui.tsx";

export const followupLabels = {
  pending: "Por contactar",
  contacted: "Espera respuesta",
  replied: "Preparar revisión",
  closed: "Cerrado",
};
type WorkspaceProps = {
  data: ClinicState;
  onVisit: (id: string) => void;
  onFollowup: (id: string) => void;
  onBook: (patientId?: string) => void;
};

export function AppointmentList({
  data,
  appointments,
  onVisit,
}: {
  data: ClinicState;
  appointments: Appointment[];
  onVisit: (id: string) => void;
}) {
  return (
    <div className="appointment-list">
      {appointments.map((a) => {
        const p = data.patients.find((p) => p.id === a.patientId)!;
        return (
          <button
            key={a.id}
            className={`appointment-row ${a.status === "cancelled" ? "cancelled" : ""}`}
            onClick={() => onVisit(a.id)}
            aria-label={`${a.date.slice(11)} ${p.name}, ${a.reason}, ${statusLabels[a.status]}`}
          >
            <div className="appointment-time">
              <strong>{a.date.slice(11)}</strong>
              <span>{a.duration} min</span>
            </div>
            <PetIcon patient={p} />
            <div className="appointment-patient">
              <strong>
                {p.name}
                <span>{p.species}</span>
              </strong>
              <p>{p.owner}</p>
            </div>
            <div className="appointment-reason">
              <strong>{a.reason}</strong>
              <p>{data.brand.veterinarian}</p>
            </div>
            <Badge tone={a.status}>{statusLabels[a.status]}</Badge>
            <ChevronRight className="row-arrow" size={18} />
          </button>
        );
      })}
    </div>
  );
}

export function FollowupCard({
  data,
  followup,
  onOpen,
}: {
  data: ClinicState;
  followup: Followup;
  onOpen: () => void;
}) {
  const p = data.patients.find((p) => p.id === followup.patientId)!;
  const overdue =
    followup.dueDate < localDate() && followup.status !== "closed";
  return (
    <button className="followup-card" onClick={onOpen}>
      <div className="followup-card-top">
        <PetIcon patient={p} />
        <div>
          <strong>{p.name}</strong>
          <p>{p.owner}</p>
        </div>
        <ArrowUpRight size={18} />
      </div>
      <p className="followup-excerpt">
        {followup.status === "replied" || followup.status === "closed"
          ? followup.response
          : "Un pequeño mensaje para saber cómo sigue."}
      </p>
      <div className="followup-card-bottom">
        <Badge
          tone={
            followup.status === "replied"
              ? "confirmed"
              : followup.status === "closed"
                ? "completed"
                : "warning"
          }
        >
          {followupLabels[followup.status]}
        </Badge>
        <span className={overdue ? "overdue" : ""}>
          {overdue ? "Vencido · " : ""}
          {followup.dueDate === localDate()
            ? "Hoy"
            : formatDate(followup.dueDate)}
        </span>
      </div>
    </button>
  );
}

export function Today({
  data,
  onVisit,
  onFollowup,
  onBook,
  onNavigate,
}: WorkspaceProps & { onNavigate: (view: "agenda" | "followups") => void }) {
  const appointments = data.appointments
    .filter((a) => a.date.startsWith(localDate()) && a.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date));
  const followups = data.followups
    .filter((f) => f.status !== "closed")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const toContact = followups.filter(
    (f) => f.dueDate <= localDate() && f.status === "pending",
  ).length;
  const ready = followups.filter((f) => f.status === "replied").length;
  return (
    <>
      <Heading
        eyebrow="TU CLÍNICA, EN UN VISTAZO"
        title="Cada visita, un cuidado que sigue."
        action={
          <Button onClick={() => onBook()}>
            <Plus size={18} />
            Nueva cita
          </Button>
        }
      >
        Esto es lo que necesita tu atención hoy.
      </Heading>
      <section className="overview" aria-label="Resumen de actividad">
        <div className="overview-intro">
          <span className="eyebrow">EL DÍA POR DELANTE</span>
          <h2>
            Más cerca.
            <br />
            En cada paso.
          </h2>
          <span className="overview-decoration" aria-hidden="true">
            <Plus />
            <span />
            <span />
          </span>
        </div>
        <div className="stats">
          <button onClick={() => onNavigate("agenda")}>
            <CalendarDays />
            <strong>{appointments.length.toString().padStart(2, "0")}</strong>
            <span>
              Citas para hoy
              <ArrowUpRight size={14} />
            </span>
          </button>
          <button onClick={() => onNavigate("followups")}>
            <MessageCircle />
            <strong>{toContact.toString().padStart(2, "0")}</strong>
            <span>
              Por contactar hoy
              <ArrowUpRight size={14} />
            </span>
          </button>
          <button onClick={() => onNavigate("followups")}>
            <CalendarPlus />
            <strong>{ready.toString().padStart(2, "0")}</strong>
            <span>
              Preparar revisión
              <ArrowUpRight size={14} />
            </span>
          </button>
        </div>
      </section>
      <div className="today-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">AGENDA</span>
              <h2>
                Las visitas de hoy{" "}
                <span className="count">{appointments.length}</span>
              </h2>
            </div>
            <TextLink onClick={() => onNavigate("agenda")}>Ver agenda</TextLink>
          </div>
          {appointments.length ? (
            <AppointmentList
              data={data}
              appointments={appointments}
              onVisit={onVisit}
            />
          ) : (
            <Empty
              title="Hoy la agenda está libre"
              action={
                <Button variant="secondary" onClick={() => onBook()}>
                  Añadir una cita
                </Button>
              }
            >
              Prepara la siguiente visita de tus pacientes.
            </Empty>
          )}
          <div className="panel-foot">
            <span className="presence-dot" />
            {data.brand.veterinarian}
            <span>09:00 – 20:00</span>
          </div>
        </section>
        <section className="care-column">
          <div className="section-heading">
            <div>
              <span className="eyebrow">DESPUÉS DE LA VISITA</span>
              <h2>Seguimos cerca</h2>
            </div>
            <span className="count">{followups.length}</span>
          </div>
          {followups.slice(0, 2).map((f) => (
            <FollowupCard
              key={f.id}
              data={data}
              followup={f}
              onOpen={() => onFollowup(f.id)}
            />
          ))}
          {!followups.length && (
            <div className="note-box">
              <Check size={22} />
              <p>No hay seguimientos pendientes.</p>
            </div>
          )}
          <TextLink onClick={() => onNavigate("followups")}>
            Todos los seguimientos
          </TextLink>
        </section>
      </div>
      <section className="journey-preview">
        <div>
          <span className="eyebrow">UNA ATENCIÓN CONTINUA</span>
          <h2>El siguiente paso también importa.</h2>
        </div>
        <ol>
          {[
            { icon: CalendarDays, label: "Cita" },
            { icon: Stethoscope, label: "Consulta" },
            { icon: MessageCircle, label: "Seguimiento" },
            { icon: CalendarPlus, label: "Nueva reserva" },
          ].map(({ icon: Icon, label }, i) => (
            <li key={label}>
              <span>
                <Icon size={18} />
              </span>
              <small>0{i + 1}</small>
              <strong>{label}</strong>
              {i < 3 && <ArrowRight className="journey-arrow" size={15} />}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

export function Agenda({ data, onVisit, onBook }: WorkspaceProps) {
  const [date, setDate] = useState(localDate());
  const [status, setStatus] = useState("all");
  const weekStart = new Date(`${date}T12:00:00`);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) =>
    offsetDate(i, localDate(weekStart)),
  );
  const appointments = data.appointments
    .filter(
      (a) =>
        a.date.startsWith(date) && (status === "all" || a.status === status),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <Heading
        eyebrow="ORGANIZACIÓN"
        title="Una agenda con espacio para cuidar."
        action={
          <Button onClick={() => onBook()}>
            <Plus size={18} />
            Nueva cita
          </Button>
        }
      />
      <section className="panel agenda-panel">
        <div className="agenda-toolbar">
          <div className="date-controls">
            <button
              className="icon-button"
              aria-label="Semana anterior"
              onClick={() => setDate(offsetDate(-7, date))}
            >
              <ChevronLeft />
            </button>
            <h2>{formatDate(date, true)}</h2>
            <button
              className="icon-button"
              aria-label="Semana siguiente"
              onClick={() => setDate(offsetDate(7, date))}
            >
              <ChevronRight />
            </button>
            <Button variant="secondary" onClick={() => setDate(localDate())}>
              Hoy
            </Button>
          </div>
          <label className="compact-label">
            Ir a fecha
            <input
              aria-label="Fecha de la agenda"
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
          </label>
        </div>
        <div className="week-strip">
          {days.map((day) => {
            const count = data.appointments.filter(
              (a) => a.date.startsWith(day) && a.status !== "cancelled",
            ).length;
            return (
              <button
                key={day}
                className={day === date ? "selected" : ""}
                aria-pressed={day === date}
                onClick={() => setDate(day)}
              >
                <span>
                  {new Intl.DateTimeFormat("es-ES", {
                    weekday: "short",
                  }).format(new Date(`${day}T12:00:00`))}
                </span>
                <strong>{Number(day.slice(8))}</strong>
                <small>
                  {count
                    ? `${count} ${count === 1 ? "cita" : "citas"}`
                    : "Libre"}
                </small>
                {day === localDate() && <i />}
              </button>
            );
          })}
        </div>
        <div className="list-toolbar">
          <span>
            {appointments.length}{" "}
            {appointments.length === 1 ? "visita" : "visitas"}
          </span>
          <select
            aria-label="Filtrar citas por estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {appointments.length ? (
          <AppointmentList
            data={data}
            appointments={appointments}
            onVisit={onVisit}
          />
        ) : (
          <Empty title="Sin citas para esta selección">
            Prueba con otro día o añade una nueva visita.
          </Empty>
        )}
      </section>
    </>
  );
}

export function Patients({
  data,
  onAdd,
  onPatient,
}: {
  data: ClinicState;
  onAdd: () => void;
  onPatient: (patient: Patient) => void;
}) {
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("all");
  const normalize = (v: string) =>
    v
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es");
  const patients = data.patients.filter(
    (p) =>
      normalize(`${p.name} ${p.owner} ${p.breed}`).includes(
        normalize(search),
      ) &&
      (species === "all" || p.species === species),
  );
  return (
    <>
      <Heading
        eyebrow="PACIENTES Y FAMILIAS"
        title="Cada nombre, una historia."
        action={
          <Button onClick={onAdd}>
            <Plus size={18} />
            Añadir paciente
          </Button>
        }
      >
        Sus visitas, su evolución y las personas que los cuidan.
      </Heading>
      <div className="search-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Buscar paciente o propietario"
            placeholder="Buscar paciente o propietario…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Filtrar por especie"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
        >
          <option value="all">Todas las especies</option>
          <option>Perro</option>
          <option>Gato</option>
          <option>Otro</option>
        </select>
        <span className="muted">{patients.length} pacientes</span>
      </div>
      <div className="patient-grid">
        {patients.map((p) => (
          <button
            className="patient-card"
            key={p.id}
            onClick={() => onPatient(p)}
          >
            <div className="patient-card-head">
              <PetIcon patient={p} large />
              <ArrowUpRight size={18} />
            </div>
            <h2>{p.name}</h2>
            <p>
              {p.breed || p.species}
              {p.age && ` · ${p.age}`}
            </p>
            <div className="patient-owner">
              <span>PROPIETARIO</span>
              <strong>{p.owner}</strong>
            </div>
            <div className="patient-card-foot">
              <span>
                {
                  data.consultations.filter((c) =>
                    data.appointments.some(
                      (a) => a.id === c.appointmentId && a.patientId === p.id,
                    ),
                  ).length
                }{" "}
                consultas
              </span>
              <span>
                Ver ficha <ArrowRight size={14} />
              </span>
            </div>
          </button>
        ))}
      </div>
      {!patients.length && (
        <Empty title="No hay pacientes con esos datos">
          Prueba con otro nombre o añade un paciente.
        </Empty>
      )}
    </>
  );
}

export function Followups({ data, onFollowup }: WorkspaceProps) {
  const [filter, setFilter] = useState("active");
  const followups = data.followups
    .filter((f) =>
      filter === "active" ? f.status !== "closed" : f.status === filter,
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return (
    <>
      <Heading
        eyebrow="CONTINUIDAD DEL CUIDADO"
        title="La consulta termina. El cuidado sigue."
      >
        Contacta, registra la evolución y prepara la próxima visita.
      </Heading>
      <div className="filter-tabs" aria-label="Estado del seguimiento">
        {[
          ["active", "Pendientes"],
          ["pending", "Por contactar"],
          ["contacted", "Espera respuesta"],
          ["replied", "Preparar revisión"],
          ["closed", "Cerrados"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={filter === value ? "active" : ""}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="followup-grid">
        {followups.map((f) => (
          <FollowupCard
            key={f.id}
            data={data}
            followup={f}
            onOpen={() => onFollowup(f.id)}
          />
        ))}
      </div>
      {!followups.length && (
        <Empty title="Todo al día en esta sección">
          Los seguimientos se crean al finalizar una consulta.
        </Empty>
      )}
      <p className="page-note">
        <MessageCircle size={16} />
        Los contactos de esta versión son simulados y se guardan solo en este
        navegador.
      </p>
    </>
  );
}

export function PatientDetails({
  data,
  patient,
  onVisit,
  onBook,
}: {
  data: ClinicState;
  patient: Patient;
  onVisit: (id: string) => void;
  onBook: () => void;
}) {
  const appointments = data.appointments
    .filter((a) => a.patientId === patient.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="form-stack">
      <div className="patient-summary">
        <PetIcon patient={patient} large />
        <div>
          <h3>{patient.name}</h3>
          <p>
            {patient.breed || patient.species} ·{" "}
            {patient.age || "Edad sin registrar"}
          </p>
        </div>
      </div>
      <div className="detail-grid">
        <div>
          <span>Propietario</span>
          <strong>{patient.owner}</strong>
        </div>
        <div>
          <span>Teléfono</span>
          <strong>{patient.phone || "Sin registrar"}</strong>
        </div>
        <div>
          <span>Correo</span>
          <strong>{patient.email || "Sin registrar"}</strong>
        </div>
        <div>
          <span>Alergias y avisos</span>
          <strong>{patient.allergies || "Sin registrar"}</strong>
        </div>
      </div>
      <Button onClick={onBook}>
        <CalendarPlus size={17} />
        Reservar cita para {patient.name}
      </Button>
      <div className="section-heading">
        <h3>Historial de visitas</h3>
        <span className="count">{appointments.length}</span>
      </div>
      {appointments.map((a) => (
        <button
          key={a.id}
          className="history-row"
          onClick={() => onVisit(a.id)}
        >
          <span className="history-dot">
            <Clock3 size={16} />
          </span>
          <div>
            <strong>{a.reason}</strong>
            <p>
              {formatDate(a.date)} · {a.date.slice(11)}
            </p>
          </div>
          <Badge tone={a.status}>{statusLabels[a.status]}</Badge>
          <ChevronRight size={17} />
        </button>
      ))}
      {!appointments.length && (
        <p className="muted">Su historia empieza con la primera visita.</p>
      )}
    </div>
  );
}
