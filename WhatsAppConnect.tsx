import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, QrCode, Smartphone, XCircle } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function WhatsAppConnect() {
  const utils = trpc.useUtils();
  
  const { data: status, refetch: refetchStatus } = trpc.whatsapp.status.useQuery(undefined, {
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const { data: qrData } = trpc.whatsapp.qrCode.useQuery(undefined, {
    enabled: status?.hasQR,
    refetchInterval: 2000,
  });

  const initMutation = trpc.whatsapp.init.useMutation({
    onSuccess: () => {
      toast.success("Inicializando WhatsApp...");
      refetchStatus();
    },
    onError: (error) => {
      toast.error("Erro ao inicializar: " + error.message);
    },
  });

  const disconnectMutation = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => {
      toast.success("WhatsApp desconectado!");
      refetchStatus();
    },
    onError: (error) => {
      toast.error("Erro ao desconectar: " + error.message);
    },
  });

  useEffect(() => {
    if (status?.ready) {
      toast.success("WhatsApp conectado com sucesso!");
    }
  }, [status?.ready]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conexão WhatsApp</h1>
          <p className="text-muted-foreground mt-2">
            Conecte seu WhatsApp para enviar e receber mensagens reais
          </p>
        </div>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Status da Conexão</CardTitle>
                <CardDescription>
                  {status?.ready
                    ? "WhatsApp conectado e pronto para uso"
                    : status?.hasQR
                    ? "Aguardando escaneamento do QR Code"
                    : status?.initialized
                    ? "Inicializando..."
                    : "WhatsApp não conectado"}
                </CardDescription>
              </div>
              <div>
                {status?.ready ? (
                  <Badge className="bg-green-500/20 text-green-400">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Conectado
                  </Badge>
                ) : status?.initialized ? (
                  <Badge className="bg-yellow-500/20 text-yellow-400">
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Inicializando
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="w-4 h-4 mr-1" />
                    Desconectado
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!status?.initialized && (
              <div className="text-center py-8">
                <Smartphone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Clique no botão abaixo para iniciar a conexão com o WhatsApp
                </p>
                <Button
                  onClick={() => initMutation.mutate()}
                  disabled={initMutation.isPending}
                  size="lg"
                >
                  {initMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Inicializando...
                    </>
                  ) : (
                    "Conectar WhatsApp"
                  )}
                </Button>
              </div>
            )}

            {status?.hasQR && qrData?.qrCode && (
              <div className="text-center py-8">
                <QrCode className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Escaneie o QR Code
                </h3>
                <p className="text-muted-foreground mb-6">
                  Abra o WhatsApp no seu celular e escaneie o código abaixo
                </p>
                <div className="inline-block p-4 bg-white rounded-lg">
                  <img
                    src={qrData.qrCode}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64"
                  />
                </div>
                <div className="mt-6 text-sm text-muted-foreground">
                  <p className="font-semibold mb-2">Como escanear:</p>
                  <ol className="list-decimal list-inside space-y-1 text-left max-w-md mx-auto">
                    <li>Abra o WhatsApp no seu celular</li>
                    <li>Toque em <strong>Menu</strong> ou <strong>Configurações</strong></li>
                    <li>Toque em <strong>Aparelhos conectados</strong></li>
                    <li>Toque em <strong>Conectar um aparelho</strong></li>
                    <li>Aponte seu celular para esta tela para escanear o código</li>
                  </ol>
                </div>
              </div>
            )}

            {status?.ready && (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  WhatsApp Conectado!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Seu WhatsApp está conectado e pronto para enviar e receber mensagens
                </p>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Tem certeza que deseja desconectar o WhatsApp?")) {
                      disconnectMutation.mutate();
                    }
                  }}
                  disabled={disconnectMutation.isPending}
                >
                  {disconnectMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Desconectando...
                    </>
                  ) : (
                    "Desconectar WhatsApp"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-foreground">Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Sessão Persistente:</strong> Sua sessão do
              WhatsApp permanece ativa mesmo após fazer logout do portal. Ela só será
              desconectada se você clicar em "Desconectar WhatsApp".
            </p>
            <p>
              <strong className="text-foreground">Segurança:</strong> Sua sessão é armazenada
              de forma segura no servidor e é única para sua conta.
            </p>
            <p>
              <strong className="text-foreground">Mensagens Reais:</strong> Todas as mensagens
              enviadas e recebidas são reais e serão sincronizadas com seu WhatsApp.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
