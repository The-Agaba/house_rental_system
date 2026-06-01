# RentHub Codebase Comprehensive Overview

## Executive Summary
RentHub is a full-stack house rental platform built with **Spring Boot 3** (backend) and **React 18** (frontend) using **Vite**. The system implements a First-Come-First-Served (FCFS) reservation queue system with email verification, landlord onboarding, and role-based access control.

---

## 1. Backend Java/Spring Structure

### Project Organization
```
backend/src/main/java/com/collincorp/houserental/
├── api/v1/                    # REST API Controllers
├── config/                    # Spring Configuration
├── domain/                    # Enums & Domain Objects
├── dto/                       # Data Transfer Objects
├── entity/                    # JPA Entities
├── repository/                # Spring Data Repositories
├── service/                   # Business Logic Services
├── security/                  # JWT & Security
└── support/                   # Utility Classes
```

### Core Dependencies
- **Spring Boot 3.x** with Spring Web & Data JPA
- **PostgreSQL** database with Flyway migrations
- **JWT (JSON Web Tokens)** for authentication
- **Cloudinary** for image storage
- **Spring Mail** for email notifications
- **Lombok** for entity boilerplate reduction

### Main Application Class
- **HouseRentalApplication.java**: Spring Boot entry point
- **Port**: 8080 (configurable via `SERVER_PORT` env var)
- **Profiles**: Production and Dev profiles available

### Configuration Classes

#### SecurityConfig
- **Location**: `config/SecurityConfig.java`
- **Features**:
  - Disables CSRF protection (stateless JWT-based)
  - Enables CORS with configurable origins
  - Stateless session management
  - JWT filter integration
- **Public Routes**:
  - `/api/v1/auth/**` - All auth endpoints
  - `/api/v1/properties` - Property listing (GET)
  - `/api/v1/properties/{id}` - Property details (GET)
  - `/api/v1/reservations/property/*/queue` - Queue status (GET)
  - `/api/v1/reservations/property/*/available-dates` - Move-in dates (GET)
  - `/api/v1/search` - Search properties (GET)
  - `/api/v1/landlord-requests`, `/api/v1/landlord-requests/verify*` - Landlord onboarding (POST)
  - `/uploads/**` - Static file uploads

#### WebConfig
- **Location**: `config/WebConfig.java`
- Configures SPA routing with `SpaWebFilter` to support React Router

#### CloudinaryConfig
- **Location**: `config/CloudinaryConfig.java`
- Handles property image uploads and CDN delivery

#### ReservationExpiryScheduler
- **Location**: `config/ReservationExpiryScheduler.java`
- **Function**: Scheduled task to expire reservations after 24hr confirmation window

#### DefaultAdminSeeder
- **Location**: `config/DefaultAdminSeeder.java`
- Bootstraps default admin user on application startup

---

## 2. Backend API Controllers & Endpoints

### AuthController (`/api/v1/auth`)
**Location**: `api/v1/AuthController.java`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/register` | POST | Public | Queue user for email verification (OTP sent) |
| `/verify` | POST | Public | Complete registration with OTP code |
| `/login` | POST | Public | Authenticate & return JWT token + user data |
| `/logout` | POST | Authenticated | Clear session (for logging) |
| `/me` | GET | Authenticated | Get current user profile |
| `/profile` | PUT | Authenticated | Update user profile details |

**Registration Flow**:
1. User submits `RegisterRequest` with email, password, fullName, role
2. System checks if email exists → generates 6-digit OTP → sends via email
3. User receives email with OTP code
4. User submits email + OTP in `VerificationRequest`
5. Backend validates OTP → creates `UserEntity` → returns `UserResponse`

### ReservationController (`/api/v1/reservations`)
**Location**: `api/v1/ReservationController.java`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | POST | Tenant | Create new reservation (join queue) |
| `/my` | GET | Tenant | Get user's reservations |
| `/landlord` | GET | Landlord | Get all reservations for landlord's properties |
| `/property/{id}/queue` | GET | Public | Get queue status for property |
| `/property/{id}/available-dates` | GET | Public | Get earliest move-in date |
| `/{id}/confirm` | PUT | Tenant | Confirm reservation within 24hr window |
| `/{id}/accept` | PUT | Landlord | Accept tenant's confirmed reservation |
| `/{id}/cancel` | PUT | Authenticated | Cancel reservation |

**Reservation Lifecycle**:
- **Queued** → Tenant joins queue (position auto-assigned)
- **Awaiting Confirmation** → Queue reached, 24hr countdown begins
- **Confirmed** → Tenant clicked confirm within deadline
- **Accepted** → Landlord approves (final state)
- **Expired** → 24hr window passed without confirmation
- **Cancelled** → User or system cancelled

### PropertyController (`/api/v1/properties`)
**Location**: `api/v1/PropertyController.java`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Public | List properties with pagination & filters |
| `/{id}` | GET | Public | Get property details |
| `/my` | GET | Landlord/Admin | List user's properties |
| `/` | POST | Landlord/Admin | Create new property |
| `/{id}` | PUT | Owner/Admin | Update property |
| `/{id}/approve` | PUT | Admin | Approve/reject property listing |
| `/{id}` | DELETE | Owner/Admin | Delete property |
| `/{id}/images` | POST | Owner/Admin | Upload property images (multipart) |

**Filters Available**:
- `location` - String search
- `maxPrice` - BigDecimal filter
- `minRooms` - Integer filter
- `availability` - Enum (available/unavailable)

### LandlordOnboardingController (`/api/v1/landlord-requests`)
**Location**: `api/v1/LandlordOnboardingController.java`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | POST | Public | Submit landlord join request |
| `/additional-property` | POST | Landlord | Request to add property as existing landlord |
| `/verify` | POST | Public | Verify landlord email with OTP |
| `/verify-and-activate` | POST | Public | Verify email & set password (landlord account creation) |
| `/my` | GET | Agent | Get requests assigned to agent |
| `/{id}` | GET | Authenticated | Get request details |
| `/{id}/assign` | PUT | Agent/Admin | Assign agent to request |
| `/{id}/approve` | PUT | Agent/Admin | Approve landlord request |
| `/{id}/reject` | PUT | Agent/Admin | Reject with reason |
| `/{id}/documents` | POST | Agent/Admin | Upload landlord verification documents |
| `/` | GET | Admin | Get all requests |

**Landlord Onboarding States**:
- **Pending** → Initial submission, awaiting agent assignment
- **Assigned** → Agent assigned, document verification in progress
- **Verified** → Documents verified, account creation pending
- **Approved** → Landlord fully onboarded, can log in
- **Rejected** → Application denied

### NotificationController (`/api/v1/notifications`)
**Location**: `api/v1/NotificationController.java`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | Authenticated | Get all notifications for user |
| `/unread-count` | GET | Authenticated | Get unread notification count |
| `/{id}/read` | PUT | Authenticated | Mark single notification as read |
| `/read-all` | PUT | Authenticated | Mark all notifications as read |

### Other Controllers

#### AdminController
- Super admin features & user management

#### BookingController
- Legacy booking system (may be deprecated in favor of Reservations)

#### FavoriteController
- Favorite properties management

#### SearchController
- Advanced property search with filtering

---

## 3. Backend Services

### AuthService
**Location**: `service/AuthService.java`

**Key Methods**:
- `completeRegistration(RegisterRequest)` - Persist verified user to DB
- `login(LoginRequest)` - Validate credentials, generate JWT token
- `isEmailTaken(String)` - Check email availability
- `me()` - Get current authenticated user
- `updateProfile(ProfileUpdateRequest)` - Update user profile

**Notes**:
- Landlord accounts created through `LandlordOnboardingService` (separate flow)
- Passwords stored as bcrypt hashes
- JWT tokens issued for stateless authentication

### ReservationService
**Location**: `service/ReservationService.java`

**Key Methods**:
- `createReservation(ReservationCreateRequest, tenantId)` - Join queue with FCFS logic
- `getQueueStatus(propertyId)` - Return queue details for property
- `getEarliestMoveInDate(propertyId)` - Calculate next available move-in date
- `confirmReservation(id, tenantId)` - Tenant confirms during 24hr window
- `landlordAcceptReservation(id, landlordId)` - Landlord approves reservation
- `cancelReservation(id, userId)` - Cancel & trigger notifications

**Queue Logic**:
1. **Position Assignment**: Max queue position + 1
2. **Move-In Calculation**: Based on current lease end dates
3. **Conflict Detection**: Prevent duplicate active reservations per tenant per property
4. **Promotion**: When top reservation expires/cancels, next gets 24hr window

### PropertyService
**Location**: `service/PropertyService.java`

**Key Methods**:
- `search(location, maxPrice, minRooms, availability, pageable)` - JPA Specification-based filtering
- `get(Long id)` - Get property with authorization checks
- `create(PropertyCreateRequest)` - Create property (requires landlord/admin/agent)
- `update(Long id, PropertyUpdateRequest)` - Update property details
- `approve(Long id, boolean approved)` - Admin approval workflow
- `addImages(Long id, List<MultipartFile>)` - Upload images via Cloudinary
- `listMine()` - Get current user's properties

**Authorization**:
- Unapproved properties visible only to admin/owner
- Admin can view all contact details
- Tenants see approved properties only

### NotificationService
**Location**: `service/NotificationService.java`

**Key Methods**:
- `sendNotification(recipientId, type, title, message, referenceId)` - Create notification + send email
- `getMyNotifications(userId)` - Retrieve user notifications (ordered by creation desc)
- `markAsRead(id)` - Update read status
- `markAllAsRead(userId)` - Mark all user notifications as read

**Email Integration**:
- SimpleMailMessage sent asynchronously
- Email delivery tracked in `email_sent` flag
- Failures logged but don't fail transaction

### EmailVerificationService
**Location**: `service/EmailVerificationService.java`

**Key Methods**:
- `queuePendingRegistration(RegisterRequest)` - Cache registration data & send OTP
- `verifyCode(email, code)` - Validate 6-digit OTP
- `getAndClearPendingRegistration(email)` - Retrieve & clear cached registration
- `generateLandlordVerificationCode(email)` - Generate OTP for landlord email verification
- `verifyLandlordCode(email, code)` - Validate landlord OTP

**Storage**:
- In-memory `ConcurrentHashMap` for verification codes (not persistent)
- **Note**: Codes not persisted across server restarts—consider database backup for production

### LandlordOnboardingService
**Location**: `service/LandlordOnboardingService.java`

**Key Methods**:
- `submitJoinRequest(LandlordJoinRequestDto)` - Create new landlord request
- `submitAdditionalPropertyRequest(AdditionalPropertyRequestDto)` - Property claim for existing landlord
- `verifyLandlordEmail(email, code)` - Verify landlord's email
- `verifyAndActivateLandlord(email, code, newPassword)` - Complete landlord account creation
- `approveLandlord(id, LandlordApprovalDto, agentId)` - Agent approves landlord
- `rejectRequest(id, reason, agentId)` - Reject landlord request
- `uploadDocument(id, documentType, file, agentId, requestPropertyId)` - Upload verification docs
- `assignAgent(id, agentId)` - Assign agent to request
- `getRequestsAssignedToMe(agentId)` - Get agent's assigned requests

### StorageService
**Location**: `service/StorageService.java`

**Features**:
- Cloudinary integration for image hosting
- File upload & deletion
- CDN URL generation

### LogService
**Location**: `service/LogService.java`

**Purpose**:
- Audit logging for all critical actions (login, registration, reservations, notifications)
- Tracks user actions, entities modified, timestamps

---

## 4. Backend Domain Models & Entities

### UserEntity
**Location**: `entity/UserEntity.java`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Long | PK |
| `email` | String | Unique, case-insensitive |
| `passwordHash` | String | bcrypt hashed |
| `role` | UserRole | tenant, landlord, agent, admin |
| `fullName` | String | Display name |
| `active` | boolean | Account active status |
| `emailVerified` | boolean | Email verification flag |
| `locality` | String | User's city/region |
| `phone` | String | Contact phone |
| `tinNumber` | String | Tax ID (for landlords) |
| `createdBy` | Long | FK to admin/agent who created |
| `createdAt` | Instant | Timestamp |

**Relationships**:
- One-to-Many: Properties (as landlord)
- One-to-Many: Reservations (as tenant)
- One-to-Many: Notifications
- One-to-Many: Messages

### PropertyEntity
**Location**: `entity/PropertyEntity.java`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Long | PK |
| `landlord` | UserEntity | FK - required |
| `title` | String | Property name |
| `description` | String | Full description |
| `location` | String | Address/coordinates |
| `pricePerMonth` | BigDecimal | Monthly rent |
| `rooms` | int | Number of bedrooms |
| `availability` | PropertyAvailability | available/unavailable |
| `approved` | boolean | Admin approval status |
| `needsImages` | boolean | Image upload requirement |
| `registeredByAgent` | UserEntity | FK - agent who registered |
| `phone` | String | Property contact phone |
| `contactEmail` | String | Property contact email |
| `createdAt` | Instant | Creation timestamp |

**Relationships**:
- Many-to-One: UserEntity (landlord)
- One-to-Many: PropertyImages
- One-to-Many: Reservations
- One-to-Many: Favorites

**Indexes**:
- `idx_properties_location` - Search optimization
- `idx_properties_price` - Price filtering
- `idx_properties_landlord` - Landlord properties lookup

### ReservationEntity
**Location**: `entity/ReservationEntity.java`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Long | PK |
| `property` | PropertyEntity | FK - required |
| `tenant` | UserEntity | FK - required |
| `queuePosition` | int | Position in FCFS queue (1-based) |
| `status` | ReservationStatus | See status enum below |
| `moveInDate` | LocalDate | Requested move-in date |
| `durationMonths` | int | Lease duration |
| `estimatedTotalCost` | BigDecimal | Monthly rent × months |
| `confirmationDeadline` | Instant | 24hr confirmation window |
| `confirmedAt` | Instant | When tenant confirmed |
| `createdAt` | Instant | When created |
| `updatedAt` | Instant | Last update (auto-updated) |

**Status Enum** (`ReservationStatus.java`):
- `queued` - In FCFS queue waiting for turn
- `awaiting_confirmation` - User's turn, has 24 hours to confirm
- `confirmed` - Tenant confirmed, awaiting landlord acceptance
- `accepted` - Landlord accepted (final)
- `expired` - 24hr window passed without confirmation
- `cancelled` - User or system cancelled

**Indexes**:
- `idx_reservations_property_status_queue` - Queue status lookup
- `idx_reservations_tenant_created` - Tenant's reservations
- `idx_reservations_deadline` - Scheduler expiry check

### NotificationEntity
**Location**: `entity/NotificationEntity.java`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Long | PK |
| `recipient` | UserEntity | FK - who receives |
| `type` | NotificationType | See type enum |
| `title` | String | Short notification title |
| `message` | String | Full message body |
| `read` | boolean | Read status |
| `emailSent` | boolean | Email delivery status |
| `referenceId` | Long | Related entity ID (optional) |
| `createdAt` | Instant | Creation time |

**Type Enum** (`NotificationType.java`):
- `QUEUE_POSITION` - Position in reservation queue updated
- `PROMOTION` - Moved to awaiting_confirmation status
- `CONFIRMATION_DEADLINE` - 24hr window reminder
- `RESERVATION_ACCEPTED` - Landlord accepted reservation
- `RESERVATION_CANCELLED` - Reservation was cancelled
- `LANDLORD_REQUEST_UPDATE` - Landlord onboarding status change
- `PROPERTY_APPROVED` - Property approved for listing
- `GENERAL` - Miscellaneous notifications

**Indexes**:
- `idx_notifications_recipient_created` - User notifications list
- `idx_notifications_recipient_unread` - Unread count query

### LandlordRequestEntity
**Location**: `entity/LandlordRequestEntity.java`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Long | PK |
| `requesterEmail` | String | Applicant's email (unique per request type) |
| `requesterFullName` | String | Full name |
| `requesterPhone` | String | Contact phone |
| `locality` | String | City/region for agent assignment |
| `tinNumber` | String | Tax ID number |
| `status` | LandlordRequestStatus | pending/assigned/verified/approved/rejected |
| `requestType` | LandlordRequestType | initial_landlord/additional_property |
| `assignedAgent` | UserEntity | FK to assigned agent |
| `createdLandlord` | UserEntity | FK to created landlord (after approval) |
| `notes` | String | Internal notes |
| `createdAt` | Instant | Submission timestamp |
| `updatedAt` | Instant | Last update |

**Status Enum** (`LandlordRequestStatus.java`):
- `pending` - Awaiting agent assignment
- `assigned` - Agent assigned, documents being verified
- `verified` - Documents verified
- `approved` - Fully onboarded, landlord account created
- `rejected` - Application denied

**Type Enum** (`LandlordRequestType.java`):
- `initial_landlord` - New landlord joining
- `additional_property` - Existing landlord adding property

**Indexes**:
- `idx_landlord_requests_status` - Query by status
- `idx_landlord_requests_agent` - Agent's requests
- `idx_landlord_requests_email` - Email lookup (case-insensitive)

### PropertyImageEntity
**Location**: `entity/PropertyImageEntity.java`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Long | PK |
| `property` | PropertyEntity | FK - cascade delete |
| `filePath` | String | Cloudinary CDN URL |

### MessageEntity
**Location**: `entity/MessageEntity.java`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Long | PK |
| `sender` | UserEntity | FK - message author |
| `recipient` | UserEntity | FK - message receiver |
| `body` | String | Message content |
| `createdAt` | Instant | Sent timestamp |

### BookingEntity
**Location**: `entity/BookingEntity.java`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Long | PK |
| `property` | PropertyEntity | FK |
| `tenant` | UserEntity | FK |
| `status` | BookingStatus | Legacy booking status |
| `startDate` | Date | Check-in date |
| `endDate` | Date | Check-out date |
| `message` | String | Booking message |
| `createdAt` | Instant | Timestamp |

**Note**: Appears to be legacy; Reservations are primary booking mechanism

### SystemLogEntity
**Location**: `entity/SystemLogEntity.java`

| Field | Type | Notes |
|-------|------|-------|
| `id` | Long | PK |
| `action` | LogAction | Action type enum |
| `entityType` | String | Entity affected |
| `entityId` | Long | Entity ID |
| `userId` | Long | User who performed action |
| `userEmail` | String | User email |
| `details` | String | Description |
| `createdAt` | Instant | Timestamp |

---

## 5. Domain Enums

### UserRole
```java
tenant, landlord, agent, admin
```

### PropertyAvailability
```java
available, unavailable
```

### ReservationStatus
```java
queued, awaiting_confirmation, confirmed, expired, cancelled, accepted
```

### NotificationType
```java
QUEUE_POSITION, PROMOTION, CONFIRMATION_DEADLINE, RESERVATION_ACCEPTED,
RESERVATION_CANCELLED, LANDLORD_REQUEST_UPDATE, PROPERTY_APPROVED, GENERAL
```

### LandlordRequestStatus
```java
pending, assigned, verified, approved, rejected
```

### LandlordRequestType
```java
initial_landlord, additional_property
```

### BookingStatus
```java
pending, confirmed, cancelled
```

### LogAction
```java
LOGIN, LOGOUT, USER_CREATED, PROPERTY_CREATED, RESERVATION_CREATED, etc.
```

---

## 6. Security & Authentication

### JWT Implementation
**Location**: `security/JwtService.java`, `security/JwtAuthFilter.java`

**Token Generation**:
- User ID, Email, Role encoded in JWT
- Secret: `JWT_SECRET` environment variable
- Expiration: 24 hours (configurable via `JWT_EXPIRATION_MS`)

**Token Validation**:
- Every request to `/api/**` (except public endpoints) requires `Authorization: Bearer <token>` header
- `JwtAuthFilter` intercepts requests and validates token
- Invalid/expired tokens return 401 Unauthorized

### Password Encoding
- Algorithm: bcrypt with 10 rounds
- Configuration: `SecurityConfig.passwordEncoder()`

### Current User Retrieval
**Location**: `support/SecurityUtils.java`

```java
UserEntity user = SecurityUtils.currentUser(); // Get authenticated user
```

---

## 7. Database Schema & Migrations

### Flyway Migrations
**Location**: `src/main/resources/db/migration/`

| Version | File | Purpose |
|---------|------|---------|
| V1 | `V1__init.sql` | Initial schema (users, properties, bookings, favorites, messages) |
| V2 | `V2__seed_data.sql` | Demo data seeding |
| V3 | `V3__add_contact_details_and_logs.sql` | Contact fields, system logs table |
| V4 | `V4__super_admin_features.sql` | Admin feature expansion |
| V5 | `V5__remove_demo_seed_data.sql` | Remove demo data |
| V6 | `V6__reset_to_admin_only.sql` | Bootstrap to admin-only |
| V7 | `V7__renthub_onboarding_reservations_schema.sql` | **Reservations system, Notifications, Landlord onboarding** |
| V8 | `V8__landlord_request_property_claims.sql` | Property claim tracking |
| V9 | `V9__add_request_type_to_landlord_requests.sql` | Request type differentiation |

### Key Tables
```
users
  ├─ id (PK)
  ├─ email (UNIQUE)
  ├─ password_hash
  ├─ role
  ├─ email_verified
  └─ ...

properties
  ├─ id (PK)
  ├─ landlord_id (FK → users)
  ├─ title, description, location
  ├─ price_per_month
  ├─ rooms
  ├─ approved
  └─ ...

reservations
  ├─ id (PK)
  ├─ property_id (FK → properties)
  ├─ tenant_id (FK → users)
  ├─ queue_position
  ├─ status
  ├─ move_in_date
  ├─ confirmation_deadline
  └─ ...

notifications
  ├─ id (PK)
  ├─ recipient_id (FK → users)
  ├─ type
  ├─ is_read
  ├─ email_sent
  └─ ...

landlord_requests
  ├─ id (PK)
  ├─ requester_email
  ├─ status
  ├─ assigned_agent_id (FK → users)
  ├─ created_landlord_id (FK → users)
  └─ ...
```

---

## 8. Backend Configuration

### Application Properties
**Location**: `src/main/resources/application.yaml`

```yaml
server:
  port: 8080  # Configurable via SERVER_PORT env var

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/house_rental
    username: postgres
    password: (from DB_PASSWORD env var)
  
  jpa:
    hibernate:
      ddl-auto: validate  # Flyway manages schema
  
  mail:
    host: smtp.gmail.com
    username: nazarethdominic189@gmail.com
    password: (from MAIL_PASSWORD env var)

app:
  cors:
    allowed-origins: http://localhost:5173,http://127.0.0.1:5173
  jwt:
    secret: (from JWT_SECRET env var)
    expiration-ms: 86400000  # 24 hours
  uploads:
    dir: ./house_rental_uploads
  cloudinary:
    cloud-name: dp2sofb5n
    api-key: (from CLOUDINARY_API_KEY env var)
```

---

---

## 9. Frontend React Structure

### Project Organization
```
frontend/src/
├── components/              # Reusable UI components
│   ├── CostEstimator.jsx
│   ├── DocumentUploader.jsx
│   ├── Footer.jsx
│   ├── Navbar.jsx
│   ├── NotificationBell.jsx
│   ├── OtpModal.jsx
│   ├── ReservationCalendar.jsx
│   └── ReservationQueue.jsx
├── context/                 # React Context
│   └── AuthContext.jsx
├── pages/                   # Full page components
│   ├── Dashboard.jsx
│   ├── Home.jsx
│   ├── LandlordEmailVerify.jsx
│   ├── LandlordJoinRequest.jsx
│   ├── Login.jsx
│   ├── Manual.jsx
│   ├── Properties.jsx
│   ├── PropertyDetail.jsx
│   ├── PropertyForm.jsx
│   └── Register.jsx
├── utils/                   # Utility functions
│   ├── axios.js
│   └── currency.js
├── App.jsx                  # Main app component
├── main.jsx                 # React entry point
├── index.css                # Global styles
└── App.css                  # App styles
```

### Core Dependencies
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "axios": "^1.x",
  "tailwindcss": "^3.x",
  "postcss": "^8.x",
  "lucide-react": "^0.x",
  "framer-motion": "^10.x",
  "react-hot-toast": "^2.x"
}
```

### Build & Dev Tools
- **Vite**: Fast development server & bundler
- **ESLint**: Code linting
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS transformation

---

## 10. Frontend Routing & Layout

### App Routing
**Location**: `App.jsx`

```jsx
// Public Routes
GET  /                          → Home.jsx
GET  /login                     → Login.jsx
GET  /register                  → Register.jsx
GET  /properties                → Properties.jsx
GET  /properties/:id            → PropertyDetail.jsx
GET  /manual                    → Manual.jsx
GET  /become-landlord           → LandlordJoinRequest.jsx
GET  /verify-landlord           → LandlordEmailVerify.jsx

// Protected Routes (Authenticated)
GET  /dashboard                 → Dashboard.jsx
GET  /properties/new            → PropertyForm.jsx (Admin/Agent/Landlord)
GET  /properties/:id/edit       → PropertyForm.jsx (Owner/Admin/Agent)
```

### Layout Wrapper
**Location**: `App.jsx`

**Navbar Visibility Rules**:
- Hidden on `/dashboard` routes
- Hidden on `/manual` routes
- Shown on all other routes

**Footer Visibility Rules**:
- Hidden on `/dashboard` routes
- Hidden on `/manual` routes
- Shown on all other routes

### Navigation Components

#### Navbar
**Location**: `components/Navbar.jsx`

**Features**:
- Logo with link to home
- Search properties input
- Auth-aware navigation (login/signup vs. dashboard/profile)
- Mobile hamburger menu
- Notification bell (if authenticated)
- Dark mode toggle

#### Footer
**Location**: `components/Footer.jsx`

**Sections**:
1. **Brand** - Logo, description, social links (Instagram, Twitter, Facebook)
2. **Platform** - Search Houses, List Property, Dashboard, Pricing
3. **Support** - Help Center, Safety Center, Community Guide, Cookie Policy
4. **Contact** - Address (Dodoma, Tanzania), Phone (+255767113665), Email

**Features**:
- Responsive grid layout (1 col mobile → 4 col desktop)
- Brand logo with RentalHub wordmark
- Social media links
- Dark mode support

---

## 11. Frontend Authentication Flow

### AuthContext
**Location**: `context/AuthContext.jsx`

**State**:
- `user` - Current authenticated user object
- `loading` - Initial auth check in progress
- `token` - JWT token from localStorage

**Methods**:
- `login(email, password)` - Authenticate & store token
- `register(userData)` - Queue registration (shows OTP modal)
- `verifyEmail(email, code)` - Complete registration with OTP
- `logout()` - Clear token & user state
- `updateProfile(data)` - Update user profile

**Token Storage**:
- JWT stored in `localStorage` under key `token`
- Auto-included in all axios requests via `Authorization: Bearer <token>` header
- Cleared on logout

**Error Handling**:
- Friendly error messages mapped from backend error codes
- Toast notifications for all errors
- Session auto-clears on 401/expired token

### Protected Route Component
```jsx
<ProtectedRoute roles={['landlord', 'admin']}>
  <SomeComponent />
</ProtectedRoute>
```

**Logic**:
- Redirects unauthenticated users to `/login`
- Redirects unauthorized roles to `/dashboard`
- Returns children if authorized

### Login Redirection Logic

**After Successful Login**:
```javascript
await login(email, password);
navigate('/dashboard');  // Redirect to dashboard
```

**After Successful Registration**:
```javascript
await register(form);
setShowOtp(true);  // Show OTP modal
// After OTP verification:
toast.success('Email verified! You can now log in.');
navigate('/login');  // User manually navigates to login
```

**Protected Route Access**:
- User navigates to protected route (e.g., `/dashboard`)
- `ProtectedRoute` checks auth
- If not authenticated → redirects to `/login`
- If authenticated but wrong role → redirects to `/dashboard`

---

## 12. Frontend Pages & Components

### Pages

#### Home (`Home.jsx`)
- Landing page with hero section
- Featured properties
- Call-to-action buttons (Search, Become Landlord)

#### Login (`Login.jsx`)
- Email & password input
- Show/hide password toggle
- "Remember me" checkbox
- Forgot password link
- Sign up link
- Calls `useAuth().login()`

#### Register (`Register.jsx`)
- Full name, email, password inputs
- Role selector (tenant/landlord)
- Submits to `useAuth().register()`
- Shows `OtpModal` on success

#### Properties (`Properties.jsx`)
- Property grid with pagination
- Filters: location, max price, min rooms, availability
- Each property card shows image, title, price, location, rooms
- Click card to view details

#### PropertyDetail (`PropertyDetail.jsx`)
- Full property gallery with image carousel
- Property details: title, description, location, price, rooms
- Amenities list
- `ReservationQueue` component (shows current queue)
- `ReservationCalendar` component (date picker)
- `CostEstimator` component (calculate total)
- "Join Queue" button for tenants
- Action buttons based on user role

#### PropertyForm (`PropertyForm.jsx`)
- Create new property (admin/agent/landlord)
- Edit existing property (owner/admin/agent)
- Fields: title, description, location, price, rooms, availability
- Image upload section
- Form validation & submission

#### Dashboard (`Dashboard.jsx`)
- **Landlord view**:
  - Properties list with management options
  - Reservation queue viewer
  - Analytics dashboard (inquiry charts)
  - Notification bell
- **Tenant view**:
  - My reservations list
  - Reservation status tracker
  - Favorites
- **Admin view**:
  - User management
  - Property approval queue
  - System logs

#### LandlordJoinRequest (`LandlordJoinRequest.jsx`)
- Multi-step form for landlord onboarding
- Fields: email, full name, phone, locality, TIN number
- Dynamic property list (add/remove properties)
- Success modal with next steps
- Error handling with friendly messages

#### LandlordEmailVerify (`LandlordEmailVerify.jsx`)
- OTP verification form for landlord email activation
- Password setup form
- Calls `/landlord-requests/verify-and-activate` endpoint

#### Manual (`Manual.jsx`)
- User manual / documentation page
- Hidden navbar & footer

### Reusable Components

#### NotificationBell (`NotificationBell.jsx`)
**Features**:
- Bell icon with unread count badge
- Dropdown menu with notification list
- Notification type icons (deadline, promotion, accepted, etc.)
- Mark individual notifications as read
- Mark all notifications as read
- Polls server every 15 seconds for updates

#### ReservationQueue (`ReservationQueue.jsx`)
**Purpose**: Display current reservation queue for a property

**Features**:
- Shows queue position for each reservation
- Highlights active "awaiting_confirmation" reservation
- Countdown timer for confirmation deadline (24hr window)
- Show user names in queue
- "Confirm" button for user's own reservation
- "Cancel" button to leave queue
- Auto-refreshes queue every 15 seconds

**Data Source**:
- `/reservations/property/{propertyId}/queue` endpoint
- Returns `QueueStatusResponse` with active/upcoming reservations

#### ReservationCalendar (`ReservationCalendar.jsx`)
**Purpose**: Date picker for reservation move-in date

**Features**:
- Fetches earliest available move-in date from backend
- Date input with minimum date validation
- Shows calculated earliest date in helper text
- Disables past dates automatically

**Data Source**:
- `/reservations/property/{propertyId}/available-dates` endpoint

#### CostEstimator (`CostEstimator.jsx`)
**Purpose**: Calculate estimated reservation cost

**Features**:
- Duration selector (1-12 months)
- Displays: monthly rate × duration
- Shows total cost in TZS currency
- Updates dynamically as duration changes

#### OtpModal (`OtpModal.jsx`)
**Purpose**: 6-digit OTP input modal

**Features**:
- Email display
- 6-digit input fields
- Resend button
- Calls `useAuth().verifyEmail()` on submit
- Handles errors from backend

#### DocumentUploader (`DocumentUploader.jsx`)
**Purpose**: File upload for landlord documents (NIDA, TRA verification)

**Features**:
- Drag-and-drop support
- File type validation
- Progress indicator
- Success/error feedback

---

## 13. Frontend API Integration

### Axios Configuration
**Location**: `utils/axios.js`

```javascript
axios.defaults.baseURL = '/api/v1';  // Set from VITE_API_PATH_PREFIX

// Auto-add JWT token from localStorage
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
```

### Common API Calls

**Authentication**:
```javascript
POST /auth/register          // Queue registration
POST /auth/verify            // Verify OTP & complete registration
POST /auth/login             // Login
GET  /auth/me                // Get current user
PUT  /auth/profile           // Update profile
POST /auth/logout            // Logout
```

**Properties**:
```javascript
GET  /properties             // List with pagination & filters
GET  /properties/{id}        // Get details
POST /properties             // Create
PUT  /properties/{id}        // Update
DELETE /properties/{id}      // Delete
POST /properties/{id}/images // Upload images
GET  /properties/my          // Get my properties
```

**Reservations**:
```javascript
POST /reservations                           // Create reservation
GET  /reservations/my                        // Get my reservations
GET  /reservations/landlord                  // Get landlord's reservations
GET  /reservations/property/{id}/queue       // Get queue status
GET  /reservations/property/{id}/available-dates
PUT  /reservations/{id}/confirm              // Confirm reservation
PUT  /reservations/{id}/accept               // Landlord accepts
PUT  /reservations/{id}/cancel               // Cancel reservation
```

**Notifications**:
```javascript
GET  /notifications                          // Get all notifications
GET  /notifications/unread-count             // Get unread count
PUT  /notifications/{id}/read                // Mark as read
PUT  /notifications/read-all                 // Mark all as read
```

**Landlord Onboarding**:
```javascript
POST /landlord-requests                      // Submit join request
POST /landlord-requests/verify               // Verify email
POST /landlord-requests/verify-and-activate  // Verify & activate
GET  /landlord-requests/my                   // Get my assigned requests (agent)
GET  /landlord-requests                      // Get all requests (admin)
```

---

## 14. Utility Functions

### Currency Formatting
**Location**: `utils/currency.js`

```javascript
formatTzs(amount)  // Format number as TZS currency
// Example: formatTzs(50000) → "50,000 TZS"
```

---

## 15. Styling & Design System

### Tailwind CSS
- Utility-first CSS framework
- Responsive breakpoints (sm, md, lg, xl)
- Custom color palette with primary-600 brand color
- Dark mode support with `dark:` prefix

### CSS-in-JS
- Framer Motion for animations
- Lucide React icons for UI

### Common CSS Classes
```css
.glass-card          /* Glassmorphism effect */
.btn-primary         /* Primary action button */
.btn-secondary       /* Secondary action button */
.input-field         /* Standard form input */
```

---

## 16. Key Features Overview

### 1. Email Verification & OTP
- **Registration**: 6-digit OTP sent to email
- **Landlord Activation**: OTP for email verification during onboarding

### 2. Reservation Queue System (FCFS)
- First-in-first-out queue per property
- Auto-calculated queue position
- 24-hour confirmation window
- Auto-expiry if not confirmed
- Promotion to next tenant on cancellation

### 3. Landlord Onboarding Workflow
- Step 1: Submit join request with property claims
- Step 2: Agent assigned & document verification
- Step 3: Email verification with OTP
- Step 4: Account creation & password setup
- Step 5: Access to landlord features

### 4. Role-Based Access Control
- **Tenant**: Browse, reserve, view reservations
- **Landlord**: Create properties, manage reservations, view tenants
- **Agent**: Onboard landlords, manage requests, verify documents
- **Admin**: Full system access, approve properties, manage users

### 5. Notification System
- In-app notifications (database)
- Email notifications (SMTP)
- Types: queue updates, promotions, deadlines, approvals
- Unread count tracking
- Mark as read functionality

### 6. Property Management
- Image upload via Cloudinary
- Property approval workflow
- Availability status tracking
- Advanced search & filtering
- Contact details management

---

## 17. Database Relationships Diagram (Conceptual)

```
User
├── Properties (as landlord)
├── Reservations (as tenant)
├── LandlordRequests (assigned agent)
├── Notifications (recipient)
├── Messages (sender/recipient)
└── SystemLogs

Property
├── PropertyImages
├── Reservations
├── Favorites
└── Bookings (legacy)

Reservation
├── Property
└── Tenant (User)

LandlordRequest
├── AssignedAgent (User)
├── CreatedLandlord (User)
└── LandlordDocuments

Notification
└── Recipient (User)
```

---

## 18. Deployment Considerations

### Environment Variables

**Backend**:
- `DB_URL` - PostgreSQL connection URL
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `SERVER_PORT` - Server port (default: 8080)
- `JWT_SECRET` - JWT secret key (min 32 chars recommended)
- `JWT_EXPIRATION_MS` - Token expiration (default: 86400000 = 24hrs)
- `MAIL_PASSWORD` - Gmail app password for SMTP
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)
- `UPLOAD_DIR` - Directory for uploads
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

**Frontend**:
- `VITE_API_PATH_PREFIX` - Backend API base URL (default: `/api/v1`)

### Build & Run

**Backend**:
```bash
mvn clean package
java -jar target/house-rental-*.jar
```

**Frontend**:
```bash
npm run build
npm run preview  # or use production server
```

---

## 19. Key Issues & Technical Debt

### Known Limitations
1. **OTP Storage**: In-memory only (not persisted across restarts)
   - **Recommendation**: Move to Redis or database

2. **Email Service**: Gmail SMTP (production should use transactional service like SendGrid)
   - **Recommendation**: Integrate Mailgun, SendGrid, or AWS SES

3. **Image Storage**: Cloudinary (costs for high volume)
   - **Recommendation**: Consider AWS S3 for cost optimization

4. **Reservation Expiry**: Database scheduler polling
   - **Recommendation**: Consider pub/sub or message queue (RabbitMQ/Kafka)

5. **Session Expiry**: Fixed 24-hour tokens (no refresh token mechanism)
   - **Recommendation**: Implement refresh token rotation

6. **Legacy Code**: BookingEntity appears unused alongside Reservations
   - **Recommendation**: Remove or consolidate

---

## 20. Testing

### Test Files
**Location**: `backend/src/test/java/com/collincorp/houserental/`

Available test classes:
- `HouseRentalApplicationTests.java`
- `LandlordActivationSecurityTests.java`
- `SuperAdminFeatureTests.java`

**Run Tests**:
```bash
mvn test
```

---

## Conclusion

RentHub is a well-structured full-stack rental platform with:
- ✅ Modern Spring Boot 3 & React 18 stack
- ✅ JWT-based stateless authentication
- ✅ FCFS reservation queue system
- ✅ Email verification & OTP flows
- ✅ Multi-role access control
- ✅ Real-time notifications
- ✅ Landlord onboarding workflow
- ✅ Responsive UI with Tailwind CSS
- ⚠️ Opportunities for scaling (caching, async processing, database optimization)

For further modifications and feature development, refer to specific service/controller implementations above.
