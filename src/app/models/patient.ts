export interface PatientsRequestDTO {
  name: string;
  surname: string;
  birthDay: string;
  cellPhone: string;
  genre: 'masculino' | 'femenino';
  observation?: string;
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
}

export interface PatientObservationsDTO {
  patient: Patient;
  observations: string[];
}
