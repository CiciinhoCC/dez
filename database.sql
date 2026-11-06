-- ============================================================
-- Database: dez_notas  (MySQL 5.7+ / 8.x)
-- ============================================================

CREATE DATABASE IF NOT EXISTS dez_notas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dez_notas;

-- ============================================================
-- Table: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)      NOT NULL,
  password_hash VARCHAR(255)     NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB;

-- ============================================================
-- Table: notes
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED     NOT NULL,
  title      VARCHAR(150)     NOT NULL,
  subject    VARCHAR(50)      NOT NULL DEFAULT 'General',
  content    MEDIUMTEXT       NOT NULL,
  is_public  TINYINT(1)       NOT NULL DEFAULT 0,
  created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notes_user_id (user_id),
  KEY idx_notes_is_public (is_public),
  KEY idx_notes_subject (subject),
  KEY idx_notes_updated_at (updated_at),
  CONSTRAINT fk_notes_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;