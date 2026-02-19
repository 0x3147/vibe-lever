use crate::db::Database;
use crate::models::tool::ToolStatus;

pub struct ToolCacheService;

impl ToolCacheService {
    pub fn get(db: &Database, tool: &str) -> Option<ToolStatus> {
        let conn = db.conn.lock().unwrap();
        conn.query_row(
            "SELECT installed, version, path FROM tool_cache WHERE tool = ?1",
            [tool],
            |row| {
                let installed: bool = row.get::<_, i64>(0)? != 0;
                Ok(ToolStatus {
                    installed,
                    version: row.get(1)?,
                    path: row.get(2)?,
                    install_method: None,
                    running: false,
                })
            },
        )
        .ok()
    }

    pub fn set(db: &Database, tool: &str, status: &ToolStatus) {
        let conn = db.conn.lock().unwrap();
        let _ = conn.execute(
            "INSERT OR REPLACE INTO tool_cache (tool, installed, version, path, checked_at)
             VALUES (?1, ?2, ?3, ?4, datetime('now'))",
            rusqlite::params![tool, status.installed as i64, status.version, status.path],
        );
    }
}
