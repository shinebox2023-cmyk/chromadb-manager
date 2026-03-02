# ChromaDB 数据管理系统

一个基于 React + Vite 开发的 ChromaDB 数据库管理 Web 应用。

## 功能特性

- **概览页面** - 查看服务器状态和统计数据
- **数据库管理** - 查看、创建、删除数据库
- **集合管理** - 查看、创建、删除集合
- **记录管理** - 增删改查记录，支持向量搜索

## 技术栈

- React 18
- Vite
- Ant Design 5
- React Router 6
- Fetch API

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录

## 配置说明

首次使用时需要在设置页面配置 ChromaDB 服务器信息：

1. **服务器地址** - ChromaDB 服务器地址，默认为 `http://192.168.0.101:8000`
2. **API Token** - 可选，如无需认证可留空

开发环境下，所有 API 请求会通过 Vite 代理转发到 ChromaDB 服务器，避免跨域问题。

## 项目结构

```
src/
├── api/
│   └── chromaApi.js      # ChromaDB API 服务层
├── components/
│   └── Layout.jsx        # 页面布局组件
├── context/
│   └── AuthContext.jsx   # 认证状态管理
├── pages/
│   ├── OverviewPage.jsx      # 概览页面
│   ├── DatabasesPage.jsx     # 数据库管理页面
│   ├── CollectionsPage.jsx  # 集合管理页面
│   ├── RecordsPage.jsx       # 记录管理页面
│   └── SettingsPage.jsx      # 设置页面
├── App.jsx              # 应用入口
└── main.jsx             # React 入口
```

## API 版本

本项目使用 ChromaDB API v2 版本。
