import pandas as pd
import re, json, hashlib, math
from pathlib import Path

INPUT = Path('/mnt/data/wukong.csv')
OUTDIR = Path('/mnt/data/wukong_dashboard_ready')
OUTDIR.mkdir(exist_ok=True)

def clean_text(x):
    x = '' if pd.isna(x) else str(x)
    x = re.sub(r'\s+', ' ', x).strip()
    return x

def parse_date_cn(x):
    s = str(x).strip()
    m = re.match(r'(\d+)月(\d+)日', s)
    if not m:
        return None
    return f"2024-{int(m.group(1)):02d}-{int(m.group(2)):02d}"

def user_hash(link, name):
    raw = f'{link}|{name}'.encode('utf-8')
    return 'u_' + hashlib.md5(raw).hexdigest()[:10]

def review_hash(link, comment, idx):
    raw = f'{idx}|{link}|{comment[:80]}'.encode('utf-8')
    return 'r_' + hashlib.md5(raw).hexdigest()[:12]

TOPIC_RULES = [
    ('性能优化', ['卡顿','掉帧','闪退','优化','帧数','崩溃','报错','性能','配置','黑屏','加载','bug','BUG','Bug']),
    ('战斗体验', ['boss','Boss','BOSS','难度','闪避','判定','打击感','虎先锋','大头','广智','连招','手感','战斗','棍','识破','翻滚','招式']),
    ('剧情文化', ['西游','悟空','剧情','文化','大圣','金箍','猴哥','天命人','取经','妖怪','神话','杨戬','四大名著','童年']),
    ('美术音乐', ['画面','音乐','美术','场景','建模','配乐','云宫迅音','音效','风景','摄影','视觉','过场']),
    ('价格购买', ['价格','贵','便宜','退款','值','不值','买','原价','史低','预购','钱']),
    ('内容期待', ['DLC','dlc','续作','二周目','更新','后续','补丁','新内容','章节']),
]
NEG_WORDS = ['差','烂','退','退款','卡','卡顿','掉帧','闪退','崩溃','bug','BUG','难受','失望','不行','不好','垃圾','恶心','问题','缺点','差评']
POS_WORDS = ['好玩','震撼','优秀','牛','神作','喜欢','推荐','满分','感动','惊艳','舒服','值得','伟大','顶','爽']

def classify_topic(text):
    for topic, kws in TOPIC_RULES:
        if any(k in text for k in kws):
            return topic
    return '其他反馈'

def sentiment_score(text, recommended):
    base = 0.65 if recommended == '推荐' else -0.65
    pos = sum(text.count(k) for k in POS_WORDS)
    neg = sum(text.count(k) for k in NEG_WORDS)
    # Damp extremely short meme comments a bit toward neutral.
    length = len(text)
    score = base + 0.08 * min(pos, 4) - 0.10 * min(neg, 5)
    if length < 6:
        score *= 0.72
    return max(-1.0, min(1.0, round(score, 3)))

def sentiment_label(score):
    if score >= 0.25:
        return '正向'
    if score <= -0.25:
        return '负向'
    return '中性'

def segment(hours):
    if hours <= 2:
        return '尝鲜用户(0-2h)'
    if hours <= 10:
        return '轻度体验(2-10h)'
    if hours <= 50:
        return '核心推进(10-50h)'
    return '深度玩家(50h+)'

def urgency(row):
    if row['sentiment'] == '负向' and row['playtime_hours'] >= 10 and row['topic'] in ['性能优化','战斗体验']:
        return '高'
    if row['sentiment'] == '负向' or (row['playtime_hours'] >= 10 and row['topic'] in ['性能优化','战斗体验']):
        return '中'
    return '低'

def suggested_action(row):
    topic = row['topic']
    if row['sentiment'] == '负向':
        if topic == '性能优化':
            return '进入技术/性能问题池，优先复核配置、帧率、崩溃与补丁反馈。'
        if topic == '战斗体验':
            return '进入玩法体验问题池，重点查看 Boss 难度、判定、引导与新手流失。'
        if topic == '价格购买':
            return '进入商业化/购买转化反馈池，观察退款、价格敏感与性价比讨论。'
        return '进入负向舆情池，结合高频词与用户时长判断是否需要社区回应。'
    if topic == '剧情文化':
        return '可沉淀为口碑传播素材，适合用于社区话题、文化向内容与UGC征集。'
    if topic == '美术音乐':
        return '可沉淀为视觉/音乐向种草素材，适合短视频切片与图文传播。'
    return '作为常规口碑样本，用于版本复盘和用户画像补充。'

# Load and normalize
raw = pd.read_csv(INPUT, encoding='utf-8-sig')
df = raw.rename(columns={
    '用户': 'user_name',
    '用户链接': 'user_link',
    '发布时间(2024年)': 'published_date_raw',
    '是否推荐': 'recommendation',
    '大圣游戏时长': 'playtime_hours',
    '评论': 'content'
}).copy()

df['platform'] = 'Steam'
df['game'] = 'Black Myth: Wukong'
df['published_date'] = df['published_date_raw'].map(parse_date_cn)
df['content_clean'] = df['content'].map(clean_text)
df['content_length'] = df['content_clean'].str.len()
df['user_id'] = [user_hash(l, n) for l, n in zip(df['user_link'], df['user_name'])]
df['review_id'] = [review_hash(l, c, i) for i, (l, c) in enumerate(zip(df['user_link'], df['content_clean']))]
df['is_recommended'] = df['recommendation'].eq('推荐')
df['user_segment'] = df['playtime_hours'].map(segment)
df['topic'] = df['content_clean'].map(classify_topic)
df['sentiment_score'] = [sentiment_score(t, r) for t, r in zip(df['content_clean'], df['recommendation'])]
df['sentiment'] = df['sentiment_score'].map(sentiment_label)
df['attention_score'] = (df['content_length'].map(lambda x: math.log1p(max(x,0))*10) + df['playtime_hours']*0.35 + (~df['is_recommended'])*8).round(1)
df['urgency'] = df.apply(urgency, axis=1)
df['suggested_action'] = df.apply(suggested_action, axis=1)

clean_cols = [
    'review_id','user_id','user_name','user_link','platform','game','published_date','published_date_raw',
    'recommendation','is_recommended','playtime_hours','user_segment','content_clean','content_length',
    'topic','sentiment','sentiment_score','attention_score','urgency','suggested_action'
]
clean_df = df[clean_cols]
clean_df.to_csv(OUTDIR/'wukong_reviews_clean.csv', index=False, encoding='utf-8-sig')

# Stratified sample for frontend; keep all rare deep users and enough neg/recommended samples
sample_parts = []
for (seg, rec), g in clean_df.groupby(['user_segment','recommendation'], dropna=False):
    n = min(len(g), max(40, int(len(g)*0.16)))
    sample_parts.append(g.sample(n=n, random_state=42) if len(g) > n else g)
sample = pd.concat(sample_parts).drop_duplicates('review_id')
if len(sample) > 2500:
    sample = sample.sample(n=2500, random_state=42)
sample = sample.sort_values(['published_date','playtime_hours'], ascending=[True, False])
sample_records = sample.drop(columns=['user_link']).to_dict(orient='records')
(OUTDIR/'wukong_reviews_sample.json').write_text(json.dumps(sample_records, ensure_ascii=False, indent=2), encoding='utf-8')

# Aggregate helper
kpis = {
    'total_reviews': int(len(clean_df)),
    'recommended_reviews': int(clean_df['is_recommended'].sum()),
    'not_recommended_reviews': int((~clean_df['is_recommended']).sum()),
    'recommend_rate': round(float(clean_df['is_recommended'].mean()), 4),
    'avg_playtime_hours': round(float(clean_df['playtime_hours'].mean()), 2),
    'median_playtime_hours': round(float(clean_df['playtime_hours'].median()), 2),
    'max_playtime_hours': round(float(clean_df['playtime_hours'].max()), 2),
    'empty_comments': int((clean_df['content_length'] == 0).sum()),
    'duplicate_user_links': int(raw['用户链接'].duplicated().sum()),
}

def rec_rate(series):
    return round(float(series.mean()), 4) if len(series) else None

by_date = []
for date, g in clean_df.groupby('published_date'):
    by_date.append({
        'date': date,
        'review_count': int(len(g)),
        'recommended': int(g['is_recommended'].sum()),
        'not_recommended': int((~g['is_recommended']).sum()),
        'recommend_rate': rec_rate(g['is_recommended']),
        'avg_playtime_hours': round(float(g['playtime_hours'].mean()), 2),
    })

segment_rows = []
for seg, g in clean_df.groupby('user_segment'):
    segment_rows.append({
        'segment': seg,
        'review_count': int(len(g)),
        'recommended': int(g['is_recommended'].sum()),
        'not_recommended': int((~g['is_recommended']).sum()),
        'recommend_rate': rec_rate(g['is_recommended']),
        'avg_playtime_hours': round(float(g['playtime_hours'].mean()), 2),
    })
segment_order = {'尝鲜用户(0-2h)':0,'轻度体验(2-10h)':1,'核心推进(10-50h)':2,'深度玩家(50h+)':3}
segment_rows.sort(key=lambda x: segment_order.get(x['segment'], 9))

topic_rows = []
for topic, g in clean_df.groupby('topic'):
    topic_rows.append({
        'topic': topic,
        'review_count': int(len(g)),
        'recommended': int(g['is_recommended'].sum()),
        'not_recommended': int((~g['is_recommended']).sum()),
        'negative_sentiment': int((g['sentiment']=='负向').sum()),
        'recommend_rate': rec_rate(g['is_recommended']),
    })
topic_rows.sort(key=lambda x: x['review_count'], reverse=True)

# topic x segment matrix for heatmap/network
matrix = []
for seg, sg in clean_df.groupby('user_segment'):
    for topic, tg in sg.groupby('topic'):
        matrix.append({
            'segment': seg,
            'topic': topic,
            'review_count': int(len(tg)),
            'negative_count': int((tg['sentiment']=='负向').sum()),
            'recommend_rate': rec_rate(tg['is_recommended']),
        })

# high urgency examples
high = clean_df[clean_df['urgency'].isin(['高','中'])].sort_values(['urgency','attention_score'], ascending=[True,False]).head(80)
high_records = high[['review_id','user_id','platform','published_date','recommendation','playtime_hours','user_segment','topic','sentiment','sentiment_score','attention_score','urgency','content_clean','suggested_action']].to_dict(orient='records')

aggregates = {
    'dataset': {
        'name': 'Black Myth: Wukong Steam launch review dataset',
        'source_note': '阿里云天池数据集；字段包括用户、用户链接、评价内容、是否推荐、游戏时长等。',
        'platform': 'Steam',
        'date_range': sorted([d for d in clean_df['published_date'].dropna().unique().tolist()]),
    },
    'kpis': kpis,
    'by_date': by_date,
    'playtime_segments': segment_rows,
    'topic_distribution': topic_rows,
    'topic_segment_matrix': matrix,
    'high_priority_reviews': high_records,
}
(OUTDIR/'wukong_aggregates.json').write_text(json.dumps(aggregates, ensure_ascii=False, indent=2), encoding='utf-8')

# TypeScript types and loader hints
(OUTDIR/'dashboard_types.ts').write_text("""export type Sentiment = '正向' | '中性' | '负向';
export type Urgency = '高' | '中' | '低';

export interface WukongReview {
  review_id: string;
  user_id: string;
  user_name: string;
  platform: 'Steam';
  game: 'Black Myth: Wukong';
  published_date: string;
  published_date_raw: string;
  recommendation: '推荐' | '不推荐';
  is_recommended: boolean;
  playtime_hours: number;
  user_segment: '尝鲜用户(0-2h)' | '轻度体验(2-10h)' | '核心推进(10-50h)' | '深度玩家(50h+)';
  content_clean: string;
  content_length: number;
  topic: string;
  sentiment: Sentiment;
  sentiment_score: number;
  attention_score: number;
  urgency: Urgency;
  suggested_action: string;
}

export interface DashboardAggregates {
  dataset: {
    name: string;
    source_note: string;
    platform: string;
    date_range: string[];
  };
  kpis: {
    total_reviews: number;
    recommended_reviews: number;
    not_recommended_reviews: number;
    recommend_rate: number;
    avg_playtime_hours: number;
    median_playtime_hours: number;
    max_playtime_hours: number;
    empty_comments: number;
    duplicate_user_links: number;
  };
  by_date: Array<{
    date: string;
    review_count: number;
    recommended: number;
    not_recommended: number;
    recommend_rate: number;
    avg_playtime_hours: number;
  }>;
  playtime_segments: Array<{
    segment: string;
    review_count: number;
    recommended: number;
    not_recommended: number;
    recommend_rate: number;
    avg_playtime_hours: number;
  }>;
  topic_distribution: Array<{
    topic: string;
    review_count: number;
    recommended: number;
    not_recommended: number;
    negative_sentiment: number;
    recommend_rate: number;
  }>;
}
""", encoding='utf-8')

(OUTDIR/'integration_notes.md').write_text("""# Black Myth: Wukong 评论数据接入说明

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
""", encoding='utf-8')

# Copy script into folder as well
import shutil
shutil.copy('/mnt/data/process_wukong.py', OUTDIR/'process_wukong.py')

print('created', OUTDIR)
print('files:', [p.name for p in OUTDIR.iterdir()])
print(json.dumps(kpis, ensure_ascii=False, indent=2))
