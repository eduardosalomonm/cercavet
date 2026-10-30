import test from "node:test";
import assert from "node:assert/strict";
import { createDemo, restoreDemo } from "../src/seed.ts";
import { bookAppointment, parseState, saveBrand, shifts } from "../src/domain.ts";

test("restoring examples keeps a renamed vet consistent with the schedule", () => {
  let state = createDemo();
  state = saveBrand(state, { ...state.brand, veterinarian: "Dra. Lucía Pérez" });
  const restored = restoreDemo(state);
  assert.equal(restored.brand.veterinarian, "Dra. Lucía Pérez");
  assert.ok(shifts(restored).some((s) => s.professional === "Dra. Lucía Pérez"));
  assert.ok(!shifts(restored).some((s) => s.professional === "Dra. Alba Martín"));
  const milo = restored.appointments.find((a) => a.id === "a1");
  assert.throws(
    () =>
      bookAppointment(restored, {
        patientId: "p2",
        date: milo.date,
        duration: 30,
        reason: "Revisión",
      }),
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
  const copy = { ...state.vaccinations[0], id: "copia", lot: ` ${state.vaccinations[0].lot.toUpperCase()} ` };
  const followup = { ...state.followups.find((f) => f.vaccinationId === state.vaccinations[0].id), id: "f-copia", vaccinationId: "copia" };
  const raw = JSON.stringify({ ...state, vaccinations: [...state.vaccinations, copy], followups: [...state.followups, followup] });
  assert.throws(() => parseState(raw), /dosis duplicadas/);
});
