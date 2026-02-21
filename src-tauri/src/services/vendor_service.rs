use crate::db::Database;
use crate::errors::AppError;
use crate::models::vendor::{Vendor, VendorInput};
use rusqlite::params;

pub struct VendorService;

impl VendorService {
    pub fn get_all(db: &Database, tool: &str) -> Result<Vec<Vendor>, AppError> {
        let conn = db.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, tool, name, vendor_key, base_url, token, model, config_json, is_active, created_at, updated_at
             FROM vendors WHERE tool = ? ORDER BY created_at DESC"
        )?;

        let vendors = stmt
            .query_map(params![tool], |row| {
                Ok(Vendor {
                    id: row.get(0)?,
                    tool: row.get(1)?,
                    name: row.get(2)?,
                    vendor_key: row.get(3)?,
                    base_url: row.get(4)?,
                    token: row.get(5)?,
                    model: row.get(6)?,
                    config_json: row.get(7)?,
                    is_active: row.get::<_, i64>(8)? != 0,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(vendors)
    }

    pub fn add(db: &Database, tool: &str, input: VendorInput) -> Result<Vendor, AppError> {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO vendors (tool, name, vendor_key, base_url, token, model, config_json)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                tool,
                input.name,
                input.vendor_key,
                input.base_url,
                input.token,
                input.model,
                input.config_json
            ],
        )?;
        let id = conn.last_insert_rowid();
        drop(conn);
        Self::get_by_id(db, id)
    }

    pub fn get_by_id(db: &Database, id: i64) -> Result<Vendor, AppError> {
        let conn = db.conn.lock().unwrap();
        let vendor = conn.query_row(
            "SELECT id, tool, name, vendor_key, base_url, token, model, config_json, is_active, created_at, updated_at
             FROM vendors WHERE id = ?",
            params![id],
            |row| {
                Ok(Vendor {
                    id: row.get(0)?,
                    tool: row.get(1)?,
                    name: row.get(2)?,
                    vendor_key: row.get(3)?,
                    base_url: row.get(4)?,
                    token: row.get(5)?,
                    model: row.get(6)?,
                    config_json: row.get(7)?,
                    is_active: row.get::<_, i64>(8)? != 0,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            }
        )?;
        Ok(vendor)
    }

    pub fn update(db: &Database, id: i64, input: VendorInput) -> Result<Vendor, AppError> {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "UPDATE vendors SET name=?1, vendor_key=?2, base_url=?3, token=?4, model=?5, config_json=?6, updated_at=datetime('now')
             WHERE id=?7",
            params![input.name, input.vendor_key, input.base_url, input.token, input.model, input.config_json, id],
        )?;
        drop(conn);
        Self::get_by_id(db, id)
    }

    pub fn delete(db: &Database, id: i64) -> Result<(), AppError> {
        let conn = db.conn.lock().unwrap();
        conn.execute("DELETE FROM vendors WHERE id = ?", params![id])?;
        Ok(())
    }

    pub fn activate(db: &Database, tool: &str, id: i64) -> Result<(), AppError> {
        let conn = db.conn.lock().unwrap();
        // 先取消所有同类工具的激活
        conn.execute(
            "UPDATE vendors SET is_active = 0 WHERE tool = ?",
            params![tool],
        )?;
        // 激活指定的
        conn.execute("UPDATE vendors SET is_active = 1 WHERE id = ?", params![id])?;
        Ok(())
    }
}
