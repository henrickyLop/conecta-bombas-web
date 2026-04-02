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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Loader2, Check, X, Clock, Calendar, User, Phone, MessageSquare,
  CheckCircle, ClipboardList, Eye, History
} from 'lucide-react';
import Link from 'next/link';
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
  const [selected, setSelected] = useState<Solicitacao | null>(null);
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
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*')
        .eq('uid_dono_bomba', usuario!.id)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      const normalized = (data as Solicitacao[] || []).map(normalizeStatus);
      setTodas(normalized);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    setActionLoading(true);
    try {
      const { error } = await supabase.from('solicitacoes').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      const msg = newStatus === 'agendado' ? 'Aceita!' : newStatus === 'finalizado' ? 'Finalizado!' : 'Cancelado.';
      toast.success(msg);
      setSelected(null);
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar');
    } finally {
      setActionLoading(false);
    }
  }

  function formatPhone(phone: string) {
    if (!phone) return null;
    const d = phone.replace(/\D/g, '');
    return d.length === 11 ? `55${d}` : d.length === 10 ? `55${d}0` : phone;
  }

  function cleanCap(cap: string | number) {
    return String(cap).replace(/[^0-9]/g, '');
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

  // --- Card de solicitação pendente (mobile-first) ---
  function PendenteCard({ s }: { s: Solicitacao }) {
    return (
      <Card className="border-l-4 border-l-amber-500">
        <CardContent className="p-3 sm:p-4 space-y-3">
          {/* Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex-shrink-0 flex items-center justify-center">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#1A1A2E] truncate text-sm">{s.nome_cliente}</p>
              <p className="text-xs text-gray-500">{s.volume}m³ · {s.data_servico} {s.hora_servico}</p>
            </div>
          </div>
          {/* Actions */}
          <div className="flex gap-2 items-center">
            <Badge className="bg-amber-100 text-amber-700 text-[10px] sm:text-xs shrink-0">
              Aguardando
            </Badge>
            <div className="flex gap-2 ml-auto">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-[11px] h-7 sm:h-8 px-2 sm:px-3"
                onClick={() => updateStatus(s.id, 'agendado')}
                disabled={actionLoading}
              >
                <Check size={12} className="sm:size-14" /> Aceitar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 text-[11px] h-7 sm:h-8 px-2 sm:px-3"
                onClick={() => updateStatus(s.id, 'cancelado')}
                disabled={actionLoading}
              >
                <X size={12} className="sm:size-14" /> Recusar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-500 text-[11px] h-7 sm:h-8 px-1 sm:px-2"
                onClick={() => setSelected(s)}
              >
                <Eye size={14} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Card genérico com detalhes ---
  function GenericCard({ s, badge, badgeCls, actionLabel, actionColor, actionStatus }: {
    s: Solicitacao; badge: string; badgeCls: string;
    actionLabel?: string; actionColor?: string; actionStatus?: string;
  }) {
    return (
      <Card className={`border-l-4 ${'border-l-' + (badgeCls === 'bg-amber-100 text-amber-700' ? 'amber-500' : badgeCls === 'bg-green-100 text-green-700' ? 'green-500' : badgeCls === 'bg-red-100 text-red-700' ? 'red-500' : 'blue-500')}`}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${badgeCls === 'bg-amber-100 text-amber-700' ? 'bg-orange-100' : badgeCls === 'bg-green-100 text-green-700' ? 'bg-green-100' : 'bg-red-100'}`}>
                {badgeCls.includes('orange') || badgeCls.includes('amber') ? (
                  <CheckCircle size={18} className="text-[#FF6B00]" />
                ) : badgeCls.includes('green') ? (
                  <CheckCircle size={18} className="text-green-600" />
                ) : (
                  <X size={18} className="text-red-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#1A1A2E] truncate text-sm">{s.nome_cliente}</p>
                <p className="text-xs text-gray-500">{s.volume}m³ · {s.data_servico}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge className={`${badgeCls} text-[10px] sm:text-xs`}>{badge}</Badge>
              {actionLabel && actionStatus && (
                <Button
                  size="sm"
                  className={`${actionColor || 'bg-green-600'} text-[11px] h-7 sm:h-8 px-2`}
                  onClick={() => updateStatus(s.id, actionStatus)}
                >
                  <CheckCircle size={12} className="mr-0.5" /> {actionLabel}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A2E]">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Olá, {usuario.nome}</p>
      </div>

      {/* Stats 2x2 mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-1 pt-3 px-3"><CardTitle className="text-xs text-gray-500">Aguardando</CardTitle></CardHeader>
          <CardContent className="pt-0 px-3 pb-3"><div className="text-2xl font-bold text-[#1A1A2E]">{pendentes.length}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#FF6B00]">
          <CardHeader className="pb-1 pt-3 px-3"><CardTitle className="text-xs text-gray-500">Agendadas</CardTitle></CardHeader>
          <CardContent className="pt-0 px-3 pb-3"><div className="text-2xl font-bold text-[#1A1A2E]">{agendadas.length}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-1 pt-3 px-3"><CardTitle className="text-xs text-gray-500">Finalizadas</CardTitle></CardHeader>
          <CardContent className="pt-0 px-3 pb-3"><div className="text-2xl font-bold text-[#1A1A2E]">{finalizadas.length}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-1 pt-3 px-3"><CardTitle className="text-xs text-gray-500">Total</CardTitle></CardHeader>
          <CardContent className="pt-0 px-3 pb-3"><div className="text-2xl font-bold text-[#1A1A2E]">{todas.length}</div></CardContent>
        </Card>
      </div>

      {/* Chart */}
      {todas.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2 pt-3 px-3 sm:px-6">
            <CardTitle className="text-[#1A1A2E] text-sm sm:text-lg">Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="px-1 pb-3 sm:px-6">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A2E', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={40}>
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
      <Tabs defaultValue="pendentes">
        <TabsList className="grid w-full grid-cols-4 gap-0.5 mb-4 sm:mb-6 h-auto p-1 bg-gray-100 rounded-lg">
          <TabsTrigger value="pendentes" className="text-[9px] sm:text-xs leading-tight data-[state=active]:bg-white">
            Aguard. ({pendentes.length})
          </TabsTrigger>
          <TabsTrigger value="agendadas" className="text-[9px] sm:text-xs leading-tight data-[state=active]:bg-white">
            Agend. ({agendadas.length})
          </TabsTrigger>
          <TabsTrigger value="finalizadas" className="text-[9px] sm:text-xs leading-tight data-[state=active]:bg-white">
            Final. ({finalizadas.length})
          </TabsTrigger>
          <TabsTrigger value="canceladas" className="text-[9px] sm:text-xs leading-tight data-[state=active]:bg-white">
            Cancel. ({canceladas.length})
          </TabsTrigger>
        </TabsList>

        {/* PENDENTES */}
        <TabsContent value="pendentes">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : pendentes.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <Clock size={40} className="text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-[#1A1A2E]">Nenhuma solicitação aguardando</h3>
                <p className="text-gray-500 mt-1 text-sm">Novas solicitações aparecerão aqui</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendentes.map(s => <PendenteCard key={s.id} s={s} />)}
            </div>
          )}
        </TabsContent>

        {/* AGENDADAS */}
        <TabsContent value="agendadas">
          {agendadas.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <CheckCircle size={40} className="text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-[#1A1A2E]">Nenhuma ordem agendada</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {agendadas.map(s => (
                <GenericCard
                  key={s.id} s={s}
                  badge="Agendada" badgeCls="bg-orange-100 text-orange-700"
                  actionLabel="Finalizar" actionStatus="finalizado" actionColor="bg-green-600"
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* FINALIZADAS */}
        <TabsContent value="finalizadas">
          {finalizadas.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <History size={40} className="text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-[#1A1A2E]">Nenhum serviço finalizado</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {finalizadas.map(s => (
                <GenericCard key={s.id} s={s} badge="Finalizada" badgeCls="bg-green-100 text-green-700" />
              ))}
            </div>
          )}
        </TabsContent>

        {/* CANCELADAS */}
        <TabsContent value="canceladas">
          {canceladas.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <X size={40} className="text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-[#1A1A2E]">Nenhuma cancelada</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {canceladas.map(s => (
                <GenericCard key={s.id} s={s} badge="Cancelada" badgeCls="bg-red-100 text-red-700" />
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

              {selected.observacoes ? (
                <div>
                  <span className="text-gray-500 text-sm">Observações:</span>
                  <p className="text-[#1A1A2E] mt-1">{selected.observacoes}</p>
                </div>
              ) : (
                <div className="text-gray-400 text-sm italic">Sem observações</div>
              )}

              {selected.status === 'pendente' && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => updateStatus(selected.id, 'agendado')} disabled={actionLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                    {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <><Check size={16} className="mr-1" /> Aceitar</>}
                  </Button>
                  <Button onClick={() => updateStatus(selected.id, 'cancelado')} disabled={actionLoading} variant="destructive" className="flex-1">
                    Recusar
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
                    <MessageSquare size={18} className="mr-2" />
                    WhatsApp: {selected.nome_cliente}
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
