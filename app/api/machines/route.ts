import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const machineSchema = z.object({
  name: z.string().min(3).max(200),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    const machines = await prisma.machine.findMany({
      where: all ? undefined : { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(machines);
  } catch (error) {
    console.error("GET /api/machines error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = machineSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const machine = await prisma.machine.create({ data: result.data });
    return NextResponse.json(machine, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "A machine with that name already exists" }, { status: 409 });
    }
    console.error("POST /api/machines error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
