import { prisma } from "@/lib/prisma";
import SettingsManager from "@/components/admin/SettingsManager";

export default async function SettingsPage() {
  const settings = await prisma.setting.findMany();

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <SettingsManager settings={map} />
    </div>
  );
}
