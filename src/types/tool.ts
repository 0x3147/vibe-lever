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

export interface NodeStatus {
  node_installed: boolean;
  node_version: string | null;
  nvm_installed: boolean;
  nvm_version: string | null;
}
