import type { TriagePatientContext } from "@/lib/triageTypes";

const normalize = (value: string) =>
  value.toLowerCase().replace(/[_/]+/g, " ").replace(/\s+/g, " ").trim();

const collectContextText = (patientContext: TriagePatientContext) => {
  const pieces = [
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

  return pieces.map(normalize).join(" ");
};

const hasAny = (text: string, terms: string[]) =>
  terms.some((term) => text.includes(normalize(term)));

export function detectLocalRedFlags(
  chiefComplaint: string,
  selectedSymptoms: string[],
  patientContext: TriagePatientContext,
): string[] {
  const combinedText = [
    chiefComplaint,
    ...selectedSymptoms,
    patientContext.existingConditions,
    patientContext.currentMedicines,
    collectContextText(patientContext),
  ]
    .filter(Boolean)
    .map((item) => normalize(item as string))
    .join(" ");

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

  if (patientContext.pregnant && hasAny(combinedText, ["bleeding", "severe pain", "severe cramps"])) {
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
