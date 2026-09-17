"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/brand-logo';
import YsBrand from '@/components/ys-brand';
import Earnings from '@/components/earnings';
import AdminCalendar, { Dashboard } from '@/components/admin-calendar';
import { Calendar, Service, Settings, clock, money, minute } from '@/lib/api';
import { DEMO_TODAY, demoClients, loadDemoCalendar, resetDemoCalendar, saveDemoCalendar } from '@/lib/demo';

type DemoClient = typeof demoClients[number];

export default function Admin() {
  const [data, setData] = useState<Calendar | null>(null);
  const [tab, setTab] = useState('dashboard');
  const [date, setDate] = useState(DEMO_TODAY);
  const [editing, setEditing] = useState<Service | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [notice, setNotice] = useState('');
  const [cancel, setCancel] = useState('');
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
    setCancel('');
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
    setEditing(null);
  }

  function deleteService(service: Service) {
    if (!data) return;
    if (!window.confirm(`Excluir "${service.name}"? Os atendimentos já registrados continuarão intactos.`)) return;
    persist({ ...data, services: data.services.filter(item => item.id !== service.id) }, 'Serviço excluído da demonstração. Atendimentos anteriores foram preservados.');
    setEditing(null);
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

  const appointments = data?.appointments.filter(a => a.date === date) ?? [];

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

            {(tab === 'agenda' || tab === 'disponibilidade') && <AdminCalendar data={data} date={date} onSelect={setDate} />}
            {(tab === 'agenda' || tab === 'disponibilidade') && <label className="field">Data<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>}

            {tab === 'agenda' && <>
              <div className="stats">
                <article><span>Agendamentos confirmados</span><strong>{appointments.filter(a => a.status === 'confirmed').length}</strong></article>
                <article><span>Valor previsto</span><strong>{money(appointments.filter(a => a.status === 'confirmed').reduce((n, a) => n + a.price, 0))}</strong></article>
                <article><span>Recebido no dia</span><strong>{money(appointments.reduce((n, a) => n + (a.payment?.amount ?? 0), 0))}</strong></article>
              </div>
              <div className="section-heading"><h2>Atendimentos do dia</h2><span>Inclua adicionais durante o atendimento</span></div>
              {!appointments.length ? <p className="muted">Nenhum agendamento nesta data.</p> : <div className="appointment-list">
                {[...appointments].sort((a, b) => a.time.localeCompare(b.time)).map(a => <article className="appointment" key={a.id}>
                  <strong className="appointment-time">{a.time}</strong>
                  <div><h3>{a.name}</h3><p>{a.service} · {a.minutes} min · {money(a.price)}</p><span className="walkin-tag">{a.userId === 'walk-in' ? 'Presencial' : 'Online/demo'}</span></div>
                  <span className={a.status === 'confirmed' ? 'status' : 'muted'}>{a.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}</span>
                  {a.status === 'confirmed' && <button className="text-button" onClick={() => addExtra(a.id)}>+ Adicional R$ 25</button>}
                  {(a.status === 'confirmed' || a.payment) && <button className="text-button" onClick={() => togglePayment(a.id)}>{a.payment ? '✓ Recebido · desfazer' : 'Marcar como recebido'}</button>}
                  {a.status === 'confirmed' && (cancel === a.id ? <div className="cancel-actions"><span>Cancelar?</span><button onClick={() => cancelAppointment(a.id)}>Sim</button><button onClick={() => setCancel('')}>Voltar</button></div> : <button className="text-button" onClick={() => setCancel(a.id)}>Cancelar</button>)}
                </article>)}
              </div>}
            </>}

            {tab === 'servicos' && <>
              <button className="primary" onClick={() => setEditing({ id: '', name: '', description: '', price: 0, minutes: 30, active: true })}>+ Novo serviço</button>
              {editing && <form className="service-form" onSubmit={e => { e.preventDefault(); saveService(editing); }}>
                <h2>{editing.id ? 'Editar serviço' : 'Novo serviço'}</h2>
                <label>Nome<input required maxLength={80} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></label>
                <label>Descrição<input maxLength={240} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} /></label>
                <div className="form-row"><label>Preço (R$)<input type="number" min={0} step="0.01" required value={editing.price} onChange={e => setEditing({ ...editing, price: Number(e.target.value) })} /></label><label>Duração (min)<input type="number" min={5} required value={editing.minutes} onChange={e => setEditing({ ...editing, minutes: Number(e.target.value) })} /></label></div>
                <label className="checkbox"><input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} />Disponível para novos agendamentos</label>
                <div className="form-row"><button className="primary">Salvar serviço</button><button type="button" className="text-button" onClick={() => setEditing(null)}>Voltar</button></div>
              </form>}
              <div className="admin-services">{data.services.map(s => <article className="appointment" key={s.id}><div><h3>{s.name}</h3><p>{s.description}<br />{s.minutes} minutos · {s.active ? 'Ativo' : 'Pausado'}</p></div><strong>{money(s.price)}</strong><button className="text-button" onClick={() => setEditing({ ...s })}>Editar</button><button className="text-button" onClick={() => deleteService(s)}>Excluir</button></article>)}</div>
            </>}

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