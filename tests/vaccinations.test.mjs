import test from "node:test";
import assert from "node:assert/strict";
import { createDemo, addVaccinationExamples } from "../src/seed.ts";
import {
  bookAppointment,
  cancelAppointment,
  contactFollowup,
  replyFollowup,
  parseState,
  saveBrand,
} from "../src/domain.ts";
import { clinicToday, offsetDate, validDay } from "../src/dates.ts";
import {
  correctVaccinationDates,
  ensureVaccinationFollowup,
  registerVaccination,
  vaccinationFollowup,
  vaccinationStatus,
} from "../src/vaccination-domain.ts";

function input(state, overrides = {}) {
  const today = clinicToday(state);
  return {
    id: "test-dose",
    patientId: "p1",
    name: "Vacuna de prueba",
    lot: "TEST-01",
    administeredOn: offsetDate(-7, today),
    nextDueOn: offsetDate(15, today),
    ...overrides,
  };
}
const reload = (state) => parseState(JSON.stringify(state));
function answered(state, vaccineId) {
  const f = vaccinationFollowup(state, vaccineId);
  return replyFollowup(
    contactFollowup(state, f.id, "Mensaje de prueba conservado"),
    f.id,
    "Podemos organizar la revisión",
    "review",
  );
}
function bookReview(state, vaccineId) {
  const f = vaccinationFollowup(state, vaccineId);
  return bookAppointment(state, {
    patientId: f.patientId,
    date: `${offsetDate(5, clinicToday(state))}T16:00`,
    duration: 30,
    reason: "Revisión de vacunación",
    previousFollowupId: f.id,
  });
}

test("a vaccination persists with one source-linked followup across retries and reloads", () => {
  const before = createDemo();
  const value = input(before);
  let state = registerVaccination(before, value);
  const f = vaccinationFollowup(state, value.id);
  assert.equal(f.source, "vaccination");
  assert.equal(f.consultationId, undefined);
  assert.equal(f.patientId, value.patientId);
  assert.equal(f.dueDate, value.nextDueOn);
  assert.equal(state.consultations.length, before.consultations.length);
  state = reload(state);
  for (let i = 0; i < 3; i++)
    state = registerVaccination(
      ensureVaccinationFollowup(state, value.id),
      value,
    );
  assert.equal(
    state.followups.filter((f) => f.vaccinationId === value.id).length,
    1,
  );
  assert.equal(state.vaccinations.filter((v) => v.id === value.id).length, 1);
  assert.throws(
    () => registerVaccination(state, { ...value, id: "different-id" }),
    /ya están registrados/,
  );
  assert.throws(
    () => registerVaccination(state, { ...value, lot: "CHANGED" }),
    /otros datos/,
  );
  assert.deepEqual(reload(state), state);
});

test("vaccination dates and links are validated before creating records", () => {
  const state = createDemo();
  const today = clinicToday(state);
  for (const values of [
    { name: " " },
    { lot: " " },
    { patientId: "missing" },
    { administeredOn: "2026-02-30" },
    { administeredOn: offsetDate(1, today) },
    { nextDueOn: "2027-02-31" },
    { nextDueOn: offsetDate(-7, today) },
    { consultationId: "c1" },
    { previousDoseId: "demo-vaccine-1" },
  ]) {
    assert.throws(() => registerVaccination(state, input(state, values)));
  }
  assert.doesNotThrow(() =>
    registerVaccination(
      state,
      input(state, { patientId: "p3", consultationId: "c1" }),
    ),
  );
  assert.equal(validDay("2028-02-29"), true);
  assert.equal(validDay("2027-02-29"), false);
});

test("due states include today, the 30-day boundary and the clinic's midnight", () => {
  const state = createDemo("America/Caracas");
  const v = state.vaccinations[0];
  assert.equal(
    clinicToday(state, new Date("2026-10-18T02:00:00Z")),
    "2026-10-17",
  );
  assert.equal(
    clinicToday(state, new Date("2026-10-18T04:00:00Z")),
    "2026-10-18",
  );
  for (const [days, expected] of [
    [-1, "overdue"],
    [0, "today"],
    [1, "upcoming"],
    [30, "upcoming"],
    [31, "scheduled"],
  ]) {
    assert.equal(
      vaccinationStatus(
        state,
        { ...v, nextDueOn: offsetDate(days, "2026-10-17") },
        "2026-10-17",
      ),
      expected,
    );
  }
  assert.equal(
    vaccinationStatus(state, { ...v, nextDueOn: "2026-10-17" }, "2026-10-18"),
    "overdue",
  );
});

test("date corrections keep the followup, recorded message, history and booked appointment", () => {
  let state = createDemo();
  state = registerVaccination(state, input(state));
  state = bookReview(answered(state, "test-dose"), "test-dose");
  const f = vaccinationFollowup(state, "test-dose");
  const appointments = structuredClone(state.appointments);
  const vaccine = state.vaccinations.at(-1);
  const dates = {
    administeredOn: vaccine.administeredOn,
    nextDueOn: offsetDate(21, clinicToday(state)),
    reason: "Fecha transcrita corregida",
  };
  state = correctVaccinationDates(state, vaccine.id, dates);
  const after = vaccinationFollowup(state, vaccine.id);
  assert.equal(after.id, f.id);
  assert.equal(after.message, f.message);
  assert.equal(after.dueDate, dates.nextDueOn);
  assert.equal(after.newAppointmentId, f.newAppointmentId);
  assert.deepEqual(state.appointments, appointments);
  assert.equal(
    state.vaccinations.at(-1).corrections[0].nextDueOn,
    vaccine.nextDueOn,
  );
  state = correctVaccinationDates(reload(state), vaccine.id, dates);
  assert.equal(state.vaccinations.at(-1).corrections.length, 1);
  assert.throws(
    () =>
      correctVaccinationDates(state, vaccine.id, {
        ...dates,
        nextDueOn: offsetDate(22, clinicToday(state)),
        reason: " ",
      }),
    /motivo/,
  );
});

test("a pending correction updates its draft without making another followup", () => {
  let state = createDemo();
  const vaccine = state.vaccinations[0];
  const before = vaccinationFollowup(state, vaccine.id);
  state = correctVaccinationDates(state, vaccine.id, {
    administeredOn: vaccine.administeredOn,
    nextDueOn: offsetDate(9, clinicToday(state)),
    reason: "Corrección de agenda",
  });
  assert.equal(vaccinationFollowup(state, vaccine.id).id, before.id);
  assert.notEqual(
    vaccinationFollowup(state, vaccine.id).message,
    before.message,
  );
  assert.equal(state.followups.length, createDemo().followups.length);
  assert.deepEqual(reload(state), state);
});

test("next dose closes the previous followup once and preserves the prior vaccination", () => {
  const before = createDemo();
  const previous = before.vaccinations[0];
  const value = input(before, {
    id: "next-dose",
    patientId: previous.patientId,
    name: previous.name,
    previousDoseId: previous.id,
    administeredOn: clinicToday(before),
  });
  let state = registerVaccination(before, value);
  assert.deepEqual(state.vaccinations[0], previous);
  assert.equal(vaccinationStatus(state, previous), "completed");
  assert.equal(vaccinationFollowup(state, previous.id).status, "closed");
  assert.equal(
    vaccinationFollowup(state, previous.id).closeReason,
    "dose-recorded",
  );
  assert.equal(vaccinationFollowup(state, value.id).status, "pending");
  state = registerVaccination(
    ensureVaccinationFollowup(reload(state), previous.id),
    value,
  );
  assert.equal(state.vaccinations.length, before.vaccinations.length + 1);
  assert.throws(
    () =>
      registerVaccination(state, { ...value, id: "second-next", lot: "OTHER" }),
    /ya está registrada/,
  );
  assert.throws(
    () =>
      correctVaccinationDates(state, previous.id, {
        administeredOn: previous.administeredOn,
        nextDueOn: previous.nextDueOn,
        reason: "Modificar",
      }),
    /histórico/,
  );
});

test("cancelled vaccination review reopens once; a recorded dose prevents reopening", () => {
  let state = createDemo();
  const previous = state.vaccinations[0];
  state = bookReview(answered(state, previous.id), previous.id);
  const appointment = state.appointments.at(-1);
  const f = vaccinationFollowup(state, previous.id);
  state = cancelAppointment(state, appointment.id);
  assert.equal(vaccinationFollowup(state, previous.id).id, f.id);
  assert.equal(vaccinationFollowup(state, previous.id).status, "replied");
  state = bookReview(state, previous.id);
  const newAppointment = state.appointments.at(-1);
  state = registerVaccination(
    state,
    input(state, {
      id: "completed-next",
      patientId: previous.patientId,
      name: previous.name,
      previousDoseId: previous.id,
      administeredOn: clinicToday(state),
    }),
  );
  state = cancelAppointment(state, newAppointment.id);
  assert.equal(vaccinationFollowup(state, previous.id).status, "closed");
  assert.equal(
    vaccinationFollowup(state, previous.id).closeReason,
    "dose-recorded",
  );
  assert.deepEqual(reload(state), state);
});

test("legacy data migrates without replacing identity, records, drafts or recorded messages", () => {
  const current = createDemo();
  const legacy = {
    ...current,
    version: 1,
    brand: { ...current.brand, name: "Clínica de prueba" },
    followups: current.followups
      .filter((f) => f.source === "consultation")
      .map(({ source, ...f }) => f),
    drafts: {
      a1: {
        summary: "Borrador previo",
        findings: "",
        plan: "",
        weight: "",
        followupDate: "",
        nextVisitDate: "",
      },
    },
  };
  delete legacy.vaccinations;
  delete legacy.timeZone;
  const migrated = reload(legacy);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.vaccinations.length, 0);
  assert.deepEqual(migrated.patients, legacy.patients);
  assert.deepEqual(migrated.appointments, legacy.appointments);
  assert.deepEqual(migrated.consultations, legacy.consultations);
  assert.deepEqual(migrated.brand, legacy.brand);
  assert.deepEqual(migrated.drafts, legacy.drafts);
  assert.equal(migrated.followups[0].message, legacy.followups[0].message);
  assert.deepEqual(reload(migrated), migrated);
  assert.equal(
    migrated.timeZone,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
});

test("inconsistent vaccination data is rejected, including duplicate followups and foreign patient links", () => {
  const corruptions = [
    (s) => {
      delete s.vaccinations;
    },
    (s) => {
      s.timeZone = "Invalid/Zone";
    },
    (s) => {
      s.followups.push({ ...s.followups.at(-1), id: "duplicate-followup" });
    },
    (s) => {
      s.followups.at(-1).patientId = "p1";
    },
    (s) => {
      s.followups.at(-1).dueDate = "2000-01-01";
    },
    (s) => {
      s.vaccinations[0].nextDueOn = "2026-02-30";
    },
    (s) => {
      s.vaccinations[0].previousDoseId = "missing";
    },
    (s) => {
      s.vaccinations.push({ ...s.vaccinations[0], id: "duplicate-dose" });
    },
    (s) => {
      s.followups.pop();
    },
    (s) => {
      s.followups.at(-1).newAppointmentId = "a1";
    },
  ];
  for (const corrupt of corruptions) {
    const state = createDemo();
    corrupt(state);
    assert.throws(() => reload(state));
  }
});

test("example loading preserves existing records and never duplicates examples", () => {
  const original = createDemo();
  const empty = {
    ...original,
    vaccinations: [],
    followups: original.followups.filter((f) => f.source === "consultation"),
  };
  const state = addVaccinationExamples(empty);
  assert.deepEqual(
    state.patients.slice(0, empty.patients.length),
    empty.patients,
  );
  assert.deepEqual(state.appointments, empty.appointments);
  assert.equal(state.vaccinations.length, 4);
  assert.deepEqual(addVaccinationExamples(reload(state)), state);
  assert.deepEqual(
    state.vaccinations.map((v) => vaccinationStatus(state, v)),
    ["overdue", "today", "upcoming", "scheduled"],
  );
});

test("clinic rebranding preserves recorded vaccination messages", () => {
  let state = createDemo();
  const vaccine = state.vaccinations[0];
  state = answered(state, vaccine.id);
  const message = vaccinationFollowup(state, vaccine.id).message;
  state = saveBrand(state, { ...state.brand, name: "Veterinaria Roble" });
  assert.equal(vaccinationFollowup(state, vaccine.id).message, message);
  assert.match(
    vaccinationFollowup(state, state.vaccinations[1].id).message,
    /Veterinaria Roble/,
  );
});
