'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Users, Truck, ClipboardList } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export default function AdminPage() {
  const { usuario, loading } = useAuth();
  const [stats, setStats] = useState({ pendentes: 0, clientes: 0, donos: 0, ordens: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (usuario && usuario.tipo !== 'admin') {
      router.push('/');
      return;
    }
    if (!usuario) return;

    async function loadStats() {
      try {
        const [uRes, bRes, oRes] = await Promise.all([
          supabase.from('usuarios').select('id, tipo, status'),
          supabase.from('bombas').select('id'),
          supabase.from('ordens').select('id'),
        ]);

        setStats({
          pendentes: (uRes.data ?? []).filter((u: any) => u.status === 'pendente').length,
          clientes: (uRes.data ?? []).filter((u: any) => u.tipo === 'cliente').length,
          donos: (uRes.data ?? []).filter((u: any) => u.tipo === 'dono_bomba').length,
          ordens: (oRes.data ?? []).length,
        });
      } catch (e) {
        console.error('Stats error:', e);
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, [usuario, router]);

  if (loading || !usuario) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#FF6B00]" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A2E]">Dashboard</h1>
        <p className="text-gray-500 mt-1">Bem-vindo de volta, {usuario.nome}</p>
      </div>

      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 w-8 bg-gray-200 rounded-lg mb-3" />
                <div className="h-6 w-16 bg-gray-200 rounded mb-1" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/admin/pendentes">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Pendentes</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Users size={20} className="text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1A1A2E]">{stats.pendentes}</div>
                <p className="text-xs text-gray-500 mt-1">Aguardando aprovação</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/usuarios">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Usuários</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1A1A2E]">{stats.clientes + stats.donos}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.clientes} clientes · {stats.donos} donos</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/bombas">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Bombas</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Truck size={20} className="text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1A1A2E]">{stats.ordens > 0 ? stats.donos : 0}</div>
                <p className="text-xs text-gray-500 mt-1">Bombas cadastradas</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/ordens">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#FF6B00]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Ordens</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <ClipboardList size={20} className="text-[#FF6B00]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1A1A2E]">{stats.ordens}</div>
                <p className="text-xs text-gray-500 mt-1">Total de ordens</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
