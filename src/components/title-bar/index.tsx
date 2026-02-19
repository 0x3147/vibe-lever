import { getCurrentWindow } from "@tauri-apps/api/window";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faSquare, faXmark } from "@fortawesome/free-solid-svg-icons";

export function TitleBar() {
  const appWindow = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between h-9 bg-background border-b border-border px-4 select-none shrink-0"
    >
      <div data-tauri-drag-region className="flex items-center gap-2 flex-1">
        <span className="text-sm font-semibold text-foreground">VibeLever</span>
      </div>
      <div className="flex items-center">
        <button
          onClick={() => appWindow.minimize()}
          className="h-9 w-11 flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="最小化"
        >
          <FontAwesomeIcon icon={faMinus} className="text-xs" />
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="h-9 w-11 flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="最大化"
        >
          <FontAwesomeIcon icon={faSquare} className="text-xs" />
        </button>
        <button
          onClick={() => appWindow.close()}
          className="h-9 w-11 flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
          aria-label="关闭"
        >
          <FontAwesomeIcon icon={faXmark} className="text-sm" />
        </button>
      </div>
    </div>
  );
}
