import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldCheck, HeartPulse, Bell, FileText, BookHeart, LogOut, Plus, Trash2, CheckCircle2,
  AlertTriangle, XCircle, Activity, Droplets, Zap, Link2, Clock, Send, MessageCircle, Camera, Loader2, Copy, Check, Settings, Share2, ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

async function fetchAuth() {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["auth"],
    queryFn: fetchAuth,
    retry: false,
  });

  useEffect(() => {
    if (!userLoading && !user) navigate("/auth");
  }, [user, userLoading, navigate]);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Ошибка загрузки");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  if (userLoading || !user) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">Загрузка данных...</p>
      </div>
    </div>
  );

  const isParent = user.role === "parent";

  const statusConfig: Record<string, any> = {
    ok: { label: "Все хорошо", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-5 h-5" /> },
    warning: { label: "Есть вопрос", color: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="w-5 h-5" /> },
    critical: { label: "Требует внимания", color: "bg-red-100 text-red-700", icon: <XCircle className="w-5 h-5" /> },
  };
  const status = statusConfig[dashboard?.overallStatus || "ok"];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.clear();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Внучок</h1>
              <p className="text-xs text-muted-foreground">
                {user.name} {isParent ? "(родитель)" : "(родственник)"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isParent && dashboard?.unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full">{dashboard.unreadCount}</Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate("/settings/topics")} data-testid="button-settings">
              <Settings className="w-4 h-4 mr-1" /> Настройки
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-1" /> Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {isParent ? (
          <ParentDashboard user={user} dashboard={dashboard} status={status} />
        ) : (
          <ChildDashboard user={user} dashboard={dashboard} status={status} />
        )}
      </div>
    </div>
  );
}

function ParentDashboard({ user, dashboard, status }: { user: any; dashboard: any; status: any }) {
  return (
    <>
      <div className={`rounded-2xl p-6 mb-8 flex items-center gap-4 ${status.color}`}>
        {status.icon}
        <div>
          <p className="font-semibold text-lg">{status.label}</p>
          <p className="text-sm opacity-80">Добро пожаловать, {user.name}!</p>
        </div>
      </div>

      {user.linkCode && <LinkCodeDisplay code={user.linkCode} />}
      {user.linkCode && dashboard?.botUsername && (
        <ShareDeepLinkCard linkCode={user.linkCode} botUsername={dashboard.botUsername} isParentView />
      )}

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6 h-auto">
          <TabsTrigger value="chat" className="flex flex-col gap-1 py-3" data-testid="tab-chat">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">Чат</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="flex flex-col gap-1 py-3" data-testid="tab-health">
            <HeartPulse className="w-4 h-4" />
            <span className="text-xs">Здоровье</span>
          </TabsTrigger>
          <TabsTrigger value="utility" className="flex flex-col gap-1 py-3" data-testid="tab-utility">
            <FileText className="w-4 h-4" />
            <span className="text-xs">ЖКХ</span>
          </TabsTrigger>
          <TabsTrigger value="memoirs" className="flex flex-col gap-1 py-3" data-testid="tab-memoirs-parent">
            <BookHeart className="w-4 h-4" />
            <span className="text-xs">Истории</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex flex-col gap-1 py-3" data-testid="tab-events">
            <Bell className="w-4 h-4" />
            <span className="text-xs">Лента</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <AIChatTab parentName={user.name} isParent />
        </TabsContent>
        <TabsContent value="health">
          <ParentHealthTab reminders={dashboard?.reminders || []} healthLogs={dashboard?.healthLogs || []} />
        </TabsContent>
        <TabsContent value="utility">
          <UtilityTab metrics={dashboard?.utilityMetrics || []} />
        </TabsContent>
        <TabsContent value="memoirs">
          <MemoirsTab memoirs={dashboard?.memoirs || []} />
        </TabsContent>
        <TabsContent value="events">
          <EventsFeed events={dashboard?.recentEvents || []} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function humanizeDate(dateStr: string | null): string {
  if (!dateStr) return "нет данных";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "сегодня";
  if (diffDays === 1) return "вчера";
  if (diffDays < 5) return `${diffDays} дня назад`;
  if (diffDays < 21) return `${diffDays} дней назад`;
  const lastDigit = diffDays % 10;
  if (lastDigit === 1) return `${diffDays} день назад`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${diffDays} дня назад`;
  return `${diffDays} дней назад`;
}

function EngagementCard({ stats }: { stats: { daysActive30: number; totalMessages: number; memoirsCount: number; lastActiveDate: string | null } }) {
  const progressPercent = Math.min(100, Math.round((stats.daysActive30 / 30) * 100));

  return (
    <Card className="mb-8 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50" data-testid="card-engagement">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-orange-900">Активность родителя</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/70 rounded-xl p-4" data-testid="stat-days-active">
            <p className="text-2xl font-bold text-orange-700">{stats.daysActive30}<span className="text-sm font-normal text-orange-400">/30</span></p>
            <p className="text-xs text-muted-foreground mt-1">Активных дней</p>
            <div className="w-full h-1.5 bg-orange-100 rounded-full mt-2">
              <div className="h-1.5 bg-orange-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} data-testid="progress-days-active" />
            </div>
          </div>
          <div className="bg-white/70 rounded-xl p-4" data-testid="stat-total-messages">
            <p className="text-2xl font-bold text-amber-700">{stats.totalMessages}</p>
            <p className="text-xs text-muted-foreground mt-1">Сообщений</p>
          </div>
          <div className="bg-white/70 rounded-xl p-4" data-testid="stat-memoirs-count">
            <p className="text-2xl font-bold text-yellow-700">{stats.memoirsCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Историй в Книге жизни</p>
          </div>
          <div className="bg-white/70 rounded-xl p-4" data-testid="stat-last-active">
            <p className="text-lg font-bold text-orange-700">{humanizeDate(stats.lastActiveDate)}</p>
            <p className="text-xs text-muted-foreground mt-1">Последняя активность</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChildDashboard({ user, dashboard, status }: { user: any; dashboard: any; status: any }) {
  return (
    <>
      <div className={`rounded-2xl p-6 mb-8 flex items-center gap-4 ${status.color}`}>
        {status.icon}
        <div>
          <p className="font-semibold text-lg">{status.label}</p>
          <p className="text-sm opacity-80">
            {dashboard?.parent ? `Родитель: ${dashboard.parent.name}` : "Родитель не привязан"}
          </p>
        </div>
      </div>

      {!dashboard?.user?.hasTelegram && dashboard?.botUsername && (
        <ConnectChildTelegramCard botUsername={dashboard.childBotUsername || dashboard.botUsername} />
      )}

      {!dashboard?.parent && (
        <InviteParentCard linkCode={user.linkCode} botUsername={dashboard?.botUsername} />
      )}

      {dashboard?.engagementStats && <EngagementCard stats={dashboard.engagementStats} />}

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6 h-auto">
          <TabsTrigger value="chat" className="flex flex-col gap-1 py-3" data-testid="tab-chat">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">Чат</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex flex-col gap-1 py-3" data-testid="tab-events">
            <Bell className="w-4 h-4" />
            <span className="text-xs">Лента</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="flex flex-col gap-1 py-3" data-testid="tab-health">
            <HeartPulse className="w-4 h-4" />
            <span className="text-xs">Здоровье</span>
          </TabsTrigger>
          <TabsTrigger value="utility" className="flex flex-col gap-1 py-3" data-testid="tab-utility">
            <FileText className="w-4 h-4" />
            <span className="text-xs">ЖКХ</span>
          </TabsTrigger>
          <TabsTrigger value="memoirs" className="flex flex-col gap-1 py-3" data-testid="tab-memoirs">
            <BookHeart className="w-4 h-4" />
            <span className="text-xs">Мемуары</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <AIChatTab parentName={dashboard?.parent?.name} />
        </TabsContent>
        <TabsContent value="events">
          <EventsFeed events={dashboard?.recentEvents || []} />
        </TabsContent>
        <TabsContent value="health">
          <HealthTab reminders={dashboard?.reminders || []} healthLogs={dashboard?.healthLogs || []} />
        </TabsContent>
        <TabsContent value="utility">
          <UtilityTab metrics={dashboard?.utilityMetrics || []} />
        </TabsContent>
        <TabsContent value="memoirs">
          <MemoirsTab memoirs={dashboard?.memoirs || []} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function LinkCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="mb-8 border-2 border-primary/30 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-3">
          <Link2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Ваш код привязки</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Передайте этот код вашему ребенку (родственнику). Он введет его в своем личном кабинете, чтобы видеть ваши данные.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white rounded-xl border-2 border-dashed border-primary/40 px-6 py-4 text-center" data-testid="text-link-code">
            <span className="text-3xl font-mono font-bold tracking-[0.3em] text-primary">{code}</span>
          </div>
          <Button variant="outline" size="icon" className="h-14 w-14 shrink-0" onClick={handleCopy} data-testid="button-copy-code">
            {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ParentHealthTab({ reminders, healthLogs }: { reminders: any[]; healthLogs: any[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [note, setNote] = useState("");

  const confirmMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/reminders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      if (!res.ok) throw new Error("Ошибка");
    },
    onSuccess: () => {
      toast({ title: "Отлично! Лекарство принято." });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => {
      toast({ title: "Ошибка", variant: "destructive" });
    },
  });

  const addBPMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/health-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systolic: parseInt(sys), diastolic: parseInt(dia), note: note || null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
    },
    onSuccess: () => {
      toast({ title: "Давление записано!" });
      setSys("");
      setDia("");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const chartData = [...healthLogs].reverse().map((log: any) => ({
    date: log.createdAt ? new Date(log.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : "",
    sys: log.systolic,
    dia: log.diastolic,
  }));

  return (
    <div className="space-y-6">
      {reminders.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-500" /> Мои лекарства
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reminders.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl" data-testid={`reminder-item-${r.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <p className="font-medium">{r.medicineName}</p>
                      <p className="text-xs text-muted-foreground">{String(r.timeHour).padStart(2, "0")}:{String(r.timeMinute).padStart(2, "0")}</p>
                    </div>
                  </div>
                  {r.status === "confirmed" ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 px-4 py-2">
                      <Check className="w-4 h-4 mr-1" /> Принято
                    </Badge>
                  ) : (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => confirmMutation.mutate(r.id)} disabled={confirmMutation.isPending} data-testid={`button-confirm-med-${r.id}`}>
                      {confirmMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />} Принял(а)
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" /> Записать давление
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="space-y-1">
              <Label className="text-xs">Верхнее (систолическое)</Label>
              <Input type="number" placeholder="120" value={sys} onChange={(e) => setSys(e.target.value)} data-testid="input-systolic" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Нижнее (диастолическое)</Label>
              <Input type="number" placeholder="80" value={dia} onChange={(e) => setDia(e.target.value)} data-testid="input-diastolic" />
            </div>
          </div>
          <div className="space-y-1 mb-4">
            <Label className="text-xs">Заметка (необязательно)</Label>
            <Input placeholder="Например: после прогулки" value={note} onChange={(e) => setNote(e.target.value)} data-testid="input-bp-note" />
          </div>
          <Button onClick={() => addBPMutation.mutate()} disabled={!sys || !dia || addBPMutation.isPending} className="w-full" data-testid="button-save-bp">
            {addBPMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Сохранить
          </Button>

          {chartData.length > 1 && (
            <div className="h-[200px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[60, 180]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sys" stroke="#ef4444" strokeWidth={2} name="Верхнее" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="dia" stroke="#3b82f6" strokeWidth={2} name="Нижнее" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {healthLogs.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium text-muted-foreground">История записей</p>
              {healthLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl" data-testid={`health-log-${log.id}`}>
                  <div>
                    <p className="font-semibold text-sm">{log.systolic}/{log.diastolic}</p>
                    {log.note && <p className="text-xs text-muted-foreground">{log.note}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AIChatTab({ parentName, isParent }: { parentName?: string; isParent?: boolean }) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user" as const, content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessages([...newMessages, { role: "assistant", content: data.reply, imageUrl: data.imageUrl || undefined }]);
      if (data.hasAlert) {
        toast({ title: "Внимание!", description: "Обнаружен сигнал тревоги. Алерт отправлен.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const quickMessages = isParent
    ? ["Привет, внучок!", "У меня болит голова", "Как убрать пятно с ковра?"]
    : ["Привет, внучок!", "Расскажи, что нового?", "Как мне вывести пятно?"];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Чат с Внучком
          {parentName && !isParent && <span className="text-sm font-normal text-muted-foreground">— от лица: {parentName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-center text-muted-foreground">
              <div>
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">
                  {isParent ? "Поговорите с Внучком" : "Начните разговор с Внучком"}
                </p>
                <p className="text-sm mt-1">
                  {isParent ? "Задайте вопрос или просто поболтайте" : "Напишите что-нибудь, как будто от лица родителя"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {quickMessages.map(q => (
                    <Button key={q} variant="outline" size="sm" className="text-xs rounded-full" onClick={() => setInput(q)} data-testid={`quick-msg-${q.slice(0,10)}`}>
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-primary text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"}`}>
                {msg.content}
                {(msg as any).imageUrl && (
                  <img src={(msg as any).imageUrl} alt="Картинка от Внучка" className="mt-2 rounded-lg max-w-full" data-testid={`img-chat-${i}`} />
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                <span className="text-sm text-slate-500">Внучок думает...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="border-t p-4 flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            className="resize-none min-h-[44px] max-h-[100px]"
            data-testid="input-chat-message"
          />
          <Button onClick={handleSend} disabled={!input.trim() || loading} size="icon" className="shrink-0 h-[44px] w-[44px]" data-testid="button-send-chat">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function InviteParentCard({ linkCode, botUsername }: { linkCode?: string; botUsername?: string | null }) {
  const [copied, setCopied] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deepLink = linkCode && botUsername ? `https://t.me/${botUsername}?start=${linkCode}` : null;

  const copyLink = async () => {
    if (!deepLink) return;
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      toast({ title: "Ссылка скопирована!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  };

  const linkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/link-parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkCode: manualCode.toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Готово!", description: `Привязан родитель: ${data.parentName}` });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card className="mb-8 border-2 border-emerald-200 bg-emerald-50/50" data-testid="card-invite-parent">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-3">
          <Share2 className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-emerald-900">Пригласите родителя</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Отправьте эту ссылку вашему родителю. Он нажмёт — и бот сам начнёт знакомство. Ничего настраивать не нужно.
        </p>

        {deepLink && (
          <>
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border mb-4">
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-mono truncate flex-1" data-testid="text-invite-deeplink">{deepLink}</span>
              <Button variant="outline" size="sm" onClick={copyLink} data-testid="button-copy-invite">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" asChild data-testid="button-invite-telegram">
                <a href={`https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent("Привет! Нажми на ссылку — познакомишься с Внучком, он будет помогать тебе каждый день")}`} target="_blank" rel="noopener noreferrer">
                  <Send className="w-4 h-4 mr-1" /> Telegram
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild data-testid="button-invite-whatsapp">
                <a href={`https://wa.me/?text=${encodeURIComponent("Привет! Нажми на ссылку — познакомишься с Внучком, он будет помогать тебе каждый день " + deepLink)}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                </a>
              </Button>
            </div>
          </>
        )}

        <button
          onClick={() => setShowManual(!showManual)}
          className="text-xs text-muted-foreground underline cursor-pointer"
          data-testid="toggle-manual-code"
        >
          {showManual ? "Скрыть" : "У меня есть код родителя"}
        </button>

        {showManual && (
          <div className="flex gap-2 mt-3">
            <Input placeholder="Код, например: A1B2C3" value={manualCode} onChange={(e) => setManualCode(e.target.value)} data-testid="input-link-code" className="uppercase" />
            <Button onClick={() => linkMutation.mutate()} disabled={linkMutation.isPending || manualCode.length < 4} data-testid="button-link-parent">
              {linkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Привязать"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConnectChildTelegramCard({ botUsername }: { botUsername: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateToken = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/child-telegram-token", { method: "POST" });
      const data = await res.json();
      if (data.alreadyLinked) {
        toast({ title: "Telegram уже подключён!" });
        return;
      }
      if (!res.ok) throw new Error(data.message);
      setToken(data.token);
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const [copied, setCopied] = useState(false);
  const botLink = `https://t.me/${botUsername}`;

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({ title: "Код скопирован!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  };

  return (
    <Card className="mb-8 border-2 border-blue-200 bg-blue-50/50" data-testid="card-connect-telegram">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-3">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Подключите Telegram</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Получайте уведомления о родителе прямо в Telegram: вечернюю сводку, оповещения о давлении и важные алерты.
        </p>
        {!token ? (
          <Button onClick={generateToken} disabled={loading} data-testid="button-generate-tg-link">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Подключить Telegram
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-sm font-medium text-blue-900 mb-2">Ваш код привязки:</p>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono font-bold bg-blue-50 px-4 py-2 rounded tracking-widest select-all" data-testid="text-link-code">{token}</code>
                <Button variant="ghost" size="sm" onClick={() => copyCode(token)} data-testid="button-copy-code">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">Как подключить:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Откройте бот <a href={botLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline" data-testid="link-open-bot">@{botUsername}</a> в Telegram</li>
                <li>Нажмите <b>Start</b> (или /start)</li>
                <li>Отправьте боту скопированный код</li>
              </ol>
            </div>
            <Button variant="outline" asChild className="w-full" data-testid="button-open-tg">
              <a href={`tg://resolve?domain=${botUsername}`}>
                <Send className="w-4 h-4 mr-2" /> Открыть бот в Telegram
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ShareDeepLinkCard({ linkCode, botUsername, isParentView }: { linkCode: string; botUsername: string | null; isParentView?: boolean }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!botUsername || !linkCode) return null;

  const deepLink = `https://t.me/${botUsername}?start=${linkCode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      toast({ title: "Ссылка скопирована!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  };

  const title = isParentView ? "Подключите Telegram" : "Отправьте ссылку родителю";
  const description = isParentView
    ? "Нажмите на ссылку ниже, чтобы начать общение с Внучком в Telegram. Или скопируйте и откройте на телефоне."
    : "Отправьте эту ссылку вашему родителю. Он нажмёт на неё, и бот сам начнёт знакомство — ничего настраивать не нужно.";

  return (
    <Card className="mb-8 border-2 border-emerald-200 bg-emerald-50/50" data-testid="card-share-deeplink">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-3">
          <Share2 className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-emerald-900">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border mb-4">
          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-mono truncate flex-1" data-testid="text-deeplink">{deepLink}</span>
          <Button variant="outline" size="sm" onClick={copyLink} data-testid="button-copy-deeplink">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild data-testid="button-share-telegram">
            <a href={`https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent("Привет! Нажми на ссылку — познакомишься с Внучком, он будет помогать тебе 💛")}`} target="_blank" rel="noopener noreferrer">
              <Send className="w-4 h-4 mr-1" /> Telegram
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild data-testid="button-share-whatsapp">
            <a href={`https://wa.me/?text=${encodeURIComponent("Привет! Нажми на ссылку — познакомишься с Внучком, он будет помогать тебе 💛 " + deepLink)}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EventsFeed({ events }: { events: any[] }) {
  const iconMap: Record<string, any> = {
    checkin: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
    medication: <HeartPulse className="w-5 h-5 text-rose-500" />,
    alert: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    utility: <FileText className="w-5 h-5 text-emerald-500" />,
    memoir: <BookHeart className="w-5 h-5 text-purple-500" />,
    order: <Activity className="w-5 h-5 text-cyan-500" />,
  };

  const severityBg: Record<string, string> = {
    info: "bg-slate-50 border-slate-100",
    warning: "bg-amber-50 border-amber-100",
    critical: "bg-red-50 border-red-100",
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>Пока нет событий</p>
        <p className="text-sm mt-1">Как только Внучок начнет работать, здесь появится лента активности</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((ev: any) => (
        <div key={ev.id} className={`p-4 rounded-2xl border flex items-start gap-4 ${severityBg[ev.severity] || severityBg.info}`} data-testid={`event-item-${ev.id}`}>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            {iconMap[ev.type] || iconMap.checkin}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <p className="font-medium text-sm">{ev.title}</p>
              {ev.severity === "critical" && <Badge variant="destructive" className="text-[10px] shrink-0">Критично</Badge>}
              {ev.severity === "warning" && <Badge className="bg-amber-100 text-amber-700 text-[10px] shrink-0 hover:bg-amber-100 border-0">Внимание</Badge>}
            </div>
            {ev.description && <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>}
            <p className="text-[10px] text-muted-foreground mt-2">
              {ev.createdAt ? new Date(ev.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HealthTab({ reminders, healthLogs }: { reminders: any[]; healthLogs: any[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [medName, setMedName] = useState("");
  const [timeH, setTimeH] = useState("9");
  const [timeM, setTimeM] = useState("0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addReminderMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineName: medName, timeHour: parseInt(timeH), timeMinute: parseInt(timeM), status: "pending", isActive: true }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
    },
    onSuccess: () => {
      toast({ title: "Напоминание добавлено" });
      setMedName("");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const chartData = [...healthLogs].reverse().map((log: any) => ({
    date: log.createdAt ? new Date(log.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : "",
    sys: log.systolic,
    dia: log.diastolic,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-500" /> Напоминания о лекарствах
          </CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-reminder"><Plus className="w-4 h-4 mr-1" /> Добавить</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Новое напоминание</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Название лекарства</Label>
                  <Input value={medName} onChange={(e) => setMedName(e.target.value)} placeholder="Например: Эналаприл" data-testid="input-med-name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Часы</Label>
                    <Input type="number" min="0" max="23" value={timeH} onChange={(e) => setTimeH(e.target.value)} data-testid="input-time-hour" />
                  </div>
                  <div className="space-y-2">
                    <Label>Минуты</Label>
                    <Input type="number" min="0" max="59" value={timeM} onChange={(e) => setTimeM(e.target.value)} data-testid="input-time-minute" />
                  </div>
                </div>
                <Button onClick={() => addReminderMutation.mutate()} className="w-full" disabled={!medName || addReminderMutation.isPending} data-testid="button-save-reminder">
                  {addReminderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Сохранить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Нет напоминаний. Добавьте первое лекарство.</p>
          ) : (
            <div className="space-y-3">
              {reminders.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl" data-testid={`reminder-item-${r.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{r.medicineName}</p>
                      <p className="text-xs text-muted-foreground">{String(r.timeHour).padStart(2, "0")}:{String(r.timeMinute).padStart(2, "0")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={r.status === "confirmed" ? "bg-green-100 text-green-700 hover:bg-green-100 border-0" : r.status === "missed" ? "bg-red-100 text-red-700 hover:bg-red-100 border-0" : "bg-slate-100 text-slate-600 hover:bg-slate-100 border-0"}>
                      {r.status === "confirmed" ? "Принято" : r.status === "missed" ? "Пропущено" : "Ожидание"}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteReminderMutation.mutate(r.id)} disabled={deleteReminderMutation.isPending} data-testid={`button-delete-reminder-${r.id}`}>
                      {deleteReminderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Trash2 className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" /> Дневник давления
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 1 ? (
            <div className="h-[200px] w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[60, 180]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sys" stroke="#ef4444" strokeWidth={2} name="Верхнее" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="dia" stroke="#3b82f6" strokeWidth={2} name="Нижнее" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
          {healthLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Родитель пока не записывал давление</p>
          ) : (
            <div className="space-y-2">
              {healthLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl" data-testid={`health-log-${log.id}`}>
                  <div>
                    <p className="font-semibold text-sm">{log.systolic}/{log.diastolic}</p>
                    {log.note && <p className="text-xs text-muted-foreground">{log.note}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UtilityTab({ metrics }: { metrics: any[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [meterType, setMeterType] = useState("ХВС");
  const [value, setValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addMetricMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/utility-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meterType, value }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
    },
    onSuccess: () => {
      toast({ title: "Показания сохранены" });
      setValue("");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const recognizeMutation = useMutation({
    mutationFn: async (file: File) => {
      return new Promise<any>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = (reader.result as string).split(",")[1];
            const res = await fetch("/api/ai/recognize-meter", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageBase64: base64 }),
            });
            const data = await res.json();
            resolve(data);
          } catch (err) {
            reject(err);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    onSuccess: (data: any) => {
      if (data.value) {
        setValue(data.value);
        toast({ title: "Распознано!", description: `Значение: ${data.value}` });
      } else {
        toast({ title: "Не удалось распознать", description: data.raw, variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    recognizeMutation.mutate(file);
  }

  const iconMap: Record<string, any> = {
    "ХВС": <Droplets className="w-4 h-4 text-blue-500" />,
    "ГВС": <Droplets className="w-4 h-4 text-red-500" />,
    "Электричество": <Zap className="w-4 h-4 text-amber-500" />,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-500" /> Показания счетчиков
        </CardTitle>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-metric"><Plus className="w-4 h-4 mr-1" /> Добавить</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Новое показание</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Тип счетчика</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["ХВС", "ГВС", "Электричество"].map((t) => (
                    <Button key={t} type="button" variant={meterType === t ? "default" : "outline"} onClick={() => setMeterType(t)} className="text-xs" data-testid={`button-meter-${t}`}>
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Значение</Label>
                <div className="flex gap-2">
                  <Input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Например: 12345" data-testid="input-metric-value" />
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()} disabled={recognizeMutation.isPending} data-testid="button-upload-photo">
                    {recognizeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Или загрузите фото счетчика — AI распознает цифры</p>
              </div>
              <Button onClick={() => addMetricMutation.mutate()} className="w-full" disabled={!value || addMetricMutation.isPending} data-testid="button-save-metric">
                {addMetricMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Сохранить показание
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {metrics.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Показания пока не переданы</p>
        ) : (
          <div className="space-y-2">
            {metrics.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl" data-testid={`metric-item-${m.id}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    {iconMap[m.meterType] || <FileText className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{m.meterType}</p>
                    <p className="text-lg font-bold">{m.value}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {m.createdAt ? new Date(m.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "short" }) : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MemoirsTab({ memoirs }: { memoirs: any[] }) {
  if (memoirs.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BookHeart className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>Книга жизни пока пуста</p>
        <p className="text-sm mt-1">Внучок поговорит с родителем и запишет воспоминания</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {memoirs.map((m: any) => (
        <Card key={m.id} data-testid={`memoir-item-${m.id}`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">{m.title}</CardTitle>
              <span className="text-xs text-muted-foreground">
                {m.createdAt ? new Date(m.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : ""}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{m.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}