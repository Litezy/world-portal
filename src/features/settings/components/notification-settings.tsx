"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { settings } from "@/content/admin";
import { useLocalStorage } from "@/hooks/use-local-storage";

type Prefs = Record<string, boolean>;

const DEFAULTS: Prefs = { newEnquiry: true, dueSoon: true, weekly: false };

export function NotificationSettings() {
  const [prefs, setPrefs] = useLocalStorage<Prefs>("wp-admin-notifications", DEFAULTS);

  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {settings.notifications.items.map((item) => (
        <li
          key={item.key}
          className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            <Label htmlFor={`notify-${item.key}`} className="text-[13.5px]">
              {item.label}
            </Label>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">{item.hint}</p>
          </div>
          <Switch
            id={`notify-${item.key}`}
            checked={prefs[item.key] ?? false}
            onCheckedChange={(checked) => setPrefs({ ...prefs, [item.key]: checked })}
          />
        </li>
      ))}
    </ul>
  );
}
