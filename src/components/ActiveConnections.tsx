import React, { useState } from "react";
import { RawConnection } from "../types";
import { formatBytes, extractAppName, isDirectConnection } from "../services/aggregator";
import { Activity, Copy, Check } from "lucide-react";

interface ActiveConnectionsProps {
  connections: RawConnection[];
}

export const ActiveConnections: React.FC<ActiveConnectionsProps> = ({ connections }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (connections.length === 0) {
    return (
      <div className="py-12 text-center text-neutral-400">
        <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-xs">当前暂无活跃长连接</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono text-[10px]">
      {connections.map((conn) => {
        const isDirect = isDirectConnection(conn.chains);
        const appName = extractAppName(conn.metadata?.processPath, conn.metadata?.process);
        const host = conn.metadata?.host || conn.metadata?.destinationIP;
        const fullTarget = `${host}:${conn.metadata?.destinationPort}`;
        const total = conn.upload + conn.download;
        const isExpanded = expandedIds.has(conn.id);

        return (
          <div
            key={conn.id}
            onClick={() => toggleExpand(conn.id)}
            className="p-2 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors flex items-start justify-between cursor-pointer group"
          >
            <div className="min-w-0 pr-2 flex-1">
              <div className="flex items-start gap-1.5">
                <span className="font-semibold text-neutral-700 dark:text-neutral-200 flex-shrink-0">
                  {appName}
                </span>
                <span className="text-neutral-400 flex-shrink-0">→</span>
                <span
                  title={`完整目标地址：${fullTarget}\n(点击展开/折叠)`}
                  className={`text-neutral-600 dark:text-neutral-300 select-text ${
                    isExpanded ? "break-all text-indigo-600 dark:text-indigo-400 font-semibold" : "truncate"
                  }`}
                >
                  {fullTarget}
                </span>

                <button
                  onClick={(e) => handleCopy(fullTarget, conn.id, e)}
                  className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0"
                  title="复制完整地址"
                >
                  {copiedId === conn.id ? (
                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                  )}
                </button>
              </div>

              <div className="text-[9px] text-neutral-400 truncate mt-1">
                <span>{conn.metadata?.network?.toUpperCase()}</span>
                <span className="mx-1">|</span>
                <span
                  className={
                    isDirect
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-indigo-600 dark:text-indigo-400 font-semibold"
                  }
                >
                  {isDirect ? "DIRECT" : conn.chains[conn.chains.length - 1] || "PROXY"}
                </span>
                <span className="mx-1">|</span>
                <span>{conn.rule}</span>
              </div>
            </div>

            <div className="text-right flex-shrink-0 pt-0.5">
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                {formatBytes(total)}
              </span>
              <div className="text-[9px] text-neutral-400">
                ↓{formatBytes(conn.download)} ↑{formatBytes(conn.upload)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
