#!/bin/sh
set -e

echo "🚀 Starting application startup..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  WARNING: DATABASE_URL is not set. Skipping migrations."
else
  # Extract and display database host (for debugging, without exposing credentials)
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p' || echo "unknown")
  echo "📦 Running database migrations..."
  echo "🔗 Connecting to database host: $DB_HOST"

  # Function to test database connection with retry
  test_db_connection() {
    local max_attempts=10
    local attempt=1
    local delay=2

    while [ $attempt -le $max_attempts ]; do
      echo "🔄 Attempting to connect to database (attempt $attempt/$max_attempts)..."

      if node -e "
        const { Pool } = require('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          connectionTimeoutMillis: 5000,
          query_timeout: 5000
        });
        pool.query('SELECT 1 as test').then(() => {
          console.log('✅ Database connection successful');
          pool.end();
          process.exit(0);
        }).catch((err) => {
          console.error('❌ Connection failed:', err.message);
          pool.end();
          process.exit(1);
        });
      " 2>&1; then
        echo "✅ Database connection established"
        return 0
      else
        if [ $attempt -lt $max_attempts ]; then
          echo "⏳ Waiting ${delay}s before retry..."
          sleep $delay
          attempt=$((attempt + 1))
          delay=$((delay * 2))  # Exponential backoff
        else
          echo "❌ Failed to connect to database after $max_attempts attempts"
          echo "💡 Troubleshooting tips:"
          echo "   - Verify DATABASE_URL is correct"
          echo "   - Check if database host '$DB_HOST' is reachable"
          echo "   - Ensure database service is running"
          echo "   - Check network connectivity and DNS resolution"
          return 1
        fi
      fi
    done
  }

  # Test connection before proceeding
  if ! test_db_connection; then
    echo "❌ Cannot proceed without database connection. Exiting."
    exit 1
  fi

  # Setup migration tables if they don't exist
  echo "Setting up migration tables..."
  if ! node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000
    });
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
      console.log('✅ Migration tables ready');
      pool.end();
      process.exit(0);
    }).catch((err) => {
      console.error('❌ Error setting up migration tables:', err.message);
      console.error('   Error code:', err.code);
      console.error('   Error details:', err.detail || 'N/A');
      pool.end();
      process.exit(1);
    });
  "; then
    echo "❌ Failed to setup migration tables"
    exit 1
  fi

  # Run migrations
  echo "Running migrations..."
  cd /app
  if ! pnpm kysely migrate:latest --cwd ./database; then
    echo "❌ Migration failed"
    exit 1
  fi

  echo "✅ Migrations completed successfully"

  # Run seeds
  echo "🌱 Running database seeds..."
  if ! pnpm kysely seed:run --cwd ./database; then
    echo "⚠️  Warning: Seed failed, but continuing..."
    # Seeds are often idempotent or optional, so we don't fail the startup
  else
    echo "✅ Seeds completed successfully"
  fi
fi

# Start the application
echo "🎯 Starting NestJS application..."
cd /app/apps/backend
exec node dist/src/main

