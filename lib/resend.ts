import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function getRestaurantName(): Promise<string> {
  const { prisma } = await import("@/lib/prisma");
  const setting = await prisma.setting.findUnique({
    where: { key: "restaurantName" },
  });
  return setting?.value || "Burger App";
}

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
export const FROM_EMAIL =
  process.env.FROM_EMAIL ?? "no-reply@suahamburgueria.com";
