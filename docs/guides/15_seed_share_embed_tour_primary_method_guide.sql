-- 15_seed_share_embed_tour_primary_method_guide.sql
-- Seed guide for sharing and embedding a tour from the Tours page.
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
  'Share and Embed Your Tour Primary Method',
  'share-and-embed-your-tour-primary-method',
  'Generate production-ready embed code from Tours, configure basic display options, and publish your selected location on external websites.',
  $guide$
## What this guide covers

This guide explains the primary method for sharing and embedding a tour from the Tours page. You will select a location, generate embed code, configure display options, and validate the live result before launch.

## Before you start

- At least one tour location is set up in **Tours**.
- You have access to the target website where embed code will be placed.
- You know which location should be published.

## 1) Select the correct location scope

1. Open **Tours**.
2. Use the location selector in the header.
3. Choose the exact location you want to publish.
4. Open the **Share & Embed** tab.

Embed output is generated from the currently selected location.

## 2) Configure embed options

In **Share and Embed**, set:

- **Width** (for example, `100%`)
- **Height** (for example, `600px`)
- **Show chat widget** (on/off)

These options control how the embedded tour appears in the host page.

## 3) Generate and copy embed code

Two code options are available:

- **Simple IFrame Embed**
- **Advanced Script Embed**

1. Choose the method your website supports.
2. Click **Copy Code** for the chosen format.
3. Keep a record of the exact settings used for deployment.

## 4) Preview before publishing

1. Use **Preview Tour** from the Share panel.
2. Confirm the selected location loads correctly.
3. Confirm chat visibility matches your toggle setting.
4. Verify layout dimensions match expectations.

Do this check before handing code to engineering or CMS teams.

## 5) Publish and validate on target site

1. Paste embed code into the target website page/template.
2. Load the page in production-like conditions.
3. Confirm:
   - Tour loads correctly
   - Chat visibility is correct
   - Responsive behaviour is acceptable
   - Interaction flow is stable

If your site uses strict policies, validate allowed script/iframe behaviour with your web team.

## Common issues

- **No tour available to share**: complete tour setup first.
- **Wrong location embedded**: recheck location selector before copying code.
- **Widget hidden unexpectedly**: verify **Show chat widget** setting and recopy code.
- **Layout clipping**: adjust width/height and retest in target breakpoints.
- **Code copied but old behaviour persists**: clear caches and redeploy template/content.

## Validation checklist

- Correct location selected in Tours before code generation.
- Embed dimensions and chat toggle configured intentionally.
- Correct code format copied for target website.
- Preview passed before deployment.
- Post-publish checks passed on live page.

## Final note

Use the Tours Share tab as the canonical publishing path for production embeds. Always lock location context first, validate with preview, and document final embed settings for repeatable rollout.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'Share and Embed Your Tour Primary Method | TourBots Guides',
  'Learn how to generate, preview, and publish tour embed code from the Tours Share & Embed tab.',
  array[
    'Share and Embed',
    'Tour Setup',
    'Publishing',
    'Website Embed',
    'Operations'
  ]::text[],
  'beginner',
  true,
  now(),
  0,
  6
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
