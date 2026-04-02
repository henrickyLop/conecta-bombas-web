'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Clock, Phone } from 'lucide-react';

export default function PendentePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1A1A2E] to-[#16213E] flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white/95 backdrop-blur shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
            <Clock size={40} className="text-amber-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-3">Cadastro Pendente</h1>
          <p className="text-gray-500 mb-6">
            Seu cadastro está sendo analisado pelo administrador.
            Você receberá um email quando for aprovado.
          </p>
          <div className="bg-amber-50 rounded-xl p-4 text-left">
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
  );
}
