export function AppHeader() {
  return (
    <header className="flex items-center justify-between px-1 text-sm leading-none text-muted-foreground">
      <div
        className="inline-flex items-center gap-2.5 font-medium text-foreground"
        aria-label="verbatim home"
      >
        <img
          src="/verbatim-logo.svg"
          alt=""
          className="size-8 rounded-4xl shadow-sm"
          aria-hidden="true"
        />
        <span>verbatim</span>
      </div>
    </header>
  );
}
