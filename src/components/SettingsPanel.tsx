import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
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
import type { PlaceholderStyle, Settings, Theme } from "../lib/settings";
import { SettingToggle } from "./SettingToggle";

type SettingsPanelProps = {
  onLoad: () => void;
  onResetDefaults: () => void;
  onSave: () => void;
  onUpdateSetting: <Key extends keyof Settings>(
    key: Key,
    value: Settings[Key],
  ) => void;
  settings: Settings;
  status: string;
};

export function SettingsPanel({
  onLoad,
  onResetDefaults,
  onSave,
  onUpdateSetting,
  settings,
  status,
}: SettingsPanelProps) {
  const themeItems: Array<{ label: string; value: Theme }> = [
    { label: "ember", value: "ember" },
    { label: "mint", value: "mint" },
    { label: "mono", value: "mono" },
  ];
  const placeholderItems: Array<{ label: string; value: PlaceholderStyle }> = [
    { label: "bars", value: "bars" },
    { label: "dots", value: "dots" },
    { label: "letters", value: "letters" },
  ];
  const firstSliderValue = (value: number | readonly number[], fallback: number) =>
    Array.isArray(value) ? Number(value[0] ?? fallback) : Number(value);

  return (
    <div className="grid gap-4.5" aria-label="settings">
      <div className="flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
        <span>local</span>
        <Badge variant="secondary">{status}</Badge>
      </div>

      <FieldGroup aria-label="checking options" className="gap-0">
        <SettingToggle
          checked={settings.caseSensitive}
          description="match uppercase and lowercase exactly"
          id="case-sensitive"
          label="case sensitivity"
          onChange={(checked) => onUpdateSetting("caseSensitive", checked)}
        />
        <SettingToggle
          checked={settings.punctuationSensitive}
          description="require commas, periods, quotes, and symbols"
          id="punctuation-sensitive"
          label="punctuation sensitivity"
          onChange={(checked) => onUpdateSetting("punctuationSensitive", checked)}
        />
        <SettingToggle
          checked={settings.accentSensitive}
          description="respect diacritics and accent marks"
          id="accent-sensitive"
          label="accent sensitivity"
          onChange={(checked) => onUpdateSetting("accentSensitive", checked)}
        />
        <SettingToggle
          checked={settings.autoRevealCurrentWord}
          description="show the untyped part of the active word"
          id="auto-reveal-current-word"
          label="current word hint"
          onChange={(checked) => onUpdateSetting("autoRevealCurrentWord", checked)}
        />
      </FieldGroup>

      <div
        className="grid grid-cols-1 gap-x-3 gap-y-3.5 min-[500px]:grid-cols-2 min-[1180px]:grid-cols-2"
        aria-label="customization options"
      >
        <Field>
          <FieldLabel htmlFor="theme-select">theme</FieldLabel>
          <Select
            items={themeItems}
            value={settings.theme}
            onValueChange={(value) => onUpdateSetting("theme", value as Theme)}
          >
            <SelectTrigger id="theme-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {themeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="placeholder-select">placeholders</FieldLabel>
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
            <FieldLabel htmlFor="word-size-slider">type size</FieldLabel>
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

        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor="hint-strength-slider">hint strength</FieldLabel>
            <FieldDescription>{settings.hintStrength}%</FieldDescription>
          </div>
          <Slider
            id="hint-strength-slider"
            max={85}
            min={25}
            step={1}
            value={[settings.hintStrength]}
            onValueChange={(value) =>
              onUpdateSetting(
                "hintStrength",
                firstSliderValue(value, settings.hintStrength),
              )
            }
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" type="button" onClick={onSave}>
          save
        </Button>
        <Button variant="secondary" type="button" onClick={onLoad}>
          load
        </Button>
        <Button variant="secondary" type="button" onClick={onResetDefaults}>
          defaults
        </Button>
      </div>
    </div>
  );
}
