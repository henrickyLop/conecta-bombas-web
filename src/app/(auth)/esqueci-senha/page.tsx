'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://conecta-bombas-web.vercel.app/atualizar-senha',
      });

      if (error) throw error;

      setSent(true);
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar email de recuperação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <Card className="bg-white/95 backdrop-blur border-0 shadow-2xl shadow-black/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-[#1A1A2E]">Recuperar Senha</CardTitle>
          <CardDescription className="text-[#6B7280]">
            {sent
              ? 'Verifique seu email para redefinir sua senha'
              : 'Informe seu email para receber o link de recuperação'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <KeyRound size={48} className="text-green-500 mx-auto" />
              <p className="text-[#4B5563] text-sm">
                Enviamos um link de recuperação para <strong className="text-[#1A1A2E]">{email}</strong>.
                Clique no link para criar uma nova senha.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-[#1A1A2E]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5 text-[#1A1A2E]"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF6B00] hover:bg-[#E55E00] text-white font-semibold py-6 rounded-xl"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <KeyRound size={18} className="mr-2" />
                    Enviar recuperação
                  </>
                )}
              </Button>
            </form>
          )}
          <div className="text-center mt-6">
            <Link href="/login" className="text-[#FF6B00] font-semibold text-sm hover:underline inline-flex items-center gap-1">
              <ArrowLeft size={16} /> Voltar ao login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
