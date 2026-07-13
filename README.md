# Omni — 无界

基于 Next.js 的思维导图 / 知识管理工具，支持富文本编辑、待办事项、文件附件、节点拖拽与自由排列。

## 技术栈

| 层         | 技术                                                         |
| ---------- | ------------------------------------------------------------ |
| 框架       | Next.js 16 (App Router, Turbopack)                           |
| 语言       | TypeScript 5                                                 |
| 前端       | React 19, Zustand 5 (状态管理), Antd 6 (UI), Tailwind CSS 4  |
| 富文本     | Tiptap 3 (ProseMirror), StarterKit, Link, Image, Underline   |
| 数据库     | SQLite (via Prisma 7 + better-sqlite3)                       |
| 后端       | Next.js Route Handlers (REST API)                            |

## 项目结构

```
omni/
├── prisma/
│   ├── schema.prisma       # 数据模型定义 (Node, Todo, Attachment)
│   ├── dev2.db              # SQLite 数据库文件 (开发环境)
│   └── migrations/          # 数据库迁移文件
│
├── public/
│   └── uploads/             # 文件附件上传目录
│
├── src/
│   ├── app/
│   │   ├── layout.tsx       # 根布局 (Font, AntdProvider)
│   │   ├── page.tsx         # 首页 (服务端数据加载)
│   │   ├── globals.css      # 全局样式 + Tailwind + 编辑器样式
│   │   ├── AntdProvider.tsx # Antd ConfigProvider + App 封装
│   │   └── api/
│   │       ├── nodes/
│   │       │   ├── route.ts          # GET/POST 节点
│   │       │   ├── [id]/route.ts     # PATCH/DELETE 节点
│   │       │   ├── batch/route.ts    # 批量操作节点
│   │       │   └── [id]/toggle/route.ts # 待办切换
│   │       ├── todos/
│   │       │   ├── route.ts          # GET/POST 待办
│   │       │   └── [id]/route.ts     # PATCH/DELETE 待办
│   │       ├── upload/route.ts       # 文件上传
│   │       └── files/
│   │           └── [id]/route.ts     # 文件下载/删除
│   │
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── CanvasBoard.tsx        # 主画布 (节点管理、右键菜单、详情面板)
│   │   │   ├── CanvasViewport.tsx     # 画布视口 (平移、缩放)
│   │   │   ├── ConnectionLines.tsx    # 父-子节点连接线 (贝塞尔曲线)
│   │   │   └── VirtualNodeRenderer.tsx # (预留) 虚拟渲染
│   │   ├── node/
│   │   │   ├── BaseNode.tsx          # 节点圆形渲染 (拖拽、选中、移动目标高亮)
│   │   │   ├── NodeDetailPanel.tsx   # 详情抽屉 (标题/类型/颜色/内容/附件/待办)
│   │   │   ├── TipTapEditor.tsx      # 富文本编辑器 (Tiptap 工具栏)
│   │   │   └── LazyEditor.tsx        # 编辑器懒加载
│   │   ├── todo/
│   │   │   ├── TodoList.tsx          # 待办列表
│   │   │   └── TodoItem.tsx          # 待办项 (勾选/删除)
│   │   └── common/
│   │       ├── ColorPicker.tsx        # 颜色选择器 (Antd + 预设)
│   │       ├── ContextMenu.tsx        # 右键菜单
│   │       └── FileUpload.tsx         # 文件上传按钮
│   │
│   ├── hooks/
│   │   ├── useNodeDrag.ts            # 节点拖拽逻辑 + 位置持久化
│   │   ├── useDoubleClick.ts         # 双击/单击识别
│   │   ├── useDebounce.ts            # 防抖回调
│   │   └── useLazyEditor.ts          # 编辑器焦点管理
│   │
│   ├── store/
│   │   ├── nodeStore.ts              # 节点状态 (树结构、CRUD、位置更新)
│   │   └── canvasStore.ts            # 画布状态 (视口、选中/编辑/移动中)
│   │
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma 客户端单例
│   │   ├── tree-utils.ts             # 树构建/展开工具 (buildTree, flattenTree)
│   │   └── canvas-utils.ts           # 画布工具 (视口坐标转换、可见性判定)
│   │
│   ├── types/
│   │   └── index.ts                  # 类型定义 (NodeData, TodoData, AttachmentData, CanvasViewport)
│   │
│   └── styles/
│       └── canvas.module.css         # 画布容器/视口/连接层样式
│
├── prisma.config.ts         # Prisma 配置 (数据库连接)
├── next.config.ts           # Next.js 配置
├── tailwind.config.ts       # Tailwind 配置
├── postcss.config.mjs       # PostCSS 配置
├── tsconfig.json            # TypeScript 配置
├── package.json             # 依赖与脚本
└── .env                     # 环境变量 (DATABASE_URL)
```

## 快速启动

### 环境要求

- Node.js >= 20
- npm >= 10

### 安装与运行

```bash
# 1. 安装依赖
npm install

# 2. 生成 Prisma Client (首次或 schema 变更后)
npx prisma generate

# 3. 运行数据库迁移 (创建/更新表结构)
npx prisma db push

# 4. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

> 首次启动时，如果没有根节点，系统会自动创建一个名为"中心节点"的根节点。

### 环境变量

创建 `.env` 文件（项目根目录已包含）：

```
DATABASE_URL=file:./prisma/dev2.db
```

## 部署到服务器

### 构建

```bash
npm run build
```

### 使用 Node.js 直接部署

```bash
# 安装生产依赖
npm ci --production

# 生成 Prisma Client
npx prisma generate

# 初始化数据库 (首次部署)
npx prisma db push

# 启动
npm start
```

默认监听 `http://0.0.0.0:3000`。

### 使用 PM2 (推荐)

```bash
npm install -g pm2
npm run build
npx prisma generate
npx prisma db push
pm2 start npm --name omni -- start
```

### 使用 Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "start"]
```

构建并运行：

```bash
docker build -t omni .
docker run -d -p 3000:3000 --name omni omni
```

### 反向代理 (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_next/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 数据持久化

SQLite 数据库文件位于 `prisma/dev2.db`，上传文件位于 `public/uploads/`。部署时确保：

- 数据库文件所在目录对运行用户**可写**
- `public/uploads/` 目录对运行用户**可写**
- 定期备份 `prisma/dev2.db` 和 `public/uploads/`

如需迁移到 PostgreSQL，修改 `prisma/schema.prisma` 的 `datasource` 和 `.env` 中的 `DATABASE_URL`，然后运行 `npx prisma db push`。

## 主要功能

| 功能              | 说明                                       |
| ----------------- | ------------------------------------------ |
| 节点 CRUD         | 创建 / 编辑 / 删除节点                     |
| 自由拖拽          | 拖拽节点到任意位置，位置持久化到数据库     |
| 父子关系          | 通过"移动至..."右键菜单更改父节点          |
| 折叠/展开         | 双击节点折叠/展开子节点                    |
| 富文本编辑        | Tiptap 编辑器，支持加粗/斜体/标题/列表等   |
| 待办事项          | 节点可切换为待办类型，管理子任务            |
| 文件附件          | 上传/下载/删除附件                         |
| 颜色定制          | 每个节点可自定义颜色，子节点继承父节点颜色  |
| 画布操作          | 鼠标拖拽平移，滚轮缩放，自动居中           |
| 连接线            | 贝塞尔曲线自动连接父子节点                 |
