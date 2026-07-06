# SessionFlow

A cognitive continuity engine and conversational AI assistant built with LangGraph.js and TypeScript. SessionFlow implements a dual-memory architecture to manage short-term active sprint context alongside an autonomous, append-only long-term semantic store.

## Architecture & Principles

The codebase adheres to SOLID principles and Domain-Driven Design (DDD), ensuring strict separation of concerns and a DRY (Don't Repeat Yourself) implementation:

- **Agent Layer (`src/agent/`):** Encapsulates all LangGraph workflows, state reducers, and LLM nodes. It remains entirely agnostic to the underlying persistence implementation.
- **Data Access Layer (`src/db/`):** Handles the Singleton database connections and schema management. It serves as the bridge for both the LangGraph checkpointer and the custom semantic memory store.
- **Core Configuration (`src/core/`):** Establishes a single source of truth for environment variables and system-wide utilities.

## Directory Structure

```text
src/
├── core/                  # System-wide utilities and config
│   ├── config.ts          # Single source of truth for env variables
│   └── logger.ts          # Standardized logging infrastructure
├── db/                    # Data Access Layer (Persistence)
│   ├── sqlite.ts          # Database connection pool/client
│   └── semantic-store.ts  # Append-only LTM (Long-Term Memory) manager
├── agent/                 # LangGraph Cognitive Architecture
│   ├── graph.ts           # StateGraph compilation and wiring
│   ├── state.ts           # Type-safe state annotations
│   ├── schemas.ts         # Zod schemas for structured LLM outputs
│   └── nodes/             # Isolated graph execution nodes
│       ├── chat.ts        # Conversational interface
│       └── extractor.ts   # Background semantic classification
├── types/                 # Global TypeScript interfaces
│   └── index.ts
└── index.ts               # CLI Entry point and execution loop

```

## To be Merged
```text
src/
├── core/
│   ├── config.ts          # Single source of truth for all Env Vars (Fixes the ECONNREFUSED)
│   └── prompts.ts         # Centralized prompt templates (No more hardcoded strings in nodes)
├── db/
│   └── supabase.ts        # The initialized pg Pool instance using config.ts
├── agent/
│   ├── sql-graph.ts       # The specific Sub-Graph for Text-to-SQL routing
│   ├── state.ts           # SqlAgentState with the strictly typed retry counter
│   └── nodes/
│       ├── 1-discovery.ts # Fetches schema dynamically from information_schema
│       ├── 2-generator.ts # LLM writes SQL using prompts.ts
│       ├── 3-validator.ts # PROGRAMMATIC TypeScript validator (Regex/AST parsing, NO LLM)
│       ├── 4-executor.ts  # Runs the query against db/supabase.ts
│       └── 5-synthesizer.ts # Formats the final answer
```

## Getting Started

### Prerequisites

- Node.js (v22+ recommended)
- Docker Engine / Docker Desktop (for local persistence)
- A `.env` file at the project root containing your required credentials (e.g., `GOOGLE_API_KEY` and `DATABASE_URL`).

### Infrastructure Setup

SessionFlow requires a PostgreSQL instance for both LangGraph checkpointing and long-term semantic memory. Provision the local database container in detached mode:

```bash
docker compose up -d
```

### Execution (Development)

Once the database is healthy and accepting connections, run the interactive terminal interface natively using TypeScript:

```bash
npx tsx src/index.ts

```

### Build Tools

If compiling the project to native ECMAScript Modules (ESM) for production deployment, you must resolve import extensions. Run the following codemod prior to your build step:

```bash
npx codemod-add-import-extensions --tsconfig tsconfig.json

```

### Run Docker

```bash
docker exec -it sessionflow_db psql -U username -d sessionflow
```