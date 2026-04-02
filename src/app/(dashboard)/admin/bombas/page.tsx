'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, MapPin, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Bomba } from '@/lib/types';

export default function AdminBombasPage() {
  const [bombas, setBombas] = useState<Bomba[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBombas();
  }, []);

  async function loadBombas() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bombas')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      setBombas(data as Bomba[] || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function statusBadge(status: string) {
    const map: Record<string, { text: string; icon: React.ReactNode; cls: string }> = {
      aprovado: { text: 'Aprovado', icon: <CheckCircle size={12} />, cls: 'bg-green-100 text-green-700 border-green-200' },
      pendente: { text: 'Pendente', icon: <Clock size={12} />, cls: 'bg-amber-100 text-amber-700 border-amber-200' },
      rejeitado: { text: 'Rejeitado', icon: <XCircle size={12} />, cls: 'bg-red-100 text-red-700 border-red-200' },
    };
    const s = map[status] || map.pendente;
    return <Badge className={`${s.cls} border flex items-center gap-1`}>{s.icon} {s.text}</Badge>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A2E]">Bombas Cadastradas</h1>
        <p className="text-gray-500 mt-1">{bombas.length} bombas no sistema</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : bombas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Truck size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A2E]">Nenhuma bomba cadastrada</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bombas.map(b => (
            <Card key={b.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
                    <Truck size={18} className="text-[#FF6B00]" />
                  </div>
                  {statusBadge(b.status)}
                </div>
                <h3 className="font-semibold text-[#1A1A2E]">{b.nome_dono}</h3>
                <div className="space-y-2 mt-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={14} />
                    <span>{b.cidade} - {b.estado}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Settings size={14} />
                    <span>{b.tipo} · {b.capacidade}</span>
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
