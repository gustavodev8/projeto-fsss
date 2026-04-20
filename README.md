# FSSS — Sistema de Reservas

Aplicação web para reserva de espaços e equipamentos da instituição. Professores fazem reservas pelo navegador; administradores gerenciam tudo por um painel dedicado.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilo | Tailwind CSS + shadcn/ui |
| Estado servidor | TanStack React Query v5 |
| Backend / DB | Supabase (PostgreSQL 15) |
| Autenticação | Custom via RPC (bcrypt) |
| PDF | jsPDF + jspdf-autotable |
| Storage | Supabase Storage |

---

## Estrutura de pastas

```
src/
├── contexts/
│   ├── AuthContext.tsx        # Sessão do usuário (login, logout, TTL 8h)
│   └── ReservationContext.tsx # Lista global de reservas ativas
├── services/
│   ├── auth.ts                # fn_login → Supabase RPC
│   ├── items.ts               # CRUD de espaços/equipamentos + upload de imagem
│   ├── reservations.ts        # Criar e cancelar reservas
│   └── users.ts               # CRUD de professores
├── pages/
│   ├── Login.tsx              # Tela de acesso
│   ├── Home.tsx               # Página inicial (escolha de categoria)
│   ├── Listing.tsx            # Lista de espaços ou equipamentos
│   ├── ReservationPage.tsx    # Fluxo de reserva (data + horários + equipamentos)
│   ├── MyReservations.tsx     # Minhas reservas (professor)
│   ├── AdminDashboard.tsx     # Painel admin (métricas + histórico)
│   └── AdminManage.tsx        # Gerenciar itens e professores
├── components/
│   ├── AdminLayout.tsx        # Layout com sidebar (desktop + mobile)
│   ├── Header.tsx             # Cabeçalho das páginas de usuário
│   └── ui/                    # Componentes shadcn/ui
├── types/index.ts             # Interfaces TypeScript globais
└── lib/
    ├── supabase.ts            # Cliente Supabase
    └── pdfUtils.ts            # Geração de relatório PDF
database/
├── schema.sql                 # Tabelas, enums, view, triggers
├── functions.sql              # Funções RPC iniciais + senhas de demo
├── seed.sql                   # Dados iniciais (usuários, horários, itens)
└── fixes.sql                  # Correções de segurança (rodar após functions.sql)
```

---

## Banco de dados

### Tabelas principais

**`usuarios`** — todos os usuários do sistema  
Campos relevantes: `id`, `nome`, `email`, `senha_hash` (bcrypt), `perfil` (`admin` | `professor`), `ativo`

**`itens`** — espaços e equipamentos reserváveis  
Campos relevantes: `id`, `nome`, `descricao`, `categoria` (`espacos` | `instrumentos`), `imagem_url`, `disponivel`, `total_unidades`  
> `disponivel = FALSE` = item deletado (soft delete). Histórico de reservas é preservado.

**`horarios`** — blocos de horário fixos do sistema (07:00–17:30)  
Cada linha tem `label` (ex: `"07:00 – 07:50"`), `hora_inicio`, `hora_fim`, `is_intervalo`, `ordem`

**`reservas`** — cada linha = 1 item reservado por 1 usuário em 1 data  
Campos relevantes: `id`, `grupo_id` (agrupa espaço + equipamentos da mesma operação), `usuario_id`, `item_id`, `data_reserva`, `quantidade`, `status` (`confirmada` | `cancelada`)

**`reserva_horarios`** — relação N:N entre reservas e horários

### View

**`vw_reservas_detalhadas`** — junta tudo em uma linha por reserva, com horários como array. Usada pelo frontend para carregar reservas sem precisar de JOINs manuais.

### Funções RPC principais

| Função | Quem chama | O que faz |
|--------|-----------|-----------|
| `fn_login(email, senha)` | Login page | Verifica bcrypt, retorna dados do usuário |
| `fn_criar_reserva(...)` | Professor | Cria reserva + horários de forma atômica, bloqueia linha para evitar double-booking |
| `fn_criar_item(admin_id, ...)` | Admin | Cria espaço ou equipamento |
| `fn_atualizar_item(admin_id, ...)` | Admin | Edita item |
| `fn_deletar_item(admin_id, ...)` | Admin | Soft delete (disponivel = FALSE) |
| `fn_criar_usuario(admin_id, ...)` | Admin | Cria professor com senha hasheada |
| `fn_atualizar_usuario(admin_id, ...)` | Admin | Edita professor |
| `fn_deletar_usuario(admin_id, ...)` | Admin | Remove professor |

> Todas as funções admin exigem um `admin_id` válido — o banco valida que o UUID pertence a um usuário com `perfil = 'admin'` antes de executar qualquer operação.

---

## Autenticação

O sistema **não usa** o Auth do Supabase. Usa autenticação própria:

1. Usuário envia email + senha → `fn_login` compara com `crypt(senha, senha_hash)` no banco
2. Se válido, retorna os dados do usuário
3. O frontend armazena no `localStorage` com chave `fsss_session` e **expiração de 8 horas**
4. Ao carregar a página, verifica se `Date.now() > expiresAt` — se sim, desloga automaticamente
5. Rotas protegidas por `AuthGate` (qualquer rota) e `AdminGate` (rotas `/admin` e `/gerenciar`)

```
Login → fn_login → { user, expiresAt } → localStorage → AuthContext → AuthGate/AdminGate
```

---

## Fluxo de reserva

```
1. Professor escolhe categoria (Espaços ou Equipamentos)
2. Seleciona o item na listagem
3. Escolhe a data no calendário
4. Seleciona os horários disponíveis (os ocupados aparecem bloqueados)
5. Se for Espaço: pode adicionar equipamentos opcionalmente
6. Clica em "Confirmar Reserva"
7. fn_criar_reserva executa:
   - Valida usuário ativo
   - Bloqueia linha do item (SELECT FOR UPDATE → sem double-booking)
   - Verifica disponibilidade de cada horário
   - Insere reserva + horários atomicamente
8. Confirmação exibida em modal
```

Se dois professores tentarem reservar o mesmo slot ao mesmo tempo, o segundo recebe uma mensagem de erro com o horário conflitante.

---

## Storage (imagens)

- Bucket: `item-images` (Supabase Storage, público)
- Upload via `uploadItemImage(file)` em `services/items.ts`
- Retorna URL pública → salva em `itens.imagem_url`
- Imagens quebradas mostram ícone placeholder automaticamente

**Políticas RLS necessárias no bucket:**
```sql
-- Permitir upload
CREATE POLICY "anon pode fazer upload em item-images"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'item-images');

-- Permitir leitura pública
CREATE POLICY "leitura publica item-images"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'item-images');
```

---

## Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Conta no Supabase

### 1. Instalar dependências
```bash
npm install
```

### 2. Variáveis de ambiente
Crie `.env` na raiz:
```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 3. Configurar banco de dados
Execute os arquivos SQL no **SQL Editor do Supabase**, nesta ordem:
```
1. database/schema.sql    → cria tabelas, enums, view, triggers
2. database/seed.sql      → insere dados iniciais
3. database/functions.sql → cria funções RPC e atualiza senhas de demo
4. database/fixes.sql     → aplica correções de segurança e integridade
```

### 4. Criar bucket de imagens
No Supabase: **Storage → New bucket → `item-images` → marcar Public**  
Depois rodar as políticas RLS descritas na seção Storage acima.

### 5. Rodar o projeto
```bash
npm run dev
```

---

## Credenciais de demonstração

| Perfil | Email | Senha |
|--------|-------|-------|
| Administrador | admin@fsss.edu.br | admin@fsss |
| Professor | ana.silva@fsss.edu.br | professor |
| Professor | carlos.mendes@fsss.edu.br | professor |

---

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima pública do Supabase |

---

## Decisões de arquitetura relevantes

**Por que RPC em vez de PostgREST direto?**  
As funções RPC rodam com `SECURITY DEFINER` no banco, o que permite controle fino de permissões. Operações sensíveis (ex: criar usuário com senha hasheada) nunca expõem lógica ao cliente.

**Por que autenticação customizada?**  
O sistema foi construído antes de usar Supabase Auth. A autenticação via `fn_login` + bcrypt funciona de forma equivalente para o caso de uso atual (usuários internos, sem auto-cadastro).

**Por que soft delete nos itens?**  
`DELETE` físico quebraria o histórico de reservas (FK). Com `disponivel = FALSE`, as reservas antigas continuam com referência válida ao item, e o histórico fica intacto.

**Por que grupo_id nas reservas?**  
Quando um professor reserva um espaço e adiciona equipamentos, todas as reservas recebem o mesmo `grupo_id`. Isso permite cancelar o conjunto inteiro com uma única operação.
