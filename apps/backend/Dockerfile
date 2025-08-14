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

ENV NODE_ENV=production \
    # Use host.docker.internal so the container can reach services running on your host
    PORT=3000 \
    DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:54322/postgres \
    SUPABASE_URL=http://host.docker.internal:54321 \
    SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0 \
    SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Expose Nest app port
EXPOSE 3000

# Copy runtime artifacts
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/backend/dist ./apps/backend/dist
COPY --from=base /app/apps/backend/package.json ./apps/backend/package.json

WORKDIR /app/apps/backend
CMD ["node", "dist/main.js"]


