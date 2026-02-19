use crate::errors::AppError;

pub struct DocsService;

impl DocsService {
    pub fn get_claude_md(path: Option<String>) -> Result<Option<String>, AppError> {
        let file_path = if let Some(p) = path {
            std::path::PathBuf::from(p).join("CLAUDE.md")
        } else {
            let home = dirs::home_dir().ok_or(AppError::FileSystem(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                "Home directory not found",
            )))?;
            home.join(".claude").join("CLAUDE.md")
        };

        if file_path.exists() {
            Ok(Some(std::fs::read_to_string(&file_path)?))
        } else {
            Ok(None)
        }
    }

    pub fn save_claude_md(path: Option<String>, content: String) -> Result<(), AppError> {
        let file_path = if let Some(p) = path {
            std::path::PathBuf::from(p).join("CLAUDE.md")
        } else {
            let home = dirs::home_dir().ok_or(AppError::FileSystem(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                "Home directory not found",
            )))?;
            home.join(".claude").join("CLAUDE.md")
        };

        std::fs::write(&file_path, content)?;
        Ok(())
    }
}
