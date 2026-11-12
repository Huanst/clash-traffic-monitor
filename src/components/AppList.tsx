import React, { useState } from "react";
import { AppTrafficStats } from "../types";
import { formatBytes } from "../services/aggregator";
import { ChevronDown, ChevronRight, Globe, Layers, Copy, Check } from "lucide-react";

interface AppListProps {
  apps: AppTrafficStats[];
  searchQuery: string;
}

const DomainRow: React.FC<{ host: string; bytes: number; isProxy: boolean }> = ({
  host,
  bytes,
  isProxy,
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(host);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      title={`完整域名：${host}\n(点击切换展开/折叠)`}
      className="group flex items-start justify-between text-[10px] font-mono py-1 px-1.5 rounded hover:bg-neutral-200/50 dark:hover:bg-neutral-700/40 cursor-pointer transition-colors"
    >
      <div className="flex-1 min-w-0 pr-2">
        <span
          className={`text-neutral-700 dark:text-neutral-300 select-text ${
            expanded ? "break-all leading-relaxed font-semibold text-indigo-600 dark:text-indigo-400" : "truncate block"
          }`}
        >
          {host}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
        <button
          onClick={handleCopy}
          className="p-0.5 rounded hover:bg-neutral-300/60 dark:hover:bg-neutral-600 text-neutral-400 hover:text-neutral-200 transition-colors"
          title="复制完整域名"
        >
          {copied ? (
            <Check className="w-2.5 h-2.5 text-emerald-500" />
          ) : (
            <Copy className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
          )}
        </button>

        <span
          className={`px-1 rounded text-[8px] ${
            isProxy
              ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300"
              : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300"
          }`}
        >
          {isProxy ? "PROXY" : "DIRECT"}
        </span>

        <span className="text-neutral-500 font-mono text-[9px]">{formatBytes(bytes)}</span>
      </div>
    </div>
  );
};

export const AppList: React.FC<AppListProps> = ({ apps, searchQuery }) => {
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.processPath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (name: string) => {
    setExpandedApp((prev) => (prev === name ? null : name));
  };

  const togglePathExpand = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  if (filteredApps.length === 0) {
    return (
      <div className="py-12 text-center text-neutral-400">
        <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-xs">暂无应用流量数据</p>
        <p className="text-[10px] text-neutral-500 mt-1">
          请确保 Clash Verge 已开启 `find-process-mode: always`
        </p>
      </div>
    );
  }

  const maxBytes = Math.max(...apps.map((a) => a.totalBytes), 1);

  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
      {filteredApps.map((app) => {
        const isExpanded = expandedApp === app.name;
        const isPathExpanded = expandedPaths.has(app.name);
        const proxyRatio = app.totalBytes > 0 ? (app.totalProxy / app.totalBytes) * 100 : 0;
        const directRatio = app.totalBytes > 0 ? (app.totalDirect / app.totalBytes) * 100 : 0;
        const relativeWidth = Math.max(5, (app.totalBytes / maxBytes) * 100);

        return (
          <div key={app.name} className="p-2.5 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors">
            {/* App Row */}
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => toggleExpand(app.name)}
            >
              <div className="flex items-start gap-2 min-w-0 pr-2">
                <button className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 mt-0.5">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-neutral-800 dark:text-neutral-100 text-[11px]">
                      {app.name}
                    </span>
                    {app.totalProxy > 0 && (
                      <span className="text-[9px] px-1 rounded bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono">
                        代理
                      </span>
                    )}
                    {app.totalDirect > 0 && (
                      <span className="text-[9px] px-1 rounded bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-mono">
                        直连
                      </span>
                    )}
                  </div>

                  <p
                    onClick={(e) => togglePathExpand(app.name, e)}
                    className={`text-[9px] text-neutral-400 select-text cursor-pointer hover:text-neutral-300 transition-colors ${
                      isPathExpanded ? "break-all leading-normal" : "truncate max-w-[220px]"
                    }`}
                    title={`完整应用路径：${app.processPath || "未识别进程路径"}\n(点击展开/折叠)`}
                  >
                    {app.processPath || "未识别进程路径"}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="font-mono font-medium text-neutral-700 dark:text-neutral-200 text-xs">
                  {formatBytes(app.totalBytes)}
                </span>
                <div className="text-[9px] text-neutral-400 font-mono">
                  {app.totalProxy > 0 && <span className="text-indigo-500">P: {formatBytes(app.totalProxy)} </span>}
                  {app.totalDirect > 0 && <span className="text-emerald-500">D: {formatBytes(app.totalDirect)}</span>}
                </div>
              </div>
            </div>

            {/* Split Bar */}
            <div className="mt-2 pl-5">
              <div
                className="h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex"
                style={{ width: `${relativeWidth}%` }}
              >
                <div
                  style={{ width: `${proxyRatio}%` }}
                  className="bg-indigo-500 h-full"
                />
                <div
                  style={{ width: `${directRatio}%` }}
                  className="bg-emerald-500 h-full"
                />
              </div>
            </div>

            {/* Expanded Top Domains */}
            {isExpanded && (
              <div className="mt-2.5 ml-5 p-2 rounded-lg bg-neutral-100/60 dark:bg-neutral-800/40 border border-neutral-200/50 dark:border-neutral-700/50 space-y-1 animate-fadeIn">
                <div className="text-[10px] text-neutral-500 font-medium flex items-center justify-between pb-1 border-b border-neutral-200/40 dark:border-neutral-700/40">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    高频目标域名 (点击域名可展开/折叠完整网址):
                  </span>
                </div>

                {app.topDomains.length === 0 ? (
                  <p className="text-[10px] text-neutral-400 py-1">暂无目标域名记录</p>
                ) : (
                  <div className="space-y-0.5 pt-1">
                    {app.topDomains.map((dom, idx) => (
                      <DomainRow
                        key={idx}
                        host={dom.host}
                        bytes={dom.bytes}
                        isProxy={dom.isProxy}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
