'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Check, X, Loader2, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Usuario } from '@/lib/types';

export default function AdminPendentesPage() {
  const [pendentes, setPendentes] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  useEffect(() => {
    loadPendentes();
  }, []);

  async function loadPendentes() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('status', 'pendente')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      setPendentes(data as Usuario[] || []);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar pendentes');
    } finally {
      setLoading(false);
    }
  }

  async function handleAprovar(usuarioId: string, isDono: boolean) {
    setActionLoading(usuarioId);
    try {
      // Approve user
      const { error: userError } = await supabase
        .from('usuarios')
        .update({ status: 'aprovado' })
        .eq('id', usuarioId);
      if (userError) throw userError;

      // If owner, also approve their bomba
      if (isDono) {
        await supabase
          .from('bombas')
          .update({ status: 'aprovado' })
          .eq('uid_dono', usuarioId);
      }

      toast.success('Usuário aprovado!');
      setPendentes(prev => prev.filter(u => u.id !== usuarioId));
      setSelectedUser(null);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao aprovar');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejeitar(usuarioId: string, isDono: boolean) {
    setActionLoading(usuarioId);
    try {
      const { error: userError } = await supabase
        .from('usuarios')
        .update({ status: 'rejeitado' })
        .eq('id', usuarioId);
      if (userError) throw userError;

      if (isDono) {
        await supabase
          .from('bombas')
          .update({ status: 'rejeitado' })
          .eq('uid_dono', usuarioId);
      }

      toast.success('Usuário rejeitado');
      setPendentes(prev => prev.filter(u => u.id !== usuarioId));
      setSelectedUser(null);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao rejeitar');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A2E]">Cadastros Pendentes</h1>
        <p className="text-[#6B7280] mt-1">Aprove ou rejeite novos cadastros</p>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1,2,3].map(i => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : pendentes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <User size={48} className="text-[#9CA3AF] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A2E]">Nenhum cadastro pendente</h3>
            <p className="text-[#6B7280]">Todos os cadastros já foram avaliados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendentes.map((u) => (
            <Card key={u.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#FF6B00]/10 flex items-center justify-center">
                      <User size={20} className="text-[#FF6B00]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1A1A2E]">{u.nome}</h3>
                      <p className="text-sm text-[#6B7280]">{u.email} · {u.cidade}-{u.estado}</p>
                      <Badge variant="outline" className="mt-1">
                        {u.tipo === 'dono_bomba' ? 'Dono de Bomba' : 'Cliente'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-row flex-col w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#FF6B00] border-[#FF6B00] hover:bg-[#FF6B00]/10"
                      onClick={() => setSelectedUser(u)}
                    >
                      Ver Detalhes
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleAprovar(u.id, u.tipo === 'dono_bomba')}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === u.id ? <Loader2 className="animate-spin" size={16} /> : <><Check size={14} className="mr-1" /> Aprovar</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejeitar(u.id, u.tipo === 'dono_bomba')}
                      disabled={actionLoading !== null}
                    >
                      <X size={14} className="mr-1" /> Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1A1A2E]">Detalhes do Cadastro</DialogTitle>
            <DialogDescription>
              {selectedUser?.nome} — {selectedUser?.tipo === 'dono_bomba' ? 'Dono de Bomba' : 'Cliente'}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#6B7280]">Nome:</span>
                  <p className="font-medium text-[#1A1A2E]">{selectedUser.nome}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">CPF/CNPJ:</span>
                  <p className="font-medium text-[#1A1A2E]">{selectedUser.cpf_cnpj || '—'}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Email:</span>
                  <p className="font-medium text-[#1A1A2E]">{selectedUser.email}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Telefone:</span>
                  <p className="font-medium text-[#1A1A2E]">{selectedUser.telefone || '—'}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Cidade:</span>
                  <p className="font-medium text-[#1A1A2E]">{selectedUser.cidade}/{selectedUser.estado}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Tipo:</span>
                  <p className="font-medium text-[#1A1A2E]">{selectedUser.tipo === 'dono_bomba' ? 'Dono de Bomba' : selectedUser.tipo}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
