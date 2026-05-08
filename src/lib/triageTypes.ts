export const TRIAGE_URGENCIES = ["emergency", "urgent", "soon", "routine", "self_care"] as const;

export type TriageUrgency = (typeof TRIAGE_URGENCIES)[number];

export type TriageSeverity = "mild" | "moderate" | "severe";

export interface TriagePatientContext {
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

export interface TriagePossibleCondition {
  name: string;
  confidence: number;
  why: string;
}

export interface TriageSubmission {
  chiefComplaint: string;
  selectedSymptoms: string[];
  patientContext: TriagePatientContext;
}

export interface TriageAssessment {
  id: string;
  userId: string;
  chiefComplaint: string;
  selectedSymptoms: string[];
  patientContext: TriagePatientContext;
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
  createdAt: string;
  rawAiResponse?: Record<string, unknown> | null;
}

export interface TriageInvokeResponse {
  assessment: TriageAssessment;
  emergencyDetected: boolean;
}
