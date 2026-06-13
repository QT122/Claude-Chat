# Claude Chat - Electron 桌面应用

基于 Electron + React + TypeScript 的 AI 桌面聊天应用，支持火山方舟 / Anthropic / DeepSeek / OpenAI 多平台接入。

## 启动

```bash
npm install     # 安装依赖
npm run dev     # 开发模式（改代码热重载）
npm run build   # 编译
npm run package # 打包 .exe
```

## 配置

复制 `.env.example` 为 `.env`，填入至少一个平台的 API Key：

```bash
cp .env.example .env
```

火山方舟注册获取 API Key：https://console.volcengine.com/ark/

## 项目结构

```
src/
├── main/          # Electron 主进程（Node.js 环境）
│   ├── ipc/       # IPC 通信层（renderer ↔ main 的桥梁）
│   ├── services/  # 核心逻辑（Anthropic SDK 流式调用、文件存储）
│   ├── tools/     # 可扩展工具系统（注册模式添加新工具）
│   └── util/      # 工具函数（API Key 加密）
├── preload/       # contextBridge 安全层
└── renderer/      # React 前端 UI
    ├── components/ # UI 组件
    ├── stores/     # Zustand 状态管理
    ├── hooks/      # React hooks
    └── types/      # TypeScript 类型
```

## 添加新工具

1. 在 `src/main/tools/` 下新建文件
2. 实现 `ToolDefinition` 接口：
   - `name`: 工具名称
   - `description`: 给 Claude 的描述
   - `inputSchema`: JSON Schema 格式的输入参数
   - `execute(input, context)`: 执行逻辑，返回 `{ content, isError }`
3. 在 `src/main/tools/index.ts` 中注册

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面壳 | Electron 32 |
| 构建 | electron-vite + Vite 6 |
| 前端 | React 19 + TypeScript |
| 样式 | Tailwind CSS 3 |
| API | @anthropic-ai/sdk |
| 状态 | Zustand 5 |
