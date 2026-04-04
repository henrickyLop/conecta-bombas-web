'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Calendar, Clock, User, Phone, MessageSquare } from 'lucide-react';
import type { Solicitacao } from '@/lib/types';

export default function DonoHistoricoPage() {
  const { usuario } = useAuth();
  const [historico, setHistorico] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Solicitacao | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!usuario) return;
    loadHistorico();
  }, [usuario, page]);

  async function loadHistorico() {
    if (!usuario?.id) return;
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('solicitacoes')
        .select('*', { count: 'exact' })
        .eq('uid_dono_bomba', usuario.id)
        .in('status', ['finalizado', 'aguardando_confirmacao', 'cancelado'])
        .order('criado_em', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (error) throw error;
      setHistorico(data as Solicitacao[] || []);
      setTotalCount(count ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function formatPhone(phone: string) {
    if (!phone) return null;
    const d = phone.replace(/\D/g, '');
    return d.length === 11 ? `55${d}` : d.length === 10 ? `55${d}0` : phone;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A2E]">Histórico de Serviços</h1>
        <p className="text-[#6B7280] mt-1">Solicitações já respondidas</p>
        {!loading && totalCount > 0 && (
          <p className="text-sm text-[#9CA3AF] mt-2">
            Mostrando {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount} registros
          </p>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : historico.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList size={48} className="text-[#9CA3AF] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A2E]">Nenhum histórico</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {historico.map(s => (
            <Card key={s.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(s)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      s.status === 'finalizado' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <ClipboardList size={18} className={s.status === 'finalizado' ? 'text-green-600' : 'text-red-600'} />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A2E]">{s.nome_cliente}</p>
                      <p className="text-sm text-[#6B7280]">{s.volume}m³ · Bomba {s.capacidade}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm text-[#6B7280]">
                      <p>{s.data_servico}</p>
                      <p>{s.hora_servico}</p>
                    </div>
                    <Badge className={
                      s.status === 'finalizado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }>
                      {s.status === 'finalizado' ? 'Finalizada' : 'Cancelada'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1A1A2E]">Detalhes</DialogTitle>
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
                  <Calendar size={14} className="text-[#9CA3AF]" />
                  <span className="font-medium text-[#1A1A2E]">{selected.data_servico}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#9CA3AF]" />
                  <span className="font-medium text-[#1A1A2E]">{selected.hora_servico}</span>
                </div>
              </div>

              {selected.observacoes && (
                <div>
                  <span className="text-[#6B7280] text-sm">Observações:</span>
                  <p className="text-[#1A1A2E] mt-1">{selected.observacoes}</p>
                </div>
              )}

              {selected.telefone_cliente && (
                <a href={`https://wa.me/${formatPhone(selected.telefone_cliente)}`} target="_blank" rel="noopener noreferrer">
                  <button className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                    <MessageSquare size={18} />
                    WhatsApp do Cliente
                  </button>
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {!loading && totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-[#1A1A2E] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="text-sm text-[#6B7280]">Página {page + 1} de {Math.ceil(totalCount / PAGE_SIZE)}</span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(totalCount / PAGE_SIZE) - 1, p + 1))}
            disabled={(page + 1) * PAGE_SIZE >= totalCount}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-[#1A1A2E] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
