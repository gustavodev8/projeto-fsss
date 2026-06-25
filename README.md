# FSSS - Sistema de Reservas

Sistema de reservas para escola, preparado para rodar em hospedagem compartilhada com `PHP + MySQL` e frontend em `React`.

## Arquitetura

- Frontend: React 18 + TypeScript + Vite
- Backend: PHP 8+ em API REST
- Banco: MySQL
- Upload de imagens: diretório local em `backend/public/uploads`
- Autenticação: sessão via API e `localStorage` no frontend

## Estrutura

- `src/` - frontend da aplicação
- `backend/` - API em PHP, migrations SQL e arquivos de deploy
- `backend/public/` - webroot da API para HostGator

## Rodando localmente

1. Instale dependencias

```bash
npm install
```

2. Configure o backend PHP

- Copie `backend/.env.example` para `backend/.env`
- Ajuste as credenciais do MySQL

3. Suba a API PHP

```bash
npm run api:dev
```

4. Suba o frontend

```bash
npm run dev
```

## Banco de dados

Use os arquivos em `backend/database/` nesta ordem:

1. `schema.mysql.sql`
2. `seed.mysql.sql`

O `seed.mysql.sql` ja inclui:

- Admin: `admin@fsss.edu.br` / `admin@fsss`
- Professores demo: `ana.silva@fsss.edu.br` / `professor`
- Professores demo: `carlos.mendes@fsss.edu.br` / `professor`

## Deploy na HostGator

1. Envie o conteudo de `backend/public/` para a pasta publica do site ou aponte o dominio para essa pasta.
2. Envie o restante do backend para uma pasta fora do webroot, por exemplo `backend/`.
3. Configure o arquivo `backend/.env` com os dados reais do MySQL da HostGator.
4. Execute `schema.mysql.sql` e `seed.mysql.sql` no phpMyAdmin.
5. Gere o build do frontend:

```bash
npm run build
```

6. Publique o conteudo de `dist/` onde o frontend sera servido.

## Credenciais demo

- Admin: `admin@fsss.edu.br` / `admin@fsss`
- Professor: `ana.silva@fsss.edu.br` / `professor`

## Observacao importante

O projeto nao depende mais de Supabase. Toda a operacao foi migrada para a API PHP com MySQL para encaixar no cenario de hospedagem compartilhada.
