import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/lib/cart-context";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.setting.findMany();
  const map = Object.fromEntries(
    settings.map((s: { key: string; value: string }) => [s.key, s.value]),
  );
  const name = map.restaurantName || "Burger App";

  return {
    title: name,
    description: `Peca agora no ${name}`,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <SessionProvider>
          <CartProvider>{children}</CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
