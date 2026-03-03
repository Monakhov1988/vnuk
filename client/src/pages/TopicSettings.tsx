import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Settings, BookOpen, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TopicCategory {
  id: string;
  name: string;
  icon: string;
}

interface Topic {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface TopicSettingLocal {
  topicId: string;
  depth: "basic" | "detailed" | "expert";
  enabled: boolean;
}

interface PersonalityLocal {
  formality: string;
  humor: number;
  softness: number;
  verbosity: number;
  useEmoji: boolean;
  encouragement: number;
}

const DEPTH_LABELS: Record<string, string> = {
  basic: "Базовый",
  detailed: "Подробный",
  expert: "Экспертный",
};

async function fetchAuth() {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

export default function TopicSettings() {
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

  const parentId = user?.role === "parent" ? user.id : user?.linkedParentId;

  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ["topics"],
    queryFn: async () => {
      const res = await fetch("/api/topics");
      if (!res.ok) throw new Error("Ошибка загрузки тем");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: topicSettingsData, isLoading: topicSettingsLoading } = useQuery({
    queryKey: ["topic-settings", parentId],
    queryFn: async () => {
      const res = await fetch(`/api/topic-settings/${parentId}`);
      if (!res.ok) throw new Error("Ошибка загрузки настроек тем");
      return res.json();
    },
    enabled: !!parentId,
  });

  const { data: personalityData, isLoading: personalityLoading } = useQuery({
    queryKey: ["personality-settings", parentId],
    queryFn: async () => {
      const res = await fetch(`/api/personality-settings/${parentId}`);
      if (!res.ok) throw new Error("Ошибка загрузки настроек личности");
      return res.json();
    },
    enabled: !!parentId,
  });

  const [topicSettings, setTopicSettings] = useState<Record<string, TopicSettingLocal>>({});
  const [personality, setPersonality] = useState<PersonalityLocal>({
    formality: "ты",
    humor: 3,
    softness: 4,
    verbosity: 3,
    useEmoji: true,
    encouragement: 4,
  });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (topicSettingsData && Array.isArray(topicSettingsData)) {
      const map: Record<string, TopicSettingLocal> = {};
      for (const s of topicSettingsData) {
        map[s.topicId] = { topicId: s.topicId, depth: s.depth, enabled: s.enabled };
      }
      setTopicSettings(map);
    }
  }, [topicSettingsData]);

  useEffect(() => {
    if (personalityData) {
      setPersonality({
        formality: personalityData.formality || "ты",
        humor: personalityData.humor ?? 3,
        softness: personalityData.softness ?? 4,
        verbosity: personalityData.verbosity ?? 3,
        useEmoji: personalityData.useEmoji ?? true,
        encouragement: personalityData.encouragement ?? 4,
      });
    }
  }, [personalityData]);

  const saveTopicsMutation = useMutation({
    mutationFn: async () => {
      const settings = Object.values(topicSettings);
      const res = await fetch(`/api/topic-settings/${parentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Ошибка сохранения");
      }
    },
  });

  const savePersonalityMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/personality-settings/${parentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personality),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Ошибка сохранения");
      }
    },
  });

  async function handleSave() {
    try {
      await Promise.all([
        saveTopicsMutation.mutateAsync(),
        savePersonalityMutation.mutateAsync(),
      ]);
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["topic-settings"] });
      queryClient.invalidateQueries({ queryKey: ["personality-settings"] });
      toast({ title: "Настройки сохранены!" });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    }
  }

  function toggleTopic(topicId: string, enabled: boolean) {
    setTopicSettings(prev => ({
      ...prev,
      [topicId]: { topicId, depth: prev[topicId]?.depth || "basic", enabled },
    }));
    setDirty(true);
  }

  function setTopicDepth(topicId: string, depth: "basic" | "detailed" | "expert") {
    setTopicSettings(prev => ({
      ...prev,
      [topicId]: { topicId, depth, enabled: prev[topicId]?.enabled ?? true },
    }));
    setDirty(true);
  }

  function updatePersonality(key: keyof PersonalityLocal, value: any) {
    setPersonality(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  const isLoading = userLoading || topicsLoading || topicSettingsLoading || personalityLoading;
  const isSaving = saveTopicsMutation.isPending || savePersonalityMutation.isPending;

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!parentId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Привяжите родителя, чтобы настраивать темы и личность бота.</p>
            <Button className="mt-4" onClick={() => navigate("/dashboard")} data-testid="button-back-dashboard">
              Вернуться
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categories: TopicCategory[] = topicsData?.categories || [];
  const topics: Topic[] = topicsData?.topics || [];

  const sliderLabels: Record<string, string[]> = {
    humor: ["Серьёзно", "Редко", "Иногда", "Часто", "Весёлый", "Максимум"],
    softness: ["Прямо", "Нейтрально", "Тепло", "Нежно", "Ласково", "Максимум"],
    verbosity: ["Кратко", "Коротко", "Средне", "Подробно", "Много", "Максимум"],
    encouragement: ["Сдержанно", "Редко", "Умеренно", "Часто", "Очень", "Максимум"],
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">Настройки бота</h1>
                <p className="text-xs text-muted-foreground">Темы и личность</p>
              </div>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={!dirty || isSaving}
            data-testid="button-save-settings"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Сохранить
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-3xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Личность бота
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between" data-testid="setting-formality">
              <div>
                <Label className="text-sm font-medium">Обращение</Label>
                <p className="text-xs text-muted-foreground">На «ты» или на «Вы»</p>
              </div>
              <Select
                value={personality.formality}
                onValueChange={(v) => updatePersonality("formality", v)}
              >
                <SelectTrigger className="w-[120px]" data-testid="select-formality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ты">На «ты»</SelectItem>
                  <SelectItem value="вы">На «Вы»</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between" data-testid="setting-emoji">
              <div>
                <Label className="text-sm font-medium">Эмодзи</Label>
                <p className="text-xs text-muted-foreground">Использовать эмодзи в ответах</p>
              </div>
              <Switch
                checked={personality.useEmoji}
                onCheckedChange={(v) => updatePersonality("useEmoji", v)}
                data-testid="switch-emoji"
              />
            </div>

            {(["humor", "softness", "verbosity", "encouragement"] as const).map((key) => {
              const labels: Record<string, string> = {
                humor: "Юмор",
                softness: "Мягкость",
                verbosity: "Разговорчивость",
                encouragement: "Подбадривание",
              };
              const descriptions: Record<string, string> = {
                humor: "Как часто бот шутит",
                softness: "Насколько нежно и тепло отвечает",
                verbosity: "Насколько подробно отвечает",
                encouragement: "Как часто хвалит и подбадривает",
              };
              return (
                <div key={key} data-testid={`setting-${key}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <Label className="text-sm font-medium">{labels[key]}</Label>
                      <p className="text-xs text-muted-foreground">{descriptions[key]}</p>
                    </div>
                    <span className="text-sm font-medium text-primary min-w-[80px] text-right">
                      {sliderLabels[key][personality[key]]}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={5}
                    step={1}
                    value={[personality[key]]}
                    onValueChange={([v]) => updatePersonality(key, v)}
                    data-testid={`slider-${key}`}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Темы
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Включите нужные темы и выберите глубину экспертизы
            </p>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {categories.map((cat) => {
                const catTopics = topics.filter((t) => t.category === cat.id);
                if (catTopics.length === 0) return null;
                const enabledCount = catTopics.filter(
                  (t) => topicSettings[t.id]?.enabled
                ).length;
                return (
                  <AccordionItem key={cat.id} value={cat.id} data-testid={`category-${cat.id}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="font-medium">{cat.name}</span>
                        {enabledCount > 0 && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {enabledCount}/{catTopics.length}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {catTopics.map((topic) => {
                          const setting = topicSettings[topic.id];
                          const isEnabled = setting?.enabled ?? false;
                          const depth = setting?.depth || "basic";
                          return (
                            <div
                              key={topic.id}
                              className={`flex items-center justify-between p-3 rounded-xl border ${
                                isEnabled ? "bg-primary/5 border-primary/20" : "bg-slate-50 border-transparent"
                              }`}
                              data-testid={`topic-${topic.id}`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={(v) => toggleTopic(topic.id, v)}
                                  data-testid={`switch-topic-${topic.id}`}
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{topic.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {topic.description}
                                  </p>
                                </div>
                              </div>
                              {isEnabled && (
                                <Select
                                  value={depth}
                                  onValueChange={(v) =>
                                    setTopicDepth(topic.id, v as "basic" | "detailed" | "expert")
                                  }
                                >
                                  <SelectTrigger className="w-[130px] ml-2 shrink-0" data-testid={`select-depth-${topic.id}`}>
                                    <SelectValue>
                                      {DEPTH_LABELS[depth]}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="basic">Базовый</SelectItem>
                                    <SelectItem value="detailed">Подробный</SelectItem>
                                    <SelectItem value="expert">Экспертный</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>

        <div className="pb-8">
          <Button
            onClick={handleSave}
            disabled={!dirty || isSaving}
            className="w-full"
            size="lg"
            data-testid="button-save-settings-bottom"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Сохранить настройки
          </Button>
        </div>
      </div>
    </div>
  );
}
