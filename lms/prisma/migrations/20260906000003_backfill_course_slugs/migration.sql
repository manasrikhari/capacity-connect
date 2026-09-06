-- Phase 2.3: give every existing course a public handle.
--
-- `Batch.slug` was added by 20260906000002 but never populated, so courses
-- created before the catalogue existed fell back to their cuid in the URL.
-- This mirrors lib/slug.ts `slugify` (lowercase, non-alphanumerics → hyphen,
-- trimmed, capped at 80) and `uniqueSlug` (suffix -2, -3 … on collision).
--
-- Safe to run once: it only touches rows where slug IS NULL, and at this point
-- no row has a slug, so the row_number suffixing cannot collide with an
-- existing handle.

WITH base AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        left(trim(BOTH '-' FROM regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), 80),
        ''
      ),
      'course'
    ) AS slug_base
  FROM "Batch"
  WHERE slug IS NULL
),
numbered AS (
  SELECT
    id,
    slug_base,
    ROW_NUMBER() OVER (PARTITION BY slug_base ORDER BY id) AS rn
  FROM base
)
UPDATE "Batch" b
SET slug = CASE WHEN n.rn = 1 THEN n.slug_base ELSE n.slug_base || '-' || n.rn END
FROM numbered n
WHERE b.id = n.id;
