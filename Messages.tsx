import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Send, Inbox, Paperclip, X, Image, Video, Music, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function Messages() {
  const utils = trpc.useUtils();
  const { data: messages, isLoading } = trpc.messages.list.useQuery({ limit: 100 });
  const [selectedPhone, setSelectedPhone] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendForm, setSendForm] = useState({ phoneNumber: "", content: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<{
    url: string;
    mediaType: "image" | "video" | "audio" | "document";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.media.upload.useMutation({
    onSuccess: (data) => {
      setUploadedMedia({ url: data.url, mediaType: data.mediaType as any });
      toast.success("Arquivo enviado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar arquivo");
      setSelectedFile(null);
    },
  });

  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      toast.success("Mensagem enviada com sucesso!");
      utils.messages.list.invalidate();
      setDialogOpen(false);
      setSendForm({ phoneNumber: "", content: "" });
      setSelectedFile(null);
      setUploadedMedia(null);
    },
    onError: (error) => {
      toast.error("Erro ao enviar mensagem: " + error.message);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (16MB max)
    if (file.size > 16 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Tamanho máximo: 16MB");
      return;
    }

    setSelectedFile(file);

    // Convert to base64 and upload
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({
        file: base64,
        filename: file.name,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = () => {
    sendMutation.mutate({
      phoneNumber: sendForm.phoneNumber,
      content: sendForm.content || (uploadedMedia ? `[${uploadedMedia.mediaType.toUpperCase()}]` : ""),
      messageType: uploadedMedia?.mediaType || "text",
      mediaUrl: uploadedMedia?.url,
    });
  };

  const filteredMessages = selectedPhone
    ? messages?.filter((m) => m.phoneNumber === selectedPhone)
    : messages;

  const uniquePhones = Array.from(new Set(messages?.map((m) => m.phoneNumber) || []));

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "audio":
        return <Music className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mensagens</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie mensagens enviadas e recebidas
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Send className="w-4 h-4" />
                Enviar Mensagem
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card text-card-foreground">
              <DialogHeader>
                <DialogTitle className="text-foreground">Enviar Nova Mensagem</DialogTitle>
                <DialogDescription>
                  Envie uma mensagem de texto ou mídia para um número
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Número de Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="+55 11 99999-9999"
                    value={sendForm.phoneNumber}
                    onChange={(e) =>
                      setSendForm({ ...sendForm, phoneNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="content">Mensagem</Label>
                  <Textarea
                    id="content"
                    placeholder="Digite a mensagem..."
                    value={sendForm.content}
                    onChange={(e) =>
                      setSendForm({ ...sendForm, content: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                {/* File Upload Section */}
                <div>
                  <Label>Anexar Mídia (opcional)</Label>
                  <div className="mt-2">
                    {!selectedFile && !uploadedMedia && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="w-4 h-4" />
                        Selecionar Arquivo
                      </Button>
                    )}

                    {selectedFile && !uploadedMedia && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        {uploadMutation.isPending && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        )}
                      </div>
                    )}

                    {uploadedMedia && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          {getMediaIcon(uploadedMedia.mediaType)}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {uploadedMedia.mediaType.toUpperCase()} anexado
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Pronto para enviar
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(null);
                              setUploadedMedia(null);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Preview for images */}
                        {uploadedMedia.mediaType === "image" && (
                          <img
                            src={uploadedMedia.url}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        )}
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                      onChange={handleFileSelect}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSend}
                  disabled={
                    !sendForm.phoneNumber ||
                    (!sendForm.content && !uploadedMedia) ||
                    sendMutation.isPending ||
                    uploadMutation.isPending
                  }
                  className="w-full"
                >
                  {sendMutation.isPending ? "Enviando..." : "Enviar Mensagem"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedPhone === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPhone("")}
          >
            Todos
          </Button>
          {uniquePhones.map((phone) => (
            <Button
              key={phone}
              variant={selectedPhone === phone ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPhone(phone)}
            >
              {phone}
            </Button>
          ))}
        </div>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-foreground">Histórico de Mensagens</CardTitle>
            <CardDescription>
              {filteredMessages?.length || 0} mensagens
              {selectedPhone && ` de ${selectedPhone}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredMessages && filteredMessages.length > 0 ? (
              <div className="space-y-3">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 p-4 rounded-lg ${
                      msg.direction === "outbound"
                        ? "bg-blue-500/10 border-l-4 border-blue-500"
                        : "bg-green-500/10 border-l-4 border-green-500"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {msg.direction === "outbound" ? (
                        <Send className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Inbox className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-foreground">{msg.phoneNumber}</span>
                        <span className="text-xs text-muted-foreground">
                          {msg.direction === "outbound" ? "Enviada" : "Recebida"}
                        </span>
                        {msg.messageType !== "text" && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                            {getMediaIcon(msg.messageType)}
                            {msg.messageType}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            msg.status === "delivered"
                              ? "bg-green-500/20 text-green-400"
                              : msg.status === "sent"
                              ? "bg-blue-500/20 text-blue-400"
                              : msg.status === "read"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {msg.status}
                        </span>
                      </div>

                      {/* Media Display */}
                      {msg.mediaUrl && (
                        <div className="my-2">
                          {msg.messageType === "image" && (
                            <img
                              src={msg.mediaUrl}
                              alt="Imagem"
                              className="max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(msg.mediaUrl!, "_blank")}
                            />
                          )}
                          {msg.messageType === "video" && (
                            <video
                              src={msg.mediaUrl}
                              controls
                              className="max-w-sm rounded-lg"
                            />
                          )}
                          {msg.messageType === "audio" && (
                            <audio src={msg.mediaUrl} controls className="w-full max-w-sm" />
                          )}
                          {msg.messageType === "document" && (
                            <a
                              href={msg.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors max-w-sm"
                            >
                              <FileText className="w-5 h-5 text-primary" />
                              <span className="text-sm font-medium text-foreground">
                                Baixar Documento
                              </span>
                            </a>
                          )}
                        </div>
                      )}

                      <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(msg.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma mensagem encontrada. Envie sua primeira mensagem!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
