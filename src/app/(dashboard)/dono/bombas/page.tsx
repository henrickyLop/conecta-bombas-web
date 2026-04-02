'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, Edit2, Trash2, Wrench, CheckCircle, MapPin,
  Droplets, AlertTriangle, Settings, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { ESTADOS_BR } from '@/lib/types';

type BombaFormData = {
  id?: string;
  uid_dono: string;
  nome_dono: string;
  cidade: string;
  estado: string;
  tipo: string;
  capacidade: string;
  status: string;
  cidades_atendidas: string[];
  telefone_dono: string;
  descricao: string;
  manutencao: boolean;
};

const initialFormData: BombaFormData = {
  uid_dono: '',
  nome_dono: '',
  cidade: '',
  estado: '',
  tipo: '',
  capacidade: '1000',
  status: 'pendente',
  cidades_atendidas: [],
  telefone_dono: '',
  descricao: '',
  manutencao: false,
};

export default function BombasPage() {
  const { usuario, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bombas, setBombas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [form, setForm] = useState<BombaFormData>({ ...initialFormData });
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cidadeInput, setCidadeInput] = useState('');

  useEffect(() => {
    if (usuario && usuario.tipo !== 'dono_bomba') { router.push('/'); return; }
    if (!usuario) return;
    loadBombas();
  }, [usuario, router]);

  async function loadBombas() {
    if (!usuario?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bombas')
        .select('*')
        .eq('uid_dono', usuario.id)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      setBombas(data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setForm({
      ...initialFormData,
      uid_dono: usuario!.id,
      nome_dono: usuario!.nome,
      telefone_dono: usuario!.telefone || '',
    });
    setIsEditing(false);
    setCidadeInput('');
    setEditDialog(true);
  }

  function openEdit(bomba: any) {
    setForm({
      id: bomba.id,
      uid_dono: bomba.uid_dono,
      nome_dono: bomba.nome_dono || '',
      cidade: bomba.cidade || '',
      estado: bomba.estado || '',
      tipo: bomba.tipo || '',
      capacidade: bomba.capacidade || '1000',
      status: bomba.status || 'pendente',
      cidades_atendidas: bomba.cidades_atendidas || [],
      telefone_dono: bomba.telefone_dono || '',
      descricao: bomba.descricao || '',
      manutencao: bomba.manutencao || false,
    });
    setIsEditing(true);
    setCidadeInput('');
    setEditDialog(true);
  }

  function addCidade() {
    const c = cidadeInput.trim();
    if (c && !form.cidades_atendidas.includes(c)) {
      setForm(f => ({ ...f, cidades_atendidas: [...f.cidades_atendidas, c] }));
    }
    setCidadeInput('');
  }

  function removeCidade(c: string) {
    setForm(f => ({ ...f, cidades_atendidas: f.cidades_atendidas.filter(x => x !== c) }));
  }

  async function handleSubmit() {
    if (!form.tipo || !form.cidade || !form.estado) {
      toast.error('Preencha tipo, cidade e estado');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        uid_dono: form.uid_dono,
        nome_dono: form.nome_dono,
        cidade: form.cidade,
        estado: form.estado,
        tipo: form.tipo,
        capacidade: form.capacidade,
        status: isEditing ? form.status : 'pendente',
        cidades_atendidas: form.cidades_atendidas,
        telefone_dono: form.telefone_dono,
        descricao: form.descricao,
        manutencao: form.manutencao,
      };

      if (isEditing && form.id) {
        const { error } = await supabase.from('bombas').update(payload).eq('id', form.id);
        if (error) throw error;
        toast.success('Bomba atualizada!');
      } else {
        const { error } = await supabase.from('bombas').insert({
          ...payload,
          criado_em: new Date().toISOString().split('T')[0],
        });
        if (error) throw error;
        toast.success('Bomba cadastrada! Aguardando aprovação.');
      }

      setEditDialog(false);
      loadBombas();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteBomba(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta bomba?')) return;
    try {
      const { error } = await supabase.from('bombas').delete().eq('id', id);
      if (error) throw error;
      toast.success('Bomba excluída');
      loadBombas();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir');
    }
  }

  async function toggleManutencao(id: string, current: boolean) {
    try {
      const { error } = await supabase.from('bombas')
        .update({ manutencao: !current })
        .eq('id', id);
      if (error) throw error;
      toast.success(current ? 'Bomba marcada como disponível' : 'Bomba em manutenção');
      loadBombas();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar');
    }
  }

  if (authLoading || !usuario) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#FF6B00]" size={32} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">Minhas Bombas</h1>
          <p className="text-[#6B7280] mt-1">Gerencie seus equipamentos</p>
        </div>
        <Button onClick={openNew} className="bg-[#FF6B00] hover:bg-[#e55f00] gap-2">
          <Plus size={18} /> Nova Bomba
        </Button>
      </div>

      {/* Stats */}
      {!loading && bombas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-[10px] text-[#9CA3AF] uppercase">Total</span>
              </div>
              <p className="text-xl font-bold text-[#1A1A2E]">{bombas.length}</p>
            </CardContent>
          </Card>
          {['aprovado', 'pendente'].map(status => {
            const count = bombas.filter(b => b.status === status).length;
            const color = status === 'aprovado' ? 'bg-green-400' : 'bg-amber-400';
            return (
              <Card key={status} className="bg-white border-0 shadow-sm rounded-xl">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-[10px] text-[#9CA3AF] uppercase">{status}</span>
                  </div>
                  <p className="text-xl font-bold text-[#1A1A2E]">{count}</p>
                </CardContent>
              </Card>
            );
          })}
          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[10px] text-[#9CA3AF] uppercase">Manutenção</span>
              </div>
              <p className="text-xl font-bold text-[#1A1A2E]">{bombas.filter(b => b.manutencao).length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bombas List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : bombas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Droplets size={48} className="text-[#9CA3AF] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A2E]">Nenhuma bomba cadastrada</h3>
            <p className="text-[#6B7280] mt-1 mb-4">Cadastre sua primeira bomba para começar a receber solicitações</p>
            <Button onClick={openNew} className="bg-[#FF6B00] hover:bg-[#e55f00]">
              <Plus size={18} className="mr-2" /> Cadastrar Bomba
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bombas.map(b => (
            <Card key={b.id} className="bg-white border-0 shadow-sm rounded-xl hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Icon + Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                      b.manutencao ? 'bg-red-50' : b.status === 'pendente' ? 'bg-amber-50' : 'bg-green-50'
                    }`}>
                      {b.manutencao
                        ? <Wrench size={20} className="text-red-500" />
                        : <Droplets size={20} className="text-green-500" />
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[#1A1A2E] truncate">
                          {b.nome_dono || 'Sem nome'}
                        </p>
                        <Badge className={`text-[10px] ${
                          b.status === 'aprovado'
                            ? 'bg-green-100 text-green-700'
                            : b.status === 'pendente'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {b.status === 'aprovado' ? '✓ Aprovado' : b.status === 'pendente' ? '⏳ Pendente' : '✗ Rejeitado'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#9CA3AF] mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Droplets size={12} /> {b.tipo}
                        </span>
                        <span className="flex items-center gap-1">
                          <Droplets size={12} /> {b.capacidade}m³
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {b.cidade}/{b.estado}
                        </span>
                      </div>
                      {b.manutencao && (
                        <span className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                          <AlertTriangle size={12} /> Em manutenção
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant={b.manutencao ? 'default' : 'outline'}
                      className={`h-8 text-xs gap-1 ${
                        b.manutencao
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'border-red-200 text-red-600 hover:bg-red-50'
                      }`}
                      onClick={() => toggleManutencao(b.id, b.manutencao)}
                      disabled={b.status !== 'aprovado'}
                    >
                      {b.manutencao
                        ? <><CheckCircle size={14} /> Disponível</>
                        : <><Wrench size={14} /> Manutenção</>
                      }
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                      onClick={() => openEdit(b)}>
                      <Edit2 size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500"
                      onClick={() => deleteBomba(b.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1A1A2E]">
              {isEditing ? 'Editar Bomba' : 'Nova Bomba'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Tipo */}
            <div>
              <label className="text-sm font-medium text-[#1A1A2E] block mb-1">Tipo *</label>
              <Input
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                placeholder="Ex: Succiona Vácuo, Caminhão Pipa..."
              />
            </div>

            {/* Capacidade */}
            <div>
              <label className="text-sm font-medium text-[#1A1A2E] block mb-1">Capacidade (m³)</label>
              <select
                value={form.capacidade}
                onChange={e => setForm(f => ({ ...f, capacidade: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
              >
                <option value="500">500 m³</option>
                <option value="1000">1.000 m³</option>
                <option value="2000">2.000 m³</option>
              </select>
            </div>

            {/* Cidade */}
            <div>
              <label className="text-sm font-medium text-[#1A1A2E] block mb-1">Cidade Base *</label>
              <Input
                value={form.cidade}
                onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}
                placeholder="Sua cidade"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="text-sm font-medium text-[#1A1A2E] block mb-1">Estado *</label>
              <select
                value={form.estado}
                onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
              >
                <option value="">Selecione</option>
                {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>

            {/* Cidades Atendidas */}
            <div>
              <label className="text-sm font-medium text-[#1A1A2E] block mb-1">Cidades Atendidas</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={cidadeInput}
                  onChange={e => setCidadeInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCidade(); } }}
                  placeholder="Adicionar cidade"
                  className="text-sm"
                />
                <Button onClick={addCidade} size="sm" variant="outline">+</Button>
              </div>
              {form.cidades_atendidas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.cidades_atendidas.map(c => (
                    <Badge key={c} className="bg-orange-50 text-[#FF6B00] border border-orange-200 flex items-center gap-1">
                      {c}
                      <button onClick={() => removeCidade(c)} className="ml-0.5 hover:text-red-500">×</button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label className="text-sm font-medium text-[#1A1A2E] block mb-1">Descrição</label>
              <Textarea
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Detalhes sobre os equipamentos, experiência..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="text-sm font-medium text-[#1A1A2E] block mb-1">Telefone</label>
              <Input
                value={form.telefone_dono}
                onChange={e => setForm(f => ({ ...f, telefone_dono: e.target.value }))}
                placeholder="(00) 00000-0000"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-[#FF6B00] hover:bg-[#e55f00]"
              >
                {submitting
                  ? <><Loader2 size={16} className="animate-spin mr-2" /> Salvando...</>
                  : isEditing ? 'Salvar Alterações' : 'Cadastrar Bomba'
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
