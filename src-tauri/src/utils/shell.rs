use crate::errors::AppError;
use std::process::Command;

pub struct ShellOutput {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
}

pub fn run_command(cmd: &str, args: &[&str]) -> Result<ShellOutput, AppError> {
    let output = Command::new(cmd)
        .args(args)
        .output()
        .map_err(|e| AppError::ShellCommand(format!("Failed to execute {}: {}", cmd, e)))?;

    Ok(ShellOutput {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

/// Windows 上 npm 是 npm.cmd，Command::new("npm") 找不到它，需要通过 cmd /c 调用
pub fn run_npm(args: &[&str]) -> Result<ShellOutput, AppError> {
    if cfg!(windows) {
        let mut cmd_args = vec!["/c", "npm"];
        cmd_args.extend_from_slice(args);
        run_command("cmd", &cmd_args)
    } else {
        run_command("npm", args)
    }
}

/// 检查某个命令是否存在于 PATH 中
pub fn which(cmd: &str) -> Option<String> {
    let check_cmd = if cfg!(windows) { "where" } else { "which" };
    if let Ok(output) = run_command(check_cmd, &[cmd]) {
        if output.success {
            return Some(output.stdout.trim().to_string());
        }
    }
    None
}
