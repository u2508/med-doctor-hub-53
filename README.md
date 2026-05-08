# medDoctorHub

AI pre-consultation triage and doctor-routing layer for healthcare platforms.

medDoctorHub helps patients understand urgency, choose the right specialist, and generate a doctor-ready summary before booking a consultation.

## Problem

Patients often choose the wrong specialist or arrive without structured context. Doctors then spend time reconstructing the visit instead of focusing on care.

## Solution

- AI health triage
- Urgency detection with local red-flag checks
- Specialist routing
- Doctor-ready PDF reports
- Booking integration with triage context
- Follow-up loop after consultation

## Practo-fit Positioning

This project is designed as a complementary AI layer for healthcare marketplaces and clinic platforms.

It is not a Practo clone and does not claim any partnership.

## Key Features

- AI Health Triage
- Smart specialist routing
- Doctor-ready PDF report
- Doctor dashboard context
- Follow-up loop
- Conversion analytics
- Demo doctor profiles for presentation mode

## Safety

This app does not provide diagnosis, prescriptions, or emergency medical services.

Every triage result includes clear disclaimer language and emergency-aware guidance.

## Screenshots

Add product screenshots here:

- `docs/screenshots/homepage.png`
- `docs/screenshots/ai-triage.png`
- `docs/screenshots/doctor-finder.png`
- `docs/screenshots/doctor-dashboard.png`
- `docs/screenshots/pitch-page.png`

## Demo Flow

1. Sign in as a patient.
2. Open `AI Health Triage`.
3. Enter symptoms and context.
4. Review urgency and recommended specialist.
5. Download the doctor report PDF.
6. Find recommended doctors.
7. Book a consultation.
8. Let the doctor review triage context.
9. Submit a follow-up response after the visit.

## Tech Stack

- React
- Vite
- TypeScript
- Supabase
- Supabase Edge Functions
- Gemini API
- Tailwind CSS
- shadcn/ui
- jsPDF

## Environment Variables

Frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Edge Function:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

## Demo Doctors

Demo doctor profiles are frontend-only placeholders for product demonstration.

If no real doctors are returned from Supabase, the doctor finder shows demo profiles instead.

Demo doctors cannot be booked into Supabase. Add real doctor profiles to enable booking.

## Roadmap

- EMR integration
- ABDM-compatible records
- Multilingual symptom intake
- WhatsApp follow-ups
- Clinic no-show prediction
- Doctor copilot notes

## Local Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run build
npm run lint
```

