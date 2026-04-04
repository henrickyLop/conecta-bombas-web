'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, Check, X, Clock, Calendar, User, Phone, MessageSquare, CheckCircle, ClipboardList, Eye, History, Star, TrendingUp, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import type { Solicitacao } from '@/lib/types';

function normalizeStatus(s: Solicitacao): Solicitacao {
  if (s.status === 'aceita') return { ...s, status: 'agendado' };
  if (s.status === 'recusada') return { ...s, status: 'cancelado' };
  return s;
}

export default function DonoDashboardPage() {
  const { usuario, loading: authLoading } = useAuth();
  const router = useRouter();
  const [todas, setTodas] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pendentes');
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected] = useState<Solicitacao | null>(null);
  const [meusNumeros, setMeusNumeros] = useState({ servicosMes: 0, taxaAceitacao: 0, avaliacaoMedia: 0, semanaServicos: [] as { semana: string; total: number; aceitas: number; finalizadas: number }[] });

  // Read URL hash for tab
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['pendentes', 'agendadas', 'finalizadas', 'canceladas'].includes(hash)) setActiveTab(hash);
    function handleHash() {
      const h = window.location.hash.replace('#', '');
      if (['pendentes', 'agendadas', 'finalizadas', 'canceladas'].includes(h)) setActiveTab(h);
    }
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    if (usuario && usuario.tipo !== 'dono_bomba') { router.push('/'); return; }
    if (!usuario) return;
    loadData();
    loadMeusNumeros();
  }, [usuario, router]);

  async function loadData() {
    if (!usuario?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('solicitacoes')
        .select('*').eq('uid_dono_bomba', usuario.id)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      setTodas((data as Solicitacao[] || []).map(normalizeStatus));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadMeusNumeros() {
    if (!usuario?.id) return;
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

      // Serviços este mês
      const { data: mesData } = await supabase
        .from('solicitacoes')
        .select('id, status')
        .eq('uid_dono_bomba', usuario.id)
        .gte('criado_em', startOfMonthStr);

      // Taxa de aceitação (aceitas / total recebidas, excluindo pendentes)
      const { data: todasSol } = await supabase
        .from('solicitacoes')
        .select('id, status')
        .eq('uid_dono_bomba', usuario.id)
        .not('status', 'eq', 'pendente');

      // Avaliação média
      const { data: avaliacoes } = await supabase
        .from('avaliacoes')
        .select('nota')
        .eq('uid_avaliado', usuario.id);

      const avgNota = avaliacoes && avaliacoes.length > 0
        ? avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length
        : 0;

      const totalDecididas = todasSol?.length ?? 0;
      const aceitas = todasSol?.filter((s: any) => s.status === 'agendado' || s.status === 'finalizado').length ?? 0;
      const taxaAceitacao = totalDecididas > 0 ? Math.round((aceitas / totalDecididas) * 100) : 0;

      // Serviços por semana (last 4 weeks)
      const semana: { semana: string; total: number; aceitas: number; finalizadas: number }[] = [];
      for (let i = 3; i >= 0; i--) {
        const endOfWeek = new Date();
        endOfWeek.setDate(endOfWeek.getDate() - (i * 7));
        endOfWeek.setHours(23, 59, 59, 999);
        const startOfWeek = new Date(endOfWeek);
        startOfWeek.setDate(startOfWeek.getDate() - 6);
        startOfWeek.setHours(0, 0, 0, 0);

        const { data } = await supabase
          .from('solicitacoes')
          .select('status, criado_em')
          .eq('uid_dono_bomba', usuario.id)
          .gte('criado_em', startOfWeek.toISOString().split('T')[0])
          .lte('criado_em', endOfWeek.toISOString().split('T')[0]);

        const weekData = data ?? [];
        const weekLabel = startOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        semana.push({
          semana: `Sem ${4 - i}`,
          total: weekData.length,
          aceitas: weekData.filter((s: any) => s.status === 'agendado' || s.status === 'finalizado').length,
          finalizadas: weekData.filter((s: any) => s.status === 'finalizado').length,
        });
      }

      setMeusNumeros({
        servicosMes: mesData?.length ?? 0,
        taxaAceitacao,
        avaliacaoMedia: parseFloat(avgNota.toFixed(1)),
        semanaServicos: semana,
      });
    } catch (e) {
      console.error('Erro ao carregar Meus Números:', e);
    }
  }

  async function updateStatus(id: string, ns: 'agendado' | 'finalizado' | 'cancelado') {
    setActionLoading(true);
    try {
      const { error } = await supabase.from('solicitacoes').update({ status: ns }).eq('id', id);
      if (error) throw error;

      // When accepting, create ordens order
      if (ns === 'agendado') {
        const sol = todas.find(s => s.id === id);
        if (sol) {
          const { data: maxOrdem } = await supabase.from('ordens')
            .select('numero_ordem').order('numero_ordem', { ascending: false }).limit(1);
          const nextNum = (maxOrdem?.[0]?.numero_ordem ?? 0) + 1;
          await supabase.from('ordens').insert({
            numero_ordem: nextNum,
            uid_cliente: sol.uid_cliente,
            nome_cliente: sol.nome_cliente,
            telefone_cliente: sol.telefone_cliente || '',
            uid_dono_bomba: sol.uid_dono_bomba,
            nome_dono_bomba: sol.nome_dono_bomba,
            telefone_dono: sol.telefone_dono || '',
            capacidade: sol.capacidade,
            volume: sol.volume,
            data_servico: sol.data_servico,
            hora_servico: sol.hora_servico,
            status: 'agendado',
          });
        }
      }

      // When finalizing, update corresponding order status
      if (ns === 'finalizado') {
        const sol = todas.find(s => s.id === id);
        if (sol) {
          await supabase.from('ordens')
            .update({ status: 'finalizado' })
            .eq('uid_cliente', sol.uid_cliente)
            .eq('uid_dono_bomba', sol.uid_dono_bomba)
            .eq('data_servico', sol.data_servico)
            .eq('status', 'agendado'); // only update if still agendado
        }
      }

      toast.success(ns === 'agendado' ? 'Aceita!' : ns === 'finalizado' ? 'Finalizado!' : 'Cancelado.');
      setSelected(null); loadData();
    } catch (e: any) { toast.error(e.message || 'Erro'); }
    finally { setActionLoading(false); }
  }

  function formatPhone(phone: string) {
    if (!phone) return null;
    const d = phone.replace(/\D/g, '');
    return `55${d}`;
  }

  const pendentes = todas.filter(s => s.status === 'pendente');
  const agendadas = todas.filter(s => s.status === 'agendado');
  const finalizadas = todas.filter(s => s.status === 'finalizado');
  const canceladas = todas.filter(s => s.status === 'cancelado');

  const chartData = [
    { name: 'Aguard.', valor: pendentes.length },
    { name: 'Agend.', valor: agendadas.length },
    { name: 'Final.', valor: finalizadas.length },
    { name: 'Cancel.', valor: canceladas.length },
  ];

  if (authLoading || !usuario) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#FF6B00]" size={32} />
      </div>
    );
  }

  // ---- CARD COMPONENT: Solicitação pendente (mobile-first) ----
  function PendenteCard({ s }: { s: Solicitacao }) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm space-y-3">
        {/* Header: icon + info */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#1A1A2E] text-sm truncate">{s.nome_cliente}</p>
            <p className="text-[11px] text-[#9CA3AF]">{s.volume}m³</p>
          </div>
        </div>
        {/* Date/Time + Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
            <Calendar size={12} />
            <span>{s.data_servico} {s.hora_servico}</span>
          </div>
          <Badge className="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] shrink-0">
            Aguardando
          </Badge>
        </div>
        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 rounded-lg text-white"
            onClick={() => updateStatus(s.id, 'agendado')}
            disabled={actionLoading}
          >
            <Check size={14} className="mr-1" /> Aceitar
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-8 text-xs rounded-lg border-red-200 text-red-600"
            onClick={() => updateStatus(s.id, 'cancelado')}
            disabled={actionLoading}
          >
            <X size={14} className="mr-1" /> Recusar
          </Button>
        </div>
        {/* View details */}
        <button
          onClick={() => setSelected(s)}
          className="w-full text-center text-[10px] text-[#9CA3AF] hover:text-[#4B5563] py-1 -mb-0.5"
        >
          Ver detalhes
        </button>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1A1A2E]">Dashboard</h1>
        <p className="text-[#6B7280] text-sm">Olá, {usuario.nome}</p>
      </div>

      {/* Stats: 2x2 grid mobile */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Aguardando</span>
            </div>
            <div className="text-xl font-bold text-[#1A1A2E]">{pendentes.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Agendadas</span>
            </div>
            <div className="text-xl font-bold text-[#1A1A2E]">{agendadas.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Finalizadas</span>
            </div>
            <div className="text-xl font-bold text-[#1A1A2E]">{finalizadas.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-sm rounded-xl">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Total</span>
            </div>
            <div className="text-xl font-bold text-[#1A1A2E]">{todas.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Meus Números */}
      <Card className="bg-white border-0 shadow-sm rounded-xl mb-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-[#1A1A2E] text-base flex items-center gap-2">
            <TrendingUp size={18} className="text-[#FF6B00]" /> Meus Números
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <CalendarDays size={18} className="text-[#FF6B00] mx-auto mb-1" />
              <p className="text-[10px] text-[#9CA3AF] uppercase">Serviços este mês</p>
              <p className="text-lg font-bold text-[#1A1A2E]">{meusNumeros.servicosMes}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <CheckCircle size={18} className="text-green-600 mx-auto mb-1" />
              <p className="text-[10px] text-[#9CA3AF] uppercase">Taxa de aceitação</p>
              <p className="text-lg font-bold text-[#1A1A2E]">{meusNumeros.taxaAceitacao > 0 ? `${meusNumeros.taxaAceitacao}%` : '—'}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <Star size={18} className="text-amber-500 mx-auto mb-1" />
              <p className="text-[10px] text-[#9CA3AF] uppercase">Avaliação média</p>
              <p className="text-lg font-bold text-[#1A1A2E]">
                {meusNumeros.avaliacaoMedia > 0 ? `${meusNumeros.avaliacaoMedia} ⭐` : '—'}
              </p>
            </div>
          </div>
          {meusNumeros.semanaServicos.some((s: any) => s.total > 0) && (
            <div className="pt-2">
              <p className="text-xs text-[#9CA3AF] mb-2">Serviços por semana (últimas 4)</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={meusNumeros.semanaServicos}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                  <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]} fill="#FF6B00" maxBarSize={32} />
                  <Bar dataKey="aceitas" name="Aceitas" radius={[4, 4, 0, 0]} fill="#22c55e" maxBarSize={32} />
                  <Bar dataKey="finalizadas" name="Finalizadas" radius={[4, 4, 0, 0]} fill="#f59e0b" maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      {todas.length > 0 && (
        <Card className="bg-white border-0 shadow-sm rounded-xl mb-5">
          <CardHeader className="pb-0">
            <CardTitle className="text-[#1A1A2E] text-base">Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 -mx-2">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  <Cell fill="#f59e0b" />
                  <Cell fill="#FF6B00" />
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Mobile: 2x2 grid. Desktop: 4x1 */}
        <TabsList className="grid grid-cols-2 w-full mb-4 bg-gray-50 rounded-xl p-1 gap-1 sm:grid-cols-4 sm:mb-6">
          <TabsTrigger value="pendentes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] sm:text-xs rounded-lg py-2">
            Aguardando ({pendentes.length})
          </TabsTrigger>
          <TabsTrigger value="agendadas" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] sm:text-xs rounded-lg py-2">
            Agendadas ({agendadas.length})
          </TabsTrigger>
          <TabsTrigger value="finalizadas" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] sm:text-xs rounded-lg py-2">
            Finalizadas ({finalizadas.length})
          </TabsTrigger>
          <TabsTrigger value="canceladas" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] sm:text-xs rounded-lg py-2">
            Canceladas ({canceladas.length})
          </TabsTrigger>
        </TabsList>

        {/* PENDENTES - stack layout mobile */}
        <TabsContent value="pendentes">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
          ) : pendentes.length === 0 ? (
            <Card className="bg-white border-0 shadow-sm rounded-xl">
              <CardContent className="py-10 text-center">
                <Clock size={36} className="text-[#9CA3AF] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#6B7280]">Nenhuma solicitação aguardando</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendentes.map(s => <PendenteCard key={s.id} s={s} />)}
            </div>
          )}
        </TabsContent>

        {/* AGENDADAS - simple list */}
        <TabsContent value="agendadas">
          {agendadas.length === 0 ? (
            <Card className="bg-white border-0 shadow-sm rounded-xl">
              <CardContent className="py-10 text-center">
                <CheckCircle size={36} className="text-[#9CA3AF] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#6B7280]">Nenhuma ordem agendada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {agendadas.map(s => (
                <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle size={16} className="text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1A1A2E] text-sm truncate">{s.nome_cliente}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{s.volume}m³ · {s.data_servico}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className="bg-orange-50 text-orange-600 border border-orange-100 text-[10px]">Agendada</Badge>
                    <Button size="sm" className="h-7 text-[10px] bg-green-600 hover:bg-green-700 px-2 rounded-lg"
                      onClick={() => updateStatus(s.id, 'finalizado')} disabled={actionLoading}>
                      <CheckCircle size={12} className="mr-0.5" /> Finalizar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#9CA3AF]"
                      onClick={() => setSelected(s)}>
                      <Eye size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* FINALIZADAS - simple list */}
        <TabsContent value="finalizadas">
          {finalizadas.length === 0 ? (
            <Card className="bg-white border-0 shadow-sm rounded-xl">
              <CardContent className="py-10 text-center">
                <History size={36} className="text-[#9CA3AF] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#6B7280]">Nenhum serviço finalizado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {finalizadas.map(s => (
                <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle size={16} className="text-green-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1A1A2E] text-sm truncate">{s.nome_cliente}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{s.volume}m³ · {s.data_servico}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-50 text-green-600 border border-green-100 text-[10px] shrink-0">Finalizada</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* CANCELADAS - simple list */}
        <TabsContent value="canceladas">
          {canceladas.length === 0 ? (
            <Card className="bg-white border-0 shadow-sm rounded-xl">
              <CardContent className="py-10 text-center">
                <X size={36} className="text-[#9CA3AF] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#6B7280]">Nenhuma cancelada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {canceladas.map(s => (
                <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                      <X size={16} className="text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1A1A2E] text-sm truncate">{s.nome_cliente}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{s.volume}m³ · {s.data_servico}</p>
                    </div>
                  </div>
                  <Badge className="bg-red-50 text-red-600 border border-red-100 text-[10px] shrink-0">Cancelada</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1A1A2E]">Detalhes da Solicitação</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-[#9CA3AF]" />
                  <span className="font-medium text-[#1A1A2E]">{selected.nome_cliente}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-[#9CA3AF]" />
                  <span className="font-medium text-[#1A1A2E]">{selected.telefone_cliente || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardList size={14} className="text-[#9CA3AF]" />
                  <span className="font-medium text-[#1A1A2E]">{selected.volume} m³</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#9CA3AF]" />
                  <span className="font-medium text-[#1A1A2E]">{selected.data_servico} às {selected.hora_servico}</span>
                </div>
              </div>
              {selected.observacoes ? (
                <div>
                  <span className="text-[#6B7280] text-sm">Observações:</span>
                  <p className="text-[#1A1A2E] mt-1">{selected.observacoes}</p>
                </div>
              ) : (
                <div className="text-[#9CA3AF] text-sm italic">Sem observações</div>
              )}
              {selected.status === 'pendente' && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => updateStatus(selected.id, 'agendado')} disabled={actionLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                    {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <><Check size={16} className="mr-1" /> Aceitar</>}
                  </Button>
                  <Button onClick={() => updateStatus(selected.id, 'cancelado')} disabled={actionLoading} variant="destructive" className="flex-1">
                    <X size={14} className="mr-1" /> Recusar
                  </Button>
                </div>
              )}
              {selected.status === 'agendado' && (
                <Button onClick={() => updateStatus(selected.id, 'finalizado')} disabled={actionLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                  {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle size={16} className="mr-1" /> Finalizar Serviço</>}
                </Button>
              )}
              {selected.telefone_cliente && (
                <a href={`https://wa.me/${formatPhone(selected.telefone_cliente)}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
                    <MessageSquare size={18} className="mr-2" /> WhatsApp: {selected.nome_cliente}
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