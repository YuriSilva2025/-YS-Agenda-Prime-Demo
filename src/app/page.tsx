"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/brand-logo';
import YsBrand from '@/components/ys-brand';
import { Appointment, Calendar, Service, dateLabel, money } from '@/lib/api';
import { addDemoAppointment, DEMO_TODAY, demoAvailableTimes, loadDemoCalendar } from '@/lib/demo';

export default function Home() {
  const [data, setData] = useState<Calendar | null>(null);
  const [selected, setSelected] = useState<Service | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [step, setStep] = useState(0);
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);
  const [name, setName] = useState('Cliente Demonstração');
  const [phone, setPhone] = useState('(14) 99999-0000');
  const requestId = useRef('');

  useEffect(() => {
    setData(loadDemoCalendar());
  }, []);

  const times = useMemo(() => {
    if (!data || !selected || !date) return [];
    return demoAvailableTimes(date, selected, data);
  }, [data, selected, date]);

  const maxDate = new Date(new Date(`${DEMO_TODAY}T12:00:00`).getTime() + 45 * 86400000)
    .toISOString()
    .slice(0, 10);

  function begin(service: Service) {
    setSelected(service);
    setDate('');
    setTime('');
    setConfirmed(null);
    requestId.current = crypto.randomUUID();
    setStep(1);
  }

  function book() {
    if (!selected || !date || !time || !data) return;
    const cleanPhone = phone.replace(/\D/g, '') || '14999990000';
    const appointment: Appointment = {
      id: requestId.current || crypto.randomUUID(),
      userId: 'demo-client',
      name: name.trim() || 'Cliente Demonstração',
      phone: cleanPhone,
      date,
      time,
      service: selected.name,
      price: selected.price,
      minutes: selected.minutes,
      status: 'confirmed',
    };
    const next = addDemoAppointment(data, appointment);
    setData(next);
    setConfirmed(appointment);
    setStep(3);
  }

  return (
    <main>
      <div className="demo-topbar">
        <span>DEMO ABERTA · SEM LOGIN</span>
        <span>Barbearia · Salão · Manicure · Lava car · outros serviços</span>
      </div>
      <header>
        <Link className="brand" href="/" aria-label="Agenda Prime início"><BrandLogo /></Link>
        <div className="header-actions">
          <Link className="admin-link" href="/admin">Ver painel administrativo ↗</Link>
        </div>
      </header>

      {step === 0 ? <>
        <section className="hero">
          <div>
            <p className="eyebrow">AGENDAMENTO DIGITAL · GESTÃO SIMPLES</p>
            <h1>Seu atendimento organizado.<br /><em>Seu negócio mais profissional.</em></h1>
            <p className="intro">Uma demonstração totalmente personalizável para apresentar como clientes podem agendar e como o negócio acompanha agenda, serviços, clientes e ganhos.</p>
            <a className="primary" href="#servicos">Simular agendamento <span>↗</span></a>
          </div>
          <div className="brand-art demo-provider-card">
            <YsBrand />
            <p>UMA SOLUÇÃO QUE LEVA A SUA MARCA</p>
            <small>CORES · LOGO · SERVIÇOS · HORÁRIOS · FUNCIONALIDADES PERSONALIZÁVEIS</small>
          </div>
        </section>

        <section id="servicos">
          <div className="section-heading">
            <div><p className="eyebrow">EXEMPLOS DE SERVIÇOS</p><h2>Escolha um atendimento</h2></div>
            <span>Os nomes, preços e durações são apenas demonstrativos</span>
          </div>
          <div className="services">
            {(data?.services ?? []).filter(s => s.active).map((s, i) => (
              <button className="service" key={s.id} onClick={() => begin(s)}>
                <span className="service-number">{String(i + 1).padStart(2, '0')}<span>↗</span></span>
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <div className="service-bottom"><span>{s.minutes} min</span><strong>{money(s.price)}</strong></div>
              </button>
            ))}
          </div>
        </section>

        <section className="adaptation-strip">
          <article><strong>Barbearia</strong><span>Corte, barba, sobrancelha e combos.</span></article>
          <article><strong>Salão</strong><span>Corte, escova, coloração e tratamentos.</span></article>
          <article><strong>Manicure</strong><span>Mão, pé, alongamento e adicionais.</span></article>
          <article><strong>Lava car</strong><span>Lavagem, higienização, cera e pacotes.</span></article>
        </section>
      </> : (
        <section className="booking">
          {step < 3 && <button className="back" onClick={() => setStep(step - 1)}>← {step === 1 ? 'Voltar aos serviços' : 'Voltar aos horários'}</button>}
          <p className="eyebrow">DEMONSTRAÇÃO DO FLUXO DO CLIENTE</p>
          <h1>{step === 1 ? 'Escolha o horário.' : step === 2 ? 'Confirme os dados.' : 'Agendamento concluído.'}</h1>
          <div className="booking-grid">
            <div className="booking-content">
              {step === 1 ? <>
                <label className="field">Qual dia fica melhor?
                  <input type="date" value={date} min={DEMO_TODAY} max={maxDate} onChange={e => { setDate(e.target.value); setTime(''); }} />
                </label>
                <h2>Horários disponíveis</h2>
                {date ? <div className="times">
                  {times.length ? times.map(t => <button key={t} className={'choice ' + (time === t ? 'active' : '')} aria-pressed={time === t} onClick={() => setTime(t)}>{t}</button>) : <p className="muted">Não há horários disponíveis neste dia. Escolha outra data.</p>}
                </div> : <p className="muted">Selecione uma data para visualizar os horários.</p>}
                <button className="primary continue" disabled={!time} onClick={() => setStep(2)}>Continuar →</button>
              </> : step === 2 ? <>
                <div className="service-form demo-client-form">
                  <h2>Dados do cliente</h2>
                  <p className="muted">Na demonstração não existe senha. Em um projeto real, o fluxo pode usar login, código por e-mail ou apenas identificação rápida.</p>
                  <label>Nome<input value={name} onChange={e => setName(e.target.value)} maxLength={80} /></label>
                  <label>WhatsApp<input value={phone} onChange={e => setPhone(e.target.value)} maxLength={20} /></label>
                </div>
                <button className="primary continue" onClick={book}>Confirmar agendamento</button>
              </> : <>
                <div className="check">✓</div>
                <h2>Pronto. O horário entrou na demo.</h2>
                <p className="muted">Agora abra o painel administrativo para mostrar que o agendamento aparece na agenda do negócio.</p>
                <p className="muted">Reserva: {confirmed?.id.slice(0, 8).toUpperCase()}</p>
                <Link className="primary continue" href="/admin">Abrir painel administrativo</Link>
                <button className="text-button" onClick={() => setStep(0)}>Fazer outra simulação</button>
              </>}
            </div>
            <aside>
              <p className="eyebrow">RESUMO</p>
              <h2>{confirmed?.service ?? selected?.name}</h2>
              <p className="muted">{selected?.description}</p>
              <dl>
                <div><dt>Duração</dt><dd>{confirmed?.minutes ?? selected?.minutes} minutos</dd></div>
                <div><dt>Data</dt><dd>{date ? dateLabel(date) : 'A escolher'}</dd></div>
                <div><dt>Horário</dt><dd>{time || confirmed?.time || 'A escolher'}</dd></div>
                <div className="total"><dt>Valor</dt><dd>{money(confirmed?.price ?? selected?.price ?? 0)}</dd></div>
              </dl>
            </aside>
          </div>
        </section>
      )}

      <footer>
        <span>AGENDA PRIME <small>DEMONSTRAÇÃO COMERCIAL</small></span>
        <p>Personalizado para cada negócio.</p>
        <YsBrand compact />
      </footer>
    </main>
  );
}
