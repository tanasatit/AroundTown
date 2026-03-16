import { prisma } from "@/lib/prisma";

export async function getSetting(key: string, fallback: string): Promise<string> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  return row?.value ?? fallback;
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
