export function AppHeader() {
  return (
    <header className="flex items-center justify-between px-1 text-sm leading-none text-muted-foreground">
      <div
        className="inline-flex items-center gap-2.5 font-medium text-foreground"
        aria-label="verbatim home"
      >
        <span className="grid size-8 place-items-center rounded-4xl bg-primary font-mono text-sm font-bold text-primary-foreground shadow-sm">
          v
        </span>
        <span>verbatim</span>
      </div>
    </header>
  );
}
