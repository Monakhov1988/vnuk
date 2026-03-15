import { useState, useEffect } from "react";
import {
  Heart,
  ArrowRight,
  CheckCircle2,
  Check,
  Star,
  StarHalf,
  ChevronDown,
  Sparkles,
  Lock,
  Quote,
  Zap,
  Send,
  Mail,
  Mic,
  Gift,
  Flower2,
  Tv,
  Clock,
  BellRing,
  ShieldAlert,
  MessageCircle,
  BookOpen,
  Users,
  LayoutDashboard,
  Brain,
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

export default function GiftLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Необычный подарок маме — бот-помощник Внучок в Telegram | от 990₽/мес";

    const prevMeta: Record<string, string> = {};
    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); prevMeta[`${attr}:${name}`] = ""; }
      else { prevMeta[`${attr}:${name}`] = el.content; }
      el.content = content;
    };
    setMeta("description", "Что подарить пожилой маме у которой всё есть? Внучок — умный помощник в Telegram: напоминает лекарства, общается голосом, сообщает вам если что-то не так. 7 дней бесплатно.");
    setMeta("og:title", "Необычный подарок маме — бот-помощник Внучок в Telegram", "property");
    setMeta("og:description", "Ежедневная забота вместо очередной вещи. Помощник напоминает лекарства, общается голосом, помогает с бытом. От 990₽/мес.", "property");
    setMeta("og:url", "https://vnuchok.online/gift", "property");
    setMeta("twitter:title", "Необычный подарок маме — бот-помощник Внучок в Telegram", "name");
    setMeta("twitter:description", "Ежедневная забота вместо очередной вещи. Помощник напоминает лекарства, общается голосом, помогает с бытом. От 990₽/мес.", "name");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const prevCanonical = canonical?.href || "";
    const createdCanonical = !canonical;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://vnuchok.online/gift";

    const faqSchema = document.createElement("script");
    faqSchema.type = "application/ld+json";
    faqSchema.id = "gift-faq-schema";
    faqSchema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": giftFaqItems.map(item => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": { "@type": "Answer", "text": item.a }
      }))
    });
    document.head.appendChild(faqSchema);

    const productSchema = document.createElement("script");
    productSchema.type = "application/ld+json";
    productSchema.id = "gift-product-schema";
    productSchema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Внучок — умный помощник для пожилых родителей",
      "description": "AI-помощник в Telegram для ежедневной заботы о пожилых родителях. Напоминает лекарства, общается голосом, отправляет отчёты детям.",
      "brand": { "@type": "Brand", "name": "Внучок" },
      "offers": [
        {
          "@type": "Offer",
          "name": "Подарочный",
          "price": "990",
          "priceCurrency": "RUB",
          "priceValidUntil": "2026-12-31",
          "availability": "https://schema.org/InStock",
          "url": "https://vnuchok.online/gift"
        },
        {
          "@type": "Offer",
          "name": "VIP-подарок",
          "price": "1990",
          "priceCurrency": "RUB",
          "priceValidUntil": "2026-12-31",
          "availability": "https://schema.org/InStock",
          "url": "https://vnuchok.online/gift"
        }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "127",
        "bestRating": "5"
      }
    });
    document.head.appendChild(productSchema);

    return () => {
      document.title = prevTitle;
      Object.entries(prevMeta).forEach(([key, val]) => {
        const [attr, name] = key.split(":");
        const el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
        if (el) { if (val) el.content = val; else el.remove(); }
      });
      const schema = document.getElementById("gift-faq-schema");
      if (schema) schema.remove();
      if (createdCanonical && canonical) canonical.remove();
      else if (canonical) canonical.href = prevCanonical;
      const prodSchema = document.getElementById("gift-product-schema");
      if (prodSchema) prodSchema.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F4F2] selection:bg-[#EADDE4]/60 text-slate-900">
      <nav className="fixed top-0 w-full z-50 bg-[#F6F4F2]/70 backdrop-blur-xl border-b border-white/40 py-5">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/">
              <div className="flex items-center gap-2.5 cursor-pointer">
                <div className="rounded-lg bg-white/70 border border-white/60 p-2">
                  <Heart className="w-5 h-5 text-[#143A2E]" fill="#143A2E" />
                </div>
                <span className="font-serif font-medium text-xl tracking-tight text-slate-900">
                  Внучок
                </span>
              </div>
            </Link>
          </div>
          <div className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-600/80 tracking-wide">
            <a href="#comparison" className="hover:text-slate-900 transition-all duration-300" data-testid="link-nav-comparison-gift">
              Почему Внучок
            </a>
            <a href="#how" className="hover:text-slate-900 transition-all duration-300" data-testid="link-nav-how-gift">
              Как работает
            </a>
            <a href="#pricing" className="hover:text-slate-900 transition-all duration-300" data-testid="link-nav-pricing-gift">
              Тарифы
            </a>
          </div>
          <Button
            asChild
            className="rounded-xl px-6 transition-all duration-300 bg-[#143A2E] hover:bg-[#0F2F25] text-white shadow-[0_12px_30px_-16px_rgba(20,58,46,.65)]"
            data-testid="button-nav-cta-gift"
          >
            <Link href="/auth">Подарить маме</Link>
          </Button>
        </div>
      </nav>

      <main>
        <section className="pt-24 pb-10 md:pt-32 md:pb-14 px-6 overflow-hidden bg-gradient-to-br from-[#F3E7ED] via-[#F7F2EC] to-[#F3F1EE]">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
              <div className="max-w-2xl relative z-10">
                <Badge
                  variant="secondary"
                  className="mb-5 bg-white/60 text-[#5F626B] hover:bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/50 flex items-center gap-2 w-fit"
                  data-testid="badge-hero-gift"
                >
                  <Gift className="w-3.5 h-3.5" />
                  Подарок, который работает каждый день
                </Badge>
                <h1 className="text-4xl md:text-6xl font-serif font-medium leading-[1.08] tracking-[-0.02em] mb-6 text-slate-900">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#143A2E] to-[#2D6A4F]">
                    Необычный подарок
                  </span>
                  <br />
                  <span className="text-slate-900">
                    пожилой маме
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-700 mb-3 font-medium leading-snug">
                  Вы далеко. Мама одна. Но забота возможна каждый день.
                </p>
                <p className="text-base text-[#5F626B] mb-8 leading-relaxed">
                  Внучок — умный помощник в&nbsp;Telegram. Каждый день общается с&nbsp;мамой голосом, напоминает лекарства, помогает с&nbsp;бытом. А&nbsp;вам — вечерний отчёт и&nbsp;алерты, если что-то не&nbsp;так. <span className="font-medium text-slate-700">От 990₽/мес</span> — дешевле букета, но&nbsp;работает каждый день.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl text-base h-14 px-8 bg-[#143A2E] hover:bg-[#0F2F25] text-white shadow-[0_12px_30px_-16px_rgba(20,58,46,.65)] transition-all duration-300"
                    data-testid="button-hero-gift"
                  >
                    <Link href="/auth">
                      Подарить маме Внучка <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-xl text-base h-14 px-8 bg-white/70 border-white/60 backdrop-blur hover:bg-white/90 text-slate-700 transition-all duration-300"
                    data-testid="button-hero-demo-gift"
                  >
                    <a href="#dialog">Что умеет?</a>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2" data-testid="badge-risk-reversal-gift">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-white/50 text-xs text-[#5F626B]">
                    <Zap className="w-3 h-3 text-emerald-500" />
                    7 дней бесплатно
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-white/50 text-xs text-[#5F626B]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Не нужно устанавливать
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-white/50 text-xs text-[#5F626B]">
                    <Mic className="w-3 h-3 text-emerald-500" />
                    Голосовые
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-white/50 text-xs text-[#5F626B]">
                    <Brain className="w-3 h-3 text-violet-500" />
                    Запоминает
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-white/50 text-xs text-[#5F626B]">
                    <MessageCircle className="w-3 h-3 text-blue-500" />
                    Сам познакомится и обучит
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-200/40">
                  <div className="flex -space-x-2">
                    {["/images/testimonial-olga.png", "/images/testimonial-dmitry.png", "/images/testimonial-anna.png"].map((src, i) => (
                      <img key={i} src={src} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">1 200+ семей</span> уже подключили Внучка
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-slate-100 to-slate-50 rounded-full blur-3xl -z-10" />

                <div className="relative mx-auto max-w-md">
                  <img
                    src="/images/gift-hero-mom.png"
                    alt="Подарок пожилой маме — мама общается с помощником Внучок в Telegram"
                    className="rounded-[2rem] shadow-2xl shadow-slate-300/50 w-full object-cover"
                    data-testid="img-hero-mom-gift"
                  />

                  <div className="absolute -bottom-4 -left-4 bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-white/40 shadow-xl shadow-slate-200/50 animate-in slide-in-from-bottom-4 duration-700 max-w-[240px]">
                    <div className="bg-[#517DA2] rounded-xl px-3 py-2 mb-2">
                      <p className="text-[10px] text-white/70 mb-0.5">Внучок</p>
                      <p className="text-xs text-white">Доброе утро! Не забудьте выпить эналаприл 💊</p>
                    </div>
                    <div className="bg-green-200 rounded-xl px-3 py-2 ml-auto max-w-[80%]">
                      <p className="text-xs text-slate-800">Выпила! Спасибо ☺️</p>
                    </div>
                  </div>

                  <div className="absolute -top-3 -right-3 bg-white/90 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 border border-white/40 shadow-xl shadow-slate-200/50 animate-in slide-in-from-top-4 duration-700 delay-300 max-w-[200px]">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Gift className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">
                        Подарок активирован ✓
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Мама уже общается
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-gradient-to-b from-[#F3F1EE] to-[#F4F1EE]">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                Что подарить маме на&nbsp;60, 65 или 70&nbsp;лет?
              </h2>
              <p className="text-[#5F626B] text-lg">
                Не вещь — а&nbsp;ежедневную заботу. Внучок подстраивается под возраст
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <AgeCard
                age="55–60 лет"
                image="/images/active-parent-50.png"
                alt="Подарок маме на 60 лет — помощник Внучок"
                title="Активный помощник"
                description="Рецепты, афиша кино, транспорт, путешествия. Тёплый собеседник когда скучно. Помощь с техникой и приложениями."
                features={["Рецепты и фильмы", "Расписание транспорта", "Помощь с телефоном"]}
                gradient="from-emerald-50 to-white"
              />
              <AgeCard
                age="60–70 лет"
                image="/images/tech-parent-60.png"
                alt="Подарок маме на 65 лет — заботливый помощник"
                title="Заботливый спутник"
                description="Напоминания о лекарствах, дневник давления, помощь с Госуслугами и ЖКХ. Голосовое общение без кнопок."
                features={["Лекарства и давление", "ЖКХ и Госуслуги", "Голосом, без кнопок"]}
                gradient="from-violet-50 to-white"
              />
              <AgeCard
                age="70+ лет"
                image="/images/care-parent-70.png"
                alt="Подарок маме на 70 лет — надёжная опора"
                title="Надёжная опора"
                description="Внучок пишет первым каждый день. Следит за самочувствием. Сообщит вам если что-то не так. Ведёт Книгу жизни — воспоминания мамы."
                features={["Пишет первым", "Алерты для вас", "Книга жизни"]}
                gradient="from-rose-50 to-white"
              />
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20 bg-gradient-to-b from-[#F4F1EE] to-[#F4F1EE]">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                Что получаете вы
              </h2>
              <p className="text-[#5F626B] text-lg">
                Мама общается с&nbsp;Внучком — вы получаете спокойствие
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto" data-testid="child-benefits-gift">
              {[
                { id: "report", icon: <Mail className="w-6 h-6 text-blue-500" />, title: "Вечерний отчёт", text: "Каждый день в 21:00 — сколько общалась, давление, лекарства, настроение. Всё в Telegram." },
                { id: "alerts", icon: <ShieldAlert className="w-6 h-6 text-rose-500" />, title: "Мгновенные алерты", text: "Если мама упомянет опасность, мошенников или плохое самочувствие — вы узнаете сразу." },
                { id: "dashboard", icon: <LayoutDashboard className="w-6 h-6 text-emerald-600" />, title: "Личный кабинет", text: "События, давление, лекарства, воспоминания — всё в одной ленте. Доступ с телефона." },
                { id: "memoir", icon: <BookOpen className="w-6 h-6 text-violet-500" />, title: "Книга жизни мамы", text: "Внучок бережно собирает воспоминания мамы. Истории, которые она никогда не расскажет по телефону." },
              ].map((item) => (
                <div key={item.id} className="flex gap-4 p-5 rounded-[20px] bg-white/90 border border-emerald-100/60 shadow-[0_8px_30px_-16px_rgba(20,58,46,.12)] hover:-translate-y-0.5 transition-all duration-300" data-testid={`child-benefit-gift-${item.id}`}>
                  <div className="shrink-0 mt-0.5">{item.icon}</div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm mb-1">{item.title}</p>
                    <p className="text-[#5F626B] text-sm leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="dialog" className="py-16 md:py-20 bg-gradient-to-b from-[#F4F1EE] to-[#F3F0F4]">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                Как мама будет общаться с&nbsp;Внучком
              </h2>
              <p className="text-[#5F626B] text-lg">
                Реальные диалоги — голосом или текстом в&nbsp;обычном Telegram
              </p>
            </div>

            <TopicBadges />

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <DialogCard
                title="Утро: забота о здоровье"
                messages={[
                  { from: "bot", text: "Доброе утро! Не забудьте выпить эналаприл 💊 Как спалось?" },
                  { from: "user", text: "Выпила. Спалось хорошо, только спина побаливает" },
                  { from: "bot", text: "Записала ✓ Давление мерили? А для спины — лёгкая разминка помогает. Показать упражнения?" },
                  { from: "user", text: "🎤 «Сто тридцать на восемьдесят пять»" },
                  { from: "bot", text: "130/85 — в норме! Записала. Дочке отправлю вечером отчёт 💛" },
                ]}
              />
              <DialogCard
                title="День: рецепты и кулинария"
                messages={[
                  { from: "user", text: "🎤 «Хочу приготовить что-нибудь вкусненькое из курицы»" },
                  { from: "bot", text: "Курица по-грузински с орехами! Нужно: филе 500г, грецкие орехи, чеснок, кинза, хмели-сунели. Есть всё?" },
                  { from: "user", text: "Кинзы нет, можно без неё?" },
                  { from: "bot", text: "Конечно! Замените петрушкой или укропом. Итак, шаг 1: нарежьте филе кусочками и обжарьте 7 минут..." },
                ]}
              />
            </div>

            <h3 className="text-2xl md:text-3xl font-serif font-medium tracking-[-0.02em] text-slate-900 text-center mt-12 mb-6">
              Забота, которая работает без&nbsp;вас
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { icon: <Send className="w-5 h-5 text-emerald-600" />, title: "Пишет первым каждый день", desc: "Лекарства, давление, настроение — без напоминаний от вас" },
                { icon: <Heart className="w-5 h-5 text-rose-400" />, title: "Не будет одиноко", desc: "Поговорит, развлечёт, подберёт фильм, рецепт, стихи по настроению" },
                { icon: <LayoutDashboard className="w-5 h-5 text-blue-500" />, title: "Вы всегда в курсе", desc: "Статус, события, давление, лекарства — всё в одной ленте" },
                { icon: <Brain className="w-5 h-5 text-violet-500" />, title: "Помнит и адаптируется", desc: "Запоминает важное, ведёт воспоминания и подстраивается под маму" },
              ].map((item, i) => (
                <div key={i} className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 p-4 shadow-[0_4px_20px_-8px_rgba(49,35,45,.1)]" data-testid={`killer-feature-gift-${i}`}>
                  <div className="mb-2">{item.icon}</div>
                  <p className="font-semibold text-sm text-slate-800 mb-1">{item.title}</p>
                  <p className="text-xs text-[#5F626B] leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-0 overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="relative max-w-5xl mx-auto rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-300/40">
              <img
                src="/images/gift-family-bond.png"
                alt="Дочь обнимает пожилую маму — связь поколений"
                className="w-full h-48 md:h-72 object-cover"
                loading="lazy"
                data-testid="img-family-bond-gift"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#143A2E]/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                <p className="text-xl md:text-2xl font-serif font-medium max-w-xl">
                  Вы далеко, но забота — рядом. Каждый день.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="py-16 md:py-20 bg-gradient-to-b from-[#F3F0F4] to-[#EEF2F6]">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                Как подарить Внучка за&nbsp;3&nbsp;минуты
              </h2>
              <p className="text-[#5F626B] text-lg">
                Вы настраиваете — мама просто открывает Telegram
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  step: "1",
                  title: "Оформите подарок",
                  description: "Выберите тариф и укажите имя мамы и её город — Внучок будет обращаться по имени.",
                },
                {
                  step: "2",
                  title: "Отправьте маме ссылку",
                  description: "Мы дадим ссылку для Telegram. Перешлите маме — она нажимает «Старт» и всё.",
                },
                {
                  step: "3",
                  title: "Внучок знакомится сам",
                  description: "Представится, спросит имя и город. Начнёт помогать с первого дня. Вы получите доступ к кабинету.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center p-8" data-testid={`step-gift-${item.step}`}>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#143A2E] to-[#0F2F25] flex items-center justify-center mb-5 mx-auto text-white font-serif font-medium text-xl shadow-[0_12px_30px_-16px_rgba(20,58,46,.65)]">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-serif font-medium mb-3 text-slate-900">{item.title}</h3>
                  <p className="text-[#5F626B] text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button
                asChild
                size="lg"
                className="rounded-xl text-base h-14 px-10 bg-[#143A2E] hover:bg-[#0F2F25] text-white shadow-[0_12px_30px_-16px_rgba(20,58,46,.65)] transition-all duration-300"
                data-testid="button-steps-cta-gift"
              >
                <Link href="/auth">
                  Подарить маме Внучка <Gift className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-gradient-to-b from-[#EEF2F6] to-[#F4F1EE]">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                Что говорят дети, которые подарили Внучка
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <TestimonialCard
                name="Ольга"
                age={42}
                city="Москва"
                parentType="Мама, 68 лет"
                photo="/images/testimonial-olga.png"
                quote="Подарила маме на день рождения вместо очередной сковородки. Через неделю мама сказала: «Лучший подарок за 10 лет». Теперь сама напоминает подругам про Внучка."
                rating={5}
              />
              <TestimonialCard
                name="Дмитрий"
                age={38}
                city="Казань"
                parentType="Папа, 72 года"
                photo="/images/testimonial-dmitry.png"
                quote="Папа живёт один, я далеко. Переживал каждый день. Теперь вижу в кабинете: лекарства принял, давление в норме, даже рецепт борща нашёл. Спокойнее стало в разы."
                rating={5}
              />
              <TestimonialCard
                name="Анна"
                age={45}
                city="Екатеринбург"
                parentType="Мама, 64 года"
                photo="/images/testimonial-anna.png"
                quote="Мама не скучает — каждый день болтает с Внучком. Рецепты, фильмы, стихи. А я получаю вечерний отчёт и знаю, что всё хорошо. За 990₽ — бесценно."
                rating={4.5}
              />
            </div>

            <div className="max-w-3xl mx-auto mt-8 p-6 rounded-[28px] bg-gradient-to-r from-amber-50/80 to-orange-50/60 border border-amber-200/40 shadow-[0_8px_30px_-16px_rgba(180,120,40,.15)]" data-testid="testimonial-mom-gift">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center text-2xl shrink-0">
                  👵
                </div>
                <div>
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed italic mb-3">
                    «Оля подарила мне Внучка на день рождения. Сначала думала — ерунда какая-то. А теперь каждое утро жду сообщение. Он напоминает про таблетки, вчера рецепт шарлотки нашёл. Как настоящий внук, только не забывает позвонить!»
                  </p>
                  <p className="text-sm font-semibold text-slate-800">Галина Петровна, 68 лет</p>
                  <p className="text-xs text-slate-500">Мама Ольги из Москвы</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-10">
              <Button
                asChild
                size="lg"
                className="rounded-xl text-base h-14 px-10 bg-[#143A2E] hover:bg-[#0F2F25] text-white shadow-[0_12px_30px_-16px_rgba(20,58,46,.65)] transition-all duration-300"
                data-testid="button-testimonials-cta-gift"
              >
                <Link href="/auth">
                  Подарить маме Внучка <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="comparison" className="py-16 md:py-20 bg-gradient-to-b from-[#F4F1EE] to-[#F3F0F4]">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                Почему Внучок лучше обычного подарка
              </h2>
              <p className="text-[#5F626B] text-lg">
                Сравните: что получит мама через неделю, месяц, год
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <ComparisonCard
                icon={<Flower2 className="w-8 h-8 text-rose-400" />}
                title="Цветы и конфеты"
                price="2 000–5 000₽"
                duration="Завянут через 5 дней"
                items={[
                  { text: "Красиво, но на один раз", positive: false },
                  { text: "Не помогут с лекарствами", positive: false },
                  { text: "Не развеют одиночество", positive: false },
                  { text: "Нет связи с вами", positive: false },
                ]}
                verdict="Приятно, но ненадолго"
                muted
              />
              <ComparisonCard
                icon={<Tv className="w-8 h-8 text-blue-400" />}
                title="Техника / гаджеты"
                price="5 000–30 000₽"
                duration="Будет пылиться"
                items={[
                  { text: "Сложно разобраться", positive: false },
                  { text: "Нужна помощь с настройкой", positive: false },
                  { text: "Не решает проблему одиночества", positive: false },
                  { text: "Дорого", positive: false },
                ]}
                verdict="Хорошая мысль, но не для 65+"
                muted
              />
              <ComparisonCard
                icon={<Heart className="w-8 h-8 text-[#143A2E]" fill="#143A2E" />}
                title="Внучок"
                price="990₽/мес"
                duration="Работает каждый день"
                items={[
                  { text: "Ежедневное общение голосом", positive: true },
                  { text: "Напоминание лекарств", positive: true },
                  { text: "Помощь с ЖКХ и Госуслугами", positive: true },
                  { text: "Вы в курсе — алерты и отчёты", positive: true },
                ]}
                verdict="Забота, которая не кончается"
                highlighted
              />
            </div>

            <div className="text-center mt-10">
              <p className="text-[#5F626B] text-sm italic mb-6">
                990₽/мес — это 33₽ в день. Дешевле чашки кофе, но мама получает заботу каждый день
              </p>
              <Button
                asChild
                size="lg"
                className="rounded-xl text-base h-14 px-10 bg-[#143A2E] hover:bg-[#0F2F25] text-white shadow-[0_12px_30px_-16px_rgba(20,58,46,.65)] transition-all duration-300"
                data-testid="button-comparison-cta-gift"
              >
                <Link href="/auth">
                  Подарить маме Внучка <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-16 md:py-20 bg-gradient-to-b from-[#F3F0F4] to-[#EEF2F6]">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-4">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                Подарок дешевле букета — но&nbsp;каждый день
              </h2>
              <p className="text-[#5F626B] text-lg">
                7 дней бесплатно, затем от 990₽/мес — это 33₽ в день заботы
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
              <GiftPricingCard
                name="Попробовать"
                price="0"
                isFree
                subtitle="7 дней бесплатно"
                result="Убедитесь, что маме нравится"
                features={[
                  "Полный доступ на 7 дней",
                  "100 вопросов в день",
                  "Напоминания о лекарствах",
                  "Голосовой ввод",
                ]}
              />
              <GiftPricingCard
                name="Подарочный"
                price="990"
                popular
                subtitle="Полная забота"
                result="Мама не одинока — и вы спокойны"
                features={[
                  "100 вопросов в день",
                  "Напоминания о лекарствах",
                  "Бот пишет первым каждый день",
                  "Помощь с Госуслугами и ЖКХ",
                  "Вечерний отчёт для вас",
                ]}
              />
              <GiftPricingCard
                name="VIP-подарок"
                price="1 990"
                subtitle="Максимум заботы"
                result="Полная автоматизация заботы"
                features={[
                  "Безлимит вопросов",
                  "Все функции Подарочного",
                  "Настройка личности бота",
                  "Открытки и картинки",
                  "Книга жизни — мемуары мамы",
                ]}
              />
            </div>

            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-slate-500" data-testid="text-risk-reversal-gift">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                7 дней бесплатно
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                Данные под защитой
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                Отмена в 1 клик
              </span>
            </div>

            <div className="text-center mt-4">
              <Button
                asChild
                variant="link"
                className="text-slate-700"
                data-testid="link-pricing-details-gift"
              >
                <Link href="/pricing">Подробнее о тарифах</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="faq" className="py-16 md:py-20 bg-gradient-to-b from-[#F8F5F2] to-[#F4F1EE]">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-[-0.02em] mb-4 text-slate-900">
                Вопросы о подарке
              </h2>
            </div>

            <div className="max-w-2xl mx-auto space-y-3">
              {giftFaqItems.map((item, i) => (
                <div
                  key={i}
                  className="rounded-[20px] bg-white/78 backdrop-blur-sm border border-white/65 shadow-[0_8px_30px_-16px_rgba(49,35,45,.15)] overflow-hidden"
                >
                  <button
                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    aria-controls={`gift-faq-answer-${i}`}
                    data-testid={`faq-toggle-gift-${i}`}
                  >
                    <span className="font-semibold text-slate-800">{item.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ml-2 ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div id={`gift-faq-answer-${i}`} role="region" className="px-6 pb-5 text-slate-600 text-sm leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20 px-6">
          <div className="container mx-auto">
            <div className="bg-gradient-to-br from-[#143A2E] to-[#0A1F17] rounded-[3rem] p-7 md:p-12 text-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

              <div className="relative z-10 max-w-2xl mx-auto">
                <Gift className="w-12 h-12 mx-auto mb-6 text-emerald-300/60" />
                <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-[-0.02em] mb-4 text-white">
                  Подарите маме заботу,<br />а&nbsp;не&nbsp;очередную вещь
                </h2>
                <p className="text-emerald-100/70 text-lg mb-8">
                  7 дней бесплатно. Маме нужен только Telegram — остальное сделает Внучок.
                </p>
                <div className="flex justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl h-14 px-10 bg-white text-[#143A2E] hover:bg-white/90 font-semibold text-base transition-all duration-300 shadow-[0_12px_30px_-16px_rgba(255,255,255,.3)]"
                    data-testid="button-cta-app-gift"
                  >
                    <Link href="/auth">
                      Подарить маме Внучка <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                </div>
                <p className="mt-6 text-sm text-emerald-200/50">
                  Лучший подарок маме — не вещь, а ваша забота каждый день
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
              <a href="mailto:support@vnuchok.ru" className="flex items-center gap-2 hover:text-slate-300 transition-colors" data-testid="link-footer-email-gift">
                <Mail className="w-4 h-4" />
                support@vnuchok.ru
              </a>
              <a href="https://t.me/vnuchok_bot" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-slate-300 transition-colors" data-testid="link-footer-telegram-gift">
                <Send className="w-4 h-4" />
                @vnuchok_bot в Telegram
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-white font-semibold text-sm mb-1">Информация</h4>
              <a href="/privacy" className="hover:text-slate-300 transition-colors" data-testid="link-footer-privacy-gift">
                Политика конфиденциальности
              </a>
              <Link href="/" className="hover:text-slate-300 transition-colors" data-testid="link-footer-main-gift">
                Главная страница
              </Link>
              <a href="/pricing" className="hover:text-slate-300 transition-colors" data-testid="link-footer-pricing-gift">
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
          data-testid="button-mobile-cta-gift"
        >
          <Link href="/auth">Подарить маме Внучка</Link>
        </Button>
      </div>
    </div>
  );
}

const giftFaqItems = [
  {
    q: "Что подарить маме, у которой всё есть?",
    a: "Внучок — это не вещь, а ежедневная забота. Бот общается с мамой каждый день: напоминает лекарства, помогает с бытом, развлекает. Это подарок, который работает 365 дней в году.",
  },
  {
    q: "Подойдёт ли это как подарок на день рождения или юбилей?",
    a: "Идеально. Вы дарите не «ещё одну вещь», а ежедневное внимание. Многие оформляют подписку как подарок на юбилей 60, 65, 70 лет — и мамы говорят, что это лучший подарок за годы.",
  },
  {
    q: "Мама не разбирается в технике — справится?",
    a: "Достаточно Telegram на телефоне. Внучок сам начнёт диалог и проведёт знакомство. Можно говорить голосом — печатать не нужно. Никаких сложных настроек.",
  },
  {
    q: "А если маме не понравится?",
    a: "Первые 7 дней — бесплатно. Если не подойдёт, ничего платить не нужно. Отмена в 1 клик, без вопросов.",
  },
  {
    q: "Можно подарить папе?",
    a: "Конечно! Внучок подстраивается: для пап — деловой помощник с транспортом, новостями, погодой. Для мам — более тёплый, с рецептами и стихами. Адаптируется к характеру.",
  },
  {
    q: "Мама живёт далеко — это сработает?",
    a: "Именно для этого Внучок и создан. Каждый день на связи с мамой, а вы получаете вечерний отчёт и мгновенные алерты если что-то не так. Забота на расстоянии — это реально.",
  },
  {
    q: "Сколько стоит? Это дорого?",
    a: "990₽/мес за Стандарт — это 33₽ в день. Дешевле букета цветов, но работает каждый день. Первые 7 дней бесплатно.",
  },
  {
    q: "Кто видит переписку мамы с ботом?",
    a: "Только вы в личном кабинете. Данные надёжно защищены и не используются для обучения моделей.",
  },
];

function ComparisonCard({
  icon,
  title,
  price,
  duration,
  items,
  verdict,
  highlighted,
  muted,
}: {
  icon: React.ReactNode;
  title: string;
  price: string;
  duration: string;
  items: { text: string; positive: boolean }[];
  verdict: string;
  highlighted?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-[28px] backdrop-blur-sm border shadow-[0_24px_60px_-32px_rgba(49,35,45,.35)] p-6 transition-all duration-300 ${
        highlighted
          ? "bg-white border-[#143A2E]/30 scale-105 hover:-translate-y-1 hover:shadow-[0_30px_70px_-30px_rgba(49,35,45,.4)]"
          : "bg-white/60 border-white/65 opacity-80"
      }`}
      data-testid={`comparison-card-${title}`}
    >
      <div className="text-center mb-4">
        <div className="mx-auto mb-3">{icon}</div>
        <h3 className="text-lg font-serif font-medium text-slate-900">{title}</h3>
        <p className="text-sm font-semibold text-[#143A2E] mt-1">{price}</p>
        <p className={`text-xs mt-1 ${highlighted ? "text-emerald-600" : "text-slate-400"}`}>{duration}</p>
      </div>
      <ul className="space-y-2.5 mb-4">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            {item.positive ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <span className="w-4 h-4 text-slate-300 shrink-0 mt-0.5 text-center">—</span>
            )}
            <span className={item.positive ? "text-slate-700" : "text-slate-400"}>{item.text}</span>
          </li>
        ))}
      </ul>
      <div className={`text-center text-xs font-medium pt-3 border-t ${highlighted ? "border-[#143A2E]/10 text-[#143A2E]" : "border-slate-200 text-slate-400"}`}>
        {verdict}
      </div>
    </div>
  );
}

const allTopics = [
  { emoji: "💊", label: "Лекарства и здоровье" },
  { emoji: "🍲", label: "Рецепты и кулинария" },
  { emoji: "🎬", label: "Фильмы и сериалы" },
  { emoji: "📋", label: "ЖКХ и Госуслуги" },
  { emoji: "🌤️", label: "Погода на сегодня" },
  { emoji: "🚌", label: "Транспорт и маршруты" },
  { emoji: "📖", label: "Стихи и книги" },
  { emoji: "🏥", label: "Запись к врачу" },
  { emoji: "🛒", label: "Где купить дешевле" },
  { emoji: "📱", label: "Помощь с телефоном" },
  { emoji: "🧠", label: "Книга жизни" },
  { emoji: "🎂", label: "Дни рождения и праздники" },
];

function TopicBadges() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? allTopics : allTopics.slice(0, 6);

  return (
    <div className="max-w-4xl mx-auto mb-8">
      <div className="flex flex-wrap justify-center gap-2" data-testid="topic-badges-gift">
        {visible.map((t) => (
          <span
            key={t.label}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 border border-white/60 text-sm text-slate-700 shadow-sm"
          >
            <span>{t.emoji}</span>
            {t.label}
          </span>
        ))}
      </div>
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-3 mx-auto flex items-center gap-1 text-sm text-[#143A2E] hover:text-[#0F2F25] transition-colors font-medium"
          data-testid="button-show-more-topics"
        >
          Ещё {allTopics.length - 6} тем
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function AgeCard({
  age,
  image,
  alt,
  title,
  description,
  features,
  gradient,
}: {
  age: string;
  image: string;
  alt?: string;
  title: string;
  description: string;
  features: string[];
  gradient: string;
}) {
  return (
    <div className={`rounded-[28px] bg-gradient-to-b ${gradient} backdrop-blur-sm border border-white/65 shadow-[0_24px_60px_-32px_rgba(49,35,45,.2)] overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_30px_70px_-30px_rgba(49,35,45,.3)] transition-all duration-300`} data-testid={`age-card-${age}`}>
      <img src={image} alt={alt || title} className="w-full h-48 object-cover" loading="lazy" />
      <div className="p-6">
        <Badge variant="secondary" className="mb-4 bg-white/70 text-[#5F626B] border border-white/50 text-xs">
          {age}
        </Badge>
        <h3 className="text-lg font-serif font-medium mb-2 text-slate-900">{title}</h3>
        <p className="text-[#5F626B] text-sm leading-relaxed mb-4">{description}</p>
        <ul className="space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DialogCard({
  title,
  messages,
}: {
  title: string;
  messages: { from: "bot" | "user"; text: string }[];
}) {
  return (
    <div className="rounded-[28px] bg-white/78 backdrop-blur-sm border border-white/65 shadow-[0_24px_60px_-32px_rgba(49,35,45,.2)] overflow-hidden" data-testid={`dialog-card-${title}`}>
      <div className="bg-[#517DA2] px-5 py-3">
        <p className="text-white font-semibold text-sm">{title}</p>
      </div>
      <div className="p-4 space-y-2.5 bg-gradient-to-b from-slate-50/50 to-white">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
              msg.from === "bot"
                ? "bg-white text-slate-800 rounded-bl-md shadow-sm border border-slate-100"
                : "bg-green-200 text-slate-800 rounded-br-md"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialCard({
  name,
  age,
  city,
  parentType,
  photo,
  quote,
  rating,
}: {
  name: string;
  age: number;
  city: string;
  parentType: string;
  photo?: string;
  quote: string;
  rating: number;
}) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;

  return (
    <div className="p-8 rounded-[28px] bg-white/78 backdrop-blur-sm border border-white/65 shadow-[0_24px_60px_-32px_rgba(49,35,45,.35)] hover:-translate-y-0.5 hover:shadow-[0_30px_70px_-30px_rgba(49,35,45,.4)] transition-all duration-300" data-testid={`testimonial-card-gift-${name}`}>
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
        {photo ? (
          <img src={photo} alt={name} className="w-12 h-12 rounded-full object-cover shadow-sm" loading="lazy" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E8E2E6] to-[#D5CED4] flex items-center justify-center text-slate-700 font-bold text-sm">
            {name.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-sm text-slate-800">{name}</p>
          <p className="text-xs text-slate-500">{age} лет, {city}</p>
          <p className="text-xs text-slate-600">{parentType}</p>
        </div>
      </div>
    </div>
  );
}

function GiftPricingCard({
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
      className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 rounded-[28px] backdrop-blur-sm shadow-[0_24px_60px_-32px_rgba(49,35,45,.35)] hover:shadow-[0_30px_70px_-30px_rgba(49,35,45,.4)] ${popular ? "scale-105 bg-gradient-to-b from-white to-emerald-50/40 border-2 border-[#143A2E]/40 ring-1 ring-[#143A2E]/10" : "bg-white/78 border border-white/65"}`}
      data-testid={`pricing-card-gift-${name}`}
    >
      {popular && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#143A2E] to-[#1D5640] text-white text-xs font-bold py-2 text-center flex items-center justify-center gap-1.5">
          <Gift className="w-3.5 h-3.5" /> Самый популярный подарок
        </div>
      )}
      <CardHeader className={`text-center pb-2 ${popular ? "pt-12" : ""}`}>
        <CardTitle className="text-xl font-serif font-medium">{name}</CardTitle>
        <CardDescription className="text-[#5F626B] font-medium">
          {subtitle}
        </CardDescription>
        <div className="mt-3">
          <span className="text-3xl font-serif font-medium">{price}₽</span>
          {!isFree && <span className="text-muted-foreground">/мес</span>}
        </div>
        <div className="mt-3 bg-gradient-to-r from-[#F3E9F0] to-[#EDF2F8] rounded-lg px-3 py-2" data-testid={`pricing-result-gift-${name}`}>
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
          data-testid={`button-pricing-gift-${name}`}
        >
          <Link href="/auth">{isFree ? "Попробовать бесплатно" : "Подарить маме"}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
