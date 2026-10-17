import type { ClinicState } from "./domain.ts";

// Upgrade only the old demo identity, preserving custom clinics and history.
export function migrateDemoIdentity(state: ClinicState): ClinicState {
  if (state.brand.name !== "Clínica Oliva") return state;
  const previousMessage =
    "Hola, Clara. Somos Clínica Oliva. ¿Cómo se encuentra Bruno después de la consulta? Cuéntanos cómo evoluciona para preparar su revisión.";
  return {
    ...state,
    brand: { ...state.brand, name: "CercaVet" },
    followups: state.followups.map((followup) =>
      followup.id === "f1" &&
      followup.status === "pending" &&
      followup.message === previousMessage
        ? { ...followup, message: previousMessage.replace("Clínica Oliva", "CercaVet") }
        : followup,
    ),
  };
}
