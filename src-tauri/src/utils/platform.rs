use crate::models::tool::PlatformInfo;

pub fn get_platform_info() -> PlatformInfo {
    let platform = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    let platform_name = match platform {
        "windows" => "Windows",
        "macos" => "macOS",
        "linux" => "Linux",
        _ => "Unknown",
    };

    PlatformInfo {
        platform: platform.to_string(),
        platform_name: platform_name.to_string(),
        arch: arch.to_string(),
    }
}
