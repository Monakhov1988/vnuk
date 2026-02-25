# Внучок — Цифровой AI-помощник для пожилых родителей

## Описание проекта
Подписочный сервис AI-агента для заботы о пожилых родителях на российском рынке. Плательщик — взрослый ребенок (35-50 лет, ~990₽/мес), пользователь — родитель (65+). Ценность: спокойствие для ребенка, компаньон и помощь для родителя.

## Архитектура

### Frontend (React + TypeScript + Tailwind v4)
- **Landing Page** (`/`) — продающая страница с waitlist-формой, секцией тарифов, hero-изображением
- **Auth Page** (`/auth`) — вход/регистрация с ролями parent/child
- **Dashboard** (`/dashboard`) — личный кабинет: AI-чат, лента событий, здоровье (давление + лекарства), ЖКХ (фото счетчиков), мемуары
- **Pricing Page** (`/pricing`) — 3 тарифа: Базовый (490₽), Стандарт (990₽), Премиум (1990₽)

### Backend (Express + TypeScript)
- REST API (`/api/*`)
- Серверные сессии: express-session + connect-pg-simple (PostgreSQL session store)
- Пароли хешируются bcrypt
- middleware `requireAuth` на всех защищенных маршрутах (userId из сессии, не от клиента)

### AI-модуль (`server/ai.ts`)
- OpenAI API (ключ пользователя в `OPENAI_API_KEY`)
- `chatWithGrandchild` — GPT-4o-mini, persona «заботливый внук», детекция [ALERT]
- `recognizeMeter` — Vision API для распознавания фото счетчиков
- `analyzeIntent` — классификация намерений пользователя

### База данных (PostgreSQL + Drizzle ORM)
Таблицы с FK references и индексами:
- `users` — роли parent/child, linkCode для привязки
- `subscriptions` — тарифы (basic/standard/premium), статус, срок
- `reminders` — напоминания о лекарствах
- `events` — лента событий (чек-ины, алерты, ЖКХ, мемуары)
- `utility_metrics` — показания счетчиков
- `memoirs` — записи Книги жизни
- `health_logs` — дневник давления (систолическое/диастолическое)
- `waitlist` — email для предзаписи

### Ключевые файлы
- `shared/schema.ts` — модели данных (Drizzle + Zod), enums, insert/select types
- `server/storage.ts` — IStorage интерфейс + DatabaseStorage реализация
- `server/routes.ts` — API-маршруты (auth, CRUD, AI, subscriptions, waitlist)
- `server/ai.ts` — OpenAI интеграция
- `server/index.ts` — Express + сессии + Vite dev middleware
- `client/src/pages/` — Landing, AuthPage, Dashboard, PricingPage

## Стек
- React 19, wouter, TanStack Query, Recharts
- Express 5, Drizzle ORM, PostgreSQL
- Tailwind CSS v4, shadcn/ui, Lucide Icons
- OpenAI SDK (GPT-4o-mini, Vision), bcrypt, express-session, connect-pg-simple

## Дизайн-система
- Шрифты: Lora (заголовки) + Inter (текст)
- Палитра: синий (#3b82f6) + теплые акценты (оранжевый)
- `.glass-panel` утилитарный класс для стеклянных карточек
- CSS variables в `client/src/index.css`

## Привязка родителя
1. Родитель регистрируется → получает linkCode (6-символьный код)
2. Ребенок вводит код в Dashboard → привязка через `/api/link-parent`