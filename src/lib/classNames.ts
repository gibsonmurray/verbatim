export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const meterClass =
  "font-mono text-xs text-[var(--text-dim)] [letter-spacing:0]";
