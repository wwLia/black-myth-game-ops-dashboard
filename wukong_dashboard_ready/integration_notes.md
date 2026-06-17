# Black Myth: Wukong 评论数据接入说明

## 文件说明

- `wukong_reviews_clean.csv`：完整清洗后的评论数据，适合导入数据库。
- `wukong_reviews_sample.json`：适合前端 Demo 直接加载的抽样评论数据，已去掉 Steam 用户链接字段。
- `wukong_aggregates.json`：大屏 KPI、日期趋势、用户时长分层、主题分布、重点评论等聚合结果。
- `dashboard_types.ts`：Next.js/TypeScript 项目可直接使用的数据类型定义。
- `process_wukong.py`：从原始 `wukong.csv` 生成以上文件的预处理脚本。

## 推荐接入方式

MVP 阶段：
1. 将 `wukong_reviews_sample.json` 和 `wukong_aggregates.json` 放到 Next.js 项目的 `public/data/` 目录。
2. 将 `dashboard_types.ts` 放到 `types/` 目录。
3. 在页面组件中通过 `fetch('/data/wukong_aggregates.json')` 和 `fetch('/data/wukong_reviews_sample.json')` 加载数据。

进阶阶段：
1. 将 `wukong_reviews_clean.csv` 导入 PostgreSQL / Supabase。
2. 用 API Routes 或 FastAPI 暴露 `/api/reviews`、`/api/aggregates`、`/api/topics` 等接口。
3. 前端筛选器调用接口分页查询，避免一次性在浏览器加载全部 15,869 条评论。

## 面试表述建议

这份数据集来自阿里云天池的 Steam 真实玩家评论数据，我将其作为黑神话上线初期口碑分析样本。通过字段标准化、文本清洗、游戏时长分层、推荐/不推荐标签转化、规则化主题分类和情绪分数计算，把原始评论转化为可用于运营决策的大屏数据。
