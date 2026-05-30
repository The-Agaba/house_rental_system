-- Migration V9: Add request_type column to landlord_requests to support additional property requests
ALTER TABLE landlord_requests 
ADD COLUMN IF NOT EXISTS request_type VARCHAR(32) NOT NULL DEFAULT 'initial_landlord';
