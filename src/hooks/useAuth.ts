'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';
import { Usuario } from '@/lib/types';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      setUser(session?.user ?? null);

      if (session?.user) {
        // Don't set loading=false here — wait for fetchUsuario
        await fetchUsuario(session.user.email ?? '');
      } else {
        setUsuario(null);
      }
      if (!cancelled) setLoading(false);
    }
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);

      if (!session?.user) {
        setUsuario(null);
        setLoading(false);
      } else {
        await fetchUsuario(session.user.email ?? '');
        if (!cancelled) setLoading(false);
      }
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const fetchUsuario = async (email: string) => {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();
    // Return the promise so callers can await if needed
    setUsuario(data as Usuario | null);
    return data as Usuario | null;
  };

  const refreshUsuario = async () => {
    if (user) {
      return fetchUsuario(user.email ?? '');
    }
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsuario(null);
    router.push('/login');
  };

  return { user, usuario, loading, refreshUsuario, signOut };
}
