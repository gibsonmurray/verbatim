export function AppHeader() {
  return (
    <header className="flex items-center justify-between text-[13px] leading-none text-muted-foreground">
      <div
        className="inline-flex items-center gap-2.5 font-bold text-foreground"
        aria-label="verbatim home"
      >
        <span className="grid size-[25px] place-items-center rounded-[5px] bg-primary font-mono text-base font-extrabold text-primary-foreground">
          v
        </span>
        <span>verbatim</span>
      </div>
    </header>
  );
}
