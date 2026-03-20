-- Enable trigram extension (requires superuser or pg_extension privilege on Neon)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram index on Product name (accelerates ILIKE '%query%' for 3+ char queries)
-- Note: GIN indexes do not index NULL values; if name ever becomes nullable, NULLs are silently excluded
CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx"
  ON "Product" USING GIN (name gin_trgm_ops);

-- GIN trigram index on Product description
-- Note: same NULL caveat as above
CREATE INDEX IF NOT EXISTS "Product_description_trgm_idx"
  ON "Product" USING GIN (description gin_trgm_ops);
