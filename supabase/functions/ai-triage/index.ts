import { createClient } from "npm:@supabase/supabase-js@2";

import {
  buildLocalRankingContext,
  deriveLocalInsights,
  type LocalTriageInsights,
} from "./localInsights.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRIAGE_SYSTEM_PROMPT = `
You are a cautious medical triage assistant for medDoctorHub.

Your job is NOT to diagnose.
Your job is to help the patient understand:
1. possible causes to discuss with a licensed doctor,
2. urgency level,
3. recommended specialist,
4. red flags,
5. what information to share with a doctor.

Rules:
- Never say "you have [disease]".
- Say "possible causes may include".
- Always recommend consulting a qualified doctor.
- If emergency symptoms appear, prioritize emergency care.
- Do not prescribe medicines.
- Do not give dosage instructions.
- Do not replace a doctor.
- Be extra cautious for children, elderly users, pregnant users, chest pain, breathing trouble, neurological symptoms, severe abdominal pain, fainting, uncontrolled bleeding, suicidal thoughts, or severe allergic reactions.
- Return only valid JSON. No markdown.
`;

const TRIAGE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    urgency: {
      type: "string",
      enum: ["emergency", "urgent", "soon", "routine", "self_care"],
    },
    possibleConditions: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          confidence: { type: "number" },
          why: { type: "string" },
        },
        required: ["name", "confidence", "why"],
      },
    },
    recommendedSpecialty: { type: "string" },
    alternateSpecialties: {
      type: "array",
      maxItems: 3,
      items: { type: "string" },
    },
    reasoning: { type: "string" },
    redFlags: {
      type: "array",
      maxItems: 5,
      items: { type: "string" },
    },
    selfCare: {
      type: "array",
      maxItems: 4,
      items: { type: "string" },
    },
    doctorQuestions: {
      type: "array",
      maxItems: 4,
      items: { type: "string" },
    },
    appointmentSummary: { type: "string" },
    disclaimer: { type: "string" },
  },
  required: [
    "urgency",
    "possibleConditions",
    "recommendedSpecialty",
    "alternateSpecialties",
    "reasoning",
    "redFlags",
    "selfCare",
    "doctorQuestions",
    "appointmentSummary",
    "disclaimer",
  ],
} as const;

type TriageSeverity = "mild" | "moderate" | "severe";
type TriageUrgency = "emergency" | "urgent" | "soon" | "routine" | "self_care";

interface TriagePatientContext {
  age?: number;
  sex?: string;
  duration?: string;
  severity?: TriageSeverity;
  fever?: boolean;
  pregnant?: boolean;
  existingConditions?: string;
  currentMedicines?: string;
  allergies?: string;
}

interface TriageRequestBody {
  chiefComplaint?: unknown;
  selectedSymptoms?: unknown;
  patientContext?: unknown;
}

interface TriagePossibleCondition {
  name: string;
  confidence: number;
  why: string;
}

interface TriageResponseBody {
  urgency: TriageUrgency;
  possibleConditions: TriagePossibleCondition[];
  recommendedSpecialty: string;
  alternateSpecialties: string[];
  reasoning: string;
  redFlags: string[];
  selfCare: string[];
  doctorQuestions: string[];
  appointmentSummary: string;
  disclaimer: string;
}

interface StoredAssessment {
  id: string;
  user_id: string;
  chief_complaint: string | null;
  selected_symptoms: string[] | null;
  patient_context: TriagePatientContext | null;
  urgency: TriageUrgency;
  possible_conditions: TriagePossibleCondition[] | null;
  recommended_specialty: string | null;
  alternate_specialties: string[] | null;
  reasoning: string | null;
  red_flags: string[] | null;
  self_care: string[] | null;
  doctor_questions: string[] | null;
  appointment_summary: string | null;
  ai_disclaimer: string | null;
  raw_ai_response: Record<string, unknown> | null;
  created_at: string;
}

const EMERGENCY_DISCLAIMER =
  "medDoctorHub does not provide a medical diagnosis. This tool helps you prepare for a consultation. For emergencies, contact local emergency services immediately.";

const DEFAULT_DISCLAIMER =
  "medDoctorHub does not provide a medical diagnosis. This tool helps you prepare for a consultation. For emergencies, contact local emergency services immediately.";

const normalizeText = (value: string) =>
  value.toLowerCase().replace(/[_/]+/g, " ").replace(/\s+/g, " ").trim();

const buildCombinedText = (
  chiefComplaint: string,
  selectedSymptoms: string[],
  patientContext: TriagePatientContext,
) => {
  const contextPieces = [
    patientContext.age?.toString(),
    patientContext.sex,
    patientContext.duration,
    patientContext.severity,
    patientContext.fever ? "fever" : undefined,
    patientContext.pregnant ? "pregnant" : undefined,
    patientContext.existingConditions,
    patientContext.currentMedicines,
    patientContext.allergies,
  ].filter(Boolean) as string[];

  return [
    chiefComplaint,
    ...selectedSymptoms,
    ...contextPieces,
  ]
    .map((item) => normalizeText(item))
    .join(" ");
};

const hasAny = (text: string, terms: string[]) =>
  terms.some((term) => text.includes(normalizeText(term)));

function detectRedFlags(
  chiefComplaint: string,
  selectedSymptoms: string[],
  patientContext: TriagePatientContext,
): string[] {
  const combinedText = buildCombinedText(
    chiefComplaint,
    selectedSymptoms,
    patientContext,
  );

  const redFlags: string[] = [];

  const chestPain = hasAny(combinedText, ["chest pain"]);
  const breathingTrouble = hasAny(combinedText, [
    "shortness of breath",
    "breathlessness",
    "severe breathing trouble",
    "breathing trouble",
    "trouble breathing",
  ]);

  if (chestPain && breathingTrouble) {
    redFlags.push("Chest pain with shortness of breath");
  }

  if (hasAny(combinedText, ["fainting", "passed out", "syncope", "collapse"])) {
    redFlags.push("Fainting or collapse");
  }

  if (
    hasAny(combinedText, [
      "face droop",
      "weakness on one side",
      "weakness one side",
      "slurred speech",
      "confusion",
    ])
  ) {
    redFlags.push("Possible stroke signs");
  }

  if (
    hasAny(combinedText, [
      "anaphylaxis",
      "severe allergic reaction",
      "swelling lips",
      "swelling tongue",
      "swelling throat",
      "throat swelling",
      "lip swelling",
      "tongue swelling",
    ])
  ) {
    redFlags.push("Severe allergic reaction");
  }

  if (hasAny(combinedText, ["suicidal thoughts", "self harm", "self-harm", "kill myself"])) {
    redFlags.push("Suicidal thoughts or self-harm risk");
  }

  if (hasAny(combinedText, ["severe bleeding", "uncontrolled bleeding", "heavy bleeding"])) {
    redFlags.push("Severe bleeding");
  }

  if (hasAny(combinedText, ["seizure", "fits", "convulsion"])) {
    redFlags.push("Seizure");
  }

  if (
    hasAny(combinedText, [
      "severe abdominal pain",
      "severe stomach pain",
      "severe belly pain",
      "severe lower abdominal pain",
    ])
  ) {
    redFlags.push("Severe abdominal pain");
  }

  if (hasAny(combinedText, ["high fever", "stiff neck", "neck stiffness"])) {
    redFlags.push("High fever with stiff neck");
  }

  if (
    patientContext.pregnant &&
    hasAny(combinedText, ["bleeding", "severe pain", "severe cramps"])
  ) {
    redFlags.push("Pregnancy with bleeding or severe pain");
  }

  if (breathingTrouble) {
    redFlags.push("Severe breathing trouble");
  }

  if (hasAny(combinedText, ["severe chest pain"])) {
    redFlags.push("Severe chest pain");
  }

  if (hasAny(combinedText, ["loss of consciousness", "passed out", "blackout"])) {
    redFlags.push("Loss of consciousness");
  }

  if (hasAny(combinedText, ["blue lips", "bluish lips", "cyanosis"])) {
    redFlags.push("Blue lips");
  }

  if (hasAny(combinedText, ["severe dehydration", "dehydration", "dry mouth", "not peeing"])) {
    redFlags.push("Severe dehydration");
  }

  if (hasAny(combinedText, ["severe head injury", "head injury", "hit head", "concussion"])) {
    redFlags.push("Severe head injury");
  }

  return [...new Set(redFlags)];
}

const safeString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const safeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => safeString(item))
        .filter((item): item is string => item.length > 0)
    : [];

const safePatientContext = (value: unknown): TriagePatientContext => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const context = value as Record<string, unknown>;
  const ageValue = context.age;
  const age = typeof ageValue === "number" && Number.isFinite(ageValue)
    ? ageValue
    : typeof ageValue === "string" && ageValue.trim()
    ? Number(ageValue)
    : undefined;

  return {
    age: age !== undefined && Number.isFinite(age) ? age : undefined,
    sex: safeString(context.sex),
    duration: safeString(context.duration),
    severity:
      context.severity === "mild" ||
        context.severity === "moderate" ||
        context.severity === "severe"
        ? context.severity
        : undefined,
    fever: typeof context.fever === "boolean" ? context.fever : undefined,
    pregnant: typeof context.pregnant === "boolean" ? context.pregnant : undefined,
    existingConditions: safeString(context.existingConditions),
    currentMedicines: safeString(context.currentMedicines),
    allergies: safeString(context.allergies),
  };
};

const GENERIC_SPECIALTY_NAMES = new Set([
  "General Physician",
  "General Medicine",
  "Family Medicine",
  "Internal Medicine",
]);

const mergeUniqueStrings = (primary: string[], secondary: string[], limit = 3) =>
  Array.from(
    new Set(
      [...primary, ...secondary]
        .map((item) => safeString(item))
        .filter((item) => item.length > 0),
    ),
  ).slice(0, limit);

const mergePossibleConditions = (
  primary: TriagePossibleCondition[],
  secondary: TriagePossibleCondition[],
) => {
  const merged = new Map<string, TriagePossibleCondition>();

  for (const condition of [...secondary, ...primary]) {
    const name = safeString(condition?.name);
    if (!name) continue;

    const key = normalizeText(name);
    const existing = merged.get(key);
    if (!existing || condition.confidence > existing.confidence) {
      merged.set(key, {
        name,
        confidence: Number.isFinite(condition.confidence)
          ? Number(condition.confidence.toFixed(2))
          : 0,
        why: safeString(condition.why, "Discuss this possibility with a doctor."),
      });
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
};

const isGenericSpecialty = (specialty: string) =>
  GENERIC_SPECIALTY_NAMES.has(safeString(specialty));

const buildUserPrompt = (
  body: {
    chiefComplaint: string;
    selectedSymptoms: string[];
    patientContext: TriagePatientContext;
  },
  localInsights: LocalTriageInsights,
) => `
Patient complaint:
${body.chiefComplaint}

Selected symptoms:
${body.selectedSymptoms?.join(", ") || "None"}

Patient context:
${JSON.stringify(body.patientContext || {}, null, 2)}

Local dataset pattern matches for context only:
${JSON.stringify(buildLocalRankingContext(localInsights), null, 2)}

Return JSON with exactly this structure:
{
  "urgency": "emergency | urgent | soon | routine | self_care",
  "possibleConditions": [
    {
      "name": "string",
      "confidence": number,
      "why": "string"
    }
  ],
  "recommendedSpecialty": "string",
  "alternateSpecialties": ["string"],
  "reasoning": "string",
  "redFlags": ["string"],
  "selfCare": ["string"],
  "doctorQuestions": ["string"],
  "appointmentSummary": "string",
  "disclaimer": "string"
}

Rules:
- Return a maximum of 3 possibleConditions.
- Keep reasoning concise and avoid diagnosis language.
- Keep selfCare and doctorQuestions short and practical.
- Confidence should be conservative and must not imply diagnosis.
`;

const getModelText = (responseJson: unknown) =>
  (responseJson as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  })?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim() ?? "";

const buildResponseSummary = (response: unknown, responseText: string) => {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return responseText.trim();
  }

  const payload = response as Record<string, unknown>;
  const lines: string[] = [];
  const append = (label: string, value: unknown) => {
    if (typeof value === "string" && value.trim()) {
      lines.push(`${label}: ${value.trim()}`);
    }
  };

  append("Urgency", payload.urgency);
  append("Recommended specialist", payload.recommendedSpecialty);

  if (Array.isArray(payload.possibleConditions)) {
    const names = payload.possibleConditions
      .map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return "";
        const condition = item as Record<string, unknown>;
        return safeString(condition.name);
      })
      .filter((item) => item.length > 0);

    if (names.length > 0) {
      lines.push(`Possible causes to discuss: ${names.slice(0, 3).join(", ")}`);
    }
  }

  append("Reasoning", payload.reasoning);
  append("Doctor-ready summary", payload.appointmentSummary);

  return lines.length > 0 ? lines.join("\n") : responseText.trim();
};

const extractJsonObject = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const buildFallbackResponse = (
  chiefComplaint: string,
  selectedSymptoms: string[],
  patientContext: TriagePatientContext,
  localInsights?: LocalTriageInsights,
): TriageResponseBody => ({
  urgency: "soon",
  possibleConditions: localInsights?.probableConditions ?? [],
  recommendedSpecialty: localInsights?.recommendedSpecialty ?? "General Physician",
  alternateSpecialties: localInsights?.alternateSpecialties ?? ["General Medicine", "Family Medicine"],
  reasoning:
    localInsights?.reasoning ??
    "The AI response could not be generated reliably, so this result keeps the guidance conservative and focused on seeing a clinician.",
  redFlags: [],
  selfCare:
    localInsights?.selfCare ?? [
      "Rest and avoid activities that worsen symptoms.",
      "Stay hydrated unless a doctor has told you to restrict fluids.",
      "Track when symptoms began and whether they are getting worse.",
    ],
  doctorQuestions:
    localInsights?.doctorQuestions ?? [
      "What is the most likely explanation for these symptoms?",
      "What warning signs should make me seek urgent care?",
      "What tests or examinations would help clarify the cause?",
    ],
  appointmentSummary:
    localInsights?.appointmentSummary ??
    [
      `Chief complaint: ${chiefComplaint}`,
      `Selected symptoms: ${selectedSymptoms.join(", ") || "None selected"}`,
      patientContext.duration ? `Duration: ${patientContext.duration}` : null,
      patientContext.severity ? `Severity reported: ${patientContext.severity}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
  disclaimer: DEFAULT_DISCLAIMER,
});

const buildEmergencyResponse = (
  chiefComplaint: string,
  selectedSymptoms: string[],
  patientContext: TriagePatientContext,
  redFlags: string[],
  localInsights?: LocalTriageInsights,
): TriageResponseBody => ({
  urgency: "emergency",
  possibleConditions: localInsights?.probableConditions.slice(0, 2) ?? [],
  recommendedSpecialty: "Emergency Medicine",
  alternateSpecialties: ["Emergency Department", "General Physician"],
  reasoning:
    localInsights?.reasoning ??
    "Reported symptoms include emergency red flags. This result is intentionally brief and focused on immediate medical attention.",
  redFlags,
  selfCare: [
    "Call local emergency services now or go to the nearest emergency department.",
    "Do not delay care to wait for symptoms to improve.",
    "If possible, have another person stay with you and bring a list of medicines.",
  ],
  doctorQuestions: [
    "What emergency evaluation do I need right now?",
    "What information should I give the emergency team?",
  ],
  appointmentSummary: [
    `Emergency red flags: ${redFlags.join(", ")}`,
    `Chief complaint: ${chiefComplaint}`,
    `Selected symptoms: ${selectedSymptoms.join(", ") || "None selected"}`,
    patientContext.duration ? `Duration: ${patientContext.duration}` : null,
    patientContext.severity ? `Severity reported: ${patientContext.severity}` : null,
  ].join(" | "),
  disclaimer: EMERGENCY_DISCLAIMER,
});

const normalizeModelResponse = (
  raw: unknown,
  fallback: TriageResponseBody,
  localInsights?: LocalTriageInsights,
): TriageResponseBody => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;

  const response = raw as Record<string, unknown>;
  const urgency =
    response.urgency === "emergency" ||
      response.urgency === "urgent" ||
      response.urgency === "soon" ||
      response.urgency === "routine" ||
      response.urgency === "self_care"
      ? response.urgency
      : fallback.urgency;

  const possibleConditions = Array.isArray(response.possibleConditions)
    ? response.possibleConditions
        .map((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return null;
          const condition = item as Record<string, unknown>;
          const name = safeString(condition.name);
          if (!name) return null;
          const confidenceValue = condition.confidence;
          const confidence =
            typeof confidenceValue === "number"
              ? confidenceValue
              : typeof confidenceValue === "string"
              ? Number(confidenceValue)
              : 0;
          return {
            name,
            confidence: Number.isFinite(confidence) ? confidence : 0,
            why: safeString(condition.why, "Discuss this possibility with a doctor."),
          };
        })
        .filter((item): item is TriagePossibleCondition => item !== null)
    : fallback.possibleConditions;

  const safeArray = (value: unknown, fallbackArray: string[]) =>
    Array.isArray(value)
      ? value.map((item) => safeString(item)).filter(Boolean)
      : fallbackArray;

  const normalizedPossibleConditions = possibleConditions.length > 0
    ? possibleConditions
    : localInsights?.probableConditions ?? fallback.possibleConditions;
  const normalizedSpecialty =
    isGenericSpecialty(safeString(response.recommendedSpecialty))
      ? localInsights?.recommendedSpecialty ?? fallback.recommendedSpecialty
      : safeString(response.recommendedSpecialty, fallback.recommendedSpecialty);

  return {
    urgency,
    possibleConditions: mergePossibleConditions(
      normalizedPossibleConditions,
      localInsights?.probableConditions ?? [],
    ),
    recommendedSpecialty: normalizedSpecialty,
    alternateSpecialties: mergeUniqueStrings(
      safeArray(response.alternateSpecialties, fallback.alternateSpecialties),
      localInsights?.alternateSpecialties ?? [],
    ),
    reasoning:
      safeString(response.reasoning, fallback.reasoning) ||
      localInsights?.reasoning ||
      fallback.reasoning,
    redFlags: mergeUniqueStrings(
      safeArray(response.redFlags, fallback.redFlags),
      fallback.redFlags,
      5,
    ),
    selfCare: mergeUniqueStrings(
      safeArray(response.selfCare, fallback.selfCare),
      localInsights?.selfCare ?? [],
      4,
    ),
    doctorQuestions: mergeUniqueStrings(
      safeArray(response.doctorQuestions, fallback.doctorQuestions),
      localInsights?.doctorQuestions ?? [],
      4,
    ),
    appointmentSummary: safeString(
      response.appointmentSummary,
      localInsights?.appointmentSummary ?? fallback.appointmentSummary,
    ),
    disclaimer: safeString(response.disclaimer, fallback.disclaimer),
  };
};

const toDbPayload = (
  userId: string,
  body: {
    chiefComplaint: string;
    selectedSymptoms: string[];
    patientContext: TriagePatientContext;
  },
  assessment: TriageResponseBody,
  rawAiResponse: Record<string, unknown>,
) => ({
  user_id: userId,
  chief_complaint: body.chiefComplaint,
  selected_symptoms: body.selectedSymptoms,
  patient_context: body.patientContext,
  urgency: assessment.urgency,
  possible_conditions: assessment.possibleConditions,
  recommended_specialty: assessment.recommendedSpecialty,
  alternate_specialties: assessment.alternateSpecialties,
  reasoning: assessment.reasoning,
  red_flags: assessment.redFlags,
  self_care: assessment.selfCare,
  doctor_questions: assessment.doctorQuestions,
  appointment_summary: assessment.appointmentSummary,
  ai_disclaimer: assessment.disclaimer,
  raw_ai_response: rawAiResponse,
});

const toClientAssessment = (row: StoredAssessment, rawAiResponse: Record<string, unknown>) => ({
  id: row.id,
  userId: row.user_id,
  chiefComplaint: row.chief_complaint ?? "",
  selectedSymptoms: row.selected_symptoms ?? [],
  patientContext: row.patient_context ?? {},
  urgency: row.urgency,
  possibleConditions: (row.possible_conditions ?? []) as TriagePossibleCondition[],
  recommendedSpecialty: row.recommended_specialty ?? "",
  alternateSpecialties: row.alternate_specialties ?? [],
  reasoning: row.reasoning ?? "",
  redFlags: row.red_flags ?? [],
  selfCare: row.self_care ?? [],
  doctorQuestions: row.doctor_questions ?? [],
  appointmentSummary: row.appointment_summary ?? "",
  disclaimer: row.ai_disclaimer ?? "",
  createdAt: row.created_at,
  rawAiResponse,
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const geminiApiKey =
    Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("VITE_GEMINI_API_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  try {
    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const user = authData?.user;

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => null)) as TriageRequestBody | null;
    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chiefComplaint = safeString(body.chiefComplaint);
    const selectedSymptoms = safeStringArray(body.selectedSymptoms).slice(0, 20);
    const patientContext = safePatientContext(body.patientContext);

    if (!chiefComplaint) {
      return new Response(JSON.stringify({ error: "Chief complaint is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const localInsights = deriveLocalInsights({
      chiefComplaint,
      selectedSymptoms,
      patientContext,
    });
    const localRedFlags = detectRedFlags(chiefComplaint, selectedSymptoms, patientContext);

    let assessmentBody: TriageResponseBody;
    let rawAiResponse: Record<string, unknown>;

    if (localRedFlags.length > 0) {
      assessmentBody = buildEmergencyResponse(
        chiefComplaint,
        selectedSymptoms,
        patientContext,
        localRedFlags,
        localInsights,
      );
      rawAiResponse = {
        source: "local-red-flag-check",
        redFlags: localRedFlags,
        localInsights,
      };
    } else if (!geminiApiKey) {
      assessmentBody = buildFallbackResponse(
        chiefComplaint,
        selectedSymptoms,
        patientContext,
        localInsights,
      );
      rawAiResponse = {
        source: "fallback-no-gemini-key",
        localInsights,
      };
    } else {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiApiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: TRIAGE_SYSTEM_PROMPT }],
            },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: buildUserPrompt(
                      {
                        chiefComplaint,
                        selectedSymptoms,
                        patientContext,
                      },
                      localInsights,
                    ),
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.15,
              topP: 0.9,
              maxOutputTokens: 3072,
              responseMimeType: "application/json",
              responseSchema: TRIAGE_RESPONSE_SCHEMA,
            },
          }),
        },
      );

      if (!geminiResponse.ok) {
        assessmentBody = buildFallbackResponse(
          chiefComplaint,
          selectedSymptoms,
          patientContext,
          localInsights,
        );
        rawAiResponse = {
          source: "gemini-error",
          status: geminiResponse.status,
          localInsights,
        };
      } else {
        const responseJson = await geminiResponse.json();
        const responseText = getModelText(responseJson);
        const parsedResponse = extractJsonObject(responseText);
        assessmentBody = normalizeModelResponse(
          parsedResponse,
          buildFallbackResponse(
            chiefComplaint,
            selectedSymptoms,
            patientContext,
            localInsights,
          ),
          localInsights,
        );
        rawAiResponse = {
          source: "gemini",
          response: responseJson,
          responseText,
          responseSummary: buildResponseSummary(parsedResponse, responseText),
          localInsights,
        };
      }
    }

    const { data: insertedAssessment, error: insertError } = await supabase
      .from("triage_assessments")
      .insert(toDbPayload(user.id, { chiefComplaint, selectedSymptoms, patientContext }, assessmentBody, rawAiResponse))
      .select("*")
      .single();

    if (insertError || !insertedAssessment) {
      return new Response(JSON.stringify({ error: "Failed to save triage assessment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const savedAssessment = toClientAssessment(
      insertedAssessment as StoredAssessment,
      rawAiResponse,
    );

    return new Response(
      JSON.stringify({
        assessment: savedAssessment,
        emergencyDetected: localRedFlags.length > 0 || assessmentBody.urgency === "emergency",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("AI triage error:", error);
    return new Response(JSON.stringify({ error: "Server encountered an issue. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
