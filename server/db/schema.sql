-- ============================================================================
-- ONE SHOT FMGE — Telegram Cloud Architecture Database Schema (PostgreSQL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS telegram_accounts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    first_name VARCHAR(128),
    username VARCHAR(128),
    encrypted_session TEXT NOT NULL,
    session_auth_key_id VARCHAR(64),
    is_authenticated BOOLEAN DEFAULT TRUE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telegram_sources (
    id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(64) REFERENCES telegram_accounts(id) ON DELETE CASCADE,
    telegram_channel_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    username VARCHAR(128),
    type VARCHAR(32) NOT NULL DEFAULT 'channel',
    member_count INTEGER DEFAULT 0,
    is_monitored BOOLEAN DEFAULT FALSE,
    last_processed_message_id BIGINT DEFAULT 0,
    last_message_date TIMESTAMP WITH TIME ZONE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_account_channel UNIQUE (account_id, telegram_channel_id)
);

CREATE TABLE IF NOT EXISTS telegram_messages (
    id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(64) REFERENCES telegram_accounts(id) ON DELETE SET NULL,
    source_id VARCHAR(64) REFERENCES telegram_sources(id) ON DELETE CASCADE,
    telegram_message_id BIGINT NOT NULL,
    message_date TIMESTAMP WITH TIME ZONE NOT NULL,
    raw_text TEXT NOT NULL DEFAULT '',
    media_type VARCHAR(32) NOT NULL DEFAULT 'NONE',
    telegram_media_reference TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'RECEIVED',
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_source_message UNIQUE (source_id, telegram_message_id)
);

CREATE TABLE IF NOT EXISTS telegram_media (
    id VARCHAR(64) PRIMARY KEY,
    message_id VARCHAR(64) REFERENCES telegram_messages(id) ON DELETE CASCADE,
    media_type VARCHAR(32) NOT NULL,
    storage_url TEXT NOT NULL,
    file_path TEXT,
    thumbnail_url TEXT,
    mime_type VARCHAR(64),
    file_size BIGINT,
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS processing_jobs (
    id VARCHAR(64) PRIMARY KEY,
    message_id VARCHAR(64) REFERENCES telegram_messages(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(64) PRIMARY KEY,
    source_message_id VARCHAR(64) REFERENCES telegram_messages(id) ON DELETE SET NULL,
    subject VARCHAR(64) NOT NULL DEFAULT 'medicine',
    topic VARCHAR(128) NOT NULL DEFAULT 'Clinical Recall',
    question_text TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_answer VARCHAR(8) NOT NULL,
    explanation TEXT NOT NULL,
    why_other_options_are_wrong JSONB DEFAULT '[]'::jsonb,
    source_channel VARCHAR(128) NOT NULL,
    image_asset_id VARCHAR(64) REFERENCES telegram_media(id) ON DELETE SET NULL,
    video_asset_id VARCHAR(64) REFERENCES telegram_media(id) ON DELETE SET NULL,
    difficulty VARCHAR(32) DEFAULT 'high-yield',
    content_fingerprint VARCHAR(64),
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of_question_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tips (
    id VARCHAR(64) PRIMARY KEY,
    source_message_id VARCHAR(64) REFERENCES telegram_messages(id) ON DELETE SET NULL,
    original_text TEXT NOT NULL,
    cleaned_text TEXT NOT NULL,
    subject VARCHAR(64) NOT NULL DEFAULT 'medicine',
    topic VARCHAR(128) NOT NULL DEFAULT 'Exam Strategy',
    source_channel VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notices (
    id VARCHAR(64) PRIMARY KEY,
    source_message_id VARCHAR(64) REFERENCES telegram_messages(id) ON DELETE SET NULL,
    original_text TEXT NOT NULL,
    cleaned_text TEXT NOT NULL,
    importance VARCHAR(32) NOT NULL DEFAULT 'important',
    notice_date TIMESTAMP WITH TIME ZONE,
    source_channel VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pearls (
    id VARCHAR(64) PRIMARY KEY,
    source_message_id VARCHAR(64) REFERENCES telegram_messages(id) ON DELETE SET NULL,
    question_id VARCHAR(64) REFERENCES questions(id) ON DELETE SET NULL,
    title VARCHAR(128) NOT NULL,
    takeaway TEXT NOT NULL,
    subject VARCHAR(64) NOT NULL DEFAULT 'medicine',
    topic VARCHAR(128) NOT NULL DEFAULT 'Clinical Pearl',
    is_saved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cross_checks (
    id VARCHAR(64) PRIMARY KEY,
    question_id VARCHAR(64) REFERENCES questions(id) ON DELETE CASCADE,
    original_answer VARCHAR(8) NOT NULL,
    ai_answer VARCHAR(8) NOT NULL,
    agreement_status VARCHAR(32) NOT NULL DEFAULT 'AGREED',
    reason TEXT NOT NULL,
    confidence NUMERIC(4, 3) DEFAULT 0.950,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS worker_heartbeats (
    id VARCHAR(64) PRIMARY KEY,
    worker_id VARCHAR(64) NOT NULL DEFAULT 'cloud-worker-1',
    worker_status VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_successful_telegram_update TIMESTAMP WITH TIME ZONE,
    active_sources_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
