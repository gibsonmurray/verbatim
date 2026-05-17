export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const meterClass =
  "font-mono text-xs text-muted-foreground [letter-spacing:0]";
