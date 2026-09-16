# Validação da demonstração final

## Objetivo
Versão comercial isolada do projeto real, com identidade YS Soluções Digitais / Agenda Prime.

## Ganhos
- Um único painel de gráfico.
- Botões `Mensal` e `Semanal` no mesmo painel.
- Mensal: linha com pontos no tema preto/dourado.
- Semanal: curva suave com área preenchida no tema preto/dourado.
- Ao passar o mouse em cada ponto, aparece o período e o valor daquele ponto.
- Cards de recebido na semana, recebido no mês e ticket médio permanecem visíveis.

## Isolamento
- Sem login/Clerk na demo.
- Dados fictícios.
- Estado salvo apenas no navegador.
- Chave de armazenamento renovada nesta versão para iniciar limpa.
- Não altera o projeto real do Dariel nem dados de produção.

## Como executar
```bash
npm install
npm run dev
```

Abra `http://localhost:3000/admin` e clique em `Ganhos`.
