use crate::errors::AppError;
use crate::models::vendor::{Vendor, VendorInput};

/// 将 Vendor 配置写入 Claude Code 的 settings.json
pub fn write_claude_settings(vendor: &Vendor) -> Result<(), AppError> {
    let home = dirs::home_dir().ok_or(AppError::FileSystem(std::io::Error::new(
        std::io::ErrorKind::NotFound,
        "Home directory not found",
    )))?;
    let settings_path = home.join(".claude").join("settings.json");

    // 读取现有配置或创建空配置
    let mut settings: serde_json::Value = if settings_path.exists() {
        let content = std::fs::read_to_string(&settings_path)?;
        serde_json::from_str(&content)?
    } else {
        std::fs::create_dir_all(settings_path.parent().unwrap())?;
        serde_json::json!({})
    };

    // 更新 env 字段
    let env = settings
        .as_object_mut()
        .unwrap()
        .entry("env")
        .or_insert_with(|| serde_json::json!({}));

    if let Some(env_obj) = env.as_object_mut() {
        env_obj.insert(
            "ANTHROPIC_AUTH_TOKEN".to_string(),
            serde_json::json!(vendor.token),
        );
        env_obj.insert(
            "ANTHROPIC_BASE_URL".to_string(),
            serde_json::json!(vendor.base_url),
        );
        env_obj.insert(
            "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC".to_string(),
            serde_json::json!(1),
        );

        // 解析 config_json 中的扩展配置
        if let Some(config_str) = &vendor.config_json {
            if let Ok(config) = serde_json::from_str::<serde_json::Value>(config_str) {
                if let Some(model) = config.get("sonnetModel").and_then(|v| v.as_str()) {
                    env_obj.insert(
                        "ANTHROPIC_DEFAULT_SONNET_MODEL".to_string(),
                        serde_json::json!(model),
                    );
                }
                if let Some(model) = config.get("haikuModel").and_then(|v| v.as_str()) {
                    env_obj.insert(
                        "ANTHROPIC_DEFAULT_HAIKU_MODEL".to_string(),
                        serde_json::json!(model),
                    );
                }
                if let Some(model) = config.get("opusModel").and_then(|v| v.as_str()) {
                    env_obj.insert(
                        "ANTHROPIC_DEFAULT_OPUS_MODEL".to_string(),
                        serde_json::json!(model),
                    );
                }
            }
        }

        if let Some(ref model) = vendor.model {
            env_obj.insert("ANTHROPIC_MODEL".to_string(), serde_json::json!(model));
        }
    }

    let content = serde_json::to_string_pretty(&settings)?;
    std::fs::write(&settings_path, content)?;
    Ok(())
}

/// 将 Vendor 配置写入 Codex 的 config.toml 和 auth.json
pub fn write_codex_config(vendor: &Vendor) -> Result<(), AppError> {
    let home = dirs::home_dir().ok_or(AppError::FileSystem(std::io::Error::new(
        std::io::ErrorKind::NotFound,
        "Home directory not found",
    )))?;
    let codex_dir = home.join(".codex");
    std::fs::create_dir_all(&codex_dir)?;

    // 写入 auth.json
    let auth = serde_json::json!({ "OPENAI_API_KEY": vendor.token });
    std::fs::write(codex_dir.join("auth.json"), serde_json::to_string_pretty(&auth)?)?;

    let provider_key = vendor.vendor_key.as_deref().unwrap_or("custom");
    let mut model = vendor.model.clone().unwrap_or_else(|| "gpt-4o".to_string());
    let mut reasoning_effort = "high".to_string();
    if let Some(config_str) = &vendor.config_json {
        if let Ok(config) = serde_json::from_str::<serde_json::Value>(config_str) {
            if let Some(m) = config.get("model").and_then(|v| v.as_str()) {
                model = m.to_string();
            }
            if let Some(r) = config.get("reasoningEffort").and_then(|v| v.as_str()) {
                reasoning_effort = r.to_string();
            }
        }
    }

    // 读取现有配置或创建空配置（保留其他 provider）
    let config_path = codex_dir.join("config.toml");
    let mut cfg: toml::Value = if config_path.exists() {
        let content = std::fs::read_to_string(&config_path)?;
        toml::from_str(&content).unwrap_or(toml::Value::Table(toml::map::Map::new()))
    } else {
        toml::Value::Table(toml::map::Map::new())
    };

    let table = cfg.as_table_mut().unwrap();
    table.insert("model_provider".into(), toml::Value::String(provider_key.to_string()));
    table.insert("model".into(), toml::Value::String(model));
    table.insert("model_reasoning_effort".into(), toml::Value::String(reasoning_effort));
    table.insert("disable_response_storage".into(), toml::Value::Boolean(true));

    let providers = table.entry("model_providers")
        .or_insert(toml::Value::Table(toml::map::Map::new()));
    if let Some(providers_table) = providers.as_table_mut() {
        let mut provider = toml::map::Map::new();
        provider.insert("name".into(), toml::Value::String(vendor.name.clone()));
        provider.insert("base_url".into(), toml::Value::String(vendor.base_url.clone()));
        provider.insert("wire_api".into(), toml::Value::String("openai".to_string()));
        provider.insert("requires_openai_auth".into(), toml::Value::Boolean(true));
        providers_table.insert(provider_key.to_string(), toml::Value::Table(provider));
    }

    std::fs::write(&config_path, toml::to_string_pretty(&cfg)?)?;
    Ok(())
}

/// 从 ~/.claude/settings.json 读取当前激活的供应商配置
pub fn read_claude_settings() -> Result<Option<VendorInput>, AppError> {
    let home = dirs::home_dir().ok_or(AppError::FileSystem(std::io::Error::new(
        std::io::ErrorKind::NotFound,
        "Home directory not found",
    )))?;
    let settings_path = home.join(".claude").join("settings.json");
    if !settings_path.exists() {
        return Ok(None);
    }
    let content = std::fs::read_to_string(&settings_path)?;
    let settings: serde_json::Value = serde_json::from_str(&content).unwrap_or_default();
    let token = settings["env"]["ANTHROPIC_AUTH_TOKEN"]
        .as_str()
        .unwrap_or("")
        .to_string();
    let base_url = settings["env"]["ANTHROPIC_BASE_URL"]
        .as_str()
        .unwrap_or("")
        .to_string();
    if token.is_empty() && base_url.is_empty() {
        return Ok(None);
    }
    Ok(Some(VendorInput {
        name: "导入的配置".to_string(),
        vendor_key: None,
        base_url,
        token,
        model: settings["env"]["ANTHROPIC_MODEL"]
            .as_str()
            .map(|s| s.to_string()),
        config_json: None,
    }))
}
