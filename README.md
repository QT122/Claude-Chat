<p align="center">
  <h1 align="center">Claude Chat</h1>
  <p align="center">
    <strong>AI 桌面聊天应用 — 基于 Electron + React + TypeScript</strong>
    <br/>
    支持 火山方舟 / Anthropic / DeepSeek / OpenAI 多平台接入
    <br/>
    <br/>
    <img src="https://img.shields.io/badge/Electron-32-47848F?logo=electron" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
    <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript" />
    <img src="https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss" />
    <img src="https://img.shields.io/badge/license-MIT-green" />
  </p>
</p>

---

## 简介 / About

**Claude Chat** 是一个 AI 桌面聊天应用，使用 Electron 构建，支持多个 AI 平台接入。

**Claude Chat** is an AI desktop chat app built with Electron. It supports multiple AI platforms.

### 功能特性 / Features

- 🌐 **多平台支持** — 火山方舟 / Anthropic / DeepSeek / OpenAI
- 💬 **流式对话** — 实时打字机效果，支持 Markdown 渲染 + 代码高亮
- 🛠️ **工具调用** — 读写文件、搜索内容、生成图片/视频、网页搜索
- 🖼️ **AI 生图识图** — 支持火山方舟 Seedream 生图 + 豆包识图，以及 ChatGPT/OpenAI 多模态识图
- 📎 **文件上传** — 支持 PDF / Word / Excel / PPT / 图片分析
- 🧵 **多会话** — 多对话管理，本地存储，数据安全
- 🧠 **记忆系统** — 跨对话保存上下文，可编辑可管理
- 🔧 **技能系统** — 可扩展的自定义 Skill
- 🌤️ **天气展示** — 自动定位显示当前天气
- 🎨 **背景自定义** — 聊天背景可换
- 🔐 **API Key 本地加密** — 密钥存储在本地，不上传

---

## 快速开始 / Quick Start

### 1. 注册获取 API Key / Register & Get API Key

| 平台 / Platform | 注册地址 / Register | 说明 / Note |
|---|---|---|
| 火山方舟 | https://console.volcengine.com/ark/ | 国内直连，支持 Claude 模型 + 生图识图 |
| Anthropic | https://console.anthropic.com/ | 需要科学上网 |
| DeepSeek | https://platform.deepseek.com/ | 国内直连 |
| OpenAI | https://platform.openai.com/ | 需要科学上网，支持 GPT 多模态识图 |

> 各平台注册要求不同，火山方舟需要实名认证（个人上传身份证即可）。

### 2. 安装依赖 / Install

```bash
# 克隆项目 / Clone
git clone <your-repo-url>
cd claude-chat

# 安装依赖 / Install dependencies
npm install
```

### 3. 配置 API Key / Configure

```bash
# 复制环境变量模板 / Copy env template
cp .env.example .env

# 编辑 .env，填入你的 API Key
# Edit .env, fill in your API key
```

最少只需填一个平台的 Key 即可使用：

```env
# 火山方舟 — 国内直连，支持 Claude 模型
ARK_API_KEY=你的-ark-api-key

# 或 OpenAI — 支持 GPT 多模态识图
OPENAI_API_KEY=你的-openai-api-key
```

### 4. 启动 / Start

```bash
# 开发模式 / Development (hot reload)
npm run dev

# 编译 / Build
npm run build

# 打包 .exe / Package to .exe
npm run package
```

打包后的安装包在 `dist/` 目录下。

---

## 项目结构 / Project Structure

```
claude-chat/
├── README.md                    ← 本文件
├── CLAUDE.md                    ← 开发文档
├── .env.example                 ← 环境变量模板
├── package.json                 ← 依赖与脚本
├── electron-builder.yml         ← 打包配置
├── electron.vite.config.ts      ← 构建配置
├── tailwind.config.ts           ← Tailwind CSS 配置
├── tsconfig.json                ← TypeScript 配置
├── update-shortcut.ps1          ← 快捷方式更新脚本
│
├── src/
│   ├── main/                    ← Electron 主进程
│   │   ├── index.ts             ← 入口
│   │   ├── window.ts            ← 窗口管理
│   │   ├── ipc/                 ← IPC 通信层
│   │   │   ├── api-key.ts       ← API Key 管理
│   │   │   ├── chat.ts          ← 聊天接口
│   │   │   ├── conversations.ts ← 对话管理
│   │   │   ├── file-system.ts   ← 文件系统
│   │   │   ├── media.ts         ← 媒体处理
│   │   │   ├── memory.ts        ← 记忆系统
│   │   │   └── skills.ts        ← 技能系统
│   │   ├── services/            ← 核心服务
│   │   │   ├── anthropic-provider.ts  ← Claude 流式调用
│   │   │   ├── byteplus.ts            ← 火山方舟 API（生图/识图/视频）
│   │   │   ├── deepseek-provider.ts   ← DeepSeek 调用
│   │   │   ├── file-parser.ts         ← 文件解析
│   │   │   └── message-store.ts       ← 消息存储
│   │   ├── tools/               ← 可扩展工具系统
│   │   │   ├── base.ts          ← 工具基类
│   │   │   ├── edit-file.ts     ← 编辑文件
│   │   │   ├── generate-image.ts← 生成图片
│   │   │   ├── web-search.ts    ← 网页搜索
│   │   │   └── ...              ← 更多工具
│   │   └── util/                ← 工具函数
│   ├── preload/                 ← preload 安全层
│   └── renderer/                ← React 前端
│       ├── App.tsx              ← 根组件
│       ├── components/          ← UI 组件
│       │   ├── chat/            ← 聊天组件
│       │   ├── layout/          ← 布局组件
│       │   ├── settings/        ← 设置组件
│       │   ├── tools/           ← 工具展示组件
│       │   └── shared/          ← 通用组件
│       ├── stores/              ← Zustand 状态管理
│       ├── hooks/               ← React Hooks
│       └── styles/              ← 样式
│
└── installer/                   ← 安装包
    └── Claude-Chat-Setup.exe
```

---

## 支持的 API 平台 / Supported API Platforms

| 平台 | 支持模型 | 国内访问 | 生图 | 识图 |
|---|---|---|---|---|
| **火山方舟 (Volcano Ark)** | Claude Opus/Sonnet/Haiku, Doubao, DeepSeek | ✅ 直连 | ✅ Seedream | ✅ 豆包视觉 |
| **Anthropic** | Claude Opus 4.7, Sonnet 4.6, Haiku 4.5 | ❌ 需代理 | — | ✅ 原生多模态 |
| **DeepSeek** | DeepSeek-V3, DeepSeek-R1 | ✅ 直连 | — | — |
| **OpenAI** | GPT-4o, GPT-4.1 | ❌ 需代理 | ✅ DALL-E | ✅ GPT-4o 多模态 |

---

## 技术栈 / Tech Stack

| 层 / Layer | 技术 / Tech |
|---|---|
| 桌面框架 / Desktop | Electron 32 |
| 构建工具 / Bundler | electron-vite + Vite 6 |
| 前端 / Frontend | React 19 + TypeScript 5.6 |
| 样式 / Styling | Tailwind CSS 3 |
| AI SDK | @anthropic-ai/sdk, openai, @volcengine/openapi |
| 状态管理 / State | Zustand 5 |
| Markdown | react-markdown + remark-gfm + rehype-highlight |
| 打包 / Packager | electron-builder (NSIS) |

---

## 注意事项 / Notes

- API Key 存储在本地，**不会上传到任何服务器**
- 各平台注册要求不同，按需选择
- 按 token 用量计费，各平台价格不同

---

## License

MIT — 自由使用、修改、分发。

---

## 相关链接 / Links

- [火山方舟控制台](https://console.volcengine.com/ark/)
- [火山方舟文档](https://www.volcengine.com/docs/82379/1176987)
- [Anthropic 官网](https://www.anthropic.com/)
- [OpenAI 平台](https://platform.openai.com/)
- [Electron 文档](https://www.electronjs.org/)
