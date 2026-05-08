import { type ReactNode, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  HeartPulse,
  Loader2,
  Lock,
  Search,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Trash2,
  Wind,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { analyzeTriage } from "@/lib/triage";
import { trackEvent } from "@/lib/events";
import { generateTriagePdf } from "@/lib/triageReport";
import { detectLocalRedFlags } from "@/lib/triageSafety";
import { TRIAGE_SYMPTOMS, formatSymptomLabel } from "@/lib/triageSymptoms";
import type {
  TriageAssessment,
  TriagePatientContext,
  TriageSeverity,
  TriageSubmission,
  TriageUrgency,
} from "@/lib/triageTypes";

type TriageFormState = {
  chiefComplaint: string;
  age: string;
  sex: string;
  duration: string;
  severity: TriageSeverity;
  fever: boolean;
  pregnant: boolean;
  existingConditions: string;
  currentMedicines: string;
  allergies: string;
};

const DEFAULT_FORM: TriageFormState = {
  chiefComplaint: "",
  age: "",
  sex: "",
  duration: "",
  severity: "moderate",
  fever: false,
  pregnant: false,
  existingConditions: "",
  currentMedicines: "",
  allergies: "",
};

const URGENCY_STYLES: Record<
  TriageUrgency,
  { label: string; className: string; icon: ReactNode }
> = {
  emergency: {
    label: "Emergency",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
    icon: <ShieldAlert className="size-4" />,
  },
  urgent: {
    label: "Urgent",
    className: "border-warning/40 bg-warning/10 text-warning",
    icon: <AlertTriangle className="size-4" />,
  },
  soon: {
    label: "Soon",
    className: "border-primary/30 bg-primary/10 text-primary",
    icon: <CalendarDays className="size-4" />,
  },
  routine: {
    label: "Routine",
    className: "border-success/30 bg-success/10 text-success",
    icon: <BadgeCheck className="size-4" />,
  },
  self_care: {
    label: "Self care",
    className: "border-sky-300 bg-sky-50 text-sky-700",
    icon: <Wind className="size-4" />,
  },
};

const EMERGENCY_NOTICE =
  "Emergency warning: Your symptoms may need immediate medical attention. Please contact local emergency services or visit the nearest emergency department now.";

const LOCAL_DISCLAIMER =
  "medDoctorHub does not provide a medical diagnosis. This tool helps you prepare for a consultation. For emergencies, contact local emergency services immediately.";

const makeFallbackAssessment = (
  id: string,
  chiefComplaint: string,
  selectedSymptoms: string[],
  patientContext: TriagePatientContext,
  emergencyDetected: boolean,
  redFlags: string[] = [],
): TriageAssessment => ({
  id,
  userId: "",
  chiefComplaint,
  selectedSymptoms,
  patientContext,
  urgency: emergencyDetected ? "emergency" : "soon",
  possibleConditions: [],
  recommendedSpecialty: emergencyDetected ? "Emergency Medicine" : "General Physician",
  alternateSpecialties: emergencyDetected
    ? ["Emergency Department", "General Physician"]
    : ["General Medicine", "Family Medicine"],
  reasoning: emergencyDetected
    ? "Emergency symptoms were reported, so immediate care is the priority."
    : "A safe fallback was used while the triage service responded.",
  redFlags,
  selfCare: emergencyDetected
    ? [
        "Call local emergency services now or go to the nearest emergency department.",
        "Do not delay care to wait for the symptoms to improve.",
      ]
    : [
        "Rest and avoid activities that worsen symptoms.",
        "Stay hydrated unless a doctor has told you to restrict fluids.",
      ],
  doctorQuestions: emergencyDetected
    ? [
        "What emergency evaluation do I need right now?",
        "What information should I give the emergency team?",
      ]
    : [
        "What is the most likely explanation for these symptoms?",
        "What warning signs should make me seek urgent care?",
      ],
  appointmentSummary: emergencyDetected
    ? `Emergency red flags reported: ${redFlags.join(", ") || "Critical symptoms"}`
    : `Chief complaint: ${chiefComplaint} | Selected symptoms: ${selectedSymptoms.join(", ") || "None selected"}`,
  disclaimer: LOCAL_DISCLAIMER,
  createdAt: new Date().toISOString(),
  rawAiResponse: { source: emergencyDetected ? "local-emergency" : "local-fallback" },
});

const TriagePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const resultRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const [sessionChecked, setSessionChecked] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<TriageAssessment | null>(null);
  const [emergencyDetected, setEmergencyDetected] = useState(false);
  const [localRedFlags, setLocalRedFlags] = useState<string[]>([]);
  const [symptomQuery, setSymptomQuery] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [form, setForm] = useState<TriageFormState>(DEFAULT_FORM);

  const filteredSymptoms = TRIAGE_SYMPTOMS.filter((symptom) => {
    const label = formatSymptomLabel(symptom).toLowerCase();
    const raw = symptom.toLowerCase();
    const query = symptomQuery.toLowerCase().trim();

    if (!query) return true;
    return label.includes(query) || raw.includes(query);
  });

  useEffect(() => {
    const verifySession = async () => {
      const { data } = await supabase.auth.getSession();
      const signedIn = Boolean(data.session);
      setIsSignedIn(signedIn);
      setSessionChecked(true);

      if (!signedIn) {
        toast({
          title: "Sign in required",
          description: "Please sign in to use AI Health Triage.",
          variant: "destructive",
        });
        navigate("/user-signin", { replace: true });
      }
    };

    verifySession();
  }, [navigate, toast]);

  useEffect(() => {
    if (assessment) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [assessment]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom],
    );
  };

  const clearForm = () => {
    setForm(DEFAULT_FORM);
    setSelectedSymptoms([]);
    setSymptomQuery("");
    setAssessment(null);
    setEmergencyDetected(false);
    setLocalRedFlags([]);
  };

  const buildSubmission = (): TriageSubmission => ({
    chiefComplaint: form.chiefComplaint.trim(),
    selectedSymptoms,
    patientContext: {
      age: form.age ? Number(form.age) : undefined,
      sex: form.sex || undefined,
      duration: form.duration || undefined,
      severity: form.severity,
      fever: form.fever,
      pregnant: form.pregnant,
      existingConditions: form.existingConditions || undefined,
      currentMedicines: form.currentMedicines || undefined,
    },
  });

  const handleSubmit = async () => {
    const submission = buildSubmission();
    const normalizedComplaint = submission.chiefComplaint;

    if (!normalizedComplaint) {
      toast({
        title: "Add a chief complaint",
        description: "Tell us what you are feeling before analyzing symptoms.",
        variant: "destructive",
      });
      return;
    }

    if (!isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in to use AI Health Triage.",
        variant: "destructive",
      });
      navigate("/user-signin");
      return;
    }

    const redFlags = detectLocalRedFlags(
      submission.chiefComplaint,
      submission.selectedSymptoms,
      submission.patientContext,
    );

    setLocalRedFlags(redFlags);
    setEmergencyDetected(redFlags.length > 0);
    setLoading(true);
    setAssessment(null);

    void trackEvent("triage_started", {
      symptom_count: submission.selectedSymptoms.length,
      emergency_flag: redFlags.length > 0,
    });

    try {
      const data = await analyzeTriage(submission);

      if (data?.assessment) {
        setAssessment(data.assessment);
        setEmergencyDetected(Boolean(data.emergencyDetected));
        setLocalRedFlags(data.assessment.redFlags || redFlags);
      } else if (redFlags.length > 0) {
        const fallback = makeFallbackAssessment(
          "local-emergency",
          submission.chiefComplaint,
          submission.selectedSymptoms,
          submission.patientContext,
          true,
          redFlags,
        );
        setAssessment(fallback);
      } else {
        throw new Error("Unexpected triage response");
      }

      void trackEvent("triage_completed", {
        urgency: data.assessment?.urgency ?? "soon",
        recommended_specialty: data.assessment?.recommendedSpecialty ?? "",
      });

      toast({
        title: redFlags.length > 0 ? "Emergency warning detected" : "Triage complete",
        description: redFlags.length > 0
          ? "Please seek immediate care if symptoms are worsening."
          : "Your doctor-ready summary is ready.",
      });
    } catch (error) {
      console.error("AI triage error:", error);
      if ((error as Error)?.name === "AuthRequiredError" || (error as Error)?.message === "AUTH_REQUIRED") {
        toast({
          title: "Sign in required",
          description: "Please sign in to use AI Health Triage.",
          variant: "destructive",
        });
        navigate("/user-signin");
        return;
      }
      const fallback = makeFallbackAssessment(
        redFlags.length > 0 ? "local-emergency" : "local-fallback",
        submission.chiefComplaint,
        submission.selectedSymptoms,
        submission.patientContext,
        redFlags.length > 0,
        redFlags,
      );

      setAssessment(fallback);
      setEmergencyDetected(redFlags.length > 0);
      toast({
        title: redFlags.length > 0 ? "Emergency warning" : "Safe fallback ready",
        description: redFlags.length > 0
          ? "Your symptoms may need immediate medical attention."
          : "We could not reach the AI service, so a conservative summary was prepared instead.",
        variant: redFlags.length > 0 ? "destructive" : "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePdfDownload = () => {
    if (!assessment) return;
    generateTriagePdf(assessment);
    void trackEvent("report_downloaded", {
      triage_id: assessment.id,
      specialty: assessment.recommendedSpecialty,
    });
    toast({
      title: "PDF downloaded",
      description: "Your doctor-ready report has been saved.",
    });
  };

  const specialtyRoute = assessment
    ? `/doctor-finder?specialty=${encodeURIComponent(assessment.recommendedSpecialty)}&triageId=${encodeURIComponent(assessment.id)}`
    : "/doctor-finder";

  const resultTone = assessment ? URGENCY_STYLES[assessment.urgency] : null;
  const topCondition = assessment?.possibleConditions?.[0] ?? null;
  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 flex items-center justify-center">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 flex items-center justify-center">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_22%),linear-gradient(180deg,_#f8fbff_0%,_#ffffff_40%,_#f7fbff_100%)]">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-4xl font-bold text-gradient">
              MedDoctorHub
            </p>
            <p className="text-muted-foreground mt-1.5 text-sm">
              AI pre-consultation triage and doctor routing
            </p>
          </div>
          <div className="flex items-center gap-3">
            
            <Button variant="outline" className="shadow-sm" onClick={() => navigate("/doctor-finder")}>
              Find Doctors
            </Button>
            <Button variant="outline"
              className="shadow-sm"
              onClick={() => navigate("/user-dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-gradient-to-br from-sky-700 via-cyan-600 to-emerald-500 p-[1px] shadow-[0_24px_90px_rgba(8,145,178,0.18)]"
        >
          <div className="rounded-[calc(2rem-1px)] bg-white/95 px-6 py-10 sm:px-10 lg:px-12">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="space-y-6">
                <Badge className="border-sky-200 bg-sky-50 text-sky-700">
                  <Sparkles className="mr-1.5 size-3.5" />
                  Not a diagnosis
                </Badge>
                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                    AI Health Triage for safer doctor booking
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                    Tell us what you are feeling in natural language, optionally narrow symptoms with chips, and get a safe triage result you can take to a clinician.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" onClick={scrollToForm} className="gap-2">
                    Start AI Triage
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("/doctor-finder")}>
                    Find Doctors
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Not a diagnosis", "Emergency-aware", "Doctor-ready report", "Secure patient records"].map((item) => (
                    <Badge key={item} variant="outline" className="rounded-full px-3 py-1">
                      <BadgeCheck className="mr-1.5 size-3.5" />
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-slate-200/80 bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldAlert className="size-4 text-rose-500" />
                      Safety first
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-muted-foreground">
                    Local red flags are checked before any AI response, and emergency symptoms are surfaced with clear guidance to seek immediate care.
                  </CardContent>
                </Card>
                <Card className="border-slate-200/80 bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Stethoscope className="size-4 text-cyan-600" />
                      Specialist routing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-muted-foreground">
                    The triage layer returns probable health issues, specialist guidance, red flags, and a doctor-ready summary.
                  </CardContent>
                </Card>
                <Card className="border-slate-200/80 bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="size-4 text-emerald-600" />
                      Doctor-ready report
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-muted-foreground">
                    Share a concise summary with your clinician or open the doctor finder with the recommended specialty.
                  </CardContent>
                </Card>
                <Card className="border-slate-200/80 bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lock className="size-4 text-slate-700" />
                      Secure records
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-muted-foreground">
                    Patient triage records stay in Supabase with row-level security and server-side AI calls.
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 ">
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="overflow-hidden border-slate-200/80 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
              <CardHeader className="border-b border-slate-100 bg-slate-50/80">
                <CardTitle className="text-2xl">Symptom assessment</CardTitle>
                <CardDescription>
                  Start with the main complaint, then add supporting symptoms and context.
                </CardDescription>
                <p className="text-sm text-muted-foreground">
                  Your symptom summary is stored securely and is only visible to your account unless you share it during booking.
                </p>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-2">
                  <Label htmlFor="chiefComplaint" className="text-sm font-medium">
                    Chief complaint
                  </Label>
                  <Textarea
                    id="chiefComplaint"
                    value={form.chiefComplaint}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        chiefComplaint: event.target.value,
                      }))}
                    placeholder="Example: sharp chest discomfort with shortness of breath for the last 4 hours"
                    className="min-h-28 resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe the main problem in your own words. Avoid abbreviations if possible.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-sm font-medium">Optional symptom chips</Label>
                    <Badge variant="outline" className="text-xs">
                      {selectedSymptoms.length} selected
                    </Badge>
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={symptomQuery}
                      onChange={(event) => setSymptomQuery(event.target.value)}
                      placeholder="Search symptoms like fever, cough, dizziness..."
                      className="pl-9"
                    />
                  </div>

                  {selectedSymptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedSymptoms.map((symptom) => (
                        <Button
                          key={symptom}
                          variant="secondary"
                          size="sm"
                          type="button"
                          onClick={() => toggleSymptom(symptom)}
                          className="h-9 rounded-full"
                        >
                          {formatSymptomLabel(symptom)}
                          <Trash2 className="ml-2 size-3.5" />
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                    <ScrollArea className="h-[18rem] pr-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {filteredSymptoms.map((symptom) => {
                          const active = selectedSymptoms.includes(symptom);

                          return (
                            <button
                              key={symptom}
                              type="button"
                              onClick={() => toggleSymptom(symptom)}
                              className={[
                                "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-all",
                                active
                                  ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50/70",
                              ].join(" ")}
                            >
                              <span className="leading-snug">{formatSymptomLabel(symptom)}</span>
                              <span className={[
                                "flex h-5 w-5 items-center justify-center rounded-full border text-[11px]",
                                active
                                  ? "border-primary bg-primary text-white"
                                  : "border-slate-300 text-slate-400",
                              ].join(" ")}
                              >
                                {active ? "✓" : "+"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="0"
                      value={form.age}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, age: event.target.value }))}
                      placeholder="e.g. 38"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      value={form.duration}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, duration: event.target.value }))}
                      placeholder="e.g. 3 days"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Select
                      value={form.severity}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          severity: value as TriageSeverity,
                        }))}
                    >
                      <SelectTrigger id="severity">
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sex">Sex</Label>
                    <Select
                      value={form.sex}
                      onValueChange={(value) =>
                        setForm((current) => ({ ...current, sex: value }))}
                    >
                      <SelectTrigger id="sex">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="conditions">Existing conditions</Label>
                    <Input
                      id="conditions"
                      value={form.existingConditions}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          existingConditions: event.target.value,
                        }))}
                      placeholder="Diabetes, hypertension, asthma..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicines">Current medicines</Label>
                    <Input
                      id="medicines"
                      value={form.currentMedicines}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          currentMedicines: event.target.value,
                        }))}
                      placeholder="Metformin, inhaler, blood pressure medicine..."
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Input
                      id="allergies"
                      value={form.allergies}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          allergies: event.target.value,
                        }))}
                      placeholder="Penicillin, peanuts, dust, latex..."
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="fever"
                        checked={form.fever}
                        onCheckedChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            fever: Boolean(checked),
                          }))}
                      />
                      <Label htmlFor="fever" className="cursor-pointer font-medium">
                        Fever
                      </Label>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Mark if you have a temperature or feel feverish.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="pregnant"
                        checked={form.pregnant}
                        onCheckedChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            pregnant: Boolean(checked),
                          }))}
                      />
                      <Label htmlFor="pregnant" className="cursor-pointer font-medium">
                        Pregnant
                      </Label>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Optional. Important for safe triage if it applies to you.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 p-6 sm:flex-row">
                <Button
                  type="button"
                  variant="medical"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Checking urgency and preparing doctor summary...
                    </>
                  ) : (
                    <>
                      Analyze Symptoms
                      <ArrowRight className="size-4" />
                    </>
                  )}
                  </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={clearForm}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Start new assessment
                </Button>
              </CardFooter>
              <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4 text-xs text-muted-foreground">
                Your symptom summary is stored securely and visible only to your account unless you share it during booking.
              </div>
            </Card>
          </motion.div>

          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-6"
          >
            {!assessment ? (
              <Card className="overflow-hidden border-slate-200/80 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
                <CardHeader className="border-b border-slate-100 bg-slate-50/80">
                  <CardTitle className="text-2xl">What you will get</CardTitle>
                  <CardDescription>
                    A safe triage result that helps you decide urgency and prepare for a visit.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        title: "Urgency level",
                        description: "Emergency, urgent, soon, routine, or self care.",
                        icon: ShieldAlert,
                      },
                      {
                        title: "Recommended specialist",
                        description: "Route yourself to the right clinician faster.",
                        icon: Stethoscope,
                      },
                      {
                        title: "Doctor-ready summary",
                        description: "A concise summary you can share at booking or in clinic.",
                        icon: CalendarDays,
                      },
                      {
                        title: "Safety-first checks",
                        description: "Local red-flag screening before any AI reasoning.",
                        icon: HeartPulse,
                      },
                    ].map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.title}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-primary/10 p-2 text-primary">
                              <Icon className="size-4" />
                            </div>
                            <div>
                              <h3 className="font-medium text-slate-900">{item.title}</h3>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  <Alert>
                    <Sparkles className="size-4" />
                    <AlertTitle>Not a diagnosis</AlertTitle>
                    <AlertDescription>
                      This flow helps you prepare for a consultation. It does not replace a clinician.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.1)]">
                <CardHeader className="border-b border-slate-100 bg-slate-50/80 px-6 py-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={["border", resultTone?.className ?? "border-primary/30 bg-primary/10 text-primary"].join(" ")}>
                      {resultTone?.icon}
                      <span className="ml-1">{resultTone?.label}</span>
                    </Badge>
                    <Badge variant="outline">Assessment saved</Badge>
                    {emergencyDetected && (
                      <Badge variant="destructive">Emergency review</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">Your triage result</CardTitle>
                    <CardDescription>
                      Use this summary when you speak to a clinician or book your visit.
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 p-6">
                  {(assessment.urgency === "emergency" || localRedFlags.length > 0) && (
                    <Alert variant="destructive">
                      <AlertTriangle className="size-4" />
                      <AlertTitle>Emergency warning</AlertTitle>
                      <AlertDescription>{EMERGENCY_NOTICE}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Urgency level
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {resultTone?.label}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Recommended specialist
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {assessment.recommendedSpecialty}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Probable health issue
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {topCondition ? topCondition.name : "No strong single match"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Red flags
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {assessment.redFlags.length > 0 ? assessment.redFlags.length : 0}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Alternate specialties
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {assessment.alternateSpecialties.length > 0
                        ? assessment.alternateSpecialties.join(", ")
                        : "General Medicine, Family Medicine"}
                    </p>
                  </div>

                  {assessment.possibleConditions.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Probable health issues to discuss with a doctor
                        </h3>
                        <Badge variant="outline">{assessment.possibleConditions.length} matches</Badge>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {assessment.possibleConditions.map((condition) => (
                          <div
                            key={condition.name}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="font-semibold text-slate-900">{condition.name}</h4>
                                <p className="mt-1 text-sm text-muted-foreground">{condition.why}</p>
                              </div>
                              <Badge variant="secondary">Triage confidence {Math.round(condition.confidence * 100)}%</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-900">Why this specialist</h3>
                    <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                      {assessment.reasoning}
                    </p>
                  </div>

                  {assessment.redFlags.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-slate-900">Red flags noted</h3>
                      <div className="flex flex-wrap gap-2">
                        {assessment.redFlags.map((flag) => (
                          <Badge key={flag} variant="destructive">
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-slate-900">Self-care guidance</h3>
                      <ul className="space-y-2">
                        {assessment.selfCare.map((item) => (
                          <li
                            key={item}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-slate-900">Questions for your doctor</h3>
                      <ol className="space-y-2">
                        {assessment.doctorQuestions.map((item, index) => (
                          <li
                            key={item}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                          >
                            <span className="mr-2 font-semibold text-primary">{index + 1}.</span>
                            {item}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-900">Doctor-ready summary</h3>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {assessment.appointmentSummary}
                    </div>
                  </div>

                  <Alert>
                    <Sparkles className="size-4" />
                    <AlertTitle>Always confirm with a clinician</AlertTitle>
                    <AlertDescription>{assessment.disclaimer}</AlertDescription>
                  </Alert>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 p-6 sm:flex-row">
                  <Button
                    type="button"
                    variant="medical"
                    onClick={() => {
                      void trackEvent("find_doctors_clicked", {
                        triage_id: assessment.id,
                        specialty: assessment.recommendedSpecialty,
                      });
                      void trackEvent("doctor_routing_clicked", {
                        triage_id: assessment.id,
                        specialty: assessment.recommendedSpecialty,
                      });
                      navigate(specialtyRoute);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Find recommended doctors
                    <ExternalLink className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePdfDownload}
                    className="w-full sm:w-auto"
                  >
                    Download doctor report
                    <Download className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearForm}
                    className="w-full sm:w-auto"
                  >
                    Start new assessment
                    <ChevronRight className="size-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {loading && (
              <Card className="border-slate-200/80 bg-white">
                <CardContent className="flex items-center gap-3 p-5">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Checking urgency and preparing doctor summary...
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default TriagePage;
