-- ═══════════════════════════════════════════════════════════════════════════════
--  FSSS — Sistema de Reserva de Espaços e Equipamentos
--  Schema SQL  |  PostgreSQL 14+
--  Execução:   psql -U <usuario> -d <banco> -f schema.sql
-- ═══════════════════════════════════════════════════════════════════════════════

-- Requer extensão para UUID (disponível por padrão no PostgreSQL 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─────────────────────────────────────────────────────────────────────────────
-- TIPOS ENUMERADOS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE perfil_usuario  AS ENUM ('admin', 'professor');
CREATE TYPE categoria_item  AS ENUM ('espacos', 'instrumentos');
CREATE TYPE status_reserva  AS ENUM ('confirmada', 'cancelada');


-- ─────────────────────────────────────────────────────────────────────────────
-- TABELA: usuarios
-- Armazena todos os usuários do sistema (administradores e professores).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE usuarios (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nome          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    senha_hash    TEXT         NOT NULL,   -- bcrypt ou argon2id
    perfil        perfil_usuario NOT NULL DEFAULT 'professor',
    ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email  ON usuarios (email);
CREATE INDEX idx_usuarios_perfil ON usuarios (perfil);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABELA: itens
-- Espaços (salas, laboratórios) e equipamentos (projetores, notebooks etc.).
-- Para espaços: total_unidades = NULL (sempre 1 unidade, não divisível).
-- Para instrumentos: total_unidades indica a quantidade total disponível.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE itens (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    nome           VARCHAR(255)   NOT NULL,
    descricao      TEXT,
    categoria      categoria_item NOT NULL,
    imagem_url     TEXT,
    disponivel     BOOLEAN        NOT NULL DEFAULT TRUE,
    total_unidades INTEGER        CHECK (total_unidades > 0),
    criado_em      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    atualizado_em  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    -- Instrumentos obrigatoriamente têm quantidade definida;
    -- espaços não podem ter total_unidades (são únicos por natureza).
    CONSTRAINT ck_instrumento_tem_unidades
        CHECK (categoria = 'espacos' OR total_unidades IS NOT NULL),
    CONSTRAINT ck_espaco_sem_unidades
        CHECK (categoria = 'instrumentos' OR total_unidades IS NULL)
);

CREATE INDEX idx_itens_categoria  ON itens (categoria);
CREATE INDEX idx_itens_disponivel ON itens (disponivel);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABELA: horarios
-- Tabela de referência com todos os blocos de horário do sistema.
-- A coluna "ordem" define a sequência de exibição na interface.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE horarios (
    id           SERIAL      PRIMARY KEY,
    label        VARCHAR(20) NOT NULL UNIQUE,   -- ex: "07:00 – 07:50"
    hora_inicio  TIME        NOT NULL,
    hora_fim     TIME        NOT NULL,
    is_intervalo BOOLEAN     NOT NULL DEFAULT FALSE,
    ordem        SMALLINT    NOT NULL,

    CONSTRAINT ck_horario_inicio_fim CHECK (hora_inicio < hora_fim)
);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABELA: reservas
-- Cada linha representa a reserva de UM item por UM usuário em UMA data.
-- "grupo_id" agrupa a reserva de um espaço com os instrumentos solicitados
-- na mesma operação (cancelamento em conjunto).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE reservas (
    id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id     UUID,                          -- NULL = reserva avulsa
    usuario_id   UUID           NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    item_id      UUID           NOT NULL REFERENCES itens(id)    ON DELETE RESTRICT,
    data_reserva DATE           NOT NULL,
    quantidade   INTEGER        NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    status       status_reserva NOT NULL DEFAULT 'confirmada',
    criado_em    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    cancelado_em TIMESTAMPTZ,

    CONSTRAINT ck_cancelado_em_status
        CHECK (
            (status = 'cancelada' AND cancelado_em IS NOT NULL) OR
            (status = 'confirmada' AND cancelado_em IS NULL)
        )
);

CREATE INDEX idx_reservas_usuario    ON reservas (usuario_id);
CREATE INDEX idx_reservas_item       ON reservas (item_id);
CREATE INDEX idx_reservas_data       ON reservas (data_reserva);
CREATE INDEX idx_reservas_grupo      ON reservas (grupo_id) WHERE grupo_id IS NOT NULL;
CREATE INDEX idx_reservas_status     ON reservas (status);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABELA: reserva_horarios
-- Relação N:N entre reservas e horários.
-- Uma reserva pode abranger múltiplos blocos de horário consecutivos.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE reserva_horarios (
    reserva_id UUID    NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
    horario_id INTEGER NOT NULL REFERENCES horarios(id) ON DELETE RESTRICT,

    PRIMARY KEY (reserva_id, horario_id)
);

CREATE INDEX idx_reserva_horarios_horario ON reserva_horarios (horario_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- VIEW: vw_reservas_detalhadas
-- Visão desnormalizada útil para relatórios e o painel admin.
-- Agrega os horários como array e expõe todos os campos relevantes.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE VIEW vw_reservas_detalhadas AS
SELECT
    r.id                                            AS reserva_id,
    r.grupo_id,
    r.data_reserva,
    r.quantidade,
    r.status,
    r.criado_em,
    r.cancelado_em,

    u.id                                            AS usuario_id,
    u.nome                                          AS usuario_nome,
    u.email                                         AS usuario_email,
    u.perfil                                        AS usuario_perfil,

    i.id                                            AS item_id,
    i.nome                                          AS item_nome,
    i.categoria                                     AS item_categoria,
    i.total_unidades,

    array_agg(h.label ORDER BY h.ordem)             AS horarios_labels,
    array_agg(h.hora_inicio ORDER BY h.ordem)       AS horarios_inicio,
    array_agg(h.hora_fim ORDER BY h.ordem)          AS horarios_fim,
    min(h.hora_inicio)                              AS primeiro_horario,
    max(h.hora_fim)                                 AS ultimo_horario

FROM reservas r
JOIN usuarios         u  ON u.id = r.usuario_id
JOIN itens            i  ON i.id = r.item_id
JOIN reserva_horarios rh ON rh.reserva_id = r.id
JOIN horarios         h  ON h.id = rh.horario_id
GROUP BY
    r.id, r.grupo_id, r.data_reserva, r.quantidade,
    r.status, r.criado_em, r.cancelado_em,
    u.id, u.nome, u.email, u.perfil,
    i.id, i.nome, i.categoria, i.total_unidades;


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNÇÃO: fn_unidades_ocupadas(item_id, data, horario_id)
-- Retorna quantas unidades de um instrumento já estão reservadas
-- em um determinado horário numa data, desconsiderando cancelamentos.
-- Útil para validar disponibilidade antes de inserir nova reserva.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_unidades_ocupadas(
    p_item_id    UUID,
    p_data       DATE,
    p_horario_id INTEGER
)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(SUM(r.quantidade), 0)::INTEGER
    FROM reservas r
    JOIN reserva_horarios rh ON rh.reserva_id = r.id
    WHERE r.item_id      = p_item_id
      AND r.data_reserva = p_data
      AND rh.horario_id  = p_horario_id
      AND r.status       = 'confirmada';
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: atualiza "atualizado_em" automaticamente
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_usuarios_atualizado_em
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

CREATE TRIGGER trg_itens_atualizado_em
    BEFORE UPDATE ON itens
    FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
