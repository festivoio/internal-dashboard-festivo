# Festivo Admin Dashboard (Frontend)

React + Vite admin dashboard for Events, Payouts, and Fee Policy administration.

## Environment

Create a `.env` file:

```bash
VITE_API_URL=https://test-api.festivo.io
# Optional: comma-separated profile/session endpoints used by admin guard
VITE_AUTH_PROFILE_ENDPOINTS=/api/auth/profile,/api/auth/me
# Optional: logout endpoint used when clicking Logout
VITE_AUTH_LOGOUT_ENDPOINT=/api/auth/logout
```

## Auth model

- Admin login page submits to `POST /api/auth/admin/login` with:
  - `email`
  - `password`
- Login response shape:
  - `{ success, data: { user, token } }`
  - backend also sets `auth_token` HttpOnly cookie
- Admin API auth is session-based with an HttpOnly cookie (`auth_token`).
- Frontend requests always send credentials (`credentials: 'include'`).
- Bearer token fallback is supported when a token exists in in-memory auth state (and legacy local-storage token keys if present).
- Admin access is allowed only if user satisfies:
  - `user.userType === "ADMIN"`, or
  - `user.isAdmin === true`

## CORS and cross-site cookie requirements

Backend must be configured to allow credentialed requests:

- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Origin` must be a specific origin (not `*`)
- Cookie must be set with correct cross-site attributes (typically `SameSite=None; Secure` for cross-site HTTPS setups)

## Error handling behavior

- `401` -> treated as missing/expired session and redirected to login.
- `403` -> treated as authenticated but non-admin and shown forbidden screen.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
