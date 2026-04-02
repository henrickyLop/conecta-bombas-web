'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Loader2 } from 'lucide-react';

type GuardType = 'auth' | 'client' | 'dono' | 'admin' | 'pendent-ok';

export default function AuthGuard({ 
  children, 
  type = 'auth' 
}: { 
  children: React.ReactNode; 
  type?: GuardType;
}) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Not logged in → go to login
        router.push('/login');
        return;
      }

      // Logged in, check user details
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (!usuario) {
        router.push('/login');
        return;
      }

      if (cancelled) return;

      // Handle pending status
      if (usuario.status === 'pendente') {
        if (pathname !== '/pendente') {
          router.push('/pendente');
          return;
        }
        // On pending page — show if pendent-ok or type is auth
        setChecking(false);
        return;
      }

      if (usuario.status === 'rejeitado') {
        router.push('/cadastro');
        return;
      }

      // Status approved — redirect based on type
      if (type === 'pendent-ok') {
        // User was pending but is now approved — redirect away
        router.push('/');
        return;
      }

      switch (usuario.tipo) {
        case 'admin':
          if (type === 'admin' || type === 'auth') {
            setChecking(false);
          } else {
            router.push('/admin');
          }
          break;
        case 'cliente':
          if (type === 'client' || type === 'auth') {
            setChecking(false);
          } else {
            router.push('/cliente');
          }
          break;
        case 'dono_bomba':
          if (type === 'dono' || type === 'auth') {
            setChecking(false);
          } else {
            router.push('/dono');
          }
          break;
        default:
          setChecking(false);
      }
    }

    check();

    return () => { cancelled = true; };
  }, [router, pathname, type]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="animate-spin text-[#FF6B00]" size={40} />
      </div>
    );
  }

  return <>{children}</>;
}
