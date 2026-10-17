import test from "node:test";
import assert from "node:assert/strict";
import { createDemo } from "../src/seed.ts";
import { migrateDemoIdentity } from "../src/identity.ts";

function previousDemo() {
  const state = createDemo();
  state.brand.name = "Clínica Oliva";
  state.followups[0].message = state.followups[0].message.replace("CercaVet", "Clínica Oliva");
  return state;
}

test("existing demo receives CercaVet without losing appointments or other configuration", () => {
  const before = previousDemo();
  before.brand.theme = "ocean";
  before.followups.push({ ...before.followups[0], id: "added-later", message: "Desde Clínica Oliva: ¿cómo sigue?" });
  const after = migrateDemoIdentity(before);
  assert.equal(after.brand.name, "CercaVet");
  assert.equal(after.brand.theme, "ocean");
  assert.equal(after.appointments, before.appointments);
  assert.equal(after.consultations, before.consultations);
  assert.equal(after.patients, before.patients);
  assert.match(after.followups[0].message, /Somos CercaVet/);
  assert.equal(after.followups.at(-1).message, "Desde CercaVet: ¿cómo sigue?");
  assert.equal(migrateDemoIdentity(after), after);
});

test("custom clinic identities and already recorded messages remain intact", () => {
  const custom = previousDemo();
  custom.brand.name = "Clínica de Ana";
  assert.equal(migrateDemoIdentity(custom), custom);
  const historical = previousDemo();
  historical.followups[0].status = "contacted";
  historical.followups[0].contactedAt = new Date().toISOString();
  assert.equal(migrateDemoIdentity(historical).followups[0], historical.followups[0]);
});
