'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Login realizado!');

        // Check user type and redirect
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (usuario) {
          switch (usuario.status) {
            case 'pendente':
              router.push('/pendente');
              break;
            case 'rejeitado':
              router.push('/cadastro');
              break;
            default:
              switch (usuario.tipo) {
                case 'admin':
                  router.push('/admin');
                  break;
                case 'cliente':
                  router.push('/cliente');
                  break;
                case 'dono_bomba':
                  router.push('/dono');
                  break;
                default:
                  router.push('/');
              }
          }
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <Card className="bg-white/95 backdrop-blur border-0 shadow-2xl shadow-black/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-[#1A1A2E]">Bem-vindo de volta</CardTitle>
            <CardDescription className="text-[#6B7280]">
              Entre na sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
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
              <div>
                <Label htmlFor="password" className="text-[#1A1A2E]">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                    <LogIn size={18} className="mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
            <div className="text-center mt-4">
              <Link href="/esqueci-senha" className="text-[#FF6B00] font-semibold text-sm hover:underline">
                Esqueceu a senha? Recupere aqui
              </Link>
            </div>
            <p className="text-center text-[#6B7280] text-sm mt-4">
              Não tem conta?{' '}
              <Link href="/cadastro" className="text-[#FF6B00] font-semibold hover:underline">
                Cadastre-se
              </Link>
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
