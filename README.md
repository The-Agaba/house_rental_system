# House Rental Management System (FastAPI)

Production-ready rental platform backend with clean architecture, RBAC, JWT auth, PostgreSQL, SQLAlchemy ORM, and image upload support.

## Features

- JWT authentication (`register`, `login`, `logout`, `me`)
- Role-based access control (`tenant`, `landlord`, `admin`)
- Property CRUD + multiple image uploads (jpg/jpeg/png)
- Property search and filters (location, price, rooms, availability)
- Booking workflow (pending/approved/rejected/completed)
- Tenant favorites
- Tenant-landlord message simulation endpoint
- Admin user and platform statistics endpoints
- Pagination and optimized ORM queries with eager loading

## Project Structure

```text
app/
 ├── main.py
 ├── core/
 │    ├── config.py
 │    ├── security.py
 │    └── dependencies.py
 ├── models/
 ├── schemas/
 ├── routes/
 ├── services/
 ├── database/
 ├── utils/
 └── uploads/
main.py
requirements.txt
.env.example
README.md
```

## Setup

1. Create and activate virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment:

```bash
copy .env.example .env
```

4. Create PostgreSQL database (example: `house_rental`).
5. Start API:

```bash
uvicorn main:app --reload
```

Swagger docs:

- [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## Seed Sample Data

```bash
python -m app.utils.seed
```

Seeded users:

- Admin: `admin@houserental.com` / `Admin@123`
- Landlord: `landlord@houserental.com` / `Landlord@123`
- Landlord 2: `landlord2@houserental.com` / `Landlord@123`
- Tenant: `tenant@houserental.com` / `Tenant@123`
- Tenant 2: `tenant2@houserental.com` / `Tenant@123`

## Web Frontend

The project now includes a professional Jinja2 frontend:

- `/` Home page
- `/properties` listing with filters and pagination
- `/properties/{id}` details + gallery + booking request
- `/login` and `/register`
- `/dashboard` role-based dashboards

Image support:

- Local uploads (existing upload endpoint)
- Remote image URLs (e.g. Unsplash stock links) stored in `PropertyImage.file_path`

## API Base URL

`/api/v1`

## Main Endpoints

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### Properties

- `POST /api/v1/properties`
- `GET /api/v1/properties`
- `GET /api/v1/properties/{id}`
- `PUT /api/v1/properties/{id}`
- `DELETE /api/v1/properties/{id}`
- `POST /api/v1/properties/{id}/images`

### Search

- `GET /api/v1/search?location=&price=&rooms=&availability=`

### Bookings

- `POST /api/v1/bookings`
- `GET /api/v1/bookings`
- `PUT /api/v1/bookings/{id}`

### Admin

- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/{id}`
- `DELETE /api/v1/admin/users/{id}`
- `GET /api/v1/admin/stats`

### Optional Utility Endpoints

- `POST /api/v1/favorites`
- `GET /api/v1/favorites`
- `POST /api/v1/messages`
- `GET /api/v1/messages`

## Production Notes

- Replace `JWT_SECRET_KEY` and tighten `CORS_ORIGINS`
- Use persistent object storage (S3-compatible) by swapping `app/utils/file_upload.py`
- Add Alembic migrations for managed schema evolution
- Add Redis-backed token revocation for distributed deployments
