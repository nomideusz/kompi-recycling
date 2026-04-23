-- One-time backfill of `takeback_type` for rows seeded before the column existed.
-- Run after `pnpm db:push` has added the column (default = 'municipal').
--
--   turso db shell <db-name> < drizzle/backfill_takeback_type.sql
--
-- Re-running is safe: each UPDATE is fully determined by the row's `source`
-- (and by the primary category for the mobile-event override), so repeat runs
-- converge on the same state.

-- PSZOK municipal recycling centres (Tier 1: Google Places PSZOK keyword).
UPDATE recycling_points
   SET takeback_type = 'municipal'
 WHERE source = 'google-places';

-- OSM amenity=recycling — overwhelmingly municipal centres (Tier 3).
UPDATE recycling_points
   SET takeback_type = 'municipal'
 WHERE source = 'openstreetmap';

-- Retail electronics chains via Places (Tier 2: Media Markt, RTV Euro AGD,
-- Lidl). EU 1:1 take-back: large appliances require buying a replacement.
UPDATE recycling_points
   SET takeback_type = 'purchase_required'
 WHERE source LIKE 'retail-%';

-- OSM-tagged retail take-back (Tier 4). Mixed: electronics chains and mobile
-- operators take in WEEE or small electronics under 1:1 take-back; DIY,
-- furniture, and grocery chains accept only batteries/lamps in free bins.
UPDATE recycling_points
   SET takeback_type = 'purchase_required'
 WHERE source LIKE 'osm-retail-%'
   AND EXISTS (
     SELECT 1 FROM json_each(categories_json)
      WHERE value IN ('weee', 'small')
   );

UPDATE recycling_points
   SET takeback_type = 'free_dropbox'
 WHERE source LIKE 'osm-retail-%'
   AND NOT EXISTS (
     SELECT 1 FROM json_each(categories_json)
      WHERE value IN ('weee', 'small')
   );

-- Hand-curated independent electrowaste collectors (Tier 2.5).
-- Small businesses that accept small/large appliances without purchase.
UPDATE recycling_points
   SET takeback_type = 'free_dropbox'
 WHERE source LIKE 'specialist-%';

-- ElektroEko ZSEE compliance-org drop-boxes (Tier 5). Small items, no purchase.
UPDATE recycling_points
   SET takeback_type = 'free_dropbox'
 WHERE source = 'elektroeko';

-- Override: any row whose primary category is 'mobile' is a scheduled mobile
-- collection event regardless of source.
UPDATE recycling_points
   SET takeback_type = 'mobile_event'
 WHERE json_extract(categories_json, '$[0]') = 'mobile';
