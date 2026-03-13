import { prisma } from "@/lib/prisma";
import { MachinesTable } from "@/components/settings/machines-table";

export const metadata = {
  title: "Machines | SeeYou AroundTown",
};

export default async function MachinesSettingsPage() {
  const machines = await prisma.machine.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold">Machines</h1>
        <p className="text-sm text-muted-foreground">
          Manage vending machine locations. Active machines appear in the collection form.
        </p>
      </div>
      <MachinesTable initialMachines={machines} />
    </div>
  );
}
