import React, { useState } from "react";
import { DomainTrafficStats } from "../types";
import { formatBytes } from "../services/aggregator";
import { Globe, Copy, Check } from "lucide-react";

interface DomainListProps {
  domains: DomainTrafficStats[];
  searchQuery: string;
}

export const DomainList: React.FC<DomainListProps> = ({ domains, searchQuery }) => {
  const [expandedHosts, setExpandedHosts] = useState<Set<string>>(new Set());
  const [copiedHost, setCopiedHost] = useState<string | null>(null);

  const filtered = domains.filter(
    (d) =>
      d.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.associatedApps.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleExpand = (host: string) => {
    setExpandedHosts((prev) => {
      const next = new Set(prev);
      if (next.has(host)) {
        next.delete(host);
      } else {
        next.add(host);
      }
      return next;
    });
  };

  const handleCopy = (host: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(host);
    setCopiedHost(host);
    setTimeout(() => setCopiedHost(null), 1500);
  };

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-neutral-400">
        <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-xs">暂无域名访问记录</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
      {filtered.map((item) => {
        const isMainlyProxy = item.proxyBytes > item.directBytes;
        const isExpanded = expandedHosts.has(item.host);

        return (
          <div
            key={item.host}
            onClick={() => toggleExpand(item.host)}
            className="p-2.5 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors flex items-start justify-between cursor-pointer group"
          >
            <div className="min-w-0 pr-2 flex-1">
              <div className="flex items-start gap-1.5">
                <span
                  title={`完整域名：${item.host}\n(点击展开/折叠)`}
                  className={`font-mono text-[11px] font-medium text-neutral-800 dark:text-neutral-100 select-text ${
                    isExpanded ? "break-all leading-relaxed text-indigo-600 dark:text-indigo-400 font-semibold" : "truncate max-w-[220px]"
                  }`}
                >
                  {item.host}
                </span>

                <button
                  onClick={(e) => handleCopy(item.host, e)}
                  className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
                  title="复制完整域名"
                >
                  {copiedHost === item.host ? (
                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                  )}
                </button>

                <span
                  className={`text-[9px] px-1 rounded font-mono flex-shrink-0 ${
                    isMainlyProxy
                      ? "bg-indigo-100/80 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400"
                      : "bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {isMainlyProxy ? "PROXY" : "DIRECT"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 mt-1 truncate">
                <span>规则: {item.rule}</span>
                <span>·</span>
                <span className="truncate">来自: {item.associatedApps.slice(0, 3).join(", ")}</span>
              </div>
            </div>

            <div className="text-right flex-shrink-0 pt-0.5">
              <div className="font-mono font-medium text-xs text-neutral-700 dark:text-neutral-200">
                {formatBytes(item.totalBytes)}
              </div>
              <div className="text-[9px] font-mono text-neutral-400">
                {item.proxyBytes > 0 && <span className="text-indigo-500">P:{formatBytes(item.proxyBytes)} </span>}
                {item.directBytes > 0 && <span className="text-emerald-500">D:{formatBytes(item.directBytes)}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
