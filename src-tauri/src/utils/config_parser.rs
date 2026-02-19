use crate::errors::AppError;
use crate::models::vendor::Vendor;

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
    let auth = serde_json::json!({
        "OPENAI_API_KEY": vendor.token
    });
    std::fs::write(
        codex_dir.join("auth.json"),
        serde_json::to_string_pretty(&auth)?,
    )?;

    // 解析 config_json 获取 Codex 特有配置
    let provider_key = vendor.vendor_key.as_deref().unwrap_or("custom");
    let mut model = "gpt-5".to_string();

    if let Some(config_str) = &vendor.config_json {
        if let Ok(config) = serde_json::from_str::<serde_json::Value>(config_str) {
            if let Some(m) = config.get("model").and_then(|v| v.as_str()) {
                model = m.to_string();
            }
        }
    }

    let config_toml = format!(
        r#"model_provider = "{provider_key}"
model = "{model}"

[model_providers.{provider_key}]
name = "{name}"
base_url = "{base_url}"
wire_api = "openai"
"#,
        provider_key = provider_key,
        model = model,
        name = vendor.name,
        base_url = vendor.base_url
    );

    std::fs::write(codex_dir.join("config.toml"), config_toml)?;
    Ok(())
}
