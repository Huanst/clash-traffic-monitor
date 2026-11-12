// Built with care. — Huanst

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ClashMetadata {
    pub network: Option<String>,
    #[serde(rename = "type")]
    pub conn_type: Option<String>,
    #[serde(rename = "sourceIP")]
    pub source_ip: Option<String>,
    #[serde(rename = "destinationIP")]
    pub destination_ip: Option<String>,
    #[serde(rename = "sourcePort")]
    pub source_port: Option<String>,
    #[serde(rename = "destinationPort")]
    pub destination_port: Option<String>,
    pub host: Option<String>,
    pub process: Option<String>,
    #[serde(rename = "processPath")]
    pub process_path: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ClashConnection {
    pub id: String,
    pub metadata: ClashMetadata,
    pub upload: u64,
    pub download: u64,
    pub start: Option<String>,
    pub chains: Vec<String>,
    pub rule: Option<String>,
    #[serde(rename = "rulePayload")]
    pub rule_payload: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ClashSnapshotResponse {
    #[serde(rename = "downloadTotal")]
    pub download_total: Option<u64>,
    #[serde(rename = "uploadTotal")]
    pub upload_total: Option<u64>,
    pub connections: Vec<ClashConnection>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainItem {
    pub host: String,
    pub bytes: u64,
    #[serde(rename = "isProxy")]
    pub is_proxy: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppStats {
    pub name: String,
    #[serde(rename = "processPath")]
    pub process_path: String,
    #[serde(rename = "proxyUpload")]
    pub proxy_upload: u64,
    #[serde(rename = "proxyDownload")]
    pub proxy_download: u64,
    #[serde(rename = "directUpload")]
    pub direct_upload: u64,
    #[serde(rename = "directDownload")]
    pub direct_download: u64,
    #[serde(rename = "totalProxy")]
    pub total_proxy: u64,
    #[serde(rename = "totalDirect")]
    pub total_direct: u64,
    #[serde(rename = "totalBytes")]
    pub total_bytes: u64,
    #[serde(rename = "topDomains")]
    pub top_domains: Vec<DomainItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainStats {
    pub host: String,
    #[serde(rename = "totalBytes")]
    pub total_bytes: u64,
    #[serde(rename = "proxyBytes")]
    pub proxy_bytes: u64,
    #[serde(rename = "directBytes")]
    pub direct_bytes: u64,
    #[serde(rename = "associatedApps")]
    pub associated_apps: Vec<String>,
    pub rule: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficSummary {
    #[serde(rename = "totalProxyBytes")]
    pub total_proxy_bytes: u64,
    #[serde(rename = "totalDirectBytes")]
    pub total_direct_bytes: u64,
    #[serde(rename = "currentProxyUpSpeed")]
    pub current_proxy_up_speed: u64,
    #[serde(rename = "currentProxyDownSpeed")]
    pub current_proxy_down_speed: u64,
    #[serde(rename = "currentDirectUpSpeed")]
    pub current_direct_up_speed: u64,
    #[serde(rename = "currentDirectDownSpeed")]
    pub current_direct_down_speed: u64,
    #[serde(rename = "activeConnectionsCount")]
    pub active_connections_count: usize,
    pub apps: Vec<AppStats>,
    pub domains: Vec<DomainStats>,
}
