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
  groupId?: string; // agrupa espaço + instrumentos reservados juntos
  itemId: string;
  itemName: string;
  date: string;
  slots: string[];
  quantity?: number;
  category: "espacos" | "instrumentos";
}

export const espacos: ReservableItem[] = [
  { id: "e1",  name: "Sala de Vídeo",         description: "Sala equipada com TV de grande porte e sistema de som para exibição de vídeos e apresentações.",  category: "espacos", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=300&fit=crop", available: true },
  { id: "e2",  name: "Espaço Irmã Rosa",       description: "Salão multiuso amplo, ideal para reuniões, eventos e atividades em grupo.",                          category: "espacos", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop", available: true },
  { id: "e3",  name: "Espaço Irmã Jovina",     description: "Espaço versátil para palestras, dinâmicas e atividades formativas.",                                  category: "espacos", image: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=400&h=300&fit=crop", available: true },
  { id: "e4",  name: "Espaço do Churrasco",    description: "Área externa coberta com churrasqueiras, mesas e espaço para confraternizações.",                     category: "espacos", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop", available: true },
  { id: "e5",  name: "Espaço Verde",           description: "Área aberta com jardim, ideal para atividades ao ar livre e momentos de integração.",                 category: "espacos", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop", available: true },
  { id: "e6",  name: "Sala de Vidro",          description: "Sala moderna com paredes de vidro, climatizada, para reuniões e atendimentos.",                       category: "espacos", image: "https://images.unsplash.com/photo-1497366754035-f200968a333e?w=400&h=300&fit=crop", available: true },
  { id: "e7",  name: "Biblioteca",             description: "Biblioteca com acervo completo e espaço de leitura e estudo.",                                         category: "espacos", image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop", available: true },
  { id: "e8",  name: "Sala de Informática 1",  description: "Laboratório de informática com 30 computadores e internet de alta velocidade.",                        category: "espacos", image: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=400&h=300&fit=crop", available: true },
  { id: "e9",  name: "Sala de Informática 2",  description: "Laboratório de informática com 30 computadores e internet de alta velocidade.",                        category: "espacos", image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop", available: true },
  { id: "e10", name: "Laboratório de Química", description: "Laboratório equipado com bancadas, vidrarias e reagentes para experimentos.",                          category: "espacos", image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop", available: true },
  { id: "e11", name: "Laboratório de Física",  description: "Laboratório com equipamentos para experimentos de física e demonstrações científicas.",                 category: "espacos", image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=300&fit=crop", available: true },
  { id: "e12", name: "Sala de Enfermagem",     description: "Sala equipada para práticas de enfermagem, com materiais e manequins de simulação.",                   category: "espacos", image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop", available: true },
  { id: "e13", name: "Sala de Podcast",        description: "Estúdio de podcast com isolamento acústico, microfones e mesa de som.",                                category: "espacos", image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=300&fit=crop", available: true },
];

export const instrumentos: ReservableItem[] = [
  { id: "i1", name: "Microfone",     description: "Microfone com fio para apresentações, aulas e eventos.",                    category: "instrumentos", image: "https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=400&h=300&fit=crop", available: true, totalUnits: 4,  availableUnits: 4  },
  { id: "i2", name: "Notebook",      description: "Notebook para uso em aulas, apresentações e atividades acadêmicas.",         category: "instrumentos", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop", available: true, totalUnits: 10, availableUnits: 10 },
  { id: "i3", name: "Caixa de Som",  description: "Caixa de som amplificada 500W com entrada USB, Bluetooth e microfone.",     category: "instrumentos", image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=300&fit=crop", available: true, totalUnits: 15, availableUnits: 15 },
  { id: "i4", name: "Projetor",      description: "Projetor multimídia 3.500 lumens com HDMI e VGA para salas de aula.",        category: "instrumentos", image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=300&fit=crop", available: true, totalUnits: 5,  availableUnits: 5  },
];

export interface TimeSlot {
  label: string;
  start: string;
  end: string;
  isBreak: boolean;
}

export const timeSlots: TimeSlot[] = [
  // Manhã
  { label: "07:00 – 07:50", start: "07:00", end: "07:50", isBreak: false },
  { label: "07:50 – 08:40", start: "07:50", end: "08:40", isBreak: false },
  { label: "08:40 – 09:30", start: "08:40", end: "09:30", isBreak: false },
  { label: "09:30 – 09:50", start: "09:30", end: "09:50", isBreak: true },
  { label: "09:50 – 10:40", start: "09:50", end: "10:40", isBreak: false },
  { label: "10:40 – 11:30", start: "10:40", end: "11:30", isBreak: false },
  { label: "11:30 – 12:20", start: "11:30", end: "12:20", isBreak: false },
  // Tarde
  { label: "13:00 – 13:50", start: "13:00", end: "13:50", isBreak: false },
  { label: "13:50 – 14:40", start: "13:50", end: "14:40", isBreak: false },
  { label: "14:40 – 15:30", start: "14:40", end: "15:30", isBreak: false },
  { label: "15:30 – 15:50", start: "15:30", end: "15:50", isBreak: true },
  { label: "15:50 – 16:40", start: "15:50", end: "16:40", isBreak: false },
  { label: "16:40 – 17:30", start: "16:40", end: "17:30", isBreak: false },
];
