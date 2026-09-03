# syntax=docker/dockerfile:1

# NestJS + Prisma. Build context is this directory (worldPortal), not the
# repo root.
FROM node:22-alpine AS base
# Prisma's query engine needs openssl; libc6-compat covers the glibc shims.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM base AS runner
ENV NODE_ENV=production PORT=4000
COPY package.json package-lock.json ./
COPY prisma ./prisma
# Reinstall without devDependencies, then regenerate the client so the engine
# binary matches this image rather than the builder's.
RUN npm ci --omit=dev && npx prisma generate && npm cache clean --force
COPY --from=builder /app/dist ./dist
EXPOSE 4000
# Migrations run on boot so a fresh Dokploy database converges to the schema.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
