---
name: postgres-patterns
description: >-
  PostgreSQL patterns for SQL, migrations, schema design, indexing, RLS, and
  query/ops diagnostics. Use when writing or reviewing Postgres SQL or migrations,
  designing schemas, troubleshooting slow queries, or implementing Row Level Security.
  Supabase-leaning Postgres practice.
paths:
  - "**/*.sql"
  - "**/migrations/**"
---

# PostgreSQL Patterns

Postgres reference oriented toward Supabase practice.

### Index Cheat Sheet

| Query Pattern | Index Type | Example |
|--------------|------------|---------|
| `WHERE col = value` | B-tree (default) | `CREATE INDEX idx ON t (col)` |
| `WHERE col > value` | B-tree | `CREATE INDEX idx ON t (col)` |
| `WHERE a = x AND b > y` | Composite | `CREATE INDEX idx ON t (a, b)` |
| `WHERE jsonb @> '{}'` | GIN | `CREATE INDEX idx ON t USING gin (col)` |
| `WHERE tsv @@ query` | GIN | `CREATE INDEX idx ON t USING gin (col)` |
| Time-series ranges (correlated insert order) | BRIN | `CREATE INDEX idx ON t USING brin (col)` |

On live tables, use `CREATE INDEX CONCURRENTLY`. Plain `CREATE INDEX` blocks writes. `CONCURRENTLY` cannot run inside a transaction block; a failed build leaves an `INVALID` index to drop and retry.

### Data Type Quick Reference

| Use Case | Correct Type | Avoid |
|----------|-------------|-------|
| Sequential IDs | `bigint` (or `bigint generated ... as identity`) | `int` when range may overflow |
| Distributed IDs | `uuid` with UUIDv7 (`uuidv7()` on PG 18+) | random UUIDv4 as PK (index churn) |
| Strings | `text` | arbitrary `varchar(255)` |
| Timestamps | `timestamptz` | `timestamp` |
| Money | `numeric` with domain/currency precision and scale | `float`; do not default to `(10,2)` |
| Flags | `boolean` | `varchar`, `int` |

`numeric(p,s)` silently rounds excess fractional digits and limits integer digits to `p - s`. Choose `p`/`s` from the currency or domain (e.g. `(19,4)`), or use unconstrained `numeric` when scale is not fixed.

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
-- ENABLE is required; CREATE POLICY alone does nothing
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Wrap auth helpers in SELECT; scope role; index the policy column
CREATE INDEX idx_orders_user_id ON orders (user_id);

CREATE POLICY orders_owner ON orders
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
```

Also filter on the client (e.g. `.eq('user_id', ...)`) so the planner can use the index before RLS. That filter is for performance only; RLS is the security boundary. Test as `authenticated`, not an owner or `service_role` that bypasses RLS. Raw SQL / SQL-editor tables on Supabase do not auto-enable RLS (Table Editor does).

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
-- FKs lacking a usable index: full conkey as a prefix of valid, non-partial key cols
WITH fks AS (
  SELECT conname, conrelid, conkey::smallint[] AS conkey
  FROM pg_constraint
  WHERE contype = 'f'
), indexes AS (
  SELECT indrelid, indkey::smallint[] AS indkey, indnkeyatts
  FROM pg_index
  WHERE indisvalid AND indpred IS NULL
)
SELECT f.conrelid::regclass AS table_name, f.conname AS fk,
       (SELECT array_agg(a.attname ORDER BY u.ord)
        FROM unnest(f.conkey) WITH ORDINALITY AS u(attnum, ord)
        JOIN pg_attribute a ON a.attrelid = f.conrelid AND a.attnum = u.attnum
       ) AS columns
FROM fks f
WHERE NOT EXISTS (
  SELECT 1 FROM indexes i
  WHERE i.indrelid = f.conrelid
    AND cardinality(f.conkey) <= i.indnkeyatts
    AND f.conkey = i.indkey[0:cardinality(f.conkey) - 1]
);

-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- Dead-tuple / vacuum-pressure screen (not physical bloat)
SELECT relname, n_dead_tup, last_vacuum, last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
-- Confirm candidates with pgstattuple / pgstattuple_approx
```

### Configuration Template (self-hosted)

Example self-managed settings; tune for RAM and workload. On Supabase managed Postgres you usually lack superuser/`ALTER SYSTEM`; use the dashboard, CLI, or Management API. PG 15+ revokes `CREATE` on `public` for new clusters only (not upgraded or restored ones).

```sql
-- Restart-required (pg_reload_conf will NOT apply these):
ALTER SYSTEM SET max_connections = 100;
-- Also set in postgresql.conf, then restart:
--   shared_preload_libraries = 'pg_stat_statements'

-- Reloadable:
ALTER SYSTEM SET work_mem = '8MB';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '30s';
-- Prefer role/database/session scope, not cluster-wide ALTER SYSTEM:
--   ALTER ROLE app SET statement_timeout = '30s';

SELECT pg_reload_conf();
SELECT name, setting, pending_restart
FROM pg_settings
WHERE name IN ('max_connections', 'shared_preload_libraries');
-- Restart when pending_restart is true, then:
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Security: revoke CREATE only (not USAGE) if hardening an older DB
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

## Related

- Use your project's API and service-layer docs when a change spans SQL and application code.

---

