-- FSSS MySQL schema
-- Run in phpMyAdmin or MySQL CLI.

CREATE TABLE users (
    id CHAR(32) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'professor') NOT NULL DEFAULT 'professor',
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE items (
    id CHAR(32) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('espacos', 'instrumentos') NOT NULL,
    image_url TEXT NULL,
    available TINYINT(1) NOT NULL DEFAULT 1,
    total_units INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (category = 'espacos' OR total_units IS NOT NULL),
    CHECK (category = 'instrumentos' OR total_units IS NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE time_slots (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(20) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_break TINYINT(1) NOT NULL DEFAULT 0,
    sort_order SMALLINT NOT NULL,
    CHECK (start_time < end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE blocked_dates (
    id CHAR(32) NOT NULL PRIMARY KEY,
    blocked_date DATE NOT NULL UNIQUE,
    reason VARCHAR(255) NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reservations (
    id CHAR(32) NOT NULL PRIMARY KEY,
    group_id CHAR(32) NULL,
    user_id CHAR(32) NOT NULL,
    item_id CHAR(32) NOT NULL,
    reservation_date DATE NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    status ENUM('confirmada', 'cancelada') NOT NULL DEFAULT 'confirmada',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cancelled_at DATETIME NULL,
    CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_reservations_item FOREIGN KEY (item_id) REFERENCES items(id),
    CHECK (quantity > 0),
    CHECK (
        (status = 'cancelada' AND cancelled_at IS NOT NULL) OR
        (status = 'confirmada' AND cancelled_at IS NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reservation_slots (
    reservation_id CHAR(32) NOT NULL,
    time_slot_id INT NOT NULL,
    PRIMARY KEY (reservation_id, time_slot_id),
    CONSTRAINT fk_reservation_slots_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservation_slots_slot FOREIGN KEY (time_slot_id) REFERENCES time_slots(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_available ON items(available);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_item ON reservations(item_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_group ON reservations(group_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservation_slots_slot ON reservation_slots(time_slot_id);

DELIMITER $$

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_items_updated_at
BEFORE UPDATE ON items
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_reservations_updated_at
BEFORE UPDATE ON reservations
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;

CREATE OR REPLACE VIEW vw_reservations_detailed AS
SELECT
    r.id AS reservation_id,
    r.group_id,
    r.user_id,
    u.name AS user_name,
    u.email AS user_email,
    u.role AS user_role,
    r.item_id,
    i.name AS item_name,
    i.category AS item_category,
    r.reservation_date,
    r.quantity,
    r.status,
    r.created_at,
    r.updated_at,
    r.cancelled_at,
    GROUP_CONCAT(ts.label ORDER BY ts.sort_order SEPARATOR '||') AS time_labels
FROM reservations r
INNER JOIN users u ON u.id = r.user_id
INNER JOIN items i ON i.id = r.item_id
INNER JOIN reservation_slots rs ON rs.reservation_id = r.id
INNER JOIN time_slots ts ON ts.id = rs.time_slot_id
GROUP BY
    r.id,
    r.group_id,
    r.user_id,
    u.name,
    u.email,
    u.role,
    r.item_id,
    i.name,
    i.category,
    r.reservation_date,
    r.quantity,
    r.status,
    r.created_at,
    r.updated_at,
    r.cancelled_at;
