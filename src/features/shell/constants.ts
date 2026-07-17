/**
 * Domain vocabulary in one place: the database speaks SCREAMING_SNAKE, every
 * screen speaks English, and the schedule grid needs a stable hue per
 * category. Keeping all three together stops the labels drifting apart
 * between the hospital dashboard and the patient's tablet.
 *
 * Green stays reserved for the brand and for "this went well" states; the
 * other hues exist only to tell schedule blocks apart at a glance.
 */

export type Tone = {
  /** Filled block: soft background + readable text. */
  soft: string;
  /** The saturated edge/dot that identifies the category. */
  strong: string;
};

export const TREATMENT_CATEGORIES: Record<string, { label: string; tone: Tone }> = {
  DOCTOR_VISIT: {
    label: "Doctor Visit",
    tone: { soft: "bg-brand-50 text-brand-800", strong: "bg-brand-500" },
  },
  MEDICATION: {
    label: "Medication",
    tone: { soft: "bg-amber-50 text-amber-800", strong: "bg-amber-500" },
  },
  LAB: {
    label: "Laboratory",
    tone: { soft: "bg-violet-50 text-violet-800", strong: "bg-violet-500" },
  },
  RADIOLOGY: {
    label: "Radiology",
    tone: { soft: "bg-sky-50 text-sky-800", strong: "bg-sky-500" },
  },
  PHYSIO: {
    label: "Physiotherapy",
    tone: { soft: "bg-rose-50 text-rose-800", strong: "bg-rose-500" },
  },
  PROCEDURE: {
    label: "Procedure",
    tone: { soft: "bg-indigo-50 text-indigo-800", strong: "bg-indigo-500" },
  },
  CONTROL: {
    label: "Follow-up",
    tone: { soft: "bg-teal-50 text-teal-800", strong: "bg-teal-500" },
  },
};

export const TREATMENT_STATUS: Record<string, { label: string; chip: string }> = {
  SCHEDULED: { label: "Scheduled", chip: "bg-brand-50 text-brand-700" },
  DONE: { label: "Done", chip: "bg-brand-500 text-white" },
  CANCELLED: { label: "Cancelled", chip: "bg-canvas text-ink-mute" },
  RESCHEDULED: { label: "Rescheduled", chip: "bg-amber-50 text-amber-700" },
};

export const NURSE_REQUEST_CATEGORIES: Record<string, { label: string }> = {
  CALL_NURSE: { label: "Call Nurse" },
  PAIN: { label: "Pain" },
  IV_DRIP: { label: "IV Drip Empty" },
  BATHROOM: { label: "Bathroom Help" },
  DRINKING_WATER: { label: "Drinking Water" },
  EXTRA_BLANKET: { label: "Extra Blanket" },
  OTHER: { label: "Other Help" },
};

export const NURSE_REQUEST_STATUS: Record<string, { label: string; chip: string }> = {
  PENDING: { label: "Waiting", chip: "bg-amber-50 text-amber-700" },
  IN_PROGRESS: { label: "In Progress", chip: "bg-sky-50 text-sky-700" },
  RESOLVED: { label: "Resolved", chip: "bg-brand-50 text-brand-700" },
};

export const PRIORITY: Record<string, { label: string; chip: string; dot: string }> = {
  HIGH: { label: "High priority", chip: "bg-red-50 text-red-700", dot: "bg-red-500" },
  MEDIUM: { label: "Medium priority", chip: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  LOW: { label: "Low priority", chip: "bg-canvas text-ink-soft", dot: "bg-ink-mute" },
};

export const MEAL_SCHEDULES: { value: string; label: string }[] = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "DINNER", label: "Dinner" },
];

export const MEAL_ORDER_STATUS: Record<string, { label: string; chip: string }> = {
  PENDING: { label: "Pending", chip: "bg-amber-50 text-amber-700" },
  PREPARING: { label: "Preparing", chip: "bg-sky-50 text-sky-700" },
  DELIVERED: { label: "Delivered", chip: "bg-brand-50 text-brand-700" },
  REJECTED: { label: "Rejected", chip: "bg-red-50 text-red-700" },
};

export const ADMISSION_STATUS: Record<string, { label: string; chip: string }> = {
  ACTIVE: { label: "Admitted", chip: "bg-brand-50 text-brand-700" },
  DISCHARGED: { label: "Discharged", chip: "bg-canvas text-ink-soft" },
  TRANSFERRED: { label: "Transferred", chip: "bg-amber-50 text-amber-700" },
  DECEASED: { label: "Deceased", chip: "bg-canvas text-ink-mute" },
};

export const MEDICAL_RECORD_TYPES: Record<string, { label: string; tone: Tone }> = {
  ANAMNESIS: { label: "Anamnesis", tone: { soft: "bg-sky-50 text-sky-800", strong: "bg-sky-500" } },
  EXAMINATION: { label: "Examination", tone: { soft: "bg-violet-50 text-violet-800", strong: "bg-violet-500" } },
  DIAGNOSIS: { label: "Diagnosis", tone: { soft: "bg-brand-50 text-brand-800", strong: "bg-brand-500" } },
  PROGRESS: { label: "Progress", tone: { soft: "bg-teal-50 text-teal-800", strong: "bg-teal-500" } },
  ACTION: { label: "Action", tone: { soft: "bg-amber-50 text-amber-800", strong: "bg-amber-500" } },
  OTHER: { label: "Other", tone: { soft: "bg-canvas text-ink-soft", strong: "bg-ink-mute" } },
};

export const NURSE_ASSIGNMENT_ROLES: Record<string, { label: string }> = {
  PRIMARY_NURSE: { label: "Primary nurse" },
  ASSOCIATE_NURSE: { label: "Associate nurse" },
};

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const EDUCATION_TYPES: Record<string, { label: string }> = {
  ARTICLE: { label: "Article" },
  VIDEO: { label: "Video" },
  PDF: { label: "PDF" },
  INFOGRAPHIC: { label: "Infographic" },
};

export const ENTERTAINMENT_CATEGORIES: Record<string, { label: string }> = {
  MOVIE: { label: "Movies" },
  TV: { label: "TV" },
  MUSIC: { label: "Music" },
  PODCAST: { label: "Podcast" },
  EBOOK: { label: "E-Books" },
  MAGAZINE: { label: "Magazines" },
  GAME_LINK: { label: "Games" },
  RELAXATION_VIDEO: { label: "Relaxation" },
  BANNER: { label: "Banner" },
};

export const SPIRITUAL_CATEGORIES: Record<string, { label: string }> = {
  PRAYER_TIME: { label: "Prayer Times" },
  MUROTTAL: { label: "Murottal" },
  DAILY_PRAYER: { label: "Daily Prayers" },
  REFLECTION: { label: "Reflections" },
  OTHER: { label: "Other" },
};

/**
 * The money is still rupiah — currency is not language — but the grouping is
 * en-US, because "Rp 25.000" on an English page reads as twenty-five rupiah to
 * anyone who expects a dot to be a decimal point.
 */
export const formatRupiah = (value: number | string | null | undefined) =>
  `Rp ${Number(value ?? 0).toLocaleString("en-US")}`;

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
