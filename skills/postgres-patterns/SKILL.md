---
name: postgres-patterns
description: >-
  PostgreSQL database patterns for query optimization, schema design, indexing, and
  security. Use when writing SQL or migrations, designing schemas, troubleshooting slow
  queries, implementing Row Level Security, tuning connection pooling, or reviewing
  database changes. Based on Supabase-leaning Postgres practice.
paths:
  - "**/*.sql"
  - "**/migrations/**"
---

# PostgreSQL Patterns

Quick reference for PostgreSQL best practices. For deeper org-specific database reviews, follow your team's own review workflow alongside this guide.

## When to Activate

- Writing SQL queries or migrations
- Designing database schemas
- Troubleshooting slow queries
- Implementing Row Level Security
- Setting up connection pooling

## Quick Reference

### Index Cheat Sheet

| Query Pattern | Index Type | Example |
|--------------|------------|---------|
| `WHERE col = value` | B-tree (default) | `CREATE INDEX idx ON t (col)` |
| `WHERE col > value` | B-tree | `CREATE INDEX idx ON t (col)` |
| `WHERE a = x AND b > y` | Composite | `CREATE INDEX idx ON t (a, b)` |
| `WHERE jsonb @> '{}'` | GIN | `CREATE INDEX idx ON t USING gin (col)` |
| `WHERE tsv @@ query` | GIN | `CREATE INDEX idx ON t USING gin (col)` |
| Time-series ranges (correlated insert order) | BRIN | `CREATE INDEX idx ON t USING brin (col)` |

### Data Type Quick Reference

| Use Case | Correct Type | Avoid |
|----------|-------------|-------|
| Sequential IDs | `bigint` (or `bigint generated … as identity`) | `int` when range may overflow |
| Distributed IDs | `uuid` with **UUIDv7** (`uuidv7()` on PG 18+) | random **UUIDv4** as PK (index churn) |
| Strings | `text` | arbitrary `varchar(255)` |
| Timestamps | `timestamptz` | `timestamp` |
| Money | `numeric(10,2)` | `float` |
| Flags | `boolean` | `varchar`, `int` |

### Common Patterns

**Composite Index Order:**
```sql
-- Equality columns first, then range columns
CREATE INDEX idx ON orders (status, created_at);
-- Works for: WHERE status = 'pending' AND created_at > '2024-01-01'
```

**Covering Index:**
```sql
CREATE INDEX idx ON users (email) INCLUDE (name, created_at);
-- Avoids table lookup for SELECT email, name, created_at
```

**Partial Index:**
```sql
CREATE INDEX idx ON users (email) WHERE deleted_at IS NULL;
-- Smaller index, only includes active users
```

**RLS Policy (Optimized):**
```sql
-- Wrap auth helpers in SELECT; scope role; index the policy column
CREATE INDEX idx_orders_user_id ON orders (user_id);

CREATE POLICY orders_owner ON orders
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
```

Also filter on the client (e.g. `.eq('user_id', …)`) so the planner can use the index before RLS.

**UPSERT:**
```sql
INSERT INTO settings (user_id, key, value)
VALUES (123, 'theme', 'dark')
ON CONFLICT (user_id, key)
DO UPDATE SET value = EXCLUDED.value;
```

**Cursor Pagination:**
```sql
SELECT * FROM products WHERE id > $last_id ORDER BY id LIMIT 20;
-- Keyset / cursor beats OFFSET for large pages; needs a stable indexed sort key
```

**Queue Processing:**
```sql
UPDATE jobs SET status = 'processing'
WHERE id = (
  SELECT id FROM jobs WHERE status = 'pending'
  ORDER BY created_at LIMIT 1
  FOR UPDATE SKIP LOCKED
) RETURNING *;
```

### Anti-Pattern Detection

```sql
-- Find unindexed foreign keys
SELECT conrelid::regclass, a.attname
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid AND a.attnum = ANY(i.indkey)
  );

-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- Check table bloat
SELECT relname, n_dead_tup, last_vacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

### Configuration Template (self-hosted)

Illustrative **self-managed** knobs — adjust for RAM/workload. On **Supabase managed**
Postgres you typically lack superuser/`ALTER SYSTEM`; use the dashboard, CLI, or
Management API instead. PG 15+ already revokes `CREATE` on `public` for new DBs.

```sql
-- Connection limits (adjust for RAM)
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET work_mem = '8MB';

-- Timeouts
ALTER SYSTEM SET idle_in_transaction_session_timeout = '30s';
ALTER SYSTEM SET statement_timeout = '30s';

-- Monitoring (also requires shared_preload_libraries=pg_stat_statements on self-hosted)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Security: revoke CREATE only (not USAGE) if hardening an older DB
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

SELECT pg_reload_conf();
```

## Related

- Pair with your project's documented API and service-layer conventions when reviewing end-to-end paths that span SQL and application code.
- If you also run ClickHouse or other analytics engines, keep engine-specific guidance in separate docs you maintain for that stack.

---

*Based on Supabase Agent Skills (credit: Supabase team) (MIT License)*
