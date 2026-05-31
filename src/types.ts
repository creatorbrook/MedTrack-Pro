export interface Medication {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  times: string[]; // array of "HH:MM"
  frequency: 'daily' | 'weekly' | 'custom';
  color: string; // Tailwind bg-color or accent hex
  pillsLeft?: number;
  pillsLeftThreshold?: number;
  active: boolean;
  createdAt: string;
}

export type IntakeStatus = 'taken' | 'missed' | 'skipped';

export interface IntakeLog {
  medId: string;
  time: string; // "HH:MM"
  date: string; // "YYYY-MM-DD"
  status: IntakeStatus;
  loggedAt: string; // ISO string
}
