'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Users, Truck, ClipboardList } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

export default function AdminPage() {
  const { usuario, loading } = useAuth();
  const [stats, setStats] = useState({ pendentes: 0, clientes: 0, donos: 0, ordens: 0, ordensAgendado: 0, ordensFinalizado: 0 });
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
        const [uRes, bRes, oRes, oStatusRes] = await Promise.all([
          supabase.from('usuarios').select('id, tipo, status'),
          supabase.from('bombas').select('id'),
          supabase.from('ordens').select('id'),
          supabase.from('ordens').select('id, status'),
        ]);

        const ordensData = oStatusRes.data ?? [];
        setStats({
          pendentes: (uRes.data ?? []).filter((u: any) => u.status === 'pendente').length,
          clientes: (uRes.data ?? []).filter((u: any) => u.tipo === 'cliente').length,
          donos: (uRes.data ?? []).filter((u: any) => u.tipo === 'dono_bomba').length,
          ordens: (oRes.data ?? []).length,
          ordensAgendado: ordensData.filter((o: any) => o.status === 'agendado').length,
          ordensFinalizado: ordensData.filter((o: any) => o.status === 'finalizado').length,
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
        <p className="text-[#6B7280] mt-1">Bem-vindo de volta, {usuario.nome}</p>
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
                <CardTitle className="text-sm font-medium text-[#6B7280]">Pendentes</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Users size={20} className="text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1A1A2E]">{stats.pendentes}</div>
                <p className="text-xs text-[#6B7280] mt-1">Aguardando aprovação</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/usuarios">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#6B7280]">Usuários</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1A1A2E]">{stats.clientes + stats.donos}</div>
                <p className="text-xs text-[#6B7280] mt-1">{stats.clientes} clientes · {stats.donos} donos</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/bombas">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#6B7280]">Bombas</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Truck size={20} className="text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1A1A2E]">{stats.ordens > 0 ? stats.donos : 0}</div>
                <p className="text-xs text-[#6B7280] mt-1">Bombas cadastradas</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/ordens">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#FF6B00]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#6B7280]">Ordens</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <ClipboardList size={20} className="text-[#FF6B00]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1A1A2E]">{stats.ordens}</div>
                <p className="text-xs text-[#6B7280] mt-1">Total de ordens</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Users by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1A1A2E] text-lg">Usuários por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={[
                  { name: 'Clientes', valor: stats.clientes },
                  { name: 'Donos', valor: stats.donos },
                  { name: 'Pendentes', valor: stats.pendentes },
                ]}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#6b7280' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A2E',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]} maxBarSize={80}>
                  <Cell fill="#FF6B00" />
                  <Cell fill="#1A1A2E" />
                  <Cell fill="#f59e0b" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1A1A2E] text-lg">Ordens por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.ordens === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-[#6B7280]">
                Nenhuma ordem registrada
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={[
                    { name: 'Total', valor: stats.ordens },
                    { name: 'Agendada', valor: stats.ordensAgendado },
                    { name: 'Finalizada', valor: stats.ordensFinalizado },
                  ]}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#6b7280' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1A1A2E',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                    cursor={{ fill: '#f3f4f6' }}
                  />
                  <Bar dataKey="valor" radius={[8, 8, 0, 0]} maxBarSize={80}>
                    <Cell fill="#FF6B00" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#22c55e" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
