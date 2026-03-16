import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upsertSetting } from "@/lib/settings";

export async function GET() {
  const rows = await prisma.appSetting.findMany();
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return NextResponse.json(map);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { key, value } = body as { key: string; value: string };

  if (!key || value === undefined) {
    return NextResponse.json({ error: "key and value are required" }, { status: 400 });
  }

  await upsertSetting(key, String(value));
  return NextResponse.json({ ok: true });
}
