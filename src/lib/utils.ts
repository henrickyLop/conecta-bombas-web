import { format } from 'date-fns';

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

export function formatarData(data: string): string {
  try {
    return format(new Date(data), 'dd/MM/yyyy');
  } catch {
    return data;
  }
}

export function formatarDateTime(data: string): string {
  try {
    return format(new Date(data), 'dd/MM/yyyy HH:mm');
  } catch {
    return data;
  }
}

export function getInitials(nome: string): string {
  return nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function whatsappLink(telefone: string, mensagem?: string): string {
  const num = telefone.replace(/\D/g, '');
  const full = num.startsWith('55') ? num : `55${num}`;
  const msg = mensagem ? encodeURIComponent(mensagem) : '';
  return `https://wa.me/${full}${msg ? '?text=' + msg : ''}`;
}

export function cn(...classes: (string | false | undefined | null | ((state?: any) => string | undefined))[]) {
  return classes
    .filter(Boolean)
    .map(c => typeof c === 'function' ? c() : c)
    .filter(Boolean)
    .join(' ');
}
