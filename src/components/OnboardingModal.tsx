'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Truck, Send, MapPin } from 'lucide-react';

const STORAGE_KEY = 'onboarding_done';

const steps = [
  {
    icon: <Truck size={64} className="text-[#FF6B00]" />,
    title: '🔍 Busque bombas na sua região',
    description: 'Encontre donos de bombas de concreto disponíveis perto de você. Filtre por estado e cidade para resultados mais precisos.',
  },
  {
    icon: <Send size={64} className="text-[#FF6B00]" />,
    title: '📨 Envie sua solicitação',
    description: 'Preencha os detalhes do serviço — volume, data e hora — e envie diretamente para o dono da bomba.',
  },
  {
    icon: <MapPin size={64} className="text-[#FF6B00]" />,
    title: '📍 Acompanhe pelo app',
    description: 'Acompanhe o status das suas solicitações em tempo real. Veja quando são aceitas, agendadas e finalizadas.',
  },
];

export default function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so the transition feels smooth
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  }

  function handleFinish() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  }

  function handleSkip() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setOpen(open);
  }

  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-[#1A1A2E]">
            Bem-vindo ao Conecta Bombas!
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <div className="flex justify-center mb-6">
            {steps[currentStep].icon}
          </div>

          <h2 className="text-lg font-bold text-center text-[#1A1A2E] mb-2">
            {steps[currentStep].title}
          </h2>
          <p className="text-center text-[#6B7280] text-sm leading-relaxed">
            {steps[currentStep].description}
          </p>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-[#FF6B00]' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {isLastStep ? (
            <>
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-[#6B7280]"
              >
                Pular
              </Button>
              <Button
                onClick={handleFinish}
                className="bg-[#FF6B00] hover:bg-[#E55E00] text-white flex-1"
              >
                Começar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-[#6B7280]"
              >
                Pular
              </Button>
              <Button
                onClick={handleNext}
                className="bg-[#FF6B00] hover:bg-[#E55E00] text-white flex-1"
              >
                Próximo
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
