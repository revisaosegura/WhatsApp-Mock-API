import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Webhook as WebhookIcon, Plus, Trash2, Eye, Power, PowerOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Webhooks() {
  const utils = trpc.useUtils();
  const { data: webhooks, isLoading } = trpc.webhooks.list.useQuery();
  
  const createMutation = trpc.webhooks.create.useMutation({
    onSuccess: () => {
      toast.success("Webhook criado com sucesso!");
      utils.webhooks.list.invalidate();
      setDialogOpen(false);
      setForm({ url: "", events: [], secret: "" });
    },
    onError: (error) => {
      toast.error("Erro ao criar webhook: " + error.message);
    },
  });

  const updateMutation = trpc.webhooks.update.useMutation({
    onSuccess: () => {
      toast.success("Webhook atualizado!");
      utils.webhooks.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar webhook: " + error.message);
    },
  });

  const deleteMutation = trpc.webhooks.delete.useMutation({
    onSuccess: () => {
      toast.success("Webhook excluído com sucesso!");
      utils.webhooks.list.invalidate();
      setLogsDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao excluir webhook: " + error.message);
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [selectedWebhookId, setSelectedWebhookId] = useState<number | null>(null);

  const { data: logs } = trpc.webhooks.logs.useQuery(
    { webhookId: selectedWebhookId!, limit: 50 },
    { enabled: !!selectedWebhookId }
  );
  const [form, setForm] = useState<{
    url: string;
    events: ("message.sent" | "message.received" | "message.status")[];
    secret: string;
  }>({
    url: "",
    events: [],
    secret: "",
  });

  const availableEvents = [
    { value: "message.sent", label: "Mensagem Enviada" },
    { value: "message.received", label: "Mensagem Recebida" },
    { value: "message.status", label: "Status da Mensagem" },
  ];

  const toggleEvent = (event: string) => {
    const typedEvent = event as "message.sent" | "message.received" | "message.status";
    setForm({
      ...form,
      events: form.events.includes(typedEvent)
        ? form.events.filter((e) => e !== typedEvent)
        : [...form.events, typedEvent],
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Webhooks</h1>
            <p className="text-muted-foreground mt-2">
              Configure webhooks para receber notificações de eventos
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card text-card-foreground">
              <DialogHeader>
                <DialogTitle className="text-foreground">Novo Webhook</DialogTitle>
                <DialogDescription>
                  Configure um webhook para receber notificações
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="url">URL do Webhook</Label>
                  <Input
                    id="url"
                    placeholder="https://seu-servidor.com/webhook"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Eventos</Label>
                  <div className="space-y-2 mt-2">
                    {availableEvents.map((event) => (
                      <div key={event.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={event.value}
                          checked={form.events.includes(event.value as any)}
                          onCheckedChange={() => toggleEvent(event.value)}
                        />
                        <label
                          htmlFor={event.value}
                          className="text-sm text-foreground cursor-pointer"
                        >
                          {event.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="secret">Secret (opcional)</Label>
                  <Input
                    id="secret"
                    placeholder="Deixe vazio para gerar automaticamente"
                    value={form.secret}
                    onChange={(e) => setForm({ ...form, secret: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Usado para assinar as requisições (HMAC SHA-256)
                  </p>
                </div>
                <Button
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.url || form.events.length === 0 || createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? "Criando..." : "Criar Webhook"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-foreground">Webhooks Configurados</CardTitle>
            <CardDescription>
              {webhooks?.length || 0} webhooks cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : webhooks && webhooks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">URL</TableHead>
                    <TableHead className="text-foreground">Eventos</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => {
                    const events = JSON.parse(webhook.events) as string[];
                    return (
                      <TableRow key={webhook.id}>
                        <TableCell className="font-medium text-foreground max-w-xs truncate">
                          {webhook.url}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {events.map((event) => (
                              <Badge key={event} variant="secondary" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {webhook.isActive ? (
                            <Badge className="bg-green-500/20 text-green-400">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedWebhookId(webhook.id);
                                setLogsDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                updateMutation.mutate({
                                  id: webhook.id,
                                  isActive: !webhook.isActive,
                                });
                              }}
                            >
                              {webhook.isActive ? (
                                <PowerOff className="w-4 h-4" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Tem certeza que deseja excluir este webhook?")) {
                                  deleteMutation.mutate({ id: webhook.id });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <WebhookIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum webhook configurado. Adicione seu primeiro webhook!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logs Dialog */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="bg-card text-card-foreground max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Logs do Webhook</DialogTitle>
            <DialogDescription>
              Histórico de entregas do webhook
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {logs && logs.length > 0 ? (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border ${
                    log.success
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={log.success ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {log.success ? "Sucesso" : "Falha"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-foreground">
                      <span className="font-semibold">Evento:</span> {log.event}
                    </p>
                    {log.responseStatus && (
                      <p className="text-foreground">
                        <span className="font-semibold">Status HTTP:</span> {log.responseStatus}
                      </p>
                    )}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Ver payload
                      </summary>
                      <pre className="mt-2 p-2 bg-background/50 rounded text-xs overflow-x-auto">
                        {JSON.stringify(JSON.parse(log.payload), null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum log disponível ainda
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
