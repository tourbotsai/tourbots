-- 2_seed_chatbot_knowledge_quality.sql
-- Seed blog: How to Add an AI Chatbot to a Matterport Tour (Step-by-Step)
-- Run this after: production/sql/6_blogs_initial.sql

insert into public.blogs (
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
  is_published,
  published_at,
  is_scheduled,
  scheduled_publish_at,
  schedule_timezone,
  view_count,
  reading_time_minutes
)
values (
  'How to Add an AI Chatbot to a Matterport Tour',
  'how-to-add-an-ai-chatbot-to-a-matterport-tour',
  'A practical implementation guide for adding an AI chatbot to a Matterport tour, from setup to embed and go-live checks.',
  $blog$
## Why teams search this

If you are searching for *how to add an AI chatbot to a Matterport tour*, you usually need three outcomes fast:
- launch quickly without a rebuild
- keep the visitor journey smooth
- capture measurable engagement and leads

This guide walks through a practical deployment path used in TourBots.

## 1) Connect your Matterport tour

Start in your Tour setup flow and connect the Matterport model as the primary space.

For multi-area experiences, add secondary models under the same tour where needed. This keeps one visitor experience while allowing model-level context.

## 2) Create the chatbot for that tour

Open Chatbots, select the same tour location, and create the tour chatbot configuration:
- chatbot name
- welcome message
- instruction prompt
- guardrails and response scope

This ensures the assistant responds with tour-relevant context rather than generic answers.

## 3) Add knowledge content the bot can trust

Upload your core source files into the chatbot documents section:
- FAQs
- feature and package details
- access and location information
- sales and booking process notes

Keep files concise and current. Accuracy and structure matter more than file volume.

## 4) Configure guided movement (optional, high impact)

If you want the chatbot to move visitors through spaces:
1. Create navigation points in the tour.
2. Name points clearly by area intent.
3. Add triggers so relevant visitor questions can launch point-based movement.

This is where the experience shifts from static Q&A to guided discovery.

## 5) Embed tour + chatbot on your website

Use your share and embed flow to publish the live experience in your site.

Best practice:
- deploy in a page section with clear CTA context
- verify responsive behaviour on mobile and desktop
- test domain and loading behaviour before public launch

## 6) Run a short go-live QA cycle

Before launch, test:
- five common visitor questions
- one high-intent conversion question
- one movement trigger question
- one fallback question outside scope

Confirm answer quality, movement behaviour, and analytics capture.

## Common mistakes to avoid

- Embedding before validating chatbot prompts
- Uploading unstructured documents with conflicting answers
- Missing navigation-point naming standards
- Launching without post-launch analytics review

## Final takeaway

Yes, you can add an AI chatbot to a Matterport tour without rebuilding your site.  

The strongest deployments combine accurate knowledge, guided navigation, and disciplined go-live testing so the tour behaves like a conversion channel, not just a visual asset.
$blog$,
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Blogs/ChatGPT%20Image%20Mar%2028,%202026,%2001_59_04%20PM.png',
  'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Blogs/ChatGPT%20Image%20Mar%2028,%202026,%2001_59_04%20PM.png',
  array[
    'https://ahljbtlrwboixvcyepkn.supabase.co/storage/v1/object/public/Blogs/ChatGPT%20Image%20Mar%2028,%202026,%2001_59_04%20PM.png'
  ]::text[],
  'How to Add an AI Chatbot to a Matterport Tour | TourBots AI',
  'Learn how to add an AI chatbot to a Matterport tour step by step, including setup, knowledge upload, guided movement, and embed go-live checks.',
  array[
    'AI Chatbot for Matterport',
    'Matterport Tour Chatbot',
    'Virtual Tour AI',
    'Tour Embed',
    'Guided Navigation',
    'TourBots'
  ]::text[],
  true,
  now(),
  false,
  null,
  'Europe/London',
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
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  is_scheduled = excluded.is_scheduled,
  scheduled_publish_at = excluded.scheduled_publish_at,
  schedule_timezone = excluded.schedule_timezone,
  reading_time_minutes = excluded.reading_time_minutes,
  updated_at = now();
