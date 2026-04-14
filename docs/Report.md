# TourBots AI - Independent Codebase Overview

Date: 14/04/2026  
Reviewer stance: Independent code auditor (implementation-focused, no commercial bias)

## 1) Executive view

TourBots AI is a B2B multi-tenant SaaS platform that adds AI assistants to Matterport virtual tours.  
The product is designed for operators and agencies who need to deploy, manage, analyse, and white-label AI-guided tour experiences.

This codebase is a production-grade Next.js application with:
- a public marketing site,
- a secured customer app,
- a secured platform admin area,
- a public embed/chat pipeline,
- and billing/ops integrations for live commercial use.

The repository state you shared shows the latest deployment branch was pushed successfully (`feat/tourbotsbranch`) and connected to Vercel.

## 2) What the company has built

At product level, TourBots has built:
- an AI chatbot layer for virtual tours,
- tour navigation and guidance logic (not only Q&A),
- account-level controls for venues/locations,
- agency delivery workflows including an agency portal add-on,
- usage/billing controls and Stripe lifecycle handling,
- analytics/tracking for embeds and conversations,
- public resources content (guides/blogs) and support surfaces.

Core commercial model in code:
- Free + Pro baseline,
- paid add-ons (extra spaces, message blocks, white-label, agency portal),
- monthly operational controls around entitlement and usage.

## 3) Technology stack (as implemented)

- Frontend: Next.js 14, React, TypeScript, Tailwind.
- Backend: Next.js route handlers (`app/api`), Supabase/PostgreSQL service-role access.
- Identity: Firebase Auth (client) + Firebase Admin token verification (server).
- AI runtime: OpenAI Responses API with streaming and tool calls.
- Payments: Stripe checkout + webhook-driven subscription state sync.
- Email: Resend.
- Monitoring/security: Sentry, CSP headers, hardened route handling.
- Hosting/deployment: Vercel.

Key config anchors:
- `README.md`
- `package.json`
- `next.config.js`
- `vercel.json`
- `vercel.txt`

## 4) Marketing site: content and core concepts

Main marketing routes are under `app/(main)` and are assembled from `components/website/*`.

Core concepts communicated on page content:
1. **AI answers visitor questions** (faster than static tours).
2. **AI navigates visitors through spaces** (not just chat replies).
3. **Trigger-based actions** can fire at the right moments.
4. **Simple deployment** (one embed line, quick rollout).
5. **Commercial clarity** (Free/Pro + add-ons, agency suitability).

Representative files:
- `app/(main)/page.tsx` (home flow composition)
- `components/website/home/Hero.tsx` (primary proposition and live demo framing)
- `components/website/home/HowItWorks.tsx` (3-step onboarding narrative)
- `components/website/home/Features.tsx` (answer, guide, trigger)
- `app/(main)/features/page.tsx`
- `components/website/features/AgencyCoreFeatures.tsx`
- `app/(main)/pricing/page.tsx`
- `components/website/pricing/PricingPlans.tsx`

Assessment: the marketing layer is tightly aligned with actual platform capability, not generic promise language.

## 5) Application side: how it works

Authenticated app routes are under `app/(app)/app`.

Main operational modules:
- Dashboard: `app/(app)/app/dashboard/page.tsx`
- Tours: `app/(app)/app/tours/page.tsx`
- Chatbots: `app/(app)/app/chatbots/page.tsx`
- Settings: `app/(app)/app/settings/page.tsx`
- Help Centre: `app/(app)/app/help/page.tsx`

Behaviour summary:
- User authentication is enforced via guards and Bearer-token server checks.
- Venue-scoped access is enforced server-side before sensitive actions.
- Tours and chatbot configurations are selected per venue/tour context.
- Chat responses stream in real time and can issue actionable events (for navigation/model switching).
- Billing and usage constraints are checked before message consumption.

This is an implementation-first app, not a thin UI shell.

## 6) API, auth, and access control

API surface is broad and segmented by trust boundary:
- `/api/app/*` - authenticated customer application APIs.
- `/api/admin/*` - platform admin-only APIs.
- `/api/public/*` - embed/chat/public CMS and agency portal public endpoints.
- `/api/webhooks/stripe` - Stripe event ingestion.
- `/api/cron/*` - scheduled operational tasks.

Critical enforcement files:
- `lib/server-auth-context.ts` (token verification + caching)
- `lib/authenticated-venue.ts` (venue-bound auth context)
- `lib/chatbot-route-auth.ts` (chatbot route scoping)
- `lib/api/require-platform-admin.ts` (admin-only enforcement)
- `lib/agency-portal-auth.ts` (cookie session + CSRF + domain allowlist)

Assessment: access control is explicit and layered. It is not only client-side gating.

## 7) AI/chatbot pipeline quality

The core public tour chatbot route (`app/api/public/tour-chatbot/[venueId]/route.ts`) includes:
- input sanitisation,
- rate limiting,
- hard-limit checks,
- billing usage checks,
- configurable prompt construction from venue content,
- trigger matching,
- model/tour navigation support,
- SSE streaming responses,
- conversation logging and analytics hooks.

This is a strong core implementation for production behaviour control and cost/usage containment.

## 8) Billing and commercial operations

Stripe webhook route (`app/api/webhooks/stripe/route.ts`) handles:
- signature verification,
- idempotent claim/mark processing,
- subscription create/update/delete transitions,
- invoice success/failure handling,
- add-on application logic,
- billing record synchronisation.

Commercial logic in code aligns with the marketing/pricing model and appears operationally mature for recurring revenue workflows.

## 9) Deployment and runtime readiness

Runtime posture appears production-aware:
- CSP and security headers in `next.config.js`,
- embed-safe header policy for framed routes,
- Sentry integration and tunnel route,
- host redirect policy (`www` to apex),
- Firebase auth rewrite configuration,
- Vercel config + cron documentation.

The project is clearly configured as a live deployment target, not a prototype.

## 10) Key files and what they do

- `app/layout.tsx` - root metadata, providers, analytics scripts.
- `app/(main)/layout.tsx` - marketing site shell.
- `app/(app)/app/layout.tsx` - authenticated app shell (desktop/mobile sidebars).
- `app/(admin)/admin/layout.tsx` - admin shell and auth fetch handling.
- `components/firebase-providers.tsx` - Firebase client SDK providers.
- `lib/firebase-admin.ts` - server token verification initialisation.
- `lib/supabase-service-role.ts` - privileged data access client.
- `app/api/public/tour-chatbot/[venueId]/route.ts` - AI tour chat runtime.
- `app/api/public/embed/track/route.ts` - embed tracking ingestion.
- `app/api/public/agency-portal/auth/login/route.ts` - agency portal login/session creation.
- `app/api/health/route.ts` - platform health endpoint (admin gated).
- `tests/*` + `vitest.config.mts` - live integration testing structure.

## 10.1) Internal documentation maturity

The `docs` folder is substantive and useful, especially for operations and feature rollouts:
- `docs/CodeDocumentation/Alerts_Sentry.md` - monitoring and alerting implementation detail.
- `docs/CodeDocumentation/Tests_Vitest.md` - live-test architecture and scope.
- `docs/features/AgencyAccount.md` - completed agency portal add-on implementation plan.
- `docs/features/WhiteLabelEmbed.md` - planned Phase 1 white-label embed domain enhancement.
- `docs/billing/1_stripe_products_and_price_ids.md` - billing catalogue and Stripe price mapping.

Assessment: documentation quality is above average for an early growth-stage product and supports operational continuity.

## 11) Independent observations (concise)

### Strengths
- Strong feature-to-code alignment between marketing promise and implementation.
- Good separation of public/app/admin/API concerns.
- Practical production controls (limits, auth scope, billing checks, webhooks).
- Multi-tenant and agency workflows are implemented as first-class concepts.

### Risks / watchlist
- `package.json` references `scripts/build-widget-bundle.js`; verify this script exists in the deployment branch if widget builds are required.
- Some operational docs are in `.txt`/SQL seed artefacts; keep deployment-critical configuration centralised to reduce drift.
- Continue regular secret hygiene in `.env.local` and Vercel environment scopes.

## 12) Overall conclusion

This is a serious B2B SaaS implementation, not an early mock-up.  
The platform has coherent product positioning, robust core architecture, and clear commercial mechanics across AI usage, billing, and tenant/agency controls.

In auditor terms: **credible production foundation with clear growth-ready structure**.
