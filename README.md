# Agenda Prime — Demo comercial da YS Soluções Digitais

Versão de demonstração criada para apresentações comerciais da **YS Soluções Digitais**.

Esta cópia foi separada do projeto original para não depender de contas, senhas ou dados reais. Todo o conteúdo da demo é fictício e fica apenas no navegador por meio de `localStorage`.

## O que foi alterado

- Removida a exigência de login e senha na página do cliente e no painel administrativo.
- Removidos nome, símbolo, textos e imagens da identidade Altheon.
- Criada a identidade fictícia **Agenda Prime** para a demonstração.
- Inserida a marca **YS Soluções Digitais** na apresentação comercial.
- Mantida a paleta escura com detalhes dourados.
- Incluídos serviços, clientes, agenda, bloqueios e recebimentos fictícios.
- Incluída opção de adicionar cliente presencial.
- Incluída opção de acrescentar um serviço adicional durante um atendimento.
- Incluídos quatro meses fictícios no gráfico de ganhos:
  - Jun/2026 — R$ 7.220 — 93 atendimentos
  - Jul/2026 — R$ 8.040 — 104 atendimentos
  - Ago/2026 — R$ 7.680 — 98 atendimentos
  - Set/2026 — R$ 4.920 — 61 atendimentos (mês em andamento)
- Incluído botão para restaurar os dados originais da demonstração.

## Páginas

- `/` — página do cliente e simulação de agendamento.
- `/admin/` — painel administrativo aberto.
- `/conta/` — exemplo da área do cliente sem login.

## Como funciona a demo

Os dados iniciais estão em `src/lib/demo.ts`.

Quando alguém faz um agendamento, edita um serviço, marca um recebimento ou altera a disponibilidade, a alteração é salva somente no `localStorage` daquele navegador.

Para restaurar a demonstração, abra `/admin/`, entre na aba **Apresentação** e clique em **Restaurar dados da demonstração**.

## Rodar localmente

Requer Node.js 22 ou superior.

```bash
npm ci
npm run build
npm start
```

Depois abra:

```text
http://127.0.0.1:3000
```

Para desenvolvimento:

```bash
npm ci
npm run dev
```

## Publicar na Netlify

O projeto usa exportação estática do Next.js.

- Build command: `npm run build`
- Publish directory: `out`
- Node: `22`

O arquivo `netlify.toml` já contém essa configuração.

## Importante

Esta é uma versão de apresentação. Não usa banco de produção, autenticação real nem dados reais de clientes.

A versão de um cliente pode receber novamente autenticação, persistência no servidor, domínio próprio, WhatsApp, integrações e regras específicas do negócio.


## Versão final — gráfico de ganhos

A aba **Ganhos** usa um único painel alternável:
- **Mensal:** linha com pontos.
- **Semanal:** curva com área preenchida.
- **Hover:** passe o mouse em qualquer bolinha para ver o período e o valor.

O painel segue a identidade visual preta e dourada da demonstração.
