import test from "node:test";
import assert from "node:assert/strict";
import { createDemo, restoreDemo } from "../src/seed.ts";
import { bookAppointment, saveBrand, shifts } from "../src/domain.ts";

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
