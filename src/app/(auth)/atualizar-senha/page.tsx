'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AtualizarSenhaPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validHash, setValidHash] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a valid recovery session
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      // The recovery flow should have a session after clicking the email link
      if (!session) {
        // Not necessarily invalid - user might not have clicked the link yet
        // But without the hash in URL, they can't update
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const type = hash.get('type');
        if (type !== 'recovery') {
          setValidHash(false);
        }
      }
    }
    checkSession();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Handle the hash from URL
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const type = hashParams.get('type');

      if (type === 'recovery') {
        // Exchange the recovery hash for a session
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Senha atualizada com sucesso!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  if (!validHash) {
    return (
      <div className="relative w-full max-w-md">
        <Card className="bg-white/95 backdrop-blur border-0 shadow-2xl shadow-black/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-[#1A1A2E]">Link Inválido</CardTitle>
            <CardDescription className="text-[#6B7280]">
              O link de recuperação de senha não é válido ou expirou
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-[#4B5563] text-sm mb-4">
              Solicite um novo link de recuperação
            </p>
            <Button
              onClick={() => router.push('/esqueci-senha')}
              className="bg-[#FF6B00] hover:bg-[#E55E00] text-white"
            >
              Solicitar novo link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md">
      <Card className="bg-white/95 backdrop-blur border-0 shadow-2xl shadow-black/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-[#1A1A2E]">Nova Senha</CardTitle>
          <CardDescription className="text-[#6B7280]">
            Crie uma nova senha para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <Label htmlFor="newPassword" className="text-[#1A1A2E]">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1.5 text-[#1A1A2E]"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-[#1A1A2E]">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
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
                  <Lock size={18} className="mr-2" />
                  Atualizar Senha
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
