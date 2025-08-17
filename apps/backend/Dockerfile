# Multi-stage build for NestJS backend
FROM node:20-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache dumb-init

# Enable pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

###############################################################################
# Dependencies stage - install all dependencies (including dev dependencies for build)
FROM base AS deps
WORKDIR /app

# Copy only manifest files first for better caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/types/package.json packages/types/package.json
COPY apps/backend/package.json apps/backend/package.json

# Install all workspace dependencies including dev dependencies (needed for build)
RUN pnpm install -r --frozen-lockfile

###############################################################################
# Build stage - build the application
FROM base AS builder
WORKDIR /app

# Copy all dependencies from deps stage (including dev dependencies)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy source files
COPY packages ./packages
COPY apps/backend ./apps/backend
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Build the backend application - let pnpm handle the workspace and build
RUN pnpm --filter backend build

# Verify the build output exists
RUN ls -la /app/apps/backend/dist/src/ && test -f /app/apps/backend/dist/src/main.js

###############################################################################
# Production stage - create the final runtime image
FROM node:20-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Default environment variables (can be overridden at runtime)
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_PATH=/app/node_modules \
    # Database configuration
    DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:54322/postgres \
    # Supabase configuration
    SUPABASE_URL=http://host.docker.internal:54321 \
    # Redis configuration for BullMQ
    REDIS_HOST=host.docker.internal \
    REDIS_PORT=6379

# Note: SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY should be passed at runtime
# using docker run -e or docker-compose environment variables for better security

# Copy runtime dependencies (all dependencies needed for runtime)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy built application
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json

# Set proper ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose Nest app port
EXPOSE 3000

# Set working directory to backend
WORKDIR /app/apps/backend

# Use dumb-init for proper signal handling and run the correct main.js path
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]


