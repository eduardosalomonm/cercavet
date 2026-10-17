import type { ClinicState } from "./domain.ts";
import { saveBrand } from "./domain.ts";
import { productBrand } from "./branding.ts";

// Upgrade only the old demo identity, preserving custom clinics and history.
export function migrateDemoIdentity(state: ClinicState): ClinicState {
  const previousName = state.brand.name === "Clínica Oliva";
  const previousTagline = (previousName || state.brand.name === productBrand.name) &&
    state.brand.tagline === "Cuidamos de su vida contigo.";
  if (!previousName && !previousTagline) return state;
  return saveBrand(state, {
    ...state.brand,
    name: previousName ? productBrand.name : state.brand.name,
    tagline: previousTagline ? productBrand.tagline : state.brand.tagline,
  });
}
