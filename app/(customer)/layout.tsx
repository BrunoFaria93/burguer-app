import Link from "next/link";
import { auth } from "@/lib/auth";
import { User, Package, Gift, Home } from "lucide-react";
import CartButton from "@/components/customer/CartButton";
import { prisma } from "@/lib/prisma";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const settings = await prisma.setting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const restaurantName = map.restaurantName || "Burger App";

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header — idêntico ao original, só esconde nav no mobile ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-orange-500">
            {restaurantName}
          </Link>

          {/* Nav desktop — escondido no mobile */}
          <nav className="hidden md:flex items-center gap-4">
            {session ? (
              <>
                <Link
                  href="/orders"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Package size={16} /> Pedidos
                </Link>
                <Link
                  href="/rewards"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Gift size={16} /> Recompensas
                </Link>
                <Link
                  href="/account"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <User size={16} /> Conta
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Entrar
              </Link>
            )}
            <CartButton />
          </nav>

          {/* Carrinho visível no mobile dentro do header */}
          <div className="flex md:hidden">
            <CartButton />
          </div>
        </div>
      </header>

      {/* Conteúdo — padding bottom extra no mobile pra não ficar atrás da bottom bar */}
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* ── Bottom nav — só no mobile ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1"
          >
            <Home size={20} />
            Início
          </Link>

          {session ? (
            <>
              <Link
                href="/orders"
                className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1"
              >
                <Package size={20} />
                Pedidos
              </Link>
              <Link
                href="/rewards"
                className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1"
              >
                <Gift size={20} />
                Recompensas
              </Link>
              <Link
                href="/account"
                className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1"
              >
                <User size={20} />
                Conta
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1"
            >
              <User size={20} />
              Entrar
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
