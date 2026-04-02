'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Truck, Search } from 'lucide-react';

interface FavoritoItem {
  uid_dono: string;
  nome_dono: string;
  cidade: string;
  estado: string;
}

export default function ClienteFavoritosPage() {
  const [favoritos, setFavoritos] = useState<FavoritoItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('conecta_favoritos');
      if (stored) setFavoritos(JSON.parse(stored));
    } catch {}
  }, []);

  function removeFavorito(uid_dono: string) {
    const next = favoritos.filter(f => f.uid_dono !== uid_dono);
    setFavoritos(next);
    localStorage.setItem('conecta_favoritos', JSON.stringify(next));
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A2E]">Favoritos</h1>
        <p className="text-[#6B7280] mt-1">Donos de bombas que você salvou</p>
      </div>

      {favoritos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart size={48} className="text-[#9CA3AF] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A2E]">Nenhum favorito ainda</h3>
            <p className="text-[#6B7280] mt-1 mb-4">
              Clique no ❤️ ao lado de um dono de bomba para salvá-lo aqui
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
            <Card key={f.uid_dono} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <Heart size={18} className="text-red-500 fill-red-500" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFavorito(f.uid_dono)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    Remover
                  </Button>
                </div>
                <h3 className="font-semibold text-[#1A1A2E]">{f.nome_dono}</h3>
                <div className="flex items-center gap-2 mt-2 text-sm text-[#4B5563]">
                  <MapPin size={14} />
                  <span>{f.cidade} - {f.estado}</span>
                </div>
                <Link href={`/cliente/buscar?estado=${f.estado}&cidade=${f.cidade}`} className="block mt-4">
                  <Button className="w-full bg-[#FF6B00] hover:bg-[#E55E00] text-white">
                    <Search size={16} className="mr-2" /> Buscar Bombas deste Dono
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
