import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { UserPlus, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Contacts() {
  const utils = trpc.useUtils();
  const { data: contacts, isLoading } = trpc.contacts.list.useQuery();
  
  const createMutation = trpc.contacts.create.useMutation({
    onSuccess: () => {
      toast.success("Contato criado com sucesso!");
      utils.contacts.list.invalidate();
      setDialogOpen(false);
      setForm({ name: "", phoneNumber: "", profilePicture: "" });
    },
    onError: (error) => {
      toast.error("Erro ao criar contato: " + error.message);
    },
  });

  const updateMutation = trpc.contacts.update.useMutation({
    onSuccess: () => {
      toast.success("Contato atualizado com sucesso!");
      utils.contacts.list.invalidate();
      setEditDialogOpen(false);
      setEditForm(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar contato: " + error.message);
    },
  });

  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contato excluído com sucesso!");
      utils.contacts.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao excluir contato: " + error.message);
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phoneNumber: "", profilePicture: "" });
  const [editForm, setEditForm] = useState<any>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contatos</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie seus contatos do WhatsApp
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Adicionar Contato
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card text-card-foreground">
              <DialogHeader>
                <DialogTitle className="text-foreground">Novo Contato</DialogTitle>
                <DialogDescription>
                  Adicione um novo contato à sua lista
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Nome do contato"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Número de Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="+55 11 99999-9999"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="picture">URL da Foto (opcional)</Label>
                  <Input
                    id="picture"
                    placeholder="https://..."
                    value={form.profilePicture}
                    onChange={(e) => setForm({ ...form, profilePicture: e.target.value })}
                  />
                </div>
                <Button
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.name || !form.phoneNumber || createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? "Criando..." : "Criar Contato"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-foreground">Lista de Contatos</CardTitle>
            <CardDescription>
              {contacts?.length || 0} contatos cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : contacts && contacts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Nome</TableHead>
                    <TableHead className="text-foreground">Telefone</TableHead>
                    <TableHead className="text-foreground">Criado em</TableHead>
                    <TableHead className="text-foreground text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          {contact.profilePicture ? (
                            <img
                              src={contact.profilePicture}
                              alt={contact.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                              {contact.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {contact.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{contact.phoneNumber}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(contact.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditForm(contact);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja excluir este contato?")) {
                                deleteMutation.mutate({ id: contact.id });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum contato cadastrado. Adicione seu primeiro contato!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Contato</DialogTitle>
            <DialogDescription>
              Atualize as informações do contato
            </DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  placeholder="Nome do contato"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-picture">URL da Foto (opcional)</Label>
                <Input
                  id="edit-picture"
                  placeholder="https://..."
                  value={editForm.profilePicture || ""}
                  onChange={(e) => setEditForm({ ...editForm, profilePicture: e.target.value })}
                />
              </div>
              <Button
                onClick={() => updateMutation.mutate({
                  id: editForm.id,
                  name: editForm.name,
                  profilePicture: editForm.profilePicture,
                })}
                disabled={!editForm.name || updateMutation.isPending}
                className="w-full"
              >
                {updateMutation.isPending ? "Atualizando..." : "Atualizar Contato"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
