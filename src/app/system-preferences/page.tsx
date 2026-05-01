import type { Metadata } from "next";
import { SystemPreferences } from "@/components/features/system-preferences";

export const metadata: Metadata = {
  title: "System Preferences",
  description: "Manage your display, accessibility, and language settings.",
};

export default function SystemPreferencesPage() {
  return <SystemPreferences />;
}
