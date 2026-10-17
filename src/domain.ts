import {
  clinicToday,
  localDate,
  offsetDate,
  validDay,
  validTimeZone,
} from "./dates.ts";
import { validateVaccinationState } from "./vaccination-domain.ts";
export {
  clinicToday,
  localDate,
  offsetDate,
  formatDate,
  validDay,
} from "./dates.ts";

export type Theme = "olive" | "ocean" | "clay";
export interface Brand {
  name: string;
  tagline: string;
  veterinarian: string;
  email: string;
  phone: string;
  theme: Theme;
  logo: string;
}
export interface Patient {
  id: string;
  name: string;
  species: "Perro" | "Gato" | "Otro";
  breed: string;
  age: string;
  owner: string;
  phone: string;
  email: string;
  allergies: string;
}
export type AppointmentStatus =
  "confirmed" | "consulting" | "completed" | "cancelled";
export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  duration: number;
  reason: string;
  status: AppointmentStatus;
  previousFollowupId?: string;
}
export interface VisitNotes {
  summary: string;
  findings: string;
  plan: string;
  weight: string;
  followupDate: string;
  nextVisitDate: string;
}
export interface Consultation extends VisitNotes {
  id: string;
  appointmentId: string;
  completedAt: string;
}
interface FollowupBase {
  id: string;
  patientId: string;
  dueDate: string;
  status: "pending" | "contacted" | "replied" | "closed";
  message: string;
  response: string;
  outcome: "well" | "review" | "";
  contactedAt?: string;
  repliedAt?: string;
  closedAt?: string;
  newAppointmentId?: string;
  closeReason?: "dose-recorded";
}
export type Followup = FollowupBase &
  (
    | { source: "consultation"; consultationId: string; vaccinationId?: never }
    | { source: "vaccination"; vaccinationId: string; consultationId?: never }
  );
export interface Vaccination {
  id: string;
  patientId: string;
  name: string;
  lot: string;
  administeredOn: string;
  nextDueOn: string;
  consultationId?: string;
  previousDoseId?: string;
  createdAt: string;
  corrections: {
    at: string;
    reason: string;
    administeredOn: string;
    nextDueOn: string;
  }[];
}
export interface ClinicState {
  version: 2;
  timeZone: string;
  brand: Brand;
  patients: Patient[];
  appointments: Appointment[];
  consultations: Consultation[];
  followups: Followup[];
  vaccinations: Vaccination[];
  drafts: Record<string, VisitNotes>;
}

export const STORAGE_KEY = "clinic.workspace.v1";
export const themes = {
  olive: {
    label: "Bosque",
    primary: "#234b42",
    soft: "#edf2e9",
    accent: "#d6e6b7",
  },
  ocean: {
    label: "Océano",
    primary: "#235568",
    soft: "#e7f0f3",
    accent: "#b2d4de",
  },
  clay: {
    label: "Terracota",
    primary: "#794b3e",
    soft: "#f3eae4",
    accent: "#e4bda1",
  },
};
export const statusLabels: Record<AppointmentStatus, string> = {
  confirmed: "Confirmada",
  consulting: "En consulta",
  completed: "Finalizada",
  cancelled: "Cancelada",
};
const id = () => crypto.randomUUID();
function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
export function blankNotes(today = localDate()): VisitNotes {
  return {
    summary: "",
    findings: "",
    plan: "",
    weight: "",
    followupDate: offsetDate(2, today),
    nextVisitDate: offsetDate(14, today),
  };
}

export function bookAppointment(
  state: ClinicState,
  input: Omit<Appointment, "id" | "status">,
): ClinicState {
  requireValue(
    state.patients.some((p) => p.id === input.patientId),
    "Selecciona un paciente de la clínica.",
  );
  requireValue(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input.date) &&
      validDay(input.date.slice(0, 10)) &&
      Number.isFinite(Date.parse(input.date)),
    "Indica una fecha y una hora válidas.",
  );
  requireValue(
    input.date.slice(0, 10) >= clinicToday(state),
    "La reserva debe ser para hoy o para una fecha posterior.",
  );
  requireValue(input.reason.trim(), "Indica el motivo de la cita.");
  requireValue(
    [15, 30, 45, 60].includes(input.duration),
    "Selecciona una duración válida.",
  );
  const start = new Date(input.date).getTime();
  const end = start + input.duration * 60_000;
  const minutes =
    Number(input.date.slice(11, 13)) * 60 + Number(input.date.slice(14));
  requireValue(
    minutes >= 9 * 60 && minutes + input.duration <= 20 * 60,
    "El horario de consulta es de 09:00 a 20:00.",
  );
  requireValue(
    !state.appointments.some(
      (a) =>
        a.status !== "cancelled" &&
        start < new Date(a.date).getTime() + a.duration * 60_000 &&
        end > new Date(a.date).getTime(),
    ),
    "Ese horario ya está ocupado. Elige otra hora.",
  );
  const followup = input.previousFollowupId
    ? state.followups.find((f) => f.id === input.previousFollowupId)
    : undefined;
  if (input.previousFollowupId) {
    requireValue(
      followup && followup.patientId === input.patientId,
      "El seguimiento no corresponde a este paciente.",
    );
    requireValue(
      !followup.newAppointmentId,
      "Este seguimiento ya tiene una nueva reserva.",
    );
    requireValue(
      followup.status === "replied",
      "Registra primero la respuesta del propietario.",
    );
  }
  const appointment: Appointment = {
    ...input,
    reason: input.reason.trim(),
    id: id(),
    status: "confirmed",
  };
  return {
    ...state,
    appointments: [...state.appointments, appointment],
    followups: state.followups.map((f) =>
      f.id === followup?.id
        ? {
            ...f,
            status: "closed",
            newAppointmentId: appointment.id,
            closedAt: new Date().toISOString(),
          }
        : f,
    ),
  };
}
export function startConsultation(
  state: ClinicState,
  appointmentId: string,
): ClinicState {
  const appointment = state.appointments.find((a) => a.id === appointmentId);
  requireValue(
    appointment?.status === "confirmed",
    "Esta cita no está disponible para iniciar una consulta.",
  );
  return {
    ...state,
    appointments: state.appointments.map((a) =>
      a.id === appointmentId ? { ...a, status: "consulting" } : a,
    ),
  };
}
export function saveDraft(
  state: ClinicState,
  appointmentId: string,
  notes: VisitNotes,
): ClinicState {
  requireValue(
    state.appointments.some(
      (a) => a.id === appointmentId && a.status === "consulting",
    ),
    "Inicia la consulta antes de guardar notas.",
  );
  return { ...state, drafts: { ...state.drafts, [appointmentId]: notes } };
}
export function finishConsultation(
  state: ClinicState,
  appointmentId: string,
  notes: VisitNotes,
): ClinicState {
  const appointment = state.appointments.find((a) => a.id === appointmentId);
  requireValue(
    appointment?.status === "consulting",
    "La consulta debe estar abierta para finalizarla.",
  );
  requireValue(
    !state.consultations.some((c) => c.appointmentId === appointmentId),
    "Esta consulta ya está finalizada.",
  );
  requireValue(
    notes.summary.trim() && notes.plan.trim(),
    "Completa la valoración y las instrucciones para el propietario.",
  );
  requireValue(
    validDay(notes.followupDate) && notes.followupDate >= clinicToday(state),
    "El seguimiento debe ser para hoy o una fecha posterior.",
  );
  requireValue(
    !notes.nextVisitDate ||
      (validDay(notes.nextVisitDate) &&
        notes.nextVisitDate >= notes.followupDate),
    "La revisión debe ser posterior o igual al seguimiento.",
  );
  requireValue(
    !notes.weight ||
      (Number(notes.weight) > 0 && Number.isFinite(Number(notes.weight))),
    "El peso debe ser un número mayor que cero.",
  );
  const consultation: Consultation = {
    ...notes,
    summary: notes.summary.trim(),
    plan: notes.plan.trim(),
    id: id(),
    appointmentId,
    completedAt: new Date().toISOString(),
  };
  const patient = state.patients.find((p) => p.id === appointment.patientId)!;
  const followup: Followup = {
    id: id(),
    source: "consultation",
    consultationId: consultation.id,
    patientId: patient.id,
    dueDate: notes.followupDate,
    status: "pending",
    response: "",
    outcome: "",
    message: `Hola, ${patient.owner.split(" ")[0]}. Somos ${state.brand.name}. ¿Cómo se encuentra ${patient.name} después de la consulta?\n\nEstas son las indicaciones que acordamos:\n${notes.plan.trim()}\n\nCuéntanos cómo evoluciona para preparar el siguiente paso.`,
  };
  const drafts = { ...state.drafts };
  delete drafts[appointmentId];
  return {
    ...state,
    drafts,
    appointments: state.appointments.map((a) =>
      a.id === appointmentId ? { ...a, status: "completed" } : a,
    ),
    consultations: [...state.consultations, consultation],
    followups: [...state.followups, followup],
  };
}
export function contactFollowup(
  state: ClinicState,
  followupId: string,
  message: string,
): ClinicState {
  const followup = state.followups.find((f) => f.id === followupId);
  requireValue(
    followup?.status === "pending",
    "Este contacto ya está registrado.",
  );
  requireValue(message.trim(), "Escribe el mensaje de seguimiento.");
  return {
    ...state,
    followups: state.followups.map((f) =>
      f.id === followupId
        ? {
            ...f,
            message: message.trim(),
            status: "contacted",
            contactedAt: new Date().toISOString(),
          }
        : f,
    ),
  };
}
export function replyFollowup(
  state: ClinicState,
  followupId: string,
  response: string,
  outcome: "well" | "review",
): ClinicState {
  const followup = state.followups.find((f) => f.id === followupId);
  requireValue(
    followup?.status === "contacted",
    "Registra el contacto antes de anotar la respuesta.",
  );
  requireValue(response.trim(), "Anota la respuesta del propietario.");
  requireValue(
    outcome === "well" || outcome === "review",
    "Indica la evolución.",
  );
  return {
    ...state,
    followups: state.followups.map((f) =>
      f.id === followupId
        ? {
            ...f,
            status: "replied",
            response: response.trim(),
            outcome,
            repliedAt: new Date().toISOString(),
          }
        : f,
    ),
  };
}
export function closeFollowup(
  state: ClinicState,
  followupId: string,
): ClinicState {
  const followup = state.followups.find((f) => f.id === followupId);
  requireValue(
    followup?.status === "replied",
    "Registra una respuesta antes de cerrar el seguimiento.",
  );
  return {
    ...state,
    followups: state.followups.map((f) =>
      f.id === followupId
        ? { ...f, status: "closed", closedAt: new Date().toISOString() }
        : f,
    ),
  };
}
export function cancelAppointment(
  state: ClinicState,
  appointmentId: string,
): ClinicState {
  const appointment = state.appointments.find((a) => a.id === appointmentId);
  requireValue(
    appointment?.status === "confirmed",
    "Solo se pueden cancelar citas que aún no han comenzado.",
  );
  return {
    ...state,
    appointments: state.appointments.map((a) =>
      a.id === appointmentId ? { ...a, status: "cancelled" } : a,
    ),
    followups: state.followups.map((f) =>
      f.newAppointmentId === appointmentId && f.closeReason !== "dose-recorded"
        ? {
            ...f,
            status: "replied",
            newAppointmentId: undefined,
            closedAt: undefined,
          }
        : f,
    ),
  };
}
export function addPatient(
  state: ClinicState,
  input: Omit<Patient, "id">,
): ClinicState {
  requireValue(
    input.name.trim() && input.owner.trim(),
    "Indica el nombre del paciente y su propietario.",
  );
  requireValue(
    ["Perro", "Gato", "Otro"].includes(input.species),
    "Selecciona una especie válida.",
  );
  return {
    ...state,
    patients: [
      ...state.patients,
      {
        ...input,
        name: input.name.trim(),
        owner: input.owner.trim(),
        id: id(),
      },
    ],
  };
}
export function saveBrand(state: ClinicState, brand: Brand): ClinicState {
  requireValue(
    brand.name.trim() && brand.veterinarian.trim(),
    "Indica el nombre de la clínica y del profesional.",
  );
  requireValue(
    Object.hasOwn(themes, brand.theme),
    "Selecciona un color disponible.",
  );
  requireValue(
    !brand.logo || /^data:image\/(png|jpeg|webp);base64,/.test(brand.logo),
    "Usa una imagen PNG, JPG o WebP para el logo.",
  );
  requireValue(brand.logo.length < 450_000, "El logo es demasiado grande.");
  const name = brand.name.trim();
  return {
    ...state,
    brand: { ...brand, name, veterinarian: brand.veterinarian.trim() },
    followups: state.followups.map((f) =>
      f.status === "pending" && state.brand.name
        ? { ...f, message: f.message.replaceAll(state.brand.name, name) }
        : f,
    ),
  };
}

// Validate stored local state before rendering. Never overwrite unreadable data automatically.
export function parseState(raw: string): ClinicState {
  const x = JSON.parse(raw);
  const obj = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === "object" && !Array.isArray(v);
  const strings = (v: unknown, keys: string[]) =>
    obj(v) && keys.every((k) => typeof v[k] === "string");
  requireValue(
    obj(x) && (x.version === 1 || x.version === 2),
    "El formato de los datos guardados no es compatible.",
  );
  if (x.version === 1) {
    // Existing clinic records stay intact; example vaccines are never injected into them.
    x.version = 2;
    x.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    x.vaccinations = [];
    if (Array.isArray(x.followups)) {
      x.followups = x.followups.map((f) => ({ ...f, source: "consultation" }));
    }
  }
  requireValue(
    validTimeZone(x.timeZone),
    "La zona horaria guardada no es válida.",
  );
  requireValue(
    strings(x.brand, [
      "name",
      "tagline",
      "veterinarian",
      "email",
      "phone",
      "theme",
      "logo",
    ]) &&
      obj(x.brand) &&
      typeof x.brand.theme === "string" &&
      Object.hasOwn(themes, x.brand.theme),
    "La configuración guardada no es válida.",
  );
  requireValue(
    Array.isArray(x.patients) &&
      x.patients.every((p) =>
        strings(p, [
          "id",
          "name",
          "species",
          "breed",
          "age",
          "owner",
          "phone",
          "email",
          "allergies",
        ]),
      ),
    "No se pueden leer los pacientes guardados.",
  );
  requireValue(
    Array.isArray(x.appointments) &&
      x.appointments.every(
        (a) =>
          strings(a, ["id", "patientId", "date", "reason", "status"]) &&
          typeof a.duration === "number" &&
          Number.isFinite(Date.parse(a.date)) &&
          Object.hasOwn(statusLabels, a.status),
      ),
    "No se pueden leer las citas guardadas.",
  );
  const noteKeys = [
    "summary",
    "findings",
    "plan",
    "weight",
    "followupDate",
    "nextVisitDate",
  ];
  requireValue(
    Array.isArray(x.consultations) &&
      x.consultations.every(
        (c) =>
          strings(c, ["id", "appointmentId", "completedAt", ...noteKeys]) &&
          validDay(c.followupDate) &&
          (!c.nextVisitDate || validDay(c.nextVisitDate)),
      ),
    "No se pueden leer las consultas guardadas.",
  );
  requireValue(
    Array.isArray(x.followups) &&
      x.followups.every(
        (f) =>
          strings(f, [
            "id",
            "patientId",
            "dueDate",
            "status",
            "message",
            "response",
            "outcome",
          ]) &&
          ((f.source === "consultation" &&
            typeof f.consultationId === "string" &&
            f.vaccinationId === undefined) ||
            (f.source === "vaccination" &&
              typeof f.vaccinationId === "string" &&
              f.consultationId === undefined)) &&
          validDay(f.dueDate) &&
          ["pending", "contacted", "replied", "closed"].includes(f.status),
      ),
    "No se pueden leer los seguimientos guardados.",
  );
  requireValue(
    obj(x.drafts) && Object.values(x.drafts).every((d) => strings(d, noteKeys)),
    "No se pueden leer los borradores guardados.",
  );
  const state = x as unknown as ClinicState;
  requireValue(
    state.appointments.every((a) =>
      state.patients.some((p) => p.id === a.patientId),
    ) &&
      state.consultations.every((c) =>
        state.appointments.some((a) => a.id === c.appointmentId),
      ) &&
      state.followups.every(
        (f) =>
          state.patients.some((p) => p.id === f.patientId) &&
          (f.source === "vaccination" ||
            state.consultations.some(
              (c) =>
                c.id === f.consultationId &&
                state.appointments.some(
                  (a) =>
                    a.id === c.appointmentId && a.patientId === f.patientId,
                ),
            )),
      ),
    "Hay registros incompletos en los datos guardados.",
  );
  validateVaccinationState(state);
  return state;
}
