-- FSSS seed data
-- Run after schema.mysql.sql.

INSERT INTO users (id, name, email, password_hash, role, active) VALUES
('a0000000000000000000000000000001', 'Administrador', 'admin@fsss.edu.br', '$2b$12$5Vfl9uKGAJ19cXaQuBCZi./U/YslpRxC8IkEmKFOodK1xNr6l9Ihm', 'admin', 1),
('a0000000000000000000000000000002', 'Prof. Ana Silva', 'ana.silva@fsss.edu.br', '$2b$12$A9h/ThYOAOMsqbXazopfYeaAirDAoqj6tK3dJdJoArGUosm5PFuc2', 'professor', 1),
('a0000000000000000000000000000003', 'Prof. Carlos Mendes', 'carlos.mendes@fsss.edu.br', '$2b$12$A9h/ThYOAOMsqbXazopfYeaAirDAoqj6tK3dJdJoArGUosm5PFuc2', 'professor', 1);

INSERT INTO time_slots (label, start_time, end_time, is_break, sort_order) VALUES
('07:00 - 07:50', '07:00:00', '07:50:00', 0, 1),
('07:50 - 08:40', '07:50:00', '08:40:00', 0, 2),
('08:40 - 09:30', '08:40:00', '09:30:00', 0, 3),
('09:30 - 09:50', '09:30:00', '09:50:00', 1, 4),
('09:50 - 10:40', '09:50:00', '10:40:00', 0, 5),
('10:40 - 11:30', '10:40:00', '11:30:00', 0, 6),
('11:30 - 12:20', '11:30:00', '12:20:00', 0, 7),
('13:00 - 13:50', '13:00:00', '13:50:00', 0, 8),
('13:50 - 14:40', '13:50:00', '14:40:00', 0, 9),
('14:40 - 15:30', '14:40:00', '15:30:00', 0, 10),
('15:30 - 15:50', '15:30:00', '15:50:00', 1, 11),
('15:50 - 16:40', '15:50:00', '16:40:00', 0, 12),
('16:40 - 17:30', '16:40:00', '17:30:00', 0, 13);

INSERT INTO items (id, name, description, category, image_url, available, total_units) VALUES
('e2000000000000000000000000000001', 'Espaco Irma Rosa', 'Sala multiuso para eventos e reunioes.', 'espacos', NULL, 1, NULL),
('e2000000000000000000000000000002', 'Espaco Irma Lealcy', 'Espaco versatil para palestras e formacoes.', 'espacos', NULL, 1, NULL),
('b2000000000000000000000000000001', 'Caixa de Som', 'Caixa de som amplificada para eventos.', 'instrumentos', NULL, 1, 3),
('b2000000000000000000000000000002', 'Datashow', 'Projetor multimidia para aulas e eventos.', 'instrumentos', NULL, 1, 4),
('b2000000000000000000000000000003', 'Microfone sem fio', 'Kit microfone sem fio com dois microfones.', 'instrumentos', NULL, 1, 2);

-- Demo users are seeded with password hashes for local and HostGator testing.
-- Use:
-- php -r "echo password_hash('admin@fsss', PASSWORD_DEFAULT), PHP_EOL;"
