'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Truck, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FavoritoBomba {
  id: string;
  uid_bomba: string;
  nome_dono: string;
  cidade: string;
  estado: string;
  tipo: string;
  capacidade: string;
  telefone_dono: string;
  uid_dono: string;
}

export default function ClienteFavoritosPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [favoritos, setFavoritos] = useState<FavoritoBomba[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavoritos = useCallback(async () => {
    if (!usuario) return;
    setLoading(true);
    try {
      // Buscar IDs das bombas favoritas do usuário
      const { data: favData, error: favError } = await supabase
        .from('favoritos')
        .select('id, uid_bomba')
        .eq('uid_cliente', usuario.id);
      if (favError) throw favError;

      if (!favData || favData.length === 0) {
        setFavoritos([]);
        setLoading(false);
        return;
      }

      const bombaIds = favData.map(f => f.uid_bomba);

      // Buscar detalhes das bombas
      const { data: bombas, error: bombasError } = await supabase
        .from('bombas')
        .select('*')
        .in('id', bombaIds);
      if (bombasError) throw bombasError;

      // Montar lista com infos do favorito
      const lista: FavoritoBomba[] = (bombas || []).map(b => ({
        id: favData.find(f => f.uid_bomba === b.id)?.id || '',
        uid_bomba: b.id,
        nome_dono: b.nome_dono,
        cidade: b.cidade,
        estado: b.estado,
        tipo: b.tipo,
        capacidade: b.capacidade,
        telefone_dono: b.telefone_dono || '',
        uid_dono: b.uid_dono,
      }));

      setFavoritos(lista);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar favoritos');
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  useEffect(() => {
    loadFavoritos();
  }, [loadFavoritos]);

  async function removeFavorito(fav: FavoritoBomba) {
    try {
      const { error } = await supabase
        .from('favoritos')
        .delete()
        .eq('uid_cliente', usuario!.id)
        .eq('uid_bomba', fav.uid_bomba);
      if (error) throw error;
      setFavoritos(prev => prev.filter(f => f.uid_bomba !== fav.uid_bomba));
      toast.info(`${fav.nome_dono} removido dos favoritos`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao remover favorito');
    }
  }

  if (!usuario) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A2E]">Favoritos</h1>
        <p className="text-[#6B7280] mt-1">Bombas que você salvou</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="animate-spin text-[#FF6B00] mx-auto" size={32} />
          <p className="text-[#6B7280] mt-3">Carregando favoritos...</p>
        </div>
      ) : favoritos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart size={48} className="text-[#9CA3AF] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A2E]">Nenhum favorito ainda</h3>
            <p className="text-[#6B7280] mt-1 mb-4">
              Clique no ❤️ ao lado de uma bomba para salvá-la aqui
            </p>
            <Link href="/cliente/buscar">
              <Button className="bg-[#FF6B00] hover:bg-[#E55E00] text-white">
                <Search size={16} className="mr-2" /> Buscar Bombas
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoritos.map(f => (
            <Card key={f.uid_bomba} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
                    <Truck size={18} className="text-[#FF6B00]" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFavorito(f)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    Remover
                  </Button>
                </div>
                <h3 className="font-semibold text-[#1A1A2E]">{f.nome_dono}</h3>
                <div className="space-y-2 mt-2 text-sm text-[#4B5563]">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    <span>{f.cidade} - {f.estado}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck size={14} />
                    <span>{f.tipo} · {f.capacidade} L/h</span>
                  </div>
                </div>
                <Link href="/cliente/buscar" className="block mt-4">
                  <Button className="w-full bg-[#FF6B00] hover:bg-[#E55E00] text-white"
                    onClick={() => router.push('/cliente/buscar')}>
                    <Search size={16} className="mr-2" /> Buscar Bombas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
