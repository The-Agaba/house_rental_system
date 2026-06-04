const BASE_URL = process.env.RPMS_API_URL || 'http://localhost:8080/api/v1';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { response, body };
}

async function login(email, password) {
  const { response, body } = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert(response.status === 200 && body?.accessToken, `Login succeeds for ${email}`);
  return body;
}

let testCount = 0;
let successCount = 0;

function assert(condition, message) {
  testCount += 1;
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  successCount += 1;
  console.log(`PASS: ${message}`);
}

async function runTests() {
  console.log('Starting RPMS end-to-end API smoke test');

  const stamp = Date.now();
  const landlord = {
    email: `e2e.landlord.${stamp}@example.com`,
    password: 'E2ePass123',
    fullName: 'E2E Landlord',
    role: 'landlord',
  };
  const tenant = {
    email: `e2e.tenant.${stamp}@example.com`,
    password: 'E2ePass123',
    fullName: 'E2E Tenant',
    role: 'tenant',
  };

  let adminToken;
  let landlordToken;
  let tenantToken;
  let landlordId;
  let tenantId;
  let propertyId;

  async function cleanup() {
    if (!adminToken) return;
    if (propertyId) {
      await request(`/properties/${propertyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {});
    }
    if (tenantId) {
      await request(`/admin/users/${tenantId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {});
    }
    if (landlordId) {
      await request(`/admin/users/${landlordId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {});
    }
  }

  try {
    const publicProperties = await request('/properties?size=1');
    assert(publicProperties.response.status === 200, 'Public property search endpoint responds');

    const adminLogin = await login('admin@gmail.com', 'admin');
    adminToken = adminLogin.accessToken;

    for (const user of [landlord, tenant]) {
      const created = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(user),
      });
      assert(created.response.status === 200 || created.response.status === 201, `${user.role} registration succeeds`);
      if (user.role === 'landlord') landlordId = created.body.id;
      if (user.role === 'tenant') tenantId = created.body.id;
    }

    landlordToken = (await login(landlord.email, landlord.password)).accessToken;
    tenantToken = (await login(tenant.email, tenant.password)).accessToken;

    const createdProperty = await request('/properties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${landlordToken}` },
      body: JSON.stringify({
        title: `E2E Test Property ${stamp}`,
        description: 'Temporary listing created by automated e2e smoke test.',
        location: 'Dar es Salaam',
        pricePerMonth: 1200,
        rooms: 2,
        availability: 'available',
        phone: '+255700000000',
        contactEmail: landlord.email,
      }),
    });
    assert(createdProperty.response.status === 200 || createdProperty.response.status === 201, 'Landlord creates property');
    propertyId = createdProperty.body.id;

    const approvedProperty = await request(`/properties/${propertyId}/approve?approved=true`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(approvedProperty.response.status === 200 && approvedProperty.body.approved === true, 'Admin approval publishes test property');

    const booking = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
      body: JSON.stringify({
        propertyId,
        startDate: '2026-05-01',
        endDate: '2026-06-01',
        message: 'Automated booking request.',
      }),
    });
    assert(booking.response.status === 200 || booking.response.status === 201, 'Tenant submits booking');
    assert(booking.body.status === 'pending', 'Booking starts as pending');

    const landlordBookings = await request('/bookings/landlord', {
      headers: { Authorization: `Bearer ${landlordToken}` },
    });
    assert(
      landlordBookings.response.status === 200 && landlordBookings.body.some((item) => item.id === booking.body.id),
      'Landlord sees incoming booking'
    );

    const chat = await request('/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
      body: JSON.stringify({ recipientId: landlordId, body: 'Automated chat message.' }),
    });
    assert(chat.response.status === 200 || chat.response.status === 201, 'Tenant sends chat message');

    const approvedBooking = await request(`/bookings/${booking.body.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${landlordToken}` },
      body: JSON.stringify({ status: 'approved' }),
    });
    assert(approvedBooking.response.status === 200 && approvedBooking.body.status === 'approved', 'Landlord approves booking');

    const reviewEligibility = await request(`/properties/${propertyId}/reviews/eligibility`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tenantToken}` }
    });
    assert(reviewEligibility.response.status === 200 && reviewEligibility.body.eligible === true, 'Tenant is eligible to review after lease ends');

    const submitReview = await request(`/properties/${propertyId}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
      body: JSON.stringify({ rating: 5, comment: 'Excellent property, highly recommend.' })
    });
    assert(submitReview.response.status === 200 && submitReview.body.rating === 5, 'Tenant submits verified review successfully');

    const propertyDetails = await request(`/properties/${propertyId}`, {
      method: 'GET'
    });
    assert(propertyDetails.response.status === 200 && propertyDetails.body.averageRating === 5 && propertyDetails.body.reviewCount === 1, 'Property average rating is recalculated automatically');

    const logs = await request('/admin/logs', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(logs.response.status === 200 && Array.isArray(logs.body), 'Admin reads audit logs');

    console.log(`Completed successfully: ${successCount}/${testCount} checks passed`);
  } finally {
    await cleanup();
  }
}

runTests().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
