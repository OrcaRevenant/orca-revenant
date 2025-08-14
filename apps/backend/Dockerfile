FROM node:20-alpine AS base
WORKDIR /app

# Enable pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Copy only manifest files first for better caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/types/package.json packages/types/package.json
COPY apps/backend/package.json apps/backend/package.json

# Install workspace dependencies (frozen for reproducibility)
RUN pnpm install -r --frozen-lockfile

# Copy sources
COPY packages ./packages
COPY apps/backend ./apps/backend

# Build the backend
RUN pnpm --filter ./apps/backend... build

###############################################################################
FROM node:20-alpine AS runner
WORKDIR /app

# Default environment variables (can be overridden at runtime)
ENV NODE_ENV=production \
    PORT=3000 \
    # Database configuration
    DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:54322/postgres \
    # Supabase configuration
    SUPABASE_URL=http://host.docker.internal:54321 \
    # Redis configuration for BullMQ
    REDIS_HOST=host.docker.internal \
    REDIS_PORT=6379

# Note: SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY should be passed at runtime
# using docker run -e or docker-compose environment variables for better security

# Expose Nest app port
EXPOSE 3000

# Copy runtime artifacts
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/backend/dist ./apps/backend/dist
COPY --from=base /app/apps/backend/package.json ./apps/backend/package.json

WORKDIR /app/apps/backend
CMD ["node", "dist/main.js"]


