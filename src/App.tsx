import React, { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { AppList } from "./components/AppList";
import { DomainList } from "./components/DomainList";
import { ActiveConnections } from "./components/ActiveConnections";
import { SettingsModal } from "./components/SettingsModal";
import { clashService } from "./services/api";
import { GlobalTrafficSummary, ClashConfig } from "./types";
import { Search, Layers, Globe, Zap, AlertTriangle } from "lucide-react";

type ActiveTab = "apps" | "domains" | "active";

export const App: React.FC = () => {
  const [summary, setSummary] = useState<GlobalTrafficSummary | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("apps");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState<ClashConfig>(clashService.loadConfig());

  useEffect(() => {
    const unsubData = clashService.subscribe((data) => {
      setSummary(data);
    });

    const unsubStatus = clashService.subscribeStatus((connected, error) => {
      setIsConnected(connected);
      setErrorMessage(error || null);
    });

    clashService.connect();

    return () => {
      unsubData();
      unsubStatus();
    };
  }, []);

  const handleSaveConfig = (newConfig: ClashConfig) => {
    setConfig(newConfig);
    clashService.saveConfig(newConfig);
    if ((window as any).__TAURI_INTERNALS__) {
      import("@tauri-apps/api/core")
        .then(({ invoke }) => {
          invoke("update_clash_config", {
            apiUrl: newConfig.apiUrl,
            secret: newConfig.secret,
          });
        })
        .catch(console.error);
    }
  };

  const handleReset = () => {
    clashService.resetStats();
    setSummary((prev) =>
      prev
        ? {
            ...prev,
            totalProxyBytes: 0,
            totalDirectBytes: 0,
            apps: [],
            domains: [],
          }
        : null
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen max-h-screen bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl rounded-2xl border border-neutral-300/80 dark:border-neutral-700/60 shadow-2xl overflow-hidden select-none">
      {/* Fixed Header */}
      <Header
        summary={summary}
        isConnected={isConnected}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReset={handleReset}
      />

      {/* Disconnected Warning Bar */}
      {!isConnected && (
        <div
          onClick={() => setIsSettingsOpen(true)}
          className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-colors text-[10px]"
        >
          <div className="flex items-center gap-1.5 truncate">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {errorMessage || `未连接到 Clash (${config.apiUrl})，点击配置`}
            </span>
          </div>
          <span className="font-semibold underline">设置</span>
        </div>
      )}

      {/* Navigation Tabs & Search */}
      <div className="px-3 py-2 bg-white/50 dark:bg-neutral-900/50 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex bg-neutral-200/60 dark:bg-neutral-800 p-0.5 rounded-lg text-[10px] font-medium">
          <button
            onClick={() => setActiveTab("apps")}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              activeTab === "apps"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            <Layers className="w-3 h-3" />
            软件排行
            {summary?.apps?.length ? ` (${summary.apps.length})` : ""}
          </button>
          <button
            onClick={() => setActiveTab("domains")}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              activeTab === "domains"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            <Globe className="w-3 h-3" />
            域名明细
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              activeTab === "active"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            <Zap className="w-3 h-3" />
            活跃连接
          </button>
        </div>

        {/* Quick Search */}
        {activeTab !== "active" && (
          <div className="relative flex-1 max-w-[120px]">
            <Search className="w-3 h-3 absolute left-2 top-2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索..."
              className="w-full pl-6 pr-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/50 dark:border-neutral-700/50 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-neutral-400"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {activeTab === "apps" && (
          <AppList apps={summary?.apps || []} searchQuery={searchQuery} />
        )}
        {activeTab === "domains" && (
          <DomainList domains={summary?.domains || []} searchQuery={searchQuery} />
        )}
        {activeTab === "active" && (
          <ActiveConnections connections={summary?.activeConnections || []} />
        )}
      </div>

      {/* Footer Info */}
      <footer className="px-3 py-1.5 bg-neutral-100/70 dark:bg-neutral-900/70 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between text-[9px] text-neutral-400 font-mono flex-shrink-0">
        <span>Clash Verge · WebSocket 实时监听</span>
        <span>Built with care. — Huanst</span>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={handleSaveConfig}
      />
    </div>
  );
};
export default App;
