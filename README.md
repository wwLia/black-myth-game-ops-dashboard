# Black Myth Game Ops Dashboard

Black Myth Game Ops Dashboard 是一个基于《黑神话：悟空》Steam 公开评论样本构建的玩家反馈分析与运营决策支持原型。

项目对评论文本、推荐状态和游戏时长进行清洗、结构化与规则分析，并通过核心指标、玩家分层、主题分布、情绪判断、决策四象限和跨团队反馈池，帮助使用者从大量玩家反馈中识别口碑风险、深度体验问题与内容传播机会。

该项目属于独立研究与产品原型，不代表游戏开发商、发行商、Valve 或 SteamDB 的官方系统、内部数据或业务结论。

## Project Goals

- 探索公开玩家评论在游戏运营分析、问题分级和发行决策支持中的应用。
- 建立从原始评论清洗、规则推导、交互式可视化到业务行动输出的完整数据产品流程。
- 区分真实样本、分析推导、Mock 演示和未来可接入数据，避免把模拟信号误用为业务结论。
- 将评论分析从单纯图表展示推进到可解释的事实、判断和建议动作。

## Online Versions

- V1 在线地址：`[V1_DEMO_URL](https://black-myth-game-ops-dashboard-v1-g65ker142-lia-s-projects15.vercel.app/)`
- V2 在线地址：[https://black-myth-game-ops-dashboard-5myh.vercel.app/](https://black-myth-game-ops-dashboard-5myh.vercel.app/)

## Demo Versions

### V1 · Player Feedback Analytics

定位：以玩家评论的数据清洗、基础指标、用户时长分层、情绪与主题分析为核心，验证公开评论数据的结构化分析流程。

- Branch：`demo-v1-original`
- Tag：`v1.0-original`
- 在线体验地址：`[V1_DEMO_URL](https://black-myth-game-ops-dashboard-v1-g65ker142-lia-s-projects15.vercel.app/)`
- 核心模块：KPI 总览、全局筛选、用户时长分层、主题分布、游戏时长与情绪散点、评论反馈列表。

### V2 · Publishing Decision Support

定位：在 V1 数据分析能力基础上，引入数据边界、管理层摘要、玩家价值四象限、跨团队问题闭环和发行行动建议，使分析结果进一步转化为可执行的产品、社区与发行决策。

- Branch：`main`
- Tag：`v2.0-decision-support`
- 在线体验地址：[https://black-myth-game-ops-dashboard-5myh.vercel.app/](https://black-myth-game-ops-dashboard-5myh.vercel.app/)
- 核心模块：数据可信度说明、核心指标、管理层摘要、问题定位、玩家价值决策四象限、跨团队反馈池、发行行动建议、方法与局限性说明。

## Version Evolution

V1 重点解决“如何整理和理解玩家反馈”；V2 重点解决“如何将分析结论转化为团队行动”。

| 维度 | V1：玩家反馈分析 | V2：决策支持 |
| --- | --- | --- |
| 产品目标 | 结构化理解玩家评论 | 将分析结果转化为业务动作 |
| 数据表达 | KPI、分布与评论明细 | 数据来源、边界、置信度与结论摘要 |
| 玩家分析 | 游戏时长与情绪关系 | 玩家价值决策四象限 |
| 负面反馈 | 高优先级评论展示 | 风险、证据、责任团队、动作与状态 |
| 内容价值 | 识别正负面主题 | 识别社区、KOL、UGC 与媒体内容机会 |
| 决策输出 | 数据观察结果 | 事实、判断、动作 |
| 数据治理 | 基础方法说明 | 真实样本、分析推导、Mock 与未来接入分层 |

## Core Features

### 管理层摘要

基于当前筛选范围，提炼核心事实、业务判断与建议动作，降低使用者逐张解读图表的成本。

### 核心指标

展示有效评论数、推荐率、不推荐评论数、高优先级负评、深度玩家负评占比、Top 负面主题和样本覆盖时间。

### 多维筛选

支持按推荐状态、情绪、主题、游戏时长分层和优先级筛选，所有指标、图表和反馈列表使用统一筛选结果。

### 问题定位

通过用户时长、情绪和主题分布，识别问题集中在哪类玩家及哪类体验环节。

### 玩家价值决策四象限

根据游戏时长与评论情绪，将评论划分为早期流失风险、深度反馈用户、初期印象良好和核心口碑用户，并匹配不同处理策略。

### 跨团队反馈池

将评论转化为结构化问题，补充证据强度、影响等级、业务风险、建议负责人、建议动作和处理状态。

### 发行行动建议

从负面反馈中识别说明、FAQ、攻略和舆情管理需求，同时从正面反馈中识别 KOL、媒体、UGC 和社区传播机会。

### 数据与方法说明

说明数据来源、清洗流程、规则推导方法、样本限制和当前系统无法证明的结论。

## Data Sources and Processing

真实评论数据主要来自 `wukong_reviews_sample.json` 和 `wukong_aggregates.json`。

### 真实样本

Steam 评论原始字段及直接统计结果，包括：

- `review_id`：评论唯一标识，用于点击图表后定位评论。
- `platform`：评论平台，例如 Steam。
- `game`：游戏名称。
- `published_date`：评论发布时间，支持全局日期筛选。
- `recommendation` / `is_recommended`：是否推荐。
- `playtime_hours`：用户累计游戏时长。
- `content_clean`：清洗后的评论文本。

### 分析推导

基于真实样本和轻量规则得到的结构化字段，包括：

- `user_segment`：用户分层，例如尝鲜用户、轻度体验、核心推进、深度玩家。
- `topic`：评论主题，例如性能优化、战斗体验、剧情文化等。
- `sentiment`：情绪标签。
- `sentiment_score`：情绪分数，用于散点图 Y 轴。
- `attention_score`：关注度分数，用于散点大小。
- `urgency`：运营处理优先级。
- `suggested_action`：建议动作。

### 聚合数据

`wukong_aggregates.json` 用于补充聚合指标：

- `kpis.total_reviews`：评论总数。
- `kpis.recommend_rate`：推荐率。
- `kpis.not_recommended_reviews`：负面评论数。
- `kpis.avg_playtime_hours`：平均游戏时长。
- `kpis.median_playtime_hours`：中位数游戏时长。
- `playtime_segments`：用户时长分层聚合。
- `topic_distribution`：主题分布聚合。

### Mock 演示

Mock 数据用于模拟未来可接入的实时或外部数据，不参与真实业务结论计算。

- `data/mock/mockOnlinePlayers.ts`：近 24 小时在线人数趋势。
- `data/mock/mockIndustryNews.ts`：行业新闻和雷达指标。
- `data/mock/mockOpsEvents.ts`：运营事件节点。

项目内使用 `source_type` 标识数据来源：

- `source_type: "real"`：真实样本。
- `source_type: "derived"`：分析推导。
- `source_type: "mock"`：Mock 演示。
- `source_type: "future"`：未来可接入。

## Metrics and Analysis Methods

- 有效评论数：存在非空文本的评论数量。
- 推荐率：推荐评论数 / 有效评论数。
- 高优先级负评：不推荐或负向评论，并命中当前优先级规则。
- 深度玩家负评占比：核心推进用户和深度玩家中的不推荐评论数，占全部不推荐评论数的比例。
- Top 负面主题：不推荐或负向评论数量最多的主题。
- 样本覆盖时间：真实数据中最早和最晚的有效发布日期。
- 玩家价值决策四象限：以 10 小时作为高低时长边界，结合情绪分识别早期流失风险、深度反馈用户、初期印象良好和核心口碑用户。

## Use Cases

- 版本上线后的玩家口碑监测。
- 高频体验问题与负面主题识别。
- 首小时体验问题与深度体验问题区分。
- 社区 FAQ、攻略和机制解释选题。
- 产品、技术、社区、客服与发行团队的问题分发。
- 正向内容主题和核心口碑用户识别。
- KOL、UGC、媒体和社区内容 Brief 支持。
- 后续版本复盘和玩家反馈跟踪。

## Technical Architecture

- Next.js
- TypeScript
- Tailwind CSS
- ECharts / echarts-for-react
- Recharts / ECharts 可视化思路

当前项目主要使用 ECharts 实现图表展示。

## Local Development

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

访问：

```bash
http://localhost:3000
```

代码检查：

```bash
npm run lint
```

类型检查：

```bash
npx tsc --noEmit
```

生产构建：

```bash
npm run build
```

## Data Boundaries and Limitations

- Steam 评论用户不代表全部玩家。
- 评论样本存在自选择偏差。
- 情绪与主题使用轻量规则法，可能误判反讽、玩梗和复杂语境。
- 游戏时长是发表评论时记录的时长，不代表最终游玩时长。
- 当前不包含内部行为、销量、退款、留存和版本埋点数据。
- 当前没有跨平台数据，不能生成其他平台结论。
- 不能仅凭评论数据证明某项问题与销量或留存存在因果关系。
- Mock 数据不参与真实业务结论。

未来可接入的数据包括 Steam Web API、Steamworks 或内部实时在线数据、版本节点、销量、退款、愿望单、游戏内行为、留存、社区和客服工单、媒体、KOL 与代理商传播数据。

## Roadmap

- 接入 Steam API 或内部埋点，替换 Mock 在线人数。
- 接入 NewsAPI / RSS / GDELT，替换 Mock 行业新闻。
- 接入运营活动后台，将 Mock 运营事件替换为真实活动日历。
- 增加评论聚类、关键词抽取、负面原因归因。
- 增加多游戏对比，支持竞品横向分析。
- 增加时间序列趋势图，观察口碑随版本更新变化。
- 增加导出能力，例如导出高优先级反馈池为 CSV / Excel。
- 接入 LLM 总结能力，自动生成运营日报和版本复盘摘要。

## Disclaimer

本项目是基于公开评论样本构建的独立研究与数据产品原型，不代表游戏科学、发行商、Valve、Steam 或 SteamDB 的官方系统、内部数据或业务结论。

项目中的情绪、主题、用户分层、优先级和建议动作均为规则推导结果，仅用于决策参考；涉及产品改动、公开沟通或发行行动时，应结合更多内部数据和人工复核。Mock 数据仅用于展示未来可接入模块形态，不能支持真实业务结论。
