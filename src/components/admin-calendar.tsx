"use client";
import { Calendar, money } from '@/lib/api';
import { demoMonths } from '@/lib/demo';

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (d: string) => new Date(d + 'T12:00:00');
export function Dashboard({ data, today, onAgenda, demo = false }: { data: Calendar; today: string; onAgenda: () => void; demo?: boolean }) {
    const confirmed = data.appointments.filter(a => a.status === 'confirmed');
    const todayAppointments = confirmed.filter(a => a.date === today).sort((a, b) => a.time.localeCompare(b.time));
    const month = confirmed.filter(a => a.date.startsWith(today.slice(0, 7)));
    const demoMonth = demoMonths[demoMonths.length - 1];
    const todayRevenue = todayAppointments.reduce((n, a) => n + (a.payment?.amount ?? 0), 0);
    const nowTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
    const next = confirmed.filter(a => a.date > today || (a.date === today && a.time >= nowTime)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5);
    const workMinutes = data.settings.periods.reduce((sum, period) => sum + Math.max(0, period.end - period.start), 0);
    const bookedMinutes = todayAppointments.reduce((sum, appointment) => sum + appointment.minutes, 0);
    const freeMinutes = Math.max(0, workMinutes - bookedMinutes);
    const freeHours = freeMinutes / 60;
    const freeLabel = freeHours % 1 === 0 ? `${freeHours.toFixed(0)}h` : `${freeHours.toFixed(1).replace('.', ',')}h`;

    return <section className="dashboard-modern">
      <div className="dashboard-welcome">
        <div>
          <p className="eyebrow">RESUMO DO NEGÓCIO</p>
          <h2>Olá! Aqui está o movimento de hoje.</h2>
        </div>
        <button className="dashboard-period" type="button">Hoje</button>
      </div>

      <div className="dashboard-kpis">
        <article className="dashboard-kpi">
          <span className="dashboard-kpi-icon">◫</span>
          <span>Agendamentos</span>
          <strong>{todayAppointments.length}</strong>
          <small>Confirmados hoje</small>
        </article>
        <article className="dashboard-kpi">
          <span className="dashboard-kpi-icon">◷</span>
          <span>Horários disponíveis</span>
          <strong>{freeLabel}</strong>
          <small>Livre no expediente</small>
        </article>
        <article className="dashboard-kpi">
          <span className="dashboard-kpi-icon">↗</span>
          <span>Faturamento</span>
          <strong>{money(todayRevenue)}</strong>
          <small>Recebido hoje</small>
        </article>
      </div>

      <section className="dashboard-card">
        <div className="dashboard-card-head">
          <div>
            <p className="eyebrow">AGENDA</p>
            <h3>Atendimentos de hoje</h3>
          </div>
          <button className="dashboard-chip" type="button" onClick={onAgenda}>Ver agenda</button>
        </div>
        {todayAppointments.length ? <div className="dashboard-agenda-list">
          {todayAppointments.slice(0, 5).map(a => <button className="dashboard-agenda-row" type="button" key={a.id} onClick={onAgenda}>
            <strong>{a.time}</strong>
            <span>{a.service}</span>
            <span className="dashboard-client">{a.name}</span>
            <span className="dashboard-status">Agendado</span>
          </button>)}
        </div> : <div className="calendar-empty">Sua agenda está livre hoje.<p>Os atendimentos do dia aparecerão aqui.</p></div>}
      </section>

      <section className="dashboard-card dashboard-finance">
        <div className="dashboard-card-head">
          <div>
            <p className="eyebrow">RESUMO FINANCEIRO</p>
            <h3>Financeiro de hoje</h3>
          </div>
          <span className="dashboard-chip">Hoje</span>
        </div>
        <div className="dashboard-finance-message">◎ <strong>Financeiro saudável hoje.</strong></div>
        <div className="dashboard-finance-grid">
          <div><span>Entrou</span><strong>{money(todayRevenue)}</strong></div>
          <div><span>Saiu</span><strong>{money(0)}</strong></div>
          <div><span>Resultado</span><strong>{money(todayRevenue)}</strong></div>
        </div>
      </section>

      <section className="dashboard-card dashboard-month">
        <div className="dashboard-card-head">
          <div>
            <p className="eyebrow">VISÃO DO MÊS</p>
            <h3>Desempenho acumulado</h3>
          </div>
        </div>
        <div className="dashboard-month-grid">
          <div><span>Reservas</span><strong>{demo ? demoMonth.count : month.length}</strong></div>
          <div><span>Valor previsto</span><strong>{money(demo ? demoMonth.total : month.reduce((n, a) => n + a.price, 0))}</strong></div>
          <div><span>Próximos</span><strong>{next.length}</strong></div>
        </div>
      </section>
    </section>;
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


