import { DISEASE_PROFILES, SYMPTOM_SEVERITY } from "./knowledge.ts";

export interface TriagePatientContextLike {
  age?: number;
  sex?: string;
  duration?: string;
  severity?: "mild" | "moderate" | "severe";
  fever?: boolean;
  pregnant?: boolean;
  existingConditions?: string;
  currentMedicines?: string;
  allergies?: string;
}

export interface TriagePossibleConditionLike {
  name: string;
  confidence: number;
  why: string;
}

export interface LocalTriageInsights {
  probableConditions: TriagePossibleConditionLike[];
  recommendedSpecialty: string;
  alternateSpecialties: string[];
  reasoning: string;
  selfCare: string[];
  doctorQuestions: string[];
  appointmentSummary: string;
  matchedSymptoms: string[];
  topDisease: string;
  topScore: number;
}

const normalizeText = (value: string) =>
  value.toLowerCase().replace(/[_/]+/g, " ").replace(/\s+/g, " ").trim();

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const humanizeToken = (value: string) =>
  titleCase(value.replace(/\s*\(\s*/g, " ").replace(/\s*\)\s*/g, " "));

const CLINICAL_ALIASES: Array<{ phrases: string[]; tokens: string[] }> = [
  { phrases: ["shortness of breath", "breathlessness", "trouble breathing", "breathing trouble"], tokens: ["breathlessness"] },
  { phrases: ["chest pain", "chest tightness", "pressure in chest"], tokens: ["chest_pain"] },
  { phrases: ["stomach pain", "belly pain", "tummy pain", "stomach ache", "tummy ache"], tokens: ["stomach_pain", "abdominal_pain"] },
  { phrases: ["abdominal pain", "lower abdominal pain", "severe lower abdominal pain"], tokens: ["abdominal_pain", "stomach_pain"] },
  { phrases: ["joint pain", "joint ache"], tokens: ["joint_pain"] },
  { phrases: ["rash", "skin rash", "red spots"], tokens: ["skin_rash", "red_spots_over_body"] },
  { phrases: ["vomiting", "throwing up"], tokens: ["vomiting"] },
  { phrases: ["nausea", "queasy"], tokens: ["nausea"] },
  { phrases: ["diarrhea", "loose motion"], tokens: ["diarrhoea"] },
  { phrases: ["burning urination", "burning while urinating", "painful urination"], tokens: ["burning_micturition"] },
  { phrases: ["fever", "temperature", "high fever"], tokens: ["high_fever"] },
  { phrases: ["cough"], tokens: ["cough"] },
  { phrases: ["sneezing"], tokens: ["continuous_sneezing"] },
  { phrases: ["itching", "itchy"], tokens: ["itching"] },
  { phrases: ["headache"], tokens: ["headache"] },
  { phrases: ["dizziness", "lightheaded"], tokens: ["dizziness"] },
  { phrases: ["fatigue", "tired", "tiredness"], tokens: ["fatigue"] },
  { phrases: ["yellow eyes", "yellow skin", "jaundice"], tokens: ["yellowing_of_eyes", "yellowish_skin"] },
  { phrases: ["back pain"], tokens: ["back_pain"] },
  { phrases: ["neck pain"], tokens: ["neck_pain"] },
  { phrases: ["blurred vision"], tokens: ["blurred_and_distorted_vision"] },
  { phrases: ["loss of balance"], tokens: ["loss_of_balance"] },
  { phrases: ["weakness on one side", "one-sided weakness"], tokens: ["weakness_of_one_body_side"] },
  { phrases: ["sore throat", "throat pain"], tokens: ["patches_in_throat"] },
  { phrases: ["urinating often", "peeing often", "frequent urination"], tokens: ["polyuria"] },
  { phrases: ["blue lips"], tokens: ["cyanosis"] },
  { phrases: ["fainting", "passed out", "collapse"], tokens: ["collapse"] },
];

const SPECIALTY_ALTERNATES: Record<string, string[]> = {
  "Cardiology": ["Emergency Medicine", "General Physician"],
  "Dermatology": ["Allergy & Immunology", "General Physician"],
  "Endocrinology": ["General Physician", "Internal Medicine"],
  "ENT Specialist": ["General Physician", "Neurology"],
  "Emergency Medicine": ["General Physician", "Internal Medicine"],
  "Gastroenterology": ["Hepatology", "General Physician"],
  "General Physician": ["General Medicine", "Family Medicine"],
  "General Surgery": ["General Physician", "Gastroenterology"],
  "Hepatology": ["Gastroenterology", "General Physician"],
  "Infectious Disease": ["General Physician", "Emergency Medicine"],
  "Neurology": ["Emergency Medicine", "General Physician"],
  "Orthopedics": ["Rheumatology", "General Physician"],
  "Pulmonology": ["Emergency Medicine", "General Physician"],
  "Rheumatology": ["Orthopedics", "General Physician"],
  "Urology": ["General Physician", "Internal Medicine"],
  "Vascular Surgery": ["General Physician", "Cardiology"],
};

const QUESTION_TEMPLATES: Record<string, string[]> = {
  Cardiology: [
    "Could this be heart-related, and do I need an ECG or urgent evaluation?",
    "What warning signs mean I should seek emergency care?",
    "What tests should I ask about to rule out a cardiac cause?",
  ],
  Dermatology: [
    "Could this be an infection, allergy, or inflammatory skin condition?",
    "What should I avoid until the cause is confirmed?",
    "Do I need any skin tests or a specialist review?",
  ],
  Endocrinology: [
    "Could this be related to blood sugar or thyroid balance?",
    "What tests would help confirm the cause?",
    "What symptoms should make me seek faster review?",
  ],
  "ENT Specialist": [
    "Could this be an ear, nose, or throat issue that needs examination?",
    "Do I need any scans or a throat/ear exam?",
    "What symptoms should make me return sooner?",
  ],
  "Emergency Medicine": [
    "What emergency evaluation do I need right now?",
    "What information should I give the emergency team?",
    "What should I avoid while waiting for care?",
  ],
  Gastroenterology: [
    "Could this be reflux, an ulcer, liver, or bowel-related?",
    "What tests or imaging would help clarify the cause?",
    "What eating or medicine changes should I avoid before review?",
  ],
  "General Physician": [
    "What is the most likely explanation for these symptoms?",
    "What warning signs should make me seek urgent care?",
    "What tests or examinations would help clarify the cause?",
  ],
  "General Surgery": [
    "Could this need a surgical or procedural evaluation?",
    "What exam findings should I watch for before the visit?",
    "What warning signs should prompt urgent review?",
  ],
  Hepatology: [
    "Could this be a liver or bile duct problem?",
    "What blood tests or scans would help confirm the cause?",
    "What warning signs should prompt faster review?",
  ],
  "Infectious Disease": [
    "Could this be an infection that needs testing or isolation advice?",
    "Do I need any tests before treatment decisions are made?",
    "What symptoms would mean I should seek urgent care?",
  ],
  Neurology: [
    "Could this be a nerve, brain, or migraine-related issue?",
    "Do I need urgent imaging or a neurological exam?",
    "What warning signs should trigger emergency care?",
  ],
  Orthopedics: [
    "Could this be a joint, bone, or spine problem?",
    "Do I need an X-ray, MRI, or physical exam?",
    "What movements or activities should I avoid until I am seen?",
  ],
  Pulmonology: [
    "Could this be a lung or breathing issue that needs testing?",
    "Do I need a chest exam, oxygen check, or imaging?",
    "What signs should make me seek urgent care right away?",
  ],
  Rheumatology: [
    "Could this be an inflammatory or autoimmune joint issue?",
    "What labs or exams would help confirm the cause?",
    "What symptoms should I mention because they change the differential?",
  ],
  Urology: [
    "Could this be a urinary or kidney problem?",
    "Do I need urine tests or imaging?",
    "What symptoms mean I should seek urgent care?",
  ],
  "Vascular Surgery": [
    "Could this be a vein or circulation problem?",
    "What symptoms should I monitor while waiting for review?",
    "When should I escalate this urgently?",
  ],
};

const SPECIALTY_HINTS: Array<{ needles: string[]; specialty: string }> = [
  { needles: ["heart attack", "hypertension"], specialty: "Cardiology" },
  { needles: ["fungal infection", "allergy", "drug reaction", "acne", "psoriasis", "impetigo"], specialty: "Dermatology" },
  { needles: ["diabetes", "hypothyroidism", "hyperthyroidism", "hypoglycemia"], specialty: "Endocrinology" },
  { needles: ["vertigo"], specialty: "ENT Specialist" },
  { needles: ["bronchial asthma", "pneumonia", "tuberculosis", "common cold"], specialty: "Pulmonology" },
  { needles: ["aids", "malaria", "typhoid", "dengue", "tuberculosis", "chicken pox"], specialty: "Infectious Disease" },
  { needles: ["gerd", "peptic ulcer", "gastroenteritis"], specialty: "Gastroenterology" },
  { needles: ["jaundice", "hepatitis", "cholestasis", "alcoholic hepatitis"], specialty: "Hepatology" },
  { needles: ["paralysis", "migraine"], specialty: "Neurology" },
  { needles: ["cervical spondylosis", "osteoarthristis", "arthritis"], specialty: "Orthopedics" },
  { needles: ["urinary tract infection"], specialty: "Urology" },
  { needles: ["varicose veins"], specialty: "Vascular Surgery" },
  { needles: ["dimorphic hemmorhoids"], specialty: "General Surgery" },
];

const SPECIALTY_FALLBACK = "General Physician";

const normalizeDiseaseName = (value: string) => normalizeText(value).replace(/\s+/g, " ");

const inferSpecialty = (disease: string, symptoms: string[]) => {
  const normalizedDisease = normalizeDiseaseName(disease);
  const symptomSet = new Set(symptoms.map(normalizeText));

  for (const hint of SPECIALTY_HINTS) {
    if (hint.needles.some((needle) => normalizedDisease.includes(normalizeDiseaseName(needle)))) {
      return hint.specialty;
    }
    if (hint.needles.some((needle) => symptomSet.has(normalizeDiseaseName(needle)))) {
      return hint.specialty;
    }
  }

  if (normalizedDisease.includes("jaundice") || normalizedDisease.includes("hepatitis")) return "Hepatology";
  if (normalizedDisease.includes("allergy")) return "Dermatology";
  if (normalizedDisease.includes("pneumonia") || normalizedDisease.includes("asthma")) return "Pulmonology";
  if (normalizedDisease.includes("arthritis") || normalizedDisease.includes("spondylosis")) return "Orthopedics";
  if (normalizedDisease.includes("vertigo")) return "ENT Specialist";

  return SPECIALTY_FALLBACK;
};

const alternateSpecialtiesFor = (specialty: string) =>
  SPECIALTY_ALTERNATES[specialty] ?? SPECIALTY_ALTERNATES[SPECIALTY_FALLBACK] ?? ["General Medicine", "Family Medicine"];

const getQuestionsForSpecialty = (specialty: string) =>
  QUESTION_TEMPLATES[specialty] ?? QUESTION_TEMPLATES[SPECIALTY_FALLBACK];

const buildSymptomTokenSet = (
  chiefComplaint: string,
  selectedSymptoms: string[],
  patientContext: TriagePatientContextLike,
) => {
  const textPieces = [
    chiefComplaint,
    ...selectedSymptoms,
    patientContext.existingConditions,
    patientContext.currentMedicines,
    patientContext.allergies,
    patientContext.sex,
    patientContext.duration,
    patientContext.severity,
    patientContext.fever ? "fever" : undefined,
    patientContext.pregnant ? "pregnant" : undefined,
  ].filter(Boolean) as string[];

  const normalizedText = textPieces.map(normalizeText).join(" ");
  const tokens = new Set<string>();

  for (const symptom of selectedSymptoms) {
    const token = normalizeText(symptom).replace(/\s+/g, "_");
    if (token) tokens.add(token);
  }

  for (const profile of DISEASE_PROFILES) {
    for (const symptom of profile.symptoms) {
      const human = normalizeText(humanizeToken(symptom));
      if (normalizedText.includes(human)) {
        tokens.add(symptom);
      }
    }
  }

  for (const alias of CLINICAL_ALIASES) {
    if (alias.phrases.some((phrase) => normalizedText.includes(normalizeText(phrase)))) {
      alias.tokens.forEach((token) => tokens.add(token));
    }
  }

  return { tokens };
};

const sentenceCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^\w|\s\w/g, (char) => char.toUpperCase());

const scoreDisease = (profile: (typeof DISEASE_PROFILES)[number], matchedTokens: Set<string>) => {
  const matchedSymptoms = profile.symptoms.filter((symptom) => matchedTokens.has(symptom));
  const weightedScore = matchedSymptoms.reduce(
    (sum, symptom) => sum + (SYMPTOM_SEVERITY[symptom] ?? 1),
    0,
  );
  const coverage = matchedSymptoms.length / Math.max(profile.symptoms.length, 1);
  const emphasis = matchedSymptoms.some((symptom) =>
    ["chest_pain", "breathlessness", "severe_itching", "high_fever", "yellowing_of_eyes", "yellowish_skin", "burning_micturition", "weakness_of_one_body_side", "headache"].includes(symptom)
  )
    ? 0.18
    : 0;

  const score = weightedScore + coverage * 3 + emphasis;
  const maxPossible = profile.symptoms.reduce(
    (sum, symptom) => sum + (SYMPTOM_SEVERITY[symptom] ?? 1),
    0,
  );
  const confidence = Math.min(
    0.96,
    Math.max(0.16, 0.2 + (score / Math.max(maxPossible, 1)) * 0.74 + matchedSymptoms.length * 0.02),
  );

  return {
    matchedSymptoms,
    score,
    confidence,
  };
};

const buildReasoning = (
  disease: string,
  specialty: string,
  matchedSymptoms: string[],
  description: string,
) => {
  const symptomText = matchedSymptoms.length > 0
    ? matchedSymptoms.slice(0, 4).map(humanizeToken).join(", ")
    : "the reported symptom pattern";
  const descriptionSnippet = description ? description.split(".")[0].trim() : "";

  return [
    `This symptom pattern most closely matches ${disease} in the dataset because it overlaps with ${symptomText}.`,
    `A ${specialty} review is the safest next step to confirm the cause and rule out urgent conditions.`,
    descriptionSnippet ? `Dataset context: ${descriptionSnippet}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const buildSelfCare = (precautions: string[]) => {
  const safePrecautions = precautions
    .map((item) => sentenceCase(item))
    .filter(Boolean)
    .slice(0, 3);

  return [
    ...safePrecautions,
    "Avoid self-medication or dosage changes without clinician guidance.",
    "Track when symptoms started and whether they are getting worse.",
  ].slice(0, 4);
};

const buildAppointmentSummary = (
  disease: string,
  specialty: string,
  matchedSymptoms: string[],
) => {
  const symptomText = matchedSymptoms.length > 0
    ? matchedSymptoms.slice(0, 4).map(humanizeToken).join(", ")
    : "the chief complaint";

  return `Pattern match: ${disease}. Recommended next step: ${specialty}. Key symptoms to mention: ${symptomText}. This is not a diagnosis.`;
};

export function deriveLocalInsights(input: {
  chiefComplaint: string;
  selectedSymptoms: string[];
  patientContext: TriagePatientContextLike;
}): LocalTriageInsights {
  const { tokens } = buildSymptomTokenSet(
    input.chiefComplaint,
    input.selectedSymptoms,
    input.patientContext,
  );

  const ranked = DISEASE_PROFILES
    .map((profile) => {
      const { matchedSymptoms, score, confidence } = scoreDisease(profile, tokens);
      return {
        profile,
        matchedSymptoms,
        score,
        confidence,
      };
    })
    .filter((entry) => entry.matchedSymptoms.length > 0 || entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (ranked.length === 0) {
    return {
      probableConditions: [],
      recommendedSpecialty: SPECIALTY_FALLBACK,
      alternateSpecialties: alternateSpecialtiesFor(SPECIALTY_FALLBACK).slice(0, 3),
      reasoning:
        "The symptom pattern was not specific enough for a reliable local ranking, so the safest next step is a general physician review.",
      selfCare: [
        "Rest and avoid activities that worsen symptoms.",
        "Stay hydrated unless a doctor has told you to restrict fluids.",
        "Track when symptoms started and whether they are changing.",
        "Avoid self-medication or dosage changes without clinician guidance.",
      ],
      doctorQuestions: getQuestionsForSpecialty(SPECIALTY_FALLBACK),
      appointmentSummary:
        "The symptom pattern was too broad for a confident local match. Please discuss the full history with a general physician.",
      matchedSymptoms: Array.from(tokens).map((token) => humanizeToken(token)).slice(0, 10),
      topDisease: "General Physician review",
      topScore: 0,
    };
  }

  const top = ranked[0] ?? {
    profile: DISEASE_PROFILES[0],
    matchedSymptoms: [],
    score: 0,
    confidence: 0.18,
  };

  const specialty = inferSpecialty(top.profile.disease, top.profile.symptoms);
  const probableConditions = (ranked.length > 0 ? ranked : [top]).map((entry, index) => ({
    name: entry.profile.disease,
    confidence: Number((entry.confidence - index * 0.03).toFixed(2)),
    why: buildReasoning(
      entry.profile.disease,
      inferSpecialty(entry.profile.disease, entry.profile.symptoms),
      entry.matchedSymptoms.length > 0 ? entry.matchedSymptoms : top.profile.symptoms.slice(0, 3),
      entry.profile.description,
    ),
  }));

  const alternateSpecialties = Array.from(
    new Set([
      specialty,
      ...ranked.map((entry) => inferSpecialty(entry.profile.disease, entry.profile.symptoms)),
      ...alternateSpecialtiesFor(specialty),
      SPECIALTY_FALLBACK,
    ]),
  ).filter(Boolean);

  return {
    probableConditions,
    recommendedSpecialty: specialty,
    alternateSpecialties: alternateSpecialties.filter((item) => item !== specialty).slice(0, 3),
    reasoning: buildReasoning(
      top.profile.disease,
      specialty,
      top.matchedSymptoms,
      top.profile.description,
    ),
    selfCare: buildSelfCare(top.profile.precautions),
    doctorQuestions: getQuestionsForSpecialty(specialty),
    appointmentSummary: buildAppointmentSummary(
      top.profile.disease,
      specialty,
      top.matchedSymptoms.length > 0 ? top.matchedSymptoms : top.profile.symptoms.slice(0, 3),
    ),
    matchedSymptoms: Array.from(tokens).map((token) => humanizeToken(token)).slice(0, 10),
    topDisease: top.profile.disease,
    topScore: Number(top.score.toFixed(2)),
  };
}

export function buildLocalRankingContext(insights: LocalTriageInsights) {
  return {
    probableConditions: insights.probableConditions,
    recommendedSpecialty: insights.recommendedSpecialty,
    alternateSpecialties: insights.alternateSpecialties,
    reasoning: insights.reasoning,
    matchedSymptoms: insights.matchedSymptoms,
    topDisease: insights.topDisease,
    topScore: insights.topScore,
  };
}
