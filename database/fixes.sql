-- ═══════════════════════════════════════════════════════════════════════════════
--  FSSS — Correções de segurança e integridade
--  Execute no SQL Editor do Supabase APÓS o schema.sql, seed.sql e functions.sql
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. fn_deletar_item: soft delete — preserva histórico de reservas
--    Agora desativa o item (disponivel = FALSE) em vez de deletá-lo.
--    Reservas históricas continuam íntegras pois a FK permanece válida.
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS fn_deletar_item(UUID);

CREATE OR REPLACE FUNCTION fn_deletar_item(p_admin_id UUID, p_item_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM usuarios WHERE id = p_admin_id AND perfil = 'admin' AND ativo = TRUE
    ) THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    UPDATE itens SET disponivel = FALSE WHERE id = p_item_id;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_deletar_item(UUID, UUID) TO anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. fn_criar_reserva: validação atômica + bloqueio de concorrência
--    - Valida que o usuário existe e está ativo.
--    - Usa SELECT ... FOR UPDATE para evitar double-booking simultâneo.
--    - Verifica disponibilidade de cada horário antes de inserir.
--    - Lança exceção com código SLOT_UNAVAILABLE:<label> para o frontend tratar.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_criar_reserva(
    p_usuario_id      UUID,
    p_item_id         UUID,
    p_data            DATE,
    p_horario_labels  TEXT[],
    p_quantidade      INTEGER DEFAULT 1,
    p_grupo_id        UUID    DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reserva_id   UUID;
    v_horario      RECORD;
    v_total_units  INTEGER;
    v_ocupadas     INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = p_usuario_id AND ativo = TRUE) THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    -- Bloqueia a linha do item para evitar corrida entre transações simultâneas
    SELECT COALESCE(total_unidades, 1) INTO v_total_units
    FROM itens
    WHERE id = p_item_id AND disponivel = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ITEM_NOT_FOUND';
    END IF;

    -- Verifica disponibilidade de cada horário
    FOR v_horario IN
        SELECT id, label
        FROM horarios
        WHERE label = ANY(p_horario_labels) AND is_intervalo = FALSE
    LOOP
        v_ocupadas := fn_unidades_ocupadas(p_item_id, p_data, v_horario.id);
        IF v_ocupadas + p_quantidade > v_total_units THEN
            RAISE EXCEPTION 'SLOT_UNAVAILABLE:%', v_horario.label;
        END IF;
    END LOOP;

    INSERT INTO reservas (usuario_id, item_id, data_reserva, quantidade, grupo_id)
    VALUES (p_usuario_id, p_item_id, p_data, p_quantidade, p_grupo_id)
    RETURNING id INTO v_reserva_id;

    FOR v_horario IN
        SELECT id
        FROM horarios
        WHERE label = ANY(p_horario_labels) AND is_intervalo = FALSE
    LOOP
        INSERT INTO reserva_horarios (reserva_id, horario_id)
        VALUES (v_reserva_id, v_horario.id);
    END LOOP;

    RETURN v_reserva_id;
END;
$$;

-- Assinatura não mudou — grant existente continua válido, mas re-aplicar não faz mal
GRANT EXECUTE ON FUNCTION fn_criar_reserva(UUID, UUID, DATE, TEXT[], INTEGER, UUID) TO anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. fn_criar_usuario: exige admin_id válido
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS fn_criar_usuario(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION fn_criar_usuario(
    p_admin_id UUID,
    p_nome     TEXT,
    p_email    TEXT,
    p_senha    TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM usuarios WHERE id = p_admin_id AND perfil = 'admin' AND ativo = TRUE
    ) THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    INSERT INTO usuarios (nome, email, senha_hash, perfil)
    VALUES (p_nome, p_email, crypt(p_senha, gen_salt('bf', 12)), 'professor')
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_criar_usuario(UUID, TEXT, TEXT, TEXT) TO anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. fn_atualizar_usuario: exige admin_id válido
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS fn_atualizar_usuario(UUID, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION fn_atualizar_usuario(
    p_admin_id UUID,
    p_id       UUID,
    p_nome     TEXT,
    p_email    TEXT,
    p_senha    TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM usuarios WHERE id = p_admin_id AND perfil = 'admin' AND ativo = TRUE
    ) THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    UPDATE usuarios SET
        nome       = p_nome,
        email      = p_email,
        senha_hash = CASE
            WHEN p_senha IS NOT NULL AND p_senha != ''
            THEN crypt(p_senha, gen_salt('bf', 12))
            ELSE senha_hash
        END
    WHERE id = p_id AND perfil = 'professor';
END;
$$;

GRANT EXECUTE ON FUNCTION fn_atualizar_usuario(UUID, UUID, TEXT, TEXT, TEXT) TO anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. fn_deletar_usuario: exige admin_id válido
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS fn_deletar_usuario(UUID);

CREATE OR REPLACE FUNCTION fn_deletar_usuario(p_admin_id UUID, p_usuario_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM usuarios WHERE id = p_admin_id AND perfil = 'admin' AND ativo = TRUE
    ) THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    DELETE FROM usuarios WHERE id = p_usuario_id AND perfil = 'professor';
END;
$$;

GRANT EXECUTE ON FUNCTION fn_deletar_usuario(UUID, UUID) TO anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. fn_criar_item: exige admin_id válido
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS fn_criar_item(TEXT, TEXT, categoria_item, TEXT, INTEGER);

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
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM usuarios WHERE id = p_admin_id AND perfil = 'admin' AND ativo = TRUE
    ) THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    INSERT INTO itens (nome, descricao, categoria, imagem_url, disponivel, total_unidades)
    VALUES (p_nome, p_descricao, p_categoria, p_imagem_url, TRUE, p_total_unidades)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_criar_item(UUID, TEXT, TEXT, categoria_item, TEXT, INTEGER) TO anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. fn_atualizar_item: exige admin_id válido
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS fn_atualizar_item(UUID, TEXT, TEXT, TEXT, INTEGER);

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
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM usuarios WHERE id = p_admin_id AND perfil = 'admin' AND ativo = TRUE
    ) THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    UPDATE itens SET
        nome           = p_nome,
        descricao      = p_descricao,
        imagem_url     = p_imagem_url,
        total_unidades = p_total_unidades
    WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_atualizar_item(UUID, UUID, TEXT, TEXT, TEXT, INTEGER) TO anon;
