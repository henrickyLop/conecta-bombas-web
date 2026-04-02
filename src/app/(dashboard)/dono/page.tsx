'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, Check, X, Clock, ClipboardList, Calendar, User, Phone } from 'lucide-react';
import type { Solicitacao, Ordem } from '@/lib/types';

export default function DonoDashboardPage() {
  const { usuario, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pendentes, setPendentes] = useState<Solicitacao[]>([]);
  const [totalHistorico, setTotalHistorico] = useState(0);
  const [totalOrdens, setTotalOrdens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Solicitacao | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (usuario && usuario.tipo !== 'dono_bomba') {
      router.push('/');
      return;
    }
    if (!usuario) return;
    loadData();
  }, [usuario, router]);

  async function loadData() {
    setLoading(true);
    try {
      const [pendRes, histRes, ordRes] = await Promise.all([
        supabase.from('solicitacoes').select('*').eq('uid_dono_bomba', usuario!.id).eq('status', 'pendente').order('criado_em', { ascending: false }),
        supabase.from('solicitacoes').select('id').eq('uid_dono_bomba', usuario!.id).in('status', ['aceita', 'recusada']),
        supabase.from('ordens').select('id').eq('uid_dono_bomba', usuario!.id),
      ]);
      setPendentes((pendRes.data as Solicitacao[]) || []);
      setTotalHistorico(histRes.data?.length || 0);
      setTotalOrdens(ordRes.data?.length || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAceitar(solicitacao: Solicitacao) {
    setActionLoading(true);
    try {
      // 1. Update solicitacao
      const { error: solError } = await supabase
        .from('solicitacoes')
        .update({ status: 'aceita' })
        .eq('id', solicitacao.id);
      if (solError) throw solError;

      // 2. Create ordem
      const { data: maxResult } = await supabase
        .from('ordens')
        .select('numero_ordem')
        .order('numero_ordem', { ascending: false })
        .limit(1);
      const nextNum = (maxResult?.[0]?.numero_ordem ?? 0) + 1;

      const { error: ordError } = await supabase.from('ordens').insert({
        numero_ordem: nextNum,
        uid_cliente: solicitacao.uid_cliente,
        nome_cliente: solicitacao.nome_cliente,
        telefone_cliente: solicitacao.telefone_cliente,
        uid_dono_bomba: solicitacao.uid_dono_bomba,
        nome_dono_bomba: solicitacao.nome_dono_bomba,
        telefone_dono: usuario?.telefone || '',
        capacidade: solicitacao.capacidade,
        volume: solicitacao.volume,
        data_servico: solicitacao.data_servico,
        hora_servico: solicitacao.hora_servico,
        status: 'pendente',
      });
      if (ordError) throw ordError;

      toast.success('Solicitação aceita! Ordem gerada.');
      setPendentes(prev => prev.filter(s => s.id !== solicitacao.id));
      setSelected(null);
      setObservacoes('');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao aceitar');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRecusar(solicitacao: Solicitacao) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({ status: 'recusada' })
        .eq('id', solicitacao.id);
      if (error) throw error;
      toast.success('Solicitação recusada');
      setPendentes(prev => prev.filter(s => s.id !== solicitacao.id));
      setSelected(null);
      setObservacoes('');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao recusar');
    } finally {
      setActionLoading(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A2E]">Dashboard</h1>
        <p className="text-gray-500 mt-1">Olá, {usuario.nome}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Pendentes</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-[#1A1A2E]">{pendentes.length}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Respondidas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-[#1A1A2E]">{totalHistorico}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Ordens Geradas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-[#1A1A2E]">{totalOrdens}</div></CardContent>
        </Card>
      </div>

      {/* Pendentes */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : pendentes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A2E]">Nenhuma solicitação pendente</h3>
            <p className="text-gray-500 mt-1">Novas solicitações aparecerão aqui</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendentes.map(s => (
            <Card key={s.id} className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-500">
              <CardContent className="p-4" onClick={() => { setSelected(s); setObservacoes(''); }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Clock size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A2E]">{s.nome_cliente}</p>
                      <p className="text-sm text-gray-500">{s.volume}m³ · {s.capacidade} L/h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm text-gray-500">
                      <p>{s.data_servico}</p>
                      <p>{s.hora_servico}</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={e => { e.stopPropagation(); handleAceitar(s); }}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <><Check size={14} className="mr-1" /> Aceitar</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={e => { e.stopPropagation(); handleRecusar(s); }}
                      disabled={actionLoading}
                    >
                      <X size={14} className="mr-1" /> Recusar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setObservacoes(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1A1A2E]">Detalhes da Solicitação</DialogTitle>
            <DialogDescription>Informações do cliente</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  <span className="font-medium text-[#1A1A2E]">{selected.nome_cliente}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  <span className="font-medium text-[#1A1A2E]">{selected.telefone_cliente || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardList size={14} className="text-gray-400" />
                  <span className="font-medium text-[#1A1A2E]">{selected.volume} m³</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="font-medium text-[#1A1A2E]">{selected.data_servico} às {selected.hora_servico}</span>
                </div>
              </div>

              {selected.observacoes && (
                <div>
                  <span className="text-gray-500 text-sm">Observações:</span>
                  <p className="text-[#1A1A2E] mt-1">{selected.observacoes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleAceitar(selected)}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Aceitar'}
                </Button>
                <Button
                  onClick={() => handleRecusar(selected)}
                  disabled={actionLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  Recusar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
