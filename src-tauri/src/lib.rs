mod tts;

use serde::Serialize;
use sysinfo::{System, ProcessesToUpdate, Disks};
use std::sync::Mutex;
use tauri::Emitter;
use std::time::Duration;
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, BufReader};

#[derive(Serialize)]
pub struct SystemStats {
    cpu: u8,
    ram: u8,
    disk: u8,
}

#[derive(Serialize)]
pub struct AppStat {
    name: String,
    cpu: f32,
}

#[derive(Serialize)]
pub struct TweakCatalogEntry {
    key: String,
    name: String,
    description: String,
    category: String,
}

#[derive(Serialize)]
pub struct AppCatalogEntry {
    key: String,
    name: String,
    description: String,
    category: String,
    winget: String,
    choco: String,
    link: String,
}

pub struct AppState {
    pub sys: Mutex<System>,
}

#[tauri::command]
fn get_system_stats(state: tauri::State<AppState>) -> SystemStats {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_cpu_all();
    sys.refresh_memory();

    let cpu_usage = sys.global_cpu_usage() as u8;
    let ram_usage = ((sys.used_memory() as f64 / sys.total_memory() as f64) * 100.0) as u8;

    let disks = Disks::new_with_refreshed_list();
    let disk_usage = if let Some(disk) = disks.iter().find(|d| {
        d.mount_point().to_string_lossy().eq_ignore_ascii_case("C:\\")
    }) {
        let total = disk.total_space();
        let available = disk.available_space();
        if total > 0 {
            (((total - available) as f64 / total as f64) * 100.0) as u8
        } else {
            0
        }
    } else if let Some(disk) = disks.iter().next() {
        let total = disk.total_space();
        let available = disk.available_space();
        if total > 0 {
            (((total - available) as f64 / total as f64) * 100.0) as u8
        } else {
            0
        }
    } else {
        0
    };

    SystemStats {
        cpu: cpu_usage,
        ram: ram_usage,
        disk: disk_usage,
    }
}

#[tauri::command]
fn get_top_processes(state: tauri::State<AppState>) -> Vec<AppStat> {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_processes(ProcessesToUpdate::All, true);
    
    let mut processes: Vec<_> = sys.processes().values().collect();
    processes.sort_by(|a, b| b.cpu_usage().partial_cmp(&a.cpu_usage()).unwrap());
    
    processes.into_iter().take(6).map(|p| AppStat {
        name: p.name().to_string_lossy().into_owned(),
        cpu: p.cpu_usage(),
    }).collect()
}

fn clean_json_string_controls(input: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(input.len() + input.len() / 10);
    let mut in_string = false;
    let mut escaped = false;
    let mut i = 0;
    while i < input.len() {
        let b = input[i];
        if escaped {
            out.push(b);
            escaped = false;
            i += 1;
            continue;
        }
        if b == b'\\' && in_string {
            out.push(b);
            escaped = true;
            i += 1;
            continue;
        }
        if b == b'"' {
            in_string = !in_string;
            out.push(b);
            i += 1;
            continue;
        }
        if in_string {
            if b == b'\r' {
                i += 1;
                if i < input.len() && input[i] == b'\n' {
                    out.push(b'\\');
                    out.push(b'n');
                    i += 1;
                } else {
                    out.push(b'\\');
                    out.push(b'n');
                }
                continue;
            }
            if b == b'\n' {
                out.push(b'\\');
                out.push(b'n');
                i += 1;
                continue;
            }
            if b == b'\t' {
                out.push(b'\\');
                out.push(b't');
                i += 1;
                continue;
            }
            if b < 0x20 {
                i += 1;
                continue;
            }
        }
        out.push(b);
        i += 1;
    }
    out
}

fn resolve_winutil_path(winutil_path: &str) -> Result<String, String> {
    let configured = std::path::Path::new(winutil_path);
    if configured.join("config").join("tweaks.json").exists() {
        return Ok(winutil_path.to_string());
    }
    
    // Try to find winutil relative to the exe
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.to_path_buf()));
    
    let candidates = exe_dir.map(|d| vec![
        d.join("winutil"),
        d.parent().map(|p| p.join("winutil")).unwrap_or_default(),
        d.parent().and_then(|p| p.parent()).map(|p| p.join("winutil")).unwrap_or_default(),
    ]).unwrap_or_default();

    candidates.into_iter()
        .find(|p| p.join("config").join("tweaks.json").exists())
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| format!(
            "WinUtil not found. Configured path '{}' does not exist. Please update the WinUtil Directory Path in Settings.",
            winutil_path
        ))
}

#[tauri::command]
async fn execute_winutil_tweak(app_handle: tauri::AppHandle, function_name: String, winutil_path: String) -> Result<(), String> {
    let resolved_path = resolve_winutil_path(&winutil_path)?;

    let tweaks_path = std::path::Path::new(&resolved_path).join("config").join("tweaks.json");
    let raw = std::fs::read(&tweaks_path)
        .map_err(|e| format!("Failed to read tweaks.json: {}", e))?;
    let cleaned = clean_json_string_controls(&raw);
    let content = String::from_utf8_lossy(&cleaned);
    let json: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse tweaks.json: {}", e))?;

    let tweak = json.get(&function_name)
        .ok_or_else(|| format!("Tweak '{}' not found in tweaks.json", function_name))?;

    // Build a self-contained PowerShell script that directly applies the tweak
    // WITHOUT requiring the WPF $sync context or sourcing all WinUtil functions.
    let mut ps_parts: Vec<String> = vec![
        "$ErrorActionPreference = 'Continue'".to_string(),
        format!("Write-Host 'Applying tweak: {}'", function_name),
    ];

    // 1. Apply registry entries directly
    if let Some(registry) = tweak.get("registry").and_then(|v| v.as_array()) {
        for reg in registry {
            let path = reg.get("Path").and_then(|v| v.as_str()).unwrap_or("");
            let name = reg.get("Name").and_then(|v| v.as_str()).unwrap_or("");
            let value = reg.get("Value").and_then(|v| v.as_str()).unwrap_or("");
            let reg_type = reg.get("Type").and_then(|v| v.as_str()).unwrap_or("String");
            
            if !path.is_empty() && !name.is_empty() {
                // Convert WinUtil type names to PowerShell Set-ItemProperty types
                let ps_type = match reg_type {
                    "DWord" => "DWord",
                    "QWord" => "QWord",
                    "Binary" => "Binary",
                    "ExpandString" => "ExpandString",
                    "MultiString" => "MultiString",
                    _ => "String",
                };
                
                // Ensure registry path exists before setting value
                ps_parts.push(format!(
                    r#"$regPath = "{path}"
if (-not (Test-Path $regPath)) {{
    New-Item -Path $regPath -Force | Out-Null
}}
Set-ItemProperty -Path $regPath -Name "{name}" -Value {value} -Type {ps_type} -Force"#,
                    path = path,
                    name = name,
                    value = if reg_type == "DWord" || reg_type == "QWord" { value.to_string() } else { format!("\"{}\"", value) },
                    ps_type = ps_type,
                ));
            }
        }
    }

    // 2. Apply service configurations directly
    if let Some(services) = tweak.get("service").and_then(|v| v.as_array()) {
        for svc in services {
            let name = svc.get("Name").and_then(|v| v.as_str()).unwrap_or("");
            let startup = svc.get("StartupType").and_then(|v| v.as_str()).unwrap_or("Manual");
            if !name.is_empty() {
                let ps_startup = match startup {
                    "Disabled" | "Disable" => "Disabled",
                    "Automatic" => "Automatic",
                    _ => "Manual",
                };
                ps_parts.push(format!(
                    r#"try {{ Set-Service -Name "{name}" -StartupType {startup} -ErrorAction SilentlyContinue }} catch {{ Write-Host "Warning: Could not set service {name}: $_" }}"#,
                    name = name,
                    startup = ps_startup,
                ));
            }
        }
    }

    // 3. Run InvokeScript blocks directly
    if let Some(scripts) = tweak.get("InvokeScript").and_then(|v| v.as_array()) {
        for script in scripts {
            if let Some(s) = script.as_str() {
                let trimmed = s.trim();
                if !trimmed.is_empty() {
                    ps_parts.push(format!("# InvokeScript\n{}", trimmed));
                }
            }
        }
    }

    ps_parts.push(format!("Write-Host 'Tweak {} applied successfully.'", function_name));

    let ps_script = ps_parts.join("\n");

    let mut child = tokio::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", &ps_script])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    let app_clone = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let _ = app_clone.emit("task-log", serde_json::json!({"text": line, "type": "info"}));
        }
    });

    let app_clone_err = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let _ = app_clone_err.emit("task-log", serde_json::json!({"text": line, "type": "error"}));
        }
    });

    let status = child.wait().await.map_err(|e| e.to_string())?;
    
    if status.success() {
        let _ = app_handle.emit("task-log", serde_json::json!({"text": format!("✅ Tweak '{}' completed.", function_name), "type": "success"}));
        Ok(())
    } else {
        let _ = app_handle.emit("task-log", serde_json::json!({"text": format!("⚠️ Tweak '{}' finished with warnings — check log above.", function_name), "type": "error"}));
        // Return Ok so the UI doesn't treat exit code warnings as fatal failures
        Ok(())
    }
}


#[tauri::command]
fn get_tweaks_catalog(winutil_path: String) -> Result<Vec<TweakCatalogEntry>, String> {
    let resolved_path = resolve_winutil_path(&winutil_path)?;
    let tweaks_path = std::path::Path::new(&resolved_path).join("config").join("tweaks.json");
    let raw = std::fs::read(&tweaks_path)
        .map_err(|e| format!("Failed to read tweaks.json: {}", e))?;
    let cleaned = clean_json_string_controls(&raw);
    let content = String::from_utf8_lossy(&cleaned);
    let json: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse tweaks.json: {}", e))?;

    let mut catalog = Vec::new();
    if let serde_json::Value::Object(map) = json {
        for (key, value) in map {
            let name = value.get("Content")
                .and_then(|v| v.as_str())
                .unwrap_or(&key)
                .to_string();
            let description = value.get("Description")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let category = value.get("category")
                .and_then(|v| v.as_str())
                .unwrap_or("General")
                .to_string();
            catalog.push(TweakCatalogEntry { key, name, description, category });
        }
    }

    catalog.sort_by(|a, b| a.key.cmp(&b.key));
    Ok(catalog)
}

#[tauri::command]
fn get_apps_catalog(winutil_path: String) -> Result<Vec<AppCatalogEntry>, String> {
    let resolved_path = resolve_winutil_path(&winutil_path)?;
    let apps_path = std::path::Path::new(&resolved_path).join("config").join("applications.json");
    let raw = std::fs::read(&apps_path)
        .map_err(|e| format!("Failed to read applications.json: {}", e))?;
    let cleaned = clean_json_string_controls(&raw);
    let content = String::from_utf8_lossy(&cleaned);
    let json: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse applications.json: {}", e))?;

    let mut catalog = Vec::new();
    if let serde_json::Value::Object(map) = json {
        for (key, value) in map {
            let name = value.get("content")
                .and_then(|v| v.as_str())
                .unwrap_or(&key)
                .to_string();
            let description = value.get("description")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let category = value.get("category")
                .and_then(|v| v.as_str())
                .unwrap_or("General")
                .to_string();
            let winget = value.get("winget")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let choco = value.get("choco")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let link = value.get("link")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            catalog.push(AppCatalogEntry { key, name, description, category, winget, choco, link });
        }
    }

    catalog.sort_by(|a, b| a.key.cmp(&b.key));
    Ok(catalog)
}

#[tauri::command]
async fn install_application(app_handle: tauri::AppHandle, app_key: String, winutil_path: String) -> Result<(), String> {
    let resolved_path = resolve_winutil_path(&winutil_path)?;
    let apps_path = std::path::Path::new(&resolved_path).join("config").join("applications.json");
    let raw = std::fs::read(&apps_path)
        .map_err(|e| format!("Failed to read applications.json: {}", e))?;
    let cleaned = clean_json_string_controls(&raw);
    let content = String::from_utf8_lossy(&cleaned);
    let json: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse applications.json: {}", e))?;

    let app_entry = json.get(&app_key)
        .ok_or_else(|| format!("Application '{}' not found in applications.json", app_key))?;

    let winget_id = app_entry.get("winget")
        .and_then(|v| v.as_str())
        .ok_or_else(|| format!("Application '{}' has no winget ID", app_key))?;

    if winget_id.is_empty() {
        return Err(format!("Application '{}' has empty winget ID", app_key));
    }

    let ps_script = format!(
        "Write-Host 'Installing {} via winget...'
$process = Start-Process -FilePath winget -ArgumentList 'install {} --accept-package-agreements --accept-source-agreements --source winget --silent' -NoNewWindow -Wait -PassThru
$exitCode = $process.ExitCode
if ($exitCode -eq 0) {{
    Write-Host 'Successfully installed {}.'
}} else {{
    Write-Host ('winget exited with code: ' + $exitCode)
}}
",
        app_key, winget_id, app_key
    );

    let mut child = tokio::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", &ps_script])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    let app_clone = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let _ = app_clone.emit("task-log", serde_json::json!({"text": line, "type": "info"}));
        }
    });

    let app_clone_err = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let _ = app_clone_err.emit("task-log", serde_json::json!({"text": line, "type": "error"}));
        }
    });

    let status = child.wait().await.map_err(|e| e.to_string())?;

    if status.success() {
        let _ = app_handle.emit("task-log", serde_json::json!({"text": format!("Application {} installed successfully.", app_key), "type": "success"}));
        Ok(())
    } else {
        let _ = app_handle.emit("task-log", serde_json::json!({"text": format!("Application {} installation failed.", app_key), "type": "error"}));
        Err("Application installation failed".to_string())
    }
}

#[tauri::command]
async fn uninstall_application(app_handle: tauri::AppHandle, app_key: String, winutil_path: String) -> Result<(), String> {
    let resolved_path = resolve_winutil_path(&winutil_path)?;
    let apps_path = std::path::Path::new(&resolved_path).join("config").join("applications.json");
    let raw = std::fs::read(&apps_path)
        .map_err(|e| format!("Failed to read applications.json: {}", e))?;
    let cleaned = clean_json_string_controls(&raw);
    let content = String::from_utf8_lossy(&cleaned);
    let json: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse applications.json: {}", e))?;

    let app_entry = json.get(&app_key)
        .ok_or_else(|| format!("Application '{}' not found in applications.json", app_key))?;

    let winget_id = app_entry.get("winget")
        .and_then(|v| v.as_str())
        .ok_or_else(|| format!("Application '{}' has no winget ID", app_key))?;

    if winget_id.is_empty() {
        return Err(format!("Application '{}' has empty winget ID", app_key));
    }

    let ps_script = format!(
        "Write-Host 'Uninstalling {} via winget...'
$process = Start-Process -FilePath winget -ArgumentList 'uninstall {} --source winget --silent' -NoNewWindow -Wait -PassThru
$exitCode = $process.ExitCode
if ($exitCode -eq 0) {{
    Write-Host 'Successfully uninstalled {}.'
}} else {{
    Write-Host ('winget exited with code: ' + $exitCode)
}}
",
        app_key, winget_id, app_key
    );

    let mut child = tokio::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", &ps_script])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    let app_clone = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let _ = app_clone.emit("task-log", serde_json::json!({"text": line, "type": "info"}));
        }
    });

    let app_clone_err = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let _ = app_clone_err.emit("task-log", serde_json::json!({"text": line, "type": "error"}));
        }
    });

    let status = child.wait().await.map_err(|e| e.to_string())?;

    if status.success() {
        let _ = app_handle.emit("task-log", serde_json::json!({"text": format!("Application {} uninstalled successfully.", app_key), "type": "success"}));
        Ok(())
    } else {
        let _ = app_handle.emit("task-log", serde_json::json!({"text": format!("Application {} uninstallation failed.", app_key), "type": "error"}));
        Err("Application uninstallation failed".to_string())
    }
}

#[derive(Serialize)]
pub struct SearchResult {
    title: String,
    url: String,
    snippet: String,
}

#[tauri::command]
async fn web_search(query: String, tavily_key: Option<String>, brave_key: Option<String>) -> Result<Vec<SearchResult>, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    // Try Tavily first
    if let Some(key) = tavily_key.filter(|k| !k.trim().is_empty()) {
        let body = serde_json::json!({
            "api_key": key,
            "query": query,
            "search_depth": "basic",
            "include_images": false,
            "max_results": 5
        });

        if let Ok(response) = client.post("https://api.tavily.com/search")
            .json(&body)
            .send()
            .await 
        {
            if response.status().is_success() {
                if let Ok(json) = response.json::<serde_json::Value>().await {
                    if let Some(results_arr) = json.get("results").and_then(|r| r.as_array()) {
                        let mut results = Vec::new();
                        for item in results_arr.iter().take(5) {
                            let title = item.get("title").and_then(|t| t.as_str()).unwrap_or_default().to_string();
                            let url = item.get("url").and_then(|t| t.as_str()).unwrap_or_default().to_string();
                            let snippet = item.get("content").and_then(|t| t.as_str()).unwrap_or_default().to_string();
                            if !title.is_empty() && !url.is_empty() {
                                results.push(SearchResult { title, url, snippet });
                            }
                        }
                        if !results.is_empty() {
                            return Ok(results);
                        }
                    }
                }
            }
        }
    }

    // Fallback to Brave
    if let Some(key) = brave_key.filter(|k| !k.trim().is_empty()) {
        let url = format!("https://api.search.brave.com/res/v1/web/search?q={}", urlencoding::encode(&query));
        
        if let Ok(response) = client.get(&url)
            .header("Accept", "application/json")
            .header("X-Subscription-Token", key)
            .send()
            .await 
        {
            if response.status().is_success() {
                if let Ok(json) = response.json::<serde_json::Value>().await {
                    if let Some(results_arr) = json.get("web").and_then(|w| w.get("results")).and_then(|r| r.as_array()) {
                        let mut results = Vec::new();
                        for item in results_arr.iter().take(5) {
                            let title = item.get("title").and_then(|t| t.as_str()).unwrap_or_default().to_string();
                            let url = item.get("url").and_then(|t| t.as_str()).unwrap_or_default().to_string();
                            let snippet = item.get("description").and_then(|t| t.as_str()).unwrap_or_default().to_string();
                            if !title.is_empty() && !url.is_empty() {
                                results.push(SearchResult { title, url, snippet });
                            }
                        }
                        if !results.is_empty() {
                            return Ok(results);
                        }
                    }
                }
            }
        }
    }

    Err("Search failed. Please ensure you have configured a valid Tavily or Brave API key in Settings.".to_string())
}

#[tauri::command]
async fn run_shell_command(command: String, cwd: Option<String>) -> Result<String, String> {
    // Safety check - block catastrophic commands
    let blocklist = [
        "format-volume", "format-secure", "clear-disk", 
        "remove-computer", "stop-computer", "restart-computer",
        "remove-item c:\\", "rd /s /q c:\\", "del /s /q c:\\"
    ];
    let lower_cmd = command.to_lowercase();
    for blocked in blocklist.iter() {
        if lower_cmd.contains(blocked) {
            return Err(format!("Command blocked by safety policy: contains '{}'", blocked));
        }
    }

    let mut cmd = tokio::process::Command::new("powershell");
    cmd.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", &command]);
    
    if let Some(dir) = cwd {
        if std::path::Path::new(&dir).exists() {
            cmd.current_dir(dir);
        }
    }

    let output = cmd.output()
        .await
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    
    let mut combined = String::new();
    if !stdout.is_empty() {
        combined.push_str(&stdout);
    }
    if !stderr.is_empty() {
        if !combined.is_empty() { combined.push_str("\n--- STDERR ---\n"); }
        combined.push_str(&stderr);
    }
    
    if combined.trim().is_empty() {
        if output.status.success() {
            Ok("(Command completed successfully with no output)".to_string())
        } else {
            Err(format!("Command failed with exit code: {}", output.status.code().unwrap_or(-1)))
        }
    } else {
        Ok(combined)
    }
}

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_dir(path: String) -> Result<String, String> {
    let mut entries = Vec::new();
    let dir = std::fs::read_dir(&path).map_err(|e| e.to_string())?;
    
    for entry in dir {
        if let Ok(entry) = entry {
            let file_type = entry.file_type().map(|t| {
                if t.is_dir() { "[DIR]" } else { "[FILE]" }
            }).unwrap_or("[UNKNOWN]");
            
            let file_name = entry.file_name().to_string_lossy().to_string();
            let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
            
            entries.push(format!("{} {} ({} bytes)", file_type, file_name, size));
        }
    }
    
    Ok(entries.join("\n"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut sys = System::new_all();
    sys.refresh_all();

    tauri::Builder::default()
        .manage(AppState {
            sys: Mutex::new(sys),
        })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            
            // Background thread for system stats updates
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(Duration::from_secs(2));
                loop {
                    interval.tick().await;
                    // In a real app we'd fetch actual stats here and emit
                    let _ = app_handle.emit("sys-tick", ());
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_system_stats,
            get_top_processes,
            execute_winutil_tweak,
            tts::edge_tts_synthesize,
            tts::edge_tts_list_voices,
            get_tweaks_catalog,
            get_apps_catalog,
            install_application,
            uninstall_application,
            web_search,
            run_shell_command,
            read_file,
            list_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
