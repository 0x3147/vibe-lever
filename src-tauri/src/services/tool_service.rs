use crate::errors::AppError;
use crate::models::tool::{InstallResult, ToolStatus};
use crate::utils::shell;

pub struct ToolService;

impl ToolService {
    pub fn check_status(tool: &str, db: &crate::db::Database) -> Result<ToolStatus, AppError> {
        use crate::services::tool_cache_service::ToolCacheService;
        if let Some(cached) = ToolCacheService::get(db, tool) {
            return Ok(cached);
        }
        let cmd = match tool {
            "claude-code" => "claude",
            "codex" => "codex",
            _ => {
                return Err(AppError::ToolNotInstalled(format!(
                    "Unknown tool: {}",
                    tool
                )))
            }
        };

        let path = shell::which(cmd);
        let installed = path.is_some();

        let version = if installed {
            shell::run_command(cmd, &["--version"]).ok().and_then(|o| {
                if o.success {
                    Some(o.stdout.trim().to_string())
                } else {
                    None
                }
            })
        } else {
            None
        };

        let running = Self::check_running(tool).unwrap_or(false);

        let status = ToolStatus {
            installed,
            path,
            version,
            install_method: None,
            running,
        };
        ToolCacheService::set(db, tool, &status);
        Ok(status)
    }

    pub fn check_running(tool: &str) -> Result<bool, AppError> {
        let process_name = match tool {
            "claude-code" => "claude",
            "codex" => "codex",
            _ => return Ok(false),
        };

        let output = if cfg!(windows) {
            shell::run_command(
                "tasklist",
                &["/FI", &format!("IMAGENAME eq {}.exe", process_name)],
            )?
        } else {
            shell::run_command("pgrep", &["-x", process_name])?
        };

        Ok(output.success && output.stdout.contains(process_name))
    }

    pub fn install(tool: &str, method: &str) -> Result<InstallResult, AppError> {
        if tool == "claude-code" && method == "native" {
            let output = if cfg!(windows) {
                shell::run_command("powershell", &["-Command", "irm https://claude.ai/install.ps1 | iex"])?
            } else {
                shell::run_command("bash", &["-c", "curl -fsSL https://claude.ai/install.sh | bash"])?
            };
            return Ok(InstallResult {
                success: output.success,
                message: if output.success { "安装成功".to_string() } else { output.stderr.clone() },
                output: Some(format!("{}
{}", output.stdout, output.stderr)),
            });
        }

        let npm_pkg = match tool {
            "claude-code" => Some("@anthropic-ai/claude-code"),
            "codex" => Some("@openai/codex"),
            _ => None,
        };

        let output = match (tool, method) {
            (_, "npm") => {
                let pkg = npm_pkg.ok_or_else(|| AppError::ShellCommand(format!("Unknown tool: {}", tool)))?;
                shell::run_npm(&["install", "-g", pkg])?
            }
            ("claude-code", "brew") => shell::run_command("brew", &["install", "claude"])?,
            _ => return Err(AppError::ShellCommand(format!("Unsupported install: {} via {}", tool, method))),
        };
        Ok(InstallResult {
            success: output.success,
            message: if output.success {
                "安装成功".to_string()
            } else {
                output.stderr.clone()
            },
            output: Some(format!("{}
{}", output.stdout, output.stderr)),
        })
    }

    pub fn uninstall(tool: &str) -> Result<(), AppError> {
        let args: &[&str] = match tool {
            "claude-code" => &["uninstall", "-g", "@anthropic-ai/claude-code"],
            "codex" => &["uninstall", "-g", "@openai/codex"],
            _ => return Err(AppError::ShellCommand(format!("Unknown tool: {}", tool))),
        };

        let output = shell::run_npm(args)?;
        if !output.success {
            return Err(AppError::ShellCommand(output.stderr));
        }
        Ok(())
    }

    pub fn kill_process(tool: &str) -> Result<(), AppError> {
        let process_name = match tool {
            "claude-code" => "claude",
            "codex" => "codex",
            _ => return Err(AppError::ShellCommand(format!("Unknown tool: {}", tool))),
        };

        let output = if cfg!(windows) {
            shell::run_command("taskkill", &["/F", "/IM", &format!("{}.exe", process_name)])?
        } else {
            shell::run_command("pkill", &["-f", process_name])?
        };

        if !output.success && !output.stderr.contains("not found") {
            return Err(AppError::ShellCommand(output.stderr));
        }
        Ok(())
    }
}

use crate::models::tool::NodeStatus;

pub struct NodeService;

impl NodeService {
    pub fn check_status() -> NodeStatus {
        let node_version = shell::run_command("node", &["--version"])
            .ok()
            .and_then(|o| if o.success { Some(o.stdout.trim().to_string()) } else { None });

        let nvm_version = if cfg!(windows) {
            // nvm-windows shows a GUI dialog when run outside a terminal; use which instead
            shell::which("nvm").map(|_| String::new())
        } else {
            shell::run_command("bash", &["-c", "source ~/.nvm/nvm.sh && nvm --version"]).ok()
                .and_then(|o| if o.success { Some(o.stdout.trim().to_string()) } else { None })
        };

        NodeStatus {
            node_installed: node_version.is_some(),
            node_version,
            nvm_installed: nvm_version.is_some(),
            nvm_version,
        }
    }

    pub fn install_nvm() -> Result<InstallResult, AppError> {
        let output = if cfg!(windows) {
            shell::run_command("powershell", &["-Command", "irm https://github.com/coreybutler/nvm-windows/releases/latest/download/nvm-setup.exe -OutFile $env:TEMP\nvm-setup.exe; Start-Process $env:TEMP\nvm-setup.exe -Wait"])?
        } else {
            shell::run_command("bash", &["-c", "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"])?
        };
        Ok(InstallResult {
            success: output.success,
            message: if output.success { "NVM 安装成功".to_string() } else { output.stderr.clone() },
            output: Some(format!("{}\n{}", output.stdout, output.stderr)),
        })
    }

    pub fn install_node_lts() -> Result<InstallResult, AppError> {
        let output = if cfg!(windows) {
            shell::run_command("nvm", &["install", "lts"])?
        } else {
            shell::run_command("bash", &["-c", "source ~/.nvm/nvm.sh && nvm install --lts"])?
        };
        Ok(InstallResult {
            success: output.success,
            message: if output.success { "Node.js LTS 安装成功".to_string() } else { output.stderr.clone() },
            output: Some(format!("{}\n{}", output.stdout, output.stderr)),
        })
    }
}
