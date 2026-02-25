import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck, HeartPulse, Bell, FileText, BookHeart, LogOut, Plus, Trash2, CheckCircle2,
  AlertTriangle, XCircle, Activity, Droplets, Zap, Link2, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function getUser() {
  const raw = localStorage.getItem("vnuchok_user");
  if (!raw) return null;
  return JSON.parse(raw);
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = getUser();

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/${user.id}`);
      if (!res.ok) throw new Error("Ошибка загрузки");
      return res.json();
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  if (!user) return null;
  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Загрузка...</div>
    </div>
  );

  const statusConfig: Record<string, any> = {
    ok: { label: "Все хорошо", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-5 h-5" /> },
    warning: { label: "Есть вопрос", color: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="w-5 h-5" /> },
    critical: { label: "Требует внимания", color: "bg-red-100 text-red-700", icon: <XCircle className="w-5 h-5" /> },
  };
  const status = statusConfig[dashboard?.overallStatus || "ok"];

  function handleLogout() {
    localStorage.removeItem("vnuchok_user");
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Внучок</h1>
              <p className="text-xs text-muted-foreground">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {dashboard?.unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full">{dashboard.unreadCount}</Badge>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-1" /> Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Status Banner */}
        <div className={`rounded-2xl p-6 mb-8 flex items-center gap-4 ${status.color}`}>
          {status.icon}
          <div>
            <p className="font-semibold text-lg">{status.label}</p>
            <p className="text-sm opacity-80">
              {dashboard?.parent ? `Родитель: ${dashboard.parent.name}` : "Родитель не привязан"}
            </p>
          </div>
        </div>

        {/* Link Parent if not linked */}
        {!dashboard?.parent && <LinkParentCard userId={user.id} />}

        {/* Main Tabs */}
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 h-auto">
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

          <TabsContent value="events">
            <EventsFeed events={dashboard?.recentEvents || []} />
          </TabsContent>

          <TabsContent value="health">
            <HealthTab
              reminders={dashboard?.reminders || []}
              healthLogs={dashboard?.healthLogs || []}
              userId={user.id}
              parentId={dashboard?.parent?.id}
            />
          </TabsContent>

          <TabsContent value="utility">
            <UtilityTab metrics={dashboard?.utilityMetrics || []} userId={user.id} parentId={dashboard?.parent?.id} />
          </TabsContent>

          <TabsContent value="memoirs">
            <MemoirsTab memoirs={dashboard?.memoirs || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LinkParentCard({ userId }: { userId: number }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  async function handleLink() {
    setLoading(true);
    try {
      const res = await fetch("/api/link-parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: userId, linkCode: code.toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Готово!", description: `Привязан родитель: ${data.parentName}` });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mb-8 border-dashed border-2 border-primary/30 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Link2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Привяжите родителя</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Попросите родителя зарегистрироваться в боте — он получит код привязки. Введите этот код здесь.
        </p>
        <div className="flex gap-2">
          <Input placeholder="Код, например: A1B2C3" value={code} onChange={(e) => setCode(e.target.value)} data-testid="input-link-code" className="uppercase" />
          <Button onClick={handleLink} disabled={loading || code.length < 4} data-testid="button-link-parent">
            Привязать
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

function HealthTab({ reminders, healthLogs, userId, parentId }: { reminders: any[]; healthLogs: any[]; userId: number; parentId?: number }) {
  const [addOpen, setAddOpen] = useState(false);
  const [medName, setMedName] = useState("");
  const [timeH, setTimeH] = useState("9");
  const [timeM, setTimeM] = useState("0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  async function handleAddReminder() {
    if (!parentId) {
      toast({ title: "Ошибка", description: "Сначала привяжите родителя", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, parentId, medicineName: medName, timeHour: parseInt(timeH), timeMinute: parseInt(timeM), status: "pending", isActive: true }),
      });
      if (!res.ok) throw new Error("Ошибка создания");
      toast({ title: "Напоминание добавлено" });
      setMedName("");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <div className="space-y-6">
      {/* Reminders */}
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
              <DialogHeader>
                <DialogTitle>Новое напоминание</DialogTitle>
              </DialogHeader>
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
                <Button onClick={handleAddReminder} className="w-full" disabled={!medName} data-testid="button-save-reminder">
                  Сохранить напоминание
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(r.id)} data-testid={`button-delete-reminder-${r.id}`}>
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Logs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" /> Дневник давления
          </CardTitle>
        </CardHeader>
        <CardContent>
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

function UtilityTab({ metrics, userId, parentId }: { metrics: any[]; userId: number; parentId?: number }) {
  const [addOpen, setAddOpen] = useState(false);
  const [meterType, setMeterType] = useState("ХВС");
  const [value, setValue] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  async function handleAdd() {
    if (!parentId) {
      toast({ title: "Ошибка", description: "Сначала привяжите родителя", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/utility-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, parentId, meterType, value }),
      });
      if (!res.ok) throw new Error("Ошибка сохранения");
      toast({ title: "Показания сохранены" });
      setValue("");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    }
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
            <DialogHeader>
              <DialogTitle>Новое показание</DialogTitle>
            </DialogHeader>
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
                <Input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Например: 12345" data-testid="input-metric-value" />
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={!value} data-testid="button-save-metric">
                Сохранить показание
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