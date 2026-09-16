export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  minutes: number;
  active: boolean;
};

export type Appointment = {
  id: string;
  userId: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  service: string;
  price: number;
  minutes: number;
  status: 'confirmed' | 'cancelled';
  serviceId?: string;
  items?: { serviceId: string; name: string; price: number; minutes: number }[];
  source?: string;
  note?: string;
  payment?: { amount: number; receivedAt: string };
};

export type Settings = {
  enabled: boolean;
  days: number[];
  periods: { start: number; end: number }[];
  advanceDays: number;
};

export type Block = {
  id: string;
  date: string;
  start: number;
  end: number;
};

export type Calendar = {
  services: Service[];
  settings: Settings;
  appointments: Appointment[];
  blocks: Block[];
};

export const money = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const dateLabel = (d: string) => new Date(d + 'T12:00:00-03:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', weekday: 'short', timeZone: 'America/Sao_Paulo' });
export const clock = (n: number) => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
export const minute = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
