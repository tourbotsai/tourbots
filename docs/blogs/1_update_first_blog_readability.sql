-- 2_update_first_blog_readability.sql
-- Refresh the first seeded article content and metadata.
-- Safe to run multiple times.

update public.blogs
set
  title = 'How TourBots Handles Multi-Model Tours and Extra Spaces',
  excerpt = 'Set up your first Matterport space, add multiple models into one tour experience, and scale into additional spaces with the TourBots add-on model.',
  content = $blog$
## Start with one live space, then scale

TourBots is built so you can launch quickly with one space and then expand without changing your whole operating model.

From the **Tour Setup** tab, teams can publish a first Matterport tour in minutes. If no tour is configured yet, the workspace prompts you to upload your first model and go live with AI guidance.

## One tour can contain multiple Matterport models

In TourBots, a single tour is not limited to one model.

Use **Manage Models** to combine multiple Matterport models under one shared tour experience. This means you can keep one embed, one chatbot context, and one visitor journey while still covering multiple physical areas.

Typical examples include:
- Main event hall + breakout spaces
- Front-of-house + accommodation blocks
- Showroom + warehouse + service areas

## AI can switch models based on visitor intent

TourBots supports model switching from both operator controls and AI-driven flow.

When visitors ask about a specific area, the assistant can move them to the relevant model using configured navigation keywords. This keeps the conversation natural and avoids forcing users to restart or open separate links.

## Tour locations and add-on growth

Inside the tour header controls, your team can manage the current tour location and model stack. As your footprint grows, **Add New Tour Location** extends your account with extra spaces.

Commercially, this follows the pricing model already shown across the platform:
- Pro includes your first active space
- Extra active spaces are added as paid add-ons
- Each additional space carries its own message allowance

This keeps expansion straightforward: launch one, prove value, then add spaces as demand grows.

## Why this matters operationally

For venue operators, this creates one consistent visitor experience across multiple areas.  
For agencies, it creates a cleaner delivery model where each client can scale by space instead of rebuilding architecture.

The result is simple: one platform, one workflow, and predictable commercial scaling.
$blog$,
  cover_image = 'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  header_image = 'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Help%20Articles/ChatGPT%20Image%20Mar%2026,%202026,%2003_50_27%20PM.png',
  meta_title = 'TourBots Multi-Model Tours and Extra Spaces | TourBots AI',
  meta_description = 'Learn how TourBots supports first-tour setup, multi-model switching within one tour, AI-led navigation, and growth through extra space add-ons.',
  tags = array[
    'Tour Setup',
    'Matterport',
    'Multi-Model Tours',
    'AI Navigation',
    'Extra Spaces',
    'TourBots Pricing'
  ]::text[],
  reading_time_minutes = 6,
  updated_at = now()
where slug = 'ai-virtual-tour-growth-playbook-2026';
