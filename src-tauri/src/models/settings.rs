use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppSettings {
    pub theme: String,     // "light" | "dark" | "system"
    pub language: String,  // "zh" | "en"
    pub last_tool: String, // "claude-code" | "codex"
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
            language: "zh".to_string(),
            last_tool: "claude-code".to_string(),
        }
    }
}
