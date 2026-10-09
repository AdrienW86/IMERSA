/** Validation partagée (client et serveur) des demandes de démonstration. */

export interface DemoRequest {
  name: string;
  company: string;
  email: string;
  phone: string;
  profile: string;
  message: string;
}

export const profiles = [
  "Agence immobilière",
  "Réseau immobilier",
  "Promoteur",
  "Immobilier de prestige",
  "Autre",
] as const;

export type FieldErrors = Partial<Record<keyof DemoRequest | "consent", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateDemoRequest(input: Record<string, unknown>): {
  data: DemoRequest | null;
  errors: FieldErrors;
} {
  const str = (k: string, max: number) => String(input[k] ?? "").trim().slice(0, max);
  const data: DemoRequest = {
    name: str("name", 120),
    company: str("company", 160),
    email: str("email", 200),
    phone: str("phone", 40),
    profile: str("profile", 60),
    message: str("message", 2000),
  };
  const errors: FieldErrors = {};
  if (data.name.length < 2) errors.name = "Indiquez votre nom.";
  if (data.company.length < 2) errors.company = "Indiquez votre société.";
  if (!EMAIL.test(data.email)) errors.email = "Adresse e-mail invalide.";
  if (data.phone && !/^[+\d\s().-]{6,}$/.test(data.phone)) errors.phone = "Numéro de téléphone invalide.";
  if (!profiles.includes(data.profile as (typeof profiles)[number])) errors.profile = "Choisissez votre activité.";
  if (input.consent !== true && input.consent !== "on") {
    errors.consent = "Votre accord est nécessaire pour être recontacté.";
  }
  return { data: Object.keys(errors).length ? null : data, errors };
}
