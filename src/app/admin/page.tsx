"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/brand-logo';
import YsBrand from '@/components/ys-brand';
import Earnings from '@/components/earnings';
import ServicesCatalog from '@/components/services-catalog';
import AdminCalendar, { AgendaWorkspace, Dashboard } from '@/components/admin-calendar';
import { Calendar, Service, Settings, clock, money, minute } from '@/lib/api';
import { DEMO_TODAY, demoClients, loadDemoCalendar, resetDemoCalendar, saveDemoCalendar } from '@/lib/demo';

type DemoClient = typeof demoClients[number];

export default function Admin() {
  const [data, setData] = useState<Calendar | null>(null);
  const [tab, setTab] = useState('dashboard');
  const [date, setDate] = useState(DEMO_TODAY);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [notice, setNotice] = useState('');
  const [clients, setClients] = useState<DemoClient[]>(demoClients);

  useEffect(() => {
    const current = loadDemoCalendar();
    setData(current);
    setSettings(current.settings);
  }, []);

  function persist(next: Calendar, message = '') {
    setData(next);
    setSettings(next.settings);
    saveDemoCalendar(next);
    setNotice(message);
  }

  function cancelAppointment(id: string) {
    if (!data) return;
    persist({ ...data, appointments: data.appointments.map(a => a.id === id ? { ...a, status: 'cancelled' as const } : a) }, 'Agendamento cancelado na demonstração.');
  }

  function togglePayment(id: string) {
    if (!data) return;
    persist({
      ...data,
      appointments: data.appointments.map(a => a.id === id
        ? { ...a, payment: a.payment ? undefined : { amount: a.price, receivedAt: `${date}T18:00:00-03:00` } }
        : a),
    }, 'Recebimento atualizado na demonstração.');
  }

  function addExtra(id: string) {
    if (!data) return;
    persist({
      ...data,
      appointments: data.appointments.map(a => a.id === id ? {
        ...a,
        service: a.service.includes('Adicional') ? a.service : `${a.service} + Adicional`,
        price: a.price + 25,
        minutes: a.minutes + 20,
        payment: a.payment ? { ...a.payment, amount: a.payment.amount + 25 } : a.payment,
      } : a),
    }, 'Serviço adicional de R$ 25,00 incluído no atendimento.');
  }

  function saveService(service: Service) {
    if (!data) return;
    const nextServices = service.id
      ? data.services.map(s => s.id === service.id ? service : s)
      : [...data.services, { ...service, id: crypto.randomUUID() }];
    persist({ ...data, services: nextServices }, 'Serviço salvo.');
  }

  function deleteService(service: Service) {
    if (!data) return;
    if (!window.confirm(`Excluir "${service.name}"? Os atendimentos já registrados continuarão intactos.`)) return;
    persist({ ...data, services: data.services.filter(item => item.id !== service.id) }, 'Serviço excluído da demonstração. Atendimentos anteriores foram preservados.');
  }

  function toggleServiceActive(service: Service) {
    if (!data) return;
    const next = { ...service, active: !service.active };
    persist({
      ...data,
      services: data.services.map(item => item.id === service.id ? next : item),
    }, next.active ? 'Serviço ativado.' : 'Serviço pausado.');
  }

  function saveSettings() {
    if (!data || !settings) return;
    persist({ ...data, settings }, 'Disponibilidade salva na demonstração.');
  }

  function addBlock(start: string, end: string) {
    if (!data) return;
    persist({
      ...data,
      blocks: [...data.blocks, { id: crypto.randomUUID(), date, start: minute(start), end: minute(end) }],
    }, 'Intervalo bloqueado.');
  }

  function removeBlock(id: string) {
    if (!data) return;
    persist({ ...data, blocks: data.blocks.filter(b => b.id !== id) }, 'Intervalo liberado.');
  }

  function addWalkIn(form: HTMLFormElement) {
    const f = new FormData(form);
    const name = String(f.get('name') || '').trim();
    const phone = String(f.get('phone') || '').replace(/\D/g, '');
    if (!name) return;
    setClients(list => [{ id: crypto.randomUUID(), name, phone: phone || 'Sem WhatsApp', source: 'presencial', visits: 1, total: 0 }, ...list]);
    form.reset();
    setNotice('Cliente presencial adicionado à demonstração.');
  }


  function moveAppointment(id: string, time: string) {
    if (!data) return;
    const appointment = data.appointments.find(item => item.id === id);
    if (!appointment) return;
    persist({
      ...data,
      appointments: data.appointments.map(item => item.id === id ? { ...item, time } : item),
    }, `${appointment.name} movido para ${time}.`);
  }

  function addManualAppointment(input: { name: string; phone: string; time: string; serviceId: string }) {
    if (!data || !input.name || !input.time || !input.serviceId) return;
    const service = data.services.find(item => item.id === input.serviceId);
    if (!service) return;
    const phone = input.phone.replace(/\D/g, '');
    const appointment = {
      id: crypto.randomUUID(),
      userId: 'walk-in',
      name: input.name,
      phone: phone || 'Sem WhatsApp',
      date,
      time: input.time,
      serviceId: service.id,
      service: service.name,
      items: [{ serviceId: service.id, name: service.name, price: service.price, minutes: service.minutes }],
      price: service.price,
      minutes: service.minutes,
      status: 'confirmed' as const,
      source: 'walk-in',
      note: 'Atendimento incluído manualmente pela agenda',
    };
    persist({ ...data, appointments: [...data.appointments, appointment] }, 'Novo atendimento adicionado à agenda.');
  }


  return (
    <main className="barber-space">
      <div className="demo-topbar"><span>PAINEL DEMO · ACESSO LIVRE</span><span>Nenhum dado real é usado nesta apresentação</span></div>
      <header>
        <Link className="brand" href="/"><BrandLogo /><span className="panel-brand-label">PAINEL ADMINISTRATIVO</span></Link>
        <Link href="/" className="admin-link">Ver página do cliente ↗</Link>
      </header>

      {notice && <p role="status" className="notice notice-with-close">{notice}<button className="text-button" onClick={() => setNotice('')}>Fechar</button></p>}

      <section className="admin-shell">
        <nav className="admin-nav" aria-label="Painel demonstrativo"><div className="nav-caption">GESTÃO DEMONSTRAÇÃO</div>
          {[
            ['dashboard', 'Visão geral'], ['agenda', 'Agenda'], ['servicos', 'Serviços'], ['disponibilidade', 'Disponibilidade'],
            ['clientes', 'Clientes'], ['ganhos', 'Ganhos'], ['apresentacao', 'Apresentação'],
          ].map(([id, label]) => <button key={id} className={tab === id ? 'nav-active' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => { setTab(id); setNotice(''); }}><span className="nav-mark" aria-hidden="true">{({dashboard:'◫',agenda:'◷',servicos:'✦',disponibilidade:'▦',clientes:'◎',ganhos:'↗',apresentacao:'○'} as Record<string,string>)[id]}</span><span>{label}</span><span className="nav-arrow" aria-hidden="true">›</span></button>)}
        </nav>

        <div className="admin-main"><div className="workspace-meta"><span>AGENDA PRIME / PAINEL DEMO</span>{data && <span className={data.settings.enabled ? "agenda-state is-open" : "agenda-state"}>{data.settings.enabled ? "Agenda online aberta" : "Agenda online fechada"}</span>}</div>
          <p className="eyebrow">YS SOLUÇÕES DIGITAIS · DEMONSTRAÇÃO</p>
          <h1>{tab === 'dashboard' ? 'Visão geral.' : tab === 'agenda' ? 'Agenda.' : tab === 'servicos' ? 'Serviços.' : tab === 'ganhos' ? 'Ganhos.' : tab === 'clientes' ? 'Clientes.' : tab === 'apresentacao' ? 'Apresentação comercial.' : 'Disponibilidade.'}</h1>

          {!data ? <p role="status">Carregando demonstração…</p> : <>
            {tab === 'dashboard' && <Dashboard data={data} today={DEMO_TODAY} onAgenda={() => setTab('agenda')} demo />}

            {tab === 'disponibilidade' && <AdminCalendar data={data} date={date} onSelect={setDate} />}
            {tab === 'disponibilidade' && <label className="field">Data<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>}

            {tab === 'agenda' && <AgendaWorkspace
              data={data}
              date={date}
              onSelect={setDate}
              onAddExtra={addExtra}
              onTogglePayment={togglePayment}
              onCancel={cancelAppointment}
              onCreate={addManualAppointment}
              onMove={moveAppointment}
            />}

            {tab === 'servicos' && <ServicesCatalog
              data={data}
              monthKey={date.slice(0, 7)}
              onSave={saveService}
              onDelete={deleteService}
              onToggle={toggleServiceActive}
            />}

            {tab === 'disponibilidade' && settings && <>
              <form className="service-form" onSubmit={e => { e.preventDefault(); saveSettings(); }}>
                <h2>Expediente e abertura da agenda</h2>
                <p className="muted">Tudo abaixo é editável na demonstração e fica apenas neste navegador.</p>
                <label className="checkbox"><input type="checkbox" checked={settings.enabled} onChange={e => setSettings({ ...settings, enabled: e.target.checked })} />Abrir agenda para reservas online</label>
                <div className="days-row">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label, i) => <label key={i} className="checkbox"><input type="checkbox" checked={settings.days.includes(i)} onChange={e => setSettings({ ...settings, days: e.target.checked ? [...settings.days, i] : settings.days.filter(d => d !== i) })} />{label}</label>)}</div>
                {settings.periods.map((p, i) => <div className="form-row" key={i}><label>Início<input type="time" value={clock(p.start)} onChange={e => setSettings({ ...settings, periods: settings.periods.map((x, j) => j === i ? { ...x, start: minute(e.target.value) } : x) })} /></label><label>Fim<input type="time" value={clock(p.end)} onChange={e => setSettings({ ...settings, periods: settings.periods.map((x, j) => j === i ? { ...x, end: minute(e.target.value) } : x) })} /></label></div>)}
                <label>Dias liberados para agendamento<input type="number" min={1} max={90} value={settings.advanceDays} onChange={e => setSettings({ ...settings, advanceDays: Number(e.target.value) })} /></label>
                <button className="primary">Salvar expediente</button>
              </form>
              <form className="service-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); addBlock(String(f.get('start')), String(f.get('end'))); e.currentTarget.reset(); }}>
                <h2>Bloquear intervalo</h2><div className="form-row"><label>Das<input type="time" name="start" required /></label><label>Até<input type="time" name="end" required /></label></div><button className="primary">Bloquear intervalo</button>
              </form>
              <div className="admin-services">{data.blocks.filter(b => b.date === date).map(b => <article className="appointment" key={b.id}><div><h3>{clock(b.start)} – {clock(b.end)}</h3><p>Bloqueado</p></div><button className="text-button" onClick={() => removeBlock(b.id)}>Liberar</button></article>)}</div>
            </>}

            {tab === 'clientes' && <>
              <form className="service-form" onSubmit={e => { e.preventDefault(); addWalkIn(e.currentTarget); }}>
                <div className="section-heading"><div><p className="eyebrow">CLIENTE QUE CHEGOU SEM AGENDAR</p><h2>Adicionar atendimento presencial</h2></div><span>Exemplo de cliente fora do aplicativo</span></div>
                <div className="form-row"><label>Nome<input name="name" required placeholder="Nome do cliente" /></label><label>WhatsApp<input name="phone" placeholder="(14) 99999-9999" /></label></div>
                <button className="primary">+ Adicionar cliente presencial</button>
              </form>
              <div className="stats"><article><span>Clientes na base</span><strong>{clients.length}</strong></article><article><span>Vindos do online</span><strong>{clients.filter(c => c.source === 'online').length}</strong></article><article><span>Presenciais</span><strong>{clients.filter(c => c.source === 'presencial').length}</strong></article></div>
              <div className="appointment-list">{clients.map(c => <article className="appointment" key={c.id}><div><h3>{c.name}</h3><p>{c.phone} · {c.visits} atendimento{c.visits !== 1 ? 's' : ''}</p></div><span className={c.source === 'presencial' ? 'walkin-tag' : 'status'}>{c.source === 'presencial' ? 'Presencial' : 'Online'}</span><strong>{money(c.total)}</strong></article>)}</div>
            </>}

            {tab === 'ganhos' && <Earnings data={data} demo />}

            {tab === 'apresentacao' && <section className="presentation-panel">
              <div className="presentation-brand"><YsBrand /></div>
              <p className="eyebrow">PROJETO PERSONALIZÁVEL</p>
              <h2>Mostre o sistema e explique que tudo pode levar a marca do cliente.</h2>
              <div className="presentation-grid">
                <article><strong>Cliente</strong><p>Agendamento por link, celular ou computador, sem depender de mensagens manuais.</p></article>
                <article><strong>Gestão</strong><p>Agenda, serviços, bloqueios, clientes presenciais, adicionais e ganhos em um único painel.</p></article>
                <article><strong>Personalização</strong><p>Logo, cores, textos, serviços, preços e regras adaptados para cada negócio.</p></article>
                <article><strong>Segmentos</strong><p>Barbearias, salões, manicures, estética, lava car e outros serviços com hora marcada.</p></article>
              </div>
              <button className="text-button reset-demo" onClick={() => { const fresh = resetDemoCalendar(); setData(fresh); setSettings(fresh.settings); setDate(DEMO_TODAY); setNotice('Demonstração restaurada para os dados originais.'); }}>Restaurar dados da demonstração</button>
            </section>}
          </>}
        </div>
      </section>

      <footer><span>AGENDA PRIME <small>DEMONSTRAÇÃO COMERCIAL</small></span><p>Uma solução personalizada para o seu negócio.</p><YsBrand compact /></footer>
    </main>
  );
}