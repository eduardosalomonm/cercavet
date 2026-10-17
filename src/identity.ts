import type { ClinicState } from "./domain.ts";
import { saveBrand } from "./domain.ts";

// Upgrade only the old demo identity, preserving custom clinics and history.
export function migrateDemoIdentity(state: ClinicState): ClinicState {
  if (state.brand.name !== "Clínica Oliva") return state;
  return saveBrand(state, { ...state.brand, name: "CercaVet" });
}
