use crate::db::Database;
use crate::errors::AppError;
use crate::models::settings::AppSettings;
use rusqlite::params;

pub struct SettingsService;

impl SettingsService {
    pub fn get_all(db: &Database) -> Result<AppSettings, AppError> {
        let conn = db.conn.lock().unwrap();
        let mut settings = AppSettings::default();

        if let Ok(val) = conn.query_row("SELECT value FROM settings WHERE key = 'theme'", [], |r| {
            r.get::<_, String>(0)
        }) {
            settings.theme = val;
        }
        if let Ok(val) = conn.query_row(
            "SELECT value FROM settings WHERE key = 'language'",
            [],
            |r| r.get::<_, String>(0),
        ) {
            settings.language = val;
        }
        if let Ok(val) = conn.query_row(
            "SELECT value FROM settings WHERE key = 'last_tool'",
            [],
            |r| r.get::<_, String>(0),
        ) {
            settings.last_tool = val;
        }
        Ok(settings)
    }

    pub fn update(db: &Database, key: &str, value: &str) -> Result<(), AppError> {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, value],
        )?;
        Ok(())
    }
}
