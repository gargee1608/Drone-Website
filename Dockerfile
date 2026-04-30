# Base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy frontend package files
COPY package.json package-lock.json* ./

# Install ALL dependencies including devDependencies
# Use NODE_ENV=development to ensure devDependencies are installed
# Override any external NODE_ENV that might be set (e.g., by CI/CD)
RUN NODE_ENV=development npm ci

# Install backend dependencies
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js application
# NODE_ENV must be production during build — Next.js expects this and React's
# static generation breaks with NODE_ENV=development (useContext returns null).
# DevDependencies are already installed from the deps stage.
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Only set production in the final runtime image
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy Next.js standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Express backend source and production deps
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend/server.js ./backend/server.js
COPY backend/db.js ./backend/db.js
COPY backend/email.js ./backend/email.js
COPY backend/routes ./backend/routes
COPY backend/scripts ./backend/scripts

# Startup script (runs backend + frontend)
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Express backend is reachable at localhost inside the container
ENV BACKEND_URL=http://127.0.0.1:4000

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./start.sh"]
