-- Compound B-tree indexes for sort fields
-- (support both ORDER BY sort_field and ORDER BY sort_field, id used in infinite scroll)
CREATE INDEX IF NOT EXISTS "Product_createdAt_id_idx" ON "Product" ("createdAt", id);
CREATE INDEX IF NOT EXISTS "Product_price_id_idx"     ON "Product" (price, id);
CREATE INDEX IF NOT EXISTS "Product_name_id_idx"      ON "Product" (name, id);

-- Single B-tree index for brand filter (WHERE brand IN (...))
CREATE INDEX IF NOT EXISTS "Product_brand_idx"        ON "Product" (brand);

-- Speeds collection product lookups and joins from ProductCollection to Product
CREATE INDEX IF NOT EXISTS "ProductCollection_collectionId_productId_idx"
  ON "ProductCollection" ("collectionId", "productId");

-- Speeds filtered product lists using default newest sorting
CREATE INDEX IF NOT EXISTS "Product_categoryId_createdAt_id_idx"
  ON "Product" ("categoryId", "createdAt", id);

CREATE INDEX IF NOT EXISTS "Product_brand_createdAt_id_idx"
  ON "Product" (brand, "createdAt", id);

CREATE INDEX IF NOT EXISTS "Product_categoryId_brand_createdAt_id_idx"
  ON "Product" ("categoryId", brand, "createdAt", id);
