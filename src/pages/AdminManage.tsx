import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  listProfessors,
  createProfessor,
  updateProfessor,
  deleteProfessor,
} from "@/services/users";
import type { Professor } from "@/services/users";
import { fetchAllItems, createItem, deleteItem, updateItem, uploadItemImage, forceDeleteItem } from "@/services/items";
import { fetchBlockedDates, addBlockedDate, removeBlockedDate } from "@/services/blockedDates";
import type { ReservableItem } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Buildings,
  Cube,
  Plus,
  Trash,
  PencilSimple,
  FloppyDisk,
  X,
  CheckCircle,
  UserPlus,
  Image,
  Link,
  CalendarX,
  Warning,
  Info,
} from "@phosphor-icons/react";

const AdminManage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const adminId = user!.id;

  // ── Estado: Confirmação de Exclusão ──────────────────────────────────────
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
    isLoading?: boolean;
    variant?: "destructive" | "primary";
  } | null>(null);

  // ── Estado: itens (Criação) ───────────────────────────────────────────────
  const [itemCategoria, setItemCategoria] = useState<"espacos" | "instrumentos">("espacos");
  const [itemNome, setItemNome] = useState("");
  const [itemDescricao, setItemDescricao] = useState("");
  const [itemImagemUrl, setItemImagemUrl] = useState("");
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState("");
  const [itemImageMode, setItemImageMode] = useState<"upload" | "url">("upload");
  const [itemQtd, setItemQtd] = useState(1);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState("");
  const [itemSuccess, setItemSuccess] = useState(false);

  // ── Estado: itens (Listagem e Edição) ─────────────────────────────────────
  const [itemListTab, setItemListTab] = useState<"espacos" | "instrumentos">("espacos");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemNome, setEditItemNome] = useState("");
  const [editItemDescricao, setEditItemDescricao] = useState("");
  const [editItemImagemUrl, setEditItemImagemUrl] = useState("");
  const [editItemImageFile, setEditItemImageFile] = useState<File | null>(null);
  const [editItemImagePreview, setEditItemImagePreview] = useState("");
  const [editItemImageMode, setEditItemImageMode] = useState<"upload" | "url">("upload");
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

    let finalImageUrl: string | undefined = itemImagemUrl.trim() || undefined;

    if (itemImageFile) {
      const { url, error: uploadErr } = await uploadItemImage(itemImageFile);
      if (uploadErr || !url) {
        setItemError("Erro ao enviar imagem: " + (uploadErr ?? "tente novamente."));
        setItemLoading(false);
        return;
      }
      finalImageUrl = url;
    }

    const result = await createItem({
      adminId,
      nome: itemNome.trim(),
      descricao: itemDescricao.trim(),
      categoria: itemCategoria,
      imagemUrl: finalImageUrl,
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
    setItemImageFile(null);
    setItemImagePreview("");
    setItemQtd(1);
    setItemSuccess(true);
    refetchItems();
    queryClient.invalidateQueries({ queryKey: ["items", itemCategoria] });
    setTimeout(() => setItemSuccess(false), 3000);
  };

  const [itemToForceDelete, setItemToForceDelete] = useState<string | null>(null);

  const handleDeleteItem = (id: string) => {
    setConfirmConfig({
      title: "Remover Item",
      description: "Tem certeza que deseja remover este item? Esta ação só funcionará se não houver reservas no histórico.",
      onConfirm: async () => {
        setDeletingId(id);
        const result = await deleteItem(adminId, id);
        
        if (!result.ok) {
          // Falhou? Provavelmente conflito. Preparamos o segundo modal.
          console.log("Deleção normal falhou, oferecendo force delete:", result.error);
          setItemToForceDelete(id);
        } else {
          refetchItems();
          queryClient.invalidateQueries({ queryKey: ["items", "espacos"] });
          queryClient.invalidateQueries({ queryKey: ["items", "instrumentos"] });
        }
        setDeletingId(null);
        setConfirmDialogOpen(false);
      },
      variant: "destructive"
    });
    setConfirmDialogOpen(true);
  };

  const handleForceDelete = async () => {
    if (!itemToForceDelete) return;
    setDeletingId(itemToForceDelete);
    
    const result = await forceDeleteItem(adminId, itemToForceDelete);
    
    if (result.ok) {
      refetchItems();
      queryClient.invalidateQueries({ queryKey: ["items", "espacos"] });
      queryClient.invalidateQueries({ queryKey: ["items", "instrumentos"] });
      setItemToForceDelete(null);
    } else {
      alert("Erro ao forçar exclusão: " + result.error);
    }
    setDeletingId(null);
  };

  const handleEditItem = (item: ReservableItem) => {
    setEditingItemId(item.id);
    setEditItemNome(item.name);
    setEditItemDescricao(item.description);
    setEditItemImagemUrl(item.image);
    setEditItemImagePreview(item.image); // Pré-visualizar imagem existente
    setEditItemImageMode(item.image ? "url" : "upload"); // Se tem URL, começa no modo URL
    setEditItemImageFile(null);
    setEditItemQtd(item.totalUnits ?? 1);
    setEditItemCategoria(item.category);
  };

  const handleSaveItem = async (id: string) => {
    setEditItemLoading(true);

    let finalImageUrl: string | undefined = editItemImagemUrl.trim() || undefined;

    if (editItemImageMode === "upload" && editItemImageFile) {
      const { url, error: uploadErr } = await uploadItemImage(editItemImageFile);
      if (uploadErr || !url) {
        alert("Erro ao enviar nova imagem: " + (uploadErr ?? "tente novamente."));
        setEditItemLoading(false);
        return;
      }
      finalImageUrl = url;
    } else if (editItemImageMode === "upload" && !editItemImageFile) {
      // Se o modo é upload mas não tem arquivo, talvez a intenção era remover a imagem
      finalImageUrl = undefined;
    }

    const result = await updateItem({
      adminId,
      id,
      nome: editItemNome.trim(),
      descricao: editItemDescricao.trim(),
      imagemUrl: finalImageUrl,
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

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditItemImageFile(null);
    setEditItemImagePreview("");
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

  // ── Estado: dias bloqueados ────────────────────────────────────────────────
  const [blockData, setBlockData] = useState("");
  const [blockMotivo, setBlockMotivo] = useState("");
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockError, setBlockError] = useState("");
  const [blockSuccess, setBlockSuccess] = useState(false);

  const { data: blockedDates = [], refetch: refetchBlocked } = useQuery({
    queryKey: ["blockedDates"],
    queryFn: fetchBlockedDates,
  });

  const handleAddBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockData) return;
    setBlockError("");
    setBlockSuccess(false);
    setBlockLoading(true);
    const result = await addBlockedDate({ data: blockData, motivo: blockMotivo.trim() || "Bloqueado" });
    setBlockLoading(false);
    if (!result.ok) {
      setBlockError(result.error ?? "Erro ao bloquear data.");
      return;
    }
    setBlockData("");
    setBlockMotivo("");
    setBlockSuccess(true);
    refetchBlocked();
    setTimeout(() => setBlockSuccess(false), 3000);
  };

  const handleRemoveBlockedDate = async (id: string) => {
    await removeBlockedDate(id);
    refetchBlocked();
  };

  const handleCreateProfessor = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfError("");
    setProfSuccess(false);
    setProfLoading(true);
    const result = await createProfessor(adminId, profNome.trim(), profEmail.trim(), profSenha);
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
      adminId,
      id,
      editProfNome.trim(),
      editProfEmail.trim(),
      editProfSenha || undefined
    );
    setEditProfLoading(false);
    if (!result.ok) {
      setConfirmConfig({
        title: "Erro ao Atualizar",
        description: result.error ?? "Ocorreu um erro inesperado ao atualizar o professor.",
        onConfirm: () => setConfirmDialogOpen(false),
        variant: "primary"
      });
      setConfirmDialogOpen(true);
      return;
    }
    setEditingProfId(null);
    queryClient.invalidateQueries({ queryKey: ["professors"] });
  };

  const handleDeleteProfessor = (id: string) => {
    setConfirmConfig({
      title: "Excluir Professor",
      description: "Tem certeza que deseja excluir este professor? Todas as suas reservas vinculadas podem ser afetadas.",
      onConfirm: async () => {
        const result = await deleteProfessor(adminId, id);
        if (!result.ok) {
          setConfirmConfig({
            title: "Erro ao Excluir",
            description: result.error ?? "Não foi possível excluir o professor.",
            onConfirm: () => setConfirmDialogOpen(false),
            variant: "primary"
          });
          setConfirmDialogOpen(true);
          return;
        }
        queryClient.invalidateQueries({ queryKey: ["professors"] });
      },
      variant: "destructive"
    });
    setConfirmDialogOpen(true);
  };

  const getInitial = (name: string) => name.trim()[0]?.toUpperCase() ?? "?";

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
        {/* Título */}
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary/70 mb-1.5">
            Configurações
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gerenciar recursos</h1>
          <p className="text-base font-medium text-slate-600 mt-1 max-w-2xl">
            Cadastre, edite e mantenha atualizada a base de espaços, equipamentos e usuários do
            sistema.
          </p>
        </div>

        {/* ── Espaços e equipamentos ─────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
          <div className="border-b border-slate-100 px-8 py-5 flex items-center gap-4 bg-slate-50/80">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/5">
              <Buildings weight="bold" className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Espaços e equipamentos</h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Adicione ou remova itens disponíveis para reserva.
              </p>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Formulário */}
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100/50">
              <form onSubmit={handleCreateItem} className="space-y-5">
                <p className="text-[15px] font-bold text-slate-800">Novo item</p>

                <div className="grid grid-cols-2 gap-3">
                  {(["espacos", "instrumentos"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setItemCategoria(cat)}
                      className={`flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl border transition-all duration-150 ${
                        itemCategoria === cat
                          ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                      }`}
                    >
                      {cat === "espacos" ? (
                        <>
                          <Buildings weight="bold" className="w-4 h-4" /> Espaço
                        </>
                      ) : (
                        <>
                          <Cube weight="bold" className="w-4 h-4" /> Equipamento
                        </>
                      )}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Nome</Label>
                  <Input
                    value={itemNome}
                    onChange={(e) => setItemNome(e.target.value)}
                    placeholder={
                      itemCategoria === "espacos" ? "Ex: Espaço Irmã Rosa" : "Ex: Caixa de Som"
                    }
                    required
                    className="h-10 text-[15px] rounded-xl bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Descrição</Label>
                  <Input
                    value={itemDescricao}
                    onChange={(e) => setItemDescricao(e.target.value)}
                    placeholder="Breve descrição do item"
                    required
                    className="h-10 text-[15px] rounded-xl bg-white border-slate-200"
                  />
                </div>
                {/* Imagem — upload ou URL */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-slate-700">
                      Imagem <span className="font-normal text-slate-400">(opcional)</span>
                    </Label>
                    <div className="flex gap-1 border border-slate-200 bg-white rounded-lg overflow-hidden p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => { setItemImageMode("upload"); setItemImagemUrl(""); }}
                        className={`flex items-center gap-1 px-3 py-1 font-bold transition-colors rounded ${itemImageMode === "upload" ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        <Image weight="bold" className="w-3.5 h-3.5" /> Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => { setItemImageMode("url"); setItemImageFile(null); setItemImagePreview(""); }}
                        className={`flex items-center gap-1 px-3 py-1 font-bold transition-colors rounded ${itemImageMode === "url" ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        <Link weight="bold" className="w-3.5 h-3.5" /> URL
                      </button>
                    </div>
                  </div>

                  {itemImageMode === "upload" ? (
                    <div>
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${itemImagePreview ? "border-primary/40 bg-white" : "bg-white border-slate-200 hover:border-primary/30 hover:bg-slate-50/50"}`}>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setItemImageFile(file);
                            setItemImagePreview(URL.createObjectURL(file));
                          }}
                        />
                        {itemImagePreview ? (
                          <img src={itemImagePreview} alt="preview" className="h-full w-full object-cover rounded-2xl" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Image weight="bold" className="w-7 h-7" />
                            <span className="text-sm font-medium">Clique para selecionar</span>
                            <span className="text-[11px]">PNG, JPG, WEBP</span>
                          </div>
                        )}
                      </label>
                      {itemImageFile && (
                        <button
                          type="button"
                          onClick={() => { setItemImageFile(null); setItemImagePreview(""); }}
                          className="mt-2 text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1.5 transition-colors"
                        >
                          <X weight="bold" className="w-3.5 h-3.5" /> Remover imagem
                        </button>
                      )}
                    </div>
                  ) : (
                    <Input
                      value={itemImagemUrl}
                      onChange={(e) => setItemImagemUrl(e.target.value)}
                      placeholder="https://..."
                      className="h-10 text-[15px] rounded-xl bg-white border-slate-200"
                    />
                  )}
                </div>
                {itemCategoria === "instrumentos" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Quantidade total</Label>
                    <Input
                      type="number"
                      min={1}
                      value={itemQtd}
                      onChange={(e) => setItemQtd(Math.max(1, Number(e.target.value)))}
                      required
                      className="h-10 text-[15px] w-32 font-mono rounded-xl bg-white border-slate-200"
                    />
                  </div>
                )}

                {itemError && <p className="text-sm font-bold text-rose-500">{itemError}</p>}
                {itemSuccess && (
                  <div className="flex items-center gap-2.5 text-sm font-bold text-emerald-600">
                    <CheckCircle weight="bold" className="w-4 h-4" /> Item adicionado com sucesso!
                  </div>
                )}

                <Button type="submit" disabled={itemLoading} className="w-full h-11 text-[15px] font-bold gap-2 rounded-xl shadow-lg shadow-primary/10">
                  <Plus weight="bold" className="w-4 h-4" />
                  {itemLoading ? "Adicionando..." : "Adicionar item"}
                </Button>
              </form>
            </div>

            {/* Lista */}
            <div>
              <div className="flex gap-2.5 mb-6">
                {(["espacos", "instrumentos"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setItemListTab(cat)}
                    className={`text-sm font-bold px-4 py-2 rounded-xl border transition-all duration-150 ${
                      itemListTab === cat
                        ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10"
                        : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 bg-white"
                    }`}
                  >
                    {cat === "espacos"
                      ? `Espaços (${espacosList.length})`
                      : `Equipamentos (${instrumentosList.length})`}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
                {(itemListTab === "espacos" ? espacosList : instrumentosList).map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-white hover:border-primary/20 hover:shadow-sm transition-all group">

                    {editingItemId === item.id ? (
                      <div className="p-4 space-y-4">
                        {/* Nome, Descrição, Qtd */}
                        <Input
                          value={editItemNome}
                          onChange={(e) => setEditItemNome(e.target.value)}
                          className="h-10 text-[15px] rounded-xl"
                          placeholder="Nome do item"
                        />
                        <Input
                          value={editItemDescricao}
                          onChange={(e) => setEditItemDescricao(e.target.value)}
                          className="h-10 text-[15px] rounded-xl"
                          placeholder="Descrição do item"
                        />
                        {item.category === "instrumentos" && (
                          <Input
                            type="number"
                            min={1}
                            value={editItemQtd}
                            onChange={(e) =>
                              setEditItemQtd(Math.max(1, Number(e.target.value)))
                            }
                            className="h-10 text-[15px] w-28 font-mono rounded-xl"
                            placeholder="Quantidade"
                          />
                        )}

                        {/* Upload/URL de Imagem */}
                        <div className="space-y-2 !mt-5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-700">Imagem</Label>
                            <div className="flex gap-1 border border-slate-200 bg-white rounded-lg overflow-hidden p-0.5 text-[11px]">
                              <button
                                type="button"
                                onClick={() => setEditItemImageMode("upload")}
                                className={`flex items-center gap-1 px-3 py-1 font-bold transition-colors rounded ${editItemImageMode === "upload" ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                              >
                                <Image weight="bold" className="w-3.5 h-3.5" /> Upload
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditItemImageMode("url")}
                                className={`flex items-center gap-1 px-3 py-1 font-bold transition-colors rounded ${editItemImageMode === "url" ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                              >
                                <Link weight="bold" className="w-3.5 h-3.5" /> URL
                              </button>
                            </div>
                          </div>
                          {editItemImageMode === "upload" ? (
                            <div>
                              <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${editItemImagePreview ? "border-primary/40 bg-white" : "bg-white border-slate-200 hover:border-primary/30 hover:bg-slate-50/50"}`}>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setEditItemImageFile(file);
                                    setEditItemImagePreview(URL.createObjectURL(file));
                                  }}
                                />
                                {editItemImagePreview ? (
                                  <img src={editItemImagePreview} alt="preview" className="h-full w-full object-cover rounded-xl" />
                                ) : (
                                  <div className="flex flex-col items-center gap-2 text-slate-400">
                                    <Image weight="bold" className="w-6 h-6" />
                                    <span className="text-xs font-medium">Selecionar imagem</span>
                                  </div>
                                )}
                              </label>
                            </div>
                          ) : (
                            <Input
                              value={editItemImagemUrl}
                              onChange={(e) => setEditItemImagemUrl(e.target.value)}
                              placeholder="https://..."
                              className="h-10 text-[15px] rounded-xl bg-white border-slate-200"
                            />
                          )}
                        </div>
                        
                        {/* Botões de Ação */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            className="h-9 text-xs font-bold gap-1.5 rounded-lg px-4"
                            onClick={() => handleSaveItem(item.id)}
                            disabled={editItemLoading}
                          >
                            <FloppyDisk weight="bold" className="w-4 h-4" />
                            {editItemLoading ? "Salvando..." : "Salvar Alterações"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs font-bold gap-1.5 rounded-lg px-4"
                            onClick={handleCancelEdit}
                          >
                            <X weight="bold" className="w-4 h-4" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-5 py-4">
                        <div className="min-w-0">
                          <p className="text-[15px] font-bold text-foreground truncate">{item.name}</p>
                          {item.totalUnits && (
                            <p className="text-xs font-bold text-primary/60 mt-0.5 uppercase tracking-wider">
                              Qtd: {item.totalUnits} unidades
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                          >
                            <PencilSimple weight="bold" className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={deletingId === item.id}
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all disabled:opacity-40"
                          >
                            <Trash weight="bold" className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {(itemListTab === "espacos" ? espacosList : instrumentosList).length === 0 && (
                  <p className="text-base font-medium text-muted-foreground/60 py-10 text-center bg-gray-50/50 rounded-xl border border-dashed border-border">
                    Nenhum item cadastrado.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Professores ────────────────────────────────────────────────────── */}
        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="border-b border-border px-8 py-5 flex items-center gap-4 bg-gray-50/30">
            <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
              <UserPlus weight="bold" className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">Professores</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Crie acessos para novos professores cadastrados na instituição.
              </p>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Formulário */}
            <form onSubmit={handleCreateProfessor} className="space-y-5">
              <p className="text-[15px] font-bold text-foreground">Novo professor</p>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-foreground/80">Nome completo</Label>
                <Input
                  value={profNome}
                  onChange={(e) => setProfNome(e.target.value)}
                  placeholder="Prof. João Silva"
                  required
                  className="h-10 text-[15px] rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-foreground/80">E-mail institucional</Label>
                <Input
                  type="email"
                  value={profEmail}
                  onChange={(e) => setProfEmail(e.target.value)}
                  placeholder="joao.silva@fsss.edu.br"
                  required
                  className="h-10 text-[15px] rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-foreground/80">Senha inicial</Label>
                <Input
                  type="text"
                  value={profSenha}
                  onChange={(e) => setProfSenha(e.target.value)}
                  placeholder="Senha para o primeiro acesso"
                  required
                  minLength={4}
                  className="h-10 text-[15px] font-mono rounded-xl"
                />
              </div>

              {profError && <p className="text-sm font-bold text-destructive">{profError}</p>}
              {profSuccess && (
                <div className="flex items-center gap-2.5 text-sm font-bold text-available">
                  <CheckCircle weight="bold" className="w-4 h-4" /> Professor criado com sucesso!
                </div>
              )}

              <Button
                type="submit"
                disabled={profLoading}
                className="w-full h-11 text-[15px] font-bold rounded-xl"
              >
                {profLoading ? "Criando..." : "Criar Professor"}
              </Button>
            </form>

            {/* Lista */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-[15px] font-bold text-foreground">Cadastrados</p>
                <span className="text-xs font-bold text-primary/60 uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-lg">
                  {professors.filter((p) => p.ativo).length} ativos
                </span>
              </div>
              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
                {professors.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border bg-white hover:border-primary/20 hover:shadow-sm transition-all group">
                    {editingProfId === p.id ? (
                      <div className="p-4 space-y-3">
                        <Input
                          value={editProfNome}
                          onChange={(e) => setEditProfNome(e.target.value)}
                          className="h-10 text-[15px] rounded-xl"
                          placeholder="Nome"
                        />
                        <Input
                          value={editProfEmail}
                          onChange={(e) => setEditProfEmail(e.target.value)}
                          className="h-10 text-[15px] rounded-xl"
                          placeholder="Email"
                        />
                        <Input
                          value={editProfSenha}
                          onChange={(e) => setEditProfSenha(e.target.value)}
                          className="h-10 text-[15px] font-mono rounded-xl"
                          placeholder="Nova senha (opcional)"
                        />
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            className="h-9 text-xs font-bold gap-1.5 rounded-lg px-4"
                            onClick={() => handleSaveProfessor(p.id)}
                            disabled={editProfLoading}
                          >
                            <FloppyDisk weight="bold" className="w-4 h-4" />
                            {editProfLoading ? "Salvando..." : "Salvar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs font-bold gap-1.5 rounded-lg px-4"
                            onClick={() => setEditingProfId(null)}
                          >
                            <X weight="bold" className="w-4 h-4" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 px-5 py-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0">
                          {getInitial(p.nome)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-foreground truncate">
                            {p.nome}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground/80 truncate">{p.email}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1.5 text-available bg-available/5 px-2 py-1 rounded-lg">
                            <CheckCircle weight="bold" className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-extrabold uppercase">Ativo</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditProfessor(p)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                            >
                              <PencilSimple weight="bold" className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProfessor(p.id)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
                            >
                              <Trash weight="bold" className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {professors.length === 0 && (
                  <p className="text-base font-medium text-muted-foreground/60 py-10 text-center bg-gray-50/50 rounded-xl border border-dashed border-border">
                    Nenhum professor cadastrado.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Dias bloqueados ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="border-b border-border px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
              <CalendarX weight="bold" className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Dias Bloqueados</h2>
              <p className="text-xs font-medium text-muted-foreground/80 mt-0.5">
                Feriados e recessos — professores não poderão fazer reservas nestas datas.
              </p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário */}
            <form onSubmit={handleAddBlockedDate} className="space-y-4">
              <p className="text-sm font-bold text-foreground">Bloquear nova data</p>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Data</Label>
                <Input
                  type="date"
                  value={blockData}
                  onChange={(e) => setBlockData(e.target.value)}
                  required
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Motivo <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                <Input
                  value={blockMotivo}
                  onChange={(e) => setBlockMotivo(e.target.value)}
                  placeholder="Ex: Feriado Nacional, Recesso de julho..."
                  className="h-10 text-sm"
                />
              </div>

              {blockError && (
                <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                  <Warning weight="bold" className="w-3.5 h-3.5 shrink-0" />
                  {blockError}
                </div>
              )}
              {blockSuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                  <CheckCircle weight="bold" className="w-3.5 h-3.5 shrink-0" />
                  Data bloqueada com sucesso!
                </div>
              )}

              <Button type="submit" disabled={blockLoading || !blockData} className="w-full h-10 text-sm gap-1.5">
                <Plus weight="bold" className="w-3.5 h-3.5" />
                {blockLoading ? "Bloqueando..." : "Bloquear data"}
              </Button>
            </form>

            {/* Lista */}
            <div>
              <p className="text-sm font-bold text-foreground mb-3">
                Datas bloqueadas
                {blockedDates.length > 0 && (
                  <span className="ml-2 text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {blockedDates.length}
                  </span>
                )}
              </p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {blockedDates.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60 py-6 text-center bg-gray-50/50 rounded-xl border border-dashed border-border">
                    Nenhuma data bloqueada.
                  </p>
                ) : (
                  blockedDates.map((b) => {
                    const [y, m, d] = b.data.split("-");
                    return (
                      <div key={b.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:border-rose-200 hover:bg-rose-50/30 transition-colors group">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground">
                            {d}/{m}/{y}
                          </p>
                          {b.motivo && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{b.motivo}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveBlockedDate(b.id)}
                          className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                          title="Remover bloqueio"
                        >
                          <Trash weight="bold" className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Confirmação Reutilizável */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent className="max-w-[400px] rounded-2xl">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${confirmConfig?.variant === "destructive" ? "bg-rose-100 text-rose-600" : "bg-primary/10 text-primary"}`}>
                  {confirmConfig?.variant === "destructive" ? <Warning weight="bold" className="w-5 h-5" /> : <Info weight="bold" className="w-5 h-5" />}
                </div>
                <AlertDialogTitle className="text-xl font-extrabold tracking-tight text-slate-900">
                  {confirmConfig?.title}
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-sm font-medium text-slate-500 leading-relaxed">
                {confirmConfig?.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6 gap-3">
              <AlertDialogCancel className="flex-1 h-11 rounded-xl font-bold text-slate-500 border-slate-200 hover:bg-slate-50">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmConfig?.onConfirm}
                className={`flex-1 h-11 rounded-xl font-bold shadow-lg transition-all ${
                  confirmConfig?.variant === "destructive" 
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" 
                    : "bg-primary hover:bg-primary-dark shadow-primary/20"
                }`}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal Secundário: Forçar Exclusão */}
        <AlertDialog open={!!itemToForceDelete} onOpenChange={(open) => !open && setItemToForceDelete(null)}>
          <AlertDialogContent className="max-w-[400px] rounded-2xl border-rose-100 shadow-2xl shadow-rose-100">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shadow-sm">
                  <CalendarX weight="bold" className="w-7 h-7" />
                </div>
                <AlertDialogTitle className="text-xl font-extrabold tracking-tight text-slate-900">
                  Reservas Ativas
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-[15px] font-medium text-slate-500 leading-relaxed">
                Este item possui agendamentos confirmados. Para removê-lo da listagem, o sistema irá:
                <ul className="list-disc list-inside mt-3 space-y-1 text-rose-600/80 font-bold text-sm">
                  <li>Cancelar todas as reservas futuras</li>
                  <li>Ocultar o item para novos agendamentos</li>
                </ul>
                <p className="mt-4">Deseja prosseguir com a exclusão forçada?</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 gap-3">
              <AlertDialogCancel className="flex-1 h-11 rounded-xl font-bold text-slate-500 border-slate-200 hover:bg-slate-50">
                Manter item
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleForceDelete}
                className="flex-1 h-11 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all"
              >
                Sim, excluir tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};

export default AdminManage;
