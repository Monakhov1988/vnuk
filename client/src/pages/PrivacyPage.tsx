import { Heart } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <nav className="bg-[#FFF8F0] border-b border-orange-100/50 py-4">
        <div className="container mx-auto px-6 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-gradient-to-br from-orange-100 to-amber-100 p-2 rounded-xl">
              <Heart className="w-6 h-6 text-orange-500" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Внучок</span>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-8" data-testid="text-privacy-title">
          Политика конфиденциальности
        </h1>

        <div className="space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Общие положения</h2>
            <p>
              Сервис «Внучок» (далее — Сервис) обрабатывает персональные данные пользователей
              в соответствии с Федеральным законом №152-ФЗ «О персональных данных».
              Используя Сервис, вы соглашаетесь с настоящей Политикой.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Какие данные мы собираем</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Имя и возраст (для персонализации общения)</li>
              <li>Город (для погоды и местных сервисов)</li>
              <li>Данные о здоровье: давление, информация о лекарствах (только по инициативе пользователя)</li>
              <li>История переписки с ботом</li>
              <li>Email и данные авторизации</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Как мы используем данные</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Для предоставления сервиса: напоминания, персонализация, дашборд</li>
              <li>Для улучшения качества обслуживания</li>
              <li>Данные <strong>не используются</strong> для обучения AI-моделей</li>
              <li>Данные <strong>не передаются</strong> третьим лицам без согласия</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Доступ к данным</h2>
            <p>
              Переписку родителя с ботом может видеть только привязанный член семьи
              через личный кабинет. Посторонние лица доступа к данным не имеют.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Хранение и защита</h2>
            <p>
              Данные хранятся на защищённых серверах. Пароли хешируются.
              Мы принимаем разумные меры для защиты ваших данных от несанкционированного доступа.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Удаление данных</h2>
            <p>
              Вы можете запросить удаление всех ваших данных, написав на{" "}
              <a href="mailto:support@vnuchok.ru" className="text-orange-600 hover:underline">
                support@vnuchok.ru
              </a>.
              Данные будут удалены в течение 30 дней.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Контакты</h2>
            <p>
              По вопросам конфиденциальности:{" "}
              <a href="mailto:support@vnuchok.ru" className="text-orange-600 hover:underline">
                support@vnuchok.ru
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-orange-100">
          <Link href="/" className="text-orange-600 hover:underline text-sm">
            ← Вернуться на главную
          </Link>
        </div>
      </main>
    </div>
  );
}
