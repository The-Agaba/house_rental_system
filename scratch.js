(async () => {
  const stamp = Date.now();
  const res = await fetch('http://localhost:8080/api/v1/auth/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: `e2e.landlord.${stamp}@example.com`,
      password: 'E2ePass123',
      fullName: 'E2E Landlord',
      role: 'landlord'
    })
  });
  console.log(res.status, await res.text());
})();
