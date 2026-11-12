// Built with care. — Huanst

use std::sync::{Arc, RwLock};
use std::time::Duration;
use futures_util::StreamExt;
use tauri::AppHandle;
use tokio_tungstenite::connect_async;
use url::Url;

use crate::aggregator::TrafficAggregator;
use crate::models::{ClashSnapshotResponse, TrafficSummary};

pub fn format_bytes_speed(bytes: u64) -> String {
    if bytes == 0 {
        return "0 B/s".to_string();
    }
    let k = 1024.0;
    let b = bytes as f64;
    if b < k {
        format!("{:.0} B/s", b)
    } else if b < k * k {
        format!("{:.1} K/s", b / k)
    } else if b < k * k * k {
        format!("{:.1} M/s", b / (k * k))
    } else {
        format!("{:.1} G/s", b / (k * k * k))
    }
}

pub struct ClashManager {
    pub aggregator: Arc<RwLock<TrafficAggregator>>,
    pub api_url: Arc<RwLock<String>>,
    pub secret: Arc<RwLock<String>>,
    pub is_connected: Arc<RwLock<bool>>,
}

impl ClashManager {
    pub fn new() -> Self {
        Self {
            aggregator: Arc::new(RwLock::new(TrafficAggregator::new())),
            api_url: Arc::new(RwLock::new("http://127.0.0.1:9097".to_string())),
            secret: Arc::new(RwLock::new("".to_string())),
            is_connected: Arc::new(RwLock::new(false)),
        }
    }

    pub fn start_background_loop(&self, app_handle: AppHandle) {
        let aggregator = Arc::clone(&self.aggregator);
        let api_url = Arc::clone(&self.api_url);
        let secret = Arc::clone(&self.secret);
        let is_connected = Arc::clone(&self.is_connected);

        std::thread::spawn(move || {
            let rt = match tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()
            {
                Ok(runtime) => runtime,
                Err(err) => {
                    eprintln!("Failed to initialize Tokio runtime: {}", err);
                    return;
                }
            };

            rt.block_on(async move {
                loop {
                    let current_url = {
                        api_url.read().unwrap().clone()
                    };
                    let current_secret = {
                        secret.read().unwrap().clone()
                    };

                    let mut ws_url = match Url::parse(&current_url) {
                        Ok(parsed) => {
                            let ws_scheme = if parsed.scheme() == "https" { "wss" } else { "ws" };
                            let host_port = parsed.host_str().unwrap_or("127.0.0.1");
                            let port = parsed.port().unwrap_or(9097);
                            format!("{}://{}:{}/connections", ws_scheme, host_port, port)
                        }
                        Err(_) => "ws://127.0.0.1:9097/connections".to_string(),
                    };

                    if !current_secret.is_empty() {
                        ws_url.push_str(&format!("?token={}", current_secret));
                    }

                    match connect_async(&ws_url).await {
                        Ok((mut ws_stream, _)) => {
                            if let Ok(mut conn) = is_connected.write() {
                                *conn = true;
                            }

                            while let Some(msg) = ws_stream.next().await {
                                match msg {
                                    Ok(tokio_tungstenite::tungstenite::Message::Text(text)) => {
                                        if let Ok(snapshot) = serde_json::from_str::<ClashSnapshotResponse>(&text) {
                                            let summary = {
                                                if let Ok(mut agg) = aggregator.write() {
                                                    agg.process_snapshot(&snapshot.connections)
                                                } else {
                                                    continue;
                                                }
                                            };

                                            // Keep tray clean: just update tooltip on hover, title stays "🚀"
                                            if let Some(tray) = app_handle.tray_by_id("main_tray") {
                                                let tooltip = format!(
                                                    "Clash 流量监控\n🚀 代理: {}\n⚡️ 直连: {}",
                                                    format_bytes_speed(summary.current_proxy_down_speed),
                                                    format_bytes_speed(summary.current_direct_down_speed)
                                                );
                                                let _ = tray.set_tooltip(Some(tooltip));
                                            }
                                        }
                                    }
                                    Ok(tokio_tungstenite::tungstenite::Message::Close(_)) => {
                                        break;
                                    }
                                    Err(_) => {
                                        break;
                                    }
                                    _ => {}
                                }
                            }
                        }
                        Err(_) => {
                            if let Ok(mut conn) = is_connected.write() {
                                *conn = false;
                            }
                            if let Some(tray) = app_handle.tray_by_id("main_tray") {
                                let _ = tray.set_tooltip(Some("Clash 流量监控 (未连接)".to_string()));
                            }
                        }
                    }

                    if let Ok(mut conn) = is_connected.write() {
                        *conn = false;
                    }
                    tokio::time::sleep(Duration::from_secs(3)).await;
                }
            });
        });
    }

    pub fn get_summary(&self) -> TrafficSummary {
        let mut agg = self.aggregator.write().unwrap();
        agg.process_snapshot(&[])
    }

    pub fn reset(&self) {
        let mut agg = self.aggregator.write().unwrap();
        agg.reset();
    }
}
