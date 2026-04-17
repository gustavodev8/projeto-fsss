-- ═══════════════════════════════════════════════════════════════════════════════
--  FSSS — Funções e Permissões para integração com o frontend
--  Execute no SQL Editor do Supabase APÓS o schema.sql e seed.sql
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- Atualiza as senhas dos usuários de demonstração com hashes reais
-- (os do seed.sql são placeholders)
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE usuarios SET senha_hash = crypt('admin@fsss', gen_salt('bf', 12))
WHERE email = 'admin@fsss.edu.br';

UPDATE usuarios SET senha_hash = crypt('professor', gen_salt('bf', 12))
WHERE email IN ('ana.silva@fsss.edu.br', 'carlos.mendes@fsss.edu.br');


-- ─────────────────────────────────────────────────────────────────────────────
-- fn_login: verifica email + senha e retorna os dados do usuário
-- Chamada pelo frontend via supabase.rpc('fn_login', {...})
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_login(p_email TEXT, p_senha TEXT)
RETURNS TABLE (
    id     UUID,
    nome   TEXT,
    email  TEXT,
    perfil perfil_usuario
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.nome::TEXT, u.email::TEXT, u.perfil
    FROM usuarios u
    WHERE u.email    = p_email
      AND u.ativo    = TRUE
      AND u.senha_hash = crypt(p_senha, u.senha_hash);
END;
$$;

GRANT EXECUTE ON FUNCTION fn_login(TEXT, TEXT) TO anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- fn_criar_reserva: cria reserva + horários de forma atômica
-- Chamada pelo frontend via supabase.rpc('fn_criar_reserva', {...})
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
    v_reserva_id UUID;
    v_horario    RECORD;
BEGIN
    INSERT INTO reservas (usuario_id, item_id, data_reserva, quantidade, grupo_id)
    VALUES (p_usuario_id, p_item_id, p_data, p_quantidade, p_grupo_id)
    RETURNING id INTO v_reserva_id;

    FOR v_horario IN
        SELECT id FROM horarios WHERE label = ANY(p_horario_labels)
    LOOP
        INSERT INTO reserva_horarios (reserva_id, horario_id)
        VALUES (v_reserva_id, v_horario.id);
    END LOOP;

    RETURN v_reserva_id;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_criar_reserva(UUID, UUID, DATE, TEXT[], INTEGER, UUID) TO anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- Permissões para o role anon acessar as tabelas e a view
-- ─────────────────────────────────────────────────────────────────────────────

GRANT SELECT          ON itens                  TO anon;
GRANT SELECT          ON horarios               TO anon;
GRANT SELECT          ON vw_reservas_detalhadas TO anon;
GRANT SELECT, INSERT  ON reservas               TO anon;
GRANT SELECT, INSERT  ON reserva_horarios       TO anon;
GRANT UPDATE (status, cancelado_em) ON reservas TO anon;
