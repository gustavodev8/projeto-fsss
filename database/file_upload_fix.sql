-- ═══════════════════════════════════════════════════════════════════════════════
--  FSSS — Correção de Upload de Arquivo via RPC
--  Execute este arquivo no SQL Editor do seu projeto Supabase.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Função: fn_admin_upload_item_image
-- Recebe o conteúdo de um arquivo em base64, verifica se o usuário é admin,
-- e faz o upload para o Storage, retornando a URL pública.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_admin_upload_item_image(
    p_admin_id UUID,
    p_file_body TEXT,
    p_file_path TEXT,
    p_content_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
-- SECURITY DEFINER é crucial para que a função tenha privilégios de superuser
-- para inserir no bucket de storage, bypassando a RLS do cliente.
SECURITY DEFINER
AS $$
DECLARE
  v_public_url TEXT;
  v_file_bytea BYTEA;
BEGIN
  -- 1. Verificação de segurança: apenas admins podem chamar esta função.
  IF NOT fn_is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Apenas administradores podem fazer upload de imagens.';
  END IF;

  -- 2. Decodifica o corpo do arquivo de base64 para binário
  v_file_bytea := decode(p_file_body, 'base64');

  -- 3. Insere o objeto no storage. A política de INSERT que criamos antes
  -- permitirá esta ação pois a função roda como um superusuário que também
  -- é um 'authenticated user'.
  INSERT INTO storage.objects (bucket_id, name, owner, metadata)
  VALUES ('item-images', p_file_path, p_admin_id, jsonb_build_object('contentType', p_content_type, 'size', octet_length(v_file_bytea), 'mimetype', p_content_type));

  -- 4. Recupera a URL pública do arquivo recém-criado
  SELECT URL INTO v_public_url FROM storage.get_object_url('item-images', p_file_path);

  -- 5. Retorna a URL pública para o cliente
  RETURN v_public_url;
END;
$$;

-- Garante que a função pode ser chamada pelo cliente
GRANT EXECUTE ON FUNCTION fn_admin_upload_item_image(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_admin_upload_item_image(UUID, TEXT, TEXT, TEXT) TO anon;

SELECT 'Função fn_admin_upload_item_image criada com sucesso.' as status;
