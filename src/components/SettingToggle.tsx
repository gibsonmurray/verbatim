import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
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
    <FieldLabel htmlFor={id} className="w-full">
      <Field
        orientation="horizontal"
        className="rounded-3xl bg-muted/60 p-3"
      >
        <FieldContent>
          <FieldTitle className="text-foreground">{label}</FieldTitle>
          <FieldDescription>{description}</FieldDescription>
        </FieldContent>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onChange}
        />
      </Field>
    </FieldLabel>
  );
}
