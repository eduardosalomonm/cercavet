import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  History,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Syringe,
} from "lucide-react";
import { searchKey } from "./domain.ts";
import type { ClinicState, Vaccination } from "./domain.ts";
import { clinicToday, formatDate, offsetDate } from "./dates.ts";
import { addVaccinationExamples } from "./seed.ts";
import type { Commit } from "./store.ts";
import {
  correctVaccinationDates,
  registerVaccination,
  vaccinationFollowup,
  vaccinationStatus,
  vaccineStatusLabels,
} from "./vaccination-domain.ts";
import {
  Badge,
  Button,
  Empty,
  ErrorMessage,
  Heading,
  Modal,
  PetIcon,
} from "./ui.tsx";

type Editor =
  { type: "new"; previousId?: string } | { type: "dates"; id: string } | null;
const tone = (status: string) =>
  status === "overdue"
    ? "overdue"
    : status === "today"
      ? "warning"
      : status === "completed"
        ? "completed"
        : "confirmed";

export function Vaccinations({
  data,
  commit,
  onFollowup,
  initialPatientId = "",
}: {
  data: ClinicState;
  commit: Commit;
  onFollowup: (id: string) => void;
  initialPatientId?: string;
}) {
  const [patientId, setPatientId] = useState(initialPatientId);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");
  const [editor, setEditor] = useState<Editor>(null);
  const [error, setError] = useState("");
  const today = clinicToday(data);
  const records = data.vaccinations.filter((v) => {
    const patient = data.patients.find((p) => p.id === v.patientId)!;
    return (
      (!patientId || patientId === v.patientId) &&
      searchKey(`${patient.name} ${patient.owner} ${v.name} ${v.lot}`).includes(
        searchKey(search),
      )
    );
  });
  const count = (status: string) =>
    records.filter((v) => vaccinationStatus(data, v, today) === status).length;
  const visible = records
    .filter(
      (v) =>
        filter === "all" ||
        (filter === "active"
          ? vaccinationStatus(data, v, today) !== "completed"
          : vaccinationStatus(data, v, today) === filter),
    )
    .sort((a, b) => a.nextDueOn.localeCompare(b.nextDueOn));
  const selected =
    editor?.type === "dates"
      ? data.vaccinations.find((v) => v.id === editor.id)
      : undefined;
  const previous =
    editor?.type === "new"
      ? data.vaccinations.find((v) => v.id === editor.previousId)
      : undefined;
  return (
    <>
      <Heading
        eyebrow="PREVENCIÓN Y CONTINUIDAD"
        title="Sus vacunas, con continuidad."
        action={
          <Button onClick={() => setEditor({ type: "new" })}>
            <Plus size={18} />
            Registrar vacuna
          </Button>
        }
      >
        Cada aplicación conserva su historia. Cada próxima dosis tiene un único
        seguimiento.
      </Heading>
      <div
        className="vaccine-stats"
        aria-label="Vencimientos de próximas dosis"
      >
        {(
          [
            ["overdue", "Vencidas"],
            ["today", "Vencen hoy"],
            ["upcoming", "Próximos 30 días"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            aria-pressed={filter === value}
            className={filter === value ? "selected" : ""}
            onClick={() => setFilter(value)}
          >
            <span>{label}</span>
            <strong>{count(value).toString().padStart(2, "0")}</strong>
            <ArrowRight size={17} />
          </button>
        ))}
      </div>
      <div className="search-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Buscar vacuna, paciente o lote"
            placeholder="Buscar vacuna, paciente o lote…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Paciente de las vacunas"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
        >
          <option value="">Todos los pacientes</option>
          {data.patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.owner}
            </option>
          ))}
        </select>
      </div>
      <div
        className="filter-tabs vaccine-filters"
        aria-label="Estado de la próxima dosis"
      >
        {[
          ["active", "Por completar"],
          ["overdue", "Vencidas"],
          ["today", "Hoy"],
          ["upcoming", "Próximas 30 días"],
          ["scheduled", "Más adelante"],
          ["completed", "Histórico"],
          ["all", "Todas"],
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
      <p className="field-help">
        Hoy: {formatDate(today, true)} · Zona horaria: {data.timeZone}.
        «Vencida» se refiere a la próxima dosis, no al lote.
      </p>
      <div className="vaccine-list">
        {visible.map((v) => {
          const patient = data.patients.find((p) => p.id === v.patientId)!;
          const followup = vaccinationFollowup(data, v.id)!;
          const status = vaccinationStatus(data, v, today);
          return (
            <article
              className="panel vaccine-card"
              key={v.id}
              aria-label={`${patient.name}: ${v.name}`}
            >
              <div className="vaccine-card-heading">
                <PetIcon patient={patient} />
                <div>
                  <h2>{patient.name}</h2>
                  <p>{patient.owner}</p>
                </div>
                <Badge tone={tone(status)}>{vaccineStatusLabels[status]}</Badge>
              </div>
              <h3>
                <Syringe size={17} />
                {v.name}
              </h3>
              <dl className="vaccine-dates">
                <div>
                  <dt>Lote aplicado</dt>
                  <dd>{v.lot}</dd>
                </div>
                <div>
                  <dt>Aplicación</dt>
                  <dd>
                    {formatDate(v.administeredOn)} ·{" "}
                    {v.administeredOn.slice(0, 4)}
                  </dd>
                </div>
                <div>
                  <dt>Próxima dosis</dt>
                  <dd>
                    {formatDate(v.nextDueOn)} · {v.nextDueOn.slice(0, 4)}
                  </dd>
                </div>
              </dl>
              <div className="vaccine-followup-state">
                <MessageCircle size={15} />
                <span>
                  {followup.closeReason === "dose-recorded"
                    ? "Seguimiento cerrado al registrar la dosis siguiente"
                    : followup.newAppointmentId
                      ? "Revisión reservada · no confirma la aplicación"
                      : {
                          pending: "Seguimiento por contactar",
                          contacted:
                            "Contacto de prueba registrado · espera respuesta",
                          replied: "Respuesta registrada · preparar revisión",
                          closed:
                            "Seguimiento cerrado · dosis aún por registrar",
                        }[followup.status]}
                </span>
              </div>
              <div className="vaccine-actions">
                <Button
                  variant="secondary"
                  onClick={() => onFollowup(followup.id)}
                >
                  Ver seguimiento
                  <ArrowRight size={16} />
                </Button>
                {status !== "completed" && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setEditor({ type: "new", previousId: v.id })
                      }
                    >
                      <CalendarPlus size={16} />
                      Registrar próxima dosis
                    </Button>
                    <button
                      className="inline-button"
                      onClick={() => setEditor({ type: "dates", id: v.id })}
                    >
                      <Pencil size={14} />
                      Corregir fechas
                    </button>
                  </>
                )}
              </div>
              {!!v.corrections.length && (
                <details className="vaccine-history">
                  <summary>
                    <History size={14} />
                    {v.corrections.length}{" "}
                    {v.corrections.length === 1
                      ? "corrección registrada"
                      : "correcciones registradas"}
                  </summary>
                  <ol>
                    {v.corrections.map((c, i) => (
                      <li key={`${c.at}-${i}`}>
                        <strong>{c.reason}</strong>
                        <span>
                          Antes: aplicación {formatDate(c.administeredOn)} ·
                          próxima dosis {formatDate(c.nextDueOn)}
                        </span>
                        <small>
                          {new Intl.DateTimeFormat("es-ES", {
                            timeZone: data.timeZone,
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(c.at))}
                        </small>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <Empty
          title={
            data.vaccinations.length
              ? "No hay vacunas en esta selección"
              : "La prevención empieza con un registro"
          }
          action={
            data.vaccinations.length ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setFilter("all");
                  setPatientId("");
                  setSearch("");
                }}
              >
                Ver todos los registros
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() =>
                  setError(
                    commit(
                      addVaccinationExamples,
                      "Se han añadido cuatro pacientes y sus vacunas de ejemplo.",
                    ),
                  )
                }
              >
                Cargar ejemplos de vacunas
              </Button>
            )
          }
        >
          {data.vaccinations.length
            ? "Cambia el estado o busca otro paciente."
            : "Registra una aplicación o añade cuatro pacientes ficticios con dosis vencidas, para hoy y próximas. Se conservan tus datos actuales."}
        </Empty>
      )}
      <ErrorMessage message={error} />
      <p className="page-note">
        <Syringe size={16} />
        Datos de ejemplo. Las fechas las indica el veterinario; esta demo no
        define pautas ni envía avisos.
      </p>
      {editor && (
        <Modal
          title={
            selected
              ? "Corregir fechas de vacunación"
              : previous
                ? "Registrar la siguiente dosis"
                : "Registrar una vacuna"
          }
          description={
            selected
              ? "La corrección queda en el historial y mantiene el mismo seguimiento."
              : "Anota una dosis ya aplicada y la próxima fecha indicada por el veterinario."
          }
          onClose={() => setEditor(null)}
        >
          <VaccinationForm
            key={selected?.id || previous?.id || "new"}
            data={data}
            commit={commit}
            selected={selected}
            previous={previous}
            patientId={patientId}
            onDone={() => setEditor(null)}
          />
        </Modal>
      )}
    </>
  );
}

function VaccinationForm({
  data,
  commit,
  selected,
  previous,
  patientId: initialPatientId,
  onDone,
}: {
  data: ClinicState;
  commit: Commit;
  selected?: Vaccination;
  previous?: Vaccination;
  patientId: string;
  onDone: () => void;
}) {
  const [id] = useState(() => crypto.randomUUID());
  const [patientId, setPatientId] = useState(
    selected?.patientId || previous?.patientId || initialPatientId,
  );
  const [previousId, setPreviousId] = useState(previous?.id || "");
  const [name, setName] = useState(selected?.name || previous?.name || "");
  const [administeredOn, setAdministeredOn] = useState(
    selected?.administeredOn || clinicToday(data),
  );
  const [error, setError] = useState("");
  const [consultationId, setConsultationId] = useState("");
  const candidates = data.vaccinations.filter(
    (v) =>
      v.patientId === patientId && vaccinationStatus(data, v) !== "completed",
  );
  const consultations = data.consultations.filter((c) =>
    data.appointments.some(
      (a) => a.id === c.appointmentId && a.patientId === patientId,
    ),
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextDueOn = String(form.get("nextDueOn") || "");
    const error = commit(
      (state) =>
        selected
          ? correctVaccinationDates(state, selected.id, {
              administeredOn,
              nextDueOn,
              reason: String(form.get("correctionReason") || ""),
            })
          : registerVaccination(state, {
              id,
              patientId,
              name,
              lot: String(form.get("lot") || ""),
              administeredOn,
              nextDueOn,
              ...(previousId ? { previousDoseId: previousId } : {}),
              ...(consultationId ? { consultationId } : {}),
            }),
      selected
        ? "Fechas corregidas. Se mantiene el mismo seguimiento y la cita, si la hay."
        : "Vacuna registrada con su seguimiento vinculado.",
    );
    setError(error);
    if (!error) onDone();
  }
  return (
    <form
      className="form-stack"
      onSubmit={submit}
      onChangeCapture={() => setError("")}
    >
      <label>
        Paciente
        <select
          value={patientId}
          required
          disabled={!!selected || !!previous}
          onChange={(e) => {
            setPatientId(e.target.value);
            setPreviousId("");
            setConsultationId("");
          }}
        >
          <option value="" disabled>
            Selecciona un paciente
          </option>
          {data.patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.owner}
            </option>
          ))}
        </select>
      </label>
      {!selected && !previous && !!candidates.length && (
        <label>
          Dosis anterior (opcional)
          <select
            value={previousId}
            onChange={(e) => {
              setPreviousId(e.target.value);
              const v = candidates.find((v) => v.id === e.target.value);
              if (v) setName(v.name);
            }}
          >
            <option value="">Primer registro o vacuna independiente</option>
            {candidates.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · aplicada {v.administeredOn}
              </option>
            ))}
          </select>
          <span className="field-help">
            Enlázala para completar el vencimiento anterior y conservar su
            historia.
          </span>
        </label>
      )}
      {previous && (
        <div className="note-box">
          Dosis anterior: {previous.administeredOn} · lote {previous.lot}. Su
          seguimiento se cerrará al guardar esta aplicación.
        </div>
      )}
      <div className="form-grid">
        <label>
          Vacuna
          <input
            value={name}
            maxLength={100}
            required
            readOnly={!!selected || !!previousId}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la vacuna aplicada"
          />
        </label>
        <label>
          Lote aplicado
          <input
            name="lot"
            defaultValue={selected?.lot || ""}
            maxLength={80}
            required
            readOnly={!!selected}
            placeholder="Lote del envase"
          />
        </label>
      </div>
      <div className="form-grid">
        <label>
          Fecha de aplicación
          <input
            type="date"
            name="administeredOn"
            value={administeredOn}
            max={clinicToday(data)}
            required
            onChange={(e) => setAdministeredOn(e.target.value)}
          />
        </label>
        <label>
          Próxima dosis
          <input
            type="date"
            name="nextDueOn"
            defaultValue={selected?.nextDueOn || ""}
            min={administeredOn ? offsetDate(1, administeredOn) : undefined}
            required
          />
        </label>
      </div>
      <p className="field-help">
        La próxima fecha la indica el veterinario. Puedes registrar fechas ya
        vencidas para recuperar el seguimiento. Zona horaria: {data.timeZone}.
      </p>
      {selected ? (
        <>
          <label>
            Motivo de la corrección
            <textarea
              name="correctionReason"
              rows={2}
              maxLength={300}
              required
              placeholder="Explica por qué cambian las fechas"
            />
          </label>
          <p className="field-help">
            Los mensajes ya registrados se conservan. Una cita reservada no
            cambia de fecha automáticamente.
          </p>
        </>
      ) : (
        <>
          <label>
            Consulta asociada (opcional)
            <select
              value={consultationId}
              onChange={(e) => setConsultationId(e.target.value)}
            >
              <option value="">Registro de vacunación independiente</option>
              {consultations.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatDate(
                    data.appointments.find((a) => a.id === c.appointmentId)!
                      .date,
                  )}{" "}
                  · {c.summary}
                </option>
              ))}
            </select>
          </label>
          <div className="info-box">
            <MessageCircle size={19} />
            <p>
              Se creará un único seguimiento para esta próxima dosis. El
              contacto es simulado.
            </p>
          </div>
        </>
      )}
      <ErrorMessage message={error} />
      <div className="form-actions">
        <Button variant="secondary" onClick={onDone}>
          Volver
        </Button>
        <Button type="submit">
          <Check size={16} />
          {selected ? "Guardar corrección" : "Guardar vacuna"}
        </Button>
      </div>
    </form>
  );
}
