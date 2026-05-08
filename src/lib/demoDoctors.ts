import { normalizeSpecialty } from "@/lib/specialtyMapping";

export type DemoConsultationType = "video" | "clinic" | "both";

export interface DemoDoctorProfile {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  consultationType: DemoConsultationType;
  rating: number;
  availability: string;
  languages: string[];
  fee: number;
  location: string;
  consultations: number;
  verified: boolean;
  clinicName: string;
  demoLabel: string;
  isDemoDoctor: true;
}

export const demoDoctors: DemoDoctorProfile[] = [
  {
    id: "demo-general-physician",
    name: "Dr. Maya Rao",
    specialty: "General Physician",
    experience: 12,
    consultationType: "both",
    rating: 4.9,
    availability: "Available today",
    languages: ["English", "Hindi"],
    fee: 650,
    location: "Central Health Studio",
    consultations: 4200,
    verified: true,
    clinicName: "Central Health Studio",
    demoLabel: "Demo profile",
    isDemoDoctor: true,
  },
  {
    id: "demo-dermatologist",
    name: "Dr. Sana Kapoor",
    specialty: "Dermatologist",
    experience: 10,
    consultationType: "video",
    rating: 4.8,
    availability: "Available tomorrow",
    languages: ["English", "Hindi"],
    fee: 900,
    location: "Skin & Glow Clinic",
    consultations: 3100,
    verified: true,
    clinicName: "Skin & Glow Clinic",
    demoLabel: "Demo profile",
    isDemoDoctor: true,
  },
  {
    id: "demo-orthopedist",
    name: "Dr. Arjun Mehta",
    specialty: "Orthopedist",
    experience: 15,
    consultationType: "clinic",
    rating: 4.7,
    availability: "Evening slots open",
    languages: ["English", "Marathi"],
    fee: 1200,
    location: "MoveWell Orthopaedics",
    consultations: 5200,
    verified: true,
    clinicName: "MoveWell Orthopaedics",
    demoLabel: "Demo profile",
    isDemoDoctor: true,
  },
  {
    id: "demo-rheumatologist",
    name: "Dr. Priya Nair",
    specialty: "Rheumatologist",
    experience: 11,
    consultationType: "both",
    rating: 4.9,
    availability: "Available this week",
    languages: ["English", "Malayalam"],
    fee: 1400,
    location: "JointCare Center",
    consultations: 2800,
    verified: true,
    clinicName: "JointCare Center",
    demoLabel: "Demo profile",
    isDemoDoctor: true,
  },
  {
    id: "demo-cardiologist",
    name: "Dr. Sameer Khan",
    specialty: "Cardiologist",
    experience: 18,
    consultationType: "clinic",
    rating: 4.9,
    availability: "Priority slots today",
    languages: ["English", "Urdu"],
    fee: 1800,
    location: "Heartline Cardiac Care",
    consultations: 6400,
    verified: true,
    clinicName: "Heartline Cardiac Care",
    demoLabel: "Demo profile",
    isDemoDoctor: true,
  },
  {
    id: "demo-neurologist",
    name: "Dr. Neha Iyer",
    specialty: "Neurologist",
    experience: 14,
    consultationType: "video",
    rating: 4.8,
    availability: "Morning consultations",
    languages: ["English", "Tamil"],
    fee: 1600,
    location: "NeuroPath Clinic",
    consultations: 3900,
    verified: true,
    clinicName: "NeuroPath Clinic",
    demoLabel: "Demo profile",
    isDemoDoctor: true,
  },
  {
    id: "demo-gastroenterologist",
    name: "Dr. Rohan Desai",
    specialty: "Gastroenterologist",
    experience: 13,
    consultationType: "both",
    rating: 4.7,
    availability: "Available today",
    languages: ["English", "Gujarati"],
    fee: 1100,
    location: "Digest Care Hospital",
    consultations: 3600,
    verified: true,
    clinicName: "Digest Care Hospital",
    demoLabel: "Demo profile",
    isDemoDoctor: true,
  },
  {
    id: "demo-psychiatrist",
    name: "Dr. Aditi Shah",
    specialty: "Psychiatrist",
    experience: 9,
    consultationType: "video",
    rating: 4.9,
    availability: "Flexible evening slots",
    languages: ["English", "Hindi", "Marathi"],
    fee: 1000,
    location: "Mindcare Studio",
    consultations: 2500,
    verified: true,
    clinicName: "Mindcare Studio",
    demoLabel: "Demo profile",
    isDemoDoctor: true,
  },
];

export const demoDoctorSpecialties = [
  ...new Set(demoDoctors.map((doctor) => normalizeSpecialty(doctor.specialty))),
];

