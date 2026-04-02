'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Users, Truck, ChevronRight } from 'lucide-react';
import type { Usuario, Bomba, Solicitacao, Ordem } from '@/lib/types';

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [userDetails, setUserDetails] = useState<{ solicitacoes: Solicitacao[]; ordens: Ordem[] } | null>(null);

  useEffect(() => {
    loadUsuarios();
  }, []);

  async function loadUsuarios() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      setUsuarios(data as Usuario[] || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadUserDetails(uid: string, tipo: string) {
    try {
      const [solResult, ordResult] = await Promise.all([
        supabase
          .from('solicitacoes')
          .select('*')
          .eq(tipo === 'dono_bomba' ? 'uid_dono_bomba' : 'uid_cliente', uid)
          .order('criado_em', { ascending: false }),
        supabase
          .from('ordens')
          .select('*')
          .eq(tipo === 'dono_bomba' ? 'uid_dono_bomba' : 'uid_cliente', uid)
          .order('criado_em', { ascending: false }),
      ]);
      setUserDetails({
        solicitacoes: (solResult.data as Solicitacao[]) || [],
        ordens: (ordResult.data as Ordem[]) || [],
      });
    } catch (e) {
      console.error(e);
    }
  }

  function statusBadge(status: string) {
    const map: Record<string, { text: string; cls: string }> = {
      aprovado: { text: 'Aprovado', cls: 'bg-green-100 text-green-700 border-green-200' },
      pendente: { text: 'Pendente', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
      rejeitado: { text: 'Rejeitado', cls: 'bg-red-100 text-red-700 border-red-200' },
    };
    const s = map[status] || map.pendente;
    return <Badge className={`${s.cls} border`}>{s.text}</Badge>;
  }

  const filterUsuarios = (tipo: string) => {
    if (tipo === 'all') return usuarios;
    return usuarios.filter(u => u.tipo === tipo);
  };

  function UserList({ tipo }: { tipo: string }) {
    const filtered = filterUsuarios(tipo);
    if (filtered.length === 0) {
      return (
        <div className="text-center py-12">
          <Users size={40} className="text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-[#6B7280]">Nenhum usuário encontrado</p>
        </div>
      );
    }
    return (
      <div className="grid gap-3">
        {filtered.map(u => (
          <div
            key={u.id}
            className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
            onClick={async () => {
              setSelectedUser(u);
              await loadUserDetails(u.id, u.tipo);
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 flex items-center justify-center">
                <User size={16} className="text-[#FF6B00]" />
              </div>
              <div>
                <p className="font-medium text-[#1A1A2E]">{u.nome}</p>
                <p className="text-sm text-[#6B7280]">{u.email} · {u.cidade}-{u.estado}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{u.tipo === 'dono_bomba' ? 'Dono' : u.tipo}</Badge>
              {statusBadge(u.status)}
              <ChevronRight size={16} className="text-[#9CA3AF]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A2E]">Usuários</h1>
        <p className="text-[#6B7280] mt-1">Gerencie todos os usuários cadastrados</p>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Todos ({usuarios.length})</TabsTrigger>
          <TabsTrigger value="cliente">Clientes ({usuarios.filter(u => u.tipo === 'cliente').length})</TabsTrigger>
          <TabsTrigger value="dono_bomba">Donos ({usuarios.filter(u => u.tipo === 'dono_bomba').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {loading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div> : <UserList tipo="all" />}
        </TabsContent>
        <TabsContent value="cliente" className="mt-0">
          {loading ? <Skeleton className="h-16 w-full" /> : <UserList tipo="cliente" />}
        </TabsContent>
        <TabsContent value="dono_bomba" className="mt-0">
          {loading ? <Skeleton className="h-16 w-full" /> : <UserList tipo="dono_bomba" />}
        </TabsContent>
      </Tabs>

      {/* User details dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => { setSelectedUser(null); setUserDetails(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A2E]">{selectedUser?.nome}</DialogTitle>
            <DialogDescription>Detalhes do usuário</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#6B7280]">Email:</span>
                  <p className="font-medium text-[#1A1A2E]">{selectedUser.email}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Telefone:</span>
                  <p className="font-medium text-[#1A1A2E]">{selectedUser.telefone || '—'}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Local:</span>
                  <p className="font-medium text-[#1A1A2E]">{selectedUser.cidade}/{selectedUser.estado}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Status:</span>
                  <div className="mt-1">{statusBadge(selectedUser.status)}</div>
                </div>
              </div>

              {userDetails && userDetails.solicitacoes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[#1A1A2E] mb-3">Solicitações ({userDetails.solicitacoes.length})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userDetails.solicitacoes.map(s => (
                      <div key={s.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-[#1A1A2E]">
                            {selectedUser.tipo === 'dono_bomba' ? s.nome_cliente : s.nome_dono_bomba}
                          </p>
                          <Badge className={
                            s.status === 'finalizado' ? 'bg-green-100 text-green-700' :
                            s.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                            s.status === 'pendente' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }>{s.status === 'agendado' ? 'Agendada' : s.status === 'pendente' ? 'Pendente' : s.status === 'finalizado' ? 'Finalizada' : s.status}</Badge>
                        </div>
                        <p className="text-[#6B7280] text-xs">{s.volume}m³ · {s.data_servico} às {s.hora_servico}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {userDetails && userDetails.ordens.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[#1A1A2E] mb-3">Ordens ({userDetails.ordens.length})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userDetails.ordens.map(o => (
                      <div key={o.id} className="bg-orange-50 rounded-lg p-3 text-sm border border-orange-100">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-[#1A1A2E]">Ordem #{o.numero_ordem}</p>
                          <Badge className={o.status === 'finalizado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                            {o.status === 'agendado' ? 'Agendada' : o.status === 'finalizado' ? 'Finalizada' : o.status}
                          </Badge>
                        </div>
                        <p className="text-[#6B7280] text-xs">
                          {o.nome_cliente} · {o.volume}m³ · {o.data_servico}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
