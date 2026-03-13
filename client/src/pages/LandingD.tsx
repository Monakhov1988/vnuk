import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Shield,
  Heart,
  MessageCircle,
  Bell,
  Eye,
  BookOpen,
  Mic,
  Smartphone,
  Send,
  Mail,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function LandingD() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeChat, setActiveChat] = useState(0);

  return (
    <div className="min-h-screen bg-[#FAFAFA] selection:bg-violet-200/50" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100 py-3">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 text-white" fill="white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-slate-900">
              Внучок
            </span>
          </div>
          <div className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-500">
            <a href="#why" className="hover:text-slate-900 transition-colors" data-testid="link-nav-why-d">
              Зачем
            </a>
            <a href="#how" className="hover:text-slate-900 transition-colors" data-testid="link-nav-how-d">
              Как работает
            </a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors" data-testid="link-nav-pricing-d">
              Тарифы
            </a>
          </div>
          <Button
            asChild
            className="rounded-full px-6 h-10 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-none"
            data-testid="button-nav-cta-d"
          >
            <Link href="/auth">Попробовать</Link>
          </Button>
        </div>
      </nav>

      <main>
        <section className="pt-28 pb-20 md:pt-36 md:pb-28 px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-6" data-testid="badge-hero-d">
                AI-помощник для пожилых родителей
              </p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-8 text-slate-900 tracking-tight">
                Когда последний раз
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-600 to-slate-400">
                  вы звонили маме?
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                Внучок общается с ней каждый день. Напоминает лекарства,
                защищает от мошенников. А вам каждый вечер — сводка: всё ли в порядке.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full text-base h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10"
                  data-testid="button-hero-start-d"
                >
                  <Link href="/auth">
                    Подключить маму <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full text-base h-14 px-10 border-slate-200 hover:bg-slate-50 text-slate-700"
                  data-testid="button-hero-demo-d"
                >
                  <a href="#dialog">Посмотреть диалог</a>
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Бесплатно — 10 вопросов/день
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Только Telegram
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Понимает голосовые
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-0 md:gap-16 items-center mb-24">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-100">
                <img
                  src="/images/lonely-mom.png"
                  alt="Мама ждёт звонка"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <p className="absolute bottom-6 left-6 right-6 text-white text-lg font-medium leading-snug">
                  Она не скажет, что ей одиноко.
                  <br />
                  <span className="text-white/70 text-base">Но вы это знаете.</span>
                </p>
              </div>
              <div className="py-8 md:py-0">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 leading-tight">
                  7 миллионов пожилых россиян живут одни
                </h2>
                <p className="text-slate-500 text-lg leading-relaxed mb-6">
                  Вы заняты. Звоните раз в неделю, спрашиваете «как дела?», слышите «всё хорошо» — и не знаете, правда ли.
                </p>
                <p className="text-slate-500 text-lg leading-relaxed">
                  Внучок общается с мамой каждый день — тёплый, терпеливый, помнит всё о её жизни. А вам каждый вечер присылает сводку: приняла ли таблетки, какое давление, о чём говорили.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-0 md:gap-16 items-center mb-24">
              <div className="order-2 md:order-1 py-8 md:py-0">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 leading-tight">
                  В 2025 году мошенники украли у пожилых 150 млрд ₽
                </h2>
                <p className="text-slate-500 text-lg leading-relaxed mb-6">
                  «Звонят из банка», «внук попал в аварию», «пришла СМС с кодом». Ваша мама — мишень.
                </p>
                <p className="text-slate-500 text-lg leading-relaxed">
                  Внучок распознаёт 20+ схем мошенничества и мгновенно отправляет вам алерт. Не после. Во время.
                </p>
              </div>
              <div className="order-1 md:order-2 relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-100">
                <img
                  src="/images/empty-phone.png"
                  alt="Пустой телефон"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <p className="absolute bottom-6 left-6 right-6 text-white text-lg font-medium leading-snug">
                  Маме позвонили «из ЦБ».
                  <br />
                  <span className="text-white/70 text-base">Она уже диктует код из СМС.</span>
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-0 md:gap-16 items-center">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-100">
                <img
                  src="/images/window-grandma.png"
                  alt="Бабушка у окна"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <p className="absolute bottom-6 left-6 right-6 text-white text-lg font-medium leading-snug">
                  Её истории уйдут вместе с ней.
                  <br />
                  <span className="text-white/70 text-base">Если их не записать сейчас.</span>
                </p>
              </div>
              <div className="py-8 md:py-0">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 leading-tight">
                  Книга жизни — мамины истории навсегда
                </h2>
                <p className="text-slate-500 text-lg leading-relaxed mb-6">
                  Как познакомились с папой. Как вы первый раз пошли. Как пережили 90-е. Всё это — бесценно.
                </p>
                <p className="text-slate-500 text-lg leading-relaxed">
                  Внучок мягко расспрашивает маму и сохраняет её истории. Вы получаете уведомление — и можете прочитать в любой момент.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-white">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
                Что вы получаете
              </h2>
              <p className="text-slate-500 text-lg">
                Не просто чат-бот — система заботы
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: <Shield className="w-6 h-6" />, title: "Защита от мошенников", desc: "20+ схем: банки, ЦБ, «внук в беде», СМС-коды. Мгновенный алерт вам.", bg: "bg-slate-50", iconBg: "bg-slate-100 text-slate-600" },
                { icon: <Bell className="w-6 h-6" />, title: "Напоминания о лекарствах", desc: "Мягко напомнит, проверит. Нет ответа 15 минут — push вам.", bg: "bg-slate-50", iconBg: "bg-slate-100 text-slate-600" },
                { icon: <Eye className="w-6 h-6" />, title: "Ежедневная сводка", desc: "Каждый вечер: активность, давление, настроение, о чём говорили.", bg: "bg-slate-50", iconBg: "bg-slate-100 text-slate-600" },
                { icon: <AlertTriangle className="w-6 h-6" />, title: "Экстренные алерты", desc: "Падение, запах газа, «мне плохо» — мгновенный push с рекомендациями.", bg: "bg-slate-50", iconBg: "bg-slate-100 text-slate-600" },
                { icon: <BookOpen className="w-6 h-6" />, title: "Книга жизни", desc: "Мамины истории записаны и сохранены навсегда. Для вас и для внуков.", bg: "bg-slate-50", iconBg: "bg-slate-100 text-slate-600" },
                { icon: <Mic className="w-6 h-6" />, title: "Голосовые сообщения", desc: "Мама говорит — бот понимает. Не нужно печатать. Ответит тоже голосом.", bg: "bg-slate-50", iconBg: "bg-slate-100 text-slate-600" },
              ].map((f, i) => (
                <div key={i} className={`${f.bg} rounded-2xl p-6 border border-slate-100 hover:border-slate-200 transition-colors`} data-testid={`feature-d-${i}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.iconBg}`}>
                    {f.icon}
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-slate-900">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="dialog" className="py-20 px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
                Как выглядит переписка
              </h2>
              <p className="text-slate-500 text-lg">
                Обычный Telegram — мама уже умеет
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {chatScenarios.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveChat(i)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    activeChat === i
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  data-testid={`chat-tab-d-${i}`}
                >
                  {s.tab}
                </button>
              ))}
            </div>

            <div className="max-w-md mx-auto">
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-200">
                <div className="bg-[#517DA2] px-4 py-3 flex items-center gap-3">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  <div className="w-9 h-9 rounded-full bg-violet-400 flex items-center justify-center text-white font-bold text-sm">
                    В
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-white">Внучок</p>
                    <p className="text-xs text-white/60">онлайн</p>
                  </div>
                  <div className="flex items-center gap-3 text-white/70">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                    </svg>
                  </div>
                </div>

                <div
                  className="p-4 min-h-[320px] space-y-2"
                  style={{
                    background: "linear-gradient(180deg, #B7D0AA 0%, #A8C49A 50%, #9DBF8E 100%)",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2390B580' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                >
                  <p className="text-center text-xs text-white/60 mb-3 font-medium">сегодня</p>
                  {chatScenarios[activeChat].messages.map((msg, i) => (
                    <TelegramBubble key={`${activeChat}-${i}`} from={msg.from} text={msg.text} time={msg.time} />
                  ))}
                </div>

                <div className="bg-white px-3 py-2.5 flex items-center gap-2 border-t border-slate-100">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <div className="flex-1 bg-slate-50 rounded-full px-4 py-2 text-sm text-slate-400">
                    Сообщение
                  </div>
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-slate-400 mt-4">
                {chatScenarios[activeChat].caption}
              </p>
            </div>
          </div>
        </section>

        <section id="how" className="py-20 px-6 bg-white">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
                Подключить маму — 3 минуты
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Вы регистрируетесь", desc: "Создаёте аккаунт и получаете ссылку-приглашение для родителя." },
                { step: "02", title: "Отправляете ссылку маме", desc: "Через Telegram или WhatsApp. Мама нажимает — бот сам начинает знакомство." },
                { step: "03", title: "Внучок работает", desc: "Общается, напоминает, защищает. Вы получаете сводки и алерты." },
              ].map((s, i) => (
                <div key={i} className="text-center" data-testid={`step-d-${i}`}>
                  <div className="text-5xl font-bold text-slate-100 mb-4">{s.step}</div>
                  <h3 className="text-lg font-semibold mb-3 text-slate-900">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
                Почему не Алиса и не ChatGPT
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-5 py-4 font-semibold text-slate-700 border-b border-slate-100 w-1/4"></th>
                    <th className="text-center px-4 py-4 font-semibold text-slate-400 border-b border-slate-100">Алиса</th>
                    <th className="text-center px-4 py-4 font-semibold text-slate-400 border-b border-slate-100">ChatGPT</th>
                    <th className="text-center px-4 py-4 font-semibold text-slate-900 border-b border-slate-200 bg-slate-100">Внучок</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Помнит маму", alice: false, gpt: false, vnuchok: true },
                    { feature: "Алерты ребёнку", alice: false, gpt: false, vnuchok: true },
                    { feature: "Защита от мошенников", alice: false, gpt: false, vnuchok: true },
                    { feature: "Напоминание лекарств", alice: false, gpt: false, vnuchok: true },
                    { feature: "Голосовые в Telegram", alice: false, gpt: false, vnuchok: true },
                    { feature: "Дашборд для ребёнка", alice: false, gpt: false, vnuchok: true },
                    { feature: "Книга жизни", alice: false, gpt: false, vnuchok: true },
                    { feature: "Работает в России", alice: true, gpt: false, vnuchok: true },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="px-5 py-3.5 text-slate-700 border-b border-slate-50 font-medium">{row.feature}</td>
                      <td className="text-center px-4 py-3.5 border-b border-slate-50">
                        {row.alice ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="text-center px-4 py-3.5 border-b border-slate-50">
                        {row.gpt ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="text-center px-4 py-3.5 border-b border-slate-50 bg-slate-50/40">
                        {row.vnuchok ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-white">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
                Истории семей
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote: "Переехал в Питер, мама осталась одна в Самаре. Раньше звонил из чувства долга. Теперь вижу в сводке, что у неё всё ок — и звоню просто поболтать.",
                  name: "Кирилл, 27",
                  parent: "Мама, 58 лет",
                },
                {
                  quote: "Бабушка в деревне. Раньше звонила раз в неделю и мучилась виной. Теперь каждый день вижу: лекарства приняты, пирог испекла.",
                  name: "Ольга, 45",
                  parent: "Бабушка, 78 лет",
                },
                {
                  quote: "Маме позвонили «из Сбербанка». Внучок распознал мошенников и прислал мне алерт. Успел позвонить. Спасибо.",
                  name: "Дмитрий, 38",
                  parent: "Мама, 67 лет",
                },
              ].map((t, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-8 border border-slate-100" data-testid={`testimonial-d-${i}`}>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">
                    &laquo;{t.quote}&raquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-semibold text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.parent}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-4">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
                Дешевле чашки кофе в день
              </h2>
              <p className="text-slate-500 text-lg">
                Начните бесплатно. Подписка — от 490₽/мес.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
              {[
                {
                  name: "Бесплатный", price: "0", period: "", subtitle: "Попробовать",
                  features: ["10 вопросов в день", "Рецепты, погода, транспорт", "Голосовой ввод", "Стихи и загадки"],
                  popular: false, isFree: true,
                },
                {
                  name: "Базовый", price: "490", period: "/мес", subtitle: "Контроль лекарств",
                  features: ["30 вопросов в день", "Напоминания о лекарствах", "Дневник давления", "Лента событий"],
                  popular: false,
                },
                {
                  name: "Стандарт", price: "990", period: "/мес", subtitle: "Полная забота",
                  features: ["100 вопросов в день", "Всё из Базового", "Защита от мошенников", "Бот пишет первым", "Счётчики по фото"],
                  popular: true,
                },
                {
                  name: "Премиум", price: "1 990", period: "/мес", subtitle: "Максимум",
                  features: ["Безлимит вопросов", "Всё из Стандарта", "Настройка личности", "Открытки и картинки", "Расширенная история"],
                  popular: false,
                },
              ].map((plan, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-6 border transition-all ${
                    plan.popular
                      ? "border-slate-900 shadow-lg shadow-slate-200/50 bg-white scale-[1.02]"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                  data-testid={`pricing-d-${plan.name}`}
                >
                  {plan.popular && (
                    <div className="inline-block bg-slate-900 text-white text-xs font-medium px-3 py-1 rounded-full mb-4">
                      Популярный
                    </div>
                  )}
                  <p className="text-sm font-medium text-slate-500 mb-1">{plan.name}</p>
                  <p className="text-sm text-slate-400 mb-4">{plan.subtitle}</p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-slate-900">{plan.price}₽</span>
                    {plan.period && <span className="text-slate-400 text-sm">{plan.period}</span>}
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`w-full rounded-full ${
                      plan.popular
                        ? "bg-slate-900 hover:bg-slate-800 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                    variant={plan.popular ? "default" : "secondary"}
                    data-testid={`button-pricing-d-${plan.name}`}
                  >
                    <Link href="/auth">{plan.isFree ? "Попробовать бесплатно" : "Подключить"}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="py-20 px-6 bg-white">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-slate-900 text-center">
              Вопросы
            </h2>

            <div className="space-y-2">
              {faqItems.map((item, i) => (
                <div
                  key={i}
                  className="border border-slate-100 rounded-xl overflow-hidden"
                >
                  <button
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    data-testid={`faq-d-${i}`}
                  >
                    <span className="font-medium text-slate-800 text-sm">{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-4 ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5 text-slate-500 text-sm leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-slate-900 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  Подключите маму за 3 минуты
                </h2>
                <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
                  Бесплатно — до 10 вопросов в день. Маме нужен только Telegram.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full h-14 px-8 bg-white text-slate-900 hover:bg-slate-100 font-semibold text-base"
                    data-testid="button-cta-app-d"
                  >
                    <Link href="/auth">
                      <Smartphone className="w-5 h-5 mr-2" />
                      Приложение
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full h-14 px-8 bg-white/10 text-white hover:bg-white/20 font-semibold text-base border border-white/20"
                    data-testid="button-cta-max-d"
                  >
                    <a href="#" onClick={(e) => { e.preventDefault(); alert("Скоро!"); }}>
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Бот в MAX
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full h-14 px-8 bg-white/10 text-white hover:bg-white/20 font-semibold text-base border border-white/20"
                    data-testid="button-cta-telegram-d"
                  >
                    <a href="https://t.me/GrandSonGleb_bot" target="_blank" rel="noopener noreferrer">
                      <Send className="w-5 h-5 mr-2" />
                      Бот в Telegram
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-100 py-10 pb-24 md:pb-10 text-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-800">Внучок</span>
              </div>
              <p className="text-slate-400">AI-забота о родителях</p>
            </div>

            <div className="flex flex-col gap-2 text-slate-500">
              <a href="mailto:support@vnuchok.ru" className="flex items-center gap-2 hover:text-slate-800 transition-colors" data-testid="link-footer-email-d">
                <Mail className="w-4 h-4" />
                support@vnuchok.ru
              </a>
              <a href="https://t.me/vnuchok_bot" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-slate-800 transition-colors" data-testid="link-footer-telegram-d">
                <Send className="w-4 h-4" />
                @vnuchok_bot
              </a>
            </div>

            <div className="flex flex-col gap-2 text-slate-500">
              <a href="/privacy" className="hover:text-slate-800 transition-colors" data-testid="link-footer-privacy-d">
                Конфиденциальность
              </a>
              <a href="/pricing" className="hover:text-slate-800 transition-colors" data-testid="link-footer-pricing-d">
                Тарифы
              </a>
            </div>
          </div>

          <div className="border-t border-slate-100 mt-8 pt-6 text-center text-slate-400">
            <p>&copy; 2026 Внучок</p>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-white/90 backdrop-blur-xl border-t border-slate-100 md:hidden">
        <Button
          asChild
          className="w-full rounded-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg"
          data-testid="button-mobile-cta-d"
        >
          <Link href="/auth">Подключить маму — бесплатно</Link>
        </Button>
      </div>
    </div>
  );
}

const chatScenarios = [
  {
    tab: "💊 Лекарства",
    caption: "Утреннее напоминание о лекарствах",
    messages: [
      { from: "bot" as const, text: "Доброе утро! Не забудь выпить эналаприл \u{1F48A}", time: "09:02" },
      { from: "user" as const, text: "Выпила! Спасибо \u{263A}\u{FE0F}", time: "09:15" },
      { from: "bot" as const, text: "Умница! А давление мерила сегодня?", time: "09:15" },
      { from: "user" as const, text: "\u{1F3A4} \u00ABСто двадцать на восемьдесят\u00BB", time: "09:17" },
      { from: "bot" as const, text: "120/80 — идеально! Записала \u2713", time: "09:17" },
    ],
  },
  {
    tab: "\u{1F6E1}\u{FE0F} Мошенники",
    caption: "Внучок распознаёт мошенников",
    messages: [
      { from: "user" as const, text: "Мне позвонили из Сбербанка, говорят карта заблокирована", time: "14:22" },
      { from: "bot" as const, text: "\u{26A0}\u{FE0F} Стоп! Это мошенники. Банк НИКОГДА не звонит и не просит коды. Положи трубку прямо сейчас!", time: "14:22" },
      { from: "user" as const, text: "Они сказали назвать код из СМС", time: "14:23" },
      { from: "bot" as const, text: "НЕ диктуй код! Это точно мошенники. Я уже отправила уведомление твоим близким. Всё будет хорошо \u{1F49B}", time: "14:23" },
    ],
  },
  {
    tab: "\u{1F373} Рецепт",
    caption: "Мама просит помочь с обедом",
    messages: [
      { from: "user" as const, text: "Что приготовить из курицы и картошки?", time: "11:30" },
      { from: "bot" as const, text: "Курица с картошкой в духовке — просто и вкусно! Рассказать пошагово?", time: "11:30" },
      { from: "user" as const, text: "Давай!", time: "11:31" },
      { from: "bot" as const, text: "Картошку дольками, курицу кусочками. Солим, перчим, 3 зубчика чеснока. На противень, чуть масла. Духовка 180\u00B0, 40 минут \u{1F357}", time: "11:31" },
    ],
  },
  {
    tab: "\u{1F3A4} Голос",
    caption: "Мама говорит — бот понимает",
    messages: [
      { from: "user" as const, text: "\u{1F3A4} \u00ABКакая завтра погода в Самаре?\u00BB", time: "18:05" },
      { from: "bot" as const, text: "Завтра в Самаре +12, переменная облачность. Дождя не обещают — хороший день для прогулки! \u{2600}\u{FE0F}", time: "18:06" },
      { from: "user" as const, text: "\u{1F3A4} \u00ABА что приготовить из капусты и картошки\u00BB", time: "18:08" },
      { from: "bot" as const, text: "Щи! Капусту нашинковать, морковь натереть, картошку кубиками. Варить 30 минут, посолить, лавровый лист \u{1F372}", time: "18:08" },
    ],
  },
];

const faqItems = [
  {
    q: "Моей маме 55, она активная. Это не для бабушек?",
    a: "Внучок адаптируется: для 55+ — помощник с рецептами, транспортом, путешествиями. Для 70+ — заботливый друг с напоминаниями и контролем здоровья.",
  },
  {
    q: "А если родитель не разбирается в технике?",
    a: "Достаточно Telegram. Можно говорить голосом — не нужно печатать. Бот сам проведёт знакомство.",
  },
  {
    q: "Чем это лучше обычного звонка?",
    a: "Бот на связи 24/7. А вы получаете алерт, только если что-то не так. И звоните когда действительно нужно — а не из чувства долга.",
  },
  {
    q: "Кто видит переписку?",
    a: "Только вы в личном кабинете. Данные не используются для обучения моделей.",
  },
  {
    q: "Можно отменить подписку?",
    a: "В любой момент, в 1 клик. Бесплатный тариф работает навсегда.",
  },
];

function TelegramBubble({ from, text, time }: { from: "bot" | "user"; text: string; time: string }) {
  return (
    <div className={`flex ${from === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] px-3 py-1.5 text-[13px] leading-[18px] relative ${
          from === "bot"
            ? "bg-white text-slate-800 rounded-lg rounded-tl-sm shadow-sm"
            : "bg-[#DCFDD2] text-slate-800 rounded-lg rounded-tr-sm shadow-sm"
        }`}
        style={{ wordBreak: "break-word" }}
      >
        <span>{text}</span>
        <span className={`text-[10px] ml-2 float-right mt-[3px] flex items-center gap-0.5 ${
          from === "user" ? "text-green-600/50" : "text-slate-400"
        }`}>
          {time}
          {from === "user" && (
            <svg viewBox="0 0 16 11" width="16" height="11" className="text-[#53BDEB]">
              <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 0 0-.336-.153.457.457 0 0 0-.343.144.493.493 0 0 0-.141.358c0 .13.047.248.141.343l2.296 2.394c.093.098.2.149.332.149.132 0 .254-.062.367-.186l6.57-8.09a.415.415 0 0 0 .108-.299.437.437 0 0 0-.108-.277z" fill="currentColor" />
              <path d="M14.329.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.2-1.253-.263.325 1.169 1.22c.093.098.2.149.332.149.132 0 .254-.062.367-.186l6.57-8.09a.415.415 0 0 0 .108-.299.437.437 0 0 0-.108-.277z" fill="currentColor" />
            </svg>
          )}
        </span>
      </div>
    </div>
  );
}
