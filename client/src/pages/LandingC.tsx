import { useState } from "react";
import {
  HeartPulse,
  ArrowRight,
  CheckCircle2,
  Check,
  Star,
  StarHalf,
  Heart,
  MessageCircle,
  Camera,
  ShieldAlert,
  Mic,
  BellRing,
  ChevronDown,
  Gauge,
  FileText,
  Sparkles,
  Lock,
  Quote,
  Zap,
  Shield,
  Eye,
  Clock,
  Train,
  Landmark,
  Pen,
  Image,
  Dumbbell,
  Plane,
  Send,
  Smartphone,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function LandingC() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeChat, setActiveChat] = useState(0);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F4F2] selection:bg-[#EADDE4]/60 text-slate-900">
      <nav className="fixed top-0 w-full z-50 bg-[#F6F4F2]/70 backdrop-blur-xl border-b border-white/40 py-5">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-white/70 border border-white/60 p-2">
              <Heart className="w-5 h-5 text-[#143A2E]" fill="#143A2E" />
            </div>
            <span className="font-serif font-medium text-xl tracking-tight text-slate-900">
              Внучок
            </span>
          </div>
          <div className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-600/80 tracking-wide">
            <a href="#parents" className="hover:text-slate-900 transition-all duration-300" data-testid="link-nav-parents-c">
              Для кого
            </a>
            <a href="#features" className="hover:text-slate-900 transition-all duration-300" data-testid="link-nav-features-c">
              Возможности
            </a>
            <a href="#pricing" className="hover:text-slate-900 transition-all duration-300" data-testid="link-nav-pricing-c">
              Тарифы
            </a>
          </div>
          <Button
            asChild
            className="rounded-xl px-6 transition-all duration-300 bg-[#143A2E] hover:bg-[#0F2F25] text-white shadow-[0_12px_30px_-16px_rgba(20,58,46,.65)]"
            data-testid="button-nav-cta-c"
          >
            <Link href="/auth">Попробовать бесплатно</Link>
          </Button>
        </div>
      </nav>

      <main>
        <section className="pt-36 pb-24 md:pt-44 md:pb-36 px-6 overflow-hidden bg-gradient-to-br from-[#F3E7ED] via-[#F7F2EC] to-[#F3F1EE]">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="max-w-2xl relative z-10">
                <Badge
                  variant="secondary"
                  className="mb-8 bg-white/60 text-[#5F626B] hover:bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/50 flex items-center gap-2 w-fit"
                  data-testid="badge-hero-c"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Бесплатно в Telegram — говорит голосом
                </Badge>
                <h1 className="text-5xl md:text-7xl font-serif font-medium leading-[1.03] tracking-[-0.02em] mb-8 text-slate-900">
                  Спокойствие{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#143A2E] to-[#2D6A4F]">
                    за маму и папу
                  </span>
                  {" "}— каждый день
                </h1>
                <p className="text-lg text-[#5F626B] mb-10 leading-relaxed">
                  Вы заняты — но всегда знаете, что с родителями всё в порядке.
                  Внучок заботится о них в Telegram: напомнит лекарства, защитит
                  от мошенников, расскажет рецепт. Родитель говорит голосом —
                  не нужно печатать.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl text-base h-14 px-8 bg-[#143A2E] hover:bg-[#0F2F25] text-white shadow-[0_12px_30px_-16px_rgba(20,58,46,.65)] transition-all duration-300"
                    data-testid="button-hero-gift-c"
                  >
                    <Link href="/auth">
                      Подарить маме помощника <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-xl text-base h-14 px-8 bg-white/70 border-white/60 backdrop-blur hover:bg-white/90 text-slate-700 transition-all duration-300"
                    data-testid="button-hero-demo-c"
                  >
                    <a href="#dialog">Как это выглядит</a>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-[#5F626B]" data-testid="badge-risk-reversal-c">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                    Бесплатно — до 10 вопросов в день
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Отмена подписки в 1 клик
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-emerald-500" />
                    Понимает голосовые
                  </span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-slate-100 to-slate-50 rounded-full blur-3xl -z-10" />

                <div className="relative mx-auto" style={{ maxWidth: "320px" }}>
                  <div className="bg-slate-800 rounded-[2.5rem] p-3 shadow-2xl shadow-slate-300/50 border-4 border-slate-700">
                    <div className="bg-slate-800 rounded-full w-24 h-5 mx-auto mb-2 flex items-center justify-center">
                      <div className="w-12 h-3 bg-slate-900 rounded-full" />
                    </div>

                    <div className="bg-slate-50 rounded-[1.5rem] overflow-hidden">
                      <div className="bg-[#517DA2] px-4 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-400 flex items-center justify-center text-white font-bold text-xs">В</div>
                        <div>
                          <p className="font-semibold text-xs text-white">Внучок</p>
                          <p className="text-[10px] text-white/60">онлайн</p>
                        </div>
                      </div>

                      <div className="space-y-2 p-3 min-h-[200px]">
                        {[
                          { side: "left", text: "Доброе утро! Не забудь выпить эналаприл 💊", delay: "0ms" },
                          { side: "right", text: "Выпила! Спасибо ☺️", delay: "600ms" },
                          { side: "left", text: "Умница! А давление мерила сегодня?", delay: "1200ms" },
                          { side: "right", text: "🎤 «Сто двадцать на восемьдесят»", delay: "1800ms" },
                          { side: "left", text: "120/80 — идеально! Записала ✓", delay: "2400ms" },
                        ].map((msg, i) => (
                          <div key={i} className={`flex ${msg.side === "right" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`} style={{ animationDelay: msg.delay, animationFillMode: "backwards" }}>
                            <div className={`rounded-2xl px-3 py-2 text-xs text-slate-800 max-w-[85%] ${msg.side === "left" ? "bg-white rounded-bl-md shadow-sm" : "bg-green-200 rounded-br-md"}`}>
                              {msg.text}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="px-3 pb-3">
                        <div className="flex gap-1.5 justify-center">
                          {["💊", "🏠", "🎭", "📋"].map((emoji, i) => (
                            <div key={i} className="bg-slate-200 rounded-lg px-3 py-1.5 text-sm">{emoji}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -bottom-4 -right-4 bg-white/90 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 border border-white/40 shadow-xl shadow-slate-200/50 animate-in slide-in-from-bottom-4 duration-700 delay-300 max-w-[220px]">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">
                        Мама приняла лекарство ✓
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Давление в норме
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 bg-gradient-to-b from-[#F8F5F2] to-[#F4F1EE] border-b border-white/40">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto text-center">
              <div data-testid="social-proof-families">
                <p className="text-2xl md:text-3xl font-serif font-medium text-slate-900">1 200+</p>
                <p className="text-xs md:text-sm text-[#5F626B] mt-1">семей подключили</p>
              </div>
              <div data-testid="social-proof-messages">
                <p className="text-2xl md:text-3xl font-serif font-medium text-slate-900">15 000+</p>
                <p className="text-xs md:text-sm text-[#5F626B] mt-1">сообщений в день</p>
              </div>
              <div data-testid="social-proof-meds">
                <p className="text-2xl md:text-3xl font-serif font-medium text-slate-900">98%</p>
                <p className="text-xs md:text-sm text-[#5F626B] mt-1">лекарств напомнены вовремя</p>
              </div>
            </div>
          </div>
        </section>

        <section id="outcomes" className="py-28 md:py-32 bg-gradient-to-b from-[#F8F5F2] to-[#F4F1EE] relative">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                Что вы получаете
              </h2>
              <p className="text-[#5F626B] text-lg">
                Конкретные уведомления и данные — а не просто «заботу»
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <OutcomeCard
                icon={<BellRing className="w-8 h-8" />}
                title="Push если лекарство не принято"
                description="Бот напомнит родителю. Нет подтверждения за 15 минут — вы получите уведомление. Не нужно звонить и спрашивать."
                color="bg-rose-50 text-rose-500"
              />
              <OutcomeCard
                icon={<ShieldAlert className="w-8 h-8" />}
                title="Алерт при звонке мошенников"
                description="Бот распознаёт 8 типов мошенничества: «банковские сотрудники», «внук в беде», лотереи. Мгновенно предупредит вас."
                color="bg-slate-50 text-slate-500"
              />
              <OutcomeCard
                icon={<Eye className="w-8 h-8" />}
                title="Дашборд: всё в одном месте"
                description="Давление, настроение, лекарства, счётчики — в личном кабинете. Статус «Всё хорошо» или «Требует внимания»."
                color="bg-blue-50 text-blue-500"
              />
            </div>

            <div className="max-w-2xl mx-auto mt-12 text-center">
              <div className="rounded-[28px] bg-white/78 backdrop-blur-sm border border-white/65 shadow-[0_24px_60px_-32px_rgba(49,35,45,.2)] p-6 relative">
                <Quote className="w-8 h-8 text-slate-200 absolute top-4 left-4" />
                <p className="text-slate-700 text-base leading-relaxed italic pl-8">
                  Вы открываете кабинет утром, видите <span className="font-semibold text-green-600">«Всё хорошо»</span> — и спокойно идёте на работу. А вечером мама сама расскажет, какой пирог испекла.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="parents" className="py-28 md:py-32 bg-gradient-to-b from-[#F3F0F4] to-[#EEF2F6]">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                Узнаёте своего родителя?
              </h2>
              <p className="text-[#5F626B] text-lg">
                Внучок подстраивается под каждого
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <ParentCard
                emoji="💃"
                archetype="Активный родитель 50+"
                childQuote="Мама вышла на пенсию и не знает, чем заняться. Скучает, когда мы заняты. Ей не хватает общения."
                botHelp="Рецепты, афиша, кино, стихи, загадки. Тёплый собеседник на каждый день — как подружка, которая всегда на связи."
                color="bg-slate-50 border-slate-100"
                iconColor="text-slate-600"
              />
              <ParentCard
                emoji="📱"
                archetype="С техникой сложно 60+"
                childQuote="Папа опять звонит: «Я нажал что-то и всё пропало». Объяснять по видеозвонку — мучение для обоих."
                botHelp="Пошагово объяснит: как оплатить ЖКХ, записаться к врачу, отправить фото, разобраться с Госуслугами."
                color="bg-blue-50 border-blue-100"
                iconColor="text-blue-600"
              />
              <ParentCard
                emoji="💊"
                archetype="Нужна забота 70+"
                childQuote="Живёт одна, забывает лекарства. Боюсь, что позвонят мошенники — и она поверит."
                botHelp="Напомнит про таблетки, запишет давление, распознает мошенника и мгновенно пришлёт вам алерт."
                color="bg-rose-50 border-rose-100"
                iconColor="text-rose-600"
              />
            </div>
          </div>
        </section>

        <section className="py-28 md:py-32 bg-gradient-to-b from-[#F8F5F2] to-[#F4F1EE]">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                Как это работает
              </h2>
              <p className="text-[#5F626B] text-lg">
                Три шага — и ваш родитель под заботливым присмотром
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <StepCard
                step="1"
                title="Отправьте ссылку"
                description="Пришлите родителю ссылку на бота в Telegram. Ничего устанавливать не нужно — только Telegram."
              />
              <StepCard
                step="2"
                title="Бот знакомится сам"
                description="Спросит имя, город, возраст, интересы. Покажет погоду и предложит попробовать. Родитель говорит голосом — не нужно печатать."
              />
              <StepCard
                step="3"
                title="Вы спокойны"
                description="В личном кабинете видите всё: лекарства, давление, настроение. Алерт — если что-то не так."
              />
            </div>
          </div>
        </section>

        <section id="dialog" className="py-28 md:py-32 bg-gradient-to-b from-[#F3F0F4] to-[#EEF2F6]">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                Живой диалог с Внучком
              </h2>
              <p className="text-slate-600 text-lg">
                Разные родители — разные разговоры
              </p>
            </div>

            <div className="max-w-lg mx-auto">
              <div className="flex gap-2 mb-4 justify-center flex-wrap">
                {chatScenarios.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveChat(i)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeChat === i
                        ? "bg-[#143A2E] text-white shadow-md"
                        : "bg-white/70 text-[#5F626B] border border-white/60 backdrop-blur-sm hover:bg-white/90"
                    }`}
                    data-testid={`chat-tab-${i}`}
                  >
                    {s.tab}
                  </button>
                ))}
              </div>

              <div className="mx-auto" style={{ maxWidth: "380px" }}>
                <div className="rounded-[2rem] p-1 bg-white/78 backdrop-blur-sm border border-white/65 shadow-[0_24px_60px_-32px_rgba(49,35,45,.35)]">
                  <div className="bg-slate-50 rounded-[1.75rem] overflow-hidden">
                    <div className="bg-[#517DA2] px-4 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-400 flex items-center justify-center text-white font-bold text-sm">В</div>
                      <div>
                        <p className="font-semibold text-sm text-white">Внучок</p>
                        <p className="text-xs text-white/60">онлайн</p>
                      </div>
                    </div>

                    <div className="space-y-3 p-4 min-h-[220px]">
                      {chatScenarios[activeChat].messages.map((msg, i) => (
                        <ChatBubble key={`${activeChat}-${i}`} from={msg.from} text={msg.text} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-slate-400 mt-4">
                {chatScenarios[activeChat].caption}
              </p>
            </div>
          </div>
        </section>

        <section id="dashboard-section" className="py-28 md:py-32 bg-gradient-to-b from-[#F8F5F2] to-[#F4F1EE] relative overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="rounded-[28px] bg-white/78 backdrop-blur-sm border border-white/65 shadow-[0_24px_60px_-32px_rgba(49,35,45,.35)] p-6">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-semibold text-lg">Ваш личный кабинет</h3>
                      <p className="text-sm text-slate-500">Татьяна Николаевна (Мама)</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
                      Всё хорошо
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <DashboardRow
                      icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
                      bgColor="bg-green-50 border-green-100"
                      iconBg="bg-green-100"
                      title="Лекарства приняты"
                      subtitle="Эналаприл, 1 таб. — подтверждено"
                      time="Сегодня, 08:30"
                    />
                    <DashboardRow
                      icon={<HeartPulse className="w-5 h-5 text-blue-600" />}
                      bgColor="bg-blue-50 border-blue-100"
                      iconBg="bg-blue-100"
                      title="Давление записано"
                      subtitle="130/85 — в пределах нормы"
                      time="Сегодня, 09:15"
                    />
                    <DashboardRow
                      icon={<MessageCircle className="w-5 h-5 text-slate-600" />}
                      bgColor="bg-slate-50 border-slate-100"
                      iconBg="bg-slate-100"
                      title="Утренний чек-ин пройден"
                      subtitle="Настроение хорошее, планирует испечь пирог"
                      time="Сегодня, 09:20"
                    />
                    <DashboardRow
                      icon={<FileText className="w-5 h-5 text-emerald-600" />}
                      bgColor="bg-slate-50 border-slate-100"
                      iconBg="bg-emerald-100"
                      title="Показания воды отправлены"
                      subtitle="ГВС: 142.3, ХВС: 284.7"
                      time="Вчера, 18:20"
                    />
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-6 text-slate-900">
                  Вы видите всё.
                  <br />
                  Без навязчивых звонков.
                </h2>
                <p className="text-lg text-[#5F626B] mb-8">
                  В личном кабинете — полная картина дня.
                  Лекарства, давление, настроение, счётчики — всё в одном месте.
                </p>

                <ul className="space-y-4 mb-8">
                  {[
                    "Статус «Всё хорошо» или «Требует внимания»",
                    "Лента событий за день в реальном времени",
                    "Алерт за 15 минут если лекарство не принято",
                    "Мгновенное уведомление при подозрительной активности",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl bg-white/70 border-white/60 backdrop-blur hover:bg-white/90 text-slate-700 transition-all duration-300"
                  data-testid="button-demo-dashboard-c"
                >
                  <Link href="/dashboard">Открыть демо кабинета</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-28 md:py-32 bg-gradient-to-b from-[#F3F0F4] to-[#EEF2F6] relative">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                16+ навыков на каждый день
              </h2>
              <p className="text-[#5F626B] text-lg">
                От рецептов и транспорта до защиты от мошенников
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<BellRing />}
                title="Напоминания о лекарствах"
                description="Напомнит выпить таблетки. Нет подтверждения 15 мин — вы получите алерт."
                color="bg-rose-50 text-rose-500"
                borderColor="border-rose-100"
              />
              <FeatureCard
                icon={<Gauge />}
                title="Дневник давления"
                description="Родитель называет цифры — бот записывает. Вы видите тренды в кабинете."
                color="bg-blue-50 text-blue-500"
                borderColor="border-blue-100"
              />
              <FeatureCard
                icon={<ShieldAlert />}
                title="Защита от мошенников"
                description="Распознаёт 8 типов мошенничества. Предупредит родителя и оповестит вас."
                color="bg-slate-50 text-slate-500"
                borderColor="border-slate-100"
              />
              <FeatureCard
                icon={<Mic />}
                title="Голосовые сообщения"
                description="Родитель говорит — получает голос. Никаких кнопок, как разговор."
                color="bg-purple-50 text-purple-500"
                borderColor="border-purple-100"
              />
              <FeatureCard
                icon={<MessageCircle />}
                title="Рецепты и кулинария"
                description="Пошаговые рецепты из того, что есть дома. С учётом диет и ограничений."
                color="bg-cyan-50 text-cyan-500"
                borderColor="border-cyan-100"
              />
              <FeatureCard
                icon={<Camera />}
                title="Счётчики и ЖКХ"
                description="Фотографирует счётчик — ИИ распознаёт цифры. Подскажет как оплатить."
                color="bg-emerald-50 text-emerald-500"
                borderColor="border-emerald-100"
              />
            </div>

            {showAllFeatures && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 animate-in slide-in-from-top-4 duration-300">
                <FeatureCard
                  icon={<Train />}
                  title="Транспорт"
                  description="Расписание электричек, автобусов, маршруты. Просто скажите куда надо."
                  color="bg-indigo-50 text-indigo-500"
                  borderColor="border-indigo-100"
                />
                <FeatureCard
                  icon={<Landmark />}
                  title="Льготы и госуслуги"
                  description="Какие выплаты положены, как оформить. Пошаговая помощь с Госуслугами."
                  color="bg-teal-50 text-teal-500"
                  borderColor="border-teal-100"
                />
                <FeatureCard
                  icon={<Pen />}
                  title="Стихи и загадки"
                  description="Стихотворение по настроению, загадки для ума. Каждый раз — новые."
                  color="bg-pink-50 text-pink-500"
                  borderColor="border-pink-100"
                />
                <FeatureCard
                  icon={<Image />}
                  title="Открытки"
                  description="Красивые открытки для друзей и родных — бот нарисует по пожеланию."
                  color="bg-violet-50 text-violet-500"
                  borderColor="border-violet-100"
                />
                <FeatureCard
                  icon={<Dumbbell />}
                  title="Зарядка для здоровья"
                  description="Простые упражнения для суставов, спины, шеи. С учётом возраста."
                  color="bg-lime-50 text-lime-500"
                  borderColor="border-lime-100"
                />
                <FeatureCard
                  icon={<Plane />}
                  title="Путешествия"
                  description="Куда поехать, что посмотреть рядом, санатории и экскурсии."
                  color="bg-sky-50 text-sky-500"
                  borderColor="border-sky-100"
                />
              </div>
            )}

            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllFeatures(!showAllFeatures)}
                className="inline-flex items-center gap-2 text-slate-700 font-medium hover:text-slate-800 transition-colors"
                aria-expanded={showAllFeatures}
                data-testid="button-toggle-features"
              >
                {showAllFeatures ? "Свернуть" : "И ещё 6 навыков"}
                <ChevronDown className={`w-4 h-4 transition-transform ${showAllFeatures ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
        </section>

        <section id="reviews" className="py-28 md:py-32 bg-gradient-to-b from-[#F8F5F2] to-[#F4F1EE]">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                Истории семей
              </h2>
              <p className="text-[#5F626B] text-lg">
                Те, кто уже подарил родителям Внучка
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <TestimonialCard
                name="Кирилл Новиков"
                age={27}
                city="Санкт-Петербург"
                parentType="Мама, 58 лет, в Самаре"
                quote="Переехал в Питер, мама осталась одна в Самаре. Раньше звонил из чувства долга и всегда торопился. Теперь вижу в кабинете, что у неё всё ок — и звоню просто поболтать."
                rating={5}
              />
              <TestimonialCard
                name="Дмитрий Волков"
                age={42}
                city="Казань"
                parentType="Папа, 64 года"
                quote="Папа наконец сам оплачивает ЖКХ и записывается к врачу. Внучок объяснил пошагово то, что я пытался показать по видеозвонку три месяца."
                rating={5}
              />
              <TestimonialCard
                name="Ольга Козлова"
                age={45}
                city="Новосибирск"
                parentType="Бабушка, 78 лет"
                quote="Бабушка в деревне. Раньше звонила раз в неделю и мучилась виной. Теперь каждый день вижу: лекарства приняты, пирог испекла, всё хорошо."
                rating={5}
              />
              <TestimonialCard
                name="Анна Белова"
                age={31}
                city="Екатеринбург"
                parentType="Мама, 62 года"
                quote="Перестала звонить маме из чувства вины. Теперь звоню потому что хочу. А мама довольна — у неё появился «внук», который всё знает. Хотелось бы ещё интеграцию с календарём."
                rating={4.5}
              />
            </div>
          </div>
        </section>

        <section id="pricing" className="py-28 md:py-32 bg-gradient-to-b from-[#F3F0F4] to-[#EEF2F6]">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-4">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                Дешевле букета цветов в месяц
              </h2>
              <p className="text-[#5F626B] text-lg">
                Начните бесплатно — до 10 вопросов в день. Подписка — от 490₽/мес.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mt-12">
              <PricingCard
                name="Бесплатный"
                price="0"
                isFree
                subtitle="Попробовать"
                result="10 вопросов в день — навсегда"
                features={[
                  "10 вопросов в день",
                  "Рецепты, погода, транспорт",
                  "Стихи, загадки, открытки",
                  "Голосовой ввод",
                ]}
              />
              <PricingCard
                name="Базовый"
                price="490"
                subtitle="Контроль лекарств"
                result="Вы знаете, что родитель принял лекарства"
                features={[
                  "30 вопросов в день",
                  "Напоминания о лекарствах",
                  "Дневник давления",
                  "Лента событий",
                ]}
              />
              <PricingCard
                name="Стандарт"
                price="990"
                popular
                subtitle="Полная забота"
                result="Родитель не одинок — и вы спокойны"
                features={[
                  "100 вопросов в день",
                  "Все из Базового",
                  "Защита от мошенников",
                  "Бот пишет первым",
                  "Распознавание счётчиков",
                ]}
              />
              <PricingCard
                name="Премиум"
                price="1 990"
                subtitle="Максимум"
                result="Полная автоматизация заботы"
                features={[
                  "Безлимит вопросов",
                  "Все из Стандарта",
                  "Настройка личности бота",
                  "Открытки и картинки",
                  "Расширенная история",
                ]}
              />
            </div>

            <div className="max-w-4xl mx-auto mt-12 relative">
              <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse rounded-[28px] overflow-hidden bg-white/75 backdrop-blur border border-white/60 shadow-[0_24px_60px_-32px_rgba(49,35,45,.2)]">
                <thead>
                  <tr className="bg-gradient-to-r from-[#F3E9F0] to-[#EDF2F8]">
                    <th className="text-left px-4 py-3 font-semibold text-slate-700 border-b border-white/40">Возможность</th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-700 border-b border-white/40">Бесплатный</th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-700 border-b border-white/40">Базовый</th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-700 border-b border-white/40 bg-[#F5EDF3]">Стандарт</th>
                    <th className="text-center px-3 py-3 font-semibold text-slate-700 border-b border-white/40">Премиум</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white/60" : "bg-white/30"}>
                      <td className="px-4 py-3 text-slate-700 border-b border-white/40">{row.feature}</td>
                      <td className="text-center px-3 py-3 border-b border-white/40">{renderComparisonValue(row.free)}</td>
                      <td className="text-center px-3 py-3 border-b border-white/40">{renderComparisonValue(row.basic)}</td>
                      <td className="text-center px-3 py-3 border-b border-white/40 bg-[#F5EDF3]/30">{renderComparisonValue(row.standard)}</td>
                      <td className="text-center px-3 py-3 border-b border-white/40">{renderComparisonValue(row.premium)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none md:hidden" />
            </div>

            <p className="text-center text-sm text-slate-500 mt-8" data-testid="text-risk-reversal-c">
              Бесплатный тариф навсегда · Отмена подписки в 1 клик
            </p>

            <div className="text-center mt-4">
              <Button
                asChild
                variant="link"
                className="text-slate-700"
                data-testid="link-pricing-details-c"
              >
                <Link href="/pricing">Подробнее о тарифах</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="faq" className="py-28 md:py-32 bg-gradient-to-b from-[#F8F5F2] to-[#F4F1EE]">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                Частые вопросы
              </h2>
            </div>

            <div className="max-w-2xl mx-auto space-y-3">
              {faqItems.map((item, i) => (
                <div
                  key={i}
                  className="rounded-[20px] bg-white/78 backdrop-blur-sm border border-white/65 shadow-[0_8px_30px_-16px_rgba(49,35,45,.15)] overflow-hidden"
                >
                  <button
                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-answer-${i}`}
                    data-testid={`faq-toggle-c-${i}`}
                  >
                    <span className="font-semibold text-slate-800">{item.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ml-2 ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div id={`faq-answer-${i}`} role="region" className="px-6 pb-5 text-slate-600 text-sm leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-28 md:py-32 px-6">
          <div className="container mx-auto">
            <div className="bg-gradient-to-br from-[#143A2E] to-[#0A1F17] rounded-[3rem] p-8 md:p-16 text-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

              <div className="relative z-10 max-w-2xl mx-auto">
                <Sparkles className="w-12 h-12 mx-auto mb-6 text-emerald-300/60" />
                <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-[-0.02em] mb-6 text-white">
                  Подарите маме помощника <br /> за 3 минуты
                </h2>
                <p className="text-emerald-100/70 text-lg mb-10">
                  Бесплатно — до 10 вопросов в день. Родителю не нужно ничего устанавливать — только Telegram.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl h-14 px-8 bg-white text-[#143A2E] hover:bg-white/90 font-semibold text-base transition-all duration-300 shadow-[0_12px_30px_-16px_rgba(255,255,255,.3)]"
                    data-testid="button-cta-app-c"
                  >
                    <Link href="/auth">
                      <Smartphone className="w-5 h-5 mr-2" />
                      Приложение
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl h-14 px-8 bg-white/10 text-white hover:bg-white/20 font-semibold text-base border border-white/20 backdrop-blur-sm transition-all duration-300"
                    data-testid="button-cta-max-c"
                  >
                    <a href="#" onClick={(e) => { e.preventDefault(); alert("Скоро!"); }}>
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Бот в MAX
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl h-14 px-8 bg-white/10 text-white hover:bg-white/20 font-semibold text-base border border-white/20 backdrop-blur-sm transition-all duration-300"
                    data-testid="button-cta-telegram-c"
                  >
                    <a href="https://t.me/GrandSonGleb_bot" target="_blank" rel="noopener noreferrer">
                      <Send className="w-5 h-5 mr-2" />
                      Бот в Telegram
                    </a>
                  </Button>
                </div>
                <p className="mt-6 text-sm text-emerald-200/50">
                  Подписка от 490₽/мес для напоминаний и расширенных лимитов
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-12 pb-24 md:pb-12 text-slate-400 text-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-2 text-white mb-3">
                <Heart className="w-5 h-5 text-slate-400" />
                <span className="font-bold tracking-tight">Внучок</span>
              </div>
              <p className="text-slate-500">Забота о родителях с помощью ИИ</p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-white font-semibold text-sm mb-1">Контакты</h4>
              <a href="mailto:support@vnuchok.ru" className="flex items-center gap-2 hover:text-slate-300 transition-colors" data-testid="link-footer-email">
                <Mail className="w-4 h-4" />
                support@vnuchok.ru
              </a>
              <a href="https://t.me/vnuchok_bot" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-slate-300 transition-colors" data-testid="link-footer-telegram">
                <Send className="w-4 h-4" />
                @vnuchok_bot в Telegram
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-white font-semibold text-sm mb-1">Информация</h4>
              <a href="/privacy" className="hover:text-slate-300 transition-colors" data-testid="link-footer-privacy">
                Политика конфиденциальности
              </a>
              <a href="#faq" className="hover:text-slate-300 transition-colors" data-testid="link-footer-faq">
                Частые вопросы
              </a>
              <a href="/pricing" className="hover:text-slate-300 transition-colors" data-testid="link-footer-pricing">
                Тарифы
              </a>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-6 text-center text-slate-500">
            <p>© 2026 Внучок. Забота о родителях с помощью ИИ.</p>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#F6F4F2]/80 backdrop-blur-xl border-t border-white/40 md:hidden">
        <Button
          asChild
          className="w-full rounded-xl h-12 bg-[#143A2E] hover:bg-[#0F2F25] text-white font-semibold shadow-[0_12px_30px_-16px_rgba(20,58,46,.65)] transition-all duration-300"
          data-testid="button-mobile-cta-c"
        >
          <Link href="/auth">Подарить маме помощника — бесплатно</Link>
        </Button>
      </div>
    </div>
  );
}

const chatScenarios = [
  {
    tab: "🍳 Рецепт",
    caption: "Мама просит помочь с обедом",
    messages: [
      { from: "user" as const, text: "Внучок, что приготовить из курицы и картошки?" },
      { from: "bot" as const, text: "О, отличный набор! Давай курицу с картошкой в духовке — просто и вкусно. Рассказать пошагово?" },
      { from: "user" as const, text: "Давай!" },
      { from: "bot" as const, text: "Картошку дольками, курицу кусочками. Солим, перчим, 3 зубчика чеснока. На противень, чуть масла. Духовка 180°, 40 минут. Когда корочка золотистая — готово! 🍗" },
    ],
  },
  {
    tab: "💊 Здоровье",
    caption: "Утреннее напоминание",
    messages: [
      { from: "bot" as const, text: "Доброе утро! Не забудь выпить эналаприл. Как самочувствие?" },
      { from: "user" as const, text: "Выпила. Голова кружится немного" },
      { from: "bot" as const, text: "Записала ✓ А давление мерила? Давай проверим." },
      { from: "user" as const, text: "118 на 75" },
      { from: "bot" as const, text: "118/75 — чуть ниже обычного, отсюда головокружение. Посиди спокойно, выпей водички. Если через час не пройдёт — скажи мне 💛" },
    ],
  },
  {
    tab: "📱 Техника",
    caption: "Папа просит помочь",
    messages: [
      { from: "user" as const, text: "Как записаться к терапевту через Госуслуги?" },
      { from: "bot" as const, text: "Открой приложение Госуслуги. На главной нажми «Здоровье». Видишь?" },
      { from: "user" as const, text: "Да, вижу" },
      { from: "bot" as const, text: "Теперь «Записаться к врачу» → выбери поликлинику → «Терапевт» → дату и время. Если что не получится — пиши, разберёмся!" },
    ],
  },
  {
    tab: "🎤 Голос",
    caption: "Мама отправляет голосовое — бот понимает",
    messages: [
      { from: "user" as const, text: "🎤 «Внучок, какая завтра погода в Самаре?»" },
      { from: "bot" as const, text: "Завтра в Самаре +12, переменная облачность. Дождя не обещают — хороший день для прогулки! ☀️" },
      { from: "user" as const, text: "🎤 «А что приготовить на обед из того что есть — капуста, морковка, картошка»" },
      { from: "bot" as const, text: "Щи! Классика. Капусту нашинковать, морковь натереть, картошку кубиками. Всё в кастрюлю, залить водой, варить 30 минут. Посолить, лавровый лист. Готово! 🍲" },
    ],
  },
];

const comparisonRows = [
  { feature: "Вопросов в день", free: "10", basic: "30", standard: "100", premium: "∞" },
  { feature: "Напоминания о лекарствах", free: false, basic: true, standard: true, premium: true },
  { feature: "Дневник давления", free: false, basic: true, standard: true, premium: true },
  { feature: "Защита от мошенников", free: false, basic: false, standard: true, premium: true },
  { feature: "Голосовой ввод", free: true, basic: true, standard: true, premium: true },
  { feature: "Бот пишет первым", free: false, basic: false, standard: true, premium: true },
  { feature: "Счётчики по фото", free: false, basic: false, standard: true, premium: true },
  { feature: "Открытки и картинки", free: false, basic: false, standard: false, premium: true },
];

function renderComparisonValue(val: boolean | string) {
  if (val === true) return <Check className="w-4 h-4 text-green-500 mx-auto" />;
  if (val === false) return <span className="text-slate-300">—</span>;
  return <span className="font-medium text-slate-700">{val}</span>;
}

const faqItems = [
  {
    q: "Моей маме 55, она активная. Это не для бабушек?",
    a: "Внучок — не только про лекарства. Это ежедневный помощник: рецепты, транспорт, льготы, путешествия, стихи. Бот адаптируется под возраст: для 55+ — деловой помощник, для 70+ — заботливый друг.",
  },
  {
    q: "А если родитель не разбирается в технике?",
    a: "Достаточно Telegram на телефоне — бот сам начнёт диалог и проведёт знакомство. Можно говорить голосом — не нужно печатать. Никаких сложных кнопок.",
  },
  {
    q: "Чем это лучше обычного звонка?",
    a: "Бот на связи 24/7: напомнит о лекарствах, поможет с ЖКХ, найдёт рецепт, расскажет расписание электричек. А вы получите алерт, только если что-то не так — и позвоните когда действительно нужно.",
  },
  {
    q: "А если бот ошибётся с лекарствами?",
    a: "Внучок напоминает принять назначенные лекарства, но не назначает их. При любых вопросах о здоровье рекомендует обратиться к врачу. Бот — помощник, не замена медицины.",
  },
  {
    q: "Кто видит переписку?",
    a: "Только вы в личном кабинете. Данные не используются для обучения моделей. Бот распознаёт мошенников и мгновенно предупреждает вас.",
  },
  {
    q: "Можно отменить подписку?",
    a: "В любой момент, в 1 клик. Бесплатный тариф (10 вопросов/день) работает без подписки и навсегда.",
  },
  {
    q: "Сколько стоит?",
    a: "Бесплатно — до 10 вопросов в день, навсегда. Базовый тариф — 490₽/мес (30 вопросов + напоминания). Популярный — 990₽/мес (100 вопросов + защита от мошенников). Премиум — 1 990₽/мес (безлимит).",
  },
];

function OutcomeCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="text-center p-8 rounded-[28px] bg-white/78 backdrop-blur-sm border border-white/65 shadow-[0_24px_60px_-32px_rgba(49,35,45,.35)] hover:-translate-y-0.5 hover:shadow-[0_30px_70px_-30px_rgba(49,35,45,.4)] transition-all duration-300" data-testid={`outcome-card-${title}`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto ${color}`}>
        {icon}
      </div>
      <h3 className="text-lg font-serif font-medium mb-3 text-slate-900">{title}</h3>
      <p className="text-[#5F626B] text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function ParentCard({
  emoji,
  archetype,
  childQuote,
  botHelp,
  color,
  iconColor,
}: {
  emoji: string;
  archetype: string;
  childQuote: string;
  botHelp: string;
  color: string;
  iconColor: string;
}) {
  return (
    <div className={`rounded-[28px] p-6 bg-white/78 backdrop-blur-sm border border-white/65 shadow-[0_24px_60px_-32px_rgba(49,35,45,.35)] hover:-translate-y-0.5 hover:shadow-[0_30px_70px_-30px_rgba(49,35,45,.4)] transition-all duration-300`} data-testid={`parent-card-${archetype.replace(/\s+/g, "-")}`}>
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className={`text-lg font-serif font-medium mb-3 ${iconColor}`}>{archetype}</h3>
      <p className="text-sm text-slate-600 mb-4 italic">«{childQuote}»</p>
      <div className="pt-3 border-t border-slate-100">
        <p className="text-sm text-slate-700 flex gap-2">
          <span className="text-emerald-500 shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          {botHelp}
        </p>
      </div>
    </div>
  );
}

function DashboardRow({
  icon,
  bgColor,
  iconBg,
  title,
  subtitle,
  time,
}: {
  icon: React.ReactNode;
  bgColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  time: string;
}) {
  return (
    <div className={`p-4 rounded-2xl ${bgColor} border flex items-start gap-4`}>
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0 mt-1`}>
        {icon}
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        <p className="text-[10px] text-slate-400 mt-2">{time}</p>
      </div>
    </div>
  );
}

function TestimonialCard({
  name,
  age,
  city,
  parentType,
  quote,
  rating,
}: {
  name: string;
  age: number;
  city: string;
  parentType: string;
  quote: string;
  rating: number;
}) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;

  return (
    <div className="p-8 rounded-[28px] bg-white/78 backdrop-blur-sm border border-white/65 shadow-[0_24px_60px_-32px_rgba(49,35,45,.35)] hover:-translate-y-0.5 hover:shadow-[0_30px_70px_-30px_rgba(49,35,45,.4)] transition-all duration-300" data-testid={`testimonial-card-c-${name}`}>
      <div className="flex gap-1 mb-4">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-[#143A2E] text-[#143A2E]" />
        ))}
        {hasHalf && <StarHalf className="w-4 h-4 fill-[#143A2E] text-[#143A2E]" />}
      </div>
      <div className="relative mb-5">
        <Quote className="w-6 h-6 text-slate-200 absolute -top-1 -left-1" />
        <p className="text-slate-700 text-sm leading-relaxed pl-6">{quote}</p>
      </div>
      <div className="flex items-center gap-3 pt-4 border-t border-white/40">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8E2E6] to-[#D5CED4] flex items-center justify-center text-slate-700 font-bold text-sm">
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-sm text-slate-800">{name}</p>
          <p className="text-xs text-slate-500">{age} лет, {city}</p>
          <p className="text-xs text-slate-600">{parentType}</p>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-8">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#143A2E] to-[#0F2F25] flex items-center justify-center mb-5 mx-auto text-white font-serif font-medium text-xl shadow-[0_12px_30px_-16px_rgba(20,58,46,.65)]">
        {step}
      </div>
      <h3 className="text-xl font-serif font-medium mb-3 text-slate-900">{title}</h3>
      <p className="text-[#5F626B] text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function ChatBubble({ from, text }: { from: "bot" | "user"; text: string }) {
  return (
    <div className={`flex ${from === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          from === "bot"
            ? "bg-white text-slate-800 rounded-bl-md shadow-sm"
            : "bg-green-200 text-slate-800 rounded-br-md"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
  borderColor,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  borderColor: string;
}) {
  return (
    <div className={`rounded-[28px] bg-white/78 backdrop-blur-sm border border-white/65 shadow-[0_24px_60px_-32px_rgba(49,35,45,.35)] p-6 hover:-translate-y-0.5 hover:shadow-[0_30px_70px_-30px_rgba(49,35,45,.4)] transition-all duration-300`} data-testid={`feature-card-c-${title}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        {icon}
      </div>
      <h3 className="text-lg font-serif font-medium mb-2 text-slate-900">{title}</h3>
      <p className="text-[#5F626B] leading-relaxed text-sm">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  subtitle,
  result,
  features,
  popular,
  isFree,
}: {
  name: string;
  price: string;
  subtitle: string;
  result: string;
  features: string[];
  popular?: boolean;
  isFree?: boolean;
}) {
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 rounded-[28px] bg-white/78 backdrop-blur-sm border border-white/65 shadow-[0_24px_60px_-32px_rgba(49,35,45,.35)] hover:shadow-[0_30px_70px_-30px_rgba(49,35,45,.4)] ${popular ? "scale-105 border-[#143A2E]/30" : ""}`}
      data-testid={`pricing-card-c-${name}`}
    >
      {popular && (
        <div className="absolute top-0 right-0 bg-[#143A2E] text-white text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
          <Star className="w-3 h-3" /> Популярный
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-serif font-medium">{name}</CardTitle>
        <CardDescription className="text-[#5F626B] font-medium">
          {subtitle}
        </CardDescription>
        <div className="mt-3">
          <span className="text-3xl font-serif font-medium">{price}₽</span>
          {!isFree && <span className="text-muted-foreground">/мес</span>}
        </div>
        <div className="mt-3 bg-gradient-to-r from-[#F3E9F0] to-[#EDF2F8] rounded-lg px-3 py-2" data-testid={`pricing-result-c-${name}`}>
          <p className="text-xs font-medium text-slate-600">{result}</p>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 mb-6">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Button
          asChild
          className={`w-full rounded-xl transition-all duration-300 ${popular ? "bg-[#143A2E] hover:bg-[#0F2F25] shadow-[0_12px_30px_-16px_rgba(20,58,46,.65)]" : ""}`}
          variant={popular ? "default" : "outline"}
          data-testid={`button-pricing-c-${name}`}
        >
          <Link href="/auth">{isFree ? "Попробовать бесплатно" : "Подарить родителю"}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
