import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { LucideIcon } from "lucide-react";

type SettingToggleProps = {
  checked: boolean;
  description: string;
  icon?: LucideIcon;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
};

export function SettingToggle({
  checked,
  description,
  icon: Icon,
  id,
  label,
  onChange,
}: SettingToggleProps) {
  return (
    <Label
      htmlFor={id}
      className="group flex w-full cursor-pointer items-start justify-between gap-4 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-muted/45"
    >
      <span className="flex min-w-0 items-start gap-2.5">
        {Icon && (
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground/70">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <span className="grid min-w-0 gap-1">
          <span className="text-sm font-medium leading-none text-foreground">
            {label}
          </span>
          <span className="text-xs leading-5 text-muted-foreground">
            {description}
          </span>
        </span>
      </span>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="mt-0.5 shrink-0"
      />
    </Label>
  );
}
