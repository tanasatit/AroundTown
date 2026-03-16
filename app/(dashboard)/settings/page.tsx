"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MachinesTableWrapper } from "@/components/settings/machines-table-wrapper";

function SettingField({
  label,
  description,
  settingKey,
  initialValue,
}: {
  label: string;
  description: string;
  settingKey: string;
  initialValue: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settingKey, value }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Saved!");
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex gap-2 max-w-xs">
        <Input
          type="number"
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => setSettings({}));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage machines, exchange targets, and defaults.</p>
      </div>

      <Tabs defaultValue="machines">
        <TabsList>
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="exchange">Exchange Box</TabsTrigger>
          <TabsTrigger value="defaults">Defaults</TabsTrigger>
        </TabsList>

        <TabsContent value="machines" className="mt-6">
          <MachinesTableWrapper />
        </TabsContent>

        <TabsContent value="exchange" className="mt-6">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="text-lg">Exchange Box Target</CardTitle>
            </CardHeader>
            <CardContent>
              {settings ? (
                <SettingField
                  label="Balance Target (฿)"
                  description="The required total for the exchange box each collection round."
                  settingKey="exchange_balance_target"
                  initialValue={settings["exchange_balance_target"] ?? "12000"}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Loading...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaults" className="mt-6">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="text-lg">Default Values</CardTitle>
            </CardHeader>
            <CardContent>
              {settings ? (
                <SettingField
                  label="Default Cost per Postcard (฿)"
                  description="Used as the default cost when recording a new collection."
                  settingKey="default_cost_per_postcard"
                  initialValue={settings["default_cost_per_postcard"] ?? "13.766"}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Loading...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
