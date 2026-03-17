import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Role = "CUSTOMER" | "ADMIN" | "COURIER";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        console.log("[signIn] email:", user.email); // adiciona

        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });

        console.log("[signIn] existing:", existing); // adiciona

        if (!existing) {
          const created = await prisma.user.create({
            data: {
              name: user.name ?? "Usuário",
              email: user.email,
              image: user.image ?? null,
              role: "CUSTOMER",
            },
          });
          console.log("[signIn] criado:", created); // adiciona
        }

        return true;
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.phone) {
        token.phone = session.phone;
      }

      // Sempre resolve pelo email primeiro — garante o id correto
      // independente de ser Google ou Credentials
      const email = user?.email ?? token.email;

      if (email) {
        const dbUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true, phone: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.phone = dbUser.phone ?? null;
          token.email = email; // garante que email fica no token
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.phone = token.phone as string | null;
      }
      return session;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});
