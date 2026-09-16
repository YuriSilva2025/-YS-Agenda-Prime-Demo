import { Appointment } from './api';

const dateKey = (d: Date) => d.toISOString().slice(0, 10);
export const receiptDate = (s: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(s));
export function earnings(appointments: Appointment[], today: string, mode: 'week' | 'month') {
    const date = new Date(today + 'T12:00:00Z');
    if (mode === 'week') date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
    else date.setUTCDate(1);
    return Array.from({ length: 6 }, (_, i) => {
        const start = new Date(date), end = new Date(date);
        if (mode === 'week') { start.setUTCDate(start.getUTCDate() - (5 - i) * 7); end.setTime(start.getTime()); end.setUTCDate(end.getUTCDate() + 7); }
        else { start.setUTCMonth(start.getUTCMonth() - (5 - i)); end.setUTCFullYear(start.getUTCFullYear(), start.getUTCMonth() + 1, 1); }
        const from = dateKey(start), until = dateKey(end);
        const receipts = appointments.filter(a => a.payment && receiptDate(a.payment.receivedAt) >= from && receiptDate(a.payment.receivedAt) < until && receiptDate(a.payment.receivedAt) <= today);
        return { from, until, total: Math.round(receipts.reduce((n, a) => n + a.payment!.amount * 100, 0)) / 100, count: receipts.length };
    });
}

