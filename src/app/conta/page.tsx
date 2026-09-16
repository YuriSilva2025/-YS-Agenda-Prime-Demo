"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/brand-logo';
import YsBrand from '@/components/ys-brand';
import { Appointment, dateLabel, money } from '@/lib/api';
import { loadDemoCalendar } from '@/lib/demo';

export default function Account() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const data = loadDemoCalendar();
    setAppointments(data.appointments.filter(a => a.name === 'Cliente Demonstração' || a.userId === 'demo-client'));
  }, []);

  return <main>
    <div className="demo-topbar"><span>ÁREA DO CLIENTE · DEMO ABERTA</span><span>Sem senha nesta versão de apresentação</span></div>
    <header><Link href="/" className="brand"><BrandLogo /></Link><Link href="/" className="admin-link">Agendar horário</Link></header>
    <section className="booking">
      <p className="eyebrow">EXEMPLO DE ÁREA DO CLIENTE</p>
      <h1>Meus agendamentos.</h1>
      <div className="account-heading"><p>Olá, Cliente Demonstração.</p><span className="walkin-tag">Modo apresentação</span></div>
      {!appointments.length ? <div className="calendar-empty">Ainda não há agendamentos criados nesta sessão.<p><Link href="/">Faça um agendamento pela página inicial</Link> para demonstrar o fluxo completo.</p></div> : <div className="appointment-list">
        {[...appointments].reverse().map(a => <article className="appointment" key={a.id}><strong className="appointment-time">{a.time}</strong><div><h3>{a.service}</h3><p>{dateLabel(a.date)} · {money(a.price)} · {a.minutes} min</p></div><span className={a.status === 'confirmed' ? 'status' : 'muted'}>{a.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}</span></article>)}
      </div>}
      <div className="presentation-mini"><strong>Em uma versão real</strong><p>Esta área pode ter login por e-mail, código, WhatsApp ou outra forma de identificação definida no projeto.</p></div>
    </section>
    <footer><span>AGENDA PRIME <small>DEMONSTRAÇÃO COMERCIAL</small></span><p>Personalizado para cada negócio.</p><YsBrand compact /></footer>
  </main>;
}
