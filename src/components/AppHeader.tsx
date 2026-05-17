export function AppHeader() {
  return (
    <header className="flex items-center justify-between text-[13px] leading-none text-[var(--text-dim)]">
      <div
        className="inline-flex items-center gap-2.5 font-bold text-[var(--text-strong)]"
        aria-label="verbatim home"
      >
        <span className="grid size-[25px] place-items-center rounded-[5px] bg-[var(--accent)] font-mono text-base font-extrabold text-[var(--accent-ink)]">
          v
        </span>
        <span>verbatim</span>
      </div>
    </header>
  );
}
