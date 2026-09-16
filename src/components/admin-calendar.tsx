"use client";
import { Calendar, money } from '@/lib/api';
import { demoMonths } from '@/lib/demo';

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (d: string) => new Date(d + 'T12:00:00');
export function Dashboard({ data, today, onAgenda, demo = false }: { data: Calendar; today: string; onAgenda: () => void; demo?: boolean }) {
    const confirmed = data.appointments.filter(a => a.status === 'confirmed');
    const month = confirmed.filter(a => a.date.startsWith(today.slice(0, 7)));
    const demoMonth = demoMonths[demoMonths.length - 1];
    const nowTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
    const next = confirmed.filter(a => a.date > today || (a.date === today && a.time >= nowTime)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5);
    return <><p className="muted">Um olhar sobre o seu dia e o movimento deste mês.</p><div className="stats dashboard-stats">
        <article><span>Reservas de hoje</span><strong>{confirmed.filter(a => a.date === today).length}</strong><small>Agendamentos confirmados</small></article>
        <article><span>Reservas do mês</span><strong>{demo ? demoMonth.count : month.length}</strong><small>{today && parse(today).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</small></article>
        <article><span>Valor previsto no mês</span><strong>{money(demo ? demoMonth.total : month.reduce((n, a) => n + a.price, 0))}</strong><small>{demo ? 'Dados fictícios para apresentação' : 'Somente reservas confirmadas'}</small></article>
    </div><div className="section-heading"><h2>Próximos agendamentos</h2><button className="text-button" onClick={onAgenda}>Abrir agenda →</button></div>
    {next.length ? <div className="appointment-list">{next.map(a => <article className="appointment" key={a.id}><strong className="appointment-time">{a.time}</strong><div><h3>{a.name}</h3><p>{a.service} · {parse(a.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</p></div><strong>{money(a.price)}</strong></article>)}</div> : <div className="calendar-empty">Sua agenda está livre por enquanto.<p>As próximas reservas aparecerão aqui.</p></div>}</>;
}

export default function AdminCalendar({ data, date, onSelect }: { data: Calendar; date: string; onSelect: (date: string) => void }) {
    const first = parse(date.slice(0, 7) + '-01');
    if (!date) return null;
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const move = (delta: number) => onSelect(key(new Date(first.getFullYear(), first.getMonth() + delta, 1)));
    return <section className="month-calendar" aria-label="Calendário da agenda"><div className="calendar-toolbar"><div><p className="eyebrow">SUA AGENDA</p><h2 aria-live="polite">{first.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2></div><div className="calendar-controls"><button type="button" aria-label="Mês anterior" onClick={() => move(-1)}>‹</button><button type="button" onClick={() => { onSelect(today); }}>Hoje</button><button type="button" aria-label="Próximo mês" onClick={() => move(1)}>›</button></div></div>
        <div className="calendar-weekdays">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <span key={d}>{d}</span>)}</div>
        <div className="calendar-grid">{Array.from({ length: first.getDay() }, (_, i) => <div className="calendar-padding" key={'blank' + i} />)}{Array.from({ length: days }, (_, i) => {
            const day = new Date(first.getFullYear(), first.getMonth(), i + 1), value = key(day);
            const blocks = data.blocks.filter(b => b.date === value).sort((a, b) => a.start - b.start);
            const fullBlock = data.settings.periods.every(p => { let end = p.start; for (const b of blocks) { if (b.start <= end) end = Math.max(end, b.end); } return end >= p.end; });
            const off = !data.settings.days.includes(day.getDay()) || fullBlock;
            const count = data.appointments.filter(a => a.date === value && a.status === 'confirmed').length;
            const label = off ? 'Indisponível' : blocks.length ? 'Bloqueio parcial' : 'Expediente';
            return <button type="button" key={value} className={`calendar-day ${off ? 'day-off' : ''} ${date === value ? 'day-selected' : ''} ${value === today ? 'day-today' : ''}`} aria-pressed={date === value} aria-current={value === today ? 'date' : undefined} aria-label={`${day.toLocaleDateString('pt-BR')}, ${label}, ${count} reservas`} onClick={() => onSelect(value)}><strong>{i + 1}</strong><span className="day-label">{label}</span>{count > 0 && <span className="day-count">{count}<span> reserva{count > 1 ? 's' : ''}</span></span>}</button>;
        })}</div><div className="calendar-legend"><span><i />Expediente</span><span><i className="legend-off" />Indisponível</span><span><i className="legend-selected" />Selecionado</span></div><p className="calendar-hint">Selecione um dia para ver os horários. Dias escuros indicam folgas ou bloqueio de todo o expediente.</p></section>;
}


