import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type SettingToggleProps = {
  checked: boolean;
  description: string;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
};

export function SettingToggle({
  checked,
  description,
  id,
  label,
  onChange,
}: SettingToggleProps) {
  return (
    <Label
      htmlFor={id}
      className="group flex w-full cursor-pointer items-start justify-between gap-4 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-muted/45"
    >
      <span className="grid min-w-0 gap-1">
        <span className="text-sm font-medium leading-none text-foreground">
          {label}
        </span>
        <span className="text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="mt-0.5"
      />
    </Label>
  );
}
