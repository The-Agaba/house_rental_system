-- Bring existing PostgreSQL databases in line with the RentHub onboarding and reservation entities.
-- This migration is intentionally additive/idempotent so it can repair databases that were
-- previously managed by Hibernate ddl-auto=update while Flyway was disabled.

ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locality VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tin_number VARCHAR(255);

UPDATE users
SET email_verified = TRUE
WHERE email_verified = FALSE
  AND role IN ('admin', 'tenant');

ALTER TABLE properties ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS needs_images BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS registered_by_agent_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

UPDATE properties
SET approved = TRUE
WHERE approved = FALSE;

UPDATE properties p
SET needs_images = NOT EXISTS (
    SELECT 1
    FROM property_images pi
    WHERE pi.property_id = p.id
);
ALTER TABLE system_logs ALTER COLUMN entity_type TYPE VARCHAR(255);

CREATE TABLE IF NOT EXISTS landlord_requests (
    id BIGSERIAL PRIMARY KEY,
    requester_email VARCHAR(255) NOT NULL,
    requester_full_name VARCHAR(255) NOT NULL,
    requester_phone VARCHAR(255) NOT NULL,
    locality VARCHAR(255) NOT NULL,
    tin_number VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    assigned_agent_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_landlord_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_landlord_requests_status ON landlord_requests(status);
CREATE INDEX IF NOT EXISTS idx_landlord_requests_agent ON landlord_requests(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_landlord_requests_email ON landlord_requests(lower(requester_email));

CREATE TABLE IF NOT EXISTS landlord_documents (
    id BIGSERIAL PRIMARY KEY,
    landlord_request_id BIGINT NOT NULL REFERENCES landlord_requests(id) ON DELETE CASCADE,
    document_type VARCHAR(255) NOT NULL,
    file_path VARCHAR(1024) NOT NULL,
    uploaded_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_landlord_documents_request ON landlord_documents(landlord_request_id);

CREATE TABLE IF NOT EXISTS reservations (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    queue_position INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'queued',
    move_in_date DATE NOT NULL,
    duration_months INTEGER NOT NULL,
    estimated_total_cost NUMERIC(12, 2) NOT NULL,
    confirmation_deadline TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_property_status_queue ON reservations(property_id, status, queue_position);
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_created ON reservations(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_deadline ON reservations(status, confirmation_deadline);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    reference_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_id, is_read);

