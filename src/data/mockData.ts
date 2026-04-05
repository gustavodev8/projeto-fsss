export interface ReservableItem {
  id: string;
  name: string;
  description: string;
  category: "espacos" | "instrumentos";
  image: string;
  available: boolean;
  totalUnits?: number;
  availableUnits?: number;
}

export interface Reservation {
  id: string;
  itemId: string;
  itemName: string;
  date: string;
  slots: string[];
  quantity?: number;
  category: "espacos" | "instrumentos";
}

export const espacos: ReservableItem[] = [
  { id: "e1", name: "Sala 12", description: "Sala de aula padrão com projetor e ar-condicionado. Capacidade: 40 alunos.", category: "espacos", image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop", available: true },
  { id: "e2", name: "Laboratório de Ciências", description: "Laboratório equipado com bancadas, microscópios e reagentes.", category: "espacos", image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop", available: true },
  { id: "e3", name: "Auditório", description: "Auditório com capacidade para 200 pessoas, palco e sistema de som.", category: "espacos", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop", available: false },
  { id: "e4", name: "Quadra Poliesportiva", description: "Quadra coberta para futsal, vôlei e basquete.", category: "espacos", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop", available: true },
  { id: "e5", name: "Sala de Música", description: "Sala acústica com piano, estantes e isolamento sonoro.", category: "espacos", image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=300&fit=crop", available: true },
  { id: "e6", name: "Biblioteca", description: "Biblioteca com acervo de 5.000 livros e espaço de leitura.", category: "espacos", image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop", available: true },
  { id: "e7", name: "Laboratório de Informática", description: "30 computadores com internet de alta velocidade.", category: "espacos", image: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=400&h=300&fit=crop", available: false },
  { id: "e8", name: "Sala de Artes", description: "Espaço amplo com cavaletes, pias e material de arte.", category: "espacos", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop", available: true },
];

export const instrumentos: ReservableItem[] = [
  { id: "i1", name: "Projetor Epson", description: "Projetor multimídia 3.500 lumens com HDMI e VGA.", category: "instrumentos", image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=300&fit=crop", available: true, totalUnits: 5, availableUnits: 3 },
  { id: "i2", name: "Violão Nº 3", description: "Violão clássico Yamaha, cordas de nylon.", category: "instrumentos", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop", available: true, totalUnits: 8, availableUnits: 5 },
  { id: "i3", name: "Caixa de Som Amplificada", description: "Caixa de som 500W com microfone sem fio.", category: "instrumentos", image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=300&fit=crop", available: true, totalUnits: 3, availableUnits: 1 },
  { id: "i4", name: "Notebook Dell", description: "Notebook Dell Inspiron i5, 8GB RAM, 256GB SSD.", category: "instrumentos", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop", available: false, totalUnits: 10, availableUnits: 0 },
  { id: "i5", name: "Teclado Musical", description: "Teclado Casio CTK-3500 com 61 teclas.", category: "instrumentos", image: "https://images.unsplash.com/photo-1520523839897-bd33c68d826a?w=400&h=300&fit=crop", available: true, totalUnits: 2, availableUnits: 2 },
  { id: "i6", name: "Microscópio Binocular", description: "Microscópio óptico com aumento de até 1000x.", category: "instrumentos", image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=300&fit=crop", available: true, totalUnits: 6, availableUnits: 4 },
  { id: "i7", name: "Kit Robótica", description: "Kit LEGO Mindstorms para aulas de programação.", category: "instrumentos", image: "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=400&h=300&fit=crop", available: true, totalUnits: 4, availableUnits: 2 },
  { id: "i8", name: "Câmera DSLR", description: "Câmera Canon T7i com lente 18-55mm.", category: "instrumentos", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop", available: true, totalUnits: 2, availableUnits: 1 },
];

export interface TimeSlot {
  label: string;
  start: string;
  end: string;
  isBreak: boolean;
}

export const timeSlots: TimeSlot[] = [
  { label: "07:50 – 08:40", start: "07:50", end: "08:40", isBreak: false },
  { label: "08:40 – 09:30", start: "08:40", end: "09:30", isBreak: false },
  { label: "09:30 – 10:20", start: "09:30", end: "10:20", isBreak: false },
  { label: "10:20 – 10:35", start: "10:20", end: "10:35", isBreak: true },
  { label: "10:35 – 11:25", start: "10:35", end: "11:25", isBreak: false },
  { label: "11:25 – 12:15", start: "11:25", end: "12:15", isBreak: false },
  { label: "12:15 – 13:05", start: "12:15", end: "13:05", isBreak: false },
  { label: "13:05 – 13:55", start: "13:05", end: "13:55", isBreak: true },
  { label: "13:55 – 14:45", start: "13:55", end: "14:45", isBreak: false },
  { label: "14:45 – 15:35", start: "14:45", end: "15:35", isBreak: false },
  { label: "15:35 – 16:25", start: "15:35", end: "16:25", isBreak: false },
  { label: "16:25 – 17:15", start: "16:25", end: "17:15", isBreak: false },
];
