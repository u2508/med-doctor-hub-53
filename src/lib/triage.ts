import { supabase } from "@/integrations/supabase/client";
import type {
  Tables,
  TablesInsert,
} from "@/integrations/supabase/types";
import type {
  TriageAssessment,
  TriageInvokeResponse,
  TriagePatientContext,
  TriagePossibleCondition,
  TriageSeverity,
  TriageSubmission,
  TriageUrgency,
} from "@/lib/triageTypes";

export type PatientContext = TriagePatientContext;
export type PossibleCondition = TriagePossibleCondition;
export type { TriageAssessment, TriageUrgency, TriageSeverity, TriageSubmission };

export interface TriageInput {
  chiefComplaint: string;
  selectedSymptoms: string[];
  patientContext: TriagePatientContext;
}

type TriageAssessmentRow = Tables<"triage_assessments">;

const toAssessment = (row: TriageAssessmentRow): TriageAssessment => ({
  id: row.id,
  userId: row.user_id,
  chiefComplaint: row.chief_complaint ?? "",
  selectedSymptoms: row.selected_symptoms ?? [],
  patientContext: (row.patient_context as TriagePatientContext) ?? {},
  urgency: row.urgency as TriageUrgency,
  possibleConditions: (row.possible_conditions as PossibleCondition[]) ?? [],
  recommendedSpecialty: row.recommended_specialty ?? "",
  alternateSpecialties: row.alternate_specialties ?? [],
  reasoning: row.reasoning ?? "",
  redFlags: row.red_flags ?? [],
  selfCare: row.self_care ?? [],
  doctorQuestions: row.doctor_questions ?? [],
  appointmentSummary: row.appointment_summary ?? "",
  disclaimer: row.ai_disclaimer ?? "",
  createdAt: row.created_at,
  rawAiResponse: (row.raw_ai_response as Record<string, unknown>) ?? null,
});

export async function analyzeTriage(input: TriageInput) {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (!session) {
    const error = new Error("AUTH_REQUIRED");
    error.name = "AuthRequiredError";
    throw error;
  }

  const { data, error } = await supabase.functions.invoke<TriageInvokeResponse>("ai-triage", {
    body: input,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) throw error;
  if (!data?.assessment) throw new Error("Unexpected triage response");

  return data;
}

export async function getTriageAssessment(id: string): Promise<TriageAssessment | null> {
  if (!id) return null;

  const { data, error } = await supabase
    .from("triage_assessments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toAssessment(data as TriageAssessmentRow);
}

export function toTriageInsertRow(
  userId: string,
  input: TriageInput,
  assessment: TriageAssessment,
): TablesInsert<"triage_assessments"> {
  return {
    user_id: userId,
    chief_complaint: input.chiefComplaint,
    selected_symptoms: input.selectedSymptoms,
    patient_context: input.patientContext,
    urgency: assessment.urgency,
    possible_conditions: assessment.possibleConditions as unknown as TablesInsert<"triage_assessments">["possible_conditions"],
    recommended_specialty: assessment.recommendedSpecialty,
    alternate_specialties: assessment.alternateSpecialties,
    reasoning: assessment.reasoning,
    red_flags: assessment.redFlags,
    self_care: assessment.selfCare,
    doctor_questions: assessment.doctorQuestions,
    appointment_summary: assessment.appointmentSummary,
    ai_disclaimer: assessment.disclaimer,
    raw_ai_response: assessment.rawAiResponse ?? {},
  };
}
