'use client';

import Link from 'next/link';
import { Truck, Shield, Clock, MapPin, Users, Phone } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Navbar */}
      <nav className="bg-[#0F172A] text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B00] flex items-center justify-center">
              <Truck size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold">
              Conecta <span className="text-[#FF6B00]">Bombas</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl text-white border border-white/20 hover:bg-white/10 transition-colors font-medium"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="px-5 py-2.5 rounded-xl bg-[#FF6B00] text-white hover:bg-[#E55E00] transition-colors font-semibold"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1A1A2E] to-[#16213E] text-white py-24 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF6B00] rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-[#FF6B00] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-full px-4 py-1.5 text-sm text-[#FF6B00] mb-6">
            <Truck size={16} />
            <span>Marketplace de Bombeamento de Concreto</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Conectamos você à <span className="text-[#FF6B00]">bomba ideal</span> para sua obra
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Solicite bombeamento de concreto usinado de forma rápida e segura.
            Encontre donos de bombas na sua região em segundos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/cadastro"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#FF6B00] text-white hover:bg-[#E55E00] transition-colors font-bold text-lg shadow-lg shadow-[#FF6B00]/25"
            >
              Começar Agora
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-colors font-medium text-lg"
            >
              Já Tenho Conta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A1A2E] text-center mb-4">
            Por que usar o Conecta Bombas?
          </h2>
          <p className="text-lg text-gray-500 text-center mb-14 max-w-2xl mx-auto">
            Simplificamos o processo de contratação de bombeamento de concreto
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <MapPin size={28} />,
                title: 'Encontre por Região',
                desc: 'Busque bombas disponíveis na sua cidade e estado',
              },
              {
                icon: <Clock size={28} />,
                title: 'Rápido e Prático',
                desc: 'Solicite em minutos e acompanhe o status em tempo real',
              },
              {
                icon: <Shield size={28} />,
                title: 'Seguro e Confiável',
                desc: 'Todos os cadastros são verificados e aprovados pelo admin',
              },
              {
                icon: <Phone size={28} />,
                title: 'Comunicação Direta',
                desc: 'Contato via WhatsApp direto com o dono da bomba',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00] mb-4">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A2E] mb-2">{f.title}</h3>
                <p className="text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A1A2E] text-center mb-14">
            Como Funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Cadastre-se', desc: 'Crie sua conta como cliente ou dono de bomba' },
              { step: '02', title: 'Conecte-se', desc: 'Clientes buscam bombas e fazem solicitações' },
              { step: '03', title: 'Realize', desc: 'Donos aceitam, ordens são geradas, serviço é feito' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-bold text-[#FF6B00]/20 mb-3">{s.step}</div>
                <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">{s.title}</h3>
                <p className="text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-[#0F172A] to-[#1A1A2E] rounded-3xl p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B00]/10 rounded-full blur-3xl" />
            <div className="relative">
              <Users size={40} className="text-[#FF6B00] mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Junte-se ao Conecta Bombas</h2>
              <p className="text-slate-300 mb-8 text-lg">
                {`Seja cliente ou dono de bomba, temos o lugar certo pra você.`}
              </p>
              <Link
                href="/cadastro"
                className="inline-block px-8 py-4 rounded-xl bg-[#FF6B00] text-white hover:bg-[#E55E00] transition-colors font-bold text-lg shadow-lg shadow-[#FF6B00]/25"
              >
                Criar Conta Gratuita
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-slate-400 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B00] flex items-center justify-center">
              <Truck size={16} className="text-white" />
            </div>
            <span className="text-white font-bold">Conecta Bombas</span>
          </div>
          <p className="text-sm">
            © 2026 Conecta Bombas. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
