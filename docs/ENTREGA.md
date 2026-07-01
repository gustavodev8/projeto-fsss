# Guia de Entrega

Este projeto deve ser zipado a partir da pasta raiz atual, sem criar pasta intermediária.

## O que vai no zip

- `backend/`
- `dist/`
- `docs/`

## O que não vai no zip

- `node_modules/`
- `.env` real
- pastas de ferramenta interna, como `.agents/` e `.lovable/`
- arquivos de teste e desenvolvimento que não fazem parte do deploy

## Estrutura importante

### `backend/`

- `backend/src/` contém a API em PHP
- `backend/public/` é a pasta pública da API
- `backend/database/schema.mysql.sql` cria as tabelas
- `backend/database/seed.mysql.sql` popula dados iniciais
- `backend/.env.example` é o modelo de configuração

### `dist/`

- contém o frontend já compilado
- é o conteúdo que deve ser publicado no site principal

### `docs/`

- contém este guia de entrega
- pode ser enviado junto no zip para referência

## Como publicar na HostGator

### 1. Criar o banco MySQL

No cPanel da HostGator:

1. Acesse `MySQL Databases`
2. Crie um banco de dados
3. Crie um usuário MySQL
4. Dê permissão total desse usuário ao banco criado
5. Anote estes dados:
   - nome do banco
   - usuário
   - senha
   - host do MySQL

### 2. Importar o schema

No `phpMyAdmin`:

1. Selecione o banco criado
2. Importe o arquivo `backend/database/schema.mysql.sql`
3. Depois importe `backend/database/seed.mysql.sql`

Esses arquivos criam:
- usuários
- itens
- horários
- reservas
- datas bloqueadas
- dados iniciais do sistema

### 3. Configurar o backend

Crie o arquivo `backend/.env` usando `backend/.env.example` como base.

Exemplo de valores:

```env
APP_NAME=FSSS
APP_ENV=production
APP_DEBUG=false
APP_URL=https://seudominio.com
APP_TIMEZONE=America/Sao_Paulo
APP_BASE_PATH=/api
SESSION_NAME=fsss_session
SESSION_TTL_HOURS=8

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nome_do_banco
DB_USER=usuario_do_banco
DB_PASS=senha_do_banco
DB_CHARSET=utf8mb4

CORS_ALLOWED_ORIGINS=https://seudominio.com
UPLOAD_DIR=public/uploads
UPLOAD_PUBLIC_PATH=/uploads
MAX_UPLOAD_MB=5
```

Regras importantes:
- `APP_URL` precisa ser o domínio real do cliente
- `APP_BASE_PATH` deve continuar `/api`
- `CORS_ALLOWED_ORIGINS` deve apontar para o domínio do site

### 4. Publicar o frontend

O conteúdo de `dist/` deve ir para a pasta pública principal do site, normalmente:

- `public_html/`

Se o domínio já estiver apontando para uma pasta específica, copie o conteúdo de `dist/` para essa pasta.

### 5. Publicar a API

O conteúdo de `backend/public/` deve ir para a rota da API, por exemplo:

- `public_html/api/`

Se a HostGator permitir apontar a API para uma pasta fora do webroot, melhor ainda.

### 6. Colocar o backend privado

As pastas abaixo não devem ficar expostas publicamente:

- `backend/src/`
- `backend/database/`

Elas podem ficar em uma pasta privada fora de `public_html`, por exemplo:

- `fsss-backend/`

### 7. Permissões de upload

A pasta abaixo precisa permitir escrita:

- `backend/public/uploads/`

Sem isso, o upload de imagens não funciona.

## Ordem recomendada de publicação

1. Criar banco e usuário MySQL
2. Importar `schema.mysql.sql`
3. Importar `seed.mysql.sql`
4. Configurar `backend/.env`
5. Subir `dist/` para o site principal
6. Subir `backend/public/` para `/api`
7. Subir `backend/src/` e `backend/database/` para pasta privada
8. Testar login
9. Testar listagem de salas e equipamentos
10. Testar reserva e upload de imagem

## Checklist de validação

- a página inicial abre sem erro
- o login funciona
- o admin entra no painel
- salas e equipamentos carregam
- reservas são salvas no MySQL
- imagens enviadas por upload aparecem depois
- a URL da API responde em `/api`

## Problemas comuns

### 404 na API

Verifique:
- se `backend/public/` foi copiado para a pasta correta
- se a rota está realmente em `/api`
- se o `.htaccess` foi enviado

### Erro de banco

Verifique:
- se o `DB_HOST` está correto
- se o banco foi importado
- se usuário e senha do MySQL conferem

### Upload não funciona

Verifique:
- se `backend/public/uploads/` tem permissão de escrita
- se o arquivo foi enviado com tamanho menor que `MAX_UPLOAD_MB`

### Frontend não encontra a API

Verifique:
- se `APP_URL` está com o domínio real
- se `APP_BASE_PATH=/api`
- se o frontend publicado está acessando o mesmo domínio

## Observação final

O sistema já foi migrado para funcionar com `PHP + MySQL`, sem dependência de Supabase.

