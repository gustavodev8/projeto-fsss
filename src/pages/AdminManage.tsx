import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listProfessors,
  createProfessor,
  updateProfessor,
  deleteProfessor,
} from "@/services/users";
import type { Professor } from "@/services/users";
import { fetchAllItems, createItem, deleteItem, updateItem } from "@/services/items";
import type { ReservableItem } from "@/types";
import {
  Building2,
  Box,
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  CheckCircle2,
  UserPlus,
} from "lucide-react";

const AdminManage = () => {
  const queryClient = useQueryClient();

  // ── Estado: itens ──────────────────────────────────────────────────────────
  const [itemCategoria, setItemCategoria] = useState<"espacos" | "instrumentos">("espacos");
  const [itemNome, setItemNome] = useState("");
  const [itemDescricao, setItemDescricao] = useState("");
  const [itemImagemUrl, setItemImagemUrl] = useState("");
  const [itemQtd, setItemQtd] = useState(1);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState("");
  const [itemSuccess, setItemSuccess] = useState(false);
  const [itemListTab, setItemListTab] = useState<"espacos" | "instrumentos">("espacos");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemNome, setEditItemNome] = useState("");
  const [editItemDescricao, setEditItemDescricao] = useState("");
  const [editItemImagemUrl, setEditItemImagemUrl] = useState("");
  const [editItemQtd, setEditItemQtd] = useState(1);
  const [editItemCategoria, setEditItemCategoria] = useState<"espacos" | "instrumentos">("espacos");
  const [editItemLoading, setEditItemLoading] = useState(false);

  const { data: allItems = [], refetch: refetchItems } = useQuery({
    queryKey: ["allItems"],
    queryFn: fetchAllItems,
  });
  const espacosList = allItems.filter((i) => i.category === "espacos");
  const instrumentosList = allItems.filter((i) => i.category === "instrumentos");

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setItemError("");
    setItemSuccess(false);
    setItemLoading(true);
    const result = await createItem({
      nome: itemNome.trim(),
      descricao: itemDescricao.trim(),
      categoria: itemCategoria,
      imagemUrl: itemImagemUrl.trim() || undefined,
      totalUnidades: itemCategoria === "instrumentos" ? itemQtd : undefined,
    });
    setItemLoading(false);
    if (!result.ok) {
      setItemError(result.error ?? "Erro ao criar item.");
      return;
    }
    setItemNome("");
    setItemDescricao("");
    setItemImagemUrl("");
    setItemQtd(1);
    setItemSuccess(true);
    refetchItems();
    queryClient.invalidateQueries({ queryKey: ["items", itemCategoria] });
    setTimeout(() => setItemSuccess(false), 3000);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este item?")) return;
    setDeletingId(id);
    const result = await deleteItem(id);
    setDeletingId(null);
    if (!result.ok) {
      alert("Não foi possível remover. Verifique se não há reservas ativas para este item.");
      return;
    }
    refetchItems();
    queryClient.invalidateQueries({ queryKey: ["items", "espacos"] });
    queryClient.invalidateQueries({ queryKey: ["items", "instrumentos"] });
  };

  const handleEditItem = (item: ReservableItem) => {
    setEditingItemId(item.id);
    setEditItemNome(item.name);
    setEditItemDescricao(item.description);
    setEditItemImagemUrl(item.image);
    setEditItemQtd(item.totalUnits ?? 1);
    setEditItemCategoria(item.category);
  };

  const handleSaveItem = async (id: string) => {
    setEditItemLoading(true);
    const result = await updateItem({
      id,
      nome: editItemNome.trim(),
      descricao: editItemDescricao.trim(),
      imagemUrl: editItemImagemUrl.trim() || undefined,
      totalUnidades: editItemCategoria === "instrumentos" ? editItemQtd : undefined,
    });
    setEditItemLoading(false);
    if (!result.ok) {
      alert(result.error ?? "Erro ao atualizar item.");
      return;
    }
    setEditingItemId(null);
    refetchItems();
    queryClient.invalidateQueries({ queryKey: ["items", editItemCategoria] });
  };

  // ── Estado: professores ───────────────────────────────────────────────────
  const [profNome, setProfNome] = useState("");
  const [profEmail, setProfEmail] = useState("");
  const [profSenha, setProfSenha] = useState("");
  const [profLoading, setProfLoading] = useState(false);
  const [profError, setProfError] = useState("");
  const [profSuccess, setProfSuccess] = useState(false);
  const [editingProfId, setEditingProfId] = useState<string | null>(null);
  const [editProfNome, setEditProfNome] = useState("");
  const [editProfEmail, setEditProfEmail] = useState("");
  const [editProfSenha, setEditProfSenha] = useState("");
  const [editProfLoading, setEditProfLoading] = useState(false);

  const { data: professors = [] } = useQuery({
    queryKey: ["professors"],
    queryFn: listProfessors,
  });

  const handleCreateProfessor = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfError("");
    setProfSuccess(false);
    setProfLoading(true);
    const result = await createProfessor(profNome.trim(), profEmail.trim(), profSenha);
    setProfLoading(false);
    if (!result.ok) {
      setProfError(result.error ?? "Erro ao criar professor.");
      return;
    }
    setProfNome("");
    setProfEmail("");
    setProfSenha("");
    setProfSuccess(true);
    queryClient.invalidateQueries({ queryKey: ["professors"] });
    setTimeout(() => setProfSuccess(false), 3000);
  };

  const handleEditProfessor = (p: Professor) => {
    setEditingProfId(p.id);
    setEditProfNome(p.nome);
    setEditProfEmail(p.email);
    setEditProfSenha("");
  };

  const handleSaveProfessor = async (id: string) => {
    setEditProfLoading(true);
    const result = await updateProfessor(
      id,
      editProfNome.trim(),
      editProfEmail.trim(),
      editProfSenha || undefined
    );
    setEditProfLoading(false);
    if (!result.ok) {
      alert(result.error ?? "Erro ao atualizar professor.");
      return;
    }
    setEditingProfId(null);
    queryClient.invalidateQueries({ queryKey: ["professors"] });
  };

  const handleDeleteProfessor = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este professor?")) return;
    const result = await deleteProfessor(id);
    if (!result.ok) {
      alert(result.error ?? "Erro ao excluir professor.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["professors"] });
  };

  const getInitial = (name: string) => name.trim()[0]?.toUpperCase() ?? "?";

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Título */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Configurações
          </p>
          <h1 className="text-xl font-bold text-foreground">Gerenciar recursos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cadastre, edite e mantenha atualizada a base de espaços, equipamentos e usuários do
            sistema.
          </p>
        </div>

        {/* ── Espaços e equipamentos ─────────────────────────────────────────── */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="border-b border-border px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Espaços e equipamentos</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adicione ou remova itens disponíveis para reserva.
              </p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário */}
            <form onSubmit={handleCreateItem} className="space-y-4">
              <p className="text-sm font-semibold text-foreground">Novo item</p>

              <div className="grid grid-cols-2 gap-2">
                {(["espacos", "instrumentos"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setItemCategoria(cat)}
                    className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg border transition-all duration-150 ${
                      itemCategoria === cat
                        ? cat === "espacos"
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-emerald-600 text-white border-emerald-600"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {cat === "espacos" ? (
                      <>
                        <Building2 className="w-3.5 h-3.5" /> Espaço
                      </>
                    ) : (
                      <>
                        <Box className="w-3.5 h-3.5" /> Equipamento
                      </>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nome</Label>
                <Input
                  value={itemNome}
                  onChange={(e) => setItemNome(e.target.value)}
                  placeholder={
                    itemCategoria === "espacos" ? "Ex: Espaço Irmã Rosa" : "Ex: Caixa de Som"
                  }
                  required
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Descrição</Label>
                <Input
                  value={itemDescricao}
                  onChange={(e) => setItemDescricao(e.target.value)}
                  placeholder="Breve descrição do item"
                  required
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  URL da imagem{" "}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  value={itemImagemUrl}
                  onChange={(e) => setItemImagemUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-9 text-sm"
                />
              </div>
              {itemCategoria === "instrumentos" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Quantidade total</Label>
                  <Input
                    type="number"
                    min={1}
                    value={itemQtd}
                    onChange={(e) => setItemQtd(Math.max(1, Number(e.target.value)))}
                    required
                    className="h-9 text-sm w-28 font-mono"
                  />
                </div>
              )}

              {itemError && <p className="text-xs text-destructive">{itemError}</p>}
              {itemSuccess && (
                <div className="flex items-center gap-2 text-xs text-available">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Item adicionado com sucesso!
                </div>
              )}

              <Button type="submit" disabled={itemLoading} className="w-full h-9 text-sm gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                {itemLoading ? "Adicionando..." : "+ Adicionar item"}
              </Button>
            </form>

            {/* Lista */}
            <div>
              <div className="flex gap-2 mb-4">
                {(["espacos", "instrumentos"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setItemListTab(cat)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                      itemListTab === cat
                        ? cat === "espacos"
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-emerald-600 text-white border-emerald-600"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {cat === "espacos"
                      ? `Espaços (${espacosList.length})`
                      : `Equipamentos (${instrumentosList.length})`}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {(itemListTab === "espacos" ? espacosList : instrumentosList).map((item) => (
                  <div key={item.id} className="rounded-lg border border-border hover:border-border/80 transition-colors">
                    {editingItemId === item.id ? (
                      <div className="p-3 space-y-2">
                        <Input
                          value={editItemNome}
                          onChange={(e) => setEditItemNome(e.target.value)}
                          className="h-8 text-sm"
                          placeholder="Nome"
                        />
                        <Input
                          value={editItemDescricao}
                          onChange={(e) => setEditItemDescricao(e.target.value)}
                          className="h-8 text-sm"
                          placeholder="Descrição"
                        />
                        <Input
                          value={editItemImagemUrl}
                          onChange={(e) => setEditItemImagemUrl(e.target.value)}
                          className="h-8 text-sm"
                          placeholder="URL imagem"
                        />
                        {item.category === "instrumentos" && (
                          <Input
                            type="number"
                            min={1}
                            value={editItemQtd}
                            onChange={(e) =>
                              setEditItemQtd(Math.max(1, Number(e.target.value)))
                            }
                            className="h-8 text-sm w-24 font-mono"
                          />
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => handleSaveItem(item.id)}
                            disabled={editItemLoading}
                          >
                            <Save className="w-3 h-3" />
                            {editItemLoading ? "Salvando..." : "Salvar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => setEditingItemId(null)}
                          >
                            <X className="w-3 h-3" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-3 py-2.5 group">
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate">{item.name}</p>
                          {item.totalUnits && (
                            <p className="text-xs text-muted-foreground">
                              Qtd: {item.totalUnits}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={deletingId === item.id}
                            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {(itemListTab === "espacos" ? espacosList : instrumentosList).length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum item cadastrado.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Professores ────────────────────────────────────────────────────── */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="border-b border-border px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Professores</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Crie acessos para novos professores cadastrados na instituição.
              </p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário */}
            <form onSubmit={handleCreateProfessor} className="space-y-4">
              <p className="text-sm font-semibold text-foreground">Novo professor</p>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nome completo</Label>
                <Input
                  value={profNome}
                  onChange={(e) => setProfNome(e.target.value)}
                  placeholder="Prof. João Silva"
                  required
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">E-mail institucional</Label>
                <Input
                  type="email"
                  value={profEmail}
                  onChange={(e) => setProfEmail(e.target.value)}
                  placeholder="joao.silva@fsss.edu.br"
                  required
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Senha inicial</Label>
                <Input
                  type="text"
                  value={profSenha}
                  onChange={(e) => setProfSenha(e.target.value)}
                  placeholder="Senha que o professor usará para entrar"
                  required
                  minLength={4}
                  className="h-9 text-sm font-mono"
                />
              </div>

              {profError && <p className="text-xs text-destructive">{profError}</p>}
              {profSuccess && (
                <div className="flex items-center gap-2 text-xs text-available">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Professor criado com sucesso!
                </div>
              )}

              <Button
                type="submit"
                disabled={profLoading}
                className="w-full h-9 text-sm"
              >
                {profLoading ? "Criando..." : "Criar Professor"}
              </Button>
            </form>

            {/* Lista */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-foreground">Cadastrados</p>
                <span className="text-xs text-muted-foreground">
                  {professors.filter((p) => p.ativo).length} ativos
                </span>
              </div>
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {professors.map((p) => (
                  <div key={p.id} className="rounded-lg border border-border hover:border-border/80 transition-colors">
                    {editingProfId === p.id ? (
                      <div className="p-3 space-y-2">
                        <Input
                          value={editProfNome}
                          onChange={(e) => setEditProfNome(e.target.value)}
                          className="h-8 text-sm"
                          placeholder="Nome"
                        />
                        <Input
                          value={editProfEmail}
                          onChange={(e) => setEditProfEmail(e.target.value)}
                          className="h-8 text-sm"
                          placeholder="Email"
                        />
                        <Input
                          value={editProfSenha}
                          onChange={(e) => setEditProfSenha(e.target.value)}
                          className="h-8 text-sm font-mono"
                          placeholder="Nova senha (deixe vazio para manter)"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => handleSaveProfessor(p.id)}
                            disabled={editProfLoading}
                          >
                            <Save className="w-3 h-3" />
                            {editProfLoading ? "Salvando..." : "Salvar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => setEditingProfId(null)}
                          >
                            <X className="w-3 h-3" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-3 py-2.5 group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {getInitial(p.nome)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {p.nome}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 text-available">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-semibold uppercase">Ativo</span>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditProfessor(p)}
                              className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteProfessor(p.id)}
                              className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {professors.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum professor cadastrado.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminManage;
