'use client';

import { useState, useMemo } from 'react';
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

import { Loader2, User, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { ESTADOS_BR } from '@/lib/types';
import { CIDADES_BRASIL, getCidadesPorEstado } from '@/lib/cidades-brasil';

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

  const cidadesDoEstado = useMemo(() => {
    return getCidadesPorEstado(estado);
  }, [estado]);

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
        {/* Simple toggle instead of Tabs (Tabs broken on mobile) */}
        <div className="flex w-full mb-6 bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setTipo('cliente')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tipo === 'cliente'
                ? 'bg-white text-[#1A1A2E] shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <User size={16} />
            Cliente
          </button>
          <button
            type="button"
            onClick={() => setTipo('dono_bomba')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tipo === 'dono_bomba'
                ? 'bg-white text-[#1A1A2E] shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <Truck size={16} />
            Dono de Bomba
          </button>
        </div>

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

            {/* Estado e Cidade lado a lado */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="estado" className="text-[#1A1A2E]">Estado</Label>
                <select
                  id="estado"
                  value={estado}
                  onChange={(e) => { setEstado(e.target.value); setCidade(''); }}
                  className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-[#1A1A2E] text-sm"
                  required
                >
                  <option value="" disabled hidden>UF</option>
                  {ESTADOS_BR.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="cidade" className="text-[#1A1A2E]">
                  Cidade
                </Label>
                {estado && cidadesDoEstado.length > 0 ? (
                  <select
                    id="cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-[#1A1A2E] text-sm"
                    required
                  >
                    <option value="" disabled hidden>Escolha a cidade</option>
                    {cidadesDoEstado.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    required
                    placeholder={estado ? 'Digite a cidade' : 'Selecione o estado primeiro'}
                    disabled={!estado}
                    className="mt-1.5 text-[#1A1A2E]"
                  />
                )}
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
                      Capacidade da Bomba
                    </Label>
                    <select
                      id="capacidadeBomba"
                      value={capacidadeBomba}
                      onChange={(e) => setCapacidadeBomba(e.target.value)}
                      className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-[#1A1A2E] text-sm"
                      required
                    >
                      {['500', '1000', '2000'].map((cap) => (
                        <option key={cap} value={cap}>{cap}</option>
                      ))}
                    </select>
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
