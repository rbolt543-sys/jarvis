export function Header() {
  return (
    <header className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="size-2 rounded-full bg-accent shadow-[0_0_12px_2px] shadow-accent/60" />
        <span className="font-mono text-sm text-neutral-400">Jarvis</span>
        <span className="text-xs text-neutral-600">Idle</span>
      </div>
      <div className="text-xs text-neutral-500 font-mono">
        {new Date().toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
      </div>
    </header>
  );
}
