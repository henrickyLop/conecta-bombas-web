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
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        // .maybeSingle() instead of .single() — returns null instead of error
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', session.user.email)
          .maybeSingle();

        if (!usuario) {
          router.push('/login');
          return;
        }

        if (cancelled) return;

        const status = usuario.status ?? 'pendente';
        const tipo = usuario.tipo ?? 'cliente';

        // Handle pending status
        if (status === 'pendente') {
          if (pathname !== '/pendente') {
            router.push('/pendente');
            return;
          }
          setChecking(false);
          return;
        }

        if (status === 'rejeitado') {
          router.push('/cadastro');
          return;
        }

        // Status approved — redirect based on type
        if (type === 'pendent-ok') {
          router.push('/');
          return;
        }

        switch (tipo) {
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
      } catch (e) {
        console.error('AuthGuard check error:', e);
        if (!cancelled) {
          router.push('/login');
        }
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
