"use client";

import { useState } from "react";
import { InfoIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldSet,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const APPEARANCE_OPTIONS = [
  {
    value: "light",
    label: "Light",
    description: "A bright, high-contrast theme.",
  },
  {
    value: "dark",
    label: "Dark",
    description: "A low-light theme for dim environments.",
  },
  {
    value: "system",
    label: "System",
    description: "Automatically follows your device setting.",
  },
] as const;

const LANGUAGES = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "fr-FR", label: "Français (France)" },
  { value: "de-DE", label: "Deutsch (Deutschland)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "ja-JP", label: "日本語 (日本)" },
  { value: "zh-CN", label: "中文 (简体)" },
] as const;

export function SystemPreferences() {
  const [appearance, setAppearance] = useState("system");
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [enableNotifications, setEnableNotifications] = useState(false);
  const [homepageMessage, setHomepageMessage] = useState("");
  const [language, setLanguage] = useState("");
  const [languageError, setLanguageError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!language) {
      setLanguageError("Please select a display language to continue.");
      return;
    }
    setLanguageError("");
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 4000);
  }

  return (
    <TooltipProvider>
      {/* Skip navigation link — visible on focus, hidden otherwise */}
      <a
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only",
          "focus:fixed focus:top-4 focus:left-4 focus:z-50",
          "focus:rounded-md focus:bg-primary focus:px-4 focus:py-2",
          "focus:text-sm focus:font-medium focus:text-primary-foreground",
          "focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
      >
        Skip to content
      </a>

      <div className="min-h-screen bg-background">
        {/* ── Page header ─────────────────────────────────────────── */}
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-3xl px-6 py-5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              System Preferences
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your display, accessibility, and language settings.
            </p>
            {/* Two illustrative images (from public/images) */}
            <div className="mt-4 flex gap-4">
              <img
                src="/images/ai-robot-0YEvGZp0bK0.jpg"
                className="h-40 w-40 rounded-md object-cover"
              />
              <img
                src="/images/frontend-typing-mKhPLJ5JQI4.jpg"
                alt="Person typing frontend code"
                className="h-40 w-40 rounded-md object-cover"
              />
            </div>
          </div>
        </header>

        {/* ── Main content ─────────────────────────────────────────── */}
        {/*
          tabIndex={-1} allows the skip-link target to receive focus
          programmatically without appearing in the natural tab order.
        */}
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-3xl px-6 py-10 outline-none"
        >
          <form
            onSubmit={handleSubmit}
            noValidate
            aria-label="System preferences"
          >
            {/* ── Appearance ──────────────────────────────────────── */}
            <section aria-labelledby="appearance-heading" className="mb-10">
              <h2
                id="appearance-heading"
                className="text-lg font-semibold text-foreground"
              >
                Appearance
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose how the interface looks on your device.
              </p>
              <Separator className="my-5" />

              <RadioGroup
                value={appearance}
                onValueChange={setAppearance}
                aria-labelledby="appearance-heading"
                className="grid grid-cols-1 gap-3 sm:grid-cols-3"
              >
                {APPEARANCE_OPTIONS.map(({ value, label, description }) => (
                  <label
                    key={value}
                    htmlFor={`appearance-${value}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                      appearance === value &&
                        "border-primary bg-primary/5 text-foreground"
                    )}
                  >
                    <RadioGroupItem
                      value={value}
                      id={`appearance-${value}`}
                      className="mt-0.5 shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <div>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {description}
                      </span>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </section>

            {/* ── Preferences ─────────────────────────────────────── */}
            <section aria-labelledby="preferences-heading" className="mb-10">
              <h2
                id="preferences-heading"
                className="text-lg font-semibold text-foreground"
              >
                Preferences
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Additional account and display preferences.
              </p>
              <Separator className="my-5" />

              <FieldGroup>
                <FieldSet>
                  <Field>
                    <FieldLabel htmlFor="notification-email">
                      Notification Email
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="notification-email"
                        type="email"
                        value={notificationEmail}
                        onChange={(e) => setNotificationEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                      <FieldDescription>
                        Email used for alerts and summaries.
                      </FieldDescription>
                    </FieldContent>
                  </Field>

                  <Field orientation="horizontal">
                    <FieldLabel className="sr-only">
                      Enable Email Notifications
                    </FieldLabel>
                    <FieldContent>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="text-sm font-medium">
                            Enable Email Notifications
                          </div>
                          <FieldDescription>
                            Receive notifications via email.
                          </FieldDescription>
                        </div>
                        <Switch
                          id="enable-notifications"
                          checked={enableNotifications}
                          onCheckedChange={setEnableNotifications}
                          className="shrink-0"
                        />
                      </div>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="homepage-message">
                      Homepage Message
                    </FieldLabel>
                    <FieldContent>
                      <Textarea
                        id="homepage-message"
                        value={homepageMessage}
                        onChange={(e) => setHomepageMessage(e.target.value)}
                        placeholder="Short message for your homepage"
                      />
                      <FieldDescription>
                        Shown on your dashboard; keep it brief.
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldSet>
              </FieldGroup>
            </section>

            {/* ── Accessibility ────────────────────────────────────── */}
            <section aria-labelledby="accessibility-heading" className="mb-10">
              <h2
                id="accessibility-heading"
                className="text-lg font-semibold text-foreground"
              >
                Accessibility
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure settings to improve usability with assistive
                technologies.
              </p>
              <Separator className="my-5" />

              <div className="rounded-lg border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Label row with contextual help tooltip */}
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="screen-reader-switch"
                        className="cursor-pointer text-sm font-medium text-foreground"
                      >
                        Screen Reader Optimisation
                      </Label>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            type="button"
                            aria-label="More information about Screen Reader Optimisation"
                            className={cn(
                              "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                              "text-muted-foreground transition-colors hover:text-foreground",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            )}
                          >
                            <InfoIcon
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="max-w-64 text-xs"
                        >
                          Adds extra ARIA labels and live regions so screen
                          readers like NVDA, JAWS, and VoiceOver announce
                          dynamic changes immediately.
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Persistent description referenced by the switch */}
                    <p
                      id="srm-description"
                      className="mt-1 text-sm text-muted-foreground"
                    >
                      Optimise the interface for screen readers and other
                      assistive technologies.
                    </p>
                  </div>

                  <Switch
                    id="screen-reader-switch"
                    checked={screenReaderMode}
                    onCheckedChange={setScreenReaderMode}
                    aria-describedby="srm-description"
                    className="shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>
            </section>

            {/* ── Language & Region ────────────────────────────────── */}
            <section aria-labelledby="language-heading" className="mb-10">
              <h2
                id="language-heading"
                className="text-lg font-semibold text-foreground"
              >
                Language &amp; Region
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Set your preferred display language.
              </p>
              <Separator className="my-5" />

              <div className="space-y-2">
                <Label
                  htmlFor="language-select"
                  className="text-sm font-medium"
                >
                  Display Language{" "}
                  {/* aria-hidden so "required" is conveyed via aria-required, not duplicate text */}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                  <span className="sr-only">(required)</span>
                </Label>

                <Select
                  value={language}
                  onValueChange={(v) => {
                    setLanguage(v);
                    setLanguageError("");
                  }}
                >
                  <SelectTrigger
                    id="language-select"
                    aria-required="true"
                    aria-invalid={languageError ? "true" : "false"}
                    aria-describedby={
                      languageError
                        ? "language-error language-hint"
                        : "language-hint"
                    }
                    className={cn(
                      "w-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      languageError &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select a language…" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Static hint — always in DOM so aria-describedby resolves */}
                <p id="language-hint" className="text-xs text-muted-foreground">
                  Affects dates, times, and text displayed throughout the app.
                </p>

                {/*
                  aria-live="polite" announces the error without interrupting
                  current screen-reader speech. aria-atomic ensures the full
                  message is read even if it changes mid-announcement.
                */}
                <div aria-live="polite" aria-atomic="true">
                  {languageError && (
                    <p
                      id="language-error"
                      role="alert"
                      className="flex items-center gap-1.5 text-sm font-medium text-destructive"
                    >
                      <span aria-hidden="true">⚠</span>
                      {languageError}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* ── Form actions ─────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-4 pt-2">
              {/* Save confirmation — announced politely when preferences save */}
              <div aria-live="polite" aria-atomic="true" className="text-sm">
                {saveStatus === "saved" && (
                  <span className="font-medium text-green-600 dark:text-green-400">
                    ✓ Preferences saved successfully.
                  </span>
                )}
              </div>

              <Button
                type="submit"
                className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Save preferences
              </Button>
            </div>
          </form>
        </main>
      </div>
    </TooltipProvider>
  );
}
