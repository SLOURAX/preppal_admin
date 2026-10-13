# Preppal Admin UI Refactor Plan

## Objective

Rebuild the admin interface so it feels like the operational side of the current Preppal web product—not a separate template—and covers every learner-facing feature that needs management.

This phase is UI-only:

- use typed mock data and local interactions;
- do not add, change, or call backend endpoints;
- do not change database models or payment behaviour;
- preserve the existing ADMIN access guard and login flow;
- design state boundaries so API integration can replace mocks later without redesigning pages.

## Product truths the admin UI must reflect

The current web product establishes these rules and terms. The admin must use them consistently:

- Plans: Free, Monthly Premium, and Annual Premium.
- Display monthly and annual subscription expiry/renewal state separately from learning level.
- Monthly price: ₦3,500. Annual price: ₦30,000.
- Progression: Level 1 through Level 5; each 5,000 lifetime XP unlocks a level, with Level 5 at 20,000 XP.
- Wallet conversion: 50 XP = 1 Preppal Coin.
- Coin value: ₦1,000 per coin.
- Wallet deposits are spend-only; converted Preppal Coins are withdrawable.
- Daily check-in reward: +2 XP.
- Referral reward: +50 XP after the referred learner verifies their account.
- Exams: JAMB, WAEC, and NECO.
- Quiz paths: exam preparation or subject practice; timed and untimed modes.
- Plans and wallet payments use Bachs terminology.
- Games are inactive/coming soon and must not appear as active inventory.
- Blog categories, featured state, inline media, likes, comments, and discussions must match the public News experience.

## Current UI audit

### Keep and refine

- ADMIN-only login and access check.
- Brand mark and secure admin positioning.
- Light/system/dark theme control.
- Blog workspace concepts: overview, posts, editor, discussions, and media.
- Responsive table-to-card pattern used on the Users page.
- Payment and withdrawal ledger concepts.

### Replace or restructure

- The current `/quizzes` route falls through to a generic catch-all page.
- User profiles only show basic identity, plan, XP, coins, and quiz count.
- Rewards show campaigns and catalogue entries that do not match the live product.
- Settings still show 10 XP per coin and ₦1,300 per coin.
- “Premium” is treated as one state rather than Monthly/Annual plus expiry.
- Subscription management is missing.
- Referrals, leaderboard operations, notification management, weekly goals, and check-in monitoring are missing.
- Games are implied as manageable/active even though the web marks them as unavailable.
- Dashboard, content, analytics, and finance pages are large monolithic files with duplicated UI patterns.
- The admin theme is close to the web but lacks its background treatment, card radii, spacing rhythm, branded status colours, loading states, and visual hierarchy.

## Target information architecture

### Overview

- `/dashboard` — operational summary and attention queues.

### Learners

- `/users` — learner directory.
- `/users/[id]` — full learner profile UI.

### Learning

- `/learning/questions` — question bank.
- `/learning/questions/new` — question composer.
- `/learning/questions/[id]` — question editor/preview.
- `/learning/exams` — JAMB/WAEC/NECO structure, years, subjects, and topic coverage.
- `/learning/sessions` — quiz attempts, completion, scores, timing, and flagged sessions.
- `/learning/reports` — reported/flagged questions and moderation queue.

### Content

- `/blog` — blog overview and posts.
- `/blog/new` — full article editor.
- `/blog/[id]` — edit/preview article.
- `/blog/discussions` — comments and moderation.
- `/blog/media` — media library.

### Engagement

- `/engagement/rewards` — XP rules, daily check-in, streaks, weekly goals, and reward catalogue.
- `/engagement/referrals` — referral funnel and individual referrals.
- `/engagement/leaderboard` — ranking periods, reward positions, and visible leaderboard preview.
- `/engagement/notifications` — notification templates, audience composer, and delivery history UI.

### Commerce

- `/commerce/plans` — Free, Monthly, and Annual plan presentation and benefits.
- `/commerce/subscriptions` — active, expiring, expired, and cancelled subscriptions.
- `/commerce/payments` — Bachs payment ledger for plan purchases and wallet deposits.
- `/commerce/wallets` — XP, coins, spend-only deposits, conversions, and adjustments ledger UI.
- `/commerce/withdrawals` — payout review queue and withdrawal history.
- `/commerce/redemptions` — reward catalogue claims and fulfilment states.

### Insights and system

- `/analytics` — learning, engagement, subscription, wallet, and content insights.
- `/settings` — product configuration preview, feature visibility, admin preferences, and audit UI.
- `/admin-team` — admin directory, role presentation, sessions, and audit trail UI.

Games should appear only in Settings as a disabled “Coming soon” feature state until the learner-facing games are activated.

## Shared visual system

### Brand alignment

- Copy the web app’s design tokens for background, foreground, surface, border, primary violet, success, danger, shadows, stripe, star, and page wash.
- Use the same Geist font setup and heading letter spacing.
- Use the same subtle dotted/slanted page background, with admin content on elevated surfaces.
- Standard card radius: 24px for primary panels, 16px for nested panels, pills for compact filters/status.
- Use the web theme switch exactly, including light, system, and dark modes.
- Use the Preppal mark in the shell; use mascots only for onboarding, loading, confirmation, empty, and error states.
- Use violet for primary actions, amber for XP, deep navy/purple for coins, emerald for success, blue for learning, and rose for destructive or failed states.

### Admin shell

- Collapsible desktop sidebar with grouped navigation and clear active states.
- Mobile navigation becomes a proper slide-over drawer instead of a horizontally scrolling list.
- Sticky top bar with breadcrumb, global learner/payment/article search trigger, notifications, theme control, and admin profile menu.
- Content max-width rules per page: wide for tables/editors, restrained for settings/details.
- Global command/search modal mock that can display learners, payments, questions, and articles.

### Shared UI primitives

Create reusable components before rebuilding pages:

- `AdminPageHeader`
- `Breadcrumbs`
- `MetricCard` and `MetricGrid`
- `FilterBar`, `SearchField`, and `DateRangePicker`
- `SegmentedControl` and `Tabs`
- `DataTable` with sort, select, pagination, and responsive card rows
- `StatusBadge` with shared semantic states
- `DetailDrawer` and `DetailPanel`
- `Modal`, `ConfirmationModal`, and `ProcessingModal`
- `EmptyState`, `ErrorState`, and `SkeletonState`
- `ChartCard`, `ChartLegend`, and `PeriodSelector`
- `ActivityTimeline`
- `AmountDisplay` for NGN, XP, and Preppal Coins
- `UserAvatar`, `PlanBadge`, and `LevelBadge`
- `FormField`, `SelectField`, `Toggle`, and `RichTextToolbar`
- `Toast` for mock UI feedback

All controls need default, hover, focus, disabled, loading, empty, success, and error appearances.

## Page specifications

### 1. Overview

Purpose: show what requires action today, not every possible metric.

UI sections:

- welcome/header with current date and environment badge;
- KPI row: active learners, quizzes completed, active subscriptions, payment volume;
- action queue: pending withdrawals, failed payments, flagged questions, comments awaiting review;
- learner activity trend and quiz completion trend;
- subscription split (Free/Monthly/Annual);
- subject performance summary;
- wallet snapshot: XP issued, coins converted, deposit balance, withdrawn value;
- recent platform activity timeline;
- quick actions linked to real admin sections.

### 2. Learners

Directory columns/cards:

- learner identity and verification state;
- Level 1–5 badge;
- Free/Monthly/Annual subscription badge and expiry state;
- lifetime XP, current XP, coins, deposit balance;
- quiz count and last active time;
- account state.

Learner detail UI tabs:

- Overview: contact, learning level, exam goal, joined date, verification, activity.
- Learning: quiz history, subjects, accuracy, weekly goal, streak, leaderboard rank.
- Wallet: XP ledger, conversions, coins, deposits, withdrawals, redemptions.
- Subscription: plan, start/end date, status, payment history.
- Referrals: code, invited learners, activation state, awarded XP.
- Security: sessions, password/security events, account status.
- Audit: mock admin actions timeline.

UI-only admin actions appear in a guarded action menu and open confirmation forms; they do not persist or call APIs.

### 3. Learning management

Question bank:

- filters for exam, year, subject, topic, difficulty, source, status, and report state;
- table/card results with answer status and last edited metadata;
- bulk selection toolbar;
- question preview drawer matching the learner quiz card;
- create/edit composer with question text, optional image/audio, four options, correct answer, explanation, exam metadata, topic, difficulty, and publish status;
- side-by-side learner preview.

Exam structure:

- JAMB, WAEC, and NECO cards;
- year availability;
- subject list and topic coverage;
- counts for published, draft, and flagged questions;
- visual coverage gaps.

Sessions and reports:

- timed/untimed split;
- completion, score, duration, XP awarded, and subscription multiplier;
- flagged session/question review drawer;
- moderation states: open, investigating, resolved, dismissed.

### 4. Blog management

Keep the current functional scope but split it into focused routes/components.

- Overview: publishing metrics, recent posts, moderation queue, top articles.
- Posts: searchable/filterable list with draft, scheduled, published, archived, featured.
- Editor: title, slug, excerpt, category, tags, author, cover image, inline images, body blocks, SEO preview, featured toggle, publish/schedule controls.
- Preview: desktop and mobile public-news rendering.
- Discussions: comment threads, article context, reported state, hide/approve actions.
- Media: upload dropzone UI, image grid, alt text, usage count, copy URL, delete confirmation.

### 5. Rewards, goals, and referrals

Rewards page:

- product rule cards showing +2 XP daily check-in, +50 XP verified referral, 50 XP = 1 coin, and the premium quiz multiplier;
- daily check-in/streak activity preview;
- weekly goal distribution and completion summary;
- XP issuance ledger with reason and source;
- reward catalogue management matching the web catalogue;
- no fictional campaigns unless explicitly labelled as draft concepts.

Referrals page:

- invite, verification, activation, and reward funnel;
- referral list with inviter/referred learner, dates, status, and 50 XP award;
- suspicious/refunded/reversed visual states;
- learner-facing referral card preview.

Leaderboard page:

- Today/Week/Month/All-time preview;
- top positions and XP totals;
- gold/silver/bronze treatment matching the web;
- reward-position configuration mock;
- ranking health and suspicious movement queue.

### 6. Plans, subscriptions, and payments

Plans page:

- Free, Monthly ₦3,500, and Annual ₦30,000 cards matching the public pricing page;
- feature comparison and active learner counts;
- plan preview in light/dark mode;
- UI-only edit drawer.

Subscriptions page:

- Active, expiring soon, expired, cancelled, and payment-pending tabs;
- learner, plan, period, start/end, days remaining, payment reference, status;
- clear guard indicator that a learner can have only one current paid plan;
- subscription detail timeline and plan-change preview.

Payments page:

- one Bachs ledger with type filters for plan purchase and wallet deposit;
- succeeded, pending, failed, underpaid, expired, and refunded states;
- provider/reference, learner, amount, purpose, created/settled dates;
- payment detail drawer with event timeline and metadata presentation;
- failed-payment attention queue.

### 7. Wallets, withdrawals, and redemptions

Wallet overview:

- separate balances for XP, withdrawable Preppal Coins, and spend-only deposits;
- 50 XP = 1 coin and ₦1,000 per coin shown consistently;
- conversion, issuance, deposit, withdrawal, purchase, and redemption ledgers;
- seven-day, monthly, and custom range filters;
- learner wallet drawer with transaction timeline.

Withdrawals:

- pending-review queue first;
- requested coins and NGN equivalent;
- account destination summary, risk indicators, timestamps, and status;
- detail/approval UI with processing and confirmation states;
- paid, rejected, failed, and cancelled history.

Redemptions:

- reward, learner, coin cost, fulfilment state, and date;
- catalogue inventory preview;
- pending fulfilment queue.

### 8. Notifications

- templates for account, security, quiz reminder, leaderboard, wallet, subscription, and system messages;
- audience composer mock with preview count;
- email/in-app channel badges;
- desktop/mobile preview;
- draft, scheduled, sending, delivered, failed states;
- delivery history and basic engagement metrics;
- learner preference preview for quiz and leaderboard notifications.

### 9. Analytics

Use five focused tabs instead of one extremely long dashboard:

- Learning: attempts, completion, accuracy, subject/topic performance, timed/untimed.
- Learners: acquisition, activation, retention, levels, weekly goals, streaks.
- Revenue: plans, subscription status, payment success, deposit volume.
- Engagement: check-ins, referrals, leaderboard, notifications, blog.
- Wallet: XP issued, conversions, coins, deposits, withdrawals, redemptions.

Every chart gets a title, plain-language explanation, period selector, legend, empty state, and export-button mock.

### 10. Settings and admin team

Settings sections:

- Product constants summary using current web values.
- Feature visibility: games remains disabled/coming soon.
- Learning defaults presentation.
- Reward/finance rules presentation.
- Notification defaults.
- Brand and support details.
- Environment/provider status cards.
- Audit log UI.

Admin team:

- admin directory and ADMIN role badge;
- invite-admin modal mock;
- session list, last activity, and security status;
- permission matrix presentation for future roles, clearly marked as UI-only.

## Mock-data architecture

Avoid embedding large constants in page files.

Suggested structure:

```text
src/
  components/admin-ui/
  features/
    overview/
    learners/
    learning/
    blog/
    engagement/
    commerce/
    analytics/
    settings/
  mocks/
    learners.ts
    questions.ts
    blog.ts
    rewards.ts
    subscriptions.ts
    payments.ts
    wallets.ts
    analytics.ts
```

Each feature should define typed view models and read from a mock repository. Page components should never import a raw array directly. Later, API adapters can implement the same repository interface.

Mock interactions should support search, filters, tabs, pagination, drawers, previews, form validation, local optimistic state, confirmations, processing indicators, and toasts. A refresh can reset them; that is acceptable in this UI-only phase.

## Implementation sequence

### Phase 1 — Foundations

- Align admin tokens and background with the web.
- Build shared primitives and semantic status/amount components.
- Refactor icons to the web’s Lucide/Iconsax style.
- Establish mock repositories and feature folder structure.
- Add complete loading, empty, error, and modal patterns.

### Phase 2 — Shell and navigation

- Rebuild sidebar, top bar, mobile drawer, breadcrumbs, admin menu, and command search.
- Replace old routes/navigation with the target information architecture.
- Add route-level page shells and responsive constraints.

### Phase 3 — Core operations

- Overview.
- Learner directory and full learner detail.
- Question bank, editor, exam structure, sessions, and reports.
- Blog workspace refactor.

### Phase 4 — Money and subscriptions

- Plans.
- Subscriptions.
- Payments.
- Wallets.
- Withdrawals.
- Redemptions.

### Phase 5 — Engagement

- Rewards and rules.
- Weekly goals/check-ins.
- Referrals.
- Leaderboard.
- Notifications.

### Phase 6 — Insights and system

- Analytics tabs.
- Settings.
- Admin team and audit UI.
- Cross-page visual and responsive QA.

## Definition of done for the UI phase

- Every active web feature has an obvious admin management or monitoring surface.
- No page uses product values that conflict with the web.
- No generic catch-all placeholder remains in primary navigation.
- No page file remains a 500–1,500 line monolith.
- Desktop, tablet, and mobile layouts are intentionally designed.
- Light and dark themes are both visually complete.
- Tables have responsive alternatives rather than horizontal-only layouts.
- Every async-looking action has a blocking processing state where appropriate.
- Every list supports loading, empty, error, filtered-empty, and populated states.
- Destructive actions require confirmation.
- UI-only actions are clearly represented and never call or mutate backend data.
- Typecheck, lint, and production build pass after every phase.
- Final visual QA covers all routes at mobile, tablet, laptop, and wide-desktop breakpoints.

## Recommended first implementation slice

Begin with Phase 1 and Phase 2, then rebuild `/dashboard` and `/users` as the reference quality bar. Once those patterns are approved, reuse the same system for Learning, Blog, Commerce, Engagement, Analytics, and Settings. This avoids redesigning the same table, filter, drawer, modal, metric, and responsive behaviours independently on every page.
