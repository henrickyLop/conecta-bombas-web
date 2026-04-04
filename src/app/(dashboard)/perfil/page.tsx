'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase-client';
import { getInitials } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  CheckCircle,
  Clock,
  Shield,
  Package,
  AlertTriangle,
  X,
} from 'lucide-react';

type UsuarioExtended = {
  bio?: string;
  verificado?: boolean;
  foto_url?: string;
};

export default function PerfilPage() {
  const { usuario, refreshUsuario, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UsuarioExtended>({});
  const [bioDialogOpen, setBioDialogOpen] = useState(false);
  const [bioText, setBioText] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [bombas, setBombas] = useState<any[]>([]);
  const [loadingBombas, setLoadingBombas] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Load user bio from Supabase on mount
  useEffect(() => {
    if (usuario) {
      loadUserData();
    } else if (!authLoading) {
      // Auth done but no usuario record — force refresh
      setFetchError(true);
    }
  }, [usuario, authLoading]);

  const loadUserData = async () => {
    if (!usuario?.id) return;

    const { data } = await supabase
      .from('usuarios')
      .select('bio, verificado, foto_url')
      .eq('id', usuario.id)
      .maybeSingle();

    if (data) {
      setUserData({ bio: data.bio, verificado: data.verificado, foto_url: data.foto_url });
      setBioText(data.bio ?? '');
    }

    // Load bombas for dono_bomba
    if ((usuario.tipo ?? 'cliente') === 'dono_bomba') {
      setLoadingBombas(true);
      const { data: bombasData } = await supabase
        .from('bombas')
        .select('*')
        .eq('uid_dono', usuario.id)
        .order('criado_em', { ascending: false });
      setBombas(bombasData ?? []);
      setLoadingBombas(false);
    }
  };

  const handleSaveBio = async () => {
    if (!usuario) return;
    setSavingBio(true);
    const { error } = await supabase
      .from('usuarios')
      .update({ bio: bioText })
      .eq('id', usuario.id);

    if (!error) {
      await refreshUsuario();
    }
    setSavingBio(false);
    setBioDialogOpen(false);
  };

  // Show loading/error instead of blank screen
  if (!usuario) {
    if (fetchError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <p className="text-lg text-[#6B7280]">Não foi possível carregar seu perfil.</p>
          <button
            className="mt-4 px-4 py-2 bg-[#FF6B00] text-white rounded-lg"
            onClick={() => { setFetchError(false); window.location.reload(); }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-[#6B7280]">Carregando perfil...</p>
      </div>
    );
  }

  const safeNome = usuario.nome ?? 'Usuário';
  const safeEmail = usuario.email ?? '';
  const safeTelefone = usuario.telefone ?? '';
  const safeCidade = usuario.cidade ?? '';
  const safeEstado = usuario.estado ?? '';
  const safeTipo = usuario.tipo ?? 'cliente';
  const safeCriadoEm = usuario.criado_em ?? new Date().toISOString();

  const initials = getInitials(safeNome);
  const isVerificado = userData.verificado === true;
  const bio = userData.bio || '';

  const tipoLabel: Record<string, string> = {
    admin: 'Administrador',
    cliente: 'Cliente',
    dono_bomba: 'Dono de Bomba',
  };
  const tipoBadgeColor: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    cliente: 'bg-blue-100 text-blue-700 border-blue-200',
    dono_bomba: 'bg-green-100 text-green-700 border-green-200',
  };

  // Calculate "tempo na plataforma" — time since cadastro
  const timeOnPlatform = useMemo(() => {
    try {
      const criadoEm = new Date(safeCriadoEm);
      if (isNaN(criadoEm.getTime())) return 'Conecta Bombas';
      const now = new Date();
      const diffMs = now.getTime() - criadoEm.getTime();
      const diffDays = Math.floor(diffMs / (86400000));
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);
      if (diffYears > 0) return `${diffYears} ano${diffYears > 1 ? 's' : ''} no Conecta Bombas`;
      if (diffMonths > 0) return `${diffMonths} mês${diffMonths > 1 ? 'es' : ''} no Conecta Bombas`;
      return `${diffDays} dia${diffDays !== 1 ? 's' : ''} no Conecta Bombas`;
    } catch {
      return 'Conecta Bombas';
    }
  }, [safeCriadoEm]);

  const bombaStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprovada</Badge>;
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      default:
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeitada</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A2E]">Meu Perfil</h1>
        <p className="text-sm text-[#6B7280] mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Personal Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Pessoais</CardTitle>
          <CardDescription>Seus dados de cadastro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar + Name */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {initials}
              </div>
              {isVerificado && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                  <CheckCircle size={16} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-[#1A1A2E]">{safeNome}</h2>
                {isVerificado && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                    <CheckCircle size={12} className="mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${tipoBadgeColor[safeTipo] || tipoBadgeColor.cliente}`}
                >
                  <Shield size={12} className="mr-1" />
                  {tipoLabel[safeTipo]}
                </Badge>
                <span className="text-xs text-[#6B7280] flex items-center gap-1">
                  <Clock size={12} />
                  {timeOnPlatform}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F8F8F8] flex items-center justify-center">
                <Mail size={16} className="text-[#6B7280]" />
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Email</p>
                <p className="text-sm text-[#1A1A2E] font-medium">{safeEmail || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F8F8F8] flex items-center justify-center">
                <Phone size={16} className="text-[#6B7280]" />
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Telefone</p>
                <p className="text-sm text-[#1A1A2E] font-medium">{safeTelefone || '—'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F8F8F8] flex items-center justify-center">
              <MapPin size={16} className="text-[#6B7280]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Localização</p>
              <p className="text-sm text-[#1A1A2E] font-medium">{safeCidade && safeEstado ? `${safeCidade} - ${safeEstado}` : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Bio</CardTitle>
              <CardDescription>Conte um pouco sobre você</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              setBioText(bio);
              setBioDialogOpen(true);
            }}>
              <Edit3 size={14} className="mr-1" />
              Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bio ? (
            <p className="text-sm text-[#374151] leading-relaxed">{bio}</p>
          ) : (
            <p className="text-sm text-[#9CA3AF] italic">Nenhuma bio adicionada ainda</p>
          )}
        </CardContent>
      </Card>

      {/* Bombas list (Dono de Bomba only) */}
      {safeTipo === 'dono_bomba' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package size={18} className="text-[#FF6B00]" />
              Minhas Bombas
            </CardTitle>
            <CardDescription>
              {bombas.length} bomba{bombas.length !== 1 ? 's' : ''} cadastrada{bombas.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBombas ? (
              <p className="text-sm text-[#6B7280]">Carregando bombas...</p>
            ) : bombas.length === 0 ? (
              <div className="flex items-center gap-3 text-[#9CA3AF]">
                <AlertTriangle size={18} />
                <p className="text-sm">Nenhuma bomba cadastrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bombas.map((bomba) => (
                  <div
                    key={bomba.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-[#FAFAFA]"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1A1A2E]">{bomba.nome_dono}</p>
                      <p className="text-xs text-[#6B7280]">
                        {bomba.cidade} - {bomba.estado} · Capacidade: {bomba.capacidade}L
                      </p>
                    </div>
                    {bombaStatusBadge(bomba.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Bio Dialog */}
      <Dialog open={bioDialogOpen} onOpenChange={setBioDialogOpen}>
        <div className="max-h-[85vh] overflow-y-auto p-1">
        <DialogHeader>
          <DialogTitle>Editar Bio</DialogTitle>
          <DialogDescription>
            Escreva algo sobre você para o outros usuários verem.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Label>
            <Textarea
              value={bioText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBioText(e.target.value)}
              placeholder="Ex: Especialista em desentupimento há 10 anos..."
              rows={4}
              className="bg-white"
            />
          </Label>
          <p className="text-xs text-[#9CA3AF]">{bioText.length} / 500 caracteres</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setBioDialogOpen(false)}>
            <X size={14} className="mr-1" />
            Cancelar
          </Button>
          <Button onClick={handleSaveBio} disabled={savingBio}>
            {savingBio ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
