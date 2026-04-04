'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ClipboardList, Phone, MessageSquare, Calendar, Clock, Volume2, Search,
  FileText, TrendingUp, CalendarDays, BarChart3, CheckCircle2, AlertCircle,
  MapPin, Star, RefreshCw, Save, Loader2
} from 'lucide-react';
import type { Solicitacao } from '@/lib/types';
import { toast } from 'sonner';

type DateFilter = 'todos' | 'mes' | '3meses';

function FlagIcon({ size = 16, className, ...props }: { size?: number; className?: string; [key: string]: any }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }} className={className}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function normalizeStatus(s: Solicitacao): Solicitacao {
  if (s.status === 'aceita') return { ...s, status: 'agendado' };
  if (s.status === 'recusada') return { ...s, status: 'cancelado' };
  return s;
}

export default function ClienteSolicitacoesPage() {
  const { usuario } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Solicitacao | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('todos');
  const [searchDono, setSearchDono] = useState('');
  // Pedidos Recorrentes
  const [repetirDialogOpen, setRepetirDialogOpen] = useState(false);
  const [repetirSolicitacao, setRepetirSolicitacao] = useState<Solicitacao | null>(null);
  const [repVolume, setRepVolume] = useState('');
  const [repDataServico, setRepDataServico] = useState('');
  const [repHoraServico, setRepHoraServico] = useState('');
  const [repObservacoes, setRepObservacoes] = useState('');
  const [repSubmitting, setRepSubmitting] = useState(false);
  const [modelos, setModelos] = useState<Array<{ uid_dono_bomba: string; nome_dono_bomba: string }>>([]);

  useEffect(() => {
    if (!usuario) return;
    loadSolicitacoes();
  }, [usuario]);

  // Load saved modelos
  useEffect(() => {
    try {
      const stored = localStorage.getItem('conecta_modelos');
      if (stored) setModelos(JSON.parse(stored));
    } catch {}
  }, []);

  async function loadSolicitacoes() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*')
        .eq('uid_cliente', usuario!.id)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      setSolicitacoes((data as Solicitacao[] || []).map(normalizeStatus));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function salvarComoModelo(s: Solicitacao) {
    const entrada = { uid_dono_bomba: s.uid_dono_bomba, nome_dono_bomba: s.nome_dono_bomba };
    setModelos(prev => {
      const exists = prev.find(m => m.uid_dono_bomba === s.uid_dono_bomba);
      if (exists) {
        toast.info('Este dono já está salvo como modelo');
        return prev;
      }
      const next = [...prev, entrada];
      localStorage.setItem('conecta_modelos', JSON.stringify(next));
      toast.success(`${s.nome_dono_bomba} salvo como modelo! 💾`);
      return next;
    });
  }

  function abrirRepetir(s: Solicitacao) {
    setRepetirSolicitacao(s);
    setRepVolume(String(s.volume || ''));
    setRepDataServico('');
    setRepHoraServico('');
    setRepObservacoes(s.observacoes || '');
    setRepetirDialogOpen(true);
  }

  async function enviarRepetido() {
    if (!repetirSolicitacao || !usuario || !repVolume || !repDataServico || !repHoraServico) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setRepSubmitting(true);
    try {
      const { error } = await supabase.from('solicitacoes').insert({
        uid_cliente: usuario.id,
        nome_cliente: usuario.nome,
        telefone_cliente: usuario.telefone || '',
        uid_dono_bomba: repetirSolicitacao.uid_dono_bomba,
        nome_dono_bomba: repetirSolicitacao.nome_dono_bomba,
        uid_bomba: repetirSolicitacao.uid_bomba,
        telefone_dono: repetirSolicitacao.telefone_dono || '',
        capacidade: repetirSolicitacao.capacidade,
        volume: parseFloat(repVolume),
        data_servico: repDataServico,
        hora_servico: repHoraServico,
        observacoes: repObservacoes,
        status: 'pendente',
      });
      if (error) throw error;
      toast.success('Solicitação repetida enviada! 🔄');
      setRepetirDialogOpen(false);
      setRepetirSolicitacao(null);
      loadSolicitacoes();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar solicitação');
    } finally {
      setRepSubmitting(false);
    }
  }

  // Filtered list
  const filtered = useMemo(() => {
    let list = solicitacoes;

    // Date filter
    const now = new Date();
    if (dateFilter === 'mes') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      list = list.filter(s => new Date(s.criado_em) >= start);
    } else if (dateFilter === '3meses') {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      list = list.filter(s => new Date(s.criado_em) >= start);
    }

    // Search by dono name
    if (searchDono.trim()) {
      const term = searchDono.toLowerCase().trim();
      list = list.filter(s =>
        s.nome_dono_bomba?.toLowerCase().includes(term)
      );
    }

    return list;
  }, [solicitacoes, dateFilter, searchDono]);

  // Summary stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const volumeTotal = filtered.reduce((sum, s) => sum + (s.volume || 0), 0);
    const finalizadas = filtered.filter(s => s.status === 'finalizado').length;
    const pendentes = filtered.filter(s => s.status === 'pendente').length;

    // Últimos X dias
    const now = new Date();
    const last7 = filtered.filter(s => {
      const d = new Date(s.criado_em);
      return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
    }).length;
    const last30 = filtered.filter(s => {
      const d = new Date(s.criado_em);
      return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 30;
    }).length;

    return { total, volumeTotal, finalizadas, pendentes, last7, last30 };
  }, [filtered]);

  function statusBadge(status: Solicitacao['status']) {
    const map: Record<string, { text: string; cls: string; icon: string }> = {
      agendado: { text: 'Agendada', cls: 'bg-blue-100 text-blue-700', icon: '📅' },
      finalizado: { text: 'Finalizada', cls: 'bg-green-100 text-green-700', icon: '✅' },
      cancelado: { text: 'Cancelada', cls: 'bg-red-100 text-red-700', icon: '❌' },
      pendente: { text: 'Aguardando', cls: 'bg-amber-100 text-amber-700', icon: '⏳' },
    };
    const s = map[status] || map.agendado;
    return <Badge className={`${s.cls} px-3 py-1`}>{s.icon} {s.text}</Badge>;
  }

  function statusTimeline(status: Solicitacao['status']) {
    const steps = [
      { label: 'Pedido', icon: ClipboardList, done: true, color: 'bg-blue-500' },
      { label: 'Aguardando', icon: Clock, done: ['agendado', 'finalizado'].includes(status), color: 'bg-amber-500' },
      { label: 'Aceito', icon: CheckCircle2, done: status === 'agendado' || status === 'finalizado', color: 'bg-orange-500' },
      { label: 'Finalizado', icon: FlagIcon, done: status === 'finalizado', color: 'bg-green-500' },
    ];

    if (status === 'cancelado') {
      return {
        steps: [
          { label: 'Pedido', icon: ClipboardList, done: true, color: 'bg-blue-500' },
          { label: 'Cancelado', icon: AlertCircle, done: true, color: 'bg-red-500' },
        ]
      };
    }

    return { steps };
  }

  function formatPhone(phone: string) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    return `55${digits}`;
  }

  function whatsappLink(phone: string) {
    const formatted = formatPhone(phone);
    if (!formatted) return '#';
    return `https://wa.me/${formatted}`;
  }

  

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">Histórico de Serviços</h1>
        <p className="text-[#6B7280] mt-1">Acompanhe todas as suas solicitações</p>
      </div>

      {/* Summary Stats */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <FileText size={18} className="text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-[#9CA3AF] uppercase">Total serviços</p>
                <p className="text-lg font-bold text-[#1A1A2E]">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                <Volume2 size={18} className="text-orange-500" />
              </div>
              <div>
                <p className="text-[10px] text-[#9CA3AF] uppercase">Volume total</p>
                <p className="text-lg font-bold text-[#1A1A2E]">{stats.volumeTotal}m³</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} className="text-green-500" />
              </div>
              <div>
                <p className="text-[10px] text-[#9CA3AF] uppercase">Finalizados</p>
                <p className="text-lg font-bold text-[#1A1A2E]">{stats.finalizadas}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm rounded-xl">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                <BarChart3 size={18} className="text-purple-500" />
              </div>
              <div>
                <p className="text-[10px] text-[#9CA3AF] uppercase">Últimos 7 dias</p>
                <p className="text-lg font-bold text-[#1A1A2E]">{stats.last7}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Date filter buttons */}
        <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
          {(['todos', 'mes', '3meses'] as DateFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                dateFilter === f
                  ? 'bg-white shadow-sm text-[#1A1A2E]'
                  : 'text-[#6B7280] hover:text-[#1A1A2E]'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'mes' ? 'Este mês' : '3 meses'}
            </button>
          ))}
        </div>

        {/* Search by dono */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            placeholder="Buscar por nome do dono..."
            value={searchDono}
            onChange={e => setSearchDono(e.target.value)}
            className="pl-9 h-9 text-sm bg-white border-gray-200 rounded-xl"
          />
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-[#9CA3AF] mb-3">
          {filtered.length} solicitação(ões) encontrada(s)
          {searchDono && ` para "${searchDono}"`}
          {dateFilter !== 'todos' && dateFilter === 'mes' && ' · Este mês' }
          {dateFilter === '3meses' && ' · Últimos 3 meses'}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList size={48} className="text-[#9CA3AF] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A2E]">
              {searchDono ? 'Nenhum resultado encontrado' : 'Nenhuma solicitação'}
            </h3>
            <p className="text-[#6B7280] mt-1">
              {searchDono ? 'Tente buscar com outro termo' : 'Busque bombas disponíveis para começar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <Card key={s.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(s)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center shrink-0">
                      <ClipboardList size={18} className="text-[#FF6B00]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1A1A2E] truncate">{s.nome_dono_bomba}</p>
                      <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                        <span>{s.volume}m³</span>
                        <span>·</span>
                        <span>{s.data_servico}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-[#9CA3AF]">{s.criado_em?.split('T')[0]}</p>
                    </div>
                    {statusBadge(s.status)}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#FF6B00] hover:bg-orange-50 px-2 h-8 text-xs"
                        onClick={(e) => { e.stopPropagation(); abrirRepetir(s); }}
                        title="Repetir Pedido"
                      >
                        <RefreshCw size={14} className="mr-1" /> Repetir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:bg-green-50 px-2 h-8 text-xs"
                        onClick={(e) => { e.stopPropagation(); salvarComoModelo(s); }}
                        title="Salvar como modelo"
                      >
                        <Save size={14} className="mr-1" /> Salvar
                      </Button>
                    </div>
                  </div>
                </div>
                {/* Status mini bar */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    {(() => {
                      const timeline = statusTimeline(s.status);
                      return timeline.steps.map((step, i) => {
                        const Icon = step.icon;
                        return (
                          <div key={i} className="flex items-center flex-1">
                            <div className="flex flex-col items-center gap-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                step.done ? step.color : 'bg-gray-200'
                              }`}>
                                <Icon size={12} className={step.done ? 'text-white' : 'text-gray-400'} />
                              </div>
                              <span className={`text-[9px] ${step.done ? 'text-[#1A1A2E] font-medium' : 'text-gray-400'}`}>
                                {step.label}
                              </span>
                            </div>
                            {i < timeline.steps.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 rounded ${
                                i < timeline.steps.filter((_, idx) => step.done).length - 1
                                  ? step.color
                                  : 'bg-gray-200'
                              }`} />
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail dialog with timeline */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#1A1A2E]">Detalhes da Solicitação</DialogTitle>
                <DialogDescription>{selected.nome_dono_bomba}</DialogDescription>
              </DialogHeader>

              {/* Timeline Bar */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-[#6B7280] mb-3">Progresso do Serviço</p>
                <div className="flex items-center gap-1">
                  {(() => {
                    const tl = statusTimeline(selected.status);
                    return tl.steps.map((step, i) => {
                      const Icon = step.icon;
                      return (
                        <div key={i} className="flex items-center flex-1">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              step.done ? step.color : 'bg-gray-200'
                            }`}>
                              <Icon size={16} className={step.done ? 'text-white' : 'text-gray-400'} />
                            </div>
                            <span className={`text-[10px] text-center ${
                              step.done ? 'text-[#1A1A2E] font-semibold' : 'text-gray-400'
                            }`}>
                              {step.label}
                            </span>
                            {step.done && selected.criado_em && (
                              <span className="text-[9px] text-gray-400">
                                {i === 0 && selected.criado_em.split('T')[0]}
                                {i > 0 && selected.data_servico}
                              </span>
                            )}
                          </div>
                          {i < tl.steps.length - 1 && (
                            <div className={`flex-1 h-1 mx-1 rounded-full ${
                              tl.steps[i + 1]?.done ? step.color : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="flex justify-center mt-2">
                {statusBadge(selected.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded-xl p-4">
                <div>
                  <span className="text-[#6B7280]">Dono:</span>
                  <p className="font-medium text-[#1A1A2E]">{selected.nome_dono_bomba}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Volume:</span>
                  <p className="font-medium text-[#1A1A2E]">{selected.volume} m³</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Capacidade:</span>
                  <p className="font-medium text-[#1A1A2E]">Bomba {String(selected?.capacidade).replace(/[^0-9]/g, '')}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Data:</span>
                  <p className="font-medium text-[#1A1A2E]">{selected.data_servico}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Hora:</span>
                  <p className="font-medium text-[#1A1A2E]">{selected.hora_servico}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Telefone:</span>
                  <p className="font-medium text-[#1A1A2E]">{selected.telefone_dono || selected.telefone_cliente || '—'}</p>
                </div>
              </div>

              {selected.observacoes ? (
                <div>
                  <span className="text-[#6B7280]">Observações:</span>
                  <p className="text-[#1A1A2E] mt-1">{selected.observacoes}</p>
                </div>
              ) : (
                <div className="text-[#9CA3AF] text-sm italic">Sem observações registradas</div>
              )}

              {/* Evaluation CTA for finalized */}
              {selected.status === 'finalizado' && (
                <a href={`/avaliar/${selected.id}`}>
                  <Button variant="outline" className="w-full border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700">
                    <Star size={18} className="mr-2" /> Avaliar este serviço
                  </Button>
                </a>
              )}

              {(selected.status === 'agendado' || selected.status === 'pendente') && (
                selected.telefone_dono ? (
                  <a
                    href={whatsappLink(selected.telefone_dono)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <MessageSquare size={18} className="mr-2" />
                      Conversar com {selected.nome_dono_bomba}
                    </Button>
                  </a>
                ) : (
                  <div className="text-center text-sm text-amber-600 py-2 bg-amber-50 rounded-lg">
                    ⚠️ Telefone do dono não cadastrado — contate o admin
                  </div>
                )
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Repeat Order Dialog */}
      <Dialog open={repetirDialogOpen} onOpenChange={setRepetirDialogOpen}>
        <div className="max-h-[85vh] overflow-y-auto p-1">
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1A1A2E] flex items-center gap-2">
              <RefreshCw size={20} className="text-[#FF6B00]" />
              Repetir Pedido — {repetirSolicitacao?.nome_dono_bomba}
            </DialogTitle>
            <DialogDescription>
              Edite os detalhes ou envie como está
            </DialogDescription>
          </DialogHeader>
          {repetirSolicitacao && (
            <div className="space-y-4">
              <div className="bg-orange-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-[#1A1A2E]">{repetirSolicitacao.nome_dono_bomba}</p>
                <p className="text-[#4B5563]">Capacidade: {String(repetirSolicitacao.capacidade).replace(/[^0-9]/g, '')} m³/h</p>
                <p className="text-[#4B5563]">Volume anterior: {repetirSolicitacao.volume} m³</p>
              </div>

              <div>
                <Label htmlFor="rep-volume" className="text-[#1A1A2E]">Volume de Concreto (m³)</Label>
                <Input
                  id="rep-volume"
                  type="number"
                  step="0.1"
                  value={repVolume}
                  onChange={e => setRepVolume(e.target.value)}
                  placeholder="Ex: 12"
                  className="mt-1 text-[#1A1A2E]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="rep-data" className="text-[#1A1A2E]">Data do Serviço</Label>
                  <Input
                    id="rep-data"
                    type="date"
                    value={repDataServico}
                    onChange={e => setRepDataServico(e.target.value)}
                    className="mt-1 text-[#1A1A2E]"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rep-hora" className="text-[#1A1A2E]">Hora do Serviço</Label>
                  <Input
                    id="rep-hora"
                    type="time"
                    value={repHoraServico}
                    onChange={e => setRepHoraServico(e.target.value)}
                    className="mt-1 text-[#1A1A2E]"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rep-obs" className="text-[#1A1A2E]">Observações (opcional)</Label>
                <Textarea
                  id="rep-obs"
                  value={repObservacoes}
                  onChange={e => setRepObservacoes(e.target.value)}
                  placeholder="Endereço da obra, detalhes do acesso, etc."
                  className="mt-1 text-[#1A1A2E]"
                  rows={3}
                />
              </div>

              <Button
                onClick={enviarRepetido}
                disabled={repSubmitting}
                className="w-full bg-[#FF6B00] hover:bg-[#E55E00] text-white"
              >
                {repSubmitting ? <Loader2 className="animate-spin" size={18} /> : '🔄 Enviar Pedido Repetido'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
