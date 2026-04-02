'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Truck, ClipboardList, Search, Check, X, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import type { Solicitacao } from '@/lib/types';

export default function ClientePage() {
  const { usuario, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, pendentes: 0, aceitas: 0, recusadas: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [recentes, setRecentes] = useState<Solicitacao[]>([]);

  useEffect(() => {
    if (usuario && usuario.tipo !== 'cliente') {
      router.push('/');
      return;
    }
    if (!usuario) return;

    async function loadStats() {
      try {
        const { data } = await supabase
          .from('solicitacoes')
          .select('*')
          .eq('uid_cliente', usuario!.id)
          .order('criado_em', { ascending: false });

        const sols = data as Solicitacao[] || [];
        setStats({
          total: sols.length,
          pendentes: sols.filter(s => s.status === 'pendente').length,
          aceitas: sols.filter(s => s.status === 'aceita').length,
          recusadas: sols.filter(s => s.status === 'recusada').length,
        });
        setRecentes(sols.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, [usuario, router]);

  if (loading || !usuario) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#FF6B00]" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A2E]">Minha Área</h1>
        <p className="text-gray-500 mt-1">Olá, {usuario.nome}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1A2E]">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1A2E]">{stats.pendentes}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Aceitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1A2E]">{stats.aceitas}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Recusadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1A1A2E]">{stats.recusadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/cliente/buscar">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#FF6B00] flex items-center justify-center">
                <Search size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1A1A2E] text-lg">Buscar Bombas</h3>
                <p className="text-gray-500 text-sm">Encontre bombas na sua região</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/cliente/solicitacoes">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#FF6B00] flex items-center justify-center">
                <ClipboardList size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1A1A2E] text-lg">Minhas Solicitações</h3>
                <p className="text-gray-500 text-sm">Acompanhe o status de todas</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#1A1A2E]">Solicitações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="text-center py-8 text-gray-400">Carregando...</div>
          ) : recentes.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma solicitação ainda</p>
              <Link href="/cliente/buscar" className="text-[#FF6B00] font-medium hover:underline mt-2 inline-block">
                Buscar bombas disponíveis
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentes.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-[#1A1A2E]">{s.nome_dono_bomba}</p>
                    <p className="text-sm text-gray-500">{s.volume}m³ · {s.data_servico} às {s.hora_servico}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    s.status === 'aceita' ? 'bg-green-100 text-green-700' :
                    s.status === 'recusada' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {s.status === 'aceita' ? 'Aceita' : s.status === 'recusada' ? 'Recusada' : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
