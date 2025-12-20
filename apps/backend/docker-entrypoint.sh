#!/bin/sh
set -e

echo "🚀 Starting application startup..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  WARNING: DATABASE_URL is not set. Skipping migrations."
else
  echo "📦 Running database migrations..."
  
  # Setup migration tables if they don't exist
  echo "Setting up migration tables..."
  node -e "
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.query(\`
      CREATE TABLE IF NOT EXISTS kysely_migration (
        name VARCHAR(255) NOT NULL,
        timestamp VARCHAR(255) NOT NULL,
        PRIMARY KEY (name)
      );
      CREATE TABLE IF NOT EXISTS kysely_migration_lock (
        id VARCHAR(255) NOT NULL,
        is_locked BOOLEAN NOT NULL DEFAULT FALSE,
        PRIMARY KEY (id)
      );
    \`).then(() => {
      console.log('Migration tables ready');
      pool.end();
    }).catch((err) => {
      console.error('Error setting up migration tables:', err.message);
      pool.end();
      process.exit(1);
    });
  " || {
    echo "❌ Failed to setup migration tables"
    exit 1
  }
  
  # Run migrations
  echo "Running migrations..."
  cd /app/database
  pnpm kysely migrate:latest || {
    echo "❌ Migration failed"
    exit 1
  }
  
  echo "✅ Migrations completed successfully"
fi

# Start the application
echo "🎯 Starting NestJS application..."
cd /app/apps/backend
exec node dist/src/main

