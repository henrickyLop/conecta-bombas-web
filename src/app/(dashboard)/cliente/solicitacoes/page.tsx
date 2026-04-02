'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Phone, MessageSquare, Calendar, Clock, Volume2 } from 'lucide-react';
import type { Solicitacao } from '@/lib/types';

export default function ClienteSolicitacoesPage() {
  const { usuario } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Solicitacao | null>(null);

  useEffect(() => {
    if (!usuario) return;
    loadSolicitacoes();
  }, [usuario]);

  async function loadSolicitacoes() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*')
        .eq('uid_cliente', usuario!.id)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      setSolicitacoes(data as Solicitacao[] || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function statusBadge(status: string) {
    const map: Record<string, { text: string; cls: string; icon: string }> = {
      pendente: { text: 'Pendente', cls: 'bg-amber-100 text-amber-700', icon: '⏳' },
      aceita: { text: 'Aceita', cls: 'bg-green-100 text-green-700', icon: '✅' },
      recusada: { text: 'Recusada', cls: 'bg-red-100 text-red-700', icon: '❌' },
    };
    const s = map[status] || map.pendente;
    return <Badge className={`${s.cls} px-3 py-1`}>{s.icon} {s.text}</Badge>;
  }

  function formatPhone(phone: string) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) return `55${digits}`;
    if (digits.length === 10) return `55${digits}0`;
    return phone;
  }

  function whatsappLink(phone: string) {
    const formatted = formatPhone(phone);
    if (!formatted) return '#';
    return `https://wa.me/${formatted}`;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A2E]">Minhas Solicitações</h1>
        <p className="text-gray-500 mt-1">Histórico completo de solicitações</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : solicitacoes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A2E]">Nenhuma solicitação</h3>
            <p className="text-gray-500 mt-1">Busque bombas disponíveis para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {solicitacoes.map(s => (
            <Card key={s.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(s)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
                      <ClipboardList size={18} className="text-[#FF6B00]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A2E]">{s.nome_dono_bomba}</p>
                      <p className="text-sm text-gray-500">{s.volume}m³ · {s.capacidade} L/h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm text-gray-500">
                      <p>{s.data_servico}</p>
                      <p>{s.hora_servico}</p>
                    </div>
                    {statusBadge(s.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1A1A2E]">Detalhes da Solicitação</DialogTitle>
            <DialogDescription>
              {selected && `${selected.nome_dono_bomba} — ${selected.status}`}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {statusBadge(selected.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded-xl p-4">
                <div>
                  <span className="text-gray-500">Dono:</span>
                  <p className="font-medium text-[#1A1A2E]">{selected.nome_dono_bomba}</p>
                </div>
                <div>
                  <span className="text-gray-500">Volume:</span>
                  <p className="font-medium text-[#1A1A2E]">{selected.volume} m³</p>
                </div>
                <div>
                  <span className="text-gray-500">Capacidade:</span>
                  <p className="font-medium text-[#1A1A2E]">{selected.capacidade} L/h</p>
                </div>
                <div>
                  <span className="text-gray-500">Data:</span>
                  <p className="font-medium text-[#1A1A2E]">{selected.data_servico}</p>
                </div>
                <div>
                  <span className="text-gray-500">Hora:</span>
                  <p className="font-medium text-[#1A1A2E]">{selected.hora_servico}</p>
                </div>
                <div>
                  <span className="text-gray-500">Telefone:</span>
                  <p className="font-medium text-[#1A1A2E]">{selected.telefone_cliente || '—'}</p>
                </div>
              </div>

              {selected.observacoes && (
                <div>
                  <span className="text-gray-500 text-sm">Observações:</span>
                  <p className="text-[#1A1A2E] mt-1">{selected.observacoes}</p>
                </div>
              )}

              {selected.status === 'aceita' && (
                <a
                  href={whatsappLink(selected.telefone_cliente || '')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <MessageSquare size={18} className="mr-2" />
                    Conversar via WhatsApp
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
