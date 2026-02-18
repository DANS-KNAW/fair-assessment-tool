-- ============================================
-- Database: fairaware
-- ============================================

CREATE DATABASE IF NOT EXISTS fair_aware
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fair_aware;

-- ============================================
-- Table 1: authorized_users
-- For trainers and administrators who can download data
-- and access the admin dashboard
-- ============================================

CREATE TABLE IF NOT EXISTS authorized_users (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) DEFAULT NULL COMMENT 'Display name for the admin dashboard',
  access_token VARCHAR(255) DEFAULT NULL COMMENT 'Legacy token - no longer required for new users',
  password_hash VARCHAR(255) DEFAULT NULL COMMENT 'Argon2id hashed password for admin dashboard login',
  role ENUM('admin', 'trainer') NOT NULL DEFAULT 'trainer' COMMENT 'User role',
  status ENUM('pending', 'active', 'disabled') NOT NULL DEFAULT 'active' COMMENT 'Account status',
  last_login_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Last successful login timestamp',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table 2: user_sessions
-- Session storage following Lucia auth patterns
-- ============================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(48) NOT NULL PRIMARY KEY COMMENT 'Session identifier (24-char random string)',
  user_id CHAR(36) NOT NULL COMMENT 'FK to authorized_users.id',
  secret_hash VARBINARY(32) NOT NULL COMMENT 'SHA-256 hash of the session secret',
  last_verified_at BIGINT NOT NULL COMMENT 'Unix timestamp (seconds) of last activity verification',
  created_at BIGINT NOT NULL COMMENT 'Unix timestamp (seconds) of session creation',
  INDEX idx_user_id (user_id),
  CONSTRAINT fk_session_user
    FOREIGN KEY (user_id) REFERENCES authorized_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table 3: assessment_answers
-- Stores all FAIR-Aware assessment submissions
-- ============================================

CREATE TABLE IF NOT EXISTS assessment_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Metadata
  host VARCHAR(255) NOT NULL,
  submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Course identification
  cq1 VARCHAR(255) DEFAULT NULL COMMENT 'Course code',

  -- About You (Y questions)
  yq1 TEXT DEFAULT NULL COMMENT 'Research domain',
  yq2 TEXT DEFAULT NULL COMMENT 'Role(s)',
  yq3 TEXT DEFAULT NULL COMMENT 'Organization type(s)',

  -- Findable (F questions)
  fq1 VARCHAR(3) DEFAULT NULL COMMENT 'F Q1: Globally unique persistent identifier',
  fq1i CHAR(1) DEFAULT NULL COMMENT 'F Q1 intention (1-5)',
  fq2 VARCHAR(3) DEFAULT NULL COMMENT 'F Q2: Metadata for citation and discovery',
  fq2i CHAR(1) DEFAULT NULL COMMENT 'F Q2 intention (1-5)',
  fq3 VARCHAR(3) DEFAULT NULL COMMENT 'F Q3: Metadata readable by humans and machines',
  fq3i CHAR(1) DEFAULT NULL COMMENT 'F Q3 intention (1-5)',

  -- Accessible (A questions)
  aq1 VARCHAR(3) DEFAULT NULL COMMENT 'A Q1: Metadata includes licence and access',
  aq1i CHAR(1) DEFAULT NULL COMMENT 'A Q1 intention (1-5)',
  aq2 VARCHAR(3) DEFAULT NULL COMMENT 'A Q2: Persistence of metadata',
  aq2i CHAR(1) DEFAULT NULL COMMENT 'A Q2 intention (1-5)',

  -- Interoperable (I questions)
  iq1 VARCHAR(3) DEFAULT NULL COMMENT 'I Q1: Use of controlled vocabularies',
  iq1i CHAR(1) DEFAULT NULL COMMENT 'I Q1 intention (1-5)',

  -- Reusable (R questions)
  rq1 VARCHAR(3) DEFAULT NULL COMMENT 'R Q1: Metadata includes provenance',
  rq1i CHAR(1) DEFAULT NULL COMMENT 'R Q1 intention (1-5)',
  rq2 VARCHAR(3) DEFAULT NULL COMMENT 'R Q2: Community-endorsed metadata standards',
  rq2i CHAR(1) DEFAULT NULL COMMENT 'R Q2 intention (1-5)',
  rq3 VARCHAR(3) DEFAULT NULL COMMENT 'R Q3: Data in preferred format',
  rq3i CHAR(1) DEFAULT NULL COMMENT 'R Q3 intention (1-5)',
  rq4 VARCHAR(3) DEFAULT NULL COMMENT 'R Q4: Digital curation and preservation',
  rq4i CHAR(1) DEFAULT NULL COMMENT 'R Q4 intention (1-5)',

  -- Feedback (Q questions)
  qq1 TEXT DEFAULT NULL COMMENT 'Topics not understandable (checkboxes)',
  qq2 TEXT DEFAULT NULL COMMENT 'Missing metrics/topics',
  qq3 TEXT DEFAULT NULL COMMENT 'General feedback',
  qq4 VARCHAR(50) DEFAULT NULL COMMENT 'Awareness raised (agreement level)',

  -- Indexes for performance
  INDEX idx_host (host),
  INDEX idx_submission_date (submission_date),
  INDEX idx_code (cq1),
  INDEX idx_host_code (host, cq1),
  INDEX idx_feedback (qq1(100), qq2(100), qq3(100), qq4)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table 4: course_codes
-- Pre-created course codes for assessment grouping
-- ============================================

CREATE TABLE IF NOT EXISTS course_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE COMMENT 'Course code identifier',
  created_by CHAR(36) NOT NULL COMMENT 'FK to authorized_users.id',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  CONSTRAINT fk_course_code_creator
    FOREIGN KEY (created_by) REFERENCES authorized_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table 5: user_invitations
-- Invitation tokens for user account setup
-- ============================================

CREATE TABLE IF NOT EXISTS user_invitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL COMMENT 'FK to authorized_users.id',
  token_hash VARBINARY(32) NOT NULL COMMENT 'SHA-256 hash of the invitation token',
  expires_at BIGINT NOT NULL COMMENT 'Unix timestamp (seconds) of token expiration',
  created_at BIGINT NOT NULL COMMENT 'Unix timestamp (seconds) of invitation creation',
  INDEX idx_user_id (user_id),
  CONSTRAINT fk_invitation_user
    FOREIGN KEY (user_id) REFERENCES authorized_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

