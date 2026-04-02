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
import { Loader2, Check, X, Clock, ClipboardList, Calendar, User, Phone, MessageSquare } from 'lucide-react';
import type { Solicitacao, Ordem } from '@/lib/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

export default function DonoDashboardPage() {
  const { usuario, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pendentes, setPendentes] = useState<Solicitacao[]>([]);
  const [totalHistorico, setTotalHistorico] = useState(0);
  const [totalOrdens, setTotalOrdens] = useState(0);
  const [loading, setLoading] = useState(true);
  // Chart states
  const [agendadoCount, setAgendadoCount] = useState(0);
  const [finalizadoCount, setFinalizadoCount] = useState(0);
  const [canceladoCount, setCanceladoCount] = useState(0);
  const [allSols, setAllSols] = useState<Solicitacao[]>([]);
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
      const [pendRes, histRes, ordRes, allSolsRes] = await Promise.all([
        supabase.from('solicitacoes').select('*').eq('uid_dono_bomba', usuario!.id).eq('status', 'agendado').order('criado_em', { ascending: false }),
        supabase.from('solicitacoes').select('id').eq('uid_dono_bomba', usuario!.id).in('status', ['agendado', 'finalizado']),
        supabase.from('ordens').select('id').eq('uid_dono_bomba', usuario!.id),
        supabase.from('solicitacoes').select('*').eq('uid_dono_bomba', usuario!.id).order('criado_em', { ascending: false }),
      ]);
      setPendentes((pendRes.data as Solicitacao[]) || []);
      setTotalHistorico(histRes.data?.length || 0);
      setTotalOrdens(ordRes.data?.length || 0);
      // Chart data
      const all = (allSolsRes.data as Solicitacao[]) || [];
      setAllSols(all);
      setAgendadoCount(all.filter(s => s.status === 'agendado').length);
      setFinalizadoCount(all.filter(s => s.status === 'finalizado').length);
      setCanceladoCount(all.filter(s => s.status === 'cancelado').length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAgendar(solicitacao: Solicitacao) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({ status: 'agendado' })
        .eq('id', solicitacao.id);
      if (error) throw error;

      toast.success('Solicitação agendada!');
      setPendentes(prev => prev.filter(s => s.id !== solicitacao.id));
      setSelected(null);
      setObservacoes('');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao agendar');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelar(solicitacao: Solicitacao) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({ status: 'cancelado' })
        .eq('id', solicitacao.id);
      if (error) throw error;
      toast.success('Solicitação cancelada');
      setPendentes(prev => prev.filter(s => s.id !== solicitacao.id));
      setSelected(null);
      setObservacoes('');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao cancelar');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleFinalizar(solicitacao: Solicitacao) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({ status: 'finalizado' })
        .eq('id', solicitacao.id);
      if (error) throw error;
      toast.success('Serviço finalizado!');
      setPendentes(prev => prev.filter(s => s.id !== solicitacao.id));
      setSelected(null);
      setObservacoes('');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao finalizar');
    } finally {
      setActionLoading(false);
    }
  }

  function formatPhone(phone: string) {
    if (!phone) return null;
    const d = phone.replace(/\D/g, '');
    return d.length === 11 ? `55${d}` : d.length === 10 ? `55${d}0` : phone;
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1A1A2E] text-lg">Solicitações por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {allSols.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-gray-400">
                Sem dados ainda
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={[
                    { name: 'Agendado', valor: agendadoCount },
                    { name: 'Finalizado', valor: finalizadoCount },
                    { name: 'Cancelado', valor: canceladoCount },
                  ]}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#6b7280' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1A1A2E',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                    cursor={{ fill: '#f3f4f6' }}
                  />
                  <Bar dataKey="valor" radius={[8, 8, 0, 0]} maxBarSize={80}>
                    <Cell fill="#FF6B00" />
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Volume by Service */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1A1A2E] text-lg">Volume por Solicitação</CardTitle>
            <p className="text-sm text-gray-500">Últimas solicitações (m³)</p>
          </CardHeader>
          <CardContent>
            {allSols.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-gray-400">
                Sem dados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={allSols.slice(0, 10).reverse().map((s, i) => ({
                    name: `#${i + 1}`,
                    volume: s.volume,
                    status: s.status === 'finalizado' ? 'Finalizado' : s.status === 'cancelado' ? 'Cancelado' : 'Agendado',
                  }))}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1A1A2E',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                    formatter={(value: any) => [value, '']}
                    cursor={{ fill: '#f3f4f6' }}
                  />
                  <Bar dataKey="volume" radius={[6, 6, 0, 0]} maxBarSize={60} fill="#FF6B00" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
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
            <h3 className="text-lg font-semibold text-[#1A1A2E]">Nenhuma solicitação agendada</h3>
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
                      onClick={e => { e.stopPropagation(); handleAgendar(s); }}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <><Check size={14} className="mr-1" /> Agendar</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={e => { e.stopPropagation(); handleCancelar(s); }}
                      disabled={actionLoading}
                    >
                      <X size={14} className="mr-1" /> Cancelar
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
                  onClick={() => handleAgendar(selected)}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <><Check size={16} className="mr-1" /> Agendar</>}
                </Button>
                <Button
                  onClick={() => handleFinalizar(selected)}
                  disabled={actionLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <><ClipboardList size={16} className="mr-1" /> Finalizar</>}
                </Button>
                <Button
                  onClick={() => handleCancelar(selected)}
                  disabled={actionLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>

              {selected.telefone_cliente && (
                <a href={`https://wa.me/${formatPhone(selected.telefone_cliente)}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
                    <MessageSquare size={18} className="mr-2" />
                    WhatsApp do Cliente
                  </Button>
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
