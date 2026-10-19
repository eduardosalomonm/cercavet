import { productBrand } from "./branding.ts";
import {
  bookAppointment,
  checkInAppointment,
  clinicToday,
  finishConsultation,
  markNoShow,
  offsetDate,
  startConsultation,
} from "./domain.ts";
import type { Appointment, ClinicState, Patient } from "./domain.ts";
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
    {
      id: "p7",
      name: "Toby",
      species: "Perro",
      breed: "Mestizo",
      age: "3 años",
      owner: "Sergio Navarro",
      phone: "600 000 007",
      email: "sergio@example.com",
      allergies: "Alergia a la amoxicilina",
    },
    {
      id: "p8",
      name: "Kiwi",
      species: "Otro",
      breed: "Conejo enano",
      age: "2 años",
      owner: "Paula Ortega",
      phone: "600 000 008",
      email: "paula@example.com",
      allergies: "Sin alergias registradas",
    },
    {
      id: "p9",
      name: "Misha",
      species: "Gato",
      breed: "Siamés",
      age: "11 años",
      owner: "Teresa Gómez",
      phone: "600 000 009",
      email: "teresa@example.com",
      allergies: "Hipertiroidismo en control",
    },
  ];
  const second = "Dr. Pablo Ruiz";
  let state: ClinicState = {
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
    staff: [
      { professional: "Dra. Alba Martín", from: "09:00", to: "17:00" },
      { professional: second, from: "13:00", to: "20:00" },
    ],
    patients,
    appointments: [
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
    ],
    consultations: [
      {
        id: "c1",
        appointmentId: "a5",
        summary: "Control de movilidad. Rigidez leve al levantarse.",
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
        summary: "Revisión general sin incidencias.",
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
  // Bookings go through the domain so shifts and overlaps follow the agenda rules.
  const book = (
    id: string,
    input: Omit<Appointment, "id" | "status">,
  ) => {
    state = bookAppointment(state, input);
    state.appointments[state.appointments.length - 1].id = id;
  };
  book("a4", {
    patientId: "p6",
    date: `${today}T09:00`,
    duration: 30,
    reason: "Control de evolución",
  });
  book("a1", {
    patientId: "p1",
    date: `${today}T09:30`,
    duration: 30,
    reason: "Revisión general",
  });
  book("a3", {
    patientId: "p5",
    date: `${today}T10:15`,
    duration: 30,
    reason: "Primera visita",
  });
  book("a8", {
    patientId: "p7",
    date: `${today}T10:45`,
    duration: 30,
    reason: "Vómitos desde anoche",
    urgent: true,
  });
  book("a2", {
    patientId: "p2",
    date: `${today}T11:30`,
    duration: 45,
    reason: "Revisión de alimentación",
  });
  book("a9", {
    patientId: "p8",
    date: `${today}T13:30`,
    duration: 30,
    reason: "Revisión dental",
    professional: second,
  });
  book("a10", {
    patientId: "p9",
    date: `${today}T17:00`,
    duration: 30,
    reason: "Control de tiroides",
    professional: second,
  });
  book("a7", {
    patientId: "p5",
    date: `${day(1)}T10:00`,
    duration: 30,
    reason: "Primera visita (reprogramada)",
  });
  state = finishConsultation(startConsultation(state, "a4"), "a4", {
    summary: "Buena evolución de la otitis. Oído sin secreción.",
    findings: "Conducto limpio y sin dolor a la palpación.",
    plan: "Terminar las gotas durante tres días más y evitar baños esta semana.",
    weight: "19.6",
    followupDate: day(2),
    nextVisitDate: day(14),
  });
  state.consultations[state.consultations.length - 1] = {
    ...state.consultations[state.consultations.length - 1],
    id: "c3",
    completedAt: `${today}T09:25:00`,
  };
  state.followups[state.followups.length - 1] = {
    ...state.followups[state.followups.length - 1],
    id: "f3",
    consultationId: "c3",
  } as ClinicState["followups"][number];
  state = checkInAppointment(state, "a1");
  state = checkInAppointment(state, "a8");
  state = markNoShow(state, "a3");
  return seedVaccinations(state, [
    { patientId: "p4", name: "Trivalente felina" },
    { patientId: "p1", name: "Rabia" },
    { patientId: "p2", name: "Leucemia felina" },
    { patientId: "p3", name: "Polivalente canina" },
  ]);
}

function seedVaccinations(
  state: ClinicState,
  doses: { patientId: string; name: string }[],
): ClinicState {
  const today = clinicToday(state);
  const offsets = [-4, 0, 7, 45];
  return doses.reduce(
    (current, { patientId, name }, i) =>
      registerVaccination(current, {
        id: `demo-vaccine-${i + 1}`,
        patientId,
        name,
        lot: ["FV4821A", "RB7730B", "LF3092C", "PC5518D"][i],
        administeredOn: offsetDate(-90 - i * 5, today),
        nextDueOn: offsetDate(offsets[i], today),
      }),
    state,
  );
}

export function addVaccinationExamples(state: ClinicState): ClinicState {
  if (state.vaccinations.length) return state;
  const examples = [
    ["Rocky", "Perro", "Laura Gil"],
    ["Mía", "Gato", "Jorge Pardo"],
    ["Thor", "Perro", "Nuria Campos"],
    ["Kira", "Gato", "Óscar Lozano"],
  ] as const;
  const patients: Patient[] = examples.map(([name, species, owner], i) => ({
    id: `demo-vaccine-patient-${i + 1}`,
    name,
    species,
    breed: "",
    age: "",
    owner,
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
    patients.map((p) => ({
      patientId: p.id,
      name: p.species === "Perro" ? "Polivalente canina" : "Trivalente felina",
    })),
  );
}
