"use client";
import { useRef, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from 'react';
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


type AgendaMode = 'day' | 'week' | 'month';

const addDays = (date: string, amount: number) => {
    const current = parse(date);
    current.setDate(current.getDate() + amount);
    return key(current);
};

const minutesFromTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
};

const compactHours = (minutes: number) => {
    const safe = Math.max(0, minutes);
    if (safe === 0) return '0h';
    const hours = safe / 60;
    return hours % 1 === 0 ? `${hours.toFixed(0)}h` : `${hours.toFixed(1).replace('.', ',')}h`;
};

export function AgendaWorkspace({
    data,
    date,
    onSelect,
    onAddExtra,
    onTogglePayment,
    onCancel,
    onCreate,
    onMove,
}: {
    data: Calendar;
    date: string;
    onSelect: (date: string) => void;
    onAddExtra: (id: string) => void;
    onTogglePayment: (id: string) => void;
    onCancel: (id: string) => void;
    onCreate: (input: { name: string; phone: string; time: string; serviceId: string }) => void;
    onMove: (id: string, time: string) => void;
}) {
    const [mode, setMode] = useState<AgendaMode>('day');
    const [selected, setSelected] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [dragging, setDragging] = useState<{ id: string; minute: number; valid: boolean; reason: string } | null>(null);
    const [dragFeedback, setDragFeedback] = useState('');
    const trackRef = useRef<HTMLDivElement | null>(null);
    const dragPreviewRef = useRef<{ id: string; minute: number; valid: boolean; reason: string } | null>(null);
    const desktopDragRef = useRef<{ id: string } | null>(null);
    const dragRef = useRef<{
        id: string;
        pointerId: number;
        startY: number;
        offsetY: number;
        originalMinute: number;
        active: boolean;
        holdTimer: number | null;
    } | null>(null);

    const allDayAppointments = data.appointments
        .filter(a => a.date === date)
        .sort((a, b) => a.time.localeCompare(b.time));
    const confirmed = allDayAppointments.filter(a => a.status === 'confirmed');
    const forecast = confirmed.reduce((sum, appointment) => sum + appointment.price, 0);
    const received = confirmed.reduce((sum, appointment) => sum + (appointment.payment?.amount ?? 0), 0);
    const workMinutes = data.settings.periods.reduce((sum, period) => sum + Math.max(0, period.end - period.start), 0);
    const bookedMinutes = confirmed.reduce((sum, appointment) => sum + appointment.minutes, 0);
    const blockedMinutes = data.blocks
        .filter(block => block.date === date)
        .reduce((total, block) => total + data.settings.periods.reduce((sum, period) => {
            const overlap = Math.max(0, Math.min(block.end, period.end) - Math.max(block.start, period.start));
            return sum + overlap;
        }, 0), 0);
    const availableMinutes = Math.max(0, workMinutes - bookedMinutes - blockedMinutes);

    const day = parse(date);
    const step = mode === 'week' ? 7 : 1;
    const longDate = day.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    const nextAppointment = confirmed.find(a => a.time >= new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(new Date())) ?? confirmed[0];

    const periods = [...data.settings.periods].sort((a, b) => a.start - b.start);
    const startMinute = periods.length ? periods[0].start : 8 * 60;
    const endMinute = periods.length ? periods[periods.length - 1].end : 19 * 60;
    const pxPerMinute = 1.18;
    const timelineHeight = Math.max(520, (endMinute - startMinute) * pxPerMinute);
    const hourMarks = Array.from(
        { length: Math.floor((endMinute - startMinute) / 60) + 1 },
        (_, index) => startMinute + index * 60,
    );
    const halfHourMarks = Array.from(
        { length: Math.floor((endMinute - startMinute) / 30) + 1 },
        (_, index) => startMinute + index * 30,
    );

    const automaticGaps = periods.slice(0, -1).map((period, index) => ({
        id: `period-gap-${index}`,
        start: period.end,
        end: periods[index + 1].start,
        label: 'Intervalo',
    })).filter(gap => gap.end > gap.start);

    const blocks = [
        ...automaticGaps,
        ...data.blocks.filter(block => block.date === date).map(block => ({ ...block, label: 'Horário bloqueado' })),
    ];

    const weekStart = parse(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekDays = Array.from({ length: 7 }, (_, index) => {
        const current = new Date(weekStart);
        current.setDate(weekStart.getDate() + index);
        const value = key(current);
        const appointments = data.appointments.filter(a => a.date === value && a.status === 'confirmed');
        return {
            value,
            current,
            appointments,
            total: appointments.reduce((sum, appointment) => sum + appointment.price, 0),
        };
    });


    const timeFromMinute = (value: number) =>
        `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;

    function validateMove(id: string, start: number) {
        const appointment = data.appointments.find(item => item.id === id);
        if (!appointment) return { valid: false, reason: 'Agendamento não encontrado.' };

        const end = start + appointment.minutes;
        const insideWorkPeriod = data.settings.periods.some(period => start >= period.start && end <= period.end);
        if (!insideWorkPeriod) return { valid: false, reason: 'Esse horário fica fora do expediente ou dentro de um intervalo.' };

        const blocked = data.blocks
            .filter(block => block.date === date)
            .some(block => start < block.end && end > block.start);
        if (blocked) return { valid: false, reason: 'Esse horário está bloqueado.' };

        const overlapsAppointment = data.appointments
            .filter(item => item.id !== id && item.date === date && item.status === 'confirmed')
            .some(item => {
                const itemStart = minutesFromTime(item.time);
                const itemEnd = itemStart + item.minutes;
                return start < itemEnd && end > itemStart;
            });
        if (overlapsAppointment) return { valid: false, reason: 'Já existe outro atendimento nesse horário.' };

        return { valid: true, reason: '' };
    }

    function minuteFromPointer(clientY: number, appointmentId: string, offsetY: number) {
        const track = trackRef.current;
        const appointment = data.appointments.find(item => item.id === appointmentId);
        if (!track || !appointment) return startMinute;

        const rect = track.getBoundingClientRect();
        const raw = startMinute + (clientY - rect.top - offsetY) / pxPerMinute;
        const snapped = Math.round(raw / 30) * 30;
        return Math.max(startMinute, Math.min(endMinute - appointment.minutes, snapped));
    }

    function activateDrag(id: string, minute: number) {
        if (!dragRef.current || dragRef.current.id !== id) return;
        dragRef.current.active = true;
        const validation = validateMove(id, minute);
        setSelected(null);
        setDragFeedback('Arraste e solte no novo horário.');
        const preview = { id, minute, ...validation };
        dragPreviewRef.current = preview;
        setDragging(preview);
    }

    function handleDragPointerDown(event: ReactPointerEvent<HTMLElement>, id: string) {
        if (event.pointerType !== 'touch') return;
        const appointment = data.appointments.find(item => item.id === id);
        const track = trackRef.current;
        if (!appointment || !track || appointment.status !== 'confirmed') return;

        event.stopPropagation();
        const originalMinute = minutesFromTime(appointment.time);
        const trackRect = track.getBoundingClientRect();
        const eventTop = (originalMinute - startMinute) * pxPerMinute;
        const offsetY = Math.max(0, Math.min(appointment.minutes * pxPerMinute, event.clientY - trackRect.top - eventTop));

        const state = {
            id,
            pointerId: event.pointerId,
            startY: event.clientY,
            offsetY,
            originalMinute,
            active: false,
            holdTimer: null as number | null,
        };

        dragRef.current = state;
        event.currentTarget.setPointerCapture(event.pointerId);

        if (event.pointerType === 'touch') {
            state.holdTimer = window.setTimeout(() => activateDrag(id, originalMinute), 320);
        }
    }

    function handleDragPointerMove(event: ReactPointerEvent<HTMLElement>) {
        const current = dragRef.current;
        if (!current || current.pointerId !== event.pointerId) return;

        if (!dragRef.current?.active) return;
        event.preventDefault();

        const minute = minuteFromPointer(event.clientY, current.id, current.offsetY);
        const validation = validateMove(current.id, minute);
        const preview = { id: current.id, minute, ...validation };
        dragPreviewRef.current = preview;
        setDragging(preview);
        setDragFeedback(validation.valid ? `Soltar em ${timeFromMinute(minute)}` : validation.reason);
    }

    function finishDrag(event: ReactPointerEvent<HTMLElement>) {
        const current = dragRef.current;
        if (!current || current.pointerId !== event.pointerId) return;

        if (current.holdTimer !== null) window.clearTimeout(current.holdTimer);

        const preview = dragPreviewRef.current;
        if (current.active && preview?.id === current.id) {
            event.preventDefault();
            event.stopPropagation();
            if (preview.valid && preview.minute !== current.originalMinute) {
                onMove(current.id, timeFromMinute(preview.minute));
                setDragFeedback(`Atendimento movido para ${timeFromMinute(preview.minute)}.`);
            } else if (!preview.valid) {
                setDragFeedback(preview.reason);
            } else {
                setDragFeedback('Horário mantido.');
            }
        }

        try {
            event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {}
        dragRef.current = null;
        dragPreviewRef.current = null;
        setDragging(null);
    }

    function cancelDrag(event: ReactPointerEvent<HTMLElement>) {
        const current = dragRef.current;
        if (current?.holdTimer !== null && current?.holdTimer !== undefined) window.clearTimeout(current.holdTimer);
        try {
            event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {}
        dragRef.current = null;
        setDragging(null);
    }


    function startDesktopDrag(event: ReactDragEvent<HTMLElement>, id: string) {
        const appointment = data.appointments.find(item => item.id === id);
        if (!appointment || appointment.status !== 'confirmed') {
            event.preventDefault();
            return;
        }

        desktopDragRef.current = { id };
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', id);
        const minute = minutesFromTime(appointment.time);
        const validation = validateMove(id, minute);
        const preview = { id, minute, ...validation };
        dragPreviewRef.current = preview;
        setDragging(preview);
        setSelected(null);
        setDragFeedback('Arraste o cliente até o novo horário.');
    }

    function handleDesktopDragOver(event: ReactDragEvent<HTMLDivElement>) {
        const current = desktopDragRef.current;
        if (!current) return;

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const minute = minuteFromPointer(event.clientY, current.id, 0);
        const validation = validateMove(current.id, minute);
        const preview = { id: current.id, minute, ...validation };
        dragPreviewRef.current = preview;
        setDragging(preview);
        setDragFeedback(validation.valid ? `Soltar em ${timeFromMinute(minute)}` : validation.reason);
    }

    function finishDesktopDrop(event: ReactDragEvent<HTMLDivElement>) {
        const current = desktopDragRef.current;
        if (!current) return;

        event.preventDefault();
        const preview = dragPreviewRef.current;
        const appointment = data.appointments.find(item => item.id === current.id);
        const originalMinute = appointment ? minutesFromTime(appointment.time) : null;

        if (preview?.id === current.id && preview.valid && originalMinute !== null && preview.minute !== originalMinute) {
            onMove(current.id, timeFromMinute(preview.minute));
            setDragFeedback(`Atendimento movido para ${timeFromMinute(preview.minute)}.`);
        } else if (preview && !preview.valid) {
            setDragFeedback(preview.reason);
        } else {
            setDragFeedback('Horário mantido.');
        }

        desktopDragRef.current = null;
        dragPreviewRef.current = null;
        setDragging(null);
    }

    function endDesktopDrag() {
        desktopDragRef.current = null;
        dragPreviewRef.current = null;
        setDragging(null);
    }

    function submitNewAppointment(form: HTMLFormElement) {
        const formData = new FormData(form);
        onCreate({
            name: String(formData.get('name') || '').trim(),
            phone: String(formData.get('phone') || '').trim(),
            time: String(formData.get('time') || ''),
            serviceId: String(formData.get('serviceId') || ''),
        });
        form.reset();
        setCreating(false);
    }

    return <section className="agenda-pro">
        <div className="agenda-summary">
            <article>
                <span className="agenda-summary-icon">◫</span>
                <div><span>Agendamentos hoje</span><strong>{confirmed.length}</strong><small>Compromissos ativos do dia</small></div>
            </article>
            <article>
                <span className="agenda-summary-icon">↗</span>
                <div><span>Receita prevista hoje</span><strong>{money(forecast)}</strong><small>{received ? `${money(received)} já recebido` : 'Previsão do dia'}</small></div>
            </article>
            <article>
                <span className="agenda-summary-icon">◷</span>
                <div><span>Horários disponíveis</span><strong>{compactHours(availableMinutes)}</strong><small>Livres hoje</small></div>
            </article>
        </div>

        <section className="agenda-insight">
            <span className="agenda-insight-icon">✦</span>
            <div>
                <strong>Painel inteligente</strong>
                <p>{nextAppointment
                    ? <>Próximo atendimento: <b>{nextAppointment.time}</b> · {nextAppointment.name} · {nextAppointment.service}.</>
                    : <>Nenhum atendimento confirmado para esta data. Há <b>{compactHours(availableMinutes)}</b> livres no expediente.</>}</p>
            </div>
        </section>

        <div className="agenda-view-tabs" role="tablist" aria-label="Visualização da agenda">
            {([
                ['day', 'Dia'],
                ['week', 'Semana'],
                ['month', 'Mês'],
            ] as [AgendaMode, string][]).map(([id, label]) =>
                <button key={id} type="button" className={mode === id ? 'is-active' : ''} onClick={() => setMode(id)} aria-selected={mode === id}>{label}</button>
            )}
        </div>

        {mode !== 'month' && <div className="agenda-date-nav">
            <button type="button" aria-label={mode === 'week' ? 'Semana anterior' : 'Dia anterior'} onClick={() => onSelect(addDays(date, -step))}>‹</button>
            <button type="button" className="agenda-date-label" onClick={() => onSelect(date)}>{mode === 'week'
                ? `${weekDays[0].current.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} — ${weekDays[6].current.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                : longDate}</button>
            <button type="button" aria-label={mode === 'week' ? 'Próxima semana' : 'Próximo dia'} onClick={() => onSelect(addDays(date, step))}>›</button>
        </div>}

        {mode === 'day' && <div className={dragFeedback ? "agenda-drag-feedback is-visible" : "agenda-drag-feedback"}>
            <span>↕</span>
            <p>{dragFeedback || 'PC: arraste o nome do cliente. Celular: segure o nome por um instante e arraste.'}</p>
        </div>}

        {mode === 'day' && <div className="agenda-timeline-shell">
            <div className="agenda-timeline" style={{ height: timelineHeight }}>
                <div className="agenda-time-axis">
                    {hourMarks.map(value => <span key={value} style={{ top: (value - startMinute) * pxPerMinute }}>{String(Math.floor(value / 60)).padStart(2, '0')}:00</span>)}
                </div>
                <div
                    className={dragging ? "agenda-track is-dragging" : "agenda-track"}
                    ref={trackRef}
                    onDragOver={handleDesktopDragOver}
                    onDrop={finishDesktopDrop}
                >
                    {halfHourMarks.map(value => <i key={value} className={value % 60 === 0 ? 'hour-line' : 'half-line'} style={{ top: (value - startMinute) * pxPerMinute }} />)}

                    {blocks.map(block => <div
                        className="agenda-block"
                        key={block.id}
                        style={{
                            top: (block.start - startMinute) * pxPerMinute,
                            height: Math.max(34, (block.end - block.start) * pxPerMinute - 4),
                        }}
                    >
                        <strong>⊘ {block.label}</strong>
                        <span>{String(Math.floor(block.start / 60)).padStart(2, '0')}:{String(block.start % 60).padStart(2, '0')} — {String(Math.floor(block.end / 60)).padStart(2, '0')}:{String(block.end % 60).padStart(2, '0')}</span>
                    </div>)}

                    {dragging && <div
                        className={dragging.valid ? "agenda-drop-preview is-valid" : "agenda-drop-preview is-invalid"}
                        style={{ top: (dragging.minute - startMinute) * pxPerMinute }}
                    >
                        <span>{timeFromMinute(dragging.minute)}</span>
                        <strong>{dragging.valid ? 'Solte aqui' : 'Horário indisponível'}</strong>
                    </div>}

                    {allDayAppointments.map(appointment => {
                        const top = (minutesFromTime(appointment.time) - startMinute) * pxPerMinute;
                        const isSelected = selected === appointment.id;
                        return <article
                            key={appointment.id}
                            className={`agenda-event ${appointment.status === 'cancelled' ? 'is-cancelled' : ''} ${appointment.payment ? 'is-paid' : ''} ${isSelected ? 'is-selected' : ''}`}
                            style={{ top, minHeight: Math.max(52, appointment.minutes * pxPerMinute - 5) }}
                        >
                            <div
                                className="agenda-event-main"
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelected(isSelected ? null : appointment.id)}
                                onKeyDown={event => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        setSelected(isSelected ? null : appointment.id);
                                    }
                                }}
                            >
                                <span className="agenda-event-copy">
                                    <strong
                                        className="agenda-drag-name"
                                        title={appointment.status === 'confirmed' ? 'Arraste no PC ou segure no celular para mudar o horário' : undefined}
                                        draggable={appointment.status === 'confirmed'}
                                        onDragStart={event => startDesktopDrag(event, appointment.id)}
                                        onDragEnd={endDesktopDrag}
                                        onPointerDown={event => handleDragPointerDown(event, appointment.id)}
                                        onPointerMove={handleDragPointerMove}
                                        onPointerUp={finishDrag}
                                        onPointerCancel={cancelDrag}
                                    ><span className="agenda-drag-grip" aria-hidden="true">⋮⋮</span>{appointment.name}</strong>
                                    <span>{appointment.service}</span>
                                    <small>◷ {appointment.minutes} min &nbsp; · &nbsp; {money(appointment.price)} {appointment.source === 'walk-in' ? ' · Presencial' : ''}</small>
                                </span>
                                <span className={appointment.payment ? 'agenda-event-status paid' : appointment.status === 'cancelled' ? 'agenda-event-status cancelled' : 'agenda-event-status'}>
                                    {appointment.payment ? 'Recebido' : appointment.status === 'cancelled' ? 'Cancelado' : 'Agendado'}
                                </span>
                            </div>
                            {isSelected && appointment.status === 'confirmed' && <div className="agenda-event-actions">
                                <button type="button" onClick={() => onAddExtra(appointment.id)}>+ Serviço extra</button>
                                <button type="button" onClick={() => onTogglePayment(appointment.id)}>{appointment.payment ? 'Desfazer recebido' : 'Marcar recebido'}</button>
                                <button type="button" onClick={() => { if (window.confirm(`Cancelar o atendimento de ${appointment.name}?`)) onCancel(appointment.id); }}>Cancelar</button>
                            </div>}
                        </article>;
                    })}
                </div>
            </div>
        </div>}

        {mode === 'week' && <div className="agenda-week-grid">
            {weekDays.map(item => <button type="button" key={item.value} className={item.value === date ? 'agenda-week-day is-selected' : 'agenda-week-day'} onClick={() => { onSelect(item.value); setMode('day'); }}>
                <span>{item.current.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                <strong>{item.current.getDate()}</strong>
                <small>{item.appointments.length} atendimento{item.appointments.length === 1 ? '' : 's'}</small>
                <b>{money(item.total)}</b>
                <i>{item.appointments.slice(0, 3).map(a => `${a.time} ${a.name.split(' ')[0]}`).join(' · ') || 'Livre'}</i>
            </button>)}
        </div>}

        {mode === 'month' && <AdminCalendar data={data} date={date} onSelect={(value) => { onSelect(value); setMode('day'); }} />}

        {creating && <form className="agenda-quick-form" onSubmit={event => { event.preventDefault(); submitNewAppointment(event.currentTarget); }}>
            <div className="agenda-quick-head"><div><p className="eyebrow">NOVO ATENDIMENTO</p><h3>Adicionar à agenda</h3></div><button type="button" className="text-button" onClick={() => setCreating(false)}>Fechar</button></div>
            <div className="agenda-quick-grid">
                <label>Cliente<input name="name" required placeholder="Nome do cliente" /></label>
                <label>WhatsApp<input name="phone" placeholder="(14) 99999-9999" /></label>
                <label>Horário<input name="time" type="time" required /></label>
                <label>Serviço<select name="serviceId" required defaultValue=""><option value="" disabled>Selecione</option>{data.services.filter(service => service.active).map(service => <option key={service.id} value={service.id}>{service.name} · {money(service.price)}</option>)}</select></label>
            </div>
            <button className="primary" type="submit">Adicionar atendimento</button>
        </form>}

        <button type="button" className="agenda-floating-add" aria-label="Adicionar novo atendimento" onClick={() => setCreating(value => !value)}>+</button>
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


