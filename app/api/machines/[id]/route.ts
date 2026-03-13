import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  isActive: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const machineId = parseInt(id);
    if (isNaN(machineId)) {
      return NextResponse.json({ error: "Invalid machine ID" }, { status: 400 });
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const machine = await prisma.machine.update({
      where: { id: machineId },
      data: result.data,
    });

    return NextResponse.json(machine);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "A machine with that name already exists" }, { status: 409 });
    }
    console.error("PUT /api/machines/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const machineId = parseInt(id);
    if (isNaN(machineId)) {
      return NextResponse.json({ error: "Invalid machine ID" }, { status: 400 });
    }

    // Soft-delete: set isActive = false
    const machine = await prisma.machine.update({
      where: { id: machineId },
      data: { isActive: false },
    });

    return NextResponse.json(machine);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }
    console.error("DELETE /api/machines/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
