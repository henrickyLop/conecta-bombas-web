'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  Settings,
  ClipboardList,
  Truck,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Search,
} from 'lucide-react';
import { useState } from 'react';

const menuMap: Record<string, { icon: React.ReactNode; label: string; href: string }[]> = {
  admin: [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/admin' },
    { icon: <Users size={20} />, label: 'Pendentes', href: '/admin/pendentes' },
    { icon: <Settings size={20} />, label: 'Usuários', href: '/admin/usuarios' },
    { icon: <Truck size={20} />, label: 'Bombas', href: '/admin/bombas' },
    { icon: <ClipboardList size={20} />, label: 'Ordens', href: '/admin/ordens' },
  ],
  cliente: [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/cliente' },
    { icon: <Search size={20} />, label: 'Buscar Bombas', href: '/cliente/buscar' },
    { icon: <ClipboardList size={20} />, label: 'Solicitações', href: '/cliente/solicitacoes' },
  ],
  dono: [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/dono' },
    { icon: <ClipboardList size={20} />, label: 'Histórico', href: '/dono/historico' },
  ],
};

export default function Sidebar() {
  const { usuario, signOut } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!usuario) return null;

  const menu = menuMap[usuario.tipo] || [];

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0F172A] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#FF6B00]">
          <Truck size={20} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">
            Conecta <span className="text-[#FF6B00]">Bombas</span>
          </span>
        )}
      </div>

      {/* Menu */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {menu.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
                ${active
                  ? 'bg-[#FF6B00]/20 text-[#FF6B00] font-semibold'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white w-full transition-all"
        >
          <LogOut size={20} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen z-30 border-r border-white/5 transition-all duration-300
          ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-[#0F172A] border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#FF6B00] transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform ${collapsed ? '-rotate-90' : 'rotate-90'}`} />
        </button>
      </aside>

      {/* Mobile menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B00] flex items-center justify-center">
            <Truck size={18} className="text-white" />
          </div>
          <span className="font-bold">
            Conecta <span className="text-[#FF6B00]">Bombas</span>
          </span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 pt-14">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
