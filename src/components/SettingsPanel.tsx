import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  ALargeSmallIcon,
  ArrowRightIcon,
  CaseSensitiveIcon,
  EyeIcon,
  KeyboardIcon,
  LanguagesIcon,
  MonitorIcon,
  PinIcon,
  QuoteIcon,
  RotateCcwIcon,
  ScanSearchIcon,
  SparklesIcon,
  TypeIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PlaceholderStyle, Settings } from "../lib/settings";
import { SettingToggle } from "./SettingToggle";

type SettingsPanelProps = {
  onResetDefaults: () => void;
  onUpdateSetting: <Key extends keyof Settings>(
    key: Key,
    value: Settings[Key],
  ) => void;
  settings: Settings;
};

function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border/60 px-2.5 pb-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
        {label}
      </h3>
    </div>
  );
}

export function SettingsPanel({
  onResetDefaults,
  onUpdateSetting,
  settings,
}: SettingsPanelProps) {
  const placeholderItems: Array<{ label: string; value: PlaceholderStyle }> = [
    { label: "bars", value: "bars" },
    { label: "dots", value: "dots" },
    { label: "letters", value: "letters" },
  ];

  const matchingOptions = [
    {
      checked: settings.caseSensitive,
      description: "Match uppercase and lowercase exactly.",
      icon: CaseSensitiveIcon,
      id: "case-sensitive",
      label: "Case sensitive",
      setting: "caseSensitive",
    },
    {
      checked: settings.punctuationSensitive,
      description: "Require commas, periods, quotes, and symbols.",
      icon: QuoteIcon,
      id: "punctuation-sensitive",
      label: "Punctuation",
      setting: "punctuationSensitive",
    },
    {
      checked: settings.accentSensitive,
      description: "Respect diacritics and accent marks.",
      icon: LanguagesIcon,
      id: "accent-sensitive",
      label: "Accents",
      setting: "accentSensitive",
    },
  ] satisfies Array<{
    checked: boolean;
    description: string;
    icon: LucideIcon;
    id: string;
    label: string;
    setting: keyof Pick<
      Settings,
      "accentSensitive" | "caseSensitive" | "punctuationSensitive"
    >;
  }>;

  const assistOptions = [
    {
      checked: settings.autoRevealCurrentWord,
      description: "Show the untyped part of the active word.",
      icon: EyeIcon,
      id: "auto-reveal-current-word",
      label: "Current word hint",
      setting: "autoRevealCurrentWord",
    },
    {
      checked: settings.autoCapitalize,
      description: "Use source capitalization when your letters match.",
      icon: ALargeSmallIcon,
      id: "auto-capitalize",
      label: "Auto-capitalization",
      setting: "autoCapitalize",
    },
    {
      checked: settings.autoFillFormatting,
      description: "Type letters only; spacing and punctuation fill in.",
      icon: ArrowRightIcon,
      id: "auto-fill-formatting",
      label: "Skip spaces",
      setting: "autoFillFormatting",
    },
    {
      checked: settings.persistTabReveals,
      description: "Keep Tab hints visible while typing resumes.",
      icon: PinIcon,
      id: "persist-tab-reveals",
      label: "Keep Tab hints",
      setting: "persistTabReveals",
    },
  ] satisfies Array<{
    checked: boolean;
    description: string;
    icon: LucideIcon;
    id: string;
    label: string;
    setting: keyof Pick<
      Settings,
      | "autoCapitalize"
      | "autoFillFormatting"
      | "autoRevealCurrentWord"
      | "persistTabReveals"
    >;
  }>;

  const firstSliderValue = (value: number | readonly number[], fallback: number) =>
    Array.isArray(value) ? Number(value[0] ?? fallback) : Number(value);

  return (
    <div className="grid gap-6" aria-label="settings">
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
        <p className="text-xs text-muted-foreground">
          Saved automatically on this device.{" "}
          <span className="text-muted-foreground/50">v{__APP_VERSION__}</span>
        </p>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={onResetDefaults}
        >
          <RotateCcwIcon data-icon="inline-start" />
          defaults
        </Button>
      </div>

      <section className="grid gap-2" aria-label="match settings">
        <SectionHeader icon={ScanSearchIcon} label="Match" />
        <div className="grid gap-0.5">
          {matchingOptions.map((option) => (
            <SettingToggle
              checked={option.checked}
              description={option.description}
              icon={option.icon}
              id={option.id}
              key={option.id}
              label={option.label}
              onChange={(checked) => onUpdateSetting(option.setting, checked)}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-2" aria-label="assist settings">
        <SectionHeader icon={SparklesIcon} label="Assist" />
        <div className="grid gap-0.5">
          {assistOptions.map((option) => (
            <SettingToggle
              checked={option.checked}
              description={option.description}
              icon={option.icon}
              id={option.id}
              key={option.id}
              label={option.label}
              onChange={(checked) => onUpdateSetting(option.setting, checked)}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-3" aria-label="display settings">
        <SectionHeader icon={MonitorIcon} label="Display" />
        <div className="grid gap-0.5">
          <SettingToggle
            checked={settings.typewriterMode}
            description="No placeholders — text grows left from center as you type."
            icon={KeyboardIcon}
            id="typewriter-mode"
            label="Typewriter mode"
            onChange={(checked) => onUpdateSetting("typewriterMode", checked)}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 px-2.5 min-[500px]:grid-cols-2">
          {!settings.typewriterMode && (
            <Field>
              <FieldLabel htmlFor="placeholder-select">
                <span className="flex items-center gap-1.5">
                  Placeholders
                </span>
              </FieldLabel>
              <Select
                items={placeholderItems}
                value={settings.placeholderStyle}
                onValueChange={(value) =>
                  onUpdateSetting(
                    "placeholderStyle",
                    value as PlaceholderStyle,
                  )
                }
              >
                <SelectTrigger id="placeholder-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {placeholderItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field className={settings.typewriterMode ? "col-span-full" : undefined}>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel htmlFor="word-size-slider">
                <span className="flex items-center gap-1.5">
                  <TypeIcon className="h-3.5 w-3.5 text-muted-foreground/70" />
                  Type size
                </span>
              </FieldLabel>
              <FieldDescription>{settings.wordSize}px</FieldDescription>
            </div>
            <Slider
              id="word-size-slider"
              max={46}
              min={24}
              step={1}
              value={[settings.wordSize]}
              onValueChange={(value) =>
                onUpdateSetting(
                  "wordSize",
                  firstSliderValue(value, settings.wordSize),
                )
              }
            />
          </Field>
        </div>
      </section>
    </div>
  );
}
