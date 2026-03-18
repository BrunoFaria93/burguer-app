import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/components/admin/NotificationBell";
import LogoutButton from "@/components/admin/LogoutButton";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Users,
  Ticket,
  Gift,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/menu", label: "Cardapio", icon: UtensilsCrossed },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/couriers", label: "Motoqueiros", icon: Bike },
  { href: "/admin/customers", label: "Clientes", icon: Users },
  { href: "/admin/coupons", label: "Cupons", icon: Ticket },
  { href: "/admin/loyalty", label: "Fidelidade", icon: Gift },
  { href: "/admin/settings", label: "Configuracoes", icon: Settings },
];

const mobileNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/menu", label: "Cardapio", icon: UtensilsCrossed },
  { href: "/admin/couriers", label: "Motos", icon: Bike },
  { href: "/admin/settings", label: "Config", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — fixo na altura da tela */}
      <aside className="hidden md:flex md:w-64 flex-shrink-0 flex-col border-r border-border bg-card h-screen">
        {/* Topo sempre visível */}
        <div className="flex h-16 flex-shrink-0 items-center border-b border-border px-6">
          <span className="text-lg font-bold text-orange-500">Admin</span>
        </div>

        {/* Nav com scroll se necessário */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Rodapé sempre visível */}
        <div className="flex-shrink-0 border-t border-border p-4">
          <p className="px-3 py-1 text-xs text-muted-foreground truncate">
            {session.user.email}
          </p>
          <LogoutButton />
        </div>
      </aside>

      {/* Conteúdo principal com scroll */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
        {/* Header sempre visível */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
          <span className="text-base font-bold text-orange-500 md:hidden">
            Admin
          </span>
          <h1 className="hidden md:block font-semibold">
            Painel Administrativo
          </h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="md:hidden">
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Área de conteúdo com scroll */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
