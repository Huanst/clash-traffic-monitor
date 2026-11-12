import React, { useState } from "react";
import {
  RefreshCw,
  Settings,
  ArrowDown,
  ArrowUp,
  Download,
  FileSpreadsheet,
  FileJson,
} from "lucide-react";
import { GlobalTrafficSummary } from "../types";
import { formatBytes, formatSpeed } from "../services/aggregator";
import { exportSummaryToCsv, exportSummaryToJson } from "../services/export";

interface HeaderProps {
  summary: GlobalTrafficSummary | null;
  isConnected: boolean;
  onOpenSettings: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  summary,
  isConnected,
  onOpenSettings,
  onReset,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportedMsg, setExportedMsg] = useState<string | null>(null);

  const totalProxy = summary?.totalProxyBytes || 0;
  const totalDirect = summary?.totalDirectBytes || 0;
  const totalAll = totalProxy + totalDirect;
  const proxyPercent = totalAll > 0 ? (totalProxy / totalAll) * 100 : 0;
  const directPercent = totalAll > 0 ? (totalDirect / totalAll) * 100 : 0;

  const handleExportCsv = () => {
    exportSummaryToCsv(summary);
    setIsExportOpen(false);
    setExportedMsg("已导出 CSV");
    setTimeout(() => setExportedMsg(null), 2000);
  };

  const handleExportJson = () => {
    exportSummaryToJson(summary);
    setIsExportOpen(false);
    setExportedMsg("已导出 JSON");
    setTimeout(() => setExportedMsg(null), 2000);
  };

  return (
    <header
      data-tauri-drag-region
      className="p-3 bg-white/90 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/80 sticky top-0 z-20 cursor-move select-none flex-shrink-0"
    >
      {/* Top Bar: Title & Status & Actions */}
      <div data-tauri-drag-region className="flex items-center justify-between mb-2.5">
        <div data-tauri-drag-region className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full relative flex items-center justify-center">
            <span
              className={`absolute w-full h-full rounded-full animate-ping opacity-75 ${
                isConnected ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
          </div>
          <span className="font-semibold text-xs tracking-tight text-neutral-800 dark:text-neutral-100">
            Clash 流量监控
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono">
            {summary?.activeConnectionsCount || 0} 活跃
          </span>
        </div>

        <div className="flex items-center gap-1 relative">
          {exportedMsg && (
            <span className="text-[10px] text-emerald-500 font-medium animate-fadeIn mr-0.5">
              ✓ {exportedMsg}
            </span>
          )}

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              title="一键导出流量审计日志"
              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {isExportOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsExportOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 py-1.5 z-50 text-[11px] animate-fadeIn divide-y divide-neutral-100 dark:divide-neutral-700/60">
                  <button
                    onClick={handleExportCsv}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <div>
                      <div className="font-medium">导出 CSV 表格</div>
                      <div className="text-[9px] text-neutral-400">支持 Excel / Numbers 打开</div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportJson}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 transition-colors"
                  >
                    <FileJson className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <div>
                      <div className="font-medium">导出 JSON 原始数据</div>
                      <div className="text-[9px] text-neutral-400">完整机器可读结构化数据</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onReset}
            title="清空统计周期"
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenSettings}
            title="控制器设置"
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time Speeds Grid */}
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        {/* Proxy Speed Card */}
        <div className="p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
          <div className="flex items-center justify-between text-[10px] text-indigo-700 dark:text-indigo-400 font-medium mb-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              代理流量
            </span>
            <span className="font-mono">{formatBytes(totalProxy)}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-700 dark:text-neutral-200">
            <span className="flex items-center gap-0.5" title="代理下行速度">
              <ArrowDown className="w-3 h-3 text-indigo-500" />
              {formatSpeed(summary?.currentProxyDownSpeed || 0)}
            </span>
            <span className="flex items-center gap-0.5 text-neutral-400 dark:text-neutral-500 text-[10px]">
              <ArrowUp className="w-2.5 h-2.5" />
              {formatSpeed(summary?.currentProxyUpSpeed || 0)}
            </span>
          </div>
        </div>

        {/* Direct Speed Card */}
        <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
          <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mb-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              直连流量
            </span>
            <span className="font-mono">{formatBytes(totalDirect)}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-700 dark:text-neutral-200">
            <span className="flex items-center gap-0.5" title="直连下行速度">
              <ArrowDown className="w-3 h-3 text-emerald-500" />
              {formatSpeed(summary?.currentDirectDownSpeed || 0)}
            </span>
            <span className="flex items-center gap-0.5 text-neutral-400 dark:text-neutral-500 text-[10px]">
              <ArrowUp className="w-2.5 h-2.5" />
              {formatSpeed(summary?.currentDirectUpSpeed || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Traffic Ratio Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
          <span>分流占比</span>
          <span>
            代理 <b className="text-indigo-600 dark:text-indigo-400">{proxyPercent.toFixed(1)}%</b> · 直连 <b className="text-emerald-600 dark:text-emerald-400">{directPercent.toFixed(1)}%</b>
          </span>
        </div>
        <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${proxyPercent}%` }}
            className="bg-indigo-500 transition-all duration-300 h-full"
            title={`代理: ${proxyPercent.toFixed(1)}%`}
          />
          <div
            style={{ width: `${directPercent}%` }}
            className="bg-emerald-500 transition-all duration-300 h-full"
            title={`直连: ${directPercent.toFixed(1)}%`}
          />
        </div>
      </div>
    </header>
  );
};
