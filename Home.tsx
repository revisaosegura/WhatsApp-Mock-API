import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Users, Webhook, Activity } from "lucide-react";

export default function Home() {
  const { data: messages } = trpc.messages.list.useQuery({ limit: 10 });
  const { data: contacts } = trpc.contacts.list.useQuery();
  const { data: webhooks } = trpc.webhooks.list.useQuery();

  const stats = [
    {
      title: "Total de Mensagens",
      value: messages?.length || 0,
      icon: MessageSquare,
      description: "Últimas 100 mensagens",
    },
    {
      title: "Contatos",
      value: contacts?.length || 0,
      icon: Users,
      description: "Contatos cadastrados",
    },
    {
      title: "Webhooks Ativos",
      value: webhooks?.filter(w => w.isActive).length || 0,
      icon: Webhook,
      description: "Webhooks configurados",
    },
    {
      title: "Status da API",
      value: "Online",
      icon: Activity,
      description: "Sistema operacional",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Bem-vindo à API Mock de WhatsApp. Gerencie mensagens, contatos e webhooks.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="bg-card text-card-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-foreground">Mensagens Recentes</CardTitle>
            <CardDescription>Últimas mensagens enviadas e recebidas</CardDescription>
          </CardHeader>
          <CardContent>
            {messages && messages.length > 0 ? (
              <div className="space-y-3">
                {messages.slice(0, 5).map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-accent/50"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        msg.direction === "outbound" ? "bg-blue-500" : "bg-green-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{msg.phoneNumber}</span>
                        <span className="text-xs text-muted-foreground">
                          {msg.direction === "outbound" ? "Enviada" : "Recebida"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">{msg.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleTimeString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma mensagem ainda. Comece enviando uma mensagem!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
