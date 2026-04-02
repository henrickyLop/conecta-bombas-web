'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { ESTADOS_BR } from '@/lib/types';

export default function CadastroPage() {
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState<'cliente' | 'dono_bomba'>('cliente');
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  // Dono bomba fields
  const [tipoBomba, setTipoBomba] = useState('');
  const [capacidadeBomba, setCapacidadeBomba] = useState('500');
  const router = useRouter();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !senha || !cidade || !estado) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar conta');

      const uid = authData.user.id;

      const { error: userError } = await supabase.from('usuarios').insert({
        id: uid,
        nome,
        cpf_cnpj: cpfCnpj,
        telefone,
        email,
        cidade,
        estado,
        tipo,
        status: 'pendente',
      });

      if (userError) throw userError;

      if (tipo === 'dono_bomba' && tipoBomba) {
        const { error: bombaError } = await supabase.from('bombas').insert({
          uid_dono: uid,
          nome_dono: nome,
          cidade,
          estado,
          tipo: tipoBomba,
          capacidade: capacidadeBomba,
          status: 'pendente',
          telefone_dono: telefone || '',
        });
        if (bombaError) throw bombaError;
      }

      toast.success('Cadastro realizado! Aguardando aprovação do administrador.');
      router.push('/pendente');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/95 backdrop-blur border-0 shadow-2xl shadow-black/20">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-[#1A1A2E]">Criar Conta</CardTitle>
        <CardDescription className="text-gray-500">
          Preencha seus dados para se cadastrar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tipo} onValueChange={(v) => setTipo(v as 'cliente' | 'dono_bomba')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="cliente" className="flex items-center gap-2">
              <User size={16} />
              Cliente
            </TabsTrigger>
            <TabsTrigger value="dono_bomba" className="flex items-center gap-2">
              <Truck size={16} />
              Dono de Bomba
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <Label htmlFor="nome" className="text-[#1A1A2E]">
                {tipo === 'cliente' ? 'Nome Completo' : 'Razão Social / Nome'}
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="mt-1.5 text-[#1A1A2E]"
              />
            </div>

            <div>
              <Label htmlFor="cpfCnpj" className="text-[#1A1A2E]">
                {tipo === 'cliente' ? 'CPF' : 'CNPJ / CPF'}
              </Label>
              <Input
                id="cpfCnpj"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                className="mt-1.5 text-[#1A1A2E]"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-[#1A1A2E]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 text-[#1A1A2E]"
              />
            </div>

            <div>
              <Label htmlFor="senha" className="text-[#1A1A2E]">
                Senha
              </Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="mt-1.5 text-[#1A1A2E]"
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="telefone" className="text-[#1A1A2E]">
                Telefone
              </Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="mt-1.5 text-[#1A1A2E]"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cidade" className="text-[#1A1A2E]">
                  Cidade
                </Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  required
                  className="mt-1.5 text-[#1A1A2E]"
                />
              </div>
              <div>
                <Label htmlFor="estado" className="text-[#1A1A2E]">
                  Estado
                </Label>
                <Select value={estado} onValueChange={(v) => v && setEstado(v)}>
                  <SelectTrigger className="mt-1.5 text-[#1A1A2E]">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tipo === 'dono_bomba' && (
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <h4 className="font-semibold text-[#1A1A2E] mb-3">Dados da Bomba</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="tipoBomba" className="text-[#1A1A2E]">
                      Tipo da Bomba
                    </Label>
                    <Input
                      id="tipoBomba"
                      value={tipoBomba}
                      onChange={(e) => setTipoBomba(e.target.value)}
                      required
                      placeholder="Ex: Estacionária, Móvel"
                      className="mt-1.5 text-[#1A1A2E]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacidadeBomba" className="text-[#1A1A2E]">
                      Capacidade (litros/hora)
                    </Label>
                    <Select value={capacidadeBomba} onValueChange={(v) => v && setCapacidadeBomba(v)}>
                      <SelectTrigger className="mt-1.5 text-[#1A1A2E]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500">500 L/h</SelectItem>
                        <SelectItem value="1000">1000 L/h</SelectItem>
                        <SelectItem value="2000">2000 L/h</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B00] hover:bg-[#E55E00] text-white font-semibold py-6 rounded-xl"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'Criar Conta'
              )}
            </Button>
          </form>
        </Tabs>

        <p className="text-center text-gray-500 text-sm mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-[#FF6B00] font-semibold hover:underline">
            Fazer login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
