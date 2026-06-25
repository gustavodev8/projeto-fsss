# Migration Notes

## Recommended rollout

1. Import `schema.mysql.sql`.
2. Import `seed.mysql.sql`.
3. Create the first admin user.
4. Deploy `backend/public` to HostGator.
5. Point the frontend to the PHP API.

## Important behavior changes

- Items are soft deleted.
- Professors are deactivated instead of physically removed.
- Reservations are transaction-based in MySQL.
- Blocked dates are first-class data in MySQL.
- Auth uses PHP sessions, not tokens.

## Why no hard delete

The school needs historical integrity. Hard delete would break reservation history and reports. Soft delete keeps the history while removing the record from normal workflows.
