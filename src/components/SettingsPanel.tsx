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
import { RotateCcwIcon } from "lucide-react";
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
      id: "case-sensitive",
      label: "Case sensitive",
      setting: "caseSensitive",
    },
    {
      checked: settings.punctuationSensitive,
      description: "Require commas, periods, quotes, and symbols.",
      id: "punctuation-sensitive",
      label: "Punctuation",
      setting: "punctuationSensitive",
    },
    {
      checked: settings.accentSensitive,
      description: "Respect diacritics and accent marks.",
      id: "accent-sensitive",
      label: "Accents",
      setting: "accentSensitive",
    },
  ] satisfies Array<{
    checked: boolean;
    description: string;
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
      id: "auto-reveal-current-word",
      label: "Current word hint",
      setting: "autoRevealCurrentWord",
    },
    {
      checked: settings.autoCapitalize,
      description: "Use source capitalization when your letters match.",
      id: "auto-capitalize",
      label: "Auto-capitalization",
      setting: "autoCapitalize",
    },
    {
      checked: settings.autoFillFormatting,
      description: "Type letters only; spacing and punctuation fill in.",
      id: "auto-fill-formatting",
      label: "Skip spaces",
      setting: "autoFillFormatting",
    },
    {
      checked: settings.persistTabReveals,
      description: "Keep Tab hints visible while typing resumes.",
      id: "persist-tab-reveals",
      label: "Keep Tab hints",
      setting: "persistTabReveals",
    },
  ] satisfies Array<{
    checked: boolean;
    description: string;
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
  const renderToggleGroup = (
    label: string,
    description: string,
    options: Array<{
      checked: boolean;
      description: string;
      id: string;
      label: string;
      setting: keyof Settings;
    }>,
  ) => (
    <section className="grid gap-2" aria-label={`${label} settings`}>
      <div className="flex items-baseline justify-between gap-3 border-b border-border/60 px-2.5 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
          {label}
        </h3>
        <p className="text-right text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-0.5">
        {options.map((option) => (
          <SettingToggle
            checked={option.checked}
            description={option.description}
            id={option.id}
            key={option.id}
            label={option.label}
            onChange={(checked) => onUpdateSetting(option.setting, checked)}
          />
        ))}
      </div>
    </section>
  );

  return (
    <div className="grid gap-6" aria-label="settings">
      <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
        <div className="grid gap-1">
          <p className="text-sm font-medium text-foreground">Practice controls</p>
          <p className="text-xs leading-5 text-muted-foreground">
            Saved automatically on this device.
          </p>
        </div>
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

      {renderToggleGroup("Match", "How exact answers need to be.", matchingOptions)}

      {renderToggleGroup("Assist", "Helpers while typing from memory.", assistOptions)}

      <div
        className="grid gap-3"
        aria-label="display settings"
      >
        <div className="flex items-baseline justify-between gap-3 border-b border-border/60 px-2.5 pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
            Display
          </h3>
          <p className="text-right text-xs text-muted-foreground">How prompts appear.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 px-2.5 min-[500px]:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="placeholder-select">Placeholders</FieldLabel>
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

          <Field>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel htmlFor="word-size-slider">Type size</FieldLabel>
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
      </div>
    </div>
  );
}
