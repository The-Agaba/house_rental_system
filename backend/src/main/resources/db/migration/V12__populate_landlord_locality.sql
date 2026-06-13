-- Populate locality for existing verified landlords from their approved onboarding requests
UPDATE users u
SET locality = lr.locality
FROM landlord_requests lr
WHERE lr.created_landlord_id = u.id
  AND lr.request_type = 'initial_landlord'
  AND lr.status = 'approved'
  AND u.role = 'landlord'
  AND (u.locality IS NULL OR u.locality = '');
