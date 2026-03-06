# Внучок — Цифровой AI-помощник для пожилых родителей

## Overview
Внучок is a subscription-based AI assistant service designed to support elderly parents in Russia. The service aims to provide peace of mind for adult children (the payers, typically 35-50 years old) and offer companionship and assistance to their parents (the users, 65+ years old). The core value proposition lies in fostering closer family ties, offering adaptive technological assistance, and creating an emotional bond through personalized interaction and long-term memory features like the "Book of Life."

The project prioritizes features that enhance value for both parents and children, are cost-effective, scalable, and create a strong market moat against competitors like Yandex Alice and specialized telemedicine services. Key ambitions include achieving high user engagement, positive word-ofmouth growth, and exploring B2B opportunities. The project's mission extends beyond mere profitability, focusing on genuinely helping families connect and adapt to new technologies.

## User Preferences
As an AI Product Manager, I operate with critical thinking, specializing in AI solutions and staying updated on 2026+ trends for Russia. I filter every decision through five lenses: Value (for parent and child), Cost-effectiveness (tokens, infrastructure, time), Revenue potential, Scalability (100 to 100,000 users), and Vulnerability (ease of copying, potential failure points).

I highlight:
- Features without value that consume tokens.
- Easily copied solutions that do not create a competitive advantage.
- Data security risks (medical, personal).
- UX solutions that are complex for a 65+ audience.
- Architectural decisions that do not scale.

## System Architecture

The system is built on a React (TypeScript, Tailwind v4) frontend, an Express (TypeScript) backend, and a PostgreSQL database with Drizzle ORM. Communication with elderly users primarily occurs via a Telegram bot, supporting both text and voice interactions.

**Frontend:**
-   **Landing Page (`/`)**: Sales-oriented page with hero section, feature cards, chat scenarios, pricing, testimonials, and FAQ. Targets adult children with messaging focused on gifting a helpful companion.
-   **Auth Page (`/auth`)**: Login/registration for parent and child roles.
-   **Dashboard (`/dashboard`)**: Role-dependent interface. Parents see a linking code, AI chat, medication confirmation, blood pressure logging, and utility meter readings. Children view parent status, event feed, manage reminders, blood pressure charts, and memoirs.
-   **Pricing Page (`/pricing`)**: Displays four subscription tiers: Free, Basic, Standard, and Premium, detailing message limits and features.

**Telegram Bot (`server/telegram.ts`):**
-   Developed with `grammy` library, using long-polling for continuous operation.
-   Features include `/start`, `/help`, `/link`, `/register` (with onboarding for name, city, age, interests), and persistent reply keyboards for common actions (Health, Home, Leisure, More).
-   Supports inline keyboards for sub-menus and personalized settings.
-   **Age segmentation**: Tailors AI tone and proactive messages based on user's age group (55-60, 60-70, 70+).
-   **Proactive messages**: Personalized suggestions based on age and feature discovery.
-   **Paywall CTA**: Gentle notifications for free/basic users nearing their daily message limit.
-   **Voice Messaging**: Utilizes Whisper STT for speech-to-text and OpenAI TTS for text-to-speech, with quality gates for STT confidence.
-   **Alerts**: Critical alerts from AI are forwarded to linked children via Telegram.
-   **Bot Personality**: Configurable through natural language or settings for formality, humor, softness, verbosity, emoji use, and encouragement.
-   **Rate-limiting**: Daily message limits are enforced per tariff, with emergency messages bypassing the limit.

**Backend (Express + TypeScript):**
-   Provides a REST API (`/api/*`) with server-side sessions (express-session + connect-pg-simple) and bcrypt for password hashing.
-   `requireAuth` middleware secures routes, and IDOR protection prevents unauthorized access to user data.
-   Centralized `resolveParentId(userId)` helper for parent identification.
-   Robust security measures include secure cookies in production, and no response body logging to prevent data leakage.

**AI Module (`server/ai.ts`) & Tools (`server/tools.ts`):**
-   Integrates OpenAI API (GPT-4o-mini with function calling) and Perplexity API (sonar) for web search.
-   **`chatWithGrandchild`**: Implements a highly personalized "Vnuchok" persona (25-year-old medical student) with contextual awareness of time and date.
-   **Six-level safety system**: Anti-injection, health, alarm ([ALERT]), fraud, home danger (gas/flood/fire + [ALERT]), lost ([ALERT]). Emergency situations recommend 112. Alerts are dynamically adapted based on whether a child is linked.
-   **Server-side danger detection**: `detectIntentLocal()` uses regex patterns to identify emergencies *before* LLM processing, ensuring critical alerts are always triggered.
-   **Data Protection**: PII filter (`stripPII`) removes sensitive information (card numbers, phones, etc.) from search queries. AI explicitly avoids repeating personal data from memory.
-   **Anti-hallucination**: Strict prompts prevent AI from diagnosing illnesses or interpreting analyses.
-   **Search Pipeline**: A multi-source pipeline (Perplexity sonar, DuckDuckGo) for web, movie, TV searches, with GPT-4o-mini for merging and cross-validation for critical information (gov/legal/medicine/transport).
-   **Search Quality Logging**: Tracks search queries, sources, merge strategies, validation results, and user feedback.
-   **Tool-calling**: Extensive set of function-calling tools including `get_weather`, `search_web`, `search_recipe`, `find_greeting_card`, `generate_image`, `search_cinema`, `search_movie`, `search_place`, `search_transport`, `search_clinic`, `search_medicine`, `search_tv`, `search_gov_services`, `search_garden`, `search_product`, `search_legal`, `search_travel`.
-   **`recognizeMeter`**: Vision API for recognizing utility meter readings, with user-friendly hints for unsuccessful attempts.
-   **`extractMemoryFacts`**: Automatically extracts and deduplicates facts from user messages into categories (family, health, hobbies) for long-term memory, which are then injected into the system prompt.
-   **Telegram typing indicator**: Provides real-time status updates during AI processing.
-   **Search Result Verification**: `verifySearchResult()` re-checks critical search data (dates, times, events) to add a warning if not confirmed.
-   **`detectRequiredTool`**: Intelligently routes user requests to appropriate tools based on context.

**Database (PostgreSQL + Drizzle ORM):**
-   Key tables: `users`, `subscriptions`, `reminders`, `events`, `chat_messages`, `user_memory`, `utility_metrics`, `memoirs`, `health_logs`, `waitlist`, `ai_usage_logs`, `topic_settings`, `personality_settings`.

**Proactive Reminders (`server/scheduler.ts`):**
-   Node-cron schedules hourly checks for medication reminders.
-   Sends Telegram pushes with "Confirmed" buttons.
-   Follow-up reminders and child notifications for unconfirmed medications.
-   Proactive messages from Vnuchok based on user activity, memory, and context.

**Design System:**
-   Fonts: Lora (headings), Inter (body).
-   Color palette: Blue (#3b82f6) with warm orange accents.
-   `glass-panel` utility class for UI elements.

**API Security:**
-   Rate limiting on authentication, registration, and linking endpoints.
-   Zod validation for all API endpoints.
-   ID parsing for secure parameter handling.

## External Dependencies
-   **OpenAI API**: Used for `chatWithGrandchild` (GPT-4o-mini), `textToSpeech`, `extractMemoryFacts`, and `generate_image` (DALL-E 3).
-   **Perplexity API (sonar)**: Powers `search_web`, `search_recipe`, `search_movie`, `search_place`, `search_transport`, `search_clinic`, `search_medicine`, `search_tv`, `search_gov_services`, `search_garden`, `search_product`, `search_legal`, `search_travel`.
-   **Whisper API**: Used for `speechToText` in voice messaging.
-   **Open-Meteo API**: Provides real-time weather data for `get_weather`.
-   **bcrypt**: For password hashing.
-   **express-session**, **connect-pg-simple**: For managing server-side user sessions.
-   **node-cron**: For scheduling proactive reminders and messages.
-   **Yandex SpeechKit TTS**: Planned integration for natural Russian voice synthesis (awaiting API key).
-   **DALL-E 3**: For generating unique images (not greeting cards).
-   **Telegram Bot API**: Core platform for user interaction.
-   **PostgreSQL**: Primary database.
-   **Drizzle ORM**: For database interaction.
-   **Various Russian content sources**: (e.g., Kinopoisk, povar.ru, eda.ru, rlsnet.ru, gosuslugi.ru, Yandex.Maps, Yandex.Market, Ozon, Wildberries, ProDoktorov, Tutu.ru) integrated via web scraping or Perplexity search for specific data.