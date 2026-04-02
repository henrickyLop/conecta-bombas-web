'use client';

import AuthGuard from '@/components/AuthGuard';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Truck } from 'lucide-react';

export default function PendentePage() {
  return (
    <AuthGuard type="pendent-ok">
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1A1A2E] to-[#16213E] flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF6B00] rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-[#FF6B00] rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FF6B00] mb-4">
            <Truck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Conecta <span className="text-[#FF6B00]">Bombas</span>
          </h1>
        </div>
      <Card className="bg-white/95 backdrop-blur border-0 shadow-2xl shadow-black/20">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
            <Clock size={40} className="text-amber-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-3">Cadastro Pendente</h1>
          <p className="text-[#4B5563] mb-6">
            Seu cadastro está sendo analisado pelo administrador.
            Você receberá um email quando for aprovado.
          </p>
          <div className="bg-amber-50 rounded-xl p-4 text-left border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Tempo estimado:</strong> 24 a 48 horas úteis
            </p>
            <p className="text-sm text-amber-800 mt-2">
              Dúvidas? Entre em contato conosco.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
    </AuthGuard>
  );
}
