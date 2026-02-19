use rusqlite::Connection;

pub fn create_tables(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS vendors (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            tool        TEXT NOT NULL,
            name        TEXT NOT NULL,
            vendor_key  TEXT,
            base_url    TEXT NOT NULL,
            token       TEXT NOT NULL,
            model       TEXT,
            config_json TEXT,
            is_active   INTEGER DEFAULT 0,
            created_at  TEXT DEFAULT (datetime('now')),
            updated_at  TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        ",
    )?;
    Ok(())
}
