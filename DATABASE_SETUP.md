# DATABASE SETUP GUIDE
# Run these SQL statements in your Supabase SQL Editor in ORDER (1 → 3).
# Each table number matches the Prisma model comment (// TABLE 1, 2, 3).

# ─────────────────────────────────────────────────────────────────────────────
# TABLE 1 — uploaded_documents
# Stores metadata for every uploaded file.
# ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uploaded_documents (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  application_id  TEXT,
  document_type   TEXT        NOT NULL,
  file_name       TEXT        NOT NULL,
  file_path       TEXT        NOT NULL,
  file_size       INTEGER     NOT NULL,
  mime_type       TEXT        NOT NULL,
  ocr_status      TEXT        NOT NULL DEFAULT 'uploaded',
  uploaded_by     TEXT        NOT NULL,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- Index for fast lookup by application
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_application_id
  ON uploaded_documents (application_id);

-- Index for soft-delete queries
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_deleted_at
  ON uploaded_documents (deleted_at);


# ─────────────────────────────────────────────────────────────────────────────
# TABLE 2 — ocr_processing_logs
# Stores each OCR processing attempt and its result.
# Must be created AFTER TABLE 1 (foreign key dependency).
# ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ocr_processing_logs (
  id                TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  document_id       TEXT        NOT NULL REFERENCES uploaded_documents(id) ON DELETE CASCADE,
  processing_status TEXT        NOT NULL DEFAULT 'ready',
  extracted_text    TEXT,
  confidence_score  FLOAT,
  processed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_by      TEXT,
  remarks           TEXT
);

-- Index for fast lookup by document
CREATE INDEX IF NOT EXISTS idx_ocr_logs_document_id
  ON ocr_processing_logs (document_id);


# ─────────────────────────────────────────────────────────────────────────────
# TABLE 3 — upload_audit_logs
# Logs every action performed on uploaded documents.
# Must be created AFTER TABLE 1 (foreign key dependency).
# ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS upload_audit_logs (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  document_id   TEXT        NOT NULL REFERENCES uploaded_documents(id) ON DELETE CASCADE,
  action        TEXT        NOT NULL,
  performed_by  TEXT        NOT NULL,
  performed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details       JSONB
);

-- Index for fast lookup by document
CREATE INDEX IF NOT EXISTS idx_audit_logs_document_id
  ON upload_audit_logs (document_id);


# ─────────────────────────────────────────────────────────────────────────────
# SUPABASE STORAGE BUCKET
# Run this once in the Supabase SQL Editor OR create it via the Storage UI.
# ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('bplo-documents', 'bplo-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'bplo-documents');

-- Allow authenticated users to read their own uploads
CREATE POLICY "Authenticated users can read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'bplo-documents');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'bplo-documents');
