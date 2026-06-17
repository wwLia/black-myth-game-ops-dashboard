# Black Myth Game Ops Dashboard

基于黑神话悟空 Steam 玩家评论数据的游戏运营数据看板 Demo。

这个项目用于展示如何把玩家评论数据转化为运营可读的 KPI、用户分层、主题分布、情绪分析和高优先级反馈池，适合作为数据产品、游戏运营分析、前端可视化方向的面试作品。

## 数据来源

- 真实数据：阿里云天池黑神话悟空 Steam 评论数据
- Mock 数据：在线人数、行业新闻、运营事件

项目内已统一使用 `source_type` 标识数据来源：

- `source_type: "real"` 表示真实评论数据
- `source_type: "mock"` 表示模拟数据

页面中也会通过数据来源标识区分真实数据和 Mock 数据，避免把模拟数据误展示为真实数据。

## 核心功能

- KPI 总览：评论总数、推荐率、负面评论数、平均/中位数游戏时长，以及 Mock 在线与新闻指标。
- 评论筛选：支持平台、推荐状态、情绪、主题、用户分层、优先级、发布时间范围等全局筛选。
- 用户时长分层：按尝鲜用户、轻度体验、核心推进、深度玩家展示评论数和推荐率。
- 游戏时长 x 情绪散点图：以游戏时长为 X 轴、情绪分为 Y 轴，结合主题颜色和关注度点大小定位体验风险。
- 主题分布：展示性能优化、战斗体验、剧情文化、美术音乐、价格购买、内容期待、其他反馈等主题的评论量和推荐率。
- 高优先级反馈池：自动筛选不推荐、负向情绪、长时长、重点主题和高优先级评论，形成运营反馈池。
- 行业新闻雷达：使用 Mock 行业新闻展示外部市场信号，预留 NewsAPI / RSS / GDELT 接入方向。
- 运营事件联动：使用 Mock 运营事件标记在线趋势节点，点击后联动评论日期筛选。
- 面试展示模式：高亮核心模块，隐藏部分技术字段，并提供业务解释和讲解文案。

## 技术栈

- Next.js
- TypeScript
- Tailwind CSS
- ECharts / echarts-for-react
- Recharts / ECharts 可视化思路

当前项目主要使用 ECharts 实现图表展示。

## 本地运行

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

## 数据字段说明

### 真实评论数据

真实评论数据主要来自 `wukong_reviews_sample.json` 和 `wukong_aggregates.json`。

核心字段：

- `review_id`：评论唯一标识，用于点击散点后定位评论。
- `platform`：评论平台，例如 Steam。
- `game`：游戏名称。
- `published_date`：评论发布时间，支持全局日期筛选。
- `recommendation` / `is_recommended`：是否推荐。
- `playtime_hours`：用户累计游戏时长。
- `user_segment`：用户分层，例如尝鲜用户、轻度体验、核心推进、深度玩家。
- `content_clean`：清洗后的评论文本。
- `topic`：评论主题，例如性能优化、战斗体验、剧情文化等。
- `sentiment`：情绪标签。
- `sentiment_score`：情绪分数，用于散点图 Y 轴。
- `attention_score`：关注度分数，用于散点大小。
- `urgency`：运营处理优先级。
- `suggested_action`：运营建议。

### 聚合数据

`wukong_aggregates.json` 用于补充聚合指标。

核心字段：

- `kpis.total_reviews`：评论总数。
- `kpis.recommend_rate`：推荐率。
- `kpis.not_recommended_reviews`：负面评论数。
- `kpis.avg_playtime_hours`：平均游戏时长。
- `kpis.median_playtime_hours`：中位数游戏时长。
- `playtime_segments`：用户时长分层聚合。
- `topic_distribution`：主题分布聚合。

### Mock 数据

Mock 数据用于模拟未来可接入的实时或外部数据。

- `data/mock/mockOnlinePlayers.ts`：近 24 小时在线人数趋势。
- `data/mock/mockIndustryNews.ts`：行业新闻和雷达指标。
- `data/mock/mockOpsEvents.ts`：运营事件节点。

Mock 数据均标记为 `source_type: "mock"`，页面中也会显示“Mock 数据”。

## 后续可扩展方向

- 接入 Steam API 或内部埋点，替换 Mock 在线人数。
- 接入 NewsAPI / RSS / GDELT，替换 Mock 行业新闻。
- 接入运营活动后台，将 Mock 运营事件替换为真实活动日历。
- 增加评论聚类、关键词抽取、负面原因归因。
- 增加多游戏对比，支持竞品横向分析。
- 增加时间序列趋势图，观察口碑随版本更新变化。
- 增加导出能力，例如导出高优先级反馈池为 CSV / Excel。
- 接入 LLM 总结能力，自动生成运营日报和版本复盘摘要。

## 面试展示话术

可以按下面顺序介绍：

1. 项目定位

   这是一个基于黑神话悟空 Steam 玩家评论数据的游戏运营数据看板 Demo。它不是单纯展示图表，而是把评论文本、推荐状态、游戏时长、主题、情绪和运营优先级转成可执行的运营判断。

2. 数据来源

   看板中真实评论相关模块都来自阿里云天池黑神话悟空 Steam 评论数据；在线人数、行业新闻和运营事件目前是 Mock 数据，并且在 UI 上明确标注，后续可以替换为 Steam API、新闻 API 或内部埋点数据。

3. 核心业务价值

   KPI 用来回答“当前口碑怎么样”；主题分布回答“玩家主要在讨论什么”；游戏时长 x 情绪散点图回答“不同深度玩家的问题在哪里”；高优先级反馈池回答“运营应该优先处理哪些评论”。

4. 全局联动

   所有筛选条件统一管理，KPI、图表、评论列表和高优先级反馈池都基于同一份 `filteredReviews` 刷新。点击主题、用户分层、散点和运营事件都会反向驱动筛选或评论定位。

5. 最值得讲的模块

   面试展示模式会高亮三个核心模块：真实评论 KPI、游戏时长 x 评论情绪散点图、高优先级反馈池。这三个模块分别代表概览、分析和行动，是完整的数据产品闭环。

6. 扩展思路

   如果继续迭代，可以接入实时在线数据、行业新闻源、真实运营活动日历，并进一步加入自动摘要、版本复盘和反馈导出，让它从 Demo 变成可落地的游戏运营工作台。
