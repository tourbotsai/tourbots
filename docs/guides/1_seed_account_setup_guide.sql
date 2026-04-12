-- 1_seed_account_setup_guide.sql
-- Seed first documentation guide for account setup and pricing.
-- Run this after: production/sql/19_guides_initial.sql

insert into public.guides (
  title,
  slug,
  excerpt,
  content,
  cover_image,
  header_image,
  additional_images,
  meta_title,
  meta_description,
  tags,
  difficulty_level,
  is_published,
  published_at,
  view_count,
  reading_time_minutes
)
values (
  'Create Your TourBots Account and Choose the Right Plan',
  'create-account-and-choose-plan',
  'Step-by-step setup for creating an account, understanding Free vs Pro, and planning additional space and message add-ons.',
  $guide$
## What this guide covers

This guide explains exactly how to create a TourBots account, activate your first space, and choose the right commercial setup for your team.

## 1) Create your account

1. Open the TourBots website.
2. Click **Start Free** in the top navigation.
3. Complete account registration and verify your details.
4. Sign in and continue to your workspace.

The Free plan is designed for testing and validation before live rollout.

## 2) Understand Free vs Pro

### Free plan
- One test tour
- AI setup and training tools
- Up to 25 total messages
- No card required to start

Use this to confirm your workflow, content quality, and internal sign-off.

### Pro plan
- First active space included
- 1,000 chatbot messages included
- AI Q&A and guided navigation
- Lead capture and dashboard analytics

Use this when you are ready to run a live production space.

## 3) Upgrade when ready

When your test setup is complete:

1. Go to the pricing section from the main site.
2. Select **Go Pro**.
3. Complete checkout and return to your workspace.

After upgrade, you can publish and operate your first active space.

## 4) Add extra capacity with add-ons

As your account grows, capacity is extended through add-ons:

- **Additional space**: billed per extra active space, per month  
- **Message top-up block**: add extra monthly message capacity  
- **White-label add-on**: available for teams that need an unbranded experience

This model lets you scale account value without changing core workflows.

## 5) Recommended rollout path

1. Start on Free and validate one tour flow.
2. Upgrade to Pro for your first live space.
3. Add extra spaces as your portfolio expands.
4. Add message top-ups when traffic requires it.

## Final note

Keep your first rollout focused and measurable. Once your initial space performs well, scale by adding spaces and capacity in controlled steps.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Create Your TourBots Account and Choose the Right Plan | TourBots Guides',
  'Learn how to create a TourBots account, compare Free vs Pro, and scale with additional space and message add-ons.',
  array[
    'Account Setup',
    'Pricing',
    'Free Plan',
    'Pro Plan',
    'Add-ons',
    'Billing'
  ]::text[],
  'beginner',
  true,
  now(),
  0,
  4
)
on conflict (slug) do update
set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content = excluded.content,
  cover_image = excluded.cover_image,
  header_image = excluded.header_image,
  additional_images = excluded.additional_images,
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  tags = excluded.tags,
  difficulty_level = excluded.difficulty_level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  reading_time_minutes = excluded.reading_time_minutes,
  updated_at = now();
