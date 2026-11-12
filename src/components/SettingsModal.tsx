import React, { useState, useEffect } from "react";
import { X, Save, HelpCircle } from "lucide-react";
import { ClashConfig } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClashConfig;
  onSave: (config: ClashConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [apiUrl, setApiUrl] = useState(config.apiUrl);
  const [secret, setSecret] = useState(config.secret);

  useEffect(() => {
    setApiUrl(config.apiUrl);
    setSecret(config.secret);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      apiUrl: apiUrl.trim().replace(/\/$/, ""),
      secret: secret.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[340px] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 text-xs">
            Clash 控制器配置
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-3.5 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              API 地址 (External Controller)
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://127.0.0.1:9097"
              className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
            {/* Quick Presets */}
            <div className="flex gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => setApiUrl("http://127.0.0.1:9097")}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  apiUrl.includes(":9097")
                    ? "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700"
                }`}
              >
                9097 (Verge 常见)
              </button>
              <button
                type="button"
                onClick={() => setApiUrl("http://127.0.0.1:9090")}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  apiUrl.includes(":9090")
                    ? "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700"
                }`}
              >
                9090 (标准 Clash)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-300 mb-1">
              Secret 密钥 (可在 Clash Verge 设置中查看)
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="若 Clash Verge 设置了 Secret 请粘贴到此处"
              className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50 text-[10px] space-y-1 text-neutral-500">
            <div className="flex items-center gap-1 font-medium text-neutral-700 dark:text-neutral-300">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              如何找到端口和密钥？
            </div>
            <p>
              打开 <b>Clash Verge</b> → 点击左侧 <b>设置</b> → 查看 <b>外部控制 (External Controller)</b> 对应的端口与密钥。
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1 text-xs shadow-sm shadow-indigo-500/20"
            >
              <Save className="w-3.5 h-3.5" />
              保存并测试
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
