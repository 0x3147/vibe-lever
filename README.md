# VibeLever

> 🔧 一款现代化的 AI 编码助手多端统一切换与管理平台。

VibeLever 是一个基于 Tauri v2 框架打造的桌面应用（前身为 EasyCCSwitch）。它旨在为开发者提供一个**集中、统一的控制台**，用于管理多款 AI 辅码工具（如 Claude Code、Codex）的供应商配置、环境变量、安装状态以及 MCP (Model Context Protocol) 扩展。

随着 AI 编程工具链的快速演进，VibeLever 的目标是通过极简的界面与底层的强大状态管理，将错综复杂的命令行配置可视化，让你的“AI 编码开关（Lever）”随心而动（Vibe）。

---

## ✨ 核心特性（持续迭代中）

当前版本已初步实现并规划了以下核心功能：

- **📦 多端供应商管理**：集中管理 Claude Code 和 Codex 等工具的 API 密钥、基础 URL 及模型配置，支持一键切换激活状态。
- **🛠 工具状态与进程控制**：可视化检测各 AI 工具的安装状态、运行进程，并支持在应用内直接进行安装、卸载与强制终止。
- **🔌 MCP 服务器集成**：全局管理 Model Context Protocol (MCP) 服务器配置，支持 stdio / http / sse 等多种连接类型的添加与维护。
- **📄 深度配置可视化**：提供针对特定工具（如项目目录下的 `.claude.json`，以及全局 `CLAUDE.md`）的可视化编辑界面。
- **⚙️ 现代化交互体验**：浅色/深色主题无缝切换，中英双语国际化支持，以及基于 shadcn/ui 打造的极简视觉交互。

> **注意**：VibeLever 处于活跃开发阶段，未来将引入更多 AI 工具（如 Gemini）的支持以及 MCP 插件市场等高级功能。上述功能列表会随着版本更新逐步完善。

---

## 🛠 技术栈

VibeLever 在重构后采用了现代化的系统架构，兼顾了前端的开发效率与后端的系统级性能：

- **桌面框架**：[Tauri v2](https://v2.tauri.app/)
- **前端核心**：React 19 + TypeScript + Vite
- **UI & 样式**：[shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS v4
- **路由与状态**：TanStack Router + Zustand
- **后端核心**：Rust (负责涵盖文件 I/O、Shell 执行、平台检测及配置解析)
- **本地存储**：SQLite (`rusqlite`)

---

## 🚀 快速开始

### 环境依赖

在开始之前，请确保你的开发环境中已安装以下依赖：
- [Node.js](https://nodejs.org/) (推荐 LTS 版本)
- [pnpm](https://pnpm.io/) 或等效的包管理器
- [Rust & Cargo](https://rustup.rs/)
- 针对对应操作系统的 [Tauri 开发依赖](https://v2.tauri.app/start/prerequisites/)

### 运行步骤

1. **克隆仓库**
   ```bash
   git clone <你的仓库地址> vibe-lever
   cd vibe-lever
   ```

2. **安装前端依赖**
   ```bash
   pnpm install
   ```

3. **启动开发环境**
   ```bash
   pnpm dev
   ```
   *这将启动 Vite 的开发服务器，并自动编译启动 Tauri 的 Rust 后端程序。*

4. **构建生产版本**
   ```bash
   pnpm build
   ```
   *构建产物将输出在 `src-tauri/target/release` 目录下。*

---

## 🗺 路线图 (Roadmap)

VibeLever 的架构设计预留了充足的扩展性：
- [x] 核心框架由 Electron 迁移至 Tauri v2
- [x] 动态侧边栏与基础工具选择架构
- [ ] 完善各主流 AI 终端工具的安装器与进程管理
- [ ] 实现 MCP 插件市场模块
- [ ] 更加强大的项目隔离机制配置

---

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request，与我们共同维护这款 AI 时代的“瑞士军刀”。
随着新功能的实现，本文档也将持续更新，敬请关注！
