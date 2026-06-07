-- ─────────────────────────────────────────────────────────────────────────────
-- fn_deletar_item: Tentativa de remoção física (Hard Delete)
-- Só funciona se NÃO houver NENHUMA reserva (ativa ou cancelada) no histórico.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_deletar_item(p_admin_id UUID, p_item_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_perfil perfil_usuario;
BEGIN
    SELECT perfil INTO v_perfil FROM usuarios WHERE id = p_admin_id;
    IF v_perfil != 'admin' THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    DELETE FROM itens WHERE id = p_item_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- fn_forcar_deletar_item: Soft Delete com cancelamento de reservas
-- Cancela reservas futuras e marca como indisponível para sumir das listas.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_forcar_deletar_item(p_admin_id UUID, p_item_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_perfil perfil_usuario;
BEGIN
    SELECT perfil INTO v_perfil FROM usuarios WHERE id = p_admin_id;
    IF v_perfil != 'admin' THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    -- 1. Cancela as reservas ativas
    UPDATE reservas 
    SET status = 'cancelada', 
        cancelado_em = NOW() 
    WHERE item_id = p_item_id 
      AND status = 'confirmada';

    -- 2. Soft Delete (Remove da listagem mas mantém histórico)
    UPDATE itens SET disponivel = FALSE WHERE id = p_item_id;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_deletar_item(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION fn_forcar_deletar_item(UUID, UUID) TO anon;
