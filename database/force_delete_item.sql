-- ─────────────────────────────────────────────────────────────────────────────
-- fn_forcar_deletar_item: cancela todas as reservas e remove o item
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_forcar_deletar_item(p_admin_id UUID, p_item_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_perfil perfil_usuario;
BEGIN
    -- 1. Verifica se quem está chamando é admin
    SELECT perfil INTO v_perfil FROM usuarios WHERE id = p_admin_id;
    IF v_perfil != 'admin' THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem excluir itens.';
    END IF;

    -- 2. Cancela todas as reservas ativas para este item
    UPDATE reservas 
    SET status = 'cancelada', 
        cancelado_em = NOW() 
    WHERE item_id = p_item_id 
      AND status = 'confirmada';

    -- 3. Remove o item (Hard Delete conforme solicitado pelo fluxo de "apagar espaço")
    -- Se preferir Soft Delete, mude para: UPDATE itens SET disponivel = FALSE WHERE id = p_item_id;
    DELETE FROM itens WHERE id = p_item_id;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_forcar_deletar_item(UUID, UUID) TO anon;
