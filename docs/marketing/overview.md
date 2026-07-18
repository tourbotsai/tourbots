# TourBots AI — social marketing system: overview

This document explains what's in `docs/marketing/`, why it's built the way it is, and exactly what's been produced so far. It's written so someone who wasn't in the original conversation can pick this up, understand the system, and review the output.

## 1. Why this exists

The original approach was to generate social ad images with an AI image generator. That was scrapped because the results looked like generic, glowy, "childish robot" SaaS ads and didn't match the actual TourBots AI brand (flat, monochrome bot mark; navy/indigo colour palette; Manrope typeface; a real, specific chat widget design already used in the product).

Instead, every post is built as a small HTML/CSS page, styled with the same colour tokens and fonts as the real product (pulled from `tailwind.config.ts` and `globals.css`), and then screenshotted by a script using Playwright (a browser automation tool). This means every pixel — the logo, the fonts, the chat widget, the mock dashboard — is exact, reusable code rather than a one-off AI image, and any post can be tweaked by editing text/parameters and re-running one command.

No fabricated statistics or testimonials are used anywhere in the copy. Where numbers appear (e.g. in the analytics mock-up), they're clearly illustrative dashboard data, not claims about real performance.

## 2. How the system is built

```
docs/marketing/
├── posts.json              ← the content: one entry per post, with its template + text/data
├── render.mjs               ← the renderer: reads posts.json, screenshots each one to PNG
├── captions.md              ← drafted Instagram + LinkedIn captions for every post
├── content-calendar.md      ← the actual posting schedule/dates
├── package.json             ← Node project for the renderer (Playwright dependency)
├── templates/
│   ├── theme.css             ← shared colours/fonts, mirrors the real app's design tokens
│   ├── quote-card.html       ← template used by posts 1, 4, 5, 6, 7, 8
│   ├── product-spotlight.html← template used by posts 2 and 3 (three internal "variants")
│   └── assets/
│       ├── tourbots-icon-cropped.png   ← the real TourBots logo mark, alpha-cropped for tight alignment
│       └── manor-hotel-lobby.png       ← AI-generated photo of a fictional "Manor Hotel" lobby, used as demo tour imagery
└── output/                  ← the finished PNGs (1080×1080, one per post per platform)
```

**`posts.json`** is the single source of truth for content. Each entry has an `id`, a human-readable `label`, which HTML `template` to use, and a `params` object of text/data specific to that post (headline, sub-copy, chat messages, dashboard numbers, etc.).

**`render.mjs`** is a small Playwright script: for every entry in `posts.json`, it opens the named template in a headless browser with the params passed as URL query parameters, waits for fonts to load, and screenshots it at 1080×1080px (the standard Instagram/LinkedIn square format). It writes out `<id>-ig.png` and `<id>-linkedin.png` — currently identical images, since the same square crop works for both platforms, but kept as separate files so each platform has its own clearly-named upload. Run it with:

```bash
cd docs/marketing
node render.mjs
```

Editing any post is just: change its `params` in `posts.json`, then re-run that command — nothing else needs touching.

## 3. The two templates

### `quote-card.html` — the "hook" format
A dark navy full-bleed card: logo top-left, a large bold headline, a smaller grey sub-copy line below it, an optional blue "teaser" line with an arrow (→), a faint bot-head watermark bottom-right, and the `tourbots.ai` URL bottom-left. No screenshots, no UI — pure copy, used for problem/hook-style posts.

### `product-spotlight.html` — the "show the product" format
This one template has three internal variants, selected by a `variant` parameter:
- **`split`** — two browser-style windows side by side, labelled (e.g. "Without TourBots" / "With TourBots"), each showing a photo of a virtual tour. The right-hand one has a small, real-looking chat widget overlaid, with a two-message conversation (visitor question + AI answer) and a working-looking message input bar. The widget's header colour and brand name are parameterised, so it visibly looks "white-labelled" to a specific venue rather than branded as TourBots.
- **`dashboard`** — a stylised, code-drawn mock-up of the actual product's admin dashboard: a dark sidebar with nav items (one highlighted as "active"), a page title/subtitle, a row of metric cards, a small trend chart (SVG, brand-indigo), and a "recent message activity" list. It's deliberately not a literal screenshot of the real UI — it's inspired by the real layout but redrawn as an original composition, so it reads as a designed promo graphic rather than a leaked screenshot.
- **`single`** — built and available (a single full-width screenshot in a browser frame) but not currently used by any post.

## 4. The posts that exist today (8 total)

All are 1080×1080px, output as `<id>-ig.png` and `<id>-linkedin.png` in `docs/marketing/output/`.

| # | id | Template / format | Headline | Sub-copy | Detail |
|---|---|---|---|---|---|
| 1 | `01-hook` | `quote-card` | "Your virtual tour isn't capturing all the engagement it could." | "Visitors browse, then bounce. There's no one to answer their questions, guide them round, keep them engaged, or convert them." | Teaser: "An AI guide could be that someone." The foundational "problem" post. |
| 2 | `02-info` | `product-spotlight`, `split` | "Add an AI guide to your tour." | "Most tours leave visitors to wander alone - like a hotel with nobody on the front desk. AI can answer questions, guide them around and collect details." | Fictional venue "Manor Hotel" (AI-generated lobby photo). Left panel: tour with no widget. Right panel: same tour with a gold-branded "Manor Hotel AI" chat widget mid-conversation — visitor asks "Do you have a spa?", AI replies with spa facilities and offers to guide them there. Demonstrates the white-label pitch. |
| 3 | `03-analytics` | `product-spotlight`, `dashboard` | "You can't improve what you can't see." | "Every tour load, navigation, and message is logged. You can see exactly what's happening in your tour." | Mocked-up "Analytics" dashboard screen: sidebar with Analytics highlighted, four metric cards (Tour moves: 135, Tour views: 214, Visitor messages: 86, Avg. response: 3s), a trend chart, and a "recent message activity" list of illustrative visitor questions. |
| 4 | `04-out-of-hours` | `quote-card` | "Your tour doesn't clock off. Neither should the answers." | "Most virtual tours get browsed evenings and weekends - exactly when there's no one around to answer a question." | Teaser: "An AI guide is on, always." Same format as post 1, narrower angle (out-of-hours browsing). |
| 5 | `05-missed-question` | `quote-card` | "One unanswered question is one lost booking." | "Visitors don't always ask twice. If nobody's there to answer the first time, they simply move on." | Teaser: "An AI guide never misses a question." |
| 6 | `06-front-desk` | `quote-card` | "There's no one at the front desk of a virtual tour." | "Visitors arrive, look around, and there's no one there to greet them, answer questions, or point them in the right direction." | Teaser: "An AI guide is always at the desk." |
| 7 | `07-silent-scroll` | `quote-card` | "Most visitors leave without saying a word." | "No feedback, no questions answered, no idea what almost convinced them to book." | Teaser: "An AI guide finds out, every time." |
| 8 | `08-just-a-video` | `quote-card` | "A virtual tour without a guide is just a video." | "Static, one-way, and easy to forget. Add someone to talk to, and it becomes an experience." | Teaser: "That's the difference an AI guide makes." |

Posts 1, 4, 5, 6, 7, 8 all use the identical `quote-card` template with only the text changed — deliberately, to keep a consistent, recognisable "hook post" look across the set. Posts 2 and 3 are the two "show the product" posts, using different internal variants of `product-spotlight`.

## 5. Supporting documents

- **`captions.md`** — a drafted Instagram caption and a (usually longer/more explanatory) LinkedIn caption for every post. Marked explicitly as drafts — written to this brief's tone (British English, no invented stats/testimonials) but not yet given a final human proofread pass.
- **`content-calendar.md`** — the actual posting plan: Instagram on Mondays/Wednesdays, LinkedIn on Tuesdays/Thursdays (each post debuts on Instagram, then repeats on LinkedIn the next day with the LinkedIn caption), starting Monday 20/07/2026, running through all 8 posts by 13/08/2026, alternating "hook" and "product" post formats week to week so the feed doesn't look repetitive. It also flags that new posts need producing before the calendar runs out.

## 6. Practical notes

- **This folder is safe to commit and deploy.** It sits under `docs/`, outside anything Next.js builds or serves, isn't referenced by any app code, and its own `node_modules` (Playwright + browser binary) is gitignored so it never gets pushed.
- **To add a new post:** add an entry to `posts.json` using whichever template fits, then run `node render.mjs` from inside `docs/marketing/`. Ping the assistant/chat history for further post ideas already discussed if a fresh angle is needed.
- **Before publishing anything:** give the relevant caption in `captions.md` a final read — it's drafted, not signed off.

# Posting calendar

Cadence: Instagram on Mondays and Wednesdays, LinkedIn on Tuesdays and Thursdays. Each post debuts on Instagram, then repeats on LinkedIn the following day using the LinkedIn caption variant, so both platforms get every post without posting the same thing on both on the same day.

Formats are deliberately alternated week to week — a "hook" post (`quote-card.html`) followed by a "product proof" post (`product-spotlight.html`) — so the feed doesn't look repetitive.

First post goes live Monday 20/07/2026. All dates below are DD/MM/YYYY.

| Date | Day | Platform | Post | Files | Caption |
|---|---|---|---|---|---|
| 20/07/2026 | Mon | Instagram | 1. Hook | `01-hook-ig.png` | `captions.md` § 1, Instagram |
| 21/07/2026 | Tue | LinkedIn | 1. Hook | `01-hook-linkedin.png` | `captions.md` § 1, LinkedIn |
| 22/07/2026 | Wed | Instagram | 2. Info (Manor Hotel) | `02-info-ig.png` | `captions.md` § 2, Instagram |
| 23/07/2026 | Thu | LinkedIn | 2. Info (Manor Hotel) | `02-info-linkedin.png` | `captions.md` § 2, LinkedIn |
| 27/07/2026 | Mon | Instagram | 6. Front desk | `06-front-desk-ig.png` | `captions.md` § 6, Instagram |
| 28/07/2026 | Tue | LinkedIn | 6. Front desk | `06-front-desk-linkedin.png` | `captions.md` § 6, LinkedIn |
| 29/07/2026 | Wed | Instagram | 3. Analytics | `03-analytics-ig.png` | `captions.md` § 3, Instagram |
| 30/07/2026 | Thu | LinkedIn | 3. Analytics | `03-analytics-linkedin.png` | `captions.md` § 3, LinkedIn |
| 03/08/2026 | Mon | Instagram | 5. Missed question | `05-missed-question-ig.png` | `captions.md` § 5, Instagram |
| 04/08/2026 | Tue | LinkedIn | 5. Missed question | `05-missed-question-linkedin.png` | `captions.md` § 5, LinkedIn |
| 05/08/2026 | Wed | Instagram | 4. Out of hours | `04-out-of-hours-ig.png` | `captions.md` § 4, Instagram |
| 06/08/2026 | Thu | LinkedIn | 4. Out of hours | `04-out-of-hours-linkedin.png` | `captions.md` § 4, LinkedIn |
| 10/08/2026 | Mon | Instagram | 8. Just a video | `08-just-a-video-ig.png` | `captions.md` § 8, Instagram |
| 11/08/2026 | Tue | LinkedIn | 8. Just a video | `08-just-a-video-linkedin.png` | `captions.md` § 8, LinkedIn |
| 12/08/2026 | Wed | Instagram | 7. Silent scroll | `07-silent-scroll-ig.png` | `captions.md` § 7, Instagram |
| 13/08/2026 | Thu | LinkedIn | 7. Silent scroll | `07-silent-scroll-linkedin.png` | `captions.md` § 7, LinkedIn |

All files referenced above live in `docs/marketing/output/`.

## Before posting

The copy in `captions.md` is drafted, not final — give each one a read before it goes out. None of it contains fabricated stats or testimonials by design, but it hasn't had a human proofread pass yet.

## After 13/08/2026

This calendar uses up the full set of 8 posts currently built. New posts need to be produced before this run out — see the chat history for further post ideas already discussed, or ask for more to be built from `posts.json` using the existing `quote-card.html` / `product-spotlight.html` templates.
