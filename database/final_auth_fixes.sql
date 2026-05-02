-- ═══════════════════════════════════════════════════════════════════════════════
--  FSSS — Correções Finais de Funções e Autenticação v5
--  Execute APENAS ESTE ARQUIVO no SQL Editor do seu projeto Supabase.
--  Ele contém todas as funções necessárias e corrigidas.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- Função Auxiliar: fn_is_admin(p_usuario_id)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_is_admin(p_usuario_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1
    FROM usuarios
    WHERE id = p_usuario_id AND perfil = 'admin'
  );
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Função de Upload de Imagem via RPC
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_admin_upload_item_image(
    p_admin_id UUID,
    p_file_body TEXT,
    p_file_path TEXT,
    p_content_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_public_url TEXT;
  v_file_bytea BYTEA;
BEGIN
  IF NOT fn_is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Apenas administradores podem fazer upload de imagens.';
  END IF;

  v_file_bytea := decode(p_file_body, 'base64');

  INSERT INTO storage.objects (bucket_id, name, owner_id, metadata)
  VALUES ('item-images', p_file_path, p_admin_id, jsonb_build_object('contentType', p_content_type, 'size', octet_length(v_file_bytea), 'mimetype', p_content_type));

  v_public_url := (SELECT url FROM storage.get_object_url('item-images', p_file_path));

  RETURN v_public_url;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_admin_upload_item_image(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_admin_upload_item_image(UUID, TEXT, TEXT, TEXT) TO anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- Funções de CRUD de Itens (Atualizadas com verificação de admin)
-- ─────────────────────────────────────────────────────────────────────────────

-- fn_criar_item (CORRIGIDA)
CREATE OR REPLACE FUNCTION fn_criar_item(
    p_admin_id       UUID,
    p_nome           TEXT,
    p_descricao      TEXT,
    p_categoria      categoria_item,
    p_imagem_url     TEXT    DEFAULT NULL,
    p_total_unidades INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
    v_id UUID;
BEGIN
    IF NOT fn_is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Apenas administradores podem criar itens.';
    END IF;

    INSERT INTO itens (nome, descricao, categoria, imagem_url, disponivel, total_unidades)
    VALUES (p_nome, p_descricao, p_categoria, p_imagem_url, TRUE, p_total_unidades)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION fn_criar_item(UUID, TEXT, TEXT, categoria_item, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_criar_item(UUID, TEXT, TEXT, categoria_item, TEXT, INTEGER) TO anon;


-- fn_deletar_item (CORRIGIDA)
CREATE OR REPLACE FUNCTION fn_deletar_item(
  p_admin_id UUID,
  p_item_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
    IF NOT fn_is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Apenas administradores podem deletar itens.';
    END IF;
    DELETE FROM itens WHERE id = p_item_id;
END;
$$;
GRANT EXECUTE ON FUNCTION fn_deletar_item(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_deletar_item(UUID, UUID) TO anon;


-- fn_atualizar_item (CORRIGIDA)
CREATE OR REPLACE FUNCTION fn_atualizar_item(
    p_admin_id       UUID,
    p_id             UUID,
    p_nome           TEXT,
    p_descricao      TEXT,
    p_imagem_url     TEXT    DEFAULT NULL,
    p_total_unidades INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
    IF NOT fn_is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Apenas administradores podem atualizar itens.';
    END IF;

    UPDATE itens SET
        nome           = p_nome,
        descricao      = p_descricao,
        imagem_url     = p_imagem_url,
        total_unidades = p_total_unidades
    WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION fn_atualizar_item(UUID, UUID, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_atualizar_item(UUID, UUID, TEXT, TEXT, TEXT, INTEGER) TO anon;


-- Confirmação
SELECT 'Correções FINAIS de funções de autenticação foram aplicadas. O sistema está pronto para o teste.' as status;
