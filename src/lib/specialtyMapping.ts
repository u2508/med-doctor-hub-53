export const specialtyAliases = {
  "general physician": [
    "general medicine",
    "physician",
    "family medicine",
    "primary care",
  ],
  dermatologist: ["dermatology", "skin", "rash", "acne", "itching"],
  orthopedist: ["orthopedic", "orthopedics", "bone", "joint", "back pain"],
  rheumatologist: ["rheumatology", "arthritis", "autoimmune", "joint pain", "swelling"],
  cardiologist: ["cardiology", "heart", "chest pain", "palpitations"],
  neurologist: ["neurology", "headache", "migraine", "seizure", "stroke", "numbness"],
  pulmonologist: ["pulmonology", "lungs", "breathing", "asthma", "shortness of breath"],
  gastroenterologist: ["gastroenterology", "stomach", "digestion", "abdominal pain", "vomiting"],
  gynecologist: ["gynaecology", "gynecology", "women health", "pregnancy", "period"],
  pediatrician: ["pediatrics", "child", "children", "baby"],
  psychiatrist: ["psychiatry", "mental health", "anxiety", "depression"],
  "ent specialist": ["ent", "ear", "nose", "throat"],
  urologist: ["urology", "urine", "kidney", "bladder"],
  dentist: ["dental", "tooth", "teeth", "gums"],
  "emergency medicine": ["emergency", "urgent care", "casualty"],
} as const;

const SPECIALTY_CANONICALS = Object.keys(specialtyAliases);

const clean = (value: string) =>
  value
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

export function normalizeSpecialty(input: string): string {
  const normalized = clean(input);
  if (!normalized) return "";

  for (const canonical of SPECIALTY_CANONICALS) {
    const canonicalClean = clean(canonical);
    if (normalized === canonicalClean) return canonical;

    const aliases = specialtyAliases[canonical as keyof typeof specialtyAliases];
    const matches = aliases.some((alias) => {
      const aliasClean = clean(alias);
      return (
        normalized === aliasClean ||
        normalized.includes(aliasClean) ||
        aliasClean.includes(normalized)
      );
    });

    if (matches) return canonical;
  }

  return normalized;
}

export function getSpecialtySearchTerms(recommendedSpecialty: string): string[] {
  const normalizedRecommended = normalizeSpecialty(recommendedSpecialty);
  const aliases =
    specialtyAliases[normalizedRecommended as keyof typeof specialtyAliases] || [];

  return unique(
    [
      normalizedRecommended,
      ...aliases,
      ...normalizedRecommended.split(" "),
    ].map(clean),
  );
}

export function findBestSpecialtyMatch(
  recommendedSpecialty: string,
  availableSpecialties: string[],
): string | null {
  const normalizedRecommended = normalizeSpecialty(recommendedSpecialty);
  if (!normalizedRecommended) return null;

  const recommendedTerms = getSpecialtySearchTerms(recommendedSpecialty);

  const exact = availableSpecialties.find(
    (available) => normalizeSpecialty(available) === normalizedRecommended,
  );
  if (exact) return exact;

  const includeMatch = availableSpecialties.find((available) => {
    const availableClean = clean(available);
    return recommendedTerms.some(
      (term) => availableClean.includes(term) || term.includes(availableClean),
    );
  });
  if (includeMatch) return includeMatch;

  const aliasReverseMatch = availableSpecialties.find((available) => {
    const availableNormalized = normalizeSpecialty(available);
    const aliasTerms = getSpecialtySearchTerms(availableNormalized);
    return recommendedTerms.some(
      (term) => aliasTerms.includes(term) || aliasTerms.some((alias) => alias.includes(term) || term.includes(alias)),
    );
  });
  if (aliasReverseMatch) return aliasReverseMatch;

  return null;
}
