# AEROLAMINAR Auth API (Express, in-memory)

Users and OTPs are kept **in memory only** (lost when the server restarts). There is **no database**.

## Setup

1. **Install dependencies** (from this folder):

   ```bash
   cd server
   npm install
   ```

2. **Copy environment file:**

   ```bash
   copy .env.example .env
   ```

   Edit `.env`:

   - `JWT_SECRET` — long random string
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — optional; creates an **in-memory admin** on startup for Admin Login
   - `SMTP_USER` / `SMTP_PASS` — Gmail address and [App Password](https://support.google.com/accounts/answer/185833) (2FA required)
   - `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` — optional; defaults to Gmail (`smtp.gmail.com`, `587`, `false`)
   - `MAIL_FROM` — optional sender display name and address (defaults to `SMTP_USER`)
   - `MAIL_TO_INBOX` — optional fallback recipient when OTP is requested by mobile number only
   - `CLIENT_ORIGIN` — optional comma-separated list for production; local dev allows any `localhost` port

3. **Run the API:**

   ```bash
   npm run dev
   ```

   Server defaults to `http://localhost:4000`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/send-otp` | Body: `{ "identifier": "email or 10-digit mobile" }` — 6-digit OTP, 5-minute TTL, emailed via SMTP |
| POST | `/api/auth/verify-otp` | Body: `{ "identifier", "otp" }` — returns JWT, deletes OTP |
| POST | `/api/auth/login` | Body: `{ "identifier", "password", "role": "user" \| "admin" }` |
| POST | `/api/auth/register` | Body: `{ "identifier", "password", "role"? }` — password min 8 chars |

## Notes

- **Password login (development):** While `NODE_ENV` is not `production`, any password is accepted for `/api/auth/login` (missing users are auto-created). Set `DEV_LOGIN_ANY_PASSWORD=false` to force real bcrypt checks, or rely on production `NODE_ENV` where bypass is off unless `DEV_LOGIN_ANY_PASSWORD=true`.
- OTP messages are sent to the user's email when they sign in with email; without SMTP credentials the OTP is **printed in the server console**.
- First successful OTP verification **creates** an in-memory `user` if none exists (no password).
- **Admin Login** uses `role: "admin"`; configure `ADMIN_EMAIL` + `ADMIN_PASSWORD` in `.env` or register an admin via `/api/auth/register` with `"role":"admin"` (until restart).
