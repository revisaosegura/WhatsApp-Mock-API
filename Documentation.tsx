import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Code, Webhook as WebhookIcon } from "lucide-react";

export default function Documentation() {
  const apiBaseUrl = window.location.origin;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documentação da API</h1>
          <p className="text-muted-foreground mt-2">
            Guia completo para integração com a API Mock de WhatsApp
          </p>
        </div>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Visão Geral
            </CardTitle>
            <CardDescription>
              Esta é uma API mock de WhatsApp para testes e desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Base URL</h3>
              <code className="block bg-accent/50 p-3 rounded-lg text-sm text-foreground">
                {apiBaseUrl}/api/trpc
              </code>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Autenticação</h3>
              <p className="text-muted-foreground">
                A API utiliza autenticação baseada em sessão. Faça login através da interface web
                para obter acesso aos endpoints.
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
            <TabsTrigger value="contacts">Contatos</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-4">
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-foreground">Enviar Mensagem</CardTitle>
                <CardDescription>
                  <Badge className="mr-2">POST</Badge>
                  messages.send
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Parâmetros</h4>
                  <pre className="bg-accent/50 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "phoneNumber": "+55 11 99999-9999",
  "content": "Olá! Esta é uma mensagem de teste",
  "messageType": "text", // opcional: text, image, video, audio, document
  "mediaUrl": "https://..." // opcional: URL da mídia
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Exemplo com cURL</h4>
                  <pre className="bg-accent/50 p-4 rounded-lg text-sm overflow-x-auto">
{`curl -X POST ${apiBaseUrl}/api/trpc/messages.send \\
  -H "Content-Type: application/json" \\
  -d '{
    "phoneNumber": "+55 11 99999-9999",
    "content": "Olá! Esta é uma mensagem de teste"
  }'`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Exemplo com JavaScript</h4>
                  <pre className="bg-accent/50 p-4 rounded-lg text-sm overflow-x-auto">
{`const response = await fetch('${apiBaseUrl}/api/trpc/messages.send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // importante para sessão
  body: JSON.stringify({
    phoneNumber: '+55 11 99999-9999',
    content: 'Olá! Esta é uma mensagem de teste'
  })
});

const data = await response.json();
console.log(data);`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-foreground">Listar Mensagens</CardTitle>
                <CardDescription>
                  <Badge className="mr-2">GET</Badge>
                  messages.list
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Parâmetros (opcionais)</h4>
                  <pre className="bg-accent/50 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "phoneNumber": "+55 11 99999-9999", // filtrar por número
  "limit": 100 // limite de resultados (padrão: 100)
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-foreground">Simular Recebimento</CardTitle>
                <CardDescription>
                  <Badge className="mr-2">POST</Badge>
                  messages.simulateReceive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Descrição</h4>
                  <p className="text-muted-foreground">
                    Simula o recebimento de uma mensagem de um número externo. Útil para testar
                    webhooks e fluxos de resposta automática.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Parâmetros</h4>
                  <pre className="bg-accent/50 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "phoneNumber": "+55 11 99999-9999",
  "content": "Mensagem recebida simulada",
  "messageType": "text" // opcional
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-foreground">Criar Contato</CardTitle>
                <CardDescription>
                  <Badge className="mr-2">POST</Badge>
                  contacts.create
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Parâmetros</h4>
                  <pre className="bg-accent/50 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "name": "João Silva",
  "phoneNumber": "+55 11 99999-9999",
  "profilePicture": "https://..." // opcional
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-foreground">Listar Contatos</CardTitle>
                <CardDescription>
                  <Badge className="mr-2">GET</Badge>
                  contacts.list
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Retorna todos os contatos cadastrados do usuário autenticado.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-foreground">Atualizar Contato</CardTitle>
                <CardDescription>
                  <Badge className="mr-2">POST</Badge>
                  contacts.update
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Parâmetros</h4>
                  <pre className="bg-accent/50 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "id": 1,
  "name": "João Silva Atualizado", // opcional
  "profilePicture": "https://..." // opcional
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-foreground">Excluir Contato</CardTitle>
                <CardDescription>
                  <Badge className="mr-2">POST</Badge>
                  contacts.delete
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Parâmetros</h4>
                  <pre className="bg-accent/50 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "id": 1
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <WebhookIcon className="w-5 h-5" />
                  Como Funcionam os Webhooks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Webhooks permitem que você receba notificações em tempo real quando eventos
                  ocorrem na API. Configure uma URL que receberá requisições POST com os dados
                  do evento.
                </p>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Eventos Disponíveis</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>
                      <code className="text-foreground">message.sent</code> - Disparado quando uma
                      mensagem é enviada
                    </li>
                    <li>
                      <code className="text-foreground">message.received</code> - Disparado quando
                      uma mensagem é recebida
                    </li>
                    <li>
                      <code className="text-foreground">message.status</code> - Disparado quando o
                      status de uma mensagem muda
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Formato do Payload</h4>
                  <pre className="bg-accent/50 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "event": "message.sent",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "messageId": 123,
    "phoneNumber": "+55 11 99999-9999",
    "content": "Mensagem de teste",
    "messageType": "text"
  }
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Assinatura de Segurança</h4>
                  <p className="text-muted-foreground mb-2">
                    Cada requisição webhook inclui um header{" "}
                    <code className="text-foreground">X-Webhook-Signature</code> com uma assinatura
                    HMAC SHA-256 do payload usando o secret configurado.
                  </p>
                  <pre className="bg-accent/50 p-4 rounded-lg text-sm overflow-x-auto">
{`// Exemplo de validação em Node.js
const crypto = require('crypto');

function validateWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return hash === signature;
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-foreground">Criar Webhook</CardTitle>
                <CardDescription>
                  <Badge className="mr-2">POST</Badge>
                  webhooks.create
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Parâmetros</h4>
                  <pre className="bg-accent/50 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "url": "https://seu-servidor.com/webhook",
  "events": ["message.sent", "message.received"],
  "secret": "seu-secret-opcional" // gerado automaticamente se não fornecido
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
