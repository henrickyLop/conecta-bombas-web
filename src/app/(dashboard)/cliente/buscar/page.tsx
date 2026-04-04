'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Truck, MapPin, Settings, Search, CheckCircle, Heart } from 'lucide-react';
import type { Bomba } from '@/lib/types';
import { getCityCoords, averageCenter } from '@/lib/city-coords';
import { ESTADOS_BR } from '@/lib/types';
import { CIDADES_BRASIL, getCidadesPorEstado } from '@/lib/cidades-brasil';
import dynamic from 'next/dynamic';

// Types
type BombaComAvaliacao = Bomba & { avaliacao_media?: number; total_avaliacoes?: number };

// Dynamic imports for Leaflet (SSR is not compatible with leaflet)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

// Min date (today) for date inputs
const today = new Date().toISOString().split('T')[0];

export default function ClienteBuscarPage() {
  const { usuario } = useAuth();

  // Fix Leaflet default icons on client only (moved from top-level to avoid SSR crash)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      import('leaflet/dist/leaflet.css');
    });
  }, []);

  const [bombas, setBombas] = useState<BombaComAvaliacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedBomba, setSelectedBomba] = useState<BombaComAvaliacao | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Search - estado primeiro
  const [estado, setEstado] = useState('');
  const [cidade, setCidade] = useState('');
  // Request
  const [volume, setVolume] = useState('');
  const [dataServico, setDataServico] = useState('');
  const [horaServico, setHoraServico] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Endereço da obra (obrigatório)
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidadeObra, setCidadeObra] = useState(usuario?.cidade ?? '');
  const [estadoObra, setEstadoObra] = useState(usuario?.estado ?? '');
  const [obsObra, setObsObra] = useState('');
  // Favorites - from database
  const [favoritos, setFavoritos] = useState<string[]>([]);

  // Cidades do estado selecionado (busca)
  const cidadesDoEstado = useMemo(() => {
    return getCidadesPorEstado(estado);
  }, [estado]);

  // Cidades do estado da obra
  const cidadesDoEstadoObra = useMemo(() => {
    return getCidadesPorEstado(estadoObra);
  }, [estadoObra]);

  // Carregar favoritos do banco ao montar
  useEffect(() => {
    const uid = usuario?.id;
    if (!uid) return;
    async function loadFavoritos() {
      try {
        const { data, error } = await supabase
          .from('favoritos')
          .select('uid_bomba')
          .eq('uid_cliente', uid);
        if (error) throw error;
        setFavoritos((data || []).map((f: any) => f.uid_bomba));
      } catch (e) {
        console.error('Erro ao carregar favoritos:', e);
      }
    }
    loadFavoritos();
  }, [usuario]);

  // Quando seleciona estado novo, limpa cidade
  function handleEstadoChange(uf: string) {
    setEstado(uf);
    setCidade('');
  }

  async function buscarBombas() {
    if (!estado) {
      toast.error('Selecione ao menos o estado');
      return;
    }
    setLoading(true);
    setSearched(false);
    try {
      let query = supabase.from('bombas').select('*').eq('status', 'aprovado');
      // Estado filtra primeiro
      query = query.eq('estado', estado);
      // Cidade filtra (cidade base OU cidades_atendidas)
      if (cidade) {
        // Busca por cidade base OU array cidades_atendidas
        const { data, error } = await query;
        if (error) throw error;
        // Filtrar por cidade OU cidades_atendidas
        const allBombas = data as Bomba[] || [];
        const bombasFiltradas = allBombas.filter(b =>
          b.cidade === cidade ||
          (Array.isArray(b.cidades_atendidas) &&
            b.cidades_atendidas.some((ca: string) => {
              const formattedCity = typeof ca === 'string' ? ca.trim() : '';
              return formattedCity === cidade || formattedCity === `${cidade}/${estado}`;
            }))
        );
        await fetchAvaliacoes(bombasFiltradas);
      } else {
        const { data, error } = await query.order('criado_em', { ascending: false });
        if (error) throw error;
        await fetchAvaliacoes((data as Bomba[]) || []);
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao buscar bombas');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAvaliacoes(dataBombas: Bomba[]) {
    const donosUids = [...new Set(dataBombas.map(b => b.uid_dono))];
    let ratingsMap: Record<string, { avg: number; total: number }> = {};
    if (donosUids.length > 0) {
      const { data: ratings } = await supabase
        .from('avaliacoes')
        .select('uid_avaliado, nota')
        .in('uid_avaliado', donosUids);
      const grouped: Record<string, number[]> = {};
      (ratings || []).forEach((r: any) => {
        if (!grouped[r.uid_avaliado]) grouped[r.uid_avaliado] = [];
        grouped[r.uid_avaliado].push(r.nota);
      });
      for (const uid of donosUids) {
        const notas = grouped[uid] || [];
        ratingsMap[uid] = {
          avg: notas.length > 0 ? parseFloat((notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1)) : 0,
          total: notas.length,
        };
      }
    }
    const bombasComAvaliacao: BombaComAvaliacao[] = dataBombas.map(b => ({
      ...b,
      avaliacao_media: ratingsMap[b.uid_dono]?.avg,
      total_avaliacoes: ratingsMap[b.uid_dono]?.total,
    }));
    setBombas(bombasComAvaliacao);
    setSearched(true);
  }

  function openSolicitacao(bomba: BombaComAvaliacao) {
    const uid = usuario?.id;
    if (!uid) return;
    if (bomba.uid_dono === uid) {
      toast.error('Você não pode solicitar para sua própria bomba');
      return;
    }
    setSelectedBomba(bomba);
    setDialogOpen(true);
    // Reset form
    setVolume('');
    setDataServico('');
    setHoraServico('');
    setObservacoes('');
    setRua('');
    setNumero('');
    setBairro('');
    setCidadeObra(usuario?.cidade ?? '');
    setEstadoObra(usuario?.estado ?? '');
    setObsObra('');
  }

  async function toggleFavorito(bomba: BombaComAvaliacao) {
    const uid = usuario?.id;
    if (!uid) return;
    const exists = favoritos.includes(bomba.id);
    try {
      if (exists) {
        const { error } = await supabase
          .from('favoritos')
          .delete()
          .eq('uid_cliente', uid)
          .eq('uid_bomba', bomba.id);
        if (error) throw error;
        setFavoritos(prev => prev.filter(id => id !== bomba.id));
        toast.info(`${bomba.nome_dono} removido dos favoritos`);
      } else {
        const { error } = await supabase
          .from('favoritos')
          .insert({
            uid_cliente: uid,
            uid_bomba: bomba.id,
          });
        if (error) throw error;
        setFavoritos(prev => [...prev, bomba.id]);
        toast.success(`${bomba.nome_dono} adicionado aos favoritos ❤️`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar favoritos');
    }
  }

  function isFavorito(uid_bomba: string) {
    return favoritos.includes(uid_bomba);
  }

  // Render estrelas baseado na nota
  function renderEstrelas(nota: number) {
    const filled = Math.round(nota);
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={i < filled ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return stars;
  }

  async function enviarSolicitacao() {
    if (!selectedBomba || !usuario || !volume || !dataServico || !horaServico) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    // Validação do endereço da obra
    if (!rua || !numero || !bairro || !cidadeObra || !estadoObra) {
      toast.error('Preencha todos os campos do endereço da obra');
      return;
    }

    setSubmitting(true);
    const enderecoCompleto = `${rua}, ${numero} - ${bairro}`;
    try {
      const { error } = await supabase.from('solicitacoes').insert({
        uid_cliente: uid,
        nome_cliente: usuario?.nome ?? '',
        telefone_cliente: usuario?.telefone || '',
        uid_dono_bomba: selectedBomba.uid_dono,
        nome_dono_bomba: selectedBomba.nome_dono,
        uid_bomba: selectedBomba.id,
        telefone_dono: selectedBomba.telefone_dono || '',
        capacidade: selectedBomba.capacidade,
        volume: parseFloat(volume),
        data_servico: dataServico,
        hora_servico: horaServico,
        observacoes,
        endereco_obra: enderecoCompleto,
        cidade_obra: cidadeObra,
        estado_obra: estadoObra,
        obs_obra: obsObra || '',
        status: 'aguardando_confirmacao',
      });
      if (error) throw error;
      toast.success('Solicitação enviada! Aguarde a confirmação bilateral.');
      setDialogOpen(false);
      setSelectedBomba(null);
      setVolume('');
      setDataServico('');
      setHoraServico('');
      setObservacoes('');
      setRua('');
      setNumero('');
      setBairro('');
      setObsObra('');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar solicitação');
    } finally {
      setSubmitting(false);
    }
  }

  // Compute map center from results
  const mapCoords = bombas
    .map(b => getCityCoords(b.cidade, b.estado))
    .filter((c): c is { lat: number; lng: number } => c != null);
  const mapCenter: [number, number] = averageCenter(mapCoords) ?? [-22.90, -47.05 ]; // default: Campinas

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A2E]">Buscar Bombas</h1>
        <p className="text-[#6B7280] mt-1">Encontre bombas disponíveis na sua região</p>
      </div>

      {/* Search - estado primeiro */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-[#1A1A2E]">Filtro de Busca</CardTitle>
          <CardDescription>Selecione o estado e a cidade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            {/* Estado primeiro */}
            <div className="w-full sm:w-28">
              <Label htmlFor="estado" className="text-[#1A1A2E]">Estado</Label>
              <select
                id="estado"
                value={estado}
                onChange={(e) => handleEstadoChange(e.target.value)}
                className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-[#1A1A2E] text-sm"
              >
                <option value="" disabled hidden>UF</option>
                {ESTADOS_BR.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>

            {/* Cidade - autocomplete com datalist */}
            <div className="flex-1 w-full">
              <Label htmlFor="cidade" className="text-[#1A1A2E]">Cidade</Label>
              {estado && cidadesDoEstado.length > 0 ? (
                <Input
                  id="cidade"
                  list={`cidades-${estado}`}
                  value={cidade}
                  onChange={e => setCidade(e.target.value)}
                  placeholder="Digite para buscar..."
                  className="mt-1.5 text-[#1A1A2E]"
                />
              ) : (
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={e => setCidade(e.target.value)}
                  placeholder={estado ? 'Digite a cidade' : 'Selecione o estado primeiro'}
                  disabled={!estado}
                  className="mt-1.5 text-[#1A1A2E]"
                />
              )}
              {/* Datalist com cidades do estado */}
              {estado && cidadesDoEstado.length > 0 && (
                <datalist id={`cidades-${estado}`}>
                  {cidadesDoEstado.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              )}
            </div>

            <Button
              onClick={buscarBombas}
              disabled={loading}
              className="bg-[#FF6B00] hover:bg-[#E55E00] text-white min-w-[120px]"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><Search size={16} className="mr-2" /> Buscar</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading && (
        <div className="text-center py-12">
          <Loader2 className="animate-spin text-[#FF6B00] mx-auto" size={32} />
          <p className="text-[#6B7280] mt-3">Buscando bombas...</p>
        </div>
      )}

      {!loading && searched && bombas.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Truck size={48} className="text-[#9CA3AF] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A2E]">Nenhuma bomba encontrada</h3>
            <p className="text-[#6B7280] mt-1">Tente outra cidade ou estado</p>
          </CardContent>
        </Card>
      )}

      {!loading && searched && bombas.length > 0 && (
        <>
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {bombas.map(b => (
              <Card key={b.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
                      <Truck size={18} className="text-[#FF6B00]" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700">Disponível</Badge>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorito(b); }}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title={isFavorito(b.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        {isFavorito(b.id) ? (
                          <Heart size={20} className="text-red-500 fill-red-500" />
                        ) : (
                          <Heart size={20} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-[#1A1A2E]">{b.nome_dono}</h3>
                  
                  {/* Avaliação */}
                  {b.avaliacao_media && b.avaliacao_media > 0 ? (
                    <div className="flex items-center gap-1 mt-2 text-sm">
                      <span className="flex">{renderEstrelas(b.avaliacao_media)}</span>
                      <span className="font-semibold text-yellow-500">{b.avaliacao_media}</span>
                      <span className="text-[#6B7280]">({b.total_avaliacoes} avaliação{b.total_avaliacoes !== 1 ? 'ões' : ''})</span>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-[#9CA3AF]">Sem avaliações</div>
                  )}
                  
                  <div className="space-y-2 mt-3 text-sm text-[#4B5563]">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{b.cidade} - {b.estado}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings size={14} />
                      <span>{b.tipo} · {b.capacidade} L/h</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => openSolicitacao(b)}
                    className="w-full mt-4 bg-[#FF6B00] hover:bg-[#E55E00] text-white"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Solicitar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#1A1A2E] flex items-center gap-2">
                <MapPin size={20} className="text-[#FF6B00]" />
                Bombas no Mapa
              </CardTitle>
              <CardDescription>{bombas.length} bomba{bombas.length !== 1 ? 's' : ''} encontrada{bombas.length !== 1 ? 's' : ''}</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl overflow-hidden border border-gray-200"
                style={{ height: 'min(350px, 50vh)' }}
              >
                <MapContainer
                  center={mapCenter}
                  zoom={8}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%' }}
                  whenReady={() => {
                    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
                  }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {bombas.map(b => {
                    const coords = getCityCoords(b.cidade, b.estado);
                    if (!coords) return null;
                    return (
                      <Marker key={b.id} position={[coords.lat, coords.lng]}>
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold text-[#FF6B00]">{b.nome_dono}</p>
                            <p className="text-[#4B5563]">{b.cidade} - {b.estado}</p>
                            <p><span className="font-medium">Tipo:</span> {b.tipo}</p>
                            <p><span className="font-medium">Capacidade:</span> {b.capacidade} L/h</p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!searched && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search size={48} className="text-[#9CA3AF] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A2E]">Busque por bombas</h3>
            <p className="text-[#6B7280] mt-1">Selecione o estado e a cidade</p>
          </CardContent>
        </Card>
      )}

      {/* Solicitation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A2E]">
              Solicitar Bomba — {selectedBomba?.nome_dono}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes do serviço
            </DialogDescription>
          </DialogHeader>
          {selectedBomba && (
            <div className="space-y-4">
              <div className="bg-orange-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-[#1A1A2E]">{selectedBomba.tipo}</p>
                <p className="text-[#4B5563]">Capacidade: {selectedBomba.capacidade} L/h</p>
              </div>

              <div>
                <Label htmlFor="volume" className="text-[#1A1A2E]">Volume de Concreto (m³)</Label>
                <Input
                  id="volume"
                  type="number"
                  step="0.1"
                  value={volume}
                  onChange={e => setVolume(e.target.value)}
                  placeholder="Ex: 12"
                  className="mt-1 text-[#1A1A2E]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="data" className="text-[#1A1A2E]">Data do Serviço</Label>
                  <Input
                    id="data"
                    type="date"
                    value={dataServico}
                    onChange={e => setDataServico(e.target.value)}
                    min={today}
                    className="mt-1 text-[#1A1A2E]"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hora" className="text-[#1A1A2E]">Hora do Serviço</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={horaServico}
                    onChange={e => setHoraServico(e.target.value)}
                    className="mt-1 text-[#1A1A2E]"
                    required
                  />
                </div>
              </div>

              {/* Endereço da obra - SEÇÃO OBRIGATÓRIA */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <MapPin size={16} className="text-[#FF6B00]" /> Endereço da Obra
                </h4>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="col-span-2">
                    <Label htmlFor="rua" className="text-[#1A1A2E]">Rua *</Label>
                    <Input
                      id="rua"
                      value={rua}
                      onChange={e => setRua(e.target.value)}
                      placeholder="Nome da rua"
                      className="mt-1 text-[#1A1A2E]"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="numero" className="text-[#1A1A2E]">Número *</Label>
                    <Input
                      id="numero"
                      value={numero}
                      onChange={e => setNumero(e.target.value)}
                      placeholder="Nº"
                      className="mt-1 text-[#1A1A2E]"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bairro" className="text-[#1A1A2E]">Bairro *</Label>
                    <Input
                      id="bairro"
                      value={bairro}
                      onChange={e => setBairro(e.target.value)}
                      placeholder="Bairro"
                      className="mt-1 text-[#1A1A2E]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label htmlFor="estado-obra" className="text-[#1A1A2E]">Estado *</Label>
                    <select
                      id="estado-obra"
                      value={estadoObra}
                      onChange={(e) => { setEstadoObra(e.target.value); setCidadeObra(''); }}
                      className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-[#1A1A2E] text-sm"
                      required
                    >
                      <option value="" disabled>UF</option>
                      {ESTADOS_BR.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="cidade-obra" className="text-[#1A1A2E]">Cidade *</Label>
                    {estadoObra && cidadesDoEstadoObra.length > 0 ? (
                      <Input
                        id="cidade-obra"
                        list={`cidades-obra-${estadoObra}`}
                        value={cidadeObra}
                        onChange={e => setCidadeObra(e.target.value)}
                        placeholder="Digite a cidade"
                        className="mt-1 text-[#1A1A2E]"
                        required
                      />
                    ) : (
                      <Input
                        id="cidade-obra"
                        value={cidadeObra}
                        onChange={e => setCidadeObra(e.target.value)}
                        placeholder="Selecione o estado"
                        disabled={!estadoObra}
                        className="mt-1 text-[#1A1A2E]"
                        required
                      />
                    )}
                    {estadoObra && cidadesDoEstadoObra.length > 0 && (
                      <datalist id={`cidades-obra-${estadoObra}`}>
                        {cidadesDoEstadoObra.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="obs-obra" className="text-[#1A1A2E]">Observações da Obra (opcional)</Label>
                  <Textarea
                    id="obs-obra"
                    value={obsObra}
                    onChange={e => setObsObra(e.target.value)}
                    placeholder="Detalhes do acesso, referências, etc."
                    className="mt-1 text-[#1A1A2E]"
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="obs" className="text-[#1A1A2E]">Observações Gerais (opcional)</Label>
                <Textarea
                  id="obs"
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais sobre o serviço"
                  className="mt-1 text-[#1A1A2E]"
                  rows={2}
                />
              </div>

              <Button
                onClick={enviarSolicitacao}
                disabled={submitting}
                className="w-full bg-[#FF6B00] hover:bg-[#E55E00] text-white"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Enviar Solicitação'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
