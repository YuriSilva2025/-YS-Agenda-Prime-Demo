"use client";

import { useMemo, useState } from "react";
import { Calendar, money } from "@/lib/api";
import { earnings, receiptDate } from "@/lib/earnings";
import { DEMO_TODAY, demoMonths } from "@/lib/demo";

type PeriodItem = {
  label: string;
  total: number;
  count: number;
};

type Point = {
  x: number;
  y: number;
};

type ChartGeometry = {
  width: number;
  height: number;
  left: number;
  right: number;
  baseline: number;
  points: Point[];
  grid: Array<{ y: number; value: number }>;
};

function buildChart(values: number[]): ChartGeometry {
  const width = 780;
  const height = 300;
  const left = 68;
  const right = 28;
  const top = 38;
  const bottom = 50;

  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;

  const highest = Math.max(...values, 1);
  const step = highest > 5000 ? 1000 : highest > 2000 ? 500 : 250;
  const ceiling = Math.max(step, Math.ceil(highest / step) * step);

  const points = values.map((value, index) => {
    const x =
      values.length === 1
        ? left + chartWidth / 2
        : left + (index / (values.length - 1)) * chartWidth;
    const y = top + chartHeight - (value / ceiling) * chartHeight;

    return { x, y };
  });

  const grid = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    y: top + chartHeight - chartHeight * ratio,
    value: ceiling * ratio,
  }));

  return {
    width,
    height,
    left,
    right,
    baseline: height - bottom,
    points,
    grid,
  };
}

function straightLine(points: Point[]) {
  if (!points.length) return "";

  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");
}

function smoothLine(points: Point[]) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const middleX = (previous.x + current.x) / 2;

    path += ` C ${middleX.toFixed(2)} ${previous.y.toFixed(2)}, ${middleX.toFixed(2)} ${current.y.toFixed(2)}, ${current.x.toFixed(2)} ${current.y.toFixed(2)}`;
  }

  return path;
}

function straightArea(points: Point[], baseline: number) {
  if (!points.length) return "";

  return [
    `M ${points[0].x} ${baseline}`,
    `L ${points[0].x} ${points[0].y}`,
    ...points.slice(1).map((point) => `L ${point.x} ${point.y}`),
    `L ${points[points.length - 1].x} ${baseline}`,
    "Z",
  ].join(" ");
}

function smoothArea(points: Point[], baseline: number) {
  if (!points.length) return "";

  let path = `M ${points[0].x} ${baseline} L ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const middleX = (previous.x + current.x) / 2;

    path += ` C ${middleX.toFixed(2)} ${previous.y.toFixed(2)}, ${middleX.toFixed(2)} ${current.y.toFixed(2)}, ${current.x.toFixed(2)} ${current.y.toFixed(2)}`;
  }

  path += ` L ${points[points.length - 1].x} ${baseline} Z`;
  return path;
}

function shortMoney(value: number) {
  if (value >= 1000) {
    const thousands = (value / 1000).toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });

    return `R$ ${thousands} mil`;
  }

  return `R$ ${Math.round(value)}`;
}

export default function Earnings({
  data,
  demo = false,
}: {
  data: Calendar;
  demo?: boolean;
}) {
  const [mode, setMode] = useState<"month" | "week">("month");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const today = receiptDate(new Date().toISOString());
  const weeks = earnings(data.appointments, today, "week");
  const months = earnings(data.appointments, today, "month");

  const monthlyItems: PeriodItem[] = demo
    ? demoMonths.map((month) => ({
        label: month.label,
        total: month.total,
        count: month.count,
      }))
    : months.map((month) => ({
        label: new Date(`${month.from}T12:00:00Z`).toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
          timeZone: "UTC",
        }),
        total: month.total,
        count: month.count,
      }));

  const weeklyItems: PeriodItem[] = demo
    ? [
        { label: "10 Ago", total: 1160, count: 14 },
        { label: "17 Ago", total: 1420, count: 18 },
        { label: "24 Ago", total: 1280, count: 16 },
        { label: "31 Ago", total: 1690, count: 21 },
        { label: "07 Set", total: 1510, count: 19 },
        { label: "14 Set", total: 1380, count: 17 },
      ]
    : weeks.map((week) => ({
        label: new Date(`${week.from}T12:00:00Z`).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          timeZone: "UTC",
        }),
        total: week.total,
        count: week.count,
      }));

  const items = mode === "month" ? monthlyItems : weeklyItems;
  const chart = useMemo(
    () => buildChart(items.map((item) => item.total)),
    [items],
  );

  const line =
    mode === "month"
      ? straightLine(chart.points)
      : smoothLine(chart.points);

  const area =
    mode === "month"
      ? straightArea(chart.points, chart.baseline)
      : smoothArea(chart.points, chart.baseline);

  const current = items[items.length - 1];
  const previous = items[items.length - 2];
  const difference =
    current && previous ? current.total - previous.total : 0;
  const percentage =
    current && previous?.total
      ? Math.round((Math.abs(difference) / previous.total) * 100)
      : 0;

  const currentMonth = monthlyItems[monthlyItems.length - 1];
  const currentWeek = weeklyItems[weeklyItems.length - 1];
  const dayKey = demo ? DEMO_TODAY : today;
  const dayReceipts = data.appointments.filter((appointment) => appointment.payment && receiptDate(appointment.payment.receivedAt) === dayKey);
  const currentDay = {
    total: Math.round(dayReceipts.reduce((sum, appointment) => sum + appointment.payment!.amount * 100, 0)) / 100,
    count: dayReceipts.length,
  };

  const receipts = data.appointments
    .filter((appointment) => appointment.payment)
    .sort((a, b) =>
      b.payment!.receivedAt.localeCompare(a.payment!.receivedAt),
    )
    .slice(0, 10);


  const serviceRanking = demo
    ? [
        { name: "Atendimento Essencial", count: 26, total: 1040 },
        { name: "Atendimento Premium", count: 18, total: 1080 },
        { name: "Pacote Completo", count: 11, total: 935 },
        { name: "Serviço Adicional", count: 6, total: 150 },
      ]
    : Object.values(
        data.appointments
          .filter((appointment) => appointment.status === "confirmed")
          .reduce<Record<string, { name: string; count: number; total: number }>>(
            (acc, appointment) => {
              const name = appointment.service;
              const current = acc[name] ?? { name, count: 0, total: 0 };
              current.count += 1;
              current.total += appointment.price;
              acc[name] = current;
              return acc;
            },
            {},
          ),
      )
        .sort((a, b) => b.count - a.count || b.total - a.total)
        .slice(0, 5);

  const serviceRankingMax = Math.max(
    ...serviceRanking.map((service) => service.count),
    1,
  );

  const switchMode = (nextMode: "month" | "week") => {
    setMode(nextMode);
    setHoveredPoint(null);
  };

  return (
    <>
      <p className="muted">
        Acompanhe os recebimentos e a evolução financeira do negócio.
        {demo && " Nesta demonstração, os valores são fictícios."}
      </p>

      <div className="stats dashboard-stats">
        <article>
          <span>Recebido nesta semana</span>
          <strong>{money(currentWeek?.total ?? 0)}</strong>
          <small>{currentWeek?.count ?? 0} recebimentos</small>
        </article>

        <article>
          <span>Recebido neste mês</span>
          <strong>{money(currentMonth?.total ?? 0)}</strong>
          <small>{currentMonth?.count ?? 0} recebimentos</small>
        </article>

        <article>
          <span>Recebido hoje</span>
          <strong>{money(currentDay.total)}</strong>
          <small>{currentDay.count} recebimento{currentDay.count === 1 ? '' : 's'}</small>
        </article>
      </div>

      <section className="ys-earnings-panel" aria-label="Evolução dos ganhos">
        <div className="ys-chart-top">
          <div>
            <p className="eyebrow">EVOLUÇÃO DOS RECEBIMENTOS</p>
            <h2>
              {mode === "month"
                ? "Desempenho mensal"
                : "Desempenho semanal"}
            </h2>
            <p className="ys-chart-description">
              Passe o mouse sobre cada ponto para ver o valor do período.
            </p>
          </div>

          <div className="ys-chart-switch" aria-label="Período do gráfico">
            <button
              type="button"
              className={mode === "month" ? "active" : ""}
              aria-pressed={mode === "month"}
              onClick={() => switchMode("month")}
            >
              Mensal
            </button>

            <button
              type="button"
              className={mode === "week" ? "active" : ""}
              aria-pressed={mode === "week"}
              onClick={() => switchMode("week")}
            >
              Semanal
            </button>
          </div>
        </div>

        <div className="ys-chart-info">
          <div>
            <span>Período atual</span>
            <strong>{money(current?.total ?? 0)}</strong>
          </div>

          <div>
            <span>Comparação anterior</span>
            <strong
              className={difference >= 0 ? "ys-positive" : "ys-negative"}
            >
              {previous?.total
                ? `${difference >= 0 ? "+" : "−"}${percentage}%`
                : "—"}
            </strong>
          </div>

          <div>
            <span>Recebimentos</span>
            <strong>{current?.count ?? 0}</strong>
          </div>
        </div>

        <div className="ys-chart-wrapper">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="ys-chart-svg"
            role="img"
            aria-label={
              mode === "month"
                ? "Gráfico mensal de ganhos"
                : "Gráfico semanal de ganhos"
            }
          >
            <defs>
              <linearGradient id="ysGoldArea" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="#dfb867"
                  stopOpacity={mode === "week" ? "0.5" : "0.24"}
                />
                <stop offset="100%" stopColor="#dfb867" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="ysGoldLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a67d35" />
                <stop offset="52%" stopColor="#f1ce82" />
                <stop offset="100%" stopColor="#dfb867" />
              </linearGradient>

              <filter id="ysGoldGlow">
                <feGaussianBlur stdDeviation="3.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {chart.grid.map((grid, index) => (
              <g key={index}>
                <line
                  x1={chart.left}
                  x2={chart.width - chart.right}
                  y1={grid.y}
                  y2={grid.y}
                  className="ys-grid-line"
                />
                <text
                  x={chart.left - 12}
                  y={grid.y + 4}
                  textAnchor="end"
                  className="ys-axis-text"
                >
                  {shortMoney(grid.value)}
                </text>
              </g>
            ))}

            <path d={area} fill="url(#ysGoldArea)" />
            <path
              d={line}
              fill="none"
              stroke="url(#ysGoldLine)"
              className="ys-chart-line"
              filter="url(#ysGoldGlow)"
            />

            {chart.points.map((point, index) => {
              const tooltipWidth = 154;
              const tooltipHeight = 52;
              const tooltipX = Math.min(
                Math.max(point.x - tooltipWidth / 2, 8),
                chart.width - tooltipWidth - 8,
              );
              const tooltipY =
                point.y > 88
                  ? point.y - tooltipHeight - 18
                  : point.y + 18;

              return (
                <g
                  key={`${items[index]?.label}-${index}`}
                  className="ys-chart-point-group"
                  onMouseEnter={() => setHoveredPoint(index)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="20"
                    fill="transparent"
                    className="ys-point-hitbox"
                  />

                  {hoveredPoint === index && (
                    <line
                      x1={point.x}
                      x2={point.x}
                      y1={point.y}
                      y2={chart.baseline}
                      className="ys-hover-guide"
                    />
                  )}

                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={hoveredPoint === index ? 11 : 8}
                    className="ys-point-glow"
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={hoveredPoint === index ? 5.5 : 4}
                    className="ys-point"
                  />

                  {hoveredPoint === index && (
                    <g className="ys-chart-tooltip" pointerEvents="none">
                      <rect
                        x={tooltipX}
                        y={tooltipY}
                        width={tooltipWidth}
                        height={tooltipHeight}
                        rx="9"
                        className="ys-tooltip-background"
                      />
                      <text
                        x={tooltipX + tooltipWidth / 2}
                        y={tooltipY + 18}
                        textAnchor="middle"
                        className="ys-tooltip-period"
                      >
                        {items[index].label}
                      </text>
                      <text
                        x={tooltipX + tooltipWidth / 2}
                        y={tooltipY + 38}
                        textAnchor="middle"
                        className="ys-tooltip-value"
                      >
                        {money(items[index].total)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {items.map((item, index) => (
              <text
                key={`${item.label}-axis`}
                x={chart.points[index]?.x}
                y={chart.height - 14}
                textAnchor="middle"
                className="ys-bottom-label"
              >
                {item.label}
              </text>
            ))}
          </svg>
        </div>

        <div className="ys-chart-footer">
          <span>
            {mode === "month"
              ? "Linha com pontos · evolução mês a mês"
              : "Curva com área · evolução semana a semana"}
          </span>
          <strong>
            {demo
              ? "Dados fictícios para apresentação"
              : "Dados registrados no sistema"}
          </strong>
        </div>
      </section>

      <section className="ys-top-services" aria-label="Serviços mais realizados">
        <div className="ys-top-services-head">
          <div>
            <p className="eyebrow">DESTAQUES DO MÊS</p>
            <h2>Serviços mais realizados</h2>
            <p>Veja quais atendimentos mais saíram no período.</p>
          </div>
          <span>{demo ? "Demonstração" : "Dados do sistema"}</span>
        </div>

        <div className="ys-top-services-list">
          {serviceRanking.map((service, index) => (
            <article className="ys-top-service" key={service.name}>
              <div className="ys-top-service-row">
                <div>
                  <b>{index + 1}</b>
                  <strong>{service.name}</strong>
                </div>
                <div className="ys-top-service-values">
                  <strong>{service.count}x</strong>
                  <span>{money(service.total)}</span>
                </div>
              </div>
              <div className="ys-top-service-track" aria-hidden="true">
                <i style={{ width: `${(service.count / serviceRankingMax) * 100}%` }} />
              </div>
            </article>
          ))}
        </div>

        <div className="ys-top-services-footer">
          <span>Quantidade de atendimentos</span>
          <strong>{demo ? "Dados fictícios para apresentação" : "Atualizado com os atendimentos registrados"}</strong>
        </div>
      </section>

      <div className="section-heading ys-receipts-title">
        <div>
          <p className="eyebrow">MOVIMENTAÇÕES</p>
          <h2>Últimos recebimentos</h2>
        </div>
        <span>Fluxo financeiro recente</span>
      </div>

      {receipts.length ? (
        <div className="appointment-list">
          {receipts.map((appointment) => (
            <article className="appointment" key={appointment.id}>
              <div>
                <h3>{appointment.name}</h3>
                <p>
                  {appointment.service} ·{" "}
                  {new Date(
                    appointment.payment!.receivedAt,
                  ).toLocaleDateString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                  })}
                </p>
              </div>
              <strong className="appointment-time">
                {money(appointment.payment!.amount)}
              </strong>
            </article>
          ))}
        </div>
      ) : (
        <div className="calendar-empty">Nenhum recebimento registrado.</div>
      )}

      <p className="muted">
        Valores demonstrativos. O painel pode ser adaptado aos relatórios e
        indicadores de cada negócio.
      </p>
    </>
  );
}
