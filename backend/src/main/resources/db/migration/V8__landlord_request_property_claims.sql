CREATE TABLE IF NOT EXISTS landlord_request_properties (
    id BIGSERIAL PRIMARY KEY,
    landlord_request_id BIGINT NOT NULL REFERENCES landlord_requests(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(512) NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_property_id BIGINT REFERENCES properties(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_landlord_request_properties_request
    ON landlord_request_properties(landlord_request_id);

ALTER TABLE landlord_documents
    ADD COLUMN IF NOT EXISTS request_property_id BIGINT REFERENCES landlord_request_properties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_landlord_documents_request_property
    ON landlord_documents(request_property_id);
