import test from "node:test";
import assert from "node:assert/strict";
import { createDemo as seedDemo } from "../src/seed.ts";
import {
  addPatient,
  blankNotes,
  bookAppointment,
  cancelAppointment,
  checkInAppointment,
  closeFollowup,
  contactFollowup,
  finishConsultation,
  localDate,
  markNoShow,
  offsetDate,
  parseState,
  replyFollowup,
  saveBrand,
  saveDraft,
  startConsultation,
} from "../src/domain.ts";

// These original workflow cases use device-local dates. Vaccination tests cover Caracas boundaries.
const createDemo = () =>
  seedDemo(Intl.DateTimeFormat().resolvedOptions().timeZone);

function completedVisit() {
  return finishConsultation(startConsultation(createDemo(), "a1"), "a1", {
    ...blankNotes(),
    summary: "Revisión de demostración",
    plan: "Indicaciones de ejemplo para el propietario.",
  });
}
function answeredVisit() {
  let state = completedVisit();
  const followup = state.followups.at(-1);
  state = contactFollowup(state, followup.id, followup.message);
  return replyFollowup(
    state,
    followup.id,
    "Evoluciona bien. Organizamos una revisión.",
    "well",
  );
}
test("full visit cycle preserves patient and consultation links through a new booking", () => {
  const original = createDemo();
  const appointment = {
    patientId: "p1",
    date: `${offsetDate(3)}T16:00`,
    duration: 30,
    reason: "Visita de ejemplo",
  };
  let state = bookAppointment(original, appointment);
  const booked = state.appointments.at(-1);
  state = startConsultation(state, booked.id);
  const notes = {
    ...blankNotes(),
    summary: "Valoración",
    plan: "Indicaciones para casa",
    followupDate: offsetDate(4),
    nextVisitDate: offsetDate(10),
  };
  state = saveDraft(state, booked.id, notes);
  state = parseState(JSON.stringify(state));
  assert.equal(state.drafts[booked.id].summary, "Valoración");
  state = finishConsultation(state, booked.id, notes);
  const consultation = state.consultations.at(-1);
  const followup = state.followups.at(-1);
  assert.equal(followup.consultationId, consultation.id);
  assert.equal(state.drafts[booked.id], undefined);
  state = contactFollowup(state, followup.id, "Mensaje de prueba");
  state = replyFollowup(state, followup.id, "Evoluciona bien", "well");
  state = bookAppointment(state, {
    ...appointment,
    date: `${offsetDate(10)}T16:00`,
    previousFollowupId: followup.id,
  });
  const review = state.appointments.at(-1);
  const closed = state.followups.at(-1);
  assert.equal(review.patientId, "p1");
  assert.equal(review.previousFollowupId, followup.id);
  assert.equal(closed.newAppointmentId, review.id);
  assert.equal(closed.status, "closed");
  assert.equal(original.appointments.length, 10);
  assert.deepEqual(parseState(JSON.stringify(state)), state);
});
test("overlapping appointments are rejected but adjacent appointments are permitted", () => {
  const state = createDemo();
  const input = {
    patientId: "p2",
    date: `${localDate()}T09:45`,
    duration: 30,
    reason: "Consulta",
  };
  assert.throws(() => bookAppointment(state, input), /ocupado/);
  assert.doesNotThrow(() =>
    bookAppointment(state, {
      ...input,
      date: `${localDate()}T10:00`,
      duration: 15,
    }),
  );
  assert.throws(
    () =>
      bookAppointment(state, {
        ...input,
        date: `${offsetDate(3)}T19:45`,
        duration: 30,
      }),
    /horario/,
  );
});
test("a closed consultation and its followup cannot be created twice", () => {
  const state = completedVisit();
  assert.throws(
    () =>
      finishConsultation(state, "a1", {
        ...blankNotes(),
        summary: "Otra",
        plan: "Otro",
      }),
    /abierta/,
  );
  assert.equal(
    state.consultations.filter((c) => c.appointmentId === "a1").length,
    1,
  );
});
test("followup requires a contact and response before rebooking", () => {
  let state = completedVisit();
  const f = state.followups.at(-1);
  const booking = {
    patientId: "p1",
    date: `${offsetDate(5)}T16:00`,
    duration: 30,
    reason: "Revisión",
    previousFollowupId: f.id,
  };
  assert.throws(() => replyFollowup(state, f.id, "Bien", "well"), /contacto/);
  assert.throws(() => bookAppointment(state, booking), /respuesta/);
  state = contactFollowup(state, f.id, f.message);
  assert.throws(() => replyFollowup(state, f.id, " ", "well"), /respuesta/);
  state = replyFollowup(state, f.id, "Está bien", "well");
  assert.throws(
    () => bookAppointment(state, { ...booking, patientId: "p2" }),
    /paciente/,
  );
  state = bookAppointment(state, booking);
  assert.throws(
    () =>
      bookAppointment(state, { ...booking, date: `${offsetDate(6)}T16:00` }),
    /ya tiene/,
  );
});
test("cancelling the next appointment reopens the followup and permits a new booking", () => {
  let state = answeredVisit();
  const f = state.followups.at(-1);
  const input = {
    patientId: "p1",
    date: `${offsetDate(5)}T16:00`,
    duration: 30,
    reason: "Revisión",
    previousFollowupId: f.id,
  };
  state = bookAppointment(state, input);
  state = cancelAppointment(state, state.appointments.at(-1).id);
  assert.equal(state.followups.at(-1).status, "replied");
  assert.equal(state.followups.at(-1).newAppointmentId, undefined);
  assert.doesNotThrow(() => bookAppointment(state, input));
});
test("clinical dates, weight and required notes are validated", () => {
  const state = startConsultation(createDemo(), "a1");
  const notes = {
    ...blankNotes(),
    summary: "Valoración",
    plan: "Indicaciones",
  };
  assert.throws(
    () => finishConsultation(state, "a1", { ...notes, plan: "" }),
    /Completa/,
  );
  assert.throws(
    () => finishConsultation(state, "a1", { ...notes, weight: "-1" }),
    /peso/,
  );
  assert.throws(
    () =>
      finishConsultation(state, "a1", { ...notes, followupDate: "2027-02-31" }),
    /seguimiento/,
  );
  assert.throws(
    () =>
      finishConsultation(state, "a1", { ...notes, nextVisitDate: localDate() }),
    /revisión/,
  );
});
test("contact and close operations cannot be silently repeated", () => {
  let state = answeredVisit();
  const f = state.followups.at(-1);
  assert.throws(
    () => contactFollowup(state, f.id, "Mensaje repetido"),
    /registrado/,
  );
  state = closeFollowup(state, f.id);
  assert.equal(state.followups.at(-1).status, "closed");
  assert.throws(() => closeFollowup(state, f.id), /respuesta/);
});
test("branding is configurable and a newly created patient can be booked", () => {
  let state = createDemo();
  state = saveBrand(state, {
    ...state.brand,
    name: "Clínica de ejemplo",
    theme: "ocean",
  });
  state = addPatient(state, {
    name: "Kira",
    species: "Perro",
    breed: "",
    age: "",
    owner: "Familia de ejemplo",
    phone: "",
    email: "",
    allergies: "",
  });
  state = bookAppointment(state, {
    patientId: state.patients.at(-1).id,
    date: `${offsetDate(5)}T16:00`,
    duration: 30,
    reason: "Primera visita",
  });
  assert.equal(state.brand.theme, "ocean");
  assert.match(state.followups[0].message, /Clínica de ejemplo/);
  assert.equal(state.appointments.at(-1).patientId, state.patients.at(-1).id);
  assert.throws(
    () =>
      saveBrand(state, {
        ...state.brand,
        logo: "https://tracker.invalid/logo.png",
      }),
    /imagen/,
  );
});
test("unreadable or inconsistent local data is rejected instead of silently reseeded", () => {
  assert.throws(() => parseState("{bad json"));
  assert.throws(
    () => parseState(JSON.stringify({ ...createDemo(), version: 4 })),
    /compatible/,
  );
  assert.throws(
    () => parseState(JSON.stringify({ ...createDemo(), patients: [] })),
    /incompletos/,
  );
  assert.throws(
    () => parseState(JSON.stringify({ ...createDemo(), brand: null })),
    /configuración/,
  );
});

test("the demo day mixes statuses, professionals, species and an urgency", () => {
  const state = createDemo();
  const today = state.appointments.filter((a) => a.date.startsWith(localDate()));
  assert.ok(today.length >= 6 && today.length <= 8);
  assert.deepEqual(
    [...new Set(today.map((a) => a.status))].sort(),
    ["completed", "confirmed", "no-show", "waiting"],
  );
  assert.ok(today.some((a) => a.urgent));
  assert.equal(
    new Set(today.map((a) => a.professional || state.brand.veterinarian)).size,
    2,
  );
  const species = today.map(
    (a) => state.patients.find((p) => p.id === a.patientId).species,
  );
  for (const kind of ["Perro", "Gato", "Otro"]) assert.ok(species.includes(kind));
  const names = [
    ...state.patients.map((p) => p.name),
    ...state.vaccinations.map((v) => v.name),
  ];
  assert.ok(names.every((name) => !/ejemplo/i.test(name)));
  const first = state.followups
    .filter((f) => f.status !== "closed")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 2);
  assert.notEqual(first[0].patientId, first[1].patientId);
  assert.deepEqual(parseState(JSON.stringify(state)), state);
});
test("arrival, no-show and shifts follow the agenda rules", () => {
  let state = createDemo();
  const [alba, pablo] = state.staff.map((s) => s.professional);
  const input = {
    patientId: "p2",
    date: `${localDate()}T13:30`,
    duration: 30,
    reason: "Consulta",
  };
  assert.throws(
    () => bookAppointment(state, { ...input, professional: pablo }),
    /ocupado/,
  );
  assert.doesNotThrow(() => bookAppointment(state, input));
  assert.throws(
    () =>
      bookAppointment(state, {
        ...input,
        date: `${offsetDate(1)}T17:30`,
        professional: alba,
      }),
    /horario de Dra/,
  );
  assert.throws(
    () => bookAppointment(state, { ...input, professional: "Nadie" }),
    /profesional/,
  );
  assert.throws(() => checkInAppointment(state, "a7"), /mismo día/);
  assert.throws(() => markNoShow(state, "a7"), /ausencia/);
  state = checkInAppointment(state, "a2");
  assert.equal(state.appointments.find((a) => a.id === "a2").status, "waiting");
  state = markNoShow(state, "a2");
  assert.doesNotThrow(() =>
    bookAppointment(state, { ...input, date: `${localDate()}T11:30` }),
  );
  assert.throws(() => startConsultation(state, "a2"), /disponible/);
  state = saveBrand(state, { ...state.brand, veterinarian: "Dra. Alba M." });
  assert.equal(state.staff[0].professional, "Dra. Alba M.");
  assert.doesNotThrow(() =>
    bookAppointment(state, { ...input, date: `${offsetDate(2)}T09:00` }),
  );
});
