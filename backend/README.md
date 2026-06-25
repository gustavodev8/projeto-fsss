# FSSS PHP + MySQL Backend

This folder defines the target backend for HostGator shared hosting.

## Design goals

- Standalone PHP API, no Supabase dependency.
- No long-running Node server.
- PHP 8.1+ on shared hosting.
- MySQL 8 with cPanel/phpMyAdmin.
- Session-based auth.
- Transaction-safe reservations.
- Soft delete for items and professors to preserve history.

## Folder layout

```text
backend/
  public/           Web root for Apache
  src/              Application code
  database/         MySQL schema and seed
```

## Core decisions

- Users are stored in `users`.
- Items are stored in `items`.
- Reservations use a parent row plus `reservation_slots`.
- Blocked dates live in `blocked_dates`.
- Time slots are normalized in `time_slots`.
- Reservation conflicts are resolved inside a MySQL transaction.
- Professor deletion is implemented as deactivation.
- Item deletion is implemented as soft delete.

## API contract

Responses are JSON and map closely to the current frontend models.

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Items

- `GET /api/items`
- `GET /api/items/{id}`
- `POST /api/admin/items`
- `PUT /api/admin/items/{id}`
- `DELETE /api/admin/items/{id}`
- `POST /api/admin/items/{id}/force-delete`

### Reservations

- `GET /api/reservations`
- `POST /api/reservations`
- `POST /api/reservations/{id}/cancel`
- `POST /api/reservations/groups/{groupId}/cancel`

### Admin

- `GET /api/admin/professors`
- `POST /api/admin/professors`
- `PUT /api/admin/professors/{id}`
- `DELETE /api/admin/professors/{id}`
- `GET /api/admin/blocked-dates`
- `POST /api/admin/blocked-dates`
- `DELETE /api/admin/blocked-dates/{id}`

## Deployment notes

1. Put `backend/public` on the web root or inside `/api`.
2. Copy `backend/.env.example` to `backend/.env`.
3. Configure MySQL credentials.
4. Import `backend/database/schema.mysql.sql`.
5. Import `backend/database/seed.mysql.sql`.
6. Verify the seeded admin and demo professors are present.

Generate a password hash from the command line if you want to replace the demo credentials:

```bash
php -r "echo password_hash('your-password', PASSWORD_DEFAULT), PHP_EOL;"
```

## Why this architecture

This keeps the frontend thin, the backend portable, and the database logic centralized in MySQL where the shared host can support it.
