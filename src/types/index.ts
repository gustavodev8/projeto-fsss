// Tipos compartilhados da aplicação FSSS — Sistema de Reservas
// Estas interfaces espelham diretamente as tabelas do banco de dados.

export type UserRole = "admin" | "professor";

export interface User {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
}

export type ItemCategory = "espacos" | "instrumentos";

export interface ReservableItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  image: string;
  available: boolean;
  /** Apenas para instrumentos. Null/undefined = espaço (unidade única). */
  totalUnits?: number;
  availableUnits?: number;
}

export interface TimeSlot {
  label: string;   // ex: "07:00 – 07:50"
  start: string;   // "07:00"
  end: string;     // "07:50"
  isBreak: boolean;
}

export interface Reservation {
  id: string;
  /** Agrupa espaço + instrumentos reservados na mesma operação. */
  groupId?: string;
  itemId: string;
  itemName: string;
  date: string;       // "YYYY-MM-DD"
  slots: string[];    // labels dos horários selecionados
  quantity?: number;  // relevante para instrumentos
  category: ItemCategory;
  userName?: string;
  userEmail?: string;
  cancelledAt?: string;
}
