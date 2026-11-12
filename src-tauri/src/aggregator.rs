// Built with care. — Huanst

use std::collections::{HashMap, HashSet};
use std::time::Instant;
use regex::Regex;
use crate::models::{AppStats, ClashConnection, DomainItem, DomainStats, TrafficSummary};

#[derive(Default)]
struct InternalAppStats {
    name: String,
    process_path: String,
    proxy_upload: u64,
    proxy_download: u64,
    direct_upload: u64,
    direct_download: u64,
    domains: HashMap<String, (u64, bool)>, // host -> (bytes, is_proxy)
}

#[derive(Default)]
struct InternalDomainStats {
    total_bytes: u64,
    proxy_bytes: u64,
    direct_bytes: u64,
    apps: HashSet<String>,
    rule: String,
}

pub struct TrafficAggregator {
    last_snapshots: HashMap<String, (u64, u64)>, // conn_id -> (upload, download)
    apps_map: HashMap<String, InternalAppStats>,
    domains_map: HashMap<String, InternalDomainStats>,
    total_proxy_bytes: u64,
    total_direct_bytes: u64,
    current_proxy_up_speed: u64,
    current_proxy_down_speed: u64,
    current_direct_up_speed: u64,
    current_direct_down_speed: u64,
    last_time: Instant,
    app_regex: Regex,
}

impl Default for TrafficAggregator {
    fn default() -> Self {
        Self::new()
    }
}

impl TrafficAggregator {
    pub fn new() -> Self {
        Self {
            last_snapshots: HashMap::new(),
            apps_map: HashMap::new(),
            domains_map: HashMap::new(),
            total_proxy_bytes: 0,
            total_direct_bytes: 0,
            current_proxy_up_speed: 0,
            current_proxy_down_speed: 0,
            current_direct_up_speed: 0,
            current_direct_down_speed: 0,
            last_time: Instant::now(),
            app_regex: Regex::new(r"/([^/]+)\.app/").unwrap(),
        }
    }

    pub fn extract_app_name(&self, path: Option<&str>, process: Option<&str>) -> String {
        if let Some(p) = process {
            if !p.trim().is_empty() {
                return p.trim_end_matches(".app").to_string();
            }
        }

        if let Some(path_str) = path {
            if let Some(captures) = self.app_regex.captures(path_str) {
                if let Some(matched) = captures.get(1) {
                    return matched.as_str().to_string();
                }
            }
            if let Some(last_seg) = path_str.split('/').next_back() {
                if !last_seg.trim().is_empty() {
                    return last_seg.to_string();
                }
            }
        }

        "系统 / 未知应用".to_string()
    }

    pub fn is_direct(&self, chains: &[String]) -> bool {
        if chains.is_empty() {
            return true;
        }
        if let Some(last) = chains.last() {
            last.eq_ignore_ascii_case("DIRECT")
        } else {
            true
        }
    }

    pub fn process_snapshot(&mut self, connections: &[ClashConnection]) -> TrafficSummary {
        let elapsed = self.last_time.elapsed().as_secs_f64().max(0.5);
        self.last_time = Instant::now();

        let mut current_ids = HashSet::new();
        let mut interval_proxy_up = 0u64;
        let mut interval_proxy_down = 0u64;
        let mut interval_direct_up = 0u64;
        let mut interval_direct_down = 0u64;

        for conn in connections {
            current_ids.insert(&conn.id);
            let is_direct = self.is_direct(&conn.chains);
            let app_name = self.extract_app_name(
                conn.metadata.process_path.as_deref(),
                conn.metadata.process.as_deref(),
            );
            let host = conn
                .metadata
                .host
                .clone()
                .or_else(|| conn.metadata.destination_ip.clone())
                .unwrap_or_else(|| "未知地址".to_string());

            let (prev_up, prev_down) = self
                .last_snapshots
                .get(&conn.id)
                .copied()
                .unwrap_or((conn.upload, conn.download));

            let delta_up = conn.upload.saturating_sub(prev_up);
            let delta_down = conn.download.saturating_sub(prev_down);
            let total_delta = delta_up + delta_down;

            self.last_snapshots.insert(conn.id.clone(), (conn.upload, conn.download));

            if is_direct {
                interval_direct_up += delta_up;
                interval_direct_down += delta_down;
                self.total_direct_bytes += total_delta;
            } else {
                interval_proxy_up += delta_up;
                interval_proxy_down += delta_down;
                self.total_proxy_bytes += total_delta;
            }

            // Update app map
            let app_entry = self.apps_map.entry(app_name.clone()).or_insert_with(|| InternalAppStats {
                name: app_name.clone(),
                process_path: conn.metadata.process_path.clone().unwrap_or_default(),
                ..Default::default()
            });

            if is_direct {
                app_entry.direct_upload += delta_up;
                app_entry.direct_download += delta_down;
            } else {
                app_entry.proxy_upload += delta_up;
                app_entry.proxy_download += delta_down;
            }

            let dom_entry = app_entry.domains.entry(host.clone()).or_insert((0, !is_direct));
            dom_entry.0 += total_delta;

            // Update domain map
            let domain_stat = self.domains_map.entry(host.clone()).or_insert_with(|| InternalDomainStats {
                rule: conn.rule.clone().unwrap_or_else(|| "DIRECT".to_string()),
                ..Default::default()
            });

            domain_stat.total_bytes += total_delta;
            if is_direct {
                domain_stat.direct_bytes += total_delta;
            } else {
                domain_stat.proxy_bytes += total_delta;
            }
            domain_stat.apps.insert(app_name);
        }

        // Clean closed connections
        self.last_snapshots.retain(|k, _| current_ids.contains(k));

        // Speed calculation
        self.current_proxy_up_speed = (interval_proxy_up as f64 / elapsed).round() as u64;
        self.current_proxy_down_speed = (interval_proxy_down as f64 / elapsed).round() as u64;
        self.current_direct_up_speed = (interval_direct_up as f64 / elapsed).round() as u64;
        self.current_direct_down_speed = (interval_direct_down as f64 / elapsed).round() as u64;

        // Convert Apps list
        let mut apps: Vec<AppStats> = self
            .apps_map
            .values()
            .map(|a| {
                let total_proxy = a.proxy_upload + a.proxy_download;
                let total_direct = a.direct_upload + a.direct_download;
                let mut top_domains: Vec<DomainItem> = a
                    .domains
                    .iter()
                    .map(|(h, (bytes, is_proxy))| DomainItem {
                        host: h.clone(),
                        bytes: *bytes,
                        is_proxy: *is_proxy,
                    })
                    .collect();
                top_domains.sort_by(|x, y| y.bytes.cmp(&x.bytes));
                top_domains.truncate(5);

                AppStats {
                    name: a.name.clone(),
                    process_path: a.process_path.clone(),
                    proxy_upload: a.proxy_upload,
                    proxy_download: a.proxy_download,
                    direct_upload: a.direct_upload,
                    direct_download: a.direct_download,
                    total_proxy,
                    total_direct,
                    total_bytes: total_proxy + total_direct,
                    top_domains,
                }
            })
            .collect();
        apps.sort_by(|x, y| y.total_bytes.cmp(&x.total_bytes));

        // Convert Domains list
        let mut domains: Vec<DomainStats> = self
            .domains_map
            .iter()
            .map(|(h, d)| DomainStats {
                host: h.clone(),
                total_bytes: d.total_bytes,
                proxy_bytes: d.proxy_bytes,
                direct_bytes: d.direct_bytes,
                associated_apps: d.apps.iter().cloned().collect(),
                rule: d.rule.clone(),
            })
            .collect();
        domains.sort_by(|x, y| y.total_bytes.cmp(&x.total_bytes));
        domains.truncate(30);

        TrafficSummary {
            total_proxy_bytes: self.total_proxy_bytes,
            total_direct_bytes: self.total_direct_bytes,
            current_proxy_up_speed: self.current_proxy_up_speed,
            current_proxy_down_speed: self.current_proxy_down_speed,
            current_direct_up_speed: self.current_direct_up_speed,
            current_direct_down_speed: self.current_direct_down_speed,
            active_connections_count: connections.len(),
            apps,
            domains,
        }
    }

    pub fn reset(&mut self) {
        self.last_snapshots.clear();
        self.apps_map.clear();
        self.domains_map.clear();
        self.total_proxy_bytes = 0;
        self.total_direct_bytes = 0;
        self.current_proxy_up_speed = 0;
        self.current_proxy_down_speed = 0;
        self.current_direct_up_speed = 0;
        self.current_direct_down_speed = 0;
    }
}
