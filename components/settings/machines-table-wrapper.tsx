"use client";

import { useEffect, useState } from "react";
import { MachinesTable } from "./machines-table";

interface Machine {
  id: number;
  name: string;
  isActive: boolean;
}

export function MachinesTableWrapper() {
  const [machines, setMachines] = useState<Machine[] | null>(null);

  useEffect(() => {
    fetch("/api/machines")
      .then((r) => r.json())
      .then(setMachines)
      .catch(() => setMachines([]));
  }, []);

  if (machines === null) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return <MachinesTable initialMachines={machines} />;
}
