import type { ClinicState, Followup, Vaccination } from "./domain.ts";
import { clinicToday, formatDate, offsetDate, validDay } from "./dates.ts";

export type VaccinationInput = Omit<Vaccination, "createdAt" | "corrections">;
export const vaccineStatusLabels = {
  overdue: "Vencida",
  today: "Vence hoy",
  upcoming: "Próximos 30 días",
  scheduled: "Programada",
  completed: "Dosis siguiente registrada",
};
export type VaccineStatus = keyof typeof vaccineStatusLabels;

function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function vaccinationStatus(
  state: ClinicState,
  vaccine: Vaccination,
  today = clinicToday(state),
): VaccineStatus {
  if (state.vaccinations.some((v) => v.previousDoseId === vaccine.id))
    return "completed";
  if (vaccine.nextDueOn < today) return "overdue";
  if (vaccine.nextDueOn === today) return "today";
  if (vaccine.nextDueOn <= offsetDate(30, today)) return "upcoming";
  return "scheduled";
}

export function vaccinationFollowup(state: ClinicState, id: string) {
  return state.followups.find(
    (f) => f.source === "vaccination" && f.vaccinationId === id,
  );
}

function vaccineMessage(state: ClinicState, vaccine: Vaccination) {
  const patient = state.patients.find((p) => p.id === vaccine.patientId)!;
  return `Hola, ${patient.owner.split(" ")[0]}. Somos ${state.brand.name}. Tenemos anotada la próxima dosis de ${vaccine.name} para ${patient.name} el ${formatDate(vaccine.nextDueOn)}. ¿Podemos organizar una revisión para confirmar el siguiente paso con el veterinario?`;
}

export function ensureVaccinationFollowup(
  state: ClinicState,
  vaccinationId: string,
): ClinicState {
  const vaccine = state.vaccinations.find((v) => v.id === vaccinationId);
  requireValue(vaccine, "No se encuentra el registro de vacunación.");
  if (vaccinationFollowup(state, vaccinationId)) return state;
  const followup: Followup = {
    id: `vaccination:${vaccinationId}`,
    source: "vaccination",
    vaccinationId,
    patientId: vaccine.patientId,
    dueDate: vaccine.nextDueOn,
    status: "pending",
    message: vaccineMessage(state, vaccine),
    response: "",
    outcome: "",
  };
  requireValue(
    !state.followups.some((f) => f.id === followup.id),
    "El identificador de seguimiento ya existe.",
  );
  return { ...state, followups: [...state.followups, followup] };
}

function checkDates(
  input: Pick<Vaccination, "administeredOn" | "nextDueOn">,
  today: string,
) {
  requireValue(
    validDay(input.administeredOn) && input.administeredOn <= today,
    "La aplicación debe tener una fecha válida, de hoy o anterior.",
  );
  requireValue(
    validDay(input.nextDueOn) && input.nextDueOn > input.administeredOn,
    "La próxima dosis debe tener una fecha posterior a la aplicación.",
  );
}

const normalize = (value: string) => value.trim().toLocaleLowerCase("es");
function duplicateDose(
  state: ClinicState,
  input: VaccinationInput,
  exceptId?: string,
) {
  return state.vaccinations.some(
    (v) =>
      v.id !== exceptId &&
      v.patientId === input.patientId &&
      normalize(v.name) === normalize(input.name) &&
      v.administeredOn === input.administeredOn &&
      normalize(v.lot) === normalize(input.lot),
  );
}

export function registerVaccination(
  state: ClinicState,
  input: VaccinationInput,
): ClinicState {
  requireValue(
    input.id.trim() &&
      input.name.trim() &&
      input.name.trim().length <= 100 &&
      input.lot.trim() &&
      input.lot.trim().length <= 80,
    "Completa el nombre de la vacuna y el lote.",
  );
  requireValue(
    state.patients.some((p) => p.id === input.patientId),
    "Selecciona un paciente de la clínica.",
  );
  checkDates(input, clinicToday(state));
  const existing = state.vaccinations.find((v) => v.id === input.id);
  if (existing) {
    requireValue(
      existing.patientId === input.patientId &&
        existing.name === input.name.trim() &&
        existing.lot === input.lot.trim() &&
        existing.administeredOn === input.administeredOn &&
        existing.nextDueOn === input.nextDueOn &&
        existing.previousDoseId === input.previousDoseId &&
        existing.consultationId === input.consultationId,
      "Este registro ya existe con otros datos.",
    );
    return ensureVaccinationFollowup(state, existing.id);
  }
  requireValue(
    !duplicateDose(state, input),
    "Esta vacuna, lote y fecha ya están registrados para el paciente.",
  );
  if (input.consultationId) {
    requireValue(
      state.consultations.some(
        (c) =>
          c.id === input.consultationId &&
          state.appointments.some(
            (a) => a.id === c.appointmentId && a.patientId === input.patientId,
          ),
      ),
      "La consulta debe corresponder al mismo paciente.",
    );
  }
  if (input.previousDoseId) {
    const previous = state.vaccinations.find(
      (v) => v.id === input.previousDoseId,
    );
    requireValue(
      previous &&
        previous.patientId === input.patientId &&
        normalize(previous.name) === normalize(input.name),
      "La dosis anterior no corresponde a esta vacuna y paciente.",
    );
    requireValue(
      !state.vaccinations.some((v) => v.previousDoseId === previous.id),
      "La dosis siguiente ya está registrada.",
    );
    requireValue(
      input.administeredOn > previous.administeredOn,
      "La nueva aplicación debe ser posterior a la dosis anterior.",
    );
  }
  const vaccine: Vaccination = {
    ...input,
    name: input.name.trim(),
    lot: input.lot.trim(),
    createdAt: new Date().toISOString(),
    corrections: [],
  };
  const next = ensureVaccinationFollowup(
    { ...state, vaccinations: [...state.vaccinations, vaccine] },
    vaccine.id,
  );
  return {
    ...next,
    followups: next.followups.map((f) =>
      f.source === "vaccination" && f.vaccinationId === input.previousDoseId
        ? {
            ...f,
            status: "closed",
            closeReason: "dose-recorded",
            closedAt: f.closedAt || new Date().toISOString(),
          }
        : f,
    ),
  };
}

export function correctVaccinationDates(
  state: ClinicState,
  id: string,
  input: Pick<Vaccination, "administeredOn" | "nextDueOn"> & { reason: string },
): ClinicState {
  const vaccine = state.vaccinations.find((v) => v.id === id);
  requireValue(vaccine, "No se encuentra el registro de vacunación.");
  requireValue(
    !state.vaccinations.some((v) => v.previousDoseId === id),
    "Este registro ya tiene una dosis siguiente; se conserva como histórico.",
  );
  checkDates(input, clinicToday(state));
  if (vaccine.previousDoseId) {
    const previous = state.vaccinations.find(
      (v) => v.id === vaccine.previousDoseId,
    )!;
    requireValue(
      input.administeredOn > previous.administeredOn,
      "La aplicación debe ser posterior a la dosis anterior.",
    );
  }
  if (
    vaccine.administeredOn === input.administeredOn &&
    vaccine.nextDueOn === input.nextDueOn
  )
    return state;
  requireValue(
    input.reason.trim() && input.reason.trim().length <= 300,
    "Indica el motivo de la corrección.",
  );
  const updated: Vaccination = {
    ...vaccine,
    administeredOn: input.administeredOn,
    nextDueOn: input.nextDueOn,
    corrections: [
      ...vaccine.corrections,
      {
        at: new Date().toISOString(),
        reason: input.reason.trim(),
        administeredOn: vaccine.administeredOn,
        nextDueOn: vaccine.nextDueOn,
      },
    ],
  };
  requireValue(
    !duplicateDose(state, updated, id),
    "La corrección duplicaría otra dosis registrada.",
  );
  return {
    ...state,
    vaccinations: state.vaccinations.map((v) => (v.id === id ? updated : v)),
    followups: state.followups.map((f) =>
      f.source === "vaccination" && f.vaccinationId === id
        ? {
            ...f,
            dueDate: updated.nextDueOn,
            message:
              f.status === "pending"
                ? vaccineMessage(state, updated)
                : f.message,
          }
        : f,
    ),
  };
}

export function validateVaccinationState(state: ClinicState): void {
  const validText = (v: unknown): v is string =>
    typeof v === "string" && !!v.trim();
  const validStamp = (v: unknown) =>
    typeof v === "string" && Number.isFinite(Date.parse(v));
  const optionalId = (v: unknown) => v === undefined || validText(v);
  requireValue(
    Array.isArray(state.vaccinations) &&
      state.vaccinations.every(
        (v) =>
          v &&
          validText(v.id) &&
          validText(v.patientId) &&
          validText(v.name) &&
          validText(v.lot) &&
          validDay(v.administeredOn) &&
          validDay(v.nextDueOn) &&
          v.nextDueOn > v.administeredOn &&
          optionalId(v.previousDoseId) &&
          optionalId(v.consultationId) &&
          validStamp(v.createdAt) &&
          Array.isArray(v.corrections) &&
          v.corrections.every(
            (c) =>
              c &&
              validStamp(c.at) &&
              validText(c.reason) &&
              validDay(c.administeredOn) &&
              validDay(c.nextDueOn) &&
              c.nextDueOn > c.administeredOn,
          ),
      ),
    "No se pueden leer las vacunaciones guardadas.",
  );
  for (const records of [
    state.patients,
    state.appointments,
    state.consultations,
    state.followups,
    state.vaccinations,
  ]) {
    requireValue(
      new Set(records.map((r) => r.id)).size === records.length,
      "Hay identificadores duplicados en los datos guardados.",
    );
  }
  const vaccines = new Map(state.vaccinations.map((v) => [v.id, v]));
  const successors = state.vaccinations.flatMap((v) =>
    v.previousDoseId ? [v.previousDoseId] : [],
  );
  const completed = new Set(successors);
  requireValue(
    completed.size === successors.length,
    "Hay dosis siguientes duplicadas.",
  );
  const patientIds = new Set(state.patients.map((p) => p.id));
  const appointments = new Map(state.appointments.map((a) => [a.id, a]));
  const consultations = new Map(state.consultations.map((c) => [c.id, c]));
  const doses = new Set(
    state.vaccinations.map((v) =>
      JSON.stringify([
        v.patientId,
        normalize(v.name),
        v.administeredOn,
        normalize(v.lot),
      ]),
    ),
  );
  requireValue(
    doses.size === state.vaccinations.length &&
      state.vaccinations.every((v) => {
        const previous = v.previousDoseId
          ? vaccines.get(v.previousDoseId)
          : undefined;
        return (
          patientIds.has(v.patientId) &&
          (!v.previousDoseId ||
            (previous &&
              previous.patientId === v.patientId &&
              normalize(previous.name) === normalize(v.name) &&
              previous.administeredOn < v.administeredOn)) &&
          (!v.consultationId ||
            appointments.get(
              consultations.get(v.consultationId)?.appointmentId ?? "",
            )?.patientId === v.patientId)
        );
      }),
    "Hay vínculos incompletos o dosis duplicadas en las vacunaciones.",
  );
  const followups = state.followups.filter((f) => f.source === "vaccination");
  const followed = new Set(followups.map((f) => f.vaccinationId));
  requireValue(
    followed.size === followups.length &&
      followups.every((f) => {
        const v = vaccines.get(f.vaccinationId);
        return (
          v &&
          v.patientId === f.patientId &&
          v.nextDueOn === f.dueDate &&
          (completed.has(f.vaccinationId)
            ? f.status === "closed" && f.closeReason === "dose-recorded"
            : !f.closeReason)
        );
      }) &&
      state.vaccinations.every((v) => followed.has(v.id)),
    "Hay seguimientos de vacunación duplicados o incompletos.",
  );
  requireValue(
    state.followups.every((f) => {
      const a = f.newAppointmentId
        ? appointments.get(f.newAppointmentId)
        : undefined;
      return (
        !f.newAppointmentId ||
        (a?.patientId === f.patientId && a.previousFollowupId === f.id)
      );
    }),
    "La reserva vinculada al seguimiento no es válida.",
  );
}
