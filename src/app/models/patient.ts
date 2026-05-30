export interface PatientsRequestDTO {
  name: string;
  surname: string;
  birthDay: string;
  cellPhone: string;
  genre: 'masculino' | 'femenino';
  observation?: string;
}

export interface SessionData {
  sessionDate: string;
  sessionDateEnd: string;
  pay: boolean;
}

export interface Patient {
  id: number;
  name: string;
  surname: string;
  startDate: string;
  endDate: string | null;
  birthDay: string;
  cellPhone: string;
  genre: string;
  observations: string[];
  sessions?: SessionData[];
}

export interface PatientObservationsDTO {
  patient: Patient;
  observations: string[];
}
