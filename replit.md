# Внучок — Цифровой AI-помощник для пожилых родителей

## Overview
Внучок is a subscription-based AI assistant service designed to support elderly parents in Russia. It aims to provide peace of mind for adult children (payers) and offer companionship and assistance to their parents (users) through adaptive technological assistance. The service fosters closer family ties, creates an emotional bond through personalized interaction, and features a "Book of Life" for long-term memory. The project prioritizes cost-effective, scalable features that offer high value to both generations, with ambitions for high user engagement, positive word-of-mouth growth, and exploring B2B opportunities.

## User Preferences
As an AI Product Manager, I operate with critical thinking, specializing in AI solutions and staying updated on 2026+ trends for Russia. I filter every decision through five lenses: Value (for parent and child), Cost-effectiveness (tokens, infrastructure, time), Revenue potential, Scalability (100 to 100,000 users), and Vulnerability (ease of copying, potential failure points).

I highlight:
- Features without value that consume tokens.
- Easily copied solutions that do not create a competitive advantage.
- Data security risks (medical, personal).
- UX solutions that are complex for a 65+ audience.
- Architectural decisions that do not scale.

## System Architecture

The system uses a React (TypeScript, Tailwind v4) frontend, an Express (TypeScript) backend, and a PostgreSQL database with Drizzle ORM. User interaction primarily occurs via a Telegram bot supporting text and voice.

**Frontend:**
-   **Landing Page**: Sales-oriented, targeting adult children.
-   **Auth Page**: Login/registration for parent and child roles.
-   **Dashboard**: Role-dependent interface. Parents see linking codes, AI chat, health logging, memoirs, and utility meter readings. Children view parent status, engagement metrics, event feed, and manage reminders.
-   **Pricing Page**: Displays four subscription tiers with feature details.

**Telegram Bot:**
-   Developed with `grammy` library.
-   Supports key commands, onboarding, and persistent/inline keyboards for actions.
-   **Personalization**: Tailors AI tone and proactive messages based on user age.
-   **Proactive Messages**: Personalized suggestions and gentle paywall CTAs.
-   **Voice Messaging**: Uses Whisper for STT and OpenAI TTS for ASR (Text-to-Speech).
-   **Alerts**: Critical AI alerts are forwarded to linked children.
-   **Bot Personality**: Configurable for various interaction styles.
-   **Rate-limiting**: Enforces daily message limits per tariff.

**Backend (Express + TypeScript):**
-   REST API with server-side sessions and bcrypt for password hashing.
-   `requireAuth` middleware and IDOR protection secure routes.
-   Centralized parent identification logic.
-   Robust security includes secure cookies and no response body logging.

**AI Module & Tools:**
-   Integrates OpenAI API (GPT-4o-mini, DALL-E 3) and Perplexity API (sonar) for web search.
-   **`chatWithGrandchild`**: Personalized "Vnuchok" persona (25-year-old medical student).
-   **Safety System**: Six-level safety for anti-injection, health, alarms, fraud, and danger detection. Critical alerts detected server-side.
-   **Data Protection**: PII filter, explicit avoidance of repeating personal data.
-   **Anti-hallucination**: Strict prompts, Perplexity-First Architecture for factual queries (search before GPT rephrases).
-   **Pipelines**:
    -   **Recipe**: Programmatic clarification, parallel search with citations, re-search option.
    -   **Greeting Card**: Image scoring, validation, 3-level fallback (DDG → Perplexity → DALL-E).
    -   **Search**: Multi-source web, movie, TV searches, with GPT-4o-mini for merging and verification.
-   **Tool-calling**: Extensive function-calling tools for weather, web search, recipes, images, cinema, transport, health, government services, etc.
-   **`recognizeMeter`**: Vision API for utility meter readings.
-   **`extractMemoryFacts`**: Extracts and deduplicates facts for long-term memory, injected into system prompts.
-   **Search Result Verification**: Re-checks critical data and adds warnings if unconfirmed.
-   **`detectRequiredTool`**: Routes requests to tools; asks clarifying questions for vague queries.
-   **Memoir pipeline (Книга жизни)**: Parent story → `detectIntentLocal` → `adaptMemoir()` (GPT-4o-mini) cleans transcript → parent confirms → saved → child notified.
-   **Link-code security**: One-time use, 24h TTL, rate-limited.
-   **Child-first onboarding**: Child registers → gets invite link on dashboard → sends to parent via Telegram/WhatsApp → parent clicks → bot creates parent account, links to child, starts onboarding. Old flow (parent code → child enters) kept as fallback.
-   **Child Telegram linking**: Token-based (`CHILDTG_` prefix) — child clicks "Подключить Telegram" on dashboard → opens bot → telegramChatId saved → pushes start arriving.
-   **Remote onboarding**: Deep-link for child-initiated parent onboarding.
-   **Engagement metrics**: Tracks active days, messages, memoirs for dashboard display.
-   **Weekly safety report**: Scheduled reports for children on parent activity.
-   **Child Telegram notifications**: Multi-level push system for children:
    -   **Critical alerts** (instant): Scam, home danger, lost, emergency, financial risk — with Markdown formatting and specific action items (both Telegram bot and web chat trigger pushes).
    -   **Daily evening summary** (21:00 MSK): Message count, medication status, BP readings, new memoirs — only sent if parent was active.
    -   **BP anomaly alerts** (instant): Systolic ≥160 or ≤90, diastolic ≥100 — warning events + Telegram push (from both bot and web).
    -   **Memoir notifications** (on save): Push with story title and excerpt when parent saves a memoir.
    -   **Monthly milestones** (1st of month, 12:00 MSK): Total days active, memoirs count, messages count — retention-focused.

**Database (PostgreSQL + Drizzle ORM):**
-   Stores user data, subscriptions, reminders, events, chat history, user memory, utility metrics, memoirs, health logs, and AI usage logs.

**Proactive Messages:**
-   Node-cron schedules hourly checks.
-   Sends Telegram pushes with "Confirmed" buttons for reminders.
-   7 categories (follow-up, health check, weather, seasonal, memoir prompt, feature discovery, gratitude) with weighted random selection and priority rules.
-   Timed delivery with random jitter for natural feel.
-   **Adaptive daily limit**: 2 messages/day default, 3 if user responds with engagement (long replies, questions). Minimum 2h interval between proactive messages.
-   **Full deduplication**: Category not repeated 2 days in a row; yesterday's categories get 80% weight reduction; same category never sent twice in one day. GPT receives last 5 proactive texts with instruction to not repeat/rephrase.
-   **Opt-out/Opt-in**: Parent says "не пиши"/"хватит"/"отстань" → `proactiveOptOut=true`, bot confirms warmly. "Пиши снова"/"скучно" → opt back in. Field `proactive_opt_out` in users table.
-   **Engagement analysis**: `analyzeEngagement()` checks last 5 user responses to proactive messages — if ≥3 are long (>50 chars) or contain questions → "high" engagement → 3 messages/day.

**Design System:**
-   Fonts: Lora (headings), Inter (body).
-   Color palette: Blue with warm orange accents.
-   `glass-panel` utility class for UI.

**API Security:**
-   Rate limiting, Zod validation, ID parsing.

## External Dependencies
-   **OpenAI API**: GPT-4o-mini, DALL-E 3, Text-to-Speech.
-   **Perplexity API (sonar)**: Web search and specialized searches (recipes, movies, places, transport, clinics, medicine, etc.).
-   **Whisper API**: Speech-to-Text.
-   **Open-Meteo API**: Weather data.
-   **bcrypt**: Password hashing.
-   **express-session**, **connect-pg-simple**: Session management.
-   **node-cron**: Scheduling.
-   **Telegram Bot API**: Core communication platform.
-   **PostgreSQL**: Primary database.
-   **Drizzle ORM**: Database interaction.
-   **Various Russian content sources**: Integrated for specific data via Perplexity search (e.g., Kinopoisk, povar.ru, eda.ru, rlsnet.ru, gosuslugi.ru, Yandex.Maps, Yandex.Market, Ozon, Wildberries, ProDoktorov, Tutu.ru).