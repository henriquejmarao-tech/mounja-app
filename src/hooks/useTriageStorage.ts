const TRIAGE_KEY = "mounja_triage_data";

export interface TriageData {
  experience: string;
  motivations: string[];
  helpNeeds: string[];
  doseValue: string;
  injectionSite: string;
  alternatesSites: boolean | null;
  frequency: "daily" | "weekly" | "custom";
  applicationDay: number;
  customIntervalDays: number;
  lastApplicationDate: string;
  name: string;
  sex: string;
  heightCm: number;
  birthYear: number;
  weightKg: number;
  weightDecimal: number;
  goalKg: number;
  goalDecimal: number;
}

export const saveTriageData = (data: TriageData) => {
  localStorage.setItem(TRIAGE_KEY, JSON.stringify(data));
};

export const getTriageData = (): TriageData | null => {
  const raw = localStorage.getItem(TRIAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearTriageData = () => {
  localStorage.removeItem(TRIAGE_KEY);
};

export const hasTriageData = (): boolean => {
  return !!localStorage.getItem(TRIAGE_KEY);
};
