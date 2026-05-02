-- ═══════════════════════════════════════════════════════════════════════════════
--  FSSS — Políticas de Segurança para Storage (RLS) v4 (Final e Segura)
--  Execute este arquivo no SQL Editor do seu projeto Supabase APÓS
--  ter executado o 'file_upload_fix.sql'.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Função Auxiliar: fn_is_admin(p_usuario_id)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_is_admin(p_usuario_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM usuarios
    WHERE id = p_usuario_id AND perfil = 'admin'
  );
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Políticas de Acesso para o Bucket: `item-images` (Versão Final)
-- ─────────────────────────────────────────────────────────────────────────────

-- Remove todas as políticas antigas para uma instalação limpa
DROP POLICY IF EXISTS "policy_admins_insert_item_images" ON storage.objects;
DROP POLICY IF EXISTS "policy_authenticated_insert_item_images_diag" ON storage.objects;
DROP POLICY IF EXISTS "policy_admins_update_item_images" ON storage.objects;
DROP POLICY IF EXISTS "policy_admins_delete_item_images" ON storage.objects;
DROP POLICY IF EXISTS "policy_authenticated_select_item_images" ON storage.objects;


-- Política 1: Permite que a função fn_admin_upload_item_image (que roda como superuser)
-- insira objetos. A segurança é garantida pela verificação DENTRO da função.
-- A checagem `auth.uid() IS NOT NULL` permite que qualquer usuário autenticado com um JWT
-- válido (se a autenticação for corrigida no futuro) também possa usar o upload direto.
CREATE POLICY "policy_admins_insert_item_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'item-images' AND
  fn_is_admin(auth.uid())
);


-- Política 2: Apenas administradores podem atualizar metadados de imagens.
CREATE POLICY "policy_admins_update_item_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'item-images' AND
  fn_is_admin(auth.uid())
);

-- Política 3: Apenas administradores podem deletar imagens.
CREATE POLICY "policy_admins_delete_item_images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'item-images' AND
  fn_is_admin(auth.uid())
);

-- Política 4: Permite que qualquer usuário autenticado (e a URL pública) veja as imagens.
CREATE POLICY "policy_authenticated_select_item_images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'item-images'
);

-- Confirmação
SELECT 'Políticas de segurança FINAIS do Storage foram aplicadas com sucesso.' as status;
