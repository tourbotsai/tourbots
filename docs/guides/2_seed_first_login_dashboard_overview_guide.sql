-- 2_seed_first_login_dashboard_overview_guide.sql
-- Seed guide for first login orientation and dashboard walkthrough.
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
  'First Login and Dashboard Overview',
  'first-login-and-dashboard-overview',
  'Understand the app layout, what each dashboard metric means, and what to do first after signing in.',
  $guide$
## What this guide covers

This guide helps you orientate quickly after your first login. You will learn where each core area is, what the dashboard metrics represent, and the first actions to take before moving into setup work.

## Before you start

- You have signed in to your TourBots workspace.
- Your account is linked to a venue.
- You can access the left-hand navigation menu.

## 1) Open the dashboard and confirm your workspace is ready

1. Sign in to the TourBots app.
2. Select **Dashboard** in the left navigation.
3. Confirm the page title shows **Dashboard** and the **Refresh** button appears in the top-right area.

If the dashboard loads without errors, your workspace is ready for setup and monitoring.

## 2) Understand the main navigation areas

Use the sidebar to move between the core product areas:

- **Dashboard**: high-level performance and action priorities
- **Tours**: tour setup, menu, share and embed, and tour analytics
- **Chatbot**: chatbot settings, information, documents, triggers, customisation, playground, and analytics
- **Help Centre**: practical help articles and support contact
- **Settings**: profile, venue settings, billing, and agency settings

This navigation is also available in the mobile sidebar with the same section names.

## 3) Read the dashboard KPI cards correctly

The dashboard overview cards provide a quick operational snapshot:

- **Tour views**
- **Conversations**
- **Visitor messages**
- **Unique domains**
- **Message credits** (used and limit)
- **Available spaces** (used and limit)

Use these values for weekly monitoring and capacity planning.

## 4) Use the trends and domain insights

Below the KPI cards, review:

- **Views and messages trend** chart (last 7 days)
- **Top domain** summary line with views and conversations

Use this section to identify whether engagement is increasing, stable, or dropping.

## 5) Work through priority actions

The **Priority actions** panel highlights practical next actions.

1. Review high-priority items first.
2. Confirm which item affects setup, chatbot quality, or embed performance.
3. Assign an owner and a target completion date internally.

Treat this panel as an operational checklist, not just a summary.

## 6) Recommended first-day sequence

After orientation, complete this order:

1. Open **Tours** and confirm your primary tour setup.
2. Open **Chatbot** and confirm your selected tour is correct.
3. Open **Settings > Billing** and confirm your plan capacity.
4. Return to **Dashboard** and press **Refresh** to validate updates.

## Validation checklist

- You can navigate to all five main sections from the sidebar.
- Dashboard KPI cards load and show values.
- The 7-day chart is visible.
- Priority actions are visible, even if there are none to action immediately.
- You understand where to continue for tours, chatbot setup, and billing.

## Final note

Complete this dashboard orientation before building tours or chatbot logic. It gives your team a shared baseline for performance, ownership, and rollout sequencing.
$guide$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png'
  ]::text[],
  'First Login and Dashboard Overview | TourBots Guides',
  'Learn how to navigate the TourBots app after first login, understand dashboard metrics, and complete the right first actions.',
  array[
    'Account Setup',
    'Dashboard',
    'Navigation',
    'Workspace',
    'Onboarding'
  ]::text[],
  'beginner',
  true,
  now(),
  0,
  5
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
