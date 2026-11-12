# 🚀 Clash Traffic Monitor (macOS 状态栏流量监控)

一个专为 macOS 设计的轻量级菜单栏流量分流监控与审计工具，专为 **Clash Verge / Mihomo (Clash.Meta)** 定制。

让你的分流不再是“黑盒”，实时掌握哪些软件在消耗代理节点流量，哪些在直连；支持按**应用维度**与**域名维度**进行细粒度流量审计、实时速率追踪与数据导出。

> Built with care. — Huanst

---
<img width="852" height="1172" alt="image" src="https://github.com/user-attachments/assets/a9011112-0357-42fe-b4b9-a491138a9fc3" />


## 💡 开发初衷

日常在使用 Clash / Clash Verge 作为科学上网和分流工具时，常常会遇到几个非常真实的痛点：

1. **节点流量“莫名蒸发”**：月底一看节点配额告急，甚至几百 G 流量几天内见底，却根本不知道是哪个后台软件在疯狂偷跑（是网盘同步？Steam 自动更新？Docker 拉取镜像？还是某个 App 的流量走错了规则？）。
2. **连接列表太碎，缺乏“应用视角”**：官方 Dashboard 和 Verge 的“连接”页面虽然能看到实时长连接，但成百上千条 TCP/UDP 连接是平铺的，信息极其杂乱；想要知道**“究竟是 Chrome 跑了多少，还是 Telegram 跑了多少”**极其困难。
3. **缺少轻量优雅的桌面常驻入口**：不想每次排查网络时都打开庞大笨重的客户端主窗口，翻阅繁琐的连接日志。

**因此，我开发了这款软件。** 

我希望打造一个**原生、优雅、极其省资源**的 macOS 菜单栏小工具：
- 它静默常驻在顶部状态栏，鼠标悬停一眼看清实时速度；
- 点击弹出一块精致的毛玻璃面板，直连/代理比例、应用排行、访问域名一目了然；
- 无论是排查规则配置错误、审计异常流量，还是日常网络监控，都能在 3 秒钟内给你明确答案。

---

## ✨ 核心特性

- 🎯 **直连 vs 代理 精准分流审计**：实时区分每一个连接是走了代理策略组还是直连（`DIRECT`），一眼看出流量分流健康度。
- 📱 **应用级流量排行榜**：自动解析进程名称与应用路径（如 `Google Chrome`、`Cursor`、`Telegram`），展现各 App 消耗的代理/直连流量占比双色柱状图。
- 🔍 **高频目标域名穿透**：点击任意 App，即可向下钻取展开该软件近期访问的高频域名、分流规则以及具体消耗流量。
- 🌐 **域名维度访问明细**：全局汇总所有访问过的域名，支持快速搜索，查看哪些软件在请求同一个目标域名。
- ⚡️ **macOS 原生状态栏常驻 (Tauri 2.0)**：
  - 基于 Rust + Tauri 2.0 构建，常驻内存仅约 30MB。
  - 菜单栏图标悬停即显实时代理/直连网速，点击弹出独立浮动面板，失去焦点自动隐藏。
- 📊 **流量报告一键导出**：支持将当前统计周期内的流量审计数据一键导出为 **CSV 表格** 或 **JSON 数据包**，方便留存与分析。
- 🔄 **即时重置与双模运行**：支持一键清零重新开始统计；支持纯前端 Web 模式（直接用浏览器打开）与原生桌面状态栏模式。

---

## 📖 如何使用？

### 1. 顶部状态栏（快速一览）
* **悬停预览**：将鼠标移至 macOS 顶部菜单栏的小火箭图标上，悬停 Tooltip 即可直接查看当前的实时代理与直连下载速率。
* **点击展开**：点击图标呼出悬浮面板；点击屏幕其他区域，面板会自动平滑隐藏，不占桌面空间。

### 2. 概览看板与分流比例
* 面板顶部显示当前的**总代理流量**、**总直连流量**以及**实时上下行网速**。
* 双色比例条直观展现你的流量健康度（绿色为直连流量，紫色为代理节点流量）。

### 3. 三大监控视图
* **软件排行 (Apps)**：
  * 按消耗总流量从大到小排列所有联网 App。
  * 每张卡片呈现应用名、进程路径、分流占比条。
  * **点击任意应用卡片**：展开查看该软件访问的前 5 个高频域名及各域名具体消耗。
* **域名明细 (Domains)**：
  * 查看被访问最多的目标主机与域名列表。
  * 显示该域名匹配的 Clash 规则（如 `DIRECT`、`Proxy`、`RuleSet`）及关联的 App。
* **活跃连接 (Active)**：
  * 实时抓取当前正在传输的长连接，查看协议类型、源端口、目标 IP 与传输量，支持一键复制完整连接地址。

### 4. 辅助功能
* **搜索过滤**：在“软件排行”和“域名明细”页面右上角输入关键词，可毫秒级实时过滤。
* **数据导出**：点击顶部下载图标，可导出 CSV 或 JSON 格式的审计报告。
* **重新统计**：点击顶部刷新图标，可将累计流量清零，重新观察当前时间段的流量走势。

---

## 🛠 一、Clash Verge 前置配置（关键）

为了让监控工具能够获取到具体的**软件进程路径**，请在 Clash Verge 中做如下简单确认：

### 1. 确认外部控制端口
- 打开 Clash Verge → **设置 (Settings)** → **外部控制 (External Controller)**。
- 记下端口（Clash Verge 默认一般是 `9097`，标准 Clash 通常是 `9090`）和 Secret 密钥（若无密钥则留空）。

### 2. 开启进程识别模式 (`find-process-mode`)
*默认情况下 Clash 可能不记录应用进程信息，必须开启此项：*
1. 打开 Clash Verge → **订阅配置 (Profiles)**。
2. 在你当前激活的配置上右键，选择 **“扩展配置 (Script)”** 或 **“Merge 规则”**。
3. 添加或确保有以下配置项：
   ```yaml
   find-process-mode: always
   ```
4. 保存并重新应用配置。

---

## 🏃 二、安装与快速运行

```bash
# 1. 克隆项目并进入目录
git clone https://github.com/<your-username>/clash-traffic-monitor.git
cd clash-traffic-monitor
```

### 模式 A：Web 快速体验（无需 Rust 环境，立即看效果）
电脑安装好 Node.js (>= 18) 与 pnpm 后，直接在项目目录安装并运行前端即可：

```bash
pnpm install
pnpm dev
```
启动后在浏览器打开 `http://localhost:1420`，点击右上角设置图标填入你的 Clash Verge 控制器地址（如 `http://127.0.0.1:9097`），即可立即看到实时流量看板！

---

### 模式 B：构建为 macOS 状态栏原生应用 (Tauri 2.0)

常驻在 Mac 顶部状态栏，需要 Rust 工具链：

#### 1. 安装 Rust 环境（如果尚未安装）
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

#### 2. 本地开发调试
```bash
# 启动原生状态栏应用开发模式
pnpm tauri dev
```

#### 3. 打包生成独立的 `.app` / `.dmg` 安装包
```bash
pnpm tauri build
```
打包完成后会在 `src-tauri/target/release/bundle/macos/` 生成原生的 `Clash Traffic Monitor.app`，直接拖入系统的 `Applications`（应用程序目录）即可随开机启动常驻！

---

## 📂 项目结构

```
clash-traffic-monitor/
├── src/                          # 前端看板 UI (React + TypeScript + Tailwind CSS)
│   ├── components/
│   │   ├── Header.tsx            # 顶部速度看板、直连/代理比例条、清零、设置与导出
│   │   ├── AppList.tsx           # 软件流量排行、双色占比条、下钻展开域名
│   │   ├── DomainList.tsx        # 域名流量榜、命中规则与所属应用
│   │   ├── ActiveConnections.tsx # 实时活跃长连接监控与一键复制
│   │   └── SettingsModal.tsx     # Clash Verge 控制器连接设置模态框
│   ├── services/
│   │   ├── aggregator.ts         # 流量增量计算引擎（核心聚合算法）
│   │   ├── api.ts                # WebSocket 长连接与重连管理
│   │   └── export.ts             # CSV / JSON 审计报告导出工具
│   ├── types.ts                  # 全局数据模型定义
│   ├── App.tsx                   # 主面板容器与标签切换
│   └── main.tsx
├── src-tauri/                    # Tauri 2.0 原生后端 (Rust)
│   ├── Cargo.toml
│   ├── tauri.conf.json           # 状态栏无边框毛玻璃弹窗与 Tray 托盘配置
│   └── src/
│       ├── lib.rs                # 状态栏托盘逻辑、窗口呼出/失焦隐藏、IPC 通信
│       ├── clash_client.rs       # Tokio 异步常驻监听与托盘标题实时更新
│       ├── aggregator.rs         # Rust 端高性能流量增量与速度计算
│       └── models.rs             # 数据结构定义
├── package.json
└── README.md
```

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。
