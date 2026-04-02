'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Calendar, Clock, User } from 'lucide-react';
import type { Ordem } from '@/lib/types';

export default function AdminOrdensPage() {
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrdens();
  }, []);

  async function loadOrdens() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ordens')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      setOrdens(data as Ordem[] || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A2E]">Ordens de Bombeamento</h1>
        <p className="text-[#6B7280] mt-1">{ordens.length} ordens registradas</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : ordens.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList size={48} className="text-[#9CA3AF] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A2E]">Nenhuma ordem registrada</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ordens.map(o => (
            <Card key={o.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
                        <ClipboardList size={18} className="text-[#FF6B00]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1A1A2E]">Ordem #{o.numero_ordem}</h3>
                        <Badge className={
                          o.status === 'finalizado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }>{o.status === 'agendado' ? 'Agendada' : 'Finalizada'}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mt-2">
                      <div className="flex items-center gap-2 text-[#4B5563]">
                        <User size={14} />
                        <span className="text-[#1A1A2E]">{o.nome_cliente}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#4B5563]">
                        <User size={14} />
                        <span className="text-[#1A1A2E]">{o.nome_dono_bomba || 'Não atribuído'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#4B5563]">
                        <span className="font-medium text-[#1A1A2E]">{o.volume}m³ · {o.capacidade}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#4B5563]">
                        <Calendar size={14} />
                        <span className="text-[#1A1A2E]">{o.data_servico}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#4B5563]">
                        <Clock size={14} />
                        <span className="text-[#1A1A2E]">{o.hora_servico}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
