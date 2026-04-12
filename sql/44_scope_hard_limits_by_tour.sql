-- 44_scope_hard_limits_by_tour.sql
-- Clean, simple tour-scoped hard-limit migration.
-- Safety: aborts if existing usage rows are present.

BEGIN;

ALTER TABLE public.chatbot_hard_limit_usage
  ADD COLUMN IF NOT EXISTS tour_id uuid;

DO $$
DECLARE
  usage_row_count bigint;
BEGIN
  SELECT COUNT(*) INTO usage_row_count
  FROM public.chatbot_hard_limit_usage;

  IF usage_row_count > 0 THEN
    RAISE EXCEPTION
      '44_scope_hard_limits_by_tour.sql aborted: chatbot_hard_limit_usage has % existing rows. Backfill or clear explicitly before rerunning.',
      usage_row_count;
  END IF;
END $$;

-- Safe no-op when table is already empty.
TRUNCATE TABLE public.chatbot_hard_limit_usage;

ALTER TABLE public.chatbot_hard_limit_usage
  ALTER COLUMN tour_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_chatbot_hard_limit_usage_tour'
  ) THEN
    ALTER TABLE public.chatbot_hard_limit_usage
      ADD CONSTRAINT fk_chatbot_hard_limit_usage_tour
      FOREIGN KEY (tour_id) REFERENCES public.tours(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DROP INDEX IF EXISTS idx_chatbot_hard_limit_usage_venue_type_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chatbot_hard_limit_usage_venue_type_tour_unique
  ON public.chatbot_hard_limit_usage(venue_id, chatbot_type, tour_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_hard_limit_usage_tour_id
  ON public.chatbot_hard_limit_usage(tour_id);

-- RPC used by hard-limit-service.ts
DROP FUNCTION IF EXISTS public.increment_hard_limit_usage(uuid, text);

CREATE OR REPLACE FUNCTION public.increment_hard_limit_usage(
  p_venue_id uuid,
  p_chatbot_type text DEFAULT 'tour',
  p_tour_id uuid DEFAULT NULL
)
RETURNS TABLE (
  daily_used integer,
  weekly_used integer,
  monthly_used integer,
  yearly_used integer,
  daily_limit integer,
  weekly_limit integer,
  monthly_limit integer,
  yearly_limit integer,
  limits_enabled boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_now timestamptz := now();
  v_selected_tour_id uuid := p_tour_id;
  v_limits_enabled boolean := false;
  v_daily_limit integer := 1000;
  v_weekly_limit integer := 3000;
  v_monthly_limit integer := 10000;
  v_yearly_limit integer := 100000;
  v_usage public.chatbot_hard_limit_usage%rowtype;
BEGIN
  IF p_chatbot_type <> 'tour' THEN
    RAISE EXCEPTION 'chatbot_type must be tour';
  END IF;

  -- If caller did not provide a tour, use primary/first active tour.
  IF v_selected_tour_id IS NULL THEN
    SELECT t.id
    INTO v_selected_tour_id
    FROM public.tours t
    WHERE t.venue_id = p_venue_id
      AND t.is_active = true
    ORDER BY
      CASE WHEN t.tour_type = 'primary' THEN 0 ELSE 1 END,
      t.display_order ASC,
      t.created_at ASC
    LIMIT 1;
  END IF;

  IF v_selected_tour_id IS NULL THEN
    RAISE EXCEPTION 'No active tour found for venue %', p_venue_id;
  END IF;

  -- Resolve limits for the selected tour config.
  SELECT
    COALESCE(c.hard_limits_enabled, false),
    COALESCE(c.hard_limit_daily_messages, 1000),
    COALESCE(c.hard_limit_weekly_messages, 3000),
    COALESCE(c.hard_limit_monthly_messages, 10000),
    COALESCE(c.hard_limit_yearly_messages, 100000)
  INTO
    v_limits_enabled,
    v_daily_limit,
    v_weekly_limit,
    v_monthly_limit,
    v_yearly_limit
  FROM public.chatbot_configs c
  WHERE c.venue_id = p_venue_id
    AND c.chatbot_type = p_chatbot_type
    AND c.tour_id = v_selected_tour_id
  LIMIT 1;

  INSERT INTO public.chatbot_hard_limit_usage (
    venue_id,
    chatbot_type,
    tour_id,
    daily_messages_used,
    weekly_messages_used,
    monthly_messages_used,
    yearly_messages_used,
    daily_reset_at,
    weekly_reset_at,
    monthly_reset_at,
    yearly_reset_at,
    last_message_at
  )
  VALUES (
    p_venue_id,
    p_chatbot_type,
    v_selected_tour_id,
    0,
    0,
    0,
    0,
    date_trunc('day', v_now) + interval '1 day',
    date_trunc('week', v_now) + interval '1 week',
    date_trunc('month', v_now) + interval '1 month',
    date_trunc('year', v_now) + interval '1 year',
    v_now
  )
  ON CONFLICT (venue_id, chatbot_type, tour_id) DO NOTHING;

  UPDATE public.chatbot_hard_limit_usage u
  SET
    daily_messages_used = CASE WHEN v_now >= u.daily_reset_at THEN 1 ELSE u.daily_messages_used + 1 END,
    weekly_messages_used = CASE WHEN v_now >= u.weekly_reset_at THEN 1 ELSE u.weekly_messages_used + 1 END,
    monthly_messages_used = CASE WHEN v_now >= u.monthly_reset_at THEN 1 ELSE u.monthly_messages_used + 1 END,
    yearly_messages_used = CASE WHEN v_now >= u.yearly_reset_at THEN 1 ELSE u.yearly_messages_used + 1 END,
    daily_reset_at = CASE WHEN v_now >= u.daily_reset_at THEN date_trunc('day', v_now) + interval '1 day' ELSE u.daily_reset_at END,
    weekly_reset_at = CASE WHEN v_now >= u.weekly_reset_at THEN date_trunc('week', v_now) + interval '1 week' ELSE u.weekly_reset_at END,
    monthly_reset_at = CASE WHEN v_now >= u.monthly_reset_at THEN date_trunc('month', v_now) + interval '1 month' ELSE u.monthly_reset_at END,
    yearly_reset_at = CASE WHEN v_now >= u.yearly_reset_at THEN date_trunc('year', v_now) + interval '1 year' ELSE u.yearly_reset_at END,
    last_message_at = v_now,
    updated_at = v_now
  WHERE u.venue_id = p_venue_id
    AND u.chatbot_type = p_chatbot_type
    AND u.tour_id = v_selected_tour_id
  RETURNING * INTO v_usage;

  RETURN QUERY
  SELECT
    v_usage.daily_messages_used,
    v_usage.weekly_messages_used,
    v_usage.monthly_messages_used,
    v_usage.yearly_messages_used,
    v_daily_limit,
    v_weekly_limit,
    v_monthly_limit,
    v_yearly_limit,
    v_limits_enabled;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_hard_limit_usage(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_hard_limit_usage(uuid, text, uuid)
  TO service_role;

COMMIT;
