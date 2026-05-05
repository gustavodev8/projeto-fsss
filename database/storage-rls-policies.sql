-- Este script configura as Políticas de Segurança a Nível de Linha (RLS)
-- para o bucket 'item-images' no Supabase Storage.
-- Execute este script uma vez no seu SQL Editor no painel do Supabase.

-- 1. Política de Acesso Público para Leitura (SELECT)
-- Permite que qualquer pessoa (anônima ou autenticada) possa visualizar/baixar os arquivos.
-- Isso é necessário para que as imagens dos itens apareçam no site para todos.
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'item-images' );

-- 2. Política de Acesso para Inserção (INSERT) para Admins
-- Permite que APENAS usuários com perfil 'admin' na tabela 'public.usuarios' façam upload.
DROP POLICY IF EXISTS "Admin Insert Access" ON storage.objects;
CREATE POLICY "Admin Insert Access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'item-images' AND
  (SELECT perfil FROM public.usuarios WHERE id = auth.uid()) = 'admin'::perfil_usuario
);

-- 3. Política de Acesso para Atualização (UPDATE) para Admins
-- Permite que APENAS usuários com perfil 'admin' atualizem/substituam arquivos.
DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
CREATE POLICY "Admin Update Access"
ON storage.objects FOR UPDATE
WITH CHECK (
  bucket_id = 'item-images' AND
  (SELECT perfil FROM public.usuarios WHERE id = auth.uid()) = 'admin'::perfil_usuario
);

-- 4. Política de Acesso para Exclusão (DELETE) para Admins
-- Permite que APENAS usuários com perfil 'admin' deletem arquivos.
DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;
CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'item-images' AND
  (SELECT perfil FROM public.usuarios WHERE id = auth.uid()) = 'admin'::perfil_usuario
);
