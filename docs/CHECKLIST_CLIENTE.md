# Checklist de Entrega e Publicacao

Use este checklist para validar o sistema antes de mandar ao cliente e antes de publicar na HostGator.

## Antes de enviar o zip

- [ ] O projeto foi compactado a partir da pasta raiz original
- [ ] O arquivo `backend/.env` nao foi incluido no zip
- [ ] A pasta `node_modules/` nao foi incluida no zip
- [ ] A pasta `.agents/` nao foi incluida no zip
- [ ] A pasta `.lovable/` nao foi incluida no zip
- [ ] O arquivo `dist/.htaccess` esta presente
- [ ] O arquivo `backend/public/.htaccess` esta presente

## Estrutura que o cliente precisa receber

- [ ] `backend/`
- [ ] `dist/`
- [ ] `docs/`

## Banco de dados

- [ ] O banco MySQL foi criado na HostGator
- [ ] O usuario MySQL foi criado
- [ ] O usuario recebeu permissao total no banco
- [ ] O arquivo `backend/database/schema.mysql.sql` foi importado
- [ ] O arquivo `backend/database/seed.mysql.sql` foi importado

## Configuracao do backend

- [ ] O arquivo `backend/.env` foi criado no servidor
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_URL` aponta para o dominio real
- [ ] `APP_BASE_PATH=/api`
- [ ] `DB_HOST` esta correto
- [ ] `DB_NAME` esta correto
- [ ] `DB_USER` esta correto
- [ ] `DB_PASS` esta correto
- [ ] `CORS_ALLOWED_ORIGINS` aponta para o dominio do site

## Publicacao no HostGator

- [ ] O conteudo de `dist/` foi enviado para a pasta publica do site
- [ ] O `dist/.htaccess` foi enviado junto
- [ ] O conteudo de `backend/public/` foi enviado para a rota da API, por exemplo `/api`
- [ ] O conteudo de `backend/src/` foi colocado em uma pasta privada fora do webroot
- [ ] O conteudo de `backend/database/` foi colocado em uma pasta privada fora do webroot
- [ ] A pasta `backend/public/uploads/` tem permissao de escrita

## Testes depois da publicacao

- [ ] A pagina inicial abre sem tela branca
- [ ] A rota `/login` abre corretamente
- [ ] A rota `/admin` abre corretamente para usuario admin
- [ ] O login funciona
- [ ] As salas aparecem na listagem
- [ ] Os equipamentos aparecem na listagem
- [ ] A reserva grava no banco
- [ ] O upload de imagem funciona
- [ ] A API responde em `/api/health`

## Problemas comuns

- [ ] Se der 404 nas rotas do frontend, verificar o `dist/.htaccess`
- [ ] Se der erro de banco, verificar credenciais do `backend/.env`
- [ ] Se upload falhar, verificar permissao da pasta `backend/public/uploads/`
- [ ] Se a API nao responder, verificar se `backend/public/` foi publicado no caminho correto

