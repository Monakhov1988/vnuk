# Внучок — Цифровой AI-помощник для пожилых родителей

## Описание проекта
Подписочный сервис AI-агента для заботы о пожилых родителях. Плательщик — взрослый ребенок (35-50 лет), пользователь — родитель (65+).

## Архитектура

### Frontend (React + TypeScript + Tailwind v4)
- **Landing Page** (`/`) — продающая посадочная страница
- **Auth Page** (`/auth`) — вход и регистрация (роли: parent/child)
- **Dashboard** (`/dashboard`) — личный кабинет плательщика

### Backend (Express + TypeScript)
- REST API с префиксом `/api`
- PostgreSQL + Drizzle ORM
- Простая аутентификация (email/password)

### База данных (PostgreSQL)
Таблицы:
- `users` — пользователи (роли parent/child, код привязки)
- `reminders` — напоминания о лекарствах
- `events` — лента событий (чек-ины, алерты, действия)
- `utility_metrics` — показания счетчиков ЖКХ
- `memoirs` — записи "Книги жизни"
- `health_logs` — дневник давления

### Ключевые файлы
- `shared/schema.ts` — модели данных (Drizzle + Zod)
- `server/storage.ts` — CRUD-операции (DatabaseStorage)
- `server/routes.ts` — API-маршруты
- `client/src/pages/Landing.tsx` — лендинг
- `client/src/pages/AuthPage.tsx` — авторизация
- `client/src/pages/Dashboard.tsx` — дашборд плательщика

## Стек
- React 19, wouter, TanStack Query
- Express 5, Drizzle ORM, PostgreSQL
- Tailwind CSS v4, shadcn/ui, Lucide Icons
- framer-motion для анимаций
