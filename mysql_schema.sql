-- Schéma MySQL initial pour hébergement mutualisé
-- Adapter types/longueurs selon besoins réels

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS strowallet_customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  customer_id VARCHAR(64) NOT NULL UNIQUE,
  customer_email VARCHAR(255),
  first_name VARCHAR(128),
  last_name VARCHAR(128),
  phone_number VARCHAR(64),
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS strowallet_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id VARCHAR(64) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(32),
  card_number VARCHAR(32),
  name_on_card VARCHAR(128),
  expiry_month INT,
  expiry_year INT,
  raw_response JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  route VARCHAR(128) NOT NULL,
  method VARCHAR(16) NOT NULL,
  status_code SMALLINT NOT NULL,
  user_id INT NULL,
  ip_address VARCHAR(64),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id),
  INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  processed TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (provider, event_type),
  INDEX (processed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table simple pour rate limiting par IP (optionnel)
CREATE TABLE IF NOT EXISTS api_rate_limiter (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(64) NOT NULL,
  route VARCHAR(128) NOT NULL,
  hits INT NOT NULL DEFAULT 1,
  window_start TIMESTAMP NOT NULL,
  UNIQUE KEY uniq_ip_route_window (ip_address, route, window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
