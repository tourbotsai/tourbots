-- 51_scope_tour_matterport_id_unique_per_venue.sql
-- Allow the same Matterport model ID across different venues/accounts.
-- Enforce uniqueness only within a single venue.

BEGIN;

-- Drop legacy global uniqueness (blocked reuse across different venues).
DROP INDEX IF EXISTS public.idx_tours_matterport_tour_id;

-- Keep uniqueness inside each venue.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tours_venue_matterport_tour_id_unique
  ON public.tours(venue_id, matterport_tour_id);

COMMIT;

