export interface ToolStatus {
  installed: boolean;
  path: string | null;
  version: string | null;
  install_method: string | null;
  running: boolean;
}

export interface InstallResult {
  success: boolean;
  message: string;
  output: string | null;
}

export interface PlatformInfo {
  platform: string;
  platform_name: string;
  arch: string;
}

export type ToolId = "claude-code" | "codex";
