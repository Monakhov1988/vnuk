import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"child" | "parent">("child");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      localStorage.setItem("vnuchok_user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, role: regRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      localStorage.setItem("vnuchok_user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-2xl w-fit mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Внучок</CardTitle>
          <CardDescription>Личный кабинет заботы о близких</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="tab-login">Войти</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" data-testid="input-login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <Input id="login-password" data-testid="input-login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading} data-testid="button-login">
                  {loading ? "Входим..." : "Войти"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Имя</Label>
                  <Input id="reg-name" data-testid="input-reg-name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" data-testid="input-reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Пароль</Label>
                  <Input id="reg-password" data-testid="input-reg-password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Ваша роль</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant={regRole === "child" ? "default" : "outline"} onClick={() => setRegRole("child")} data-testid="button-role-child" className="h-auto py-3 flex-col gap-1">
                      <span className="text-lg">📱</span>
                      <span className="text-xs">Я родственник</span>
                    </Button>
                    <Button type="button" variant={regRole === "parent" ? "default" : "outline"} onClick={() => setRegRole("parent")} data-testid="button-role-parent" className="h-auto py-3 flex-col gap-1">
                      <span className="text-lg">👵</span>
                      <span className="text-xs">Я родитель</span>
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading} data-testid="button-register">
                  {loading ? "Создаем..." : "Создать аккаунт"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}