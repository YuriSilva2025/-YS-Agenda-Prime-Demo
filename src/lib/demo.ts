import type { Appointment, Calendar, Service, Settings } from './api';

export type DemoClient = {
  id: string;
  name: string;
  phone: string;
  source: 'online' | 'presencial';
  visits: number;
  total: number;
};

export type DemoMonth = {
  label: string;
  total: number;
  count: number;
};

export const DEMO_TODAY = '2026-09-15';
export const DEMO_BRAND = 'Agenda Prime';

export const demoMonths: DemoMonth[] = [
  { label: 'Jun/26', total: 7220, count: 93 },
  { label: 'Jul/26', total: 8040, count: 104 },
  { label: 'Ago/26', total: 7680, count: 98 },
  { label: 'Set/26', total: 4920, count: 61 },
];

export const demoClients: DemoClient[] = [
  { id: 'c1', name: 'Lucas Mendes', phone: '14997881234', source: 'online', visits: 8, total: 520 },
  { id: 'c2', name: 'Marina Alves', phone: '14996554432', source: 'online', visits: 6, total: 430 },
  { id: 'c3', name: 'Rafael Souza', phone: '14997112233', source: 'presencial', visits: 5, total: 390 },
  { id: 'c4', name: 'Camila Ferreira', phone: '14998887766', source: 'online', visits: 4, total: 310 },
  { id: 'c5', name: 'João Silva', phone: '14995556677', source: 'presencial', visits: 3, total: 240 },
  { id: 'c6', name: 'Bianca Costa', phone: '14996667788', source: 'online', visits: 3, total: 225 },
];

const services: Service[] = [
  { id: 'essential', name: 'Atendimento Essencial', description: 'Serviço principal do negócio, adaptável ao seu segmento.', price: 40, minutes: 30, active: true },
  { id: 'premium', name: 'Atendimento Premium', description: 'Versão completa com mais tempo e atenção aos detalhes.', price: 60, minutes: 45, active: true },
  { id: 'complete', name: 'Pacote Completo', description: 'Combinação de serviços em um único horário.', price: 85, minutes: 60, active: true },
  { id: 'extra', name: 'Serviço Adicional', description: 'Adicional rápido que pode ser incluído durante o atendimento.', price: 25, minutes: 20, active: true },
];

const settings: Settings = {
  enabled: true,
  days: [1, 2, 3, 4, 5, 6],
  periods: [
    { start: 8 * 60, end: 12 * 60 },
    { start: 13 * 60 + 30, end: 19 * 60 },
  ],
  advanceDays: 45,
};

const makePayment = (date: string, amount: number) => ({ amount, receivedAt: `${date}T18:00:00-03:00` });

const appointments: Appointment[] = [
  { id: 'demo-001', userId: 'c1', name: 'Lucas Mendes', phone: '14997881234', date: '2026-09-15', time: '09:00', serviceId: 'premium', service: 'Atendimento Premium', items: [{serviceId:'premium',name:'Atendimento Premium',price:60,minutes:45}], price: 60, minutes: 45, status: 'confirmed', source:'online', payment: makePayment('2026-09-15', 60) },
  { id: 'demo-002', userId: 'c4', name: 'Camila Ferreira', phone: '14998887766', date: '2026-09-15', time: '10:30', service: 'Pacote Completo', price: 85, minutes: 60, status: 'confirmed' },
  { id: 'demo-003', userId: 'c3', name: 'Rafael Souza', phone: '14997112233', date: '2026-09-15', time: '14:00', serviceId: 'essential', service: 'Atendimento Essencial + Serviço Adicional', items: [{serviceId:'essential',name:'Atendimento Essencial',price:40,minutes:30},{serviceId:'extra',name:'Serviço Adicional',price:25,minutes:20}], price: 65, minutes: 50, status: 'confirmed', source:'walk-in', note:'Cliente chegou sem agendamento', payment: makePayment('2026-09-15', 65) },
  { id: 'demo-004', userId: 'c2', name: 'Marina Alves', phone: '14996554432', date: '2026-09-16', time: '08:30', service: 'Atendimento Premium', price: 60, minutes: 45, status: 'confirmed' },
  { id: 'demo-005', userId: 'c6', name: 'Bianca Costa', phone: '14996667788', date: '2026-09-16', time: '11:00', service: 'Atendimento Essencial', price: 40, minutes: 30, status: 'confirmed' },
  { id: 'demo-006', userId: 'c5', name: 'João Silva', phone: '14995556677', date: '2026-09-17', time: '15:30', service: 'Pacote Completo', price: 85, minutes: 60, status: 'confirmed' },
  { id: 'demo-007', userId: 'c1', name: 'Lucas Mendes', phone: '14997881234', date: '2026-09-18', time: '17:00', service: 'Atendimento Premium', price: 60, minutes: 45, status: 'confirmed' },
  { id: 'demo-008', userId: 'c4', name: 'Camila Ferreira', phone: '14998887766', date: '2026-09-19', time: '10:00', service: 'Serviço Adicional', price: 25, minutes: 20, status: 'confirmed' },
  { id: 'hist-aug-1', userId: 'c2', name: 'Marina Alves', phone: '14996554432', date: '2026-08-28', time: '14:00', service: 'Pacote Completo', price: 85, minutes: 60, status: 'confirmed', payment: makePayment('2026-08-28', 85) },
  { id: 'hist-aug-2', userId: 'c3', name: 'Rafael Souza', phone: '14997112233', date: '2026-08-29', time: '09:30', service: 'Atendimento Premium', price: 60, minutes: 45, status: 'confirmed', payment: makePayment('2026-08-29', 60) },
];

export const seedCalendar: Calendar = {
  services,
  settings,
  appointments,
  blocks: [
    { id: 'b1', date: '2026-09-17', start: 12 * 60, end: 14 * 60 },
    { id: 'b2', date: '2026-09-21', start: 8 * 60, end: 12 * 60 },
  ],
};

const STORAGE_KEY = 'ys-agenda-prime-demo-final-v1';

export function loadDemoCalendar(): Calendar {
  if (typeof window === 'undefined') return structuredClone(seedCalendar);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as Calendar;
  } catch {}
  return structuredClone(seedCalendar);
}

export function saveDemoCalendar(data: Calendar) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('ys-demo-change'));
}

export function resetDemoCalendar(): Calendar {
  const fresh = structuredClone(seedCalendar);
  saveDemoCalendar(fresh);
  return fresh;
}

export function demoAvailableTimes(date: string, service: Service, data: Calendar) {
  if (!date || !service || !data.settings.enabled) return [];
  const day = new Date(`${date}T12:00:00`).getDay();
  if (!data.settings.days.includes(day)) return [];
  const duration = service.minutes;
  const taken = data.appointments.filter(a => a.date === date && a.status === 'confirmed');
  const blocks = data.blocks.filter(b => b.date === date);
  const result: string[] = [];
  for (const period of data.settings.periods) {
    for (let start = period.start; start + duration <= period.end; start += 30) {
      const end = start + duration;
      const overlapsAppointment = taken.some(a => {
        const [h, m] = a.time.split(':').map(Number);
        const aStart = h * 60 + m;
        const aEnd = aStart + a.minutes;
        return start < aEnd && end > aStart;
      });
      const overlapsBlock = blocks.some(b => start < b.end && end > b.start);
      if (!overlapsAppointment && !overlapsBlock) {
        result.push(`${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`);
      }
    }
  }
  return result;
}

export function addDemoAppointment(data: Calendar, appointment: Appointment): Calendar {
  const next = { ...data, appointments: [...data.appointments, appointment] };
  saveDemoCalendar(next);
  return next;
}
