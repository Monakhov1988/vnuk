import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Check, ArrowLeft, Loader2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: "monthly",
    name: "На 1 месяц",
    price: "1 499",
    period: "мес",
    description: "3 дня бесплатно",
    features: [
      "Безлимит вопросов",
      "Напоминания о лекарствах",
      "Голос, фото, открытки",
      "Помощь с Госуслугами и ЖКХ",
      "Вечерний отчёт для вас",
    ],
    missing: [],
    popular: false,
  },
  {
    id: "quarterly",
    name: "На 3 месяца",
    price: "2 499",
    period: "3 мес",
    description: "Экономия 44%",
    features: [
      "Всё то же, что в месячном",
      "833₽/мес вместо 1 499₽",
      "Время на привыкание",
      "Экономия 44%",
    ],
    missing: [],
    popular: true,
  },
];

export default function PricingPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["auth"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    },
    retry: false,
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await fetch("/api/subscription");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });

  async function handleSubscribe(planId: string) {
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoading(planId);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Подписка активирована!", description: `Тариф «${plans.find(p => p.id === planId)?.name}» подключён на 30 дней.` });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-white">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="bg-primary/10 p-2 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-lg">Внучок</span>
            </div>
          </Link>
          {user ? (
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" /> В кабинет
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button size="sm">Войти</Button>
            </Link>
          )}
        </div>
      </nav>

      <section className="py-16 px-6">
        <div className="container mx-auto text-center max-w-3xl mb-12">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Выберите тариф заботы</h1>
          <p className="text-lg text-muted-foreground">
            3 дня бесплатно. Подписка — 1 499₽/мес или 2 499₽ за 3 месяца. Отменить можно в любой момент.
          </p>
        </div>

        <div className="container mx-auto grid md:grid-cols-2 gap-6 max-w-3xl">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative overflow-hidden transition-all hover:-translate-y-1 ${plan.popular ? "border-primary shadow-lg shadow-primary/10 scale-105" : "border-slate-200"}`}>
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                  <Star className="w-3 h-3" /> Популярный
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}₽</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground line-through opacity-50">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 opacity-30" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {subscription?.plan === plan.id && subscription?.status === "active" ? (
                  <Badge className="w-full justify-center py-2 bg-green-100 text-green-700 hover:bg-green-100 border-0">
                    Активен
                  </Badge>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!!loading}
                    data-testid={`button-subscribe-${plan.id}`}
                  >
                    {loading === plan.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {loading === plan.id ? "Подключаем..." : "Выбрать тариф"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="container mx-auto max-w-2xl mt-12 text-center text-sm text-muted-foreground">
          <p>Оплата в демо-режиме. В боевой версии будет подключён CloudPayments / Prodamus для рекуррентных платежей.</p>
        </div>
      </section>
    </div>
  );
}