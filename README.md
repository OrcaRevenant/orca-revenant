# Orca Revenant

A modern, scalable platform built with a monorepo architecture using NestJS, Supabase, and Kysely.

## Project Overview

Orca Revenant is organized as a monorepo using pnpm workspaces and Turborepo for efficient dependency management and build processes. The project combines a robust backend with integrated database systems and comprehensive documentation.

## Tech Stack

- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL via Supabase
- **ORM**: Kysely for type-safe SQL query building
- **Documentation**: Docusaurus
- **Package Management**: pnpm
- **Monorepo Management**: Turborepo
- **Job Queue**: BullMQ
- **API Documentation**: Swagger

## Repository Structure

```
orca-revenant/
├── apps/                    # Application packages
│   └── backend/             # NestJS backend application
├── packages/                # Shared packages
│   └── types/               # Shared TypeScript type definitions
├── database/                # Database migrations and seeds
├── doc/                     # Documentation site
├── supabase/                # Supabase configuration
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm 9.0.0 or higher
- Docker (for local database)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd orca-revenant
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.development.local
   # Edit .env.development.local with your configuration
   ```

4. Start Supabase locally:
   ```bash
   pnpm start:supabase
   ```

5. Initialize the database:
   ```bash
   pnpm db:reset
   ```

6. Start the development servers:
   ```bash
   pnpm start:dev
   ```

## Development Workflow

### Running Services

- **All Applications**:
  ```bash
  pnpm start:dev
  ```

- **Backend Only**:
  ```bash
  pnpm app:backend
  ```

- **Documentation Site**:
  ```bash
  pnpm doc:start
  ```

### Database Management

- **Reset Database**:
  ```bash
  pnpm db:reset
  ```

- **Generate Types**:
  ```bash
  pnpm typegen
  ```

- **Dump Database**:
  ```bash
  pnpm db:dump
  ```

- **Restore Database**:
  ```bash
  pnpm db:restore
  ```

### Other Commands

- **Build All Projects**:
  ```bash
  pnpm build
  ```

- **Lint Code**:
  ```bash
  pnpm lint
  ```

- **Format Code**:
  ```bash
  pnpm format
  ```

## Contributing

Please follow the established code style and conventions when contributing to this project. Make sure to run `pnpm lint` and `pnpm format` before committing changes.

## License

This project is licensed under the ISC License - see the package.json file for details. 