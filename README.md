# TourBots AI

TourBots is a multi-tenant SaaS platform that adds AI tour assistants to Matterport experiences.  
It is built for operators and agencies who want to deploy, manage, and white-label AI-guided virtual tour experiences at scale.

## What the platform includes

- **AI tour chatbot** for live visitor guidance inside virtual tours
- **Share and embed tooling** for first-party and third-party website deployment
- **Agency portal add-on** for client-facing, white-label management workflows
- **Venue and tour management** for configuration, controls, and operations
- **Custom trigger automation and analytics** for engagement and performance visibility
- **Billing and entitlement controls** (plans, add-ons, and access gating)
- **Admin and monitoring surfaces** for support and operational oversight

## Technology stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Supabase (PostgreSQL), Firebase Admin
- **AI**: OpenAI Responses API integrations for chatbot behaviour
- **Payments**: Stripe (checkout and webhook processing)
- **Email**: Resend templates and outbound flows
- **Observability**: Sentry instrumentation and in-app ops monitoring utilities
- **Hosting**: Vercel

## Local development

1. Clone the repository.
2. Install dependencies:
   - `npm install`
3. Copy and configure environment variables:
   - create `.env.local` from `.env.example`
4. Start the application:
   - `npm run dev`

## Test commands

- Full test runner: `npm run test:run`
- App live suite: `npm run test:app`
- Agency portal live suite: `npm run test:agency-portal`
- Admin live suite: `npm run test:admin`

## Core scripts

- `npm run dev` — start local development server
- `npm run build` — create production build
- `npm run start` — run production server locally
- `npm run lint` — run lint checks

## Environment notes

The platform depends on configured credentials and service keys for:

- Supabase
- Firebase
- OpenAI
- Stripe
- Matterport
- Resend
- Sentry

Review `.env.example` before running tests or deployment tasks.

## Product positioning

TourBots supports both direct operators and agency-led delivery models, including white-label embed and account management workflows.

Built by **TourBots AI**.
