import { productBrand } from "./branding.ts";
import { clinicToday, offsetDate } from "./domain.ts";
import type { ClinicState, Patient } from "./domain.ts";
import { registerVaccination } from "./vaccination-domain.ts";

export function createDemo(timeZone = "America/Caracas"): ClinicState {
  const today = clinicToday({ timeZone });
  const day = (n: number) => offsetDate(n, today);
  const patients: Patient[] = [
    {
      id: "p1",
      name: "Milo",
      species: "Perro",
      breed: "Golden retriever",
      age: "4 años",
      owner: "Elena Rivas",
      phone: "600 000 001",
      email: "elena@example.com",
      allergies: "Sin alergias registradas",
    },
    {
      id: "p2",
      name: "Nina",
      species: "Gato",
      breed: "Europeo",
      age: "2 años",
      owner: "David Serra",
      phone: "600 000 002",
      email: "david@example.com",
      allergies: "Sensibilidad alimentaria",
    },
    {
      id: "p3",
      name: "Bruno",
      species: "Perro",
      breed: "Teckel",
      age: "7 años",
      owner: "Clara Montes",
      phone: "600 000 003",
      email: "clara@example.com",
      allergies: "Sin alergias registradas",
    },
    {
      id: "p4",
      name: "Lúa",
      species: "Gato",
      breed: "Común europeo",
      age: "5 años",
      owner: "Marcos Vidal",
      phone: "600 000 004",
      email: "marcos@example.com",
      allergies: "Sin alergias registradas",
    },
    {
      id: "p5",
      name: "Coco",
      species: "Perro",
      breed: "Mestizo",
      age: "1 año",
      owner: "Irene Soler",
      phone: "600 000 005",
      email: "irene@example.com",
      allergies: "Sin alergias registradas",
    },
    {
      id: "p6",
      name: "Olmo",
      species: "Perro",
      breed: "Border collie",
      age: "6 años",
      owner: "Andrés León",
      phone: "600 000 006",
      email: "andres@example.com",
      allergies: "Sin alergias registradas",
    },
  ];
  const state: ClinicState = {
    version: 2,
    timeZone,
    vaccinations: [],
    brand: {
      name: productBrand.name,
      tagline: productBrand.tagline,
      veterinarian: "Dra. Alba Martín",
      email: "hola@example.com",
      phone: "900 000 000",
      theme: "olive",
      logo: "",
    },
    patients,
    appointments: [
      {
        id: "a1",
        patientId: "p1",
        date: `${today}T09:30`,
        duration: 30,
        reason: "Revisión general",
        status: "confirmed",
      },
      {
        id: "a2",
        patientId: "p2",
        date: `${today}T10:15`,
        duration: 45,
        reason: "Revisión de alimentación",
        status: "confirmed",
      },
      {
        id: "a3",
        patientId: "p5",
        date: `${today}T11:30`,
        duration: 30,
        reason: "Primera visita",
        status: "confirmed",
      },
      {
        id: "a4",
        patientId: "p6",
        date: `${today}T12:15`,
        duration: 30,
        reason: "Control de evolución",
        status: "confirmed",
      },
      {
        id: "a5",
        patientId: "p3",
        date: `${day(-3)}T10:00`,
        duration: 30,
        reason: "Control de movilidad",
        status: "completed",
      },
      {
        id: "a6",
        patientId: "p4",
        date: `${day(-2)}T11:00`,
        duration: 30,
        reason: "Revisión general",
        status: "completed",
      },
      {
        id: "a7",
        patientId: "p2",
        date: `${day(1)}T09:30`,
        duration: 30,
        reason: "Control de peso",
        status: "confirmed",
      },
    ],
    consultations: [
      {
        id: "c1",
        appointmentId: "a5",
        summary: "Control de movilidad. Caso de demostración.",
        findings: "Se registra la evolución comunicada por su propietaria.",
        plan: "Seguir las indicaciones entregadas en consulta. Anotar los cambios para comentarlos en la próxima revisión.",
        weight: "8.4",
        followupDate: today,
        nextVisitDate: day(7),
        completedAt: `${day(-3)}T10:30:00`,
      },
      {
        id: "c2",
        appointmentId: "a6",
        summary: "Revisión general. Caso de demostración.",
        findings: "Se actualiza la ficha de la paciente.",
        plan: "Mantener el registro de hábitos acordado en consulta y compartirlo en el seguimiento.",
        weight: "4.2",
        followupDate: today,
        nextVisitDate: day(14),
        completedAt: `${day(-2)}T11:30:00`,
      },
    ],
    followups: [
      {
        id: "f1",
        source: "consultation",
        consultationId: "c1",
        patientId: "p3",
        dueDate: today,
        status: "pending",
        message:
          "Hola, Clara. Somos CercaVet. ¿Cómo se encuentra Bruno después de la consulta? Cuéntanos cómo evoluciona para preparar su revisión.",
        response: "",
        outcome: "",
      },
      {
        id: "f2",
        source: "consultation",
        consultationId: "c2",
        patientId: "p4",
        dueDate: today,
        status: "replied",
        message: "Hola, Marcos. ¿Cómo ha estado Lúa estos días?",
        response:
          "Está animada y ha recuperado sus hábitos. Podemos organizar la próxima revisión.",
        outcome: "well",
        contactedAt: `${today}T09:00:00`,
        repliedAt: `${today}T09:15:00`,
      },
    ],
    drafts: {},
  };
  return seedVaccinations(state, ["p3", "p2", "p1", "p4"]);
}

function seedVaccinations(
  state: ClinicState,
  patientIds: string[],
): ClinicState {
  const today = clinicToday(state);
  const offsets = [-4, 0, 7, 45];
  return patientIds.reduce(
    (current, patientId, i) =>
      registerVaccination(current, {
        id: `demo-vaccine-${i + 1}`,
        patientId,
        name: i % 2 === 0 ? "Polivalente · ejemplo" : "Vacuna felina · ejemplo",
        lot: `DEMO-2026-${i + 1}`,
        administeredOn: offsetDate(-90 - i * 5, today),
        nextDueOn: offsetDate(offsets[i], today),
      }),
    state,
  );
}

export function addVaccinationExamples(state: ClinicState): ClinicState {
  if (state.vaccinations.length) return state;
  const names = ["Bruno", "Nina", "Milo", "Lúa"];
  const patients: Patient[] = names.map((name, i) => ({
    id: `demo-vaccine-patient-${i + 1}`,
    name: `${name} · ejemplo`,
    species: i % 2 === 0 ? "Perro" : "Gato",
    breed: "",
    age: "",
    owner: "Familia de ejemplo",
    phone: "",
    email: "",
    allergies: "",
  }));
  if (
    patients.some((p) =>
      state.patients.some((existing) => existing.id === p.id),
    )
  ) {
    throw new Error(
      "Ya existen pacientes de este ejemplo. Registra sus vacunas desde la ficha.",
    );
  }
  return seedVaccinations(
    { ...state, patients: [...state.patients, ...patients] },
    patients.map((p) => p.id),
  );
}
