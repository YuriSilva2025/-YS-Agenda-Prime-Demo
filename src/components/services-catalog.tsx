"use client";

import { useMemo, useState } from 'react';
import { Calendar, Service, money } from '@/lib/api';

type Filter = 'all' | 'active' | 'paused';

export default function ServicesCatalog({
  data,
  monthKey,
  onSave,
  onDelete,
  onToggle,
}: {
  data: Calendar;
  monthKey: string;
  onSave: (service: Service) => void;
  onDelete: (service: Service) => void;
  onToggle: (service: Service) => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Service | null>(null);

  const serviceUsage = useMemo(() => {
    const map = new Map<string, number>();

    for (const service of data.services) {
      const count = data.appointments.filter(appointment =>
        appointment.status === 'confirmed' && (
          appointment.serviceId === service.id ||
          appointment.items?.some(item => item.serviceId === service.id) ||
          appointment.service.includes(service.name)
        )
      ).length;
      map.set(service.id, count);
    }

    return map;
  }, [data.appointments, data.services]);

  const monthAppointments = data.appointments.filter(appointment =>
    appointment.status === 'confirmed' && appointment.date.startsWith(monthKey)
  );

  const forecast = monthAppointments.reduce((sum, appointment) => sum + appointment.price, 0);
  const activeCount = data.services.filter(service => service.active).length;
  const mostUsed = [...data.services].sort(
    (a, b) => (serviceUsage.get(b.id) ?? 0) - (serviceUsage.get(a.id) ?? 0),
  )[0];

  const filtered = data.services.filter(service =>
    filter === 'all' ? true : filter === 'active' ? service.active : !service.active
  );

  function submit(service: Service) {
    onSave(service);
    setEditing(null);
  }

  return <section className="services-catalog">
    <div className="services-summary">
      <article>
        <span className="services-summary-icon">✦</span>
        <div>
          <span>Total de serviços</span>
          <strong>{data.services.length}</strong>
          <small>{activeCount} ativo{activeCount === 1 ? '' : 's'} no catálogo</small>
        </div>
      </article>
      <article>
        <span className="services-summary-icon">◎</span>
        <div>
          <span>Mais realizado</span>
          <strong className="services-summary-name">{mostUsed?.name ?? '—'}</strong>
          <small>{mostUsed ? `${serviceUsage.get(mostUsed.id) ?? 0} atendimento${(serviceUsage.get(mostUsed.id) ?? 0) === 1 ? '' : 's'}` : 'Sem histórico'}</small>
        </div>
      </article>
      <article>
        <span className="services-summary-icon">↗</span>
        <div>
          <span>Receita prevista</span>
          <strong>{money(forecast)}</strong>
          <small>No mês selecionado</small>
        </div>
      </article>
    </div>

    <div className="services-catalog-toolbar">
      <div>
        <p className="eyebrow">CATÁLOGO</p>
        <h2>Serviços cadastrados</h2>
        <p>{data.services.length} item{data.services.length === 1 ? '' : 's'} no catálogo</p>
      </div>
      <button
        className="services-new"
        type="button"
        onClick={() => setEditing({ id: '', name: '', description: '', price: 0, minutes: 30, active: true })}
      >
        <span>+</span> Novo serviço
      </button>
    </div>

    <div className="services-filter" role="tablist" aria-label="Filtrar serviços">
      {([
        ['all', 'Todos'],
        ['active', 'Ativos'],
        ['paused', 'Pausados'],
      ] as [Filter, string][]).map(([id, label]) => <button
        key={id}
        type="button"
        role="tab"
        aria-selected={filter === id}
        className={filter === id ? 'is-active' : ''}
        onClick={() => setFilter(id)}
      >{label}</button>)}
    </div>

    {editing && <form className="service-form services-editor" onSubmit={event => {
      event.preventDefault();
      submit(editing);
    }}>
      <div className="services-editor-head">
        <div>
          <p className="eyebrow">{editing.id ? 'EDITAR SERVIÇO' : 'NOVO SERVIÇO'}</p>
          <h2>{editing.id ? editing.name || 'Editar serviço' : 'Adicionar ao catálogo'}</h2>
        </div>
        <button type="button" className="text-button" onClick={() => setEditing(null)}>Fechar</button>
      </div>

      <label>Nome<input required maxLength={80} value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} /></label>
      <label>Descrição<input maxLength={240} value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })} /></label>

      <div className="form-row">
        <label>Preço (R$)<input type="number" min={0} step="0.01" required value={editing.price} onChange={event => setEditing({ ...editing, price: Number(event.target.value) })} /></label>
        <label>Duração (min)<input type="number" min={5} required value={editing.minutes} onChange={event => setEditing({ ...editing, minutes: Number(event.target.value) })} /></label>
      </div>

      <label className="checkbox"><input type="checkbox" checked={editing.active} onChange={event => setEditing({ ...editing, active: event.target.checked })} />Disponível para novos agendamentos</label>

      <div className="services-editor-actions">
        <button className="primary" type="submit">Salvar serviço</button>
        {editing.id && <button className="services-delete" type="button" onClick={() => {
          onDelete(editing);
          setEditing(null);
        }}>Excluir serviço</button>}
      </div>
    </form>}

    <div className="services-cards">
      {filtered.map((service, index) => {
        const uses = serviceUsage.get(service.id) ?? 0;

        return <article className={service.active ? 'service-catalog-card' : 'service-catalog-card is-paused'} key={service.id}>
          <div className="service-catalog-order" aria-hidden="true">⋮⋮</div>
          <div className="service-catalog-symbol" aria-hidden="true">{index % 2 === 0 ? '✂' : '✦'}</div>

          <div className="service-catalog-copy">
            <div className="service-catalog-title">
              <h3>{service.name}</h3>
              <span>Serviço</span>
            </div>
            <p>{service.description || 'Serviço personalizado do catálogo.'}</p>
            <small>▣ {uses} atendimento{uses === 1 ? '' : 's'} registrado{uses === 1 ? '' : 's'}</small>
          </div>

          <div className="service-catalog-meta">
            <div><span>◷ Duração</span><strong>{service.minutes} min</strong></div>
            <div><span>◉ Preço</span><strong>{money(service.price)}</strong></div>
          </div>

          <button
            type="button"
            className={service.active ? 'service-status is-active' : 'service-status'}
            onClick={() => onToggle(service)}
            aria-label={service.active ? `Pausar ${service.name}` : `Ativar ${service.name}`}
          >
            <i />{service.active ? 'Ativo' : 'Pausado'}
          </button>

          <button type="button" className="service-edit-button" onClick={() => setEditing({ ...service })} aria-label={`Editar ${service.name}`}>✎</button>
        </article>;
      })}
    </div>

    {!filtered.length && <div className="calendar-empty">Nenhum serviço nesta categoria.</div>}

    <button
      className="services-add-card"
      type="button"
      onClick={() => setEditing({ id: '', name: '', description: '', price: 0, minutes: 30, active: true })}
    >
      <span>+</span>
      <strong>Adicionar novo serviço</strong>
      <small>Cadastre um novo item para o catálogo.</small>
    </button>
  </section>;
}
