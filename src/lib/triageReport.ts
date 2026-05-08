import jsPDF from "jspdf";
import type { TriageAssessment } from "@/lib/triageTypes";
import { formatSymptomLabel } from "@/lib/triageSymptoms";

const ensureSpace = (doc: jsPDF, y: number, amount: number) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + amount > pageHeight - 48) {
    doc.addPage();
    return 56;
  }
  return y;
};

const drawWrappedText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
  color = "#334155",
) => {
  doc.setTextColor(color);
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
};

const drawBulletList = (
  doc: jsPDF,
  items: string[],
  x: number,
  y: number,
  width: number,
  lineHeight: number,
) => {
  let cursor = y;
  items.forEach((item) => {
    cursor = ensureSpace(doc, cursor, lineHeight * 2);
    const lines = doc.splitTextToSize(item, width - 14);
    doc.text(`•`, x, cursor);
    doc.text(lines, x + 12, cursor);
    cursor += lines.length * lineHeight + 4;
  });
  return cursor;
};

export const generateTriagePdf = (assessment: TriageAssessment) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = 56;

  const generatedAt = new Date(assessment.createdAt);
  const fileDate = Number.isNaN(generatedAt.getTime()) ? new Date() : generatedAt;
  const formatContext = (value: unknown) => {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return String(value);
    if (typeof value === "string" && value.trim()) return value;
    return "Not provided";
  };
  const patientContextLines = [
    ["Age", formatContext(assessment.patientContext?.age)],
    ["Sex", formatContext(assessment.patientContext?.sex)],
    ["Duration", formatContext(assessment.patientContext?.duration)],
    ["Severity", formatContext(assessment.patientContext?.severity)],
    ["Fever", formatContext(assessment.patientContext?.fever)],
    ["Pregnant", formatContext(assessment.patientContext?.pregnant)],
    ["Existing conditions", formatContext(assessment.patientContext?.existingConditions)],
    ["Current medicines", formatContext(assessment.patientContext?.currentMedicines)],
    ["Allergies", formatContext(assessment.patientContext?.allergies)],
  ].filter(([, value]) => value !== "Not provided");

  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 96, "F");
  doc.setTextColor("#ffffff");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("medDoctorHub AI Health Triage Report", margin, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated ${fileDate.toLocaleString()}`, margin, 62);
  doc.text("Not a diagnosis", doc.internal.pageSize.getWidth() - margin - 92, 62);

  y = 124;
  doc.setTextColor("#0f172a");
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Visit Summary", margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  y = drawWrappedText(doc, assessment.chiefComplaint, margin, y, contentWidth, 16);

  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Patient Context", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  if (patientContextLines.length > 0) {
    patientContextLines.forEach(([label, value]) => {
      y = ensureSpace(doc, y, 18);
      y = drawWrappedText(doc, `${label}: ${value}`, margin, y, contentWidth, 15);
    });
  } else {
    y = drawWrappedText(doc, "No patient context provided.", margin, y, contentWidth, 15);
  }

  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Selected Symptoms", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  const symptomText = assessment.selectedSymptoms.length
    ? assessment.selectedSymptoms.map((symptom) => formatSymptomLabel(symptom)).join(", ")
    : "None selected";
  y = drawWrappedText(doc, symptomText, margin, y, contentWidth, 15);

  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Urgency", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  y = drawWrappedText(doc, assessment.urgency.replace(/_/g, " "), margin, y, contentWidth, 15);

  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Recommended Specialist", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  y = drawWrappedText(doc, assessment.recommendedSpecialty, margin, y, contentWidth, 15);

  if (assessment.alternateSpecialties.length > 0) {
    y += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Alternate Specialties", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    y = drawBulletList(doc, assessment.alternateSpecialties, margin, y, contentWidth, 15);
  }

  if (assessment.possibleConditions.length > 0) {
    y += 18;
    y = ensureSpace(doc, y, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Possible Causes To Discuss", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    assessment.possibleConditions.forEach((condition) => {
      y = ensureSpace(doc, y, 42);
      y = drawWrappedText(
        doc,
        `${condition.name} - Triage confidence ${Math.round(condition.confidence * 100)}% - ${condition.why}`,
        margin,
        y,
        contentWidth,
        15,
      );
      y += 4;
    });
  }

  if (assessment.redFlags.length > 0) {
    y += 18;
    y = ensureSpace(doc, y, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Red Flags", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    y = drawBulletList(doc, assessment.redFlags, margin, y, contentWidth, 15);
  }

  if (assessment.doctorQuestions.length > 0) {
    y += 18;
    y = ensureSpace(doc, y, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Questions For Your Doctor", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    y = drawBulletList(doc, assessment.doctorQuestions, margin, y, contentWidth, 15);
  }

  y += 18;
  y = ensureSpace(doc, y, 52);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Doctor-Ready Summary", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  y = drawWrappedText(doc, assessment.appointmentSummary, margin, y, contentWidth, 15);

  y += 18;
  y = ensureSpace(doc, y, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Self-Care Guidance", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  y = drawBulletList(doc, assessment.selfCare, margin, y, contentWidth, 15);

  y += 18;
  y = ensureSpace(doc, y, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Disclaimer", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  y = drawWrappedText(doc, assessment.disclaimer, margin, y, contentWidth, 15, "#475569");

  const filename = `medDoctorHub-triage-report-${fileDate.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
