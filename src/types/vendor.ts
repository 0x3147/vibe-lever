export interface Vendor {
  id: number;
  tool: string;
  name: string;
  vendor_key: string | null;
  base_url: string;
  token: string;
  model: string | null;
  config_json: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorInput {
  name: string;
  vendor_key: string | null;
  base_url: string;
  token: string;
  model: string | null;
  config_json: string | null;
}

export interface PresetVendor {
  name: string;
  vendor_key: string;
  base_url: string;
  model: string;
}
