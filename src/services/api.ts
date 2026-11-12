import { ClashConfig, GlobalTrafficSummary, RawConnectionsResponse } from "../types";
import { TrafficAggregator } from "./aggregator";

const DEFAULT_CONFIG: ClashConfig = {
  apiUrl: "http://127.0.0.1:9097",
  secret: "",
};

export class ClashDataService {
  private socket: WebSocket | null = null;
  private aggregator = new TrafficAggregator();
  private config: ClashConfig = { ...DEFAULT_CONFIG };
  private listeners = new Set<(data: GlobalTrafficSummary) => void>();
  private statusListeners = new Set<(connected: boolean, error?: string) => void>();
  private reconnectTimer: any = null;
  private isConnecting = false;
  private hasTriedFallbackPort = false;

  constructor() {
    this.loadConfig();
  }

  public loadConfig(): ClashConfig {
    try {
      const saved = localStorage.getItem("clash_config");
      if (saved) {
        this.config = JSON.parse(saved);
      }
    } catch {
      this.config = { ...DEFAULT_CONFIG };
    }
    return this.config;
  }

  public saveConfig(config: ClashConfig): void {
    this.config = config;
    this.hasTriedFallbackPort = false;
    localStorage.setItem("clash_config", JSON.stringify(config));
    this.reconnect();
  }

  public getConfig(): ClashConfig {
    return { ...this.config };
  }

  public subscribe(callback: (data: GlobalTrafficSummary) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public subscribeStatus(callback: (connected: boolean, error?: string) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  public connect(): void {
    if (this.socket || this.isConnecting) return;
    this.isConnecting = true;

    try {
      const url = new URL(this.config.apiUrl);
      const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
      let wsUrl = `${wsProtocol}//${url.host}/connections`;
      if (this.config.secret) {
        wsUrl += `?token=${encodeURIComponent(this.config.secret)}`;
      }

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
        this.notifyStatus(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const raw: RawConnectionsResponse = JSON.parse(event.data);
          if (raw && Array.isArray(raw.connections)) {
            const summary = this.aggregator.processConnections(raw.connections);
            this.notifyData(summary);
          }
        } catch (err) {
          console.error("Failed to parse Clash WebSocket message:", err);
        }
      };

      this.socket.onerror = (err) => {
        console.warn("Clash WebSocket error on:", this.config.apiUrl, err);
        // If 9097 failed on default, auto-try 9090
        if (!this.hasTriedFallbackPort && this.config.apiUrl.includes(":9097")) {
          this.hasTriedFallbackPort = true;
          console.log("Auto-trying fallback port 9090...");
          this.config.apiUrl = "http://127.0.0.1:9090";
          setTimeout(() => this.reconnect(), 500);
          return;
        }
        this.notifyStatus(false, `无法连接 ${this.config.apiUrl}，请检查控制器端口与密钥`);
      };

      this.socket.onclose = () => {
        this.isConnecting = false;
        this.socket = null;
        this.notifyStatus(false, `连接已断开 (${this.config.apiUrl})`);
        this.scheduleReconnect();
      };
    } catch (e: any) {
      this.isConnecting = false;
      this.notifyStatus(false, e?.message || "配置格式错误");
      this.scheduleReconnect();
    }
  }

  public reconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.connect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  public resetStats(): void {
    this.aggregator.reset();
  }

  private notifyData(data: GlobalTrafficSummary): void {
    this.listeners.forEach((fn) => fn(data));
  }

  private notifyStatus(connected: boolean, error?: string): void {
    this.statusListeners.forEach((fn) => fn(connected, error));
  }
}

export const clashService = new ClashDataService();
