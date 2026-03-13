"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Check, X, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Machine {
  id: number;
  name: string;
  isActive: boolean;
}

interface MachinesTableProps {
  initialMachines: Machine[];
}

export function MachinesTable({ initialMachines }: MachinesTableProps) {
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState<number | "new" | null>(null);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setLoading("new");
    try {
      const res = await fetch("/api/machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setMachines((prev) => [...prev, data]);
      setNewName("");
      setAdding(false);
      toast.success("Machine added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add machine");
    } finally {
      setLoading(null);
    }
  }

  function startEdit(machine: Machine) {
    setEditingId(machine.id);
    setEditName(machine.name);
  }

  async function saveEdit(id: number) {
    const name = editName.trim();
    if (!name) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/machines/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setMachines((prev) => prev.map((m) => (m.id === id ? data : m)));
      setEditingId(null);
      toast.success("Machine updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update machine");
    } finally {
      setLoading(null);
    }
  }

  async function toggleActive(machine: Machine) {
    setLoading(machine.id);
    try {
      const res = await fetch(`/api/machines/${machine.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !machine.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setMachines((prev) => prev.map((m) => (m.id === machine.id ? data : m)));
      toast.success(data.isActive ? "Machine activated" : "Machine deactivated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update machine");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setAdding(true); setNewName(""); }} disabled={adding}>
          <Plus className="mr-2 h-4 w-4" />
          Add Machine
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Add row */}
            {adding && (
              <TableRow>
                <TableCell>
                  <Input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdd();
                      if (e.key === "Escape") { setAdding(false); setNewName(""); }
                    }}
                    placeholder="e.g. Terminal 21 - 2nd Floor"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-600/30 text-green-400 border-green-600/40">
                    Active
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={handleAdd}
                      disabled={loading === "new"}
                    >
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => { setAdding(false); setNewName(""); }}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {machines.length === 0 && !adding && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No machines yet. Add one to get started.
                </TableCell>
              </TableRow>
            )}

            {machines.map((machine) => (
              <TableRow key={machine.id} className={machine.isActive ? "" : "opacity-50"}>
                <TableCell>
                  {editingId === machine.id ? (
                    <Input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(machine.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-8"
                    />
                  ) : (
                    <span className="font-medium">{machine.name}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      machine.isActive
                        ? "bg-green-600/30 text-green-400 border-green-600/40"
                        : "bg-muted/50 text-muted-foreground border-muted"
                    }
                  >
                    {machine.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {editingId === machine.id ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => saveEdit(machine.id)}
                          disabled={loading === machine.id}
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => startEdit(machine)}
                          disabled={loading === machine.id}
                          title="Edit name"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => toggleActive(machine)}
                          disabled={loading === machine.id}
                          title={machine.isActive ? "Deactivate" : "Activate"}
                        >
                          {machine.isActive
                            ? <PowerOff className="h-4 w-4 text-muted-foreground" />
                            : <Power className="h-4 w-4 text-green-500" />
                          }
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
