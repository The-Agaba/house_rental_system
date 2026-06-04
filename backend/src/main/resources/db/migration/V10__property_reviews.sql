ALTER TABLE bookings ADD COLUMN IF NOT EXISTS feedback_email_sent_at TIMESTAMPTZ;

ALTER TABLE properties ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3, 2) NOT NULL DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS review_count BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS property_reviews (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    verified_rental_review BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_property_reviews_booking UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS idx_property_reviews_property_created ON property_reviews(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_reviews_tenant ON property_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_landlord ON property_reviews(landlord_id);
CREATE INDEX IF NOT EXISTS idx_bookings_feedback_email ON bookings(end_date, feedback_email_sent_at);

UPDATE properties p
SET average_rating = COALESCE(stats.average_rating, 0),
    review_count = COALESCE(stats.review_count, 0)
FROM (
    SELECT property_id, ROUND(AVG(rating)::numeric, 2) AS average_rating, COUNT(*) AS review_count
    FROM property_reviews
    GROUP BY property_id
) stats
WHERE p.id = stats.property_id;
