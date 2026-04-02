import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { session } } = await supabase.auth.getSession();

  const path = request.nextUrl.pathname;

  // Public paths
  const publicPaths = ['/', '/login', '/cadastro'];
  if (publicPaths.includes(path)) {
    if (session && (path === '/login' || path === '/cadastro')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // No session
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check user type
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', session.user.email)
    .single();

  if (!usuario) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Pending status
  if (usuario.status === 'pendente' && path !== '/pendente') {
    return NextResponse.redirect(new URL('/pendente', request.url));
  }

  if (usuario.status !== 'pendente' && path === '/pendente') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Rejected status
  if (usuario.status === 'rejeitado') {
    return NextResponse.redirect(new URL('/cadastro', request.url));
  }

  // Route by type
  if (usuario.tipo === 'cliente' && path.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/cliente', request.url));
  }
  if (usuario.tipo === 'dono_bomba' && (path.startsWith('/admin') || path.startsWith('/cliente'))) {
    return NextResponse.redirect(new URL('/dono', request.url));
  }
  if (usuario.tipo === 'admin' && (path.startsWith('/dono') || path.startsWith('/cliente'))) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
