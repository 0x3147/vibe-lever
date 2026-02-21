use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("数据库错误: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("文件操作失败: {0}")]
    FileSystem(#[from] std::io::Error),
#[error("工具未安装: {0}")]
    ToolNotInstalled(String),
    #[error("命令执行失败: {0}")]
    ShellCommand(String),
    #[error("JSON 解析失败: {0}")]
    JsonParse(#[from] serde_json::Error),
    #[error("TOML 解析失败: {0}")]
    TomlParse(#[from] toml::de::Error),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
