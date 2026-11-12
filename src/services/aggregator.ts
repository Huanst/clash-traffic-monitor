// Built with care. — Huanst

import {
  RawConnection,
  AppTrafficStats,
  DomainTrafficStats,
  GlobalTrafficSummary,
  DomainItem,
} from "../types";

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
}

export function extractAppName(processPath?: string, processName?: string): string {
  if (processName && processName.trim()) {
    return processName.replace(/\.app$/, "");
  }
  if (!processPath || !processPath.trim()) {
    return "系统 / 未知应用";
  }

  // Handle macOS .app bundle paths: .../Google Chrome.app/Contents/MacOS/...
  const appMatch = processPath.match(/\/([^/]+)\.app\//);
  if (appMatch && appMatch[1]) {
    return appMatch[1];
  }

  // Fallback to binary basename
  const parts = processPath.split("/");
  return parts[parts.length - 1] || "系统 / 未知应用";
}

export function isDirectConnection(chains: string[]): boolean {
  if (!chains || chains.length === 0) return true;
  const lastHop = chains[chains.length - 1].toUpperCase();
  return lastHop === "DIRECT" || chains.every((c) => c.toUpperCase() === "DIRECT");
}

export class TrafficAggregator {
  private lastSnapshot = new Map<string, { upload: number; download: number }>();
  private appStatsMap = new Map<
    string,
    {
      name: string;
      processPath: string;
      proxyUpload: number;
      proxyDownload: number;
      directUpload: number;
      directDownload: number;
      domains: Map<string, { bytes: number; isProxy: boolean }>;
    }
  >();
  private domainStatsMap = new Map<
    string,
    {
      totalBytes: number;
      proxyBytes: number;
      directBytes: number;
      apps: Set<string>;
      rule: string;
    }
  >();

  private totalProxyBytes = 0;
  private totalDirectBytes = 0;

  // Real-time speed tracking
  private currentProxyUpSpeed = 0;
  private currentProxyDownSpeed = 0;
  private currentDirectUpSpeed = 0;
  private currentDirectDownSpeed = 0;
  private lastProcessTime = Date.now();

  public processConnections(connections: RawConnection[]): GlobalTrafficSummary {
    const now = Date.now();
    const timeDeltaSec = Math.max((now - this.lastProcessTime) / 1000, 0.5);
    this.lastProcessTime = now;

    const currentIds = new Set<string>();
    let intervalProxyUp = 0;
    let intervalProxyDown = 0;
    let intervalDirectUp = 0;
    let intervalDirectDown = 0;

    for (const conn of connections) {
      currentIds.add(conn.id);
      const isDirect = isDirectConnection(conn.chains);
      const appName = extractAppName(conn.metadata?.processPath, conn.metadata?.process);
      const host = conn.metadata?.host || conn.metadata?.destinationIP || "未知地址";

      const prev = this.lastSnapshot.get(conn.id);
      let deltaUp = 0;
      let deltaDown = 0;

      if (prev) {
        deltaUp = Math.max(0, conn.upload - prev.upload);
        deltaDown = Math.max(0, conn.download - prev.download);
      } else {
        // Newly discovered connection
        deltaUp = conn.upload;
        deltaDown = conn.download;
      }

      this.lastSnapshot.set(conn.id, { upload: conn.upload, download: conn.download });

      const totalDelta = deltaUp + deltaDown;

      // Speeds
      if (isDirect) {
        intervalDirectUp += deltaUp;
        intervalDirectDown += deltaDown;
        this.totalDirectBytes += totalDelta;
      } else {
        intervalProxyUp += deltaUp;
        intervalProxyDown += deltaDown;
        this.totalProxyBytes += totalDelta;
      }

      // Aggregate App Stats
      let app = this.appStatsMap.get(appName);
      if (!app) {
        app = {
          name: appName,
          processPath: conn.metadata?.processPath || "",
          proxyUpload: 0,
          proxyDownload: 0,
          directUpload: 0,
          directDownload: 0,
          domains: new Map(),
        };
        this.appStatsMap.set(appName, app);
      }

      if (isDirect) {
        app.directUpload += deltaUp;
        app.directDownload += deltaDown;
      } else {
        app.proxyUpload += deltaUp;
        app.proxyDownload += deltaDown;
      }

      const domainEntry = app.domains.get(host) || { bytes: 0, isProxy: !isDirect };
      domainEntry.bytes += totalDelta;
      app.domains.set(host, domainEntry);

      // Aggregate Domain Stats
      let domainStat = this.domainStatsMap.get(host);
      if (!domainStat) {
        domainStat = {
          totalBytes: 0,
          proxyBytes: 0,
          directBytes: 0,
          apps: new Set(),
          rule: conn.rule || "DIRECT",
        };
        this.domainStatsMap.set(host, domainStat);
      }
      domainStat.totalBytes += totalDelta;
      if (isDirect) {
        domainStat.directBytes += totalDelta;
      } else {
        domainStat.proxyBytes += totalDelta;
      }
      domainStat.apps.add(appName);
    }

    // Clean up closed connections from snapshot
    for (const id of this.lastSnapshot.keys()) {
      if (!currentIds.has(id)) {
        this.lastSnapshot.delete(id);
      }
    }

    // Compute speeds per second
    this.currentProxyUpSpeed = Math.round(intervalProxyUp / timeDeltaSec);
    this.currentProxyDownSpeed = Math.round(intervalProxyDown / timeDeltaSec);
    this.currentDirectUpSpeed = Math.round(intervalDirectUp / timeDeltaSec);
    this.currentDirectDownSpeed = Math.round(intervalDirectDown / timeDeltaSec);

    // Prepare sorted Apps list
    const apps: AppTrafficStats[] = Array.from(this.appStatsMap.values()).map((item) => {
      const totalProxy = item.proxyUpload + item.proxyDownload;
      const totalDirect = item.directUpload + item.directDownload;
      const totalBytes = totalProxy + totalDirect;

      const topDomains: DomainItem[] = Array.from(item.domains.entries())
        .map(([h, val]) => ({
          host: h,
          bytes: val.bytes,
          isProxy: val.isProxy,
        }))
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 5);

      return {
        name: item.name,
        processPath: item.processPath,
        proxyUpload: item.proxyUpload,
        proxyDownload: item.proxyDownload,
        directUpload: item.directUpload,
        directDownload: item.directDownload,
        totalProxy,
        totalDirect,
        totalBytes,
        topDomains,
      };
    }).sort((a, b) => b.totalBytes - a.totalBytes);

    // Prepare sorted Domains list
    const domains: DomainTrafficStats[] = Array.from(this.domainStatsMap.entries())
      .map(([h, item]) => ({
        host: h,
        totalBytes: item.totalBytes,
        proxyBytes: item.proxyBytes,
        directBytes: item.directBytes,
        associatedApps: Array.from(item.apps),
        rule: item.rule,
      }))
      .sort((a, b) => b.totalBytes - a.totalBytes)
      .slice(0, 30);

    return {
      totalProxyBytes: this.totalProxyBytes,
      totalDirectBytes: this.totalDirectBytes,
      currentProxyUpSpeed: this.currentProxyUpSpeed,
      currentProxyDownSpeed: this.currentProxyDownSpeed,
      currentDirectUpSpeed: this.currentDirectUpSpeed,
      currentDirectDownSpeed: this.currentDirectDownSpeed,
      activeConnectionsCount: connections.length,
      apps,
      domains,
      activeConnections: connections.slice(0, 20),
    };
  }

  public reset(): void {
    this.lastSnapshot.clear();
    this.appStatsMap.clear();
    this.domainStatsMap.clear();
    this.totalProxyBytes = 0;
    this.totalDirectBytes = 0;
    this.currentProxyUpSpeed = 0;
    this.currentProxyDownSpeed = 0;
    this.currentDirectUpSpeed = 0;
    this.currentDirectDownSpeed = 0;
  }
}
