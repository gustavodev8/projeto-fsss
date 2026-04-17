-- ═══════════════════════════════════════════════════════════════════════════════
--  FSSS — Sistema de Reserva de Espaços e Equipamentos
--  Seed SQL  |  Dados iniciais de produção
--  Execução:   psql -U <usuario> -d <banco> -f seed.sql
--
--  IMPORTANTE:
--  - Execute sempre APÓS o schema.sql
--  - As senhas abaixo são hashes bcrypt (custo 12).
--    Para gerar um novo hash: SELECT crypt('sua_senha', gen_salt('bf', 12));
--  - Substitua os hashes antes de ir a produção.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- USUÁRIOS INICIAIS
--   admin@fsss.edu.br  /  admin@fsss
--   ana.silva@fsss.edu.br  /  professor
--   carlos.mendes@fsss.edu.br  /  professor
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO usuarios (id, nome, email, senha_hash, perfil) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'Administrador',
    'admin@fsss.edu.br',
    -- bcrypt de 'admin@fsss' — TROQUE antes de ir a produção
    '$2a$12$K8Ux9pHbS6TjC3OLkCvRWuBdxzDlnQPVaE7FmYhGsNrItJwX1oMqA',
    'admin'
),
(
    'a0000000-0000-0000-0000-000000000002',
    'Prof. Ana Silva',
    'ana.silva@fsss.edu.br',
    -- bcrypt de 'professor'
    '$2a$12$DvGt5OqsRn4YUhP7ZkL3MeWxAcCjFbI8NmEqKlVdG2SrTpX0HwY9u',
    'professor'
),
(
    'a0000000-0000-0000-0000-000000000003',
    'Prof. Carlos Mendes',
    'carlos.mendes@fsss.edu.br',
    -- bcrypt de 'professor'
    '$2a$12$DvGt5OqsRn4YUhP7ZkL3MeWxAcCjFbI8NmEqKlVdG2SrTpX0HwY9u',
    'professor'
);


-- ─────────────────────────────────────────────────────────────────────────────
-- HORÁRIOS
-- Espelha exatamente os timeSlots definidos em src/data/mockData.ts
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO horarios (label, hora_inicio, hora_fim, is_intervalo, ordem) VALUES
('07:00 – 07:50', '07:00', '07:50', FALSE,  1),
('07:50 – 08:40', '07:50', '08:40', FALSE,  2),
('08:40 – 09:30', '08:40', '09:30', FALSE,  3),
('09:30 – 09:50', '09:30', '09:50', TRUE,   4),  -- intervalo manhã
('09:50 – 10:40', '09:50', '10:40', FALSE,  5),
('10:40 – 11:30', '10:40', '11:30', FALSE,  6),
('11:30 – 12:20', '11:30', '12:20', FALSE,  7),
-- almoço 12:20–13:00 não é um slot cadastrado (só separador visual)
('13:00 – 13:50', '13:00', '13:50', FALSE,  8),
('13:50 – 14:40', '13:50', '14:40', FALSE,  9),
('14:40 – 15:30', '14:40', '15:30', FALSE, 10),
('15:30 – 15:50', '15:30', '15:50', TRUE,  11),  -- intervalo tarde
('15:50 – 16:40', '15:50', '16:40', FALSE, 12),
('16:40 – 17:30', '16:40', '17:30', FALSE, 13);


-- ─────────────────────────────────────────────────────────────────────────────
-- ESPAÇOS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO itens (id, nome, descricao, categoria, imagem_url, disponivel, total_unidades) VALUES
('e2000000-0000-0000-0000-000000000001', 'Espaço Irmã Rosa',
 'Salão multiuso amplo, ideal para eventos, reuniões e atividades institucionais.',
 'espacos', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop', TRUE, NULL),

('e2000000-0000-0000-0000-000000000002', 'Espaço Irmã Lealcy',
 'Espaço versátil para palestras, formações e atividades em grupo.',
 'espacos', 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=400&h=300&fit=crop', TRUE, NULL),

('e2000000-0000-0000-0000-000000000003', 'Espaço 12 de Maio',
 'Salão para eventos institucionais, comemorações e atividades culturais.',
 'espacos', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=300&fit=crop', TRUE, NULL),

('e2000000-0000-0000-0000-000000000004', 'Ginásio de Esportes',
 'Ginásio coberto para atividades esportivas, eventos e práticas físicas.',
 'espacos', 'https://images.unsplash.com/photo-1546519638405-a9d1b2f72b77?w=400&h=300&fit=crop', TRUE, NULL),

('e2000000-0000-0000-0000-000000000005', 'Quadra Maria Imaculada',
 'Quadra poliesportiva aberta para atividades físicas e esportivas.',
 'espacos', 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=400&h=300&fit=crop', TRUE, NULL);


-- ─────────────────────────────────────────────────────────────────────────────
-- EQUIPAMENTOS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO itens (id, nome, descricao, categoria, imagem_url, disponivel, total_unidades) VALUES
('b2000000-0000-0000-0000-000000000001', 'Caixa de Som',
 'Caixa de som amplificada para eventos e apresentações.',
 'instrumentos', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=300&fit=crop', TRUE, 3),

('b2000000-0000-0000-0000-000000000002', 'Datashow',
 'Projetor multimídia para apresentações, aulas e eventos.',
 'instrumentos', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=300&fit=crop', TRUE, 4),

('b2000000-0000-0000-0000-000000000003', 'Microfone sem fio',
 'Kit microfone sem fio com dois microfones cada.',
 'instrumentos', 'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=400&h=300&fit=crop', TRUE, 2),

('b2000000-0000-0000-0000-000000000004', 'Cadeiras Brancas',
 'Cadeiras brancas para eventos e cerimônias.',
 'instrumentos', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', TRUE, 300),

('b2000000-0000-0000-0000-000000000005', 'Mesa de Madeira',
 'Mesa de madeira para eventos, reuniões e atividades.',
 'instrumentos', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop', TRUE, 7),

('b2000000-0000-0000-0000-000000000006', 'Mesa Branca Plástica',
 'Mesa plástica branca leve e resistente para eventos externos e internos.',
 'instrumentos', 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&h=300&fit=crop', TRUE, 6),

('b2000000-0000-0000-0000-000000000007', 'Púlpito',
 'Púlpito para celebrações, solenidades e apresentações oficiais.',
 'instrumentos', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=300&fit=crop', TRUE, 2),

('b2000000-0000-0000-0000-000000000008', 'Backdrop',
 'Backdrop para cenografia de eventos, formaturas e cerimônias.',
 'instrumentos', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop', TRUE, 1),

('b2000000-0000-0000-0000-000000000009', 'Suporte de Banner',
 'Suporte retrátil para banners e comunicação visual em eventos.',
 'instrumentos', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop', TRUE, 17),

('b2000000-0000-0000-0000-000000000010', 'Biombos',
 'Biombos divisórios para organização e ambientação de espaços em eventos.',
 'instrumentos', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop', TRUE, 7);
