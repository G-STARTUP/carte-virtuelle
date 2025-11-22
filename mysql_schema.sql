-- Schéma MySQL complet pour hébergement mutualisé
-- Adapter types/longueurs selon besoins réels

-- Table utilisateurs (auth)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(128),
  last_name VARCHAR(128),
  phone VARCHAR(64),
  address TEXT,
  kyc_status ENUM('not_verified', 'pending', 'verified', 'rejected') DEFAULT 'not_verified',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table roles utilisateurs
CREATE TABLE IF NOT EXISTS user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role ENUM('admin', 'user') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_role (user_id, role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table portefeuilles multi-devises
CREATE TABLE IF NOT EXISTS wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  currency ENUM('USD', 'NGN', 'XOF') NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_currency (user_id, currency),
  CHECK (balance >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table transactions portefeuille
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  wallet_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type ENUM('credit', 'debit', 'conversion', 'card_purchase', 'card_reload', 'deposit') NOT NULL,
  description TEXT,
  reference VARCHAR(128),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  INDEX (wallet_id),
  INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table documents KYC
CREATE TABLE IF NOT EXISTS kyc_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  document_type ENUM('id_card', 'passport', 'driver_license') NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP NULL,
  rejection_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table clients Strowallet
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table cartes Strowallet
CREATE TABLE IF NOT EXISTS strowallet_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id VARCHAR(64) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  customer_id VARCHAR(64),
  name_on_card VARCHAR(128),
  card_type VARCHAR(32) DEFAULT 'visa',
  balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  currency VARCHAR(16) DEFAULT 'USD',
  status ENUM('active', 'frozen', 'inactive', 'blocked') DEFAULT 'active',
  card_number VARCHAR(32),
  expiry_month VARCHAR(4),
  expiry_year VARCHAR(8),
  cvv VARCHAR(16),
  raw_response JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES strowallet_customers(customer_id) ON DELETE SET NULL,
  INDEX (user_id),
  INDEX (customer_id),
  CHECK (balance >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table transactions cartes
CREATE TABLE IF NOT EXISTS card_transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  card_id VARCHAR(64) NOT NULL,
  user_id INT NOT NULL,
  transaction_id VARCHAR(128) UNIQUE,
  amount DECIMAL(15,2) NOT NULL,
  type ENUM('charge', 'refund', 'fund', 'withdrawal', 'fee') NOT NULL,
  status VARCHAR(32),
  description TEXT,
  merchant_name VARCHAR(255),
  merchant_category VARCHAR(128),
  currency VARCHAR(16),
  raw_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES strowallet_cards(card_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (card_id),
  INDEX (user_id),
  INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table paramètres de frais
CREATE TABLE IF NOT EXISTS fees_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(128) NOT NULL UNIQUE,
  setting_value DECIMAL(15,2) NOT NULL,
  description TEXT,
  currency VARCHAR(16) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Paramètres de frais par défaut
INSERT IGNORE INTO fees_settings (setting_key, setting_value, description, currency) VALUES
  ('card_creation_fixed_fee_usd', 2.00, 'Frais fixe de création de carte en USD', 'USD'),
  ('card_creation_percent_fee', 2.5, 'Frais en pourcentage pour création de carte', 'PERCENT'),
  ('card_creation_fixed_fee_xof', 1000.00, 'Frais fixe de création de carte en XOF', 'XOF'),
  ('card_reload_fixed_fee_usd', 1.00, 'Frais fixe de rechargement en USD', 'USD'),
  ('card_reload_percent_fee', 1.5, 'Frais en pourcentage pour rechargement', 'PERCENT'),
  ('card_reload_fixed_fee_xof', 500.00, 'Frais fixe de rechargement en XOF', 'XOF'),
  ('min_card_creation_usd', 10.00, 'Montant minimum pour créer une carte en USD', 'USD'),
  ('min_card_creation_xof', 5000.00, 'Montant minimum pour créer une carte en XOF', 'XOF'),
  ('min_card_reload_usd', 5.00, 'Montant minimum pour recharger en USD', 'USD'),
  ('min_card_reload_xof', 2500.00, 'Montant minimum pour recharger en XOF', 'XOF');

-- Table logs API
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

-- Table logs API Strowallet
CREATE TABLE IF NOT EXISTS strowallet_api_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  function_name VARCHAR(128) NOT NULL,
  user_id INT NULL,
  request_payload JSON,
  response_data JSON,
  status_code SMALLINT,
  duration_ms INT,
  error_message TEXT,
  ip_address VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX (function_name),
  INDEX (user_id),
  INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table webhooks
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  event_id VARCHAR(128),
  card_id VARCHAR(64),
  user_id INT,
  payload JSON NOT NULL,
  signature_valid TINYINT(1) DEFAULT 0,
  processed TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX (provider, event_type),
  INDEX (card_id),
  INDEX (processed),
  UNIQUE KEY uniq_event_id (event_id, provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table rate limiting par IP
CREATE TABLE IF NOT EXISTS api_rate_limiter (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(64) NOT NULL,
  route VARCHAR(128) NOT NULL,
  hits INT NOT NULL DEFAULT 1,
  window_start TIMESTAMP NOT NULL,
  UNIQUE KEY uniq_ip_route_window (ip_address, route, window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table paiements Moneroo (Mobile Money)
CREATE TABLE IF NOT EXISTS moneroo_payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  wallet_id INT NOT NULL,
  payment_id VARCHAR(128) NOT NULL UNIQUE,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  INDEX (user_id),
  INDEX (wallet_id),
  INDEX (status),
  INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table transactions NowPayments (Crypto)
CREATE TABLE IF NOT EXISTS nowpayments_transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  wallet_id INT NOT NULL,
  payment_id VARCHAR(128) NOT NULL UNIQUE,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  crypto_currency VARCHAR(10) NOT NULL,
  status ENUM('waiting', 'confirming', 'confirmed', 'sending', 'partially_paid', 'finished', 'failed', 'refunded', 'expired') DEFAULT 'waiting',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  INDEX (user_id),
  INDEX (wallet_id),
  INDEX (status),
  INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table configuration API (clés API stockées de manière sécurisée)
CREATE TABLE IF NOT EXISTS api_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(128) NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  description TEXT,
  is_sensitive TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Configuration API par défaut (valeurs vides à remplir)
INSERT IGNORE INTO api_config (config_key, config_value, description, is_sensitive) VALUES
  ('STROWALLET_BASE_URL', '', 'URL de base API Strowallet', 0),
  ('STROWALLET_API_KEY', '', 'Clé API Strowallet', 1),
  ('STROWALLET_PUBLIC_KEY', '', 'Clé publique Strowallet', 1),
  ('MONEROO_API_KEY', '', 'Clé API Moneroo (Mobile Money)', 1),
  ('MONEROO_WEBHOOK_SECRET', '', 'Secret webhook Moneroo', 1),
  ('NOWPAYMENTS_API_KEY', '', 'Clé API NowPayments (Crypto)', 1),
  ('NOWPAYMENTS_WEBHOOK_SECRET', '', 'Secret webhook NowPayments', 1),
  ('APP_URL', '', 'URL de l\'application (ex: https://gwap.pro)', 0);
