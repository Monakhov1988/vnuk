import { useState } from "react";
import { ShieldCheck, HeartPulse, Radio, Wrench, BookHeart, FileText, ShoppingBag, ArrowRight, CheckCircle2, PhoneCall, Check, Star, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <nav className="fixed top-0 w-full z-50 glass-panel border-b-0 py-4">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight text-slate-800">Внучок</span>
          </div>
          <div className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">Возможности</a>
            <a href="#dashboard" className="hover:text-primary transition-colors">Личный кабинет</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Тарифы</a>
          </div>
          <Link href="/auth">
            <Button className="rounded-full px-6 shadow-sm hover:shadow-md transition-all" data-testid="button-hero-cta-nav">
              Подключить маме
            </Button>
          </Link>
        </div>
      </nav>

      <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-6 overflow-hidden">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl relative z-10">
              <Badge variant="secondary" className="mb-6 bg-secondary/15 text-secondary-foreground hover:bg-secondary/25 px-4 py-1.5 rounded-full border-0">
                AI-помощник для ваших родителей
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] mb-6 text-slate-900">
                Спокойствие, которое нельзя купить. <br/>
                <span className="text-gradient">Но можно подключить.</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Внучок — это заботливый AI-агент. Он проконтролирует прием лекарств, передаст показания счетчиков и оградит от мошенников. А вы — просто позвоните, чтобы поговорить о любви.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link href="/auth">
                  <Button size="lg" className="rounded-full text-base h-14 px-8 shadow-lg shadow-primary/20" data-testid="button-hero-try-free">
                    Попробовать бесплатно <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="rounded-full text-base h-14 px-8 border-slate-200 hover:bg-slate-50" data-testid="button-hero-pricing">
                    Посмотреть тарифы
                  </Button>
                </Link>
              </div>

              <WaitlistForm />
            </div>

            <div className="relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-100 to-orange-50 rounded-full blur-3xl -z-10" />
              
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-white/50 aspect-[4/3]">
                <img src="/hero.png" alt="Бабушка разговаривает по телефону — Внучок всегда на связи" className="w-full h-full object-cover" />
                
                <div className="absolute bottom-6 left-6 right-6 glass-panel rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Мама приняла эналаприл</p>
                    <p className="text-xs text-slate-500">Давление в норме: 125/80</p>
                  </div>
                  <span className="text-xs text-slate-400 ml-auto">Только что</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Делегируйте рутину. <br/>Оставьте себе только заботу.</h2>
            <p className="text-slate-600 text-lg">
              Родитель общается с ботом голосом по телефону или в Telegram — никаких сложных кнопок и меню.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<HeartPulse />}
              title="Здоровье"
              subtitle="Ваше спокойствие — её дисциплина"
              description="Бот напоминает выпить таблетки. Если подтверждения нет 15 минут — вы получаете алерт. Ведет дневник давления."
              color="bg-rose-50 text-rose-600"
            />
            <FeatureCard 
              icon={<Radio />}
              title="Новостник"
              subtitle="Мир в одном добром голосе"
              description="Утренний брифинг с позитивными новостями, прогнозом погоды и ТВ-гидом. Никакого негатива."
              color="bg-blue-50 text-blue-600"
            />
            <FeatureCard 
              icon={<Wrench />}
              title="Помогатор"
              subtitle="Мастер на все руки в кармане"
              description="Голосовая база знаний. Как починить кран, сколько варить кашу, лунный календарь для дачи."
              color="bg-amber-50 text-amber-600"
            />
            <FeatureCard 
              icon={<BookHeart />}
              title="Книга жизни"
              subtitle="Семейная история не исчезнет"
              description="Бот задает вопросы о молодости и собирает воспоминания. Записывает семейные рецепты и сказки."
              color="bg-purple-50 text-purple-600"
            />
            <FeatureCard 
              icon={<FileText />}
              title="Практическая помощь"
              subtitle="Забудьте о рутине ЖКХ"
              description="Родитель шлет фото счетчиков — AI распознает цифры и отправляет вам. Записывает к врачу."
              color="bg-emerald-50 text-emerald-600"
            />
            <FeatureCard 
              icon={<ShoppingBag />}
              title="Заказ услуг"
              subtitle="Комфорт голосовой командой"
              description="Голосовой заказ продуктов. Заказ безопасного такси с трекингом поездки для вас."
              color="bg-cyan-50 text-cyan-600"
            />
          </div>
        </div>
      </section>

      <section id="dashboard" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-semibold text-lg">Dashboard безопасности</h3>
                    <p className="text-sm text-slate-500">Мария Ивановна (Мама)</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">Все хорошо</Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                      <PhoneCall className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Утренний чек-ин пройден</p>
                      <p className="text-xs text-slate-500 mt-1">Настроение хорошее, жалоб нет. Погода озвучена.</p>
                      <p className="text-[10px] text-slate-400 mt-2">Сегодня, 09:15</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <HeartPulse className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="w-full">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm">Прием лекарств</p>
                        <Badge variant="outline" className="text-[10px] border-rose-200 text-rose-600 bg-white">Ожидание</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Эналаприл, 1 таб.</p>
                      <div className="w-full bg-rose-100 h-1.5 rounded-full mt-3">
                        <div className="bg-rose-500 h-1.5 rounded-full w-[80%] animate-pulse" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 text-right">Осталось 3 мин до алерта</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-1">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Показания воды отправлены</p>
                      <p className="text-xs text-slate-500 mt-1">ГВС: 142, ХВС: 284</p>
                      <p className="text-[10px] text-slate-400 mt-2">Вчера, 18:20</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Вы всегда в курсе.<br/>Без навязчивых звонков.</h2>
              <p className="text-lg text-slate-600 mb-8">
                В личном кабинете вы видите полную картину дня ваших родителей. Если родитель не вышел на связь или сообщил о проблеме — вы немедленно получите уведомление.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  "Статус «Все хорошо» / «Требует внимания»",
                  "AI-чат с Внучком от лица родителя",
                  "Контроль лекарств, счетчиков, давления",
                  "Распознавание показаний по фото"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/dashboard">
                <Button variant="outline" className="rounded-full bg-white" data-testid="button-demo-dashboard">
                  Открыть демо кабинета
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Выберите тариф заботы</h2>
            <p className="text-slate-600 text-lg">Первые 3 дня бесплатно. Отменить можно в любой момент.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <PricingCard name="На 1 месяц" price="1 499" features={["Безлимит вопросов", "Напоминания о лекарствах", "Голос, фото, открытки", "Помощь с Госуслугами и ЖКХ", "Вечерний отчёт для вас"]} />
            <PricingCard name="На 3 месяца" price="2 499" period="3 мес" popular features={["Всё то же, что в месячном", "833₽/мес вместо 1 499₽", "Время на привыкание", "Экономия 44%"]} />
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing">
              <Button variant="link" className="text-primary" data-testid="link-pricing-details">Подробнее о тарифах</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="bg-primary rounded-[3rem] p-8 md:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white font-serif">
                Ваша мама не одна, <br/> даже когда вы на работе
              </h2>
              <p className="text-blue-100 text-lg mb-10">
                Подключите Внучка сегодня. Подарите родителям умного помощника, а себе — спокойствие.
              </p>
              <Link href="/auth">
                <Button size="lg" className="rounded-full h-14 px-8 bg-white text-primary hover:bg-slate-50 font-semibold text-lg shadow-xl" data-testid="button-cta-subscribe">
                  Оформить подписку за 1 499₽/мес
                </Button>
              </Link>
              <p className="mt-4 text-sm text-blue-200 opacity-80">Первые 3 дня бесплатно. Отменить можно в любой момент.</p>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="bg-slate-900 py-12 text-slate-400 text-sm">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-white">
             <ShieldCheck className="w-5 h-5" />
             <span className="font-serif font-bold tracking-tight">Внучок</span>
          </div>
          <p>© 2025 Внучок AI. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}

function WaitlistForm() {
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
        toast({ title: "Вы в списке!", description: data.message || "Мы сообщим, когда запустим Telegram-бота." });
      }
    } catch {
      toast({ title: "Ошибка", description: "Попробуйте позже", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-3 text-sm text-green-700 bg-green-50 rounded-full px-5 py-3 w-fit">
        <CheckCircle2 className="w-5 h-5" />
        <span>Спасибо! Мы вам напишем.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-md" data-testid="form-waitlist">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="email"
          placeholder="Ваш email для Telegram-бота"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-9 rounded-full h-11"
          data-testid="input-waitlist-email"
          required
        />
      </div>
      <Button type="submit" className="rounded-full h-11 px-5" disabled={loading} data-testid="button-waitlist-submit">
        {loading ? "..." : "Записаться"}
      </Button>
    </form>
  );
}

function PricingCard({ name, price, features, popular, period }: { name: string; price: string; features: string[]; popular?: boolean; period?: string }) {
  return (
    <Card className={`relative overflow-hidden transition-all hover:-translate-y-1 ${popular ? "border-primary shadow-lg shadow-primary/10 scale-105" : "border-slate-200"}`}>
      {popular && (
        <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
          <Star className="w-3 h-3" /> Популярный
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{name}</CardTitle>
        <div className="mt-3">
          <span className="text-3xl font-bold">{price}₽</span>
          <span className="text-muted-foreground">{period ? `/${period}` : "/мес"}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 mb-6">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Link href="/auth">
          <Button className="w-full" variant={popular ? "default" : "outline"} data-testid={`button-pricing-${name}`}>
            Выбрать тариф
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ icon, title, subtitle, description, color }: any) {
  return (
    <Card className="border-0 shadow-lg shadow-slate-200/40 hover:-translate-y-1 transition-transform duration-300">
      <CardHeader>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
          {icon}
        </div>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <CardDescription className="text-primary font-medium mt-1">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 leading-relaxed text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}