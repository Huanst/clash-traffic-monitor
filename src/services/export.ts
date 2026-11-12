// Built with care. — Huanst

import { GlobalTrafficSummary } from "../types";
import { formatBytes } from "./aggregator";

function triggerDownload(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = now.getFullYear();
  const MM = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${yyyy}${MM}${dd}_${hh}${mm}${ss}`;
}

export function exportSummaryToCsv(summary: GlobalTrafficSummary | null): void {
  if (!summary) return;

  const totalAll = summary.totalProxyBytes + summary.totalDirectBytes;
  const proxyPercent = totalAll > 0 ? ((summary.totalProxyBytes / totalAll) * 100).toFixed(1) : "0.0";
  const directPercent = totalAll > 0 ? ((summary.totalDirectBytes / totalAll) * 100).toFixed(1) : "0.0";

  const rows: string[] = [];

  // UTF-8 BOM for Mac Numbers / Excel compatibility
  rows.push("\uFEFF=== Clash 流量监控统计报告 ===");
  rows.push(`导出时间,${new Date().toLocaleString()}`);
  rows.push(`总代理流量,${formatBytes(summary.totalProxyBytes)} (${summary.totalProxyBytes} Bytes)`);
  rows.push(`总直连流量,${formatBytes(summary.totalDirectBytes)} (${summary.totalDirectBytes} Bytes)`);
  rows.push(`分流占比,代理 ${proxyPercent}% / 直连 ${directPercent}%`);
  rows.push(`活跃连接数,${summary.activeConnectionsCount}`);
  rows.push("");

  // Section 1: Apps
  rows.push("=== 软件流量排行 (Apps) ===");
  rows.push("应用名称,分流类型,总消耗,代理消耗,直连消耗,完整进程路径,访问高频目标");

  for (const app of summary.apps) {
    const types: string[] = [];
    if (app.totalProxy > 0) types.push("代理");
    if (app.totalDirect > 0) types.push("直连");
    const typeStr = types.join("+") || "无";

    const topDomainsStr = app.topDomains
      .map((d) => `${d.host}(${formatBytes(d.bytes)})`)
      .join(" | ")
      .replace(/"/g, '""');

    const appName = `"${app.name.replace(/"/g, '""')}"`;
    const procPath = `"${app.processPath.replace(/"/g, '""')}"`;
    const topDom = `"${topDomainsStr}"`;

    rows.push(
      `${appName},${typeStr},${formatBytes(app.totalBytes)},${formatBytes(app.totalProxy)},${formatBytes(app.totalDirect)},${procPath},${topDom}`
    );
  }

  rows.push("");

  // Section 2: Domains
  rows.push("=== 域名访问明细 (Domains) ===");
  rows.push("目标域名,总消耗,代理消耗,直连消耗,分流规则,关联软件");

  for (const dom of summary.domains) {
    const host = `"${dom.host.replace(/"/g, '""')}"`;
    const rule = `"${(dom.rule || "DIRECT").replace(/"/g, '""')}"`;
    const appsStr = `"${dom.associatedApps.join("; ").replace(/"/g, '""')}"`;

    rows.push(
      `${host},${formatBytes(dom.totalBytes)},${formatBytes(dom.proxyBytes)},${formatBytes(dom.directBytes)},${rule},${appsStr}`
    );
  }

  const csvContent = rows.join("\r\n");
  const fileName = `clash_traffic_report_${getTimestamp()}.csv`;
  triggerDownload(csvContent, fileName, "text/csv;charset=utf-8;");
}

export function exportSummaryToJson(summary: GlobalTrafficSummary | null): void {
  if (!summary) return;

  const exportData = {
    exportedAt: new Date().toISOString(),
    totalProxyBytes: summary.totalProxyBytes,
    totalDirectBytes: summary.totalDirectBytes,
    activeConnectionsCount: summary.activeConnectionsCount,
    apps: summary.apps,
    domains: summary.domains,
    activeConnections: summary.activeConnections,
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  const fileName = `clash_traffic_dump_${getTimestamp()}.json`;
  triggerDownload(jsonContent, fileName, "application/json;charset=utf-8;");
}
