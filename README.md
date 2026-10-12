# SitePulse

SitePulse is an early-stage website audit SaaS starter for freelancers and small web agencies. It uses React, Vite, Tailwind CSS, Supabase Edge Functions, PostgreSQL, and Google PageSpeed Insights.

> Status: starter implementation. Do not treat this repository as production-ready until the security and test checklist below has been completed.

## Prerequisites

- Node.js 20+ (Node.js 22 LTS recommended)
- npm
- A Supabase project
- Supabase CLI for database and Edge Function deployment

## Local setup (Windows PowerShell)

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open the local address printed by Vite. Without Supabase environment values, the landing page renders but live audit requests are disabled.

Set these values in `.env`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

Only public/publishable client keys belong in the Vite environment. Never use a Supabase service-role key or private provider API key in a `VITE_*` variable.

## Deploy database and Edge Function

Install and authenticate the Supabase CLI, then run:

```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy run-audit
```

Optional server-side PageSpeed API key:

```powershell
supabase secrets set PAGESPEED_API_KEY=YOUR_SERVER_SIDE_KEY
```

The function can be configured without a key, subject to Google's API quotas and current API requirements. Review Google's current PageSpeed Insights API documentation before production use.

## Build verification

```powershell
npm run build
```

No test suite has been claimed as passing. Add automated unit, integration, and security tests before production.

## Current scope

- Responsive landing page and audit form
- Public URL input validation in browser and Edge Function
- PageSpeed Insights / Lighthouse categories: performance, SEO, accessibility
- Prioritized findings based on available Lighthouse audits
- Initial relational schema and RLS policies for profiles, audits, usage, subscriptions, and share settings

## Not yet implemented

- User registration/login UI
- Saving audit results from the Edge Function
- Atomic monthly quota enforcement (3 free / 50 Pro)
- Payment checkout, verified webhooks, cancellation, and subscription reconciliation
- Share token creation, hash verification, expiry, and revocation endpoint
- Automated security, accessibility, and integration tests
- Production deployment and observability

The pricing shown in the UI is a proposal only. No payment is collected by this starter.

## Security checklist before a public launch

- [ ] Add server-side rate limiting and abuse monitoring.
- [ ] Test IPv4, IPv6, IPv4-mapped IPv6, alternate numeric IP encodings, IDNs, malformed URLs, credentials, redirects, and internal hostnames.
- [ ] Keep the Edge Function from directly fetching user-provided URLs. If direct fetching is introduced, add DNS/IP validation for every redirect plus network egress restrictions to mitigate DNS rebinding and SSRF.
- [ ] Consider restricting allowed ports to 80/443 and validating IDN/punycode hostnames.
- [ ] Set production CORS to the actual app origin.
- [ ] Enforce authentication and atomic quota accounting in the server before saving audits.
- [ ] Keep service-role keys and provider secrets in Supabase secrets only.
- [ ] Verify RLS with separate user accounts and anonymous requests.
- [ ] Add API timeouts, bounded response handling, safe error messages, and structured logs without secrets.
- [ ] Implement subscription changes only from verified payment-provider webhooks.
- [ ] Ensure public reports expose only intended fields and use hashed, revocable, expiring tokens.
- [ ] Add a privacy policy, terms, and a retention policy before collecting user data.

## Architecture

Browser (React/Vite) -> Supabase Edge Function -> Google PageSpeed Insights API.
Supabase Auth and PostgreSQL will support account-owned audit history and server-authoritative usage limits in subsequent milestones.
