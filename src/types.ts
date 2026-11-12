export interface ClashMetadata {
  network: string;
  type: string;
  sourceIP: string;
  destinationIP: string;
  sourcePort: string;
  destinationPort: string;
  host: string;
  process?: string;
  processPath?: string;
}

export interface RawConnection {
  id: string;
  metadata: ClashMetadata;
  upload: number;
  download: number;
  start: string;
  chains: string[];
  rule: string;
  rulePayload?: string;
}

export interface RawConnectionsResponse {
  downloadTotal: number;
  uploadTotal: number;
  connections: RawConnection[];
}

export interface DomainItem {
  host: string;
  bytes: number;
  isProxy: boolean;
}

export interface AppTrafficStats {
  name: string;
  processPath: string;
  proxyUpload: number;
  proxyDownload: number;
  directUpload: number;
  directDownload: number;
  totalProxy: number;
  totalDirect: number;
  totalBytes: number;
  topDomains: DomainItem[];
}

export interface DomainTrafficStats {
  host: string;
  totalBytes: number;
  proxyBytes: number;
  directBytes: number;
  associatedApps: string[];
  rule: string;
}

export interface GlobalTrafficSummary {
  totalProxyBytes: number;
  totalDirectBytes: number;
  currentProxyUpSpeed: number;
  currentProxyDownSpeed: number;
  currentDirectUpSpeed: number;
  currentDirectDownSpeed: number;
  activeConnectionsCount: number;
  apps: AppTrafficStats[];
  domains: DomainTrafficStats[];
  activeConnections: RawConnection[];
}

export interface ClashConfig {
  apiUrl: string;
  secret: string;
}
