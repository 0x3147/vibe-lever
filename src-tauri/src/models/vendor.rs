use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Vendor {
    pub id: i64,
    pub tool: String,
    pub name: String,
    pub vendor_key: Option<String>,
    pub base_url: String,
    pub token: String,
    pub model: Option<String>,
    pub config_json: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct VendorInput {
    pub name: String,
    pub vendor_key: Option<String>,
    pub base_url: String,
    pub token: String,
    pub model: Option<String>,
    pub config_json: Option<String>,
}
