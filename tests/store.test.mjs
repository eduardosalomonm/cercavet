import test from "node:test";
import assert from "node:assert/strict";
import { createDemo, restoreDemo } from "../src/seed.ts";
import {
  bookAppointment,
  parseState,
  saveBrand,
  shifts,
} from "../src/domain.ts";

test("restoring examples keeps a renamed vet consistent with the schedule", () => {
  let state = createDemo();
  state = saveBrand(state, {
    ...state.brand,
    veterinarian: "Dra. Lucía Pérez",
  });
  const restored = restoreDemo(state);
  assert.equal(restored.brand.veterinarian, "Dra. Lucía Pérez");
  assert.ok(
    shifts(restored).some((s) => s.professional === "Dra. Lucía Pérez"),
  );
  assert.ok(
    !shifts(restored).some((s) => s.professional === "Dra. Alba Martín"),
  );
  const milo = restored.appointments.find((a) => a.id === "a1");
  assert.throws(
    () =>
      bookAppointment(
        restored,
        {
          patientId: "p2",
          date: milo.date,
          duration: 30,
          reason: "Revisión",
        },
        new Date(`${milo.date.slice(0, 10)}T00:00`),
      ),
    /ocupado/,
  );
});

test("saving reuses the state this tab already read from the same stored text", async () => {
  const { readStored } = await import("../src/store.ts");
  const raw = JSON.stringify(createDemo());
  const first = readStored(raw);
  assert.equal(readStored(raw), first);
  const changed = readStored(raw.replace('"Milo"', '"Milo II"'));
  assert.notEqual(changed, first);
  assert.equal(changed.patients[0].name, "Milo II");
});

test("stored data with the same dose twice is still rejected", () => {
  const state = createDemo();
  const copy = {
    ...state.vaccinations[0],
    id: "copia",
    lot: ` ${state.vaccinations[0].lot.toUpperCase()} `,
  };
  const followup = {
    ...state.followups.find(
      (f) => f.vaccinationId === state.vaccinations[0].id,
    ),
    id: "f-copia",
    vaccinationId: "copia",
  };
  const raw = JSON.stringify({
    ...state,
    vaccinations: [...state.vaccinations, copy],
    followups: [...state.followups, followup],
  });
  assert.throws(() => parseState(raw), /dosis duplicadas/);
});

test("new demos follow the visitor's clock", () => {
  assert.equal(
    createDemo().timeZone,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  assert.equal(createDemo("Europe/Madrid").timeZone, "Europe/Madrid");
});

test("another tab's draft keystrokes are not announced as data changes", async () => {
  const { sameExceptDrafts } = await import("../src/store.ts");
  const { blankNotes, saveDraft, cancelAppointment, startConsultation } =
    await import("../src/domain.ts");
  const state = startConsultation(createDemo(), "a1");
  const typed = saveDraft(state, "a1", {
    ...blankNotes(),
    summary: "Tos leve",
  });
  assert.equal(sameExceptDrafts(state, typed), true);
  const booked = state.appointments.find((a) => a.status === "confirmed");
  assert.equal(
    sameExceptDrafts(state, cancelAppointment(state, booked.id)),
    false,
  );
});

test("a time that has already passed today cannot be booked", () => {
  const state = createDemo();
  const today = state.appointments.find((a) => a.id === "a1").date.slice(0, 10);
  const evening = new Date(`${today}T18:00`);
  const booking = { patientId: "p2", duration: 30, reason: "Revisión" };
  assert.throws(
    () =>
      bookAppointment(state, { ...booking, date: `${today}T16:00` }, evening),
    /ya ha pasado/,
  );
  assert.doesNotThrow(() =>
    bookAppointment(
      state,
      {
        ...booking,
        date: `${today}T18:30`,
        professional: shifts(state)[1].professional,
      },
      evening,
    ),
  );
});
