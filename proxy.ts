import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  // Usuário logado via Google mas sem telefone → completa cadastro
  // Deixa passar só a própria página e a rota de salvar
  const isCompletingProfile =
    pathname === "/register/complete" ||
    pathname.startsWith("/api/auth/complete-profile");

  if (
    session &&
    !session.user.phone &&
    !isCompletingProfile &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/webhooks")
  ) {
    return NextResponse.redirect(new URL("/register/complete", req.url));
  }

  const publicRoutes = ["/", "/login", "/register"];
  const isPublic =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/product/") ||
    isCompletingProfile;

  if (isPublic) {
    if (session && role === "COURIER" && pathname === "/") {
      return NextResponse.redirect(new URL("/courier", req.url));
    }
    if (session && role === "ADMIN" && pathname === "/") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    if (role === "COURIER")
      return NextResponse.redirect(new URL("/courier", req.url));
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/courier") && role !== "COURIER") {
    if (role === "ADMIN")
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/api/loyalty") && role !== "ADMIN") {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)",
  ],
};
