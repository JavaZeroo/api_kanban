# NPU 对齐仪表盘

基于 React + Vite 构建的可视化数据仪表盘，用于展示和分析 NPU（神经网络处理单元）对齐相关的性能指标和数据。

## 功能特性

- **多种可视化图表**：包含多种图表类型（散点图、热力图、趋势图、气泡图等）
- **响应式布局**：适配不同屏幕尺寸
- **模块化组件**：易于扩展和维护的组件架构
- **数据驱动**：支持动态数据更新

## 技术栈

- **前端框架**：React 18.3.1
- **构建工具**：Vite 5.4.10
- **样式方案**：CSS 模块化
- **图表库**：ECharts（通过 `src/charts/` 目录下的自定义图表组件）

## 项目结构

```
npu-align-dashboard/
├── src/
│   ├── charts/           # 可视化图表组件
│   │   ├── DiffFeed.jsx
│   │   ├── DtypeMatrix.jsx
│   │   ├── DualTrend.jsx
│   │   └── ...
│   ├── components/       # 通用 UI 组件
│   │   ├── FocusCard.jsx
│   │   ├── Topbar.jsx
│   │   └── TweaksPanel.jsx
│   ├── data/            # 数据处理和常量
│   │   ├── apis.js
│   │   ├── constants.js
│   │   ├── metrics.js
│   │   └── series.js
│   ├── sections/        # 页面区块组件
│   │   ├── DimSection.jsx
│   │   ├── HeroSection.jsx
│   │   ├── MatrixSection.jsx
│   │   └── ...
│   ├── styles/          # CSS 样式文件
│   │   ├── base.css
│   │   ├── charts.css
│   │   ├── layout.css
│   │   └── variables.css
│   ├── App.jsx          # 应用主组件
│   └── main.jsx         # 应用入口
├── index.html           # HTML 入口
├── package.json         # 项目依赖
├── vite.config.js       # Vite 配置
└── README.md           # 项目说明
```

## 开发环境

### 环境要求

- Node.js 16.x 或更高版本
- npm 或 yarn 包管理器

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

开发服务器默认运行在 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

构建后的文件将输出到 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

## 组件说明

### 图表组件 (src/charts/)

| 组件名 | 说明 |
|--------|------|
| DiffFeed.jsx | 差异反馈图表 |
| DtypeMatrix.jsx | 数据类型矩阵图 |
| DualTrend.jsx | 双趋势对比图 |
| HeroGauge.jsx | 仪表盘/仪表组件 |
| ImpactScatter.jsx | 影响散点图 |
| MiniRadial.jsx | 小型径向图 |
| ModuleDimHeat.jsx | 模块维度热力图 |
| PixelMatrix.jsx | 像素矩阵图 |
| RepoBubbles.jsx | 仓库气泡图 |
| Spark.jsx | 火花/迷你图 |
| VelocityBars.jsx | 速度柱状图 |

### 数据模块 (src/data/)

| 文件 | 说明 |
|------|------|
| apis.js | API 接口定义和调用 |
| constants.js | 常量定义 |
| metrics.js | 指标数据 |
| series.js | 序列数据 |
| utils.js | 工具函数 |

## 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件

## 联系方式

如有问题或建议，欢迎提交 Issue 或联系项目维护者。
