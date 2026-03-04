import { useState } from "react";
import {
  HeartPulse,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Check,
  Star,
  Clock,
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
  Users,
  Lock,
  AlertTriangle,
  Server,
  Quote,
  Zap,
  Shield,
  Database,
  Fingerprint,
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
import { Link, useLocation } from "wouter";

export default function LandingC() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
            <a href="#problem" className="hover:text-orange-600 transition-colors" data-testid="link-nav-problem-c">
              Зачем
            </a>
            <a href="#features" className="hover:text-orange-600 transition-colors" data-testid="link-nav-features-c">
              Возможности
            </a>
            <a href="#security" className="hover:text-orange-600 transition-colors" data-testid="link-nav-security-c">
              Безопасность
            </a>
            <a href="#pricing" className="hover:text-orange-600 transition-colors" data-testid="link-nav-pricing-c">
              Тарифы
            </a>
            <a href="#faq" className="hover:text-orange-600 transition-colors" data-testid="link-nav-faq-c">
              Вопросы
            </a>
          </div>
          <Link href="/auth">
            <Button
              className="rounded-full px-6 shadow-sm hover:shadow-md transition-all bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="button-nav-cta-c"
            >
              Подарить маме заботу
            </Button>
          </Link>
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
                Настройка за 3 минуты — без установки приложений
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] mb-6 text-slate-900">
                Лучший подарок маме —{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500">
                  знать, что с ней всё хорошо
                </span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Не одноразовый букет, а ежедневная забота. Внучок — ИИ-помощник
                для пожилых родителей в Telegram. Он напомнит про лекарства,
                передаст показания счётчиков и защитит от мошенников.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Link href="/auth">
                  <Button
                    size="lg"
                    className="rounded-full text-base h-14 px-8 shadow-lg shadow-orange-200 bg-orange-500 hover:bg-orange-600 text-white"
                    data-testid="button-hero-gift-c"
                  >
                    Подарить маме заботу <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full text-base h-14 px-8 border-orange-200 hover:bg-orange-50 text-slate-700"
                    data-testid="button-hero-pricing-c"
                  >
                    Посмотреть тарифы
                  </Button>
                </Link>
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
                  src="/hero.png"
                  alt="Забота о родителях — подарок маме, помощник для пожилых"
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
                      Давление в норме: 125/80
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

      <section id="problem" className="py-24 bg-white relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Знакомо? Вы не одиноки
            </h2>
            <p className="text-slate-600 text-lg">
              Миллионы взрослых детей каждый день переживают за своих родителей
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <PainCard
              icon={<Clock className="w-8 h-8" />}
              title="Нет времени"
              description="Работа, семья, дела. Вы звоните раз в неделю и чувствуете, что этого мало. Хочется быть рядом, но не получается."
              color="bg-orange-50 text-orange-500"
            />
            <PainCard
              icon={<Heart className="w-8 h-8" />}
              title="Тревога"
              description="«Приняла ли мама таблетки?», «Не обманули ли папу мошенники?», «Всё ли в порядке?» — эти мысли не отпускают."
              color="bg-rose-50 text-rose-500"
            />
            <PainCard
              icon={<Users className="w-8 h-8" />}
              title="Чувство вины"
              description="Вы понимаете, что родители стареют. Хочется дать им больше внимания, но подарки не заменяют заботу."
              color="bg-amber-50 text-amber-500"
            />
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-white to-[#FFF8F0]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Как это работает
            </h2>
            <p className="text-slate-600 text-lg">
              Три простых шага — и ваш родитель под заботливым присмотром
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              step="1"
              title="Вы подключаете"
              description="Оформляете подписку, настраиваете бота под родителя: имя, лекарства, привычки, расписание."
            />
            <StepCard
              step="2"
              title="Мама общается"
              description="Родитель пишет или говорит голосом в Telegram. Внучок отвечает тепло и по-человечески."
            />
            <StepCard
              step="3"
              title="Вы спокойны"
              description="В личном кабинете видите: лекарства приняты, давление в норме, настроение хорошее."
            />
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-[#FFF8F0] relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Что умеет Внучок
            </h2>
            <p className="text-slate-600 text-lg">
              Всё, что нужно для спокойствия. Родитель общается голосом — никаких сложных кнопок.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<BellRing />}
              title="Напоминания о лекарствах"
              description="Бот напомнит выпить таблетки. Если подтверждения нет 15 минут — вы получите алерт."
              color="bg-rose-50 text-rose-500"
              borderColor="border-rose-100"
            />
            <FeatureCard
              icon={<Gauge />}
              title="Дневник давления"
              description="Родитель называет цифры — бот записывает. Вы видите историю и тренды в личном кабинете."
              color="bg-blue-50 text-blue-500"
              borderColor="border-blue-100"
            />
            <FeatureCard
              icon={<Camera />}
              title="Счётчики по фото"
              description="Мама фотографирует счётчик — ИИ распознаёт цифры и отправляет вам. Забудьте о рутине ЖКХ."
              color="bg-emerald-50 text-emerald-500"
              borderColor="border-emerald-100"
            />
            <FeatureCard
              icon={<ShieldAlert />}
              title="Защита от мошенников"
              description="Если кто-то просит перевести деньги или назвать код — бот предупредит и мгновенно оповестит вас."
              color="bg-amber-50 text-amber-500"
              borderColor="border-amber-100"
            />
            <FeatureCard
              icon={<Mic />}
              title="Голосовые сообщения"
              description="Родитель отправляет голос — получает голос. Как разговор с внуком. Тёплый, человечный ИИ."
              color="bg-purple-50 text-purple-500"
              borderColor="border-purple-100"
            />
            <FeatureCard
              icon={<MessageCircle />}
              title="Бот пишет первым"
              description="Внучок сам напишет «Доброе утро!», расскажет погоду, спросит про самочувствие."
              color="bg-cyan-50 text-cyan-500"
              borderColor="border-cyan-100"
            />
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Живой диалог с Внучком
            </h2>
            <p className="text-slate-600 text-lg">
              Так выглядит обычный разговор бабушки с ботом в Telegram
            </p>
          </div>

          <div className="max-w-md mx-auto">
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
                <ChatBubble
                  from="bot"
                  text="Доброе утро, Мария Ивановна! ☀️ Сегодня в Москве +18, солнечно. Не забудьте выпить эналаприл!"
                />
                <ChatBubble from="user" text="Спасибо, милый! Уже выпила." />
                <ChatBubble
                  from="bot"
                  text="Отлично! Записала ✓ А какое у вас давление сегодня?"
                />
                <ChatBubble from="user" text="130 на 85" />
                <ChatBubble
                  from="bot"
                  text="Записала: 130/85. Чуть выше обычного, но в допустимых пределах. Если будет выше 140 — обязательно скажите! 💛"
                />
                <ChatBubble
                  from="user"
                  text="А что сегодня приготовить на обед?"
                />
                <ChatBubble
                  from="bot"
                  text="Могу предложить рецепт! Лёгкий куриный суп с лапшой — просто и вкусно. Рассказать пошагово? 🍲"
                />
              </div>
            </div>
            <p className="text-center text-sm text-slate-400 mt-4">
              Реальный сценарий диалога
            </p>
          </div>
        </div>
      </section>

      <section id="security" className="py-24 bg-gradient-to-b from-white to-[#FFF8F0]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Безопасность — наш приоритет
            </h2>
            <p className="text-slate-600 text-lg">
              8 категорий обнаружения угроз и многоуровневая защита данных
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-12">
            {[
              { icon: <Shield className="w-5 h-5" />, label: "Банковские мошенники" },
              { icon: <AlertTriangle className="w-5 h-5" />, label: "Социальная инженерия" },
              { icon: <Server className="w-5 h-5" />, label: "Фейковые службы" },
              { icon: <Star className="w-5 h-5" />, label: "Лотереи и выигрыши" },
              { icon: <PhoneCall className="w-5 h-5" />, label: "Ложный родственник в беде" },
              { icon: <Database className="w-5 h-5" />, label: "Соцвыплаты и компенсации" },
              { icon: <Fingerprint className="w-5 h-5" />, label: "Инвестиционные разводы" },
              { icon: <HeartPulse className="w-5 h-5" />, label: "Финансовые риски" },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white border border-orange-100 rounded-xl p-3.5 flex items-center gap-3 hover:border-orange-300 hover:shadow-sm transition-all"
                data-testid={`security-category-c-${i}`}
              >
                <div className="text-orange-500">{item.icon}</div>
                <span className="text-sm text-slate-700">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-8 rounded-2xl bg-white border border-orange-100 shadow-sm" data-testid="trust-card-protection-c">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto bg-red-50 text-red-500">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h4 className="font-semibold mb-2 text-slate-900">Распознаёт мошенников</h4>
              <p className="text-sm text-slate-600 leading-relaxed">Мгновенно предупредит родителя и отправит вам алерт при подозрительных запросах</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-white border border-orange-100 shadow-sm" data-testid="trust-card-privacy-c">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto bg-blue-50 text-blue-500">
                <Lock className="w-7 h-7" />
              </div>
              <h4 className="font-semibold mb-2 text-slate-900">Защита данных</h4>
              <p className="text-sm text-slate-600 leading-relaxed">Данные не используются для обучения моделей. Полная конфиденциальность</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-white border border-orange-100 shadow-sm" data-testid="trust-card-monitoring-c">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto bg-amber-50 text-amber-500">
                <BellRing className="w-7 h-7" />
              </div>
              <h4 className="font-semibold mb-2 text-slate-900">Мгновенные алерты</h4>
              <p className="text-sm text-slate-600 leading-relaxed">Уведомления при проблемах со здоровьем или подозрительной активности</p>
            </div>
          </div>
        </div>
      </section>

      <section id="dashboard" className="py-24 bg-[#FFF8F0] relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-orange-100">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-semibold text-lg">
                      Личный кабинет ребёнка
                    </h3>
                    <p className="text-sm text-slate-500">
                      Мария Ивановна (Мама)
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
                    Всё хорошо
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-green-50 border border-green-100 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-1">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Лекарства приняты</p>
                      <p className="text-xs text-slate-500 mt-1">Эналаприл, 1 таб. — подтверждено</p>
                      <p className="text-[10px] text-slate-400 mt-2">Сегодня, 08:30</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                      <HeartPulse className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Давление записано</p>
                      <p className="text-xs text-slate-500 mt-1">130/85 — в пределах нормы</p>
                      <p className="text-[10px] text-slate-400 mt-2">Сегодня, 09:15</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-1">
                      <PhoneCall className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Утренний чек-ин пройден</p>
                      <p className="text-xs text-slate-500 mt-1">Настроение хорошее, жалоб нет</p>
                      <p className="text-[10px] text-slate-400 mt-2">Сегодня, 09:20</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-1">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Показания воды отправлены</p>
                      <p className="text-xs text-slate-500 mt-1">ГВС: 142.3, ХВС: 284.7</p>
                      <p className="text-[10px] text-slate-400 mt-2">Вчера, 18:20</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
                Вы всегда в курсе.
                <br />
                Без навязчивых звонков.
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                В личном кабинете вы видите полную картину дня ваших родителей.
                Лекарства, давление, настроение, счётчики — всё в одном месте.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  "Статус «Всё хорошо» или «Требует внимания»",
                  "Лента событий за день в реальном времени",
                  "Контроль лекарств, давления, счётчиков",
                  "Мгновенные уведомления при проблемах",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="rounded-full bg-white border-orange-200 hover:bg-orange-50"
                  data-testid="button-demo-dashboard-c"
                >
                  Открыть демо кабинета
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="reviews" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Истории наших пользователей
            </h2>
            <p className="text-slate-600 text-lg">
              Тысячи семей уже используют Внучка для заботы о близких
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <TestimonialCard
              name="Елена Смирнова"
              age={42}
              city="Москва"
              quote="Наконец-то я перестала переживать каждый день. Мама сама общается с ботом, а я вижу, что всё в порядке. Это как невидимая рука помощи."
              rating={5}
            />
            <TestimonialCard
              name="Андрей Петров"
              age={38}
              city="Санкт-Петербург"
              quote="Папа сначала скептически отнёсся, но через неделю сам стал рассказывать Внучку о давлении и лекарствах. Теперь это его утренний ритуал."
              rating={5}
            />
            <TestimonialCard
              name="Ольга Козлова"
              age={45}
              city="Новосибирск"
              quote="Живу далеко от мамы. Раньше звонила раз в неделю и мучилась от чувства вины. Теперь каждый день вижу, что она в порядке. Бесценно!"
              rating={5}
            />
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 bg-[#FFF8F0]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Тарифы — дешевле букета цветов в месяц
            </h2>
            <p className="text-slate-600 text-lg">
              Забота о родителях — лучший подарок маме и папе. Первые 7 дней бесплатно.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-12">
            <PricingCard
              name="Базовый"
              price="490"
              subtitle="Как открытка, но каждый день"
              result="Вы знаете, что мама приняла лекарства"
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
              subtitle="Забота на полную"
              result="Мама не одинока — с ней тёплый собеседник"
              features={[
                "Все из Базового",
                "ИИ-чат с Внучком голосом",
                "Распознавание счётчиков",
                "Безлимитные напоминания",
                "Защита от мошенников",
                "Проактивные сообщения",
              ]}
            />
            <PricingCard
              name="Премиум"
              price="1 990"
              subtitle="Максимум спокойствия"
              result="Полная автоматизация заботы"
              features={[
                "Все из Стандарта",
                "Настройка личности бота",
                "Темы экспертизы",
                "Генерация картинок и открыток",
                "Расширенная история давления",
                "Рецепты с пошаговыми инструкциями",
              ]}
            />
          </div>

          <p className="text-center text-sm text-slate-500 mt-8" data-testid="text-risk-reversal-c">
            Без привязки карты · Отмена в 1 клик · 7 дней бесплатно
          </p>

          <div className="text-center mt-4">
            <Link href="/pricing">
              <Button
                variant="link"
                className="text-orange-600"
                data-testid="link-pricing-details-c"
              >
                Подробнее о тарифах
              </Button>
            </Link>
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
                  data-testid={`faq-toggle-c-${i}`}
                >
                  <span className="font-semibold text-slate-800">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed">
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
                Подарите не вещь, <br /> а ежедневную заботу
              </h2>
              <p className="text-orange-100 text-lg mb-10">
                Лучший подарок папе и маме — знать, что с ними всё хорошо.
                Подключите Внучка сегодня.
              </p>
              <Link href="/auth">
                <Button
                  size="lg"
                  className="rounded-full h-14 px-8 bg-white text-orange-600 hover:bg-orange-50 font-semibold text-lg shadow-xl"
                  data-testid="button-cta-final-c"
                >
                  Подарить маме заботу — от 490₽/мес
                </Button>
              </Link>
              <p className="mt-4 text-sm text-orange-200 opacity-80">
                7 дней бесплатно · Без привязки карты · Отмена в 1 клик
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 py-12 text-slate-400 text-sm">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <Heart className="w-5 h-5 text-orange-400" />
            <span className="font-bold tracking-tight">Внучок</span>
          </div>
          <p>© 2025 Внучок. Забота о родителях с помощью ИИ.</p>
        </div>
      </footer>

    </div>
  );
}

const faqItems = [
  {
    q: "А если мама не разбирается в технике?",
    a: "Маме не нужно ничего устанавливать. Достаточно Telegram на любом телефоне — бот сам начнёт диалог. Мама просто пишет или отправляет голосовое сообщение, как обычному собеседнику. Никаких сложных кнопок.",
  },
  {
    q: "Чем это лучше обычного звонка?",
    a: "Бот на связи 24/7, не устаёт и не забывает. Он напомнит о лекарствах, проверит самочувствие, поддержит разговор, когда вы заняты. А вы получите уведомление, если что-то не так — и сможете позвонить именно тогда, когда это действительно нужно.",
  },
  {
    q: "Это безопасно? Кто видит переписку?",
    a: "Переписку видите только вы в панели управления. Данные надёжно защищены и не используются для обучения моделей. Бот распознаёт мошенников и мгновенно предупреждает вас.",
  },
  {
    q: "Можно ли отменить подписку?",
    a: "Да, в любой момент в 1 клик. Без привязки карты на пробном периоде. Первые 7 дней полностью бесплатно — попробуйте без обязательств.",
  },
  {
    q: "Что если мама не ответит боту?",
    a: "Если мама не отвечает на важное напоминание (например, о лекарствах) — через 15 минут вам придёт алерт. Вы сразу узнаете и сможете позвонить.",
  },
  {
    q: "Сколько стоит?",
    a: "От 490₽/мес за базовые функции. Самый популярный тариф — 990₽/мес с голосовыми сообщениями, распознаванием фото и защитой от мошенников. Первые 7 дней бесплатно.",
  },
];

function TestimonialCard({
  name,
  age,
  city,
  quote,
  rating,
}: {
  name: string;
  age: number;
  city: string;
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
        </div>
      </div>
    </div>
  );
}

function PainCard({
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
    <div className="text-center p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto ${color}`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
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
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}
      >
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
        <Link href="/auth">
          <Button
            className={`w-full rounded-full ${popular ? "bg-orange-500 hover:bg-orange-600" : ""}`}
            variant={popular ? "default" : "outline"}
            data-testid={`button-pricing-c-${name}`}
          >
            Выбрать тариф
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}