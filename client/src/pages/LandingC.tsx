import { useState } from "react";
import {
  HeartPulse,
  ArrowRight,
  CheckCircle2,
  Check,
  Star,
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
  AlertTriangle,
  Quote,
  Zap,
  Shield,
  Eye,
  Clock,
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

  return (
    <div className="min-h-screen bg-[#FFF8F0] selection:bg-amber-200/50" style={{ fontFamily: "'Inter', sans-serif" }}>
      <nav className="fixed top-0 w-full z-50 bg-[#FFF8F0]/80 backdrop-blur-md border-b border-orange-100/50 py-4">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-orange-100 to-amber-100 p-2 rounded-xl">
              <Heart className="w-6 h-6 text-orange-500" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">
              Внучок
            </span>
          </div>
          <div className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-600">
            <a href="#outcomes" className="hover:text-orange-600 transition-colors" data-testid="link-nav-outcomes-c">
              Зачем
            </a>
            <a href="#parents" className="hover:text-orange-600 transition-colors" data-testid="link-nav-parents-c">
              Для кого
            </a>
            <a href="#features" className="hover:text-orange-600 transition-colors" data-testid="link-nav-features-c">
              Возможности
            </a>
            <a href="#pricing" className="hover:text-orange-600 transition-colors" data-testid="link-nav-pricing-c">
              Тарифы
            </a>
            <a href="#faq" className="hover:text-orange-600 transition-colors" data-testid="link-nav-faq-c">
              Вопросы
            </a>
          </div>
          <Button
            asChild
            className="rounded-full px-6 shadow-sm hover:shadow-md transition-all bg-orange-500 hover:bg-orange-600 text-white"
            data-testid="button-nav-cta-c"
          >
            <Link href="/auth">Подключить бесплатно</Link>
          </Button>
        </div>
      </nav>

      <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-6 overflow-hidden">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl relative z-10">
              <Badge
                variant="secondary"
                className="mb-6 bg-orange-100 text-orange-700 hover:bg-orange-200 px-4 py-1.5 rounded-full border-0 flex items-center gap-2 w-fit"
                data-testid="badge-hero-c"
              >
                <Zap className="w-3.5 h-3.5" />
                Настройка за 3 минуты — работает в Telegram
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] mb-6 text-slate-900">
                Спокойствие{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500">
                  за маму и папу
                </span>
                {" "}— каждый день
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Вы заняты работой и семьёй, но всегда знаете: лекарства приняты,
                мошенники отсечены, с родителями всё в порядке. Внучок — ИИ-помощник
                в Telegram, который заботится о них, пока вы не можете.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full text-base h-14 px-8 shadow-lg shadow-orange-200 bg-orange-500 hover:bg-orange-600 text-white"
                  data-testid="button-hero-gift-c"
                >
                  <Link href="/auth">
                    Подключить маму или папу <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full text-base h-14 px-8 border-orange-200 hover:bg-orange-50 text-slate-700"
                  data-testid="button-hero-demo-c"
                >
                  <a href="#dialog">Как это выглядит</a>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500" data-testid="badge-risk-reversal-c">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-orange-400" />
                  Без привязки карты
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
                  Отмена в 1 клик
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-orange-400" />
                  7 дней бесплатно
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-orange-100 to-amber-50 rounded-full blur-3xl -z-10" />

              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-orange-200/50 border border-white/50 aspect-[4/3]">
                <img
                  src="/hero.png?v=2"
                  alt="Внучок — цифровой помощник для родителей"
                  className="w-full h-full object-cover"
                />

                <div className="absolute bottom-6 left-6 right-6 bg-white/80 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/40 shadow-xl shadow-orange-100/50 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      Мама приняла лекарство ✓
                    </p>
                    <p className="text-xs text-slate-500">
                      Давление в норме · Настроение хорошее
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 ml-auto">
                    Только что
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="outcomes" className="py-24 bg-white relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Что это даёт вам
            </h2>
            <p className="text-slate-600 text-lg">
              Вы не можете быть рядом 24/7 — но можете быть уверены, что всё хорошо
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <OutcomeCard
              icon={<Eye className="w-8 h-8" />}
              title="Спокойствие"
              description="Каждый день видите в личном кабинете: лекарства приняты, давление в норме, настроение хорошее. Без навязчивых звонков."
              color="bg-green-50 text-green-500"
            />
            <OutcomeCard
              icon={<Clock className="w-8 h-8" />}
              title="Свободное время"
              description="Не нужно час объяснять по телефону, как оплатить ЖКХ или записаться к врачу. Внучок сделает это за вас."
              color="bg-blue-50 text-blue-500"
            />
            <OutcomeCard
              icon={<Shield className="w-8 h-8" />}
              title="Защита"
              description="Мгновенный алерт, если кто-то пытается обмануть родителя. Бот распознаёт 8 типов мошенничества."
              color="bg-amber-50 text-amber-500"
            />
          </div>
        </div>
      </section>

      <section id="parents" className="py-24 bg-gradient-to-b from-white to-[#FFF8F0]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Узнаёте своего родителя?
            </h2>
            <p className="text-slate-600 text-lg">
              Внучок подстраивается под каждого
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <ParentCard
              emoji="💃"
              archetype="Активный родитель 50+"
              childQuote="Мама вышла на пенсию и не знает, чем заняться. Скучает, когда мы заняты. Ей не хватает общения."
              botHelp="Рецепты, афиша, кино, стихи, загадки. Тёплый собеседник на каждый день — как подружка, которая всегда на связи."
              color="bg-amber-50 border-amber-100"
              iconColor="text-amber-600"
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

      <section className="py-24 bg-[#FFF8F0]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Как это работает
            </h2>
            <p className="text-slate-600 text-lg">
              Три шага — и ваш родитель под заботливым присмотром
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              step="1"
              title="Вы подключаете"
              description="Оформляете подписку, настраиваете бота: имя родителя, лекарства, интересы. Занимает 3 минуты."
            />
            <StepCard
              step="2"
              title="Родитель общается"
              description="Пишет или говорит голосом в Telegram. Внучок отвечает тепло и по-человечески."
            />
            <StepCard
              step="3"
              title="Вы спокойны"
              description="В личном кабинете видите всё: лекарства, давление, настроение. Алерт — если что-то не так."
            />
          </div>
        </div>
      </section>

      <section id="dialog" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Живой диалог с Внучком
            </h2>
            <p className="text-slate-600 text-lg">
              Разные родители — разные разговоры
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="flex gap-2 mb-4 justify-center flex-wrap">
              {chatScenarios.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveChat(i)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeChat === i
                      ? "bg-orange-500 text-white shadow-md"
                      : "bg-white text-slate-600 border border-orange-200 hover:bg-orange-50"
                  }`}
                  data-testid={`chat-tab-${i}`}
                >
                  {s.tab}
                </button>
              ))}
            </div>

            <div className="bg-[#E8D5B7] rounded-[2rem] p-4 shadow-xl">
              <div className="bg-[#EFDED3] rounded-xl px-4 py-3 mb-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-300 flex items-center justify-center text-white font-bold text-sm">
                  В
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800">Внучок</p>
                  <p className="text-xs text-slate-500">онлайн</p>
                </div>
              </div>

              <div className="space-y-3 py-4">
                {chatScenarios[activeChat].messages.map((msg, i) => (
                  <ChatBubble key={`${activeChat}-${i}`} from={msg.from} text={msg.text} />
                ))}
              </div>
            </div>
            <p className="text-center text-sm text-slate-400 mt-4">
              {chatScenarios[activeChat].caption}
            </p>
          </div>
        </div>
      </section>

      <section id="dashboard-section" className="py-24 bg-gradient-to-b from-white to-[#FFF8F0] relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-orange-100">
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
                    icon={<MessageCircle className="w-5 h-5 text-amber-600" />}
                    bgColor="bg-amber-50 border-amber-100"
                    iconBg="bg-amber-100"
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
                Вы видите всё.
                <br />
                Без навязчивых звонков.
              </h2>
              <p className="text-lg text-slate-600 mb-8">
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
                    <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant="outline"
                className="rounded-full bg-white border-orange-200 hover:bg-orange-50"
                data-testid="button-demo-dashboard-c"
              >
                <Link href="/dashboard">Открыть демо кабинета</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-[#FFF8F0] relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Все возможности Внучка
            </h2>
            <p className="text-slate-600 text-lg">
              От рецептов до защиты от мошенников
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
              icon={<Camera />}
              title="Счётчики по фото"
              description="Фотографирует счётчик — ИИ распознаёт цифры и отправляет вам."
              color="bg-emerald-50 text-emerald-500"
              borderColor="border-emerald-100"
            />
            <FeatureCard
              icon={<ShieldAlert />}
              title="Защита от мошенников"
              description="Распознаёт 8 типов мошенничества. Предупредит родителя и оповестит вас."
              color="bg-amber-50 text-amber-500"
              borderColor="border-amber-100"
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
              title="Рецепты, афиша, помощь"
              description="Что приготовить, что посмотреть, как оплатить ЖКХ, как записаться к врачу."
              color="bg-cyan-50 text-cyan-500"
              borderColor="border-cyan-100"
            />
          </div>
        </div>
      </section>

      <section id="security" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Безопасность
            </h2>
            <p className="text-slate-600 text-lg">
              Защита родителя и ваших данных
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-8 rounded-2xl bg-white border border-orange-100 shadow-sm" data-testid="trust-card-protection-c">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto bg-red-50 text-red-500">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h4 className="font-semibold mb-2 text-slate-900">Антимошенник</h4>
              <p className="text-sm text-slate-600 leading-relaxed">8 категорий угроз: банковские мошенники, фейковые службы, «внук в беде», лотереи. Мгновенный алерт вам.</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-white border border-orange-100 shadow-sm" data-testid="trust-card-privacy-c">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto bg-blue-50 text-blue-500">
                <Lock className="w-7 h-7" />
              </div>
              <h4 className="font-semibold mb-2 text-slate-900">Конфиденциальность</h4>
              <p className="text-sm text-slate-600 leading-relaxed">Переписку видите только вы. Данные не используются для обучения моделей.</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-white border border-orange-100 shadow-sm" data-testid="trust-card-monitoring-c">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto bg-amber-50 text-amber-500">
                <BellRing className="w-7 h-7" />
              </div>
              <h4 className="font-semibold mb-2 text-slate-900">Мгновенные алерты</h4>
              <p className="text-sm text-slate-600 leading-relaxed">Лекарство не принято? Подозрительный звонок? Плохое самочувствие? Вы узнаете первым.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="reviews" className="py-24 bg-gradient-to-b from-white to-[#FFF8F0]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Истории семей
            </h2>
            <p className="text-slate-600 text-lg">
              Разные родители — одна забота
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <TestimonialCard
              name="Марина Соколова"
              age={38}
              city="Москва"
              parentType="Мама, 56 лет"
              quote="Мама каждый день спрашивает у Внучка рецепты и куда сходить на выходных. Говорит — как подружка, которая всё знает и никогда не занята."
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
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 bg-[#FFF8F0]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Дешевле букета цветов в месяц
            </h2>
            <p className="text-slate-600 text-lg">
              7 дней бесплатно. Без привязки карты. Отмена в 1 клик.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-12">
            <PricingCard
              name="Базовый"
              price="490"
              subtitle="Контроль лекарств"
              result="Вы знаете, что родитель принял лекарства"
              features={[
                "Напоминания о лекарствах",
                "Дневник давления",
                "Лента событий",
                "До 5 напоминаний",
              ]}
            />
            <PricingCard
              name="Стандарт"
              price="990"
              popular
              subtitle="Полная забота"
              result="Родитель не одинок — и вы спокойны"
              features={[
                "Все из Базового",
                "ИИ-чат голосом",
                "Распознавание счётчиков",
                "Безлимитные напоминания",
                "Защита от мошенников",
                "Бот пишет первым",
              ]}
            />
            <PricingCard
              name="Премиум"
              price="1 990"
              subtitle="Максимум"
              result="Полная автоматизация заботы"
              features={[
                "Все из Стандарта",
                "Настройка личности бота",
                "Темы экспертизы",
                "Открытки и картинки",
                "Расширенная история давления",
                "Пошаговые рецепты",
              ]}
            />
          </div>

          <p className="text-center text-sm text-slate-500 mt-8" data-testid="text-risk-reversal-c">
            Без привязки карты · Отмена в 1 клик · 7 дней бесплатно
          </p>

          <div className="text-center mt-4">
            <Button
              asChild
              variant="link"
              className="text-orange-600"
              data-testid="link-pricing-details-c"
            >
              <Link href="/pricing">Подробнее о тарифах</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 bg-[#FFF8F0]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Частые вопросы
            </h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-orange-100 overflow-hidden"
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

      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-[3rem] p-8 md:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <Sparkles className="w-12 h-12 mx-auto mb-6 text-yellow-200" />
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                Подключите маму или папу <br /> за 3 минуты
              </h2>
              <p className="text-orange-100 text-lg mb-10">
                7 дней бесплатно. Без привязки карты. Родителю не нужно ничего устанавливать — только Telegram.
              </p>
              <Button
                asChild
                size="lg"
                className="rounded-full h-14 px-8 bg-white text-orange-600 hover:bg-orange-50 font-semibold text-lg shadow-xl"
                data-testid="button-cta-final-c"
              >
                <Link href="/auth">Подключить бесплатно</Link>
              </Button>
              <p className="mt-4 text-sm text-orange-200 opacity-80">
                От 490₽/мес после пробного периода
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 py-12 pb-24 md:pb-12 text-slate-400 text-sm">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <Heart className="w-5 h-5 text-orange-400" />
            <span className="font-bold tracking-tight">Внучок</span>
          </div>
          <p>© 2025 Внучок. Забота о родителях с помощью ИИ.</p>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 backdrop-blur-md border-t border-orange-100 md:hidden">
        <Button
          asChild
          className="w-full rounded-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg"
          data-testid="button-mobile-cta-c"
        >
          <Link href="/auth">Подключить маму или папу бесплатно</Link>
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
];

const faqItems = [
  {
    q: "Моей маме 55, она активная. Это не для бабушек?",
    a: "Внучок — не только про лекарства. Это ежедневный помощник: рецепты, афиша, помощь с техникой, просто разговор. Многие родители 50-60 лет используют его как умного собеседника, который всегда на связи.",
  },
  {
    q: "А если родитель не разбирается в технике?",
    a: "Достаточно Telegram на телефоне — бот сам начнёт диалог. Можно писать или отправлять голосовые. Никаких сложных кнопок.",
  },
  {
    q: "Чем это лучше обычного звонка?",
    a: "Бот на связи 24/7: напомнит о лекарствах, поможет с ЖКХ, найдёт рецепт, поддержит разговор. А вы получите алерт, только если что-то не так — и позвоните когда действительно нужно.",
  },
  {
    q: "Кто видит переписку?",
    a: "Только вы в личном кабинете. Данные не используются для обучения моделей. Бот распознаёт мошенников и мгновенно предупреждает вас.",
  },
  {
    q: "Можно отменить?",
    a: "В любой момент, в 1 клик. Первые 7 дней бесплатно, без привязки карты.",
  },
  {
    q: "Сколько стоит?",
    a: "От 490₽/мес. Популярный тариф — 990₽/мес с голосом, счётчиками и защитой от мошенников. Первые 7 дней бесплатно.",
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
    <div className="text-center p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow" data-testid={`outcome-card-${title}`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto ${color}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
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
    <div className={`rounded-2xl p-6 border ${color} hover:shadow-md transition-shadow`} data-testid={`parent-card-${archetype.replace(/\s+/g, "-")}`}>
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className={`text-lg font-bold mb-3 ${iconColor}`}>{archetype}</h3>
      <p className="text-sm text-slate-600 mb-4 italic">«{childQuote}»</p>
      <div className="pt-3 border-t border-slate-100">
        <p className="text-sm text-slate-700 flex gap-2">
          <span className="text-orange-500 shrink-0 mt-0.5">
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
  return (
    <div className="p-8 rounded-2xl bg-white border border-orange-100 shadow-sm hover:shadow-md transition-shadow" data-testid={`testimonial-card-c-${name}`}>
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <div className="relative mb-5">
        <Quote className="w-6 h-6 text-orange-200 absolute -top-1 -left-1" />
        <p className="text-slate-700 text-sm leading-relaxed pl-6">{quote}</p>
      </div>
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center text-orange-700 font-bold text-sm">
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-sm text-slate-800">{name}</p>
          <p className="text-xs text-slate-500">{age} лет, {city}</p>
          <p className="text-xs text-orange-500">{parentType}</p>
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
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center mb-5 mx-auto text-white font-bold text-xl shadow-lg shadow-orange-200">
        {step}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
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
    <div className={`bg-white border ${borderColor} rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md`} data-testid={`feature-card-c-${title}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2 text-slate-900">{title}</h3>
      <p className="text-slate-600 leading-relaxed text-sm">{description}</p>
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
}: {
  name: string;
  price: string;
  subtitle: string;
  result: string;
  features: string[];
  popular?: boolean;
}) {
  return (
    <Card
      className={`relative overflow-hidden transition-all hover:-translate-y-1 rounded-2xl ${popular ? "border-orange-400 shadow-lg shadow-orange-100 scale-105" : "border-orange-100"}`}
      data-testid={`pricing-card-c-${name}`}
    >
      {popular && (
        <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
          <Star className="w-3 h-3" /> Популярный
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription className="text-orange-600 font-medium">
          {subtitle}
        </CardDescription>
        <div className="mt-3">
          <span className="text-3xl font-bold">{price}₽</span>
          <span className="text-muted-foreground">/мес</span>
        </div>
        <div className="mt-3 bg-orange-50 rounded-lg px-3 py-2" data-testid={`pricing-result-c-${name}`}>
          <p className="text-xs font-medium text-orange-700">{result}</p>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 mb-6">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Button
          asChild
          className={`w-full rounded-full ${popular ? "bg-orange-500 hover:bg-orange-600" : ""}`}
          variant={popular ? "default" : "outline"}
          data-testid={`button-pricing-c-${name}`}
        >
          <Link href="/auth">Подключить бесплатно</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
