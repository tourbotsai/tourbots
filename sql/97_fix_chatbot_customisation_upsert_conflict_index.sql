-- 97_fix_chatbot_customisation_upsert_conflict_index.sql
-- Supabase/PostgREST upserts tour customisations with:
--   ON CONFLICT (venue_id, tour_id, chatbot_type)
-- A partial unique index cannot act as the conflict arbiter unless the same
-- predicate appears in ON CONFLICT, which PostgREST cannot provide.

drop index if exists public.idx_chatbot_customisations_tour_unique;

create unique index idx_chatbot_customisations_tour_unique
  on public.chatbot_customisations (venue_id, tour_id, chatbot_type);
