# Base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies including devDependencies
# Use NODE_ENV=development to ensure devDependencies are installed
# Override any external NODE_ENV that might be set (e.g., by CI/CD)
RUN NODE_ENV=development npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js application
# Use NODE_ENV=development during build so TypeScript, Tailwind, etc. are available
RUN NODE_ENV=development npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Only set production in the final runtime image
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
