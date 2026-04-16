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
('e0000001-0000-0000-0000-000000000001', 'Sala de Vídeo',
 'Sala equipada com TV de grande porte e sistema de som para exibição de vídeos e apresentações.',
 'espacos', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=300&fit=crop', TRUE, NULL),

('e0000001-0000-0000-0000-000000000002', 'Espaço Irmã Rosa',
 'Salão multiuso amplo, ideal para reuniões, eventos e atividades em grupo.',
 'espacos', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop', TRUE, NULL),

('e0000001-0000-0000-0000-000000000003', 'Espaço Irmã Jovina',
 'Espaço versátil para palestras, dinâmicas e atividades formativas.',
 'espacos', 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=400&h=300&fit=crop', TRUE, NULL),

('e0000001-0000-0000-0000-000000000004', 'Espaço do Churrasco',
 'Área externa coberta com churrasqueiras, mesas e espaço para confraternizações.',
 'espacos', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop', TRUE, NULL),

('e0000001-0000-0000-0000-000000000005', 'Espaço Verde',
 'Área aberta com jardim, ideal para atividades ao ar livre e momentos de integração.',
 'espacos', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop', TRUE, NULL),

('e0000001-0000-0000-0000-000000000006', 'Sala de Vidro',
 'Sala moderna com paredes de vidro, climatizada, para reuniões e atendimentos.',
 'espacos', 'https://images.unsplash.com/photo-1497366754035-f200968a333e?w=400&h=300&fit=crop', TRUE, NULL),

('e0000001-0000-0000-0000-000000000007', 'Biblioteca',
 'Biblioteca com acervo completo e espaço de leitura e estudo.',
 'espacos', 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop', TRUE, NULL),

('e0000001-0000-0000-0000-000000000008', 'Sala de Informática 1',
 'Laboratório de informática com 30 computadores e internet de alta velocidade.',
 'espacos', 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=400&h=300&fit=crop', TRUE, NULL),

('e0000001-0000-0000-0000-000000000009', 'Sala de Informática 2',
 'Laboratório de informática com 30 computadores e internet de alta velocidade.',
 'espacos', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop', TRUE, NULL),

('e0000001-0000-0000-0000-000000000010', 'Laboratório de Química',
 'Laboratório equipado com bancadas, vidrarias e reagentes para experimentos.',
 'espacos', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop', TRUE, NULL),

('e0000001-0000-0000-0000-000000000011', 'Laboratório de Física',
 'Laboratório com equipamentos para experimentos de física e demonstrações científicas.',
 'espacos', 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=300&fit=crop', TRUE, NULL),

('e0000001-0000-0000-0000-000000000012', 'Sala de Enfermagem',
 'Sala equipada para práticas de enfermagem, com materiais e manequins de simulação.',
 'espacos', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop', TRUE, NULL),

('e0000001-0000-0000-0000-000000000013', 'Sala de Podcast',
 'Estúdio de podcast com isolamento acústico, microfones e mesa de som.',
 'espacos', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=300&fit=crop', TRUE, NULL);


-- ─────────────────────────────────────────────────────────────────────────────
-- EQUIPAMENTOS (instrumentos)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO itens (id, nome, descricao, categoria, imagem_url, disponivel, total_unidades) VALUES
('b0000001-0000-0000-0000-000000000001', 'Microfone',
 'Microfone com fio para apresentações, aulas e eventos.',
 'instrumentos', 'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=400&h=300&fit=crop', TRUE, 4),

('b0000001-0000-0000-0000-000000000002', 'Notebook',
 'Notebook para uso em aulas, apresentações e atividades acadêmicas.',
 'instrumentos', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop', TRUE, 10),

('b0000001-0000-0000-0000-000000000003', 'Caixa de Som',
 'Caixa de som amplificada 500W com entrada USB, Bluetooth e microfone.',
 'instrumentos', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=300&fit=crop', TRUE, 15),

('b0000001-0000-0000-0000-000000000004', 'Projetor',
 'Projetor multimídia 3.500 lumens com HDMI e VGA para salas de aula.',
 'instrumentos', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=300&fit=crop', TRUE, 5);
