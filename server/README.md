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
   - `MAILTRAP_USER` / `MAILTRAP_PASS` — from [Mailtrap](https://mailtrap.io) inbox SMTP credentials
   - `MAIL_TO_INBOX` — any address; Mailtrap captures all mail in the sandbox
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
| POST | `/api/auth/send-otp` | Body: `{ "identifier": "email or 10-digit mobile" }` — 6-digit OTP, 5-minute TTL, emailed via Mailtrap |
| POST | `/api/auth/verify-otp` | Body: `{ "identifier", "otp" }` — returns JWT, deletes OTP |
| POST | `/api/auth/login` | Body: `{ "identifier", "password", "role": "user" \| "admin" }` |
| POST | `/api/auth/register` | Body: `{ "identifier", "password", "role"? }` — password min 8 chars |

## Notes

- **Password login (development):** While `NODE_ENV` is not `production`, any password is accepted for `/api/auth/login` (missing users are auto-created). Set `DEV_LOGIN_ANY_PASSWORD=false` to force real bcrypt checks, or rely on production `NODE_ENV` where bypass is off unless `DEV_LOGIN_ANY_PASSWORD=true`.
- OTP messages are sent to `MAIL_TO_INBOX` in Mailtrap; without Mailtrap credentials the OTP is **printed in the server console**.
- First successful OTP verification **creates** an in-memory `user` if none exists (no password).
- **Admin Login** uses `role: "admin"`; configure `ADMIN_EMAIL` + `ADMIN_PASSWORD` in `.env` or register an admin via `/api/auth/register` with `"role":"admin"` (until restart).
