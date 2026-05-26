export interface SessionRequestDTO {
  dateSession: string;
  dateSessionEnd: string;
  observatory: string;
  observatorySummary: string;
  idPatient: number;
}

export interface SessionWithPatientDTO {
  id: number;
  dateSession: string;
  dateSessionEnd: string;
  observation: string;
  observationSummary: string;
  pay: boolean;
  patientId: number;
  patientName: string;
  patientSurname: string;
}

export interface WeeklySession {
  session: SessionWithPatientDTO;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  dayIndex: number;
  durationMinutes: number;
}
