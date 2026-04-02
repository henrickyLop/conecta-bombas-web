'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Users, Truck, ClipboardList, AlertTriangle, TrendingUp, Star, Clock, CalendarDays, ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';

const COLORS = ['#f59e0b', '#FF6B00', '#22c55e', '#ef4444', '#6366f1'];

export default function AdminPage() {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    pendentes: 0,
    ativosHoje: 0,
    concluidosSemana: 0,
    novosCadastros: 0,
    clientes: 0,
    donos: 0,
    totalSolicitacoes: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [cadastrosSemana, setCadastrosSemana] = useState<{ semana: string; total: number }[]>([]);
  const [statusDist, setStatusDist] = useState<{ name: string; value: number }[]>([]);
  const [topDonos, setTopDonos] = useState<{ nome: string; count: number }[]>([]);
  const [pendentesAntigas, setPendentesAntigas] = useState<any[]>([]);

  useEffect(() => {
    if (usuario && usuario.tipo !== 'admin') {
      router.push('/');
      return;
    }
    if (!usuario) return;
    loadDashboard();
  }, [usuario, router]);

  async function loadDashboard() {
    setLoadingStats(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthAgoStr = monthAgo.toISOString().split('T')[0];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString();

      // Stats
      const [usRes, solsRes, ordensRes] = await Promise.all([
        supabase.from('usuarios').select('id, tipo, status, criado_em'),
        supabase.from('solicitacoes').select('id, status, criado_em, data_servico'),
        supabase.from('ordens').select('id, status, criado_em'),
      ]);

      const usuarios = usRes.data ?? [];
      const solicitacoes = solsRes.data ?? [];
      const ordens = ordensRes.data ?? [];

      const pendentes = usuarios.filter((u: any) => u.status === 'pendente').length;
      const clientes = usuarios.filter((u: any) => u.tipo === 'cliente').length;
      const donos = usuarios.filter((u: any) => u.tipo === 'dono_bomba').length;

      // Ativos hoje = ordens with data_servico = today or solicitado today
      const ativosHoje = solicitacoes.filter((s: any) =>
        s.data_servico === today || (s.status === 'agendado' && s.criado_em?.startsWith(today))
      ).length;

      // Concluídos na semana = finalizados nos últimos 7 dias
      const concluidosSemana = solicitacoes.filter((s: any) =>
        s.status === 'finalizado' && s.criado_em >= weekAgoStr
      ).length;

      // Novos cadastros na última semana
      const novosCadastros = usuarios.filter((u: any) =>
        u.criado_em >= weekAgoStr
      ).length;

      setStats({ pendentes, ativosHoje, concluidosSemana, novosCadastros, clientes, donos, totalSolicitacoes: solicitacoes.length });

      // Cadastros por semana (last 4 weeks)
      const cadSemana: { semana: string; total: number }[] = [];
      for (let i = 3; i >= 0; i--) {
        const endW = new Date();
        endW.setDate(endW.getDate() - i * 7);
        endW.setHours(23, 59, 59, 999);
        const startW = new Date(endW);
        startW.setDate(startW.getDate() - 6);
        startW.setHours(0, 0, 0, 0);

        const count = usuarios.filter((u: any) =>
          u.criado_em >= startW.toISOString() && u.criado_em <= endW.toISOString()
        ).length;
        const label = startW.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        cadSemana.push({ semana: `Sem ${4 - i}`, total: count });
      }
      setCadastrosSemana(cadSemana);

      // Status de serviços - pie chart
      const statusMap: Record<string, number> = {};
      solicitacoes.forEach((s: any) => {
        const st = s.status === 'aceita' ? 'agendado' : s.status === 'recusada' ? 'cancelado' : s.status;
        statusMap[st] = (statusMap[st] || 0) + 1;
      });
      const statusPie = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
      setStatusDist(statusPie);

      // Top donos by volume
      const donoCount: Record<string, number> = {};
      const donoNome: Record<string, string> = {};
      solicitacoes.forEach((s: any) => {
        if (s.uid_dono_bomba) {
          donoCount[s.uid_dono_bomba] = (donoCount[s.uid_dono_bomba] || 0) + 1;
          if (s.nome_dono_bomba) donoNome[s.uid_dono_bomba] = s.nome_dono_bomba;
        }
      });
      const top = Object.entries(donoCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([uid, count]) => ({ nome: donoNome[uid] || uid, count }));
      setTopDonos(top);

      // Alerta: pendentes > 7 dias
      const pendentesVelhas = solicitacoes.filter((s: any) =>
        s.status === 'pendente' && s.criado_em <= sevenDaysAgoStr
      );
      setPendentesAntigas(pendentesVelhas);

    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      setLoadingStats(false);
    }
  }

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
        <h1 className="text-3xl font-bold text-[#1A1A2E]">Painel Administrativo</h1>
        <p className="text-[#6B7280] mt-1">Visão geral do sistema · {usuario.nome}</p>
      </div>

      {/* Alert: pendentes > 7 dias */}
      {pendentesAntigas.length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-700">⚠️ {pendentesAntigas.length} solicitação(ões) pendente(s) há mais de 7 dias</p>
              <p className="text-sm text-red-600">
                {pendentesAntigas.slice(0, 3).map((s: any) => s.nome_cliente).join(', ')}
              </p>
            </div>
            <Link href="/admin/pendentes">
              <Badge className="bg-red-600 text-white cursor-pointer hover:bg-red-700">Resolver</Badge>
            </Link>
          </CardContent>
        </Card>
      )}

      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
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
                  <Clock size={20} className="text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1A1A2E]">{stats.pendentes}</div>
                <p className="text-xs text-[#6B7280] mt-1">Cadastros aguardando aprovação</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">Ativos Hoje</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CalendarDays size={20} className="text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1A1A2E]">{stats.ativosHoje}</div>
              <p className="text-xs text-[#6B7280] mt-1">Serviços agendados para hoje</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">Concluídos (7d)</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1A1A2E]">{stats.concluidosSemana}</div>
              <p className="text-xs text-[#6B7280] mt-1">Finalizados esta semana</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">Novos Cadastros</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <ArrowUpRight size={20} className="text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1A1A2E]">{stats.novosCadastros}</div>
              <p className="text-xs text-[#6B7280] mt-1">Últimos 7 dias</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Cadastros por semana */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1A1A2E] text-lg">Cadastros por Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cadastrosSemana}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="semana" tick={{ fontSize: 13, fill: '#6b7280' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A2E', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px' }} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={64} fill="#FF6B00" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status de Serviços - Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1A1A2E] text-lg">Status dos Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            {statusDist.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-[#6B7280]">
                Nenhum serviço registrado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  >
                    {statusDist.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A2E', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Donos by Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1A1A2E] text-lg flex items-center gap-2">
              <Star size={18} className="text-amber-500" /> Top Donos por Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topDonos.length === 0 ? (
              <div className="text-center py-8 text-[#6B7280]">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topDonos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 13, fill: '#6b7280' }} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 12, fill: '#6b7280' }} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A2E', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px' }} cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={32}>
                    {topDonos.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1A1A2E] text-lg">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Cadastros Pendentes', href: '/admin/pendentes', icon: Clock, bg: 'bg-amber-50', border: 'border-amber-200' },
                { label: 'Usuários', href: '/admin/usuarios', icon: Users, bg: 'bg-blue-50', border: 'border-blue-200' },
                { label: 'Bombas', href: '/admin/bombas', icon: Truck, bg: 'bg-green-50', border: 'border-green-200' },
                { label: 'Ordens', href: '/admin/ordens', icon: ClipboardList, bg: 'bg-orange-50', border: 'border-orange-200' },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <Card className={`hover:shadow-md transition-shadow ${item.bg} ${item.border} border`}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <item.icon size={20} />
                      <span className="text-sm font-medium text-[#1A1A2E]">{item.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
