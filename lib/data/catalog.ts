export type StaffProfile = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
  initials: string;
  profileId: string;
  colorClass: string;
};

export const staffDirectory: StaffProfile[] = [
  {
    id: "sasha",
    name: "Sasha Taylor",
    role: "Master Groomer",
    avatar: "https://avatars.dicebear.com/api/initials/ST.svg",
    bio: "Specialises in hand scissoring and anxious pups.",
    initials: "ST",
    profileId: "staff-sasha",
    colorClass:
      "bg-gradient-to-br from-amber-200/80 via-amber-300/70 to-amber-400/80 text-slate-900",
  },
  {
    id: "myles",
    name: "Myles Chen",
    role: "Senior Groomer",
    avatar: "https://avatars.dicebear.com/api/initials/MC.svg",
    bio: "Loves double coats, creative colour and doodles.",
    initials: "MC",
    profileId: "staff-myles",
    colorClass:
      "bg-gradient-to-br from-brand-bubble/80 via-brand-bubble/70 to-brand-lavender/80 text-slate-900",
  },
  {
    id: "imani",
    name: "Imani Hart",
    role: "Pet Stylist",
    avatar: "https://avatars.dicebear.com/api/initials/IH.svg",
    bio: "Speedy with bath & tidy packages and small breeds.",
    initials: "IH",
    profileId: "staff-imani",
    colorClass:
      "bg-gradient-to-br from-emerald-300/80 via-emerald-400/70 to-emerald-500/80 text-slate-900",
  },
];

export type ServiceSize = { id: string; label: string; multiplier: number };

export type ServiceDefinition = {
  id: string;
  name: string;
  duration: number;
  basePrice: number;
  sizes: ServiceSize[];
  color: string;
};

export const serviceCatalog: ServiceDefinition[] = [
  {
    id: "full-groom",
    name: "Full Groom",
    duration: 90,
    basePrice: 85,
    color: "bg-gradient-to-r from-brand-bubble/40 via-brand-bubble/25 to-transparent text-white",
    sizes: [
      { id: "toy", label: "Toy", multiplier: 1 },
      { id: "small", label: "Small", multiplier: 1.2 },
      { id: "medium", label: "Medium", multiplier: 1.45 },
      { id: "large", label: "Large", multiplier: 1.75 },
    ],
  },
  {
    id: "bath-tidy",
    name: "Bath & Tidy",
    duration: 70,
    basePrice: 60,
    color: "bg-gradient-to-r from-sky-400/40 via-sky-400/20 to-transparent text-white",
    sizes: [
      { id: "toy", label: "Toy", multiplier: 1 },
      { id: "small", label: "Small", multiplier: 1.1 },
      { id: "medium", label: "Medium", multiplier: 1.25 },
      { id: "large", label: "Large", multiplier: 1.5 },
    ],
  },
  {
    id: "paw-spa",
    name: "Paw Spa Package",
    duration: 45,
    basePrice: 45,
    color: "bg-gradient-to-r from-amber-400/50 via-amber-400/25 to-transparent text-white",
    sizes: [
      { id: "toy", label: "Toy", multiplier: 1 },
      { id: "small", label: "Small", multiplier: 1.15 },
      { id: "medium", label: "Medium", multiplier: 1.3 },
      { id: "large", label: "Large", multiplier: 1.5 },
    ],
  },
];

export type AddOnDefinition = { id: string; name: string; price: number };

export const addOnCatalog: AddOnDefinition[] = [
  { id: "teeth", name: "Teeth brushing", price: 12 },
  { id: "pawdicure", name: "Pawdicure", price: 18 },
  { id: "shed-guard", name: "Shed Guard Treatment", price: 20 },
  { id: "blueberry", name: "Blueberry facial", price: 15 },
];
