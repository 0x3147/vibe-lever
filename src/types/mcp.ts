export interface McpServer {
  name: string;
  server_type: string;
  command: string | null;
  args: string[] | null;
  url: string | null;
  env: Record<string, string> | null;
  headers: Record<string, string> | null;
}

export interface McpServerInput {
  name: string;
  server_type: string;
  command: string | null;
  args: string[] | null;
  url: string | null;
  env: Record<string, string> | null;
  headers: Record<string, string> | null;
}
