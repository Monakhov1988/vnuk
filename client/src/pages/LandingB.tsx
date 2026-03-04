import { useState } from "react";
import {
  ShieldCheck, Brain, Mic, Eye, Bell, MessageSquare, Cpu, Zap, Lock,
  ArrowRight, CheckCircle2, Check, Star, Mail, ChevronDown, Activity,
  AlertTriangle, Camera, Clock, Shield, Server, Database, Fingerprint,
  Bot, Sparkles, PhoneCall, HeartPulse, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function LandingB() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30" style={{ fontFamily: "'Inter', sans-serif" }}>
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 py-4">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/20">
              <Bot className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Внучок<span className="text-cyan-400">.ai</span></span>
          </div>
          <div className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-400">
            <a href="#architecture" className="hover:text-cyan-400 transition-colors" data-testid="link-nav-architecture">Технологии</a>
            <a href="#features" className="hover:text-cyan-400 transition-colors" data-testid="link-nav-features">Возможности</a>
            <a href="#pricing" className="hover:text-cyan-400 transition-colors" data-testid="link-nav-pricing">Тарифы</a>
          </div>
          <Link href="/auth">
            <Button className="rounded-full px-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20" data-testid="button-hero-cta-nav">
              Запустить агента
            </Button>
          </Link>
        </div>
      </nav>

      <section className="pt-32 pb-20 md:pt-44 md:pb-32 px-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 px-4 py-1.5 rounded-full border border-cyan-500/20 font-mono text-xs" data-testid="badge-hero">
              Нейросеть · Голосовой ИИ · Генерация изображений · Компьютерное зрение
            </Badge>
            <h1 className="text-4xl md:text-7xl font-bold leading-[1.05] mb-6 tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
              ИИ-агент, который заботится
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400">
                о ваших родителях каждый день
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Голосовой ИИ-помощник нового поколения на базе продвинутой нейросети. Распознавание показаний по фото.
              Обнаружение угроз для защиты от мошенников. Проактивные сообщения для ежедневной заботы.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link href="/auth">
                <Button size="lg" className="rounded-full text-base h-14 px-8 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold shadow-lg shadow-cyan-500/25" data-testid="button-hero-launch">
                  Запустить за 3 минуты <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="rounded-full text-base h-14 px-8 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent" data-testid="button-hero-pricing">
                  Тарифы
                </Button>
              </Link>
            </div>

            <WaitlistFormDark />

            <div className="flex items-center justify-center gap-6 mt-10 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>Работает в Telegram</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Защита данных</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" />
                <span>Быстрый отклик</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" className="py-24 relative border-t border-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-violet-500/10 text-violet-400 border-violet-500/20 font-mono text-xs">ТЕХНОЛОГИИ</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              Мультимодальный ИИ-стек
            </h2>
            <p className="text-slate-400 text-lg">
              Архитектура профессионального уровня на базе лучших нейросетей
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <ArchCard
              icon={<Brain className="w-8 h-8" />}
              title="Нейросеть с памятью"
              subtitle="Понимание речи"
              description="Мультимодальная модель для естественного диалога с эмпатией и контекстной памятью"
              gradient="from-cyan-500 to-blue-500"
            />
            <ArchCard
              icon={<Mic className="w-8 h-8" />}
              title="Голосовой ИИ"
              subtitle="Распознавание и синтез речи"
              description="Распознавание и синтез речи. Голосовые сообщения в Telegram без потери смысла"
              gradient="from-violet-500 to-purple-500"
            />
            <ArchCard
              icon={<Eye className="w-8 h-8" />}
              title="Компьютерное зрение"
              subtitle="Распознавание по фото"
              description="Распознавание показаний счётчиков и документов по фото"
              gradient="from-emerald-500 to-green-500"
            />
            <ArchCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Генерация изображений"
              subtitle="Картинки и открытки"
              description="Генерация открыток, иллюстраций и персонализированных изображений по запросу"
              gradient="from-amber-500 to-orange-500"
            />
          </div>
        </div>
      </section>

      <section id="features" className="py-24 relative border-t border-slate-800/50">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-mono text-xs">ВОЗМОЖНОСТИ</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              Возможности ИИ-агента
            </h2>
            <p className="text-slate-400 text-lg">
              6 ключевых модулей для полной автоматизации заботы о пожилых родителях
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCardTech
              icon={<MessageSquare />}
              title="Понимание речи"
              subtitle="ИИ-чат в Telegram"
              description="Тёплый, человечный диалог на естественном языке. Контекстная память на 30+ дней. Настраиваемая личность бота."
              tech="Нейросеть с памятью"
              color="cyan"
            />
            <FeatureCardTech
              icon={<Mic />}
              title="Голосовой движок"
              subtitle="Голосовые сообщения"
              description="Отправляешь голос — получаешь голос. Полный голосовой цикл с сохранением интонаций и эмоций."
              tech="Распознавание + синтез речи"
              color="violet"
            />
            <FeatureCardTech
              icon={<Camera />}
              title="Распознавание по фото"
              subtitle="Распознавание счётчиков"
              description="Фото показаний → автоматическое распознавание цифр → структурированные данные → уведомление ребёнку."
              tech="Компьютерное зрение"
              color="emerald"
            />
            <FeatureCardTech
              icon={<AlertTriangle />}
              title="Обнаружение угроз"
              subtitle="Защита от мошенников"
              description="8 категорий мошеннических паттернов. Мгновенные алерты детям при подозрительных разговорах или запросах."
              tech="Анализ паттернов"
              color="red"
            />
            <FeatureCardTech
              icon={<Bell />}
              title="Проактивные сообщения"
              subtitle="Бот сам пишет первым"
              description="Утренние чек-ины, напоминания о лекарствах с подтверждением, проверка самочувствия, праздничные поздравления."
              tech="Планировщик"
              color="amber"
            />
            <FeatureCardTech
              icon={<Activity />}
              title="Мониторинг здоровья"
              subtitle="Дневник давления и лекарств"
              description="Трекинг приёма лекарств с таймерами. Дневник давления с историей. Алерт при пропуске через 15 минут."
              tech="Отслеживание и алерты"
              color="blue"
            />
          </div>
        </div>
      </section>

      <section className="py-24 relative border-t border-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono text-xs">СЦЕНАРИИ</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              Сценарии работы
            </h2>
            <p className="text-slate-400 text-lg">
              Как ИИ-агент решает реальные проблемы
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <UseCaseCard
              title="Контроль лекарств"
              before="Звоните 3 раза в день: «Мама, ты выпила таблетку?». Забываете сами. Нервничаете."
              after="Бот напоминает, ждёт подтверждения. Через 15 минут без ответа — алерт вам. Вся история в панели управления."
              icon={<HeartPulse className="w-5 h-5" />}
            />
            <UseCaseCard
              title="Показания ЖКХ"
              before="Долго объясняете по телефону, как отправить показания. Мама путает цифры. Перезваниваете."
              after="Мама фотографирует счётчик → ИИ распознаёт цифры → вы получаете уведомление с данными."
              icon={<Eye className="w-5 h-5" />}
            />
            <UseCaseCard
              title="Защита от мошенников"
              before="Узнаёте постфактум, что маме звонили «из банка». Переводы уже ушли. Стресс и конфликт."
              after="Бот детектирует паттерн мошенничества в диалоге → мгновенный алерт вам → инструкции маме."
              icon={<Shield className="w-5 h-5" />}
            />
          </div>
        </div>
      </section>

      <section className="py-24 relative border-t border-slate-800/50">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-red-500/10 text-red-400 border-red-500/20 font-mono text-xs">БЕЗОПАСНОСТЬ</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              Безопасность
            </h2>
            <p className="text-slate-400 text-lg">
              8 категорий обнаружения угроз и защита данных
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12">
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
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-3 hover:border-red-500/30 transition-colors" data-testid={`security-category-${i}`}>
                <div className="text-red-400">{item.icon}</div>
                <span className="text-sm text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-cyan-400" />
              </div>
              <h4 className="font-semibold mb-1 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Защита данных</h4>
              <p className="text-xs text-slate-500">Безопасное хранение и передача данных</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-cyan-400" />
              </div>
              <h4 className="font-semibold mb-1 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Приватность</h4>
              <p className="text-xs text-slate-500">Данные не используются для обучения моделей</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <h4 className="font-semibold mb-1 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Постоянный мониторинг</h4>
              <p className="text-xs text-slate-500">Алерты в реальном времени при угрозах</p>
            </div>
          </div>
        </div>
      </section>

      <section id="dashboard-preview" className="py-24 relative border-t border-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20 font-mono text-xs">ПАНЕЛЬ УПРАВЛЕНИЯ</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
                Полная картина в реальном времени
              </h2>
              <p className="text-lg text-slate-400 mb-8">
                Лента событий, статусы здоровья, история диалогов — всё в одной панели управления.
                Уведомления при критических событиях.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  "Лента событий родителя в реальном времени",
                  "Статус приёма лекарств с таймлайном",
                  "История показаний давления (графики)",
                  "Алерты безопасности с деталями",
                  "Настройка личности и тем ИИ-агента"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/dashboard">
                <Button variant="outline" className="rounded-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent" data-testid="button-demo-dashboard">
                  Открыть демо панели
                </Button>
              </Link>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="font-semibold text-lg" style={{ fontFamily: "'Inter', sans-serif" }}>Панель управления</h3>
                  <p className="text-sm text-slate-500">Мария Ивановна (Мама)</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">● В сети</Badge>
              </div>

              <div className="space-y-3">
                <DashboardEvent
                  icon={<PhoneCall className="w-4 h-4 text-blue-400" />}
                  title="Утренний чек-ин пройден"
                  subtitle="Настроение хорошее, жалоб нет"
                  time="09:15"
                  status="success"
                />
                <DashboardEvent
                  icon={<HeartPulse className="w-4 h-4 text-rose-400" />}
                  title="Напоминание о лекарстве"
                  subtitle="Эналаприл, 1 таб. — ожидание подтверждения"
                  time="10:00"
                  status="pending"
                />
                <DashboardEvent
                  icon={<Eye className="w-4 h-4 text-emerald-400" />}
                  title="Показания счётчика распознаны"
                  subtitle="ГВС: 00142.3 | ХВС: 00284.1"
                  time="Вчера"
                  status="success"
                />
                <DashboardEvent
                  icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
                  title="Обнаружен подозрительный звонок"
                  subtitle="Паттерн: «звонок из банка». Алерт отправлен."
                  time="2 дня назад"
                  status="alert"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 relative border-t border-slate-800/50">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20 font-mono text-xs">ТАРИФЫ</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              ИИ-забота за 990₽
            </h2>
            <p className="text-slate-400 text-lg">
              Первые 7 дней бесплатно. Без привязки карты. Отменить в 1 клик.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PricingCardTech
              name="Базовый"
              price="490"
              description="Базовые возможности агента"
              features={[
                "ИИ-чат в Telegram",
                "Напоминания о лекарствах",
                "Дневник давления",
                "Лента событий",
                "До 5 напоминаний/день"
              ]}
            />
            <PricingCardTech
              name="Стандарт"
              price="990"
              popular
              description="Полный набор ИИ-возможностей"
              features={[
                "Всё из Базового",
                "Голосовые сообщения",
                "Распознавание по фото",
                "Обнаружение угроз",
                "Проактивные сообщения",
                "Безлимитные напоминания",
                "Генерация изображений"
              ]}
            />
            <PricingCardTech
              name="Премиум"
              price="1 990"
              description="Максимум возможностей"
              features={[
                "Всё из Стандарта",
                "Настройка личности бота",
                "Темы экспертизы",
                "Расширенная история давления",
                "Рецепты с инструкциями",
                "Погода по городу"
              ]}
            />
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing">
              <Button variant="link" className="text-cyan-400 hover:text-cyan-300" data-testid="link-pricing-details">Детальное сравнение тарифов →</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 relative border-t border-slate-800/50">
        <div className="container mx-auto px-6 relative z-10 max-w-3xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-slate-800 text-slate-400 border-slate-700 font-mono text-xs">ВОПРОСЫ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>
              Частые вопросы
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Какие технологии ИИ используются?",
                a: "Продвинутая нейросеть для диалогов и анализа, голосовой ИИ для распознавания и синтеза речи, компьютерное зрение для распознавания по фото, генерация изображений для открыток и картинок."
              },
              {
                q: "Нужен ли смартфон для родителя?",
                a: "Достаточно любого телефона с Telegram. Бот работает с текстовыми и голосовыми сообщениями. Никаких сложных интерфейсов — только чат."
              },
              {
                q: "Как быстро агент реагирует на мошенников?",
                a: "Обнаружение угроз работает в реальном времени. При обнаружении подозрительного паттерна алерт отправляется в течение нескольких секунд через уведомление и Telegram."
              },
              {
                q: "Безопасны ли данные?",
                a: "Данные надёжно защищены при хранении и передаче. Данные не используются для обучения моделей."
              },
              {
                q: "Можно ли настроить личность бота?",
                a: "Да, вы выбираете имя, стиль общения (формальный/дружеский), темы для проактивных сообщений. Бот адаптируется под предпочтения родителя."
              },
              {
                q: "Как работает защита от мошенников?",
                a: "ИИ анализирует диалог в реальном времени и распознаёт 8 категорий угроз: банковские мошенники, социальная инженерия, фейковые службы, лотереи, и другие. При обнаружении — мгновенный алерт ребёнку."
              }
            ].map((item, i) => (
              <div
                key={i}
                className="border border-slate-800 rounded-xl overflow-hidden"
                data-testid={`faq-item-${i}`}
              >
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-900/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  data-testid={`faq-toggle-${i}`}
                >
                  <span className="font-medium text-slate-200">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-slate-400 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 border-t border-slate-800/50">
        <div className="container mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />

            <div className="relative z-10 p-8 md:p-16 text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
                Подключить ИИ-заботу
              </h2>
              <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
                3 минуты на настройку. ИИ начнёт заботиться о ваших родителях уже сегодня.
              </p>
              <Link href="/auth">
                <Button size="lg" className="rounded-full h-14 px-8 bg-white text-slate-900 hover:bg-slate-100 font-semibold text-lg shadow-xl" data-testid="button-cta-final">
                  Запустить агента бесплатно <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <p className="mt-4 text-sm text-blue-200/80">7 дней бесплатно · Без привязки карты · Отмена в 1 клик</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800/50 py-12 text-slate-500 text-sm">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <Bot className="w-5 h-5 text-cyan-400" />
            <span className="font-bold tracking-tight">Внучок<span className="text-cyan-400">.ai</span></span>
          </div>
          <p>© 2025 Внучок. ИИ-забота о родителях.</p>
        </div>
      </footer>

      <VariantToggle current="B" />
    </div>
  );
}

function VariantToggle({ current }: { current: "A" | "B" }) {
  const [, navigate] = useLocation();
  const other = current === "A" ? "B" : "A";
  const otherPath = current === "A" ? "/b" : "/a";
  const otherLabel = current === "A" ? "Тех-дизайн" : "Эмоциональный";

  return (
    <button
      onClick={() => {
        localStorage.setItem("vnuchok_ab_variant", other);
        navigate(otherPath);
      }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-slate-800 shadow-xl shadow-cyan-500/10 border border-cyan-500/30 hover:shadow-cyan-500/20 hover:scale-105 transition-all text-sm font-medium text-slate-300 group"
      data-testid="button-switch-variant"
    >
      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
      <span>Вариант {current}</span>
      <span className="text-slate-600 mx-1">|</span>
      <span className="text-cyan-400 group-hover:underline">{otherLabel}</span>
    </button>
  );
}

function WaitlistFormDark() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        toast({ title: "Вы в списке!", description: data.message || "Мы сообщим о запуске." });
      }
    } catch {
      toast({ title: "Ошибка", description: "Попробуйте позже", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center gap-3 text-sm text-emerald-400 bg-emerald-500/10 rounded-full px-5 py-3 w-fit mx-auto border border-emerald-500/20">
        <CheckCircle2 className="w-5 h-5" />
        <span>Спасибо! Мы вам напишем.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto" data-testid="form-waitlist">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          type="email"
          placeholder="Ваша электронная почта"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-9 rounded-full h-11 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
          data-testid="input-waitlist-email"
          required
        />
      </div>
      <Button type="submit" className="rounded-full h-11 px-5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold" disabled={loading} data-testid="button-waitlist-submit">
        {loading ? "..." : "Записаться"}
      </Button>
    </form>
  );
}

function ArchCard({ icon, title, subtitle, description, gradient }: { icon: React.ReactNode; title: string; subtitle: string; description: string; gradient: string }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group" data-testid={`arch-card-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 text-white shadow-lg group-hover:scale-105 transition-transform`}>
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{title}</h3>
      <p className="text-xs text-slate-500 mb-3">{subtitle}</p>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCardTech({ icon, title, subtitle, description, tech, color }: { icon: React.ReactNode; title: string; subtitle: string; description: string; tech: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  const badgeColor: Record<string, string> = {
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all" data-testid={`feature-card-${color}`}>
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${colorMap[color]}`}>
        {icon}
      </div>
      <h3 className="font-bold text-base mb-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{title}</h3>
      <p className="text-sm text-slate-400 mb-3">{subtitle}</p>
      <p className="text-sm text-slate-500 leading-relaxed mb-4">{description}</p>
      <Badge className={`text-[10px] ${badgeColor[color]}`}>{tech}</Badge>
    </div>
  );
}

function UseCaseCard({ title, before, after, icon }: { title: string; before: string; after: string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6" data-testid={`usecase-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          {icon}
        </div>
        <h3 className="font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>{title}</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">БЫЛО</span>
          </div>
          <p className="text-sm text-slate-400">{before}</p>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">СТАЛО</span>
          </div>
          <p className="text-sm text-slate-400">{after}</p>
        </div>
      </div>
    </div>
  );
}

function PricingCardTech({ name, price, description, features, popular }: { name: string; price: string; description: string; features: string[]; popular?: boolean }) {
  return (
    <div className={`relative rounded-2xl p-6 transition-all ${popular ? "bg-gradient-to-b from-cyan-500/10 to-blue-500/5 border-2 border-cyan-500/30 scale-105" : "bg-slate-900/50 border border-slate-800 hover:border-slate-700"}`} data-testid={`pricing-card-${name.toLowerCase()}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-cyan-500 text-slate-950 font-semibold px-3 py-1 shadow-lg shadow-cyan-500/30">
            <Star className="w-3 h-3 mr-1" /> Популярный
          </Badge>
        </div>
      )}

      <div className="text-center mb-6 pt-2">
        <h3 className="font-bold text-xl mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>{name}</h3>
        <p className="text-xs text-slate-500 mb-4">{description}</p>
        <div>
          <span className="text-4xl font-bold">{price}₽</span>
          <span className="text-slate-500">/мес</span>
        </div>
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span className="text-slate-300">{f}</span>
          </li>
        ))}
      </ul>

      <Link href="/auth">
        <Button
          className={`w-full rounded-full ${popular ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
          data-testid={`button-pricing-${name.toLowerCase()}`}
        >
          Выбрать тариф
        </Button>
      </Link>
    </div>
  );
}

function DashboardEvent({ icon, title, subtitle, time, status }: { icon: React.ReactNode; title: string; subtitle: string; time: string; status: "success" | "pending" | "alert" }) {
  const statusColors = {
    success: "border-slate-800",
    pending: "border-amber-500/20 bg-amber-500/5",
    alert: "border-red-500/20 bg-red-500/5",
  };

  return (
    <div className={`p-3 rounded-xl border ${statusColors[status]} flex items-start gap-3`}>
      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-slate-200 truncate">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <span className="text-[10px] text-slate-600 shrink-0">{time}</span>
    </div>
  );
}
