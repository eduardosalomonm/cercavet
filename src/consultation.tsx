import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Download,
  FileText,
  MessageCircle,
  Save,
  Stethoscope,
} from "lucide-react";
import {
  blankNotes,
  cancelAppointment,
  checkInAppointment,
  finishConsultation,
  formatDate,
  clinicToday,
  markNoShow,
  professionalOf,
  saveDraft,
  startConsultation,
  statusLabels,
} from "./domain.ts";
import type { ClinicState, VisitNotes } from "./domain.ts";
import { download, type Commit } from "./store.ts";
import { Badge, Button, ErrorMessage, PetIcon } from "./ui.tsx";

export function Visit({
  data,
  appointmentId,
  commit,
  onBack,
  onFollowup,
}: {
  data: ClinicState;
  appointmentId: string;
  commit: Commit;
  onBack: () => void;
  onFollowup: (id: string) => void;
}) {
  const appointment = data.appointments.find((a) => a.id === appointmentId)!;
  const patient = data.patients.find((p) => p.id === appointment.patientId)!;
  const consultation = data.consultations.find(
    (c) => c.appointmentId === appointmentId,
  );
  const followup = data.followups.find(
    (f) =>
      f.source === "consultation" &&
      !!consultation &&
      f.consultationId === consultation.id,
  );
  const previousFollowup = data.followups.find(
    (f) => f.id === appointment.previousFollowupId,
  );
  const [notes, setNotes] = useState<VisitNotes>(
    data.drafts[appointmentId] || consultation || blankNotes(clinicToday(data)),
  );
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const change = (key: keyof VisitNotes, value: string) => {
    const next = { ...notes, [key]: value };
    setNotes(next);
    const error = commit((s) => saveDraft(s, appointmentId, next));
    setError(error);
    setDirty(!!error);
  };
  const run = (fn: (s: ClinicState) => ClinicState, message: string) => {
    const error = commit(fn, message);
    setError(error);
    if (!error) setDirty(false);
    return error;
  };
  const step = followup?.newAppointmentId
    ? 4
    : consultation
      ? 3
      : appointment.status === "consulting"
        ? 2
        : 1;
  const leave = () => {
    if (
      dirty &&
      appointment.status === "consulting" &&
      run((s) => saveDraft(s, appointmentId, notes), "Borrador guardado.")
    )
      return;
    onBack();
  };
  function exportVisit() {
    if (!consultation) return;
    download(
      `consulta-${patient.name.toLowerCase()}-${appointment.date.slice(0, 10)}.txt`,
      `${data.brand.name}\n${data.brand.tagline}\n\nRESUMEN DE LA VISITA\nPaciente: ${patient.name}\nPropietario: ${patient.owner}\nFecha: ${formatDate(appointment.date, true)}\nProfesional: ${professionalOf(data, appointment)}\n\nVALORACIÓN\n${consultation.summary}\n\nINDICACIONES\n${consultation.plan}\n\nSeguimiento: ${formatDate(consultation.followupDate, true)}\n${consultation.nextVisitDate ? `Revisión propuesta: ${formatDate(consultation.nextVisitDate, true)}\n` : ""}\n${data.brand.email} · ${data.brand.phone}\n\nDocumento de demostración.`,
      "text/plain;charset=utf-8",
    );
  }
  return (
    <>
      <button className="back-link" onClick={leave}>
        <ArrowLeft size={17} />
        Volver a la agenda
      </button>
      <div className="visit-heading">
        <div className="patient-summary">
          <PetIcon patient={patient} large />
          <div>
            <div className="eyebrow">
              {patient.species.toUpperCase()} · {patient.breed}
            </div>
            <h1>La visita de {patient.name}</h1>
            <p>
              {patient.owner} · {formatDate(appointment.date, true)} ·{" "}
              {appointment.date.slice(11)} · {professionalOf(data, appointment)}
            </p>
          </div>
        </div>
        <Badge tone={appointment.status}>
          {statusLabels[appointment.status]}
        </Badge>
      </div>
      <ol className="flow-steps">
        {["Cita", "Consulta", "Seguimiento", "Nueva reserva"].map(
          (label, i) => (
            <li
              key={label}
              className={
                step > i + 1 ? "done" : step === i + 1 ? "current" : ""
              }
            >
              <span>{step > i + 1 ? <Check size={16} /> : `0${i + 1}`}</span>
              {label}
              {i < 3 && <ArrowRight size={15} />}
            </li>
          ),
        )}
      </ol>
      <div className="visit-grid">
        <section className="panel visit-main">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">
                {appointment.status === "completed"
                  ? "VISITA REGISTRADA"
                  : "ESPACIO CLÍNICO"}
              </span>
              <h2>
                {appointment.urgent && (
                  <span className="urgent-tag">Urgencia</span>
                )}
                {appointment.reason}
              </h2>
            </div>
            <Stethoscope size={22} />
          </div>
          {(appointment.status === "confirmed" ||
            appointment.status === "waiting") && (
            <div className="visit-start">
              <span className="visit-start-icon">
                <Stethoscope size={34} strokeWidth={1.4} />
              </span>
              <h2>
                {appointment.status === "waiting"
                  ? `${patient.name} está en la sala de espera.`
                  : `Todo listo para recibir a ${patient.name}.`}
              </h2>
              <p>
                Abre la consulta para anotar la valoración, las indicaciones y
                el próximo contacto.
              </p>
              {appointment.status === "confirmed" &&
                appointment.date.slice(0, 10) === clinicToday(data) && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      run(
                        (s) => checkInAppointment(s, appointmentId),
                        "Llegada registrada.",
                      )
                    }
                  >
                    <Check size={18} />
                    Registrar llegada
                  </Button>
                )}
              <Button
                onClick={() =>
                  run(
                    (s) => startConsultation(s, appointmentId),
                    "Consulta iniciada.",
                  )
                }
              >
                <Stethoscope size={18} />
                Iniciar consulta
              </Button>
              {appointment.date.slice(0, 10) <= clinicToday(data) && (
                <button
                  className="quiet-button"
                  onClick={() =>
                    run(
                      (s) => markNoShow(s, appointmentId),
                      "Ausencia registrada. El hueco queda libre.",
                    )
                  }
                >
                  Marcar como no acudió
                </button>
              )}
              {!cancelConfirm ? (
                <button
                  className="quiet-button"
                  onClick={() => setCancelConfirm(true)}
                >
                  Cancelar esta cita
                </button>
              ) : (
                <div className="note-box">
                  <p>La cita se conservará en el historial como cancelada.</p>
                  <Button
                    variant="secondary"
                    onClick={() => setCancelConfirm(false)}
                  >
                    Mantener cita
                  </Button>{" "}
                  <Button
                    variant="danger"
                    onClick={() =>
                      run(
                        (s) => cancelAppointment(s, appointmentId),
                        "Cita cancelada.",
                      )
                    }
                  >
                    Confirmar cancelación
                  </Button>
                </div>
              )}
            </div>
          )}
          {appointment.status === "no-show" && (
            <div className="visit-start">
              <CalendarDays size={32} />
              <h2>{patient.name} no acudió a esta cita.</h2>
              <p>
                Se conserva en el historial y el hueco queda libre. Puedes
                proponer otra visita desde la agenda.
              </p>
            </div>
          )}
          {appointment.status === "cancelled" && (
            <div className="visit-start">
              <CalendarDays size={32} />
              <h2>Esta cita está cancelada.</h2>
              <p>
                Se conserva en el historial. Puedes preparar otra visita desde
                la agenda.
              </p>
            </div>
          )}
          {appointment.status === "consulting" && (
            <form
              className="visit-form"
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  (s) => finishConsultation(s, appointmentId, notes),
                  "Consulta finalizada. El seguimiento ya está preparado.",
                );
              }}
            >
              <div className="form-section-title">
                <span>01</span>
                <h3>Lo que hemos observado</h3>
              </div>
              <label>
                Valoración de la consulta
                <textarea
                  value={notes.summary}
                  onChange={(e) => change("summary", e.target.value)}
                  rows={3}
                  maxLength={4000}
                  required
                  placeholder="Motivo de la visita y valoración del profesional…"
                />
              </label>
              <div className="form-grid observations">
                <label>
                  Exploración y observaciones
                  <textarea
                    value={notes.findings}
                    onChange={(e) => change("findings", e.target.value)}
                    rows={3}
                    maxLength={4000}
                    placeholder="Hallazgos relevantes…"
                  />
                </label>
                <label>
                  Peso (kg)
                  <input
                    type="number"
                    min="0.01"
                    max="2000"
                    step="0.01"
                    value={notes.weight}
                    onChange={(e) => change("weight", e.target.value)}
                    placeholder="0,0"
                  />
                </label>
              </div>
              <div className="form-section-title">
                <span>02</span>
                <h3>El cuidado en casa</h3>
              </div>
              <label>
                Indicaciones para el propietario
                <textarea
                  value={notes.plan}
                  onChange={(e) => change("plan", e.target.value)}
                  rows={4}
                  maxLength={4000}
                  required
                  placeholder="Instrucciones concretas que recibirá la familia…"
                />
              </label>
              <div className="form-section-title">
                <span>03</span>
                <h3>El siguiente paso</h3>
              </div>
              <div className="form-grid">
                <label>
                  Fecha de seguimiento
                  <input
                    type="date"
                    min={clinicToday(data)}
                    value={notes.followupDate}
                    onChange={(e) => change("followupDate", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Revisión propuesta <small>(opcional)</small>
                  <input
                    type="date"
                    min={notes.followupDate || clinicToday(data)}
                    value={notes.nextVisitDate}
                    onChange={(e) => change("nextVisitDate", e.target.value)}
                  />
                </label>
              </div>
              <div className="form-actions">
                <span className="save-hint">
                  {dirty
                    ? "Cambios pendientes de guardar"
                    : data.drafts[appointmentId]
                      ? "Borrador guardado"
                      : ""}
                </span>
                <Button
                  variant="secondary"
                  onClick={() =>
                    run(
                      (s) => saveDraft(s, appointmentId, notes),
                      "Borrador guardado.",
                    )
                  }
                >
                  <Save size={16} />
                  Guardar borrador
                </Button>
                <Button type="submit">
                  Finalizar consulta
                  <ArrowRight size={17} />
                </Button>
              </div>
            </form>
          )}
          {consultation && (
            <div className="visit-summary">
              <div className="success-line">
                <Check size={18} />
                <span>
                  Consulta finalizada. El seguimiento queda vinculado a esta
                  visita.
                </span>
              </div>
              <section>
                <span className="eyebrow">VALORACIÓN</span>
                <p>{consultation.summary}</p>
              </section>
              {consultation.findings && (
                <section>
                  <span className="eyebrow">EXPLORACIÓN</span>
                  <p>{consultation.findings}</p>
                </section>
              )}
              <section>
                <span className="eyebrow">INDICACIONES PARA CASA</span>
                <p>{consultation.plan}</p>
              </section>
              <div className="detail-grid">
                <div>
                  <span>Seguimiento</span>
                  <strong>{formatDate(consultation.followupDate)}</strong>
                </div>
                <div>
                  <span>Revisión propuesta</span>
                  <strong>
                    {consultation.nextVisitDate
                      ? formatDate(consultation.nextVisitDate)
                      : "Sin fecha"}
                  </strong>
                </div>
              </div>
              <div className="form-actions">
                <Button variant="secondary" onClick={exportVisit}>
                  <Download size={16} />
                  Descargar resumen
                </Button>
                {followup && (
                  <Button onClick={() => onFollowup(followup.id)}>
                    Ver seguimiento
                    <ArrowRight size={17} />
                  </Button>
                )}
              </div>
            </div>
          )}
          <ErrorMessage message={error} />
        </section>
        <aside className="visit-aside">
          <section className="panel compact-panel">
            <div className="eyebrow">ANTES DE EMPEZAR</div>
            <h3>Conocemos a {patient.name}</h3>
            <dl>
              <div>
                <dt>Edad</dt>
                <dd>{patient.age || "Sin registrar"}</dd>
              </div>
              <div>
                <dt>Propietario</dt>
                <dd>{patient.owner}</dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>{patient.phone || "Sin registrar"}</dd>
              </div>
            </dl>
            <div className="allergy-note">
              <FileText size={16} />
              <p>{patient.allergies || "Sin avisos registrados"}</p>
            </div>
          </section>
          {previousFollowup && (
            <section className="panel compact-panel">
              <span className="eyebrow">CONTINUIDAD</span>
              <h3>Volvemos a vernos</h3>
              <p className="muted">
                Esta cita nace de un seguimiento anterior.
              </p>
              <p className="quote">“{previousFollowup.response}”</p>
              <button
                className="inline-button"
                onClick={() => onFollowup(previousFollowup.id)}
              >
                Ver seguimiento anterior <ArrowRight size={14} />
              </button>
            </section>
          )}
          <div className="care-tip">
            <MessageCircle size={23} strokeWidth={1.5} />
            <h3>Un contacto a tiempo.</h3>
            <p>
              Al finalizar, tendrás un mensaje preparado con tus indicaciones
              para continuar el cuidado.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
