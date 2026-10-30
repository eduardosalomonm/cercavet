import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  CheckCheck,
  Copy,
  MessageCircle,
  Phone,
  Plus,
} from "lucide-react";
import {
  addPatient,
  bookAppointment,
  clinicNow,
  closeFollowup,
  contactFollowup,
  formatDate,
  clinicToday,
  offsetDate,
  replyFollowup,
  shifts,
} from "./domain.ts";
import type { ClinicState, Followup, Patient } from "./domain.ts";
import type { Commit } from "./store.ts";
import { Badge, Button, ErrorMessage, PetIcon } from "./ui.tsx";

export function AppointmentForm({
  data,
  commit,
  onDone,
  patientId = "",
  followupId,
}: {
  data: ClinicState;
  commit: Commit;
  onDone: () => void;
  patientId?: string;
  followupId?: string;
}) {
  const followup = data.followups.find((f) => f.id === followupId);
  const consultation = data.consultations.find(
    (c) => c.id === followup?.consultationId,
  );
  const vaccine = data.vaccinations.find(
    (v) => v.id === followup?.vaccinationId,
  );
  const proposed =
    vaccine?.nextDueOn ||
    consultation?.nextVisitDate ||
    offsetDate(1, clinicToday(data));
  const [error, setError] = useState("");
  // Today only offers the next quarter hour onwards; late in the day the
  // form starts on tomorrow.
  const today = clinicToday(data);
  const [h, m] = clinicNow(data).slice(11).split(":").map(Number);
  const next = Math.ceil((h * 60 + m + 1) / 15) * 15;
  const nextSlot = `${String(Math.floor(next / 60)).padStart(2, "0")}:${String(next % 60).padStart(2, "0")}`;
  const [day, setDay] = useState(
    followupId && proposed > today
      ? proposed
      : nextSlot > "19:45"
        ? offsetDate(1, today)
        : today,
  );
  const minTime = day === today && nextSlot > "09:00" ? nextSlot : "09:00";
  const team = shifts(data);
  const defaultProfessional = (
    team.find((s) => s.from <= "16:00" && s.to > "16:00") || team[0]
  ).professional;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const professional = String(
      form.get("professional") || data.brand.veterinarian,
    );
    const error = commit(
      (s) =>
        bookAppointment(s, {
          patientId: followup?.patientId || String(form.get("patient")),
          date: `${form.get("date")}T${form.get("time")}`,
          duration: Number(form.get("duration")),
          reason: String(form.get("reason")),
          ...(professional !== data.brand.veterinarian ? { professional } : {}),
          ...(form.get("urgent") ? { urgent: true } : {}),
          ...(followupId ? { previousFollowupId: followupId } : {}),
        }),
      followupId
        ? "Revisión reservada y vinculada al seguimiento."
        : "Cita añadida a la agenda.",
    );
    setError(error);
    if (!error) onDone();
  }
  return (
    <form
      onSubmit={submit}
      className="form-stack"
      onChangeCapture={() => setError("")}
    >
      {followup && (
        <div className="info-box">
          <CalendarPlus size={19} />
          <div>
            <strong>
              {vaccine
                ? "Una revisión para su próxima dosis"
                : "Una visita que continúa la anterior"}
            </strong>
            <p>
              La revisión quedará vinculada al seguimiento y al historial del
              paciente.
            </p>
          </div>
        </div>
      )}
      <label>
        Paciente
        <select
          name="patient"
          defaultValue={followup?.patientId || patientId}
          required
          disabled={!!followup}
        >
          <option value="" disabled>
            Selecciona un paciente
          </option>
          {data.patients.map((p) => (
            <option value={p.id} key={p.id}>
              {p.name} · {p.owner}
            </option>
          ))}
        </select>
      </label>
      <div className="form-grid">
        <label>
          Fecha
          <input
            name="date"
            type="date"
            min={today}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            required
          />
        </label>
        <label>
          Hora
          <input
            name="time"
            type="time"
            min={minTime}
            max="19:45"
            step="900"
            defaultValue={minTime > "16:00" ? minTime : "16:00"}
            required
          />
        </label>
      </div>
      <div className="form-grid">
        <label>
          Duración
          <select name="duration" defaultValue="30">
            {[15, 30, 45, 60].map((n) => (
              <option key={n} value={n}>
                {n} minutos
              </option>
            ))}
          </select>
        </label>
        <label>
          Profesional
          {team.length > 1 ? (
            <select name="professional" defaultValue={defaultProfessional}>
              {team.map((s) => (
                <option key={s.professional} value={s.professional}>
                  {s.professional}
                </option>
              ))}
            </select>
          ) : (
            <input value={data.brand.veterinarian} readOnly />
          )}
        </label>
      </div>
      <label>
        Motivo
        <input
          name="reason"
          maxLength={150}
          placeholder="Ej. Revisión general"
          defaultValue={
            vaccine
              ? `Revisión de vacunación: ${vaccine.name}`
              : followupId
                ? "Revisión de seguimiento"
                : ""
          }
          required
        />
      </label>
      {!followupId && (
        <label className="check-field">
          <input name="urgent" type="checkbox" />
          Marcar como urgencia
        </label>
      )}
      <p className="field-help">
        {team.length > 1
          ? `Horarios: ${team.map((s) => `${s.professional}, ${s.from}–${s.to}`).join(" · ")}.`
          : `Agenda de un profesional · Horario de ${team[0].from} a ${team[0].to}.`}
      </p>
      <ErrorMessage message={error} />
      <div className="form-actions">
        <Button variant="secondary" onClick={onDone}>
          Volver
        </Button>
        <Button type="submit">
          <CalendarPlus size={17} />
          {followupId ? "Reservar revisión" : "Crear cita"}
        </Button>
      </div>
    </form>
  );
}

export function PatientForm({
  commit,
  onDone,
}: {
  commit: Commit;
  onDone: () => void;
}) {
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) || "");
    const error = commit(
      (s) =>
        addPatient(s, {
          name: value("name"),
          species: value("species") as Patient["species"],
          breed: value("breed"),
          age: value("age"),
          owner: value("owner"),
          phone: value("phone"),
          email: value("email"),
          allergies: value("allergies"),
        }),
      "Paciente añadido a la clínica.",
    );
    setError(error);
    if (!error) onDone();
  }
  return (
    <form
      onSubmit={submit}
      className="form-stack"
      onChangeCapture={() => setError("")}
    >
      <div className="form-grid">
        <label>
          Nombre del paciente
          <input name="name" maxLength={60} required placeholder="Ej. Kira" />
        </label>
        <label>
          Especie
          <select name="species">
            <option>Perro</option>
            <option>Gato</option>
            <option>Otro</option>
          </select>
        </label>
      </div>
      <div className="form-grid">
        <label>
          Raza
          <input name="breed" maxLength={80} placeholder="Ej. Mestizo" />
        </label>
        <label>
          Edad
          <input name="age" maxLength={40} placeholder="Ej. 3 años" />
        </label>
      </div>
      <label>
        Propietario
        <input
          name="owner"
          maxLength={100}
          required
          placeholder="Nombre y apellidos"
        />
      </label>
      <div className="form-grid">
        <label>
          Teléfono
          <input name="phone" type="tel" maxLength={30} />
        </label>
        <label>
          Correo
          <input name="email" type="email" maxLength={150} />
        </label>
      </div>
      <label>
        Alergias y avisos
        <textarea
          name="allergies"
          rows={2}
          maxLength={1000}
          placeholder="Información relevante antes de la consulta"
        />
      </label>
      <ErrorMessage message={error} />
      <div className="form-actions">
        <Button variant="secondary" onClick={onDone}>
          Volver
        </Button>
        <Button type="submit">
          <Plus size={17} />
          Añadir paciente
        </Button>
      </div>
    </form>
  );
}

export function FollowupForm({
  data,
  followup,
  commit,
  onBook,
  onVisit,
}: {
  data: ClinicState;
  followup: Followup;
  commit: Commit;
  onBook: () => void;
  onVisit: (id: string) => void;
}) {
  const patient = data.patients.find((p) => p.id === followup.patientId)!;
  const consultation = data.consultations.find(
    (c) => c.id === followup.consultationId,
  );
  const vaccine = data.vaccinations.find(
    (v) => v.id === followup.vaccinationId,
  );
  const nextVisitDate = vaccine?.nextDueOn || consultation?.nextVisitDate;
  const [message, setMessage] = useState(followup.message);
  const [response, setResponse] = useState("");
  const [outcome, setOutcome] = useState<"well" | "review">("well");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const run = (fn: (s: ClinicState) => ClinicState, notice: string) =>
    setError(commit(fn, notice));
  return (
    <div className="form-stack" onChangeCapture={() => setError("")}>
      <div className="patient-summary">
        <PetIcon patient={patient} large />
        <div>
          <h3>{patient.name}</h3>
          <p>
            {patient.owner} · {patient.species}
          </p>
          <span>
            <Phone size={13} />
            {patient.phone || "Sin teléfono"}
          </span>
        </div>
        <Badge tone={followup.status === "closed" ? "completed" : "confirmed"}>
          {formatDate(followup.dueDate)}
        </Badge>
      </div>
      <div className="note-box">
        <span className="eyebrow">
          {vaccine ? "SEGUIMIENTO DE VACUNACIÓN" : "ÚLTIMA CONSULTA"}
        </span>
        <p>
          {vaccine
            ? `${vaccine.name} · lote ${vaccine.lot}`
            : consultation?.summary}
        </p>
        {vaccine && (
          <p>
            Aplicada: {formatDate(vaccine.administeredOn)} · próxima dosis:{" "}
            {formatDate(vaccine.nextDueOn)}.
          </p>
        )}
        {consultation && (
          <button
            className="inline-button"
            onClick={() => onVisit(consultation.appointmentId)}
          >
            Ver consulta <ArrowRight size={14} />
          </button>
        )}
      </div>
      {followup.closeReason === "dose-recorded" && (
        <div className="info-box">
          <CheckCheck size={20} />
          <div>
            <p>
              La dosis siguiente ya está registrada. Este seguimiento se
              conserva cerrado; el nuevo registro tiene su propio seguimiento.
            </p>
            {followup.newAppointmentId && (
              <>
                <p>La cita vinculada se conserva en su estado actual.</p>
                <button
                  className="inline-button"
                  onClick={() => onVisit(followup.newAppointmentId!)}
                >
                  Ver cita vinculada <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {followup.status === "pending" && (
        <>
          <label>
            Mensaje para el propietario
            <textarea
              rows={6}
              value={message}
              maxLength={4000}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <div className="simulation-note">
            <MessageCircle size={16} />
            <p>Contacto de prueba. No se envía ningún WhatsApp ni correo.</p>
          </div>
          <div className="form-actions">
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message);
                  setCopied(true);
                } catch {
                  setError(
                    "No se pudo copiar. Puedes seleccionar el texto y copiarlo manualmente.",
                  );
                }
              }}
            >
              <Copy size={16} />
              {copied ? "Copiado" : "Copiar texto"}
            </Button>
            <Button
              onClick={() =>
                run(
                  (s) => contactFollowup(s, followup.id, message),
                  "Contacto de prueba registrado. No se ha enviado ningún mensaje.",
                )
              }
            >
              <Check size={16} />
              Registrar contacto de prueba
            </Button>
          </div>
        </>
      )}
      {followup.status === "contacted" && (
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              (s) => replyFollowup(s, followup.id, response, outcome),
              "Respuesta registrada en el seguimiento.",
            );
          }}
        >
          <Badge tone="confirmed">Contacto de prueba registrado</Badge>
          <label>
            Respuesta del propietario
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              maxLength={4000}
              placeholder="Anota aquí su respuesta de ejemplo…"
              required
            />
          </label>
          <fieldset className="choice-field">
            <legend>
              {vaccine ? "Siguiente paso comunicado" : "Evolución comunicada"}
            </legend>
            <label>
              <input
                type="radio"
                name="outcome"
                checked={outcome === "well"}
                onChange={() => setOutcome("well")}
              />
              {vaccine
                ? "Sin revisión solicitada por ahora"
                : "Evoluciona bien"}
            </label>
            <label>
              <input
                type="radio"
                name="outcome"
                checked={outcome === "review"}
                onChange={() => setOutcome("review")}
              />
              {vaccine ? "Organizar revisión" : "Necesita revisión"}
            </label>
          </fieldset>
          <div className="form-actions">
            <Button type="submit">
              <Check size={16} />
              Guardar respuesta
            </Button>
          </div>
        </form>
      )}
      {(followup.status === "replied" || followup.status === "closed") && (
        <>
          {followup.response && (
            <div
              className={`response-box ${followup.outcome === "review" ? "attention" : ""}`}
            >
              <Badge
                tone={followup.outcome === "review" ? "warning" : "completed"}
              >
                {followup.outcome === "review"
                  ? vaccine
                    ? "Organizar revisión"
                    : "Necesita revisión"
                  : vaccine
                    ? "Respuesta registrada"
                    : "Evoluciona bien"}
              </Badge>
              <p>“{followup.response}”</p>
              <span>{patient.owner}</span>
            </div>
          )}
          {followup.status === "replied" && (
            <>
              {nextVisitDate && (
                <p className="muted">
                  Revisión propuesta:{" "}
                  <strong>{formatDate(nextVisitDate, true)}</strong>
                </p>
              )}
              <Button onClick={onBook}>
                <CalendarPlus size={17} />
                Reservar revisión
                <ArrowRight size={17} />
              </Button>
              {!confirmClose ? (
                <button
                  className="quiet-button"
                  onClick={() => setConfirmClose(true)}
                >
                  Cerrar seguimiento sin nueva reserva
                </button>
              ) : (
                <div className="note-box">
                  <p>El seguimiento se cerrará sin programar otra visita.</p>
                  <Button
                    variant="secondary"
                    onClick={() => setConfirmClose(false)}
                  >
                    Volver
                  </Button>{" "}
                  <Button
                    onClick={() =>
                      run(
                        (s) => closeFollowup(s, followup.id),
                        "Seguimiento cerrado sin nueva reserva.",
                      )
                    }
                  >
                    Confirmar cierre
                  </Button>
                </div>
              )}
            </>
          )}
          {followup.status === "closed" &&
            followup.closeReason !== "dose-recorded" && (
              <div className="info-box">
                <CheckCheck size={20} />
                <div>
                  <strong>
                    {followup.newAppointmentId
                      ? "El cuidado continúa"
                      : "Seguimiento cerrado"}
                  </strong>
                  <p>
                    {followup.newAppointmentId
                      ? "La nueva visita ya está en la agenda y vinculada a este seguimiento."
                      : "La respuesta queda guardada en el historial."}
                  </p>
                  {followup.newAppointmentId && (
                    <button
                      className="inline-button"
                      onClick={() => onVisit(followup.newAppointmentId!)}
                    >
                      Ver nueva reserva <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}
        </>
      )}
      <ErrorMessage message={error} />
    </div>
  );
}
