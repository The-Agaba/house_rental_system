ALTER TABLE reservations ADD COLUMN IF NOT EXISTS appointment_at TIMESTAMP;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS appointment_confirmed_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS landlord_response_notes TEXT;

UPDATE reservations
SET appointment_at = (move_in_date::timestamp - INTERVAL '1 day')
WHERE appointment_at IS NULL;

ALTER TABLE reservations ALTER COLUMN appointment_at SET NOT NULL;

UPDATE reservations
SET queue_position = 0
WHERE status IN ('pending_landlord_confirmation', 'confirmed', 'expired', 'cancelled', 'declined', 'accepted');

CREATE INDEX IF NOT EXISTS idx_reservations_property_active_hold
    ON reservations(property_id, status, confirmation_deadline);

CREATE INDEX IF NOT EXISTS idx_reservations_tenant_active_hold
    ON reservations(tenant_id, status);
