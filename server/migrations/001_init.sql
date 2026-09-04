-- Schema platform API Documentation Registry
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT,
  name        TEXT,
  avatar      TEXT,
  nik         TEXT UNIQUE NOT NULL,
  role        TEXT DEFAULT 'user',
  bu          TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apis (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID REFERENCES api_groups(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  description TEXT,
  base_url    TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, slug)
);

CREATE TABLE IF NOT EXISTS api_sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id           UUID REFERENCES apis(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL DEFAULT 'github',
  repository       TEXT NOT NULL,
  branch           TEXT NOT NULL DEFAULT 'main',
  file_path        TEXT NOT NULL,
  sync_enabled     BOOLEAN DEFAULT true,
  last_synced_at   TIMESTAMPTZ,
  last_commit_sha  TEXT,
  last_sync_status TEXT DEFAULT 'PENDING',
  last_sync_error  TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, repository, branch, file_path)
);

CREATE TABLE IF NOT EXISTS api_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id      UUID REFERENCES apis(id) ON DELETE CASCADE,
  version     TEXT NOT NULL,
  commit_sha  TEXT,
  is_active   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS openapi_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_version_id  UUID REFERENCES api_versions(id) ON DELETE CASCADE,
  api_source_id   UUID REFERENCES api_sources(id) ON DELETE SET NULL,
  content         TEXT NOT NULL,
  format          TEXT NOT NULL CHECK (format IN ('yaml','json')),
  checksum        TEXT NOT NULL,
  commit_sha      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS endpoints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_version_id  UUID REFERENCES api_versions(id) ON DELETE CASCADE,
  path            TEXT NOT NULL,
  method          TEXT NOT NULL,
  operation_id    TEXT,
  summary         TEXT,
  description     TEXT,
  deprecated      BOOLEAN DEFAULT false,
  tags            JSONB DEFAULT '[]',
  parameters      JSONB DEFAULT '[]',
  request_body    JSONB,
  responses       JSONB DEFAULT '{}',
  security        JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(api_version_id, path, method)
);

-- Tabel session untuk connect-pg-simple
CREATE TABLE IF NOT EXISTS "session" (
  sid    varchar NOT NULL PRIMARY KEY,
  sess   json NOT NULL,
  expire timestamp(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON "session"(expire);

CREATE INDEX IF NOT EXISTS idx_api_groups_created_by ON api_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_apis_group_id ON apis(group_id);
CREATE INDEX IF NOT EXISTS idx_apis_created_by ON apis(created_by);
CREATE INDEX IF NOT EXISTS idx_api_sources_api_id ON api_sources(api_id);
CREATE INDEX IF NOT EXISTS idx_api_sources_repository ON api_sources(repository);
CREATE INDEX IF NOT EXISTS idx_api_versions_api_id ON api_versions(api_id);
CREATE INDEX IF NOT EXISTS idx_endpoints_api_version_id ON endpoints(api_version_id);
CREATE INDEX IF NOT EXISTS idx_endpoints_path ON endpoints(path);
CREATE INDEX IF NOT EXISTS idx_endpoints_method ON endpoints(method);
