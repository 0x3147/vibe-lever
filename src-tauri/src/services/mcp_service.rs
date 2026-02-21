use crate::errors::AppError;
use crate::models::mcp::{McpServer, McpServerInput};

pub struct McpService;

impl McpService {
    fn get_config_path() -> Result<std::path::PathBuf, AppError> {
        let home = dirs::home_dir().ok_or(AppError::FileSystem(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "Home directory not found",
        )))?;
        Ok(home.join(".claude.json"))
    }

    fn read_config() -> Result<serde_json::Value, AppError> {
        let path = Self::get_config_path()?;
        if path.exists() {
            let content = std::fs::read_to_string(&path)?;
            Ok(serde_json::from_str(&content)?)
        } else {
            Ok(serde_json::json!({"mcpServers": {}}))
        }
    }

    fn write_config(config: &serde_json::Value) -> Result<(), AppError> {
        let path = Self::get_config_path()?;
        let content = serde_json::to_string_pretty(config)?;
        std::fs::write(&path, content)?;
        Ok(())
    }

    pub fn get_all() -> Result<Vec<McpServer>, AppError> {
        let config = Self::read_config()?;
        let servers = config
            .get("mcpServers")
            .and_then(|s| s.as_object())
            .cloned()
            .unwrap_or_default();

        let mut result = Vec::new();
        for (name, value) in servers {
            let server_type = value
                .get("type")
                .and_then(|t| t.as_str())
                .unwrap_or("stdio")
                .to_string();

            result.push(McpServer {
                name,
                server_type,
                command: value
                    .get("command")
                    .and_then(|v| v.as_str())
                    .map(String::from),
                args: value.get("args").and_then(|v| {
                    v.as_array().map(|a| {
                        a.iter()
                            .filter_map(|i| i.as_str().map(String::from))
                            .collect()
                    })
                }),
                url: value.get("url").and_then(|v| v.as_str()).map(String::from),
                env: value
                    .get("env")
                    .and_then(|v| serde_json::from_value(v.clone()).ok()),
                headers: value
                    .get("headers")
                    .and_then(|v| serde_json::from_value(v.clone()).ok()),
            });
        }
        Ok(result)
    }

    pub fn add(input: McpServerInput) -> Result<McpServer, AppError> {
        let mut config = Self::read_config()?;
        let servers = config
            .as_object_mut()
            .unwrap()
            .entry("mcpServers")
            .or_insert_with(|| serde_json::json!({}));

        let mut server_value = serde_json::Map::new();
        if let Some(ref cmd) = input.command {
            server_value.insert("command".to_string(), serde_json::json!(cmd));
        }
        if let Some(ref args) = input.args {
            server_value.insert("args".to_string(), serde_json::json!(args));
        }
        if let Some(ref url) = input.url {
            server_value.insert("url".to_string(), serde_json::json!(url));
        }
        if let Some(ref env) = input.env {
            server_value.insert("env".to_string(), serde_json::json!(env));
        }
        if input.server_type != "stdio" {
            server_value.insert("type".to_string(), serde_json::json!(input.server_type));
        }

        servers
            .as_object_mut()
            .unwrap()
            .insert(input.name.clone(), serde_json::Value::Object(server_value));

        Self::write_config(&config)?;

        Ok(McpServer {
            name: input.name,
            server_type: input.server_type,
            command: input.command,
            args: input.args,
            url: input.url,
            env: input.env,
            headers: input.headers,
        })
    }

    pub fn delete(name: &str) -> Result<(), AppError> {
        let mut config = Self::read_config()?;
        if let Some(servers) = config.get_mut("mcpServers").and_then(|s| s.as_object_mut()) {
            servers.remove(name);
        }
        Self::write_config(&config)?;
        Ok(())
    }
}
