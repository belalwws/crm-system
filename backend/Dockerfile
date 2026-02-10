# Backend Dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

# Install production dependencies only
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Build
FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Production
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system app && adduser --system --ingroup app app

COPY --from=deps /app/node_modules ./node_modules
# Overwrite with generated Prisma client (includes engine binaries for linux-musl)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

RUN mkdir -p /app/uploads && chown -R app:app /app

USER app
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/ || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
