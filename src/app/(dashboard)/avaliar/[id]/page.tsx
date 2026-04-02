'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, CheckCircle, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Solicitacao } from '@/lib/types';

export default function AvaliarPage() {
  const router = useRouter();
  const params = useParams();
  const { usuario } = useAuth();
  const [servico, setServico] = useState<Solicitacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [nota, setNota] = useState(0);
  const [hoverNota, setHoverNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const id = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (!usuario || !id) return;
    loadServico();
  }, [usuario, id]);

  async function loadServico() {
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setServico(data as Solicitacao);
    } catch (e) {
      console.error(e);
      toast.error('Serviço não encontrado');
      router.push('/cliente/solicitacoes');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!nota || !usuario) {
      toast.error('Selecione uma nota');
      return;
    }
    setSubmitting(true);
    try {
      // Avaliar o dono da bomba (uid_avaliado = uid_dono_bomba)
      const { error } = await supabase.from('avaliacoes').insert({
        uid_avaliador: usuario.id,
        uid_avaliado: servico!.uid_dono_bomba,
        uid_solicitacao: servico!.id,
        nota,
        comentario: comentario || null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success('Avaliação enviada! Obrigado!');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar avaliação');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto">
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-0 shadow-sm text-center">
          <CardContent className="py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Obrigado!</h2>
            <p className="text-[#6B7280] mb-6">
              Sua avaliação para <strong>{servico?.nome_dono_bomba}</strong> foi enviada com sucesso.
            </p>
            <Link href="/cliente/solicitacoes">
              <Button className="bg-[#FF6B00] hover:bg-[#e55f00]">
                <ArrowLeft size={16} className="mr-2" /> Voltar às Solicitações
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/cliente/solicitacoes">
          <Button variant="ghost" className="text-[#6B7280] gap-2 -ml-2">
            <ArrowLeft size={18} /> Voltar
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#1A1A2E] text-xl">Avaliar Serviço</CardTitle>
          <p className="text-[#6B7280] text-sm">Como foi o serviço realizado por:</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Who is being rated */}
          <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-4">
            <div className="w-12 h-12 bg-[#FF6B00] rounded-full flex items-center justify-center shrink-0">
              <User size={24} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-[#1A1A2E]">{servico?.nome_dono_bomba}</p>
              <p className="text-xs text-[#9CA3AF]">
                {servico?.volume}m³ · {servico?.data_servico}
              </p>
            </div>
          </div>

          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-2">Sua nota *</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHoverNota(n)}
                  onMouseLeave={() => setHoverNota(0)}
                  onClick={() => setNota(n)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={(hoverNota || nota) >= n
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-gray-200 text-gray-200'
                    }
                  />
                </button>
              ))}
            </div>
            {nota > 0 && (
              <p className="text-sm text-[#6B7280] mt-2">
                {nota <= 2 ? '😕 Ruim' : nota === 3 ? '😐 Regular' : nota === 4 ? '😊 Bom' : '🤩 Excelente!'}
              </p>
            )}
          </div>

          {/* Optional comment */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-2">Comentário (opcional)</label>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Conte como foi o serviço..."
              rows={4}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || nota === 0}
            className="w-full bg-[#FF6B00] hover:bg-[#e55f00] h-12 text-base"
          >
            {submitting ? 'Enviando...' : `Enviar Avaliação ${nota > 0 ? `(${nota} ★)` : ''}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
