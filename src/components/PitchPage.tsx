import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  ClipboardList,
  FileText,
  HeartPulse,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Workflow,
  Lock,
  LayoutDashboard,
  Activity,
  BarChart3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/lib/events";

const pitchSteps = [
  {
    icon: ClipboardList,
    title: "Symptoms",
    description: "Patients describe what they feel in natural language or via symptom chips.",
  },
  {
    icon: ShieldAlert,
    title: "Urgency",
    description: "Local red-flag checks and AI triage surface emergency-aware guidance first.",
  },
  {
    icon: Stethoscope,
    title: "Specialist",
    description: "The workflow routes the patient toward the most appropriate specialty.",
  },
  {
    icon: FileText,
    title: "Report",
    description: "A doctor-ready summary captures the key context before the visit.",
  },
  {
    icon: Workflow,
    title: "Booking",
    description: "The result links directly into doctor discovery and consultation booking.",
  },
  {
    icon: Activity,
    title: "Follow-up",
    description: "Patients can report how they feel after the consult and continue the care loop.",
  },
];

const architecture = [
  "React + Vite frontend",
  "Supabase auth and Postgres",
  "Supabase Edge Functions",
  "Gemini structured AI output",
  "RLS-secured patient records",
  "PDF report generation with jsPDF",
];

const PitchPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    void trackEvent("pitch_page_viewed");
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_22%),linear-gradient(180deg,_#f8fbff_0%,_#ffffff_40%,_#f7fbff_100%)]">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              medDoctorHub
            </p>
            <p className="text-xs text-muted-foreground">
              AI pre-consultation triage and doctor-routing layer
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/")}>
              Home
            </Button>
            <Button variant="outline" onClick={() => navigate("/support")}>
              Request partnership discussion
            </Button>
            <Button onClick={() => navigate("/ai-triage")} className="gap-2">
              Try AI Triage
              <ArrowRight className="size-4" />
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
                    AI triage before doctor booking
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                    medDoctorHub helps patients understand urgency, choose the right specialist,
                    and generate a doctor-ready summary before they book a consultation.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" onClick={() => navigate("/ai-triage")} className="gap-2">
                    Start AI Triage
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("/doctor-finder")}>
                    Find Doctors
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Not a diagnosis", "Emergency-aware", "Doctor-ready report", "Secure patient records"].map((badge) => (
                    <Badge key={badge} variant="outline" className="rounded-full px-3 py-1">
                      <BadgeCheck className="mr-1.5 size-3.5" />
                      {badge}
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
                    Local red flags are checked before any AI response, and emergency symptoms
                    are surfaced with clear guidance to seek immediate care.
                  </CardContent>
                </Card>
                <Card className="border-slate-200/80 bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bot className="size-4 text-cyan-600" />
                      AI routing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-muted-foreground">
                    The triage layer returns possible causes to discuss, specialist guidance,
                    red flags, and a doctor-ready summary.
                  </CardContent>
                </Card>
                <Card className="border-slate-200/80 bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <LayoutDashboard className="size-4 text-emerald-600" />
                      Doctor readiness
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-muted-foreground">
                    Doctors receive more context before the visit, which reduces repetitive intake
                    and improves consultation quality.
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
                    Patient triage records stay in Supabase with row-level security and server-side
                    AI calls.
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Route patients to the right specialist",
              description:
                "The triage layer translates symptoms into a specialist recommendation and a booking path.",
            },
            {
              title: "Prepare doctors before the visit",
              description:
                "A structured summary helps clinicians see context, urgency, red flags, and patient questions.",
            },
            {
              title: "Improve booking confidence",
              description:
                "Patients understand urgency and next steps before they commit to a consultation.",
            },
          ].map((item) => (
            <Card key={item.title} className="border-slate-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                {item.description}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="overflow-hidden border-slate-200/80 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
            <CardHeader className="border-b border-slate-100 bg-slate-50/80">
              <CardTitle className="text-2xl">How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {pitchSteps.map((step, index) => (
                <div key={step.title} className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                    <step.icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Step 0{index + 1}
                    </p>
                    <h3 className="mt-1 font-semibold text-slate-950">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200/80 bg-gradient-to-br from-slate-950 to-slate-800 text-white shadow-[0_20px_70px_rgba(15,23,42,0.16)]">
            <CardHeader className="border-b border-white/10 bg-white/5">
              <CardTitle className="text-2xl text-white">Product value</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
              {[
                "Higher booking conversion",
                "Fewer wrong-specialist bookings",
                "Better doctor preparedness",
                "Stronger patient retention",
                "Post-consultation follow-up loop",
                "Structured intake without diagnosis claims",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
                  <Badge className="mb-3 bg-white/10 text-white">
                    <BadgeCheck className="mr-1.5 size-3.5" />
                    Platform value
                  </Badge>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">For patients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Confidence about which doctor to visit.</p>
              <p>Clear urgency guidance and red-flag awareness.</p>
              <p>A summary they can share during booking or at the visit.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">For doctors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Structured patient context before the consultation.</p>
              <p>Red flags and patient questions visible in one place.</p>
              <p>Less repetitive intake and faster visit preparation.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">For platforms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>A differentiated pre-consultation AI layer.</p>
              <p>Better routing before booking instead of after.</p>
              <p>Conversion analytics and follow-up retention.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/80">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart3 className="size-5 text-sky-600" />
                Technical architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
              {architecture.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/80">
              <CardTitle className="flex items-center gap-2 text-xl">
                <HeartPulse className="size-5 text-rose-500" />
                Safety approach
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 text-sm leading-7 text-slate-600">
              <p>This app does not provide diagnosis, prescriptions, or emergency medical services.</p>
              <p>Emergency red flags are detected locally before the AI response is shown.</p>
              <p>Server-side Edge Functions keep model keys off the frontend and save structured triage records securely.</p>
            </CardContent>
          </Card>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-sky-700 via-cyan-600 to-emerald-500 p-[1px]">
          <div className="rounded-[calc(2rem-1px)] bg-white px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                  Demo flow
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Try the triage flow, then route into doctor booking.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate("/ai-triage")} className="gap-2">
                  Try AI Triage
                  <ArrowRight className="size-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate("/doctor-finder")}>
                  Find Doctors
                </Button>
                <Button variant="secondary" onClick={() => navigate("/support")}>
                  Request partnership discussion
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PitchPage;
