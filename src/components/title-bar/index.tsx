import { getCurrentWindow } from "@tauri-apps/api/window";

export function TitleBar() {
  const appWindow = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between h-10 px-3 select-none shrink-0 border-b border-border/50"
    >
      <div data-tauri-drag-region className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
          <span className="text-primary text-[10px] font-bold leading-none">V</span>
        </div>
        <span className="text-sm font-semibold text-foreground/80 tracking-tight">VibeLever</span>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => appWindow.minimize()}
          className="w-10 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="最小化"
        >
          <svg width="11" height="2" viewBox="0 0 11 2" fill="none">
            <line x1="0.5" y1="1" x2="10.5" y2="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="w-10 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="最大化"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <rect x="1" y="1" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <button
          onClick={() => appWindow.close()}
          className="w-10 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-red-500 hover:text-white transition-colors"
          aria-label="关闭"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <line x1="1.5" y1="1.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="9.5" y1="1.5" x2="1.5" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
