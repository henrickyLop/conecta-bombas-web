'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  CheckCircle, ClipboardList, Eye, ArrowRight, History
} from 'lucide-react';
import { toast } from 'sonner';
import type { Solicitacao } from '@/lib/types';

// Normalize old status values
function normalizeStatus(s: Solicitacao): Solicitacao {
  if (s.status === 'aceita') return { ...s, status: 'agendado' };
  if (s.status === 'recusada') return { ...s, status: 'cancelado' };
  if (s.status === 'pendente' && s.status !== 'pendente') return { ...s, status: 'agendado' };
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
    { name: 'Aguardando', valor: pendentes.length },
    { name: 'Agendadas', valor: agendadas.length },
    { name: 'Finalizadas', valor: finalizadas.length },
    { name: 'Canceladas', valor: canceladas.length },
  ];

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Aguardando</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-[#1A1A2E]">{pendentes.length}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#FF6B00]">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Agendadas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-[#1A1A2E]">{agendadas.length}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Finalizadas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-[#1A1A2E]">{finalizadas.length}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-[#1A1A2E]">{todas.length}</div></CardContent>
        </Card>
      </div>

      {/* Chart */}
      {todas.length > 0 && (
        <Card className="mb-8">
          <CardHeader><CardTitle className="text-[#1A1A2E] text-lg">Visão Geral</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A2E', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]} maxBarSize={60}>
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
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="pendentes">Aguardando ({pendentes.length})</TabsTrigger>
          <TabsTrigger value="agendadas">Agendadas ({agendadas.length})</TabsTrigger>
          <TabsTrigger value="finalizadas">Finalizadas ({finalizadas.length})</TabsTrigger>
          <TabsTrigger value="canceladas">Canceladas ({canceladas.length})</TabsTrigger>
        </TabsList>

        {/* PENDENTES */}
        <TabsContent value="pendentes">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : pendentes.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <Clock size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1A1A2E]">Nenhuma solicitação aguardando</h3>
              <p className="text-gray-500 mt-1">Novas solicitações aparecerão aqui</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {pendentes.map(s => (
                <SolicitacaoCard key={s.id} s={s} onView={() => setSelected(s)} onAccept={() => updateStatus(s.id, 'agendado')} onDecline={() => updateStatus(s.id, 'cancelado')} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* AGENDADAS */}
        <TabsContent value="agendadas">
          {agendadas.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <CheckCircle size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1A1A2E]">Nenhuma ordem agendada</h3>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {agendadas.map(s => (
                <Card key={s.id} className="hover:shadow-md border-l-4 border-l-[#FF6B00]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <CheckCircle size={18} className="text-[#FF6B00]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1A1A2E]">{s.nome_cliente}</p>
                          <p className="text-sm text-gray-500">{s.volume}m³ · Bomba {cleanCap(s.capacidade)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm text-gray-500">
                          <p>{s.data_servico}</p>
                          <p>{s.hora_servico}</p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-700">Agendada</Badge>
                        <Button size="sm" variant="outline" onClick={() => setSelected(s)}>
                          <Eye size={14} className="mr-1" /> Ver
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(s.id, 'finalizado')}>
                          <CheckCircle size={14} className="mr-1" /> Finalizar
                        </Button>
                        {s.telefone_dono && (
                          <a href={`https://wa.me/${formatPhone(s.telefone_cliente)}`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-200">
                              <MessageSquare size={14} />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* FINALIZADAS */}
        <TabsContent value="finalizadas">
          {finalizadas.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <History size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1A1A2E]">Nenhum serviço finalizado</h3>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {finalizadas.map(s => (
                <Card key={s.id} className="border-l-4 border-l-green-500 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <CheckCircle size={18} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1A1A2E]">{s.nome_cliente}</p>
                          <p className="text-sm text-gray-500">{s.volume}m³ · {s.data_servico}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Finalizada</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* CANCELADAS */}
        <TabsContent value="canceladas">
          {canceladas.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <X size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1A1A2E]">Nenhuma cancelada</h3>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {canceladas.map(s => (
                <Card key={s.id} className="border-l-4 border-l-red-500 bg-red-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <X size={18} className="text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1A1A2E]">{s.nome_cliente}</p>
                          <p className="text-sm text-gray-500">{s.volume}m³ · {s.data_servico}</p>
                        </div>
                      </div>
                      <Badge className="bg-red-100 text-red-700">Cancelada</Badge>
                    </div>
                  </CardContent>
                </Card>
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

function SolicitacaoCard({ s, onView, onAccept, onDecline }: { s: Solicitacao; onView: () => void; onAccept: () => void; onDecline: () => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-500" onClick={onView}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-[#1A1A2E]">{s.nome_cliente}</p>
              <p className="text-sm text-gray-500">{s.volume}m³</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right text-sm text-gray-500">
              <p>{s.data_servico}</p>
              <p>{s.hora_servico}</p>
            </div>
            <Badge className="bg-amber-100 text-amber-700">Aguardando</Badge>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={e => { e.stopPropagation(); onAccept(); }}>
              <Check size={14} className="mr-1" /> Aceitar
            </Button>
            <Button size="sm" variant="destructive" onClick={e => { e.stopPropagation(); onDecline(); }}>
              <X size={14} className="mr-1" /> Recusar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
