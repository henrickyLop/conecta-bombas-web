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
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    }
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (!session?.user) {
        setUsuario(null);
      } else {
        fetchUsuario(session.user.email ?? '');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUsuario = async (email: string) => {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();
    setUsuario(data as Usuario | null);
  };

  const refreshUsuario = async () => {
    if (user) {
      fetchUsuario(user.email ?? '');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsuario(null);
    router.push('/login');
  };

  return { user, usuario, loading, refreshUsuario, signOut };
}
