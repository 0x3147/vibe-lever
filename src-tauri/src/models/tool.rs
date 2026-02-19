use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ToolStatus {
    pub installed: bool,
    pub path: Option<String>,
    pub version: Option<String>,
    pub install_method: Option<String>,
    pub running: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InstallResult {
    pub success: bool,
    pub message: String,
    pub output: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformInfo {
    pub platform: String,
    pub platform_name: String,
    pub arch: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NodeStatus {
    pub node_installed: bool,
    pub node_version: Option<String>,
    pub nvm_installed: bool,
    pub nvm_version: Option<String>,
}
