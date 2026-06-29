import styles from "./page.module.css";
import type { CSSProperties } from "react";

type Scheme = {
  id: string;
  name: string;
  direction: string;
  background: string;
  surface: string;
  elevated: string;
  border: string;
  primary: string;
  secondary: string;
  accent: string;
  warning: string;
  success: string;
  textPrimary: string;
  textSecondary: string;
  highlights: string[];
};

const schemes: Scheme[] = [
  {
    id: "neon",
    name: "方案 A：Neon Shrine / 霓虹神龛",
    direction: "冷色夜幕、数据终端、青蓝霓虹与电紫高光",
    background: "#05070D",
    surface: "#0D1220",
    elevated: "#121A2C",
    border: "rgba(125, 211, 252, 0.22)",
    primary: "#22D3EE",
    secondary: "#A855F7",
    accent: "#F43F5E",
    warning: "#F59E0B",
    success: "#34D399",
    textPrimary: "#EAF2FF",
    textSecondary: "#94A3B8",
    highlights: ["dark dashboard", "neon cyan", "holographic card", "subtle grid", "data terminal"],
  },
  {
    id: "crimson",
    name: "方案 B：Crimson Ink / 赤墨未来",
    direction: "墨黑基底、朱红判断、金色指标与东方决策室气质",
    background: "#080604",
    surface: "#14100E",
    elevated: "#1D1512",
    border: "rgba(245, 158, 11, 0.22)",
    primary: "#E11D48",
    secondary: "#F59E0B",
    accent: "#14B8A6",
    warning: "#F97316",
    success: "#22C55E",
    textPrimary: "#FFF7ED",
    textSecondary: "#B8A99A",
    highlights: ["ink black", "cinnabar red", "muted gold", "mythic dashboard", "tactical decision room"],
  },
];

const kpis = [
  { label: "样本评论", value: "1,248", change: "+18.6%", tone: "primary" },
  { label: "负向风险", value: "23.4%", change: "需复核", tone: "accent" },
  { label: "高优先级", value: "42", change: "跨团队", tone: "warning" },
  { label: "正向传播点", value: "7", change: "可沉淀", tone: "success" },
];

const filters = ["全部样本", "近 30 天", "负向优先", "核心玩家", "性能反馈"];
const statuses = ["真实样本", "分析推导", "Mock 演示", "未来接入"];

export default function UiPreviewPage() {
  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Internal UI Preview</p>
        <h1>Black Myth Game Ops Dashboard 视觉方案预览</h1>
        <p>
          以下仅用于审阅视觉语言和色彩氛围。静态示例数据不接入真实看板，不修改业务逻辑、筛选逻辑、图表计算或数据口径。
        </p>
      </header>

      <div className={styles.schemeStack}>
        {schemes.map((scheme) => (
          <SchemePreview key={scheme.id} scheme={scheme} />
        ))}
      </div>
    </main>
  );
}

function SchemePreview({ scheme }: { scheme: Scheme }) {
  const cssVars = {
    "--preview-bg": scheme.background,
    "--preview-surface": scheme.surface,
    "--preview-elevated": scheme.elevated,
    "--preview-border": scheme.border,
    "--preview-primary": scheme.primary,
    "--preview-secondary": scheme.secondary,
    "--preview-accent": scheme.accent,
    "--preview-warning": scheme.warning,
    "--preview-success": scheme.success,
    "--preview-text": scheme.textPrimary,
    "--preview-muted": scheme.textSecondary,
  } as CSSProperties;

  return (
    <section className={`${styles.scheme} ${styles[scheme.id]}`} style={cssVars}>
      <div className={styles.schemeChrome}>
        <header className={styles.dashboardHeader}>
          <div>
            <p className={styles.terminalLabel}>Game Ops Decision Prototype</p>
            <h2>{scheme.name}</h2>
            <p>{scheme.direction}</p>
          </div>
          <div className={styles.headerMeta}>
            <span>最后更新：2026-06-29</span>
            <span>内部方案预览</span>
          </div>
        </header>

        <ColorPalette scheme={scheme} />

        <div className={styles.boundaryGrid}>
          <SourceTile label="数据来源" value="Steam 评论样本" source="真实样本" />
          <SourceTile label="当前范围" value="全部平台 / 全部情绪" source="分析推导" />
          <SourceTile label="演示模块" value="在线趋势与新闻雷达" source="Mock 演示" />
          <SourceTile label="后续扩展" value="多语种与渠道数据" source="未来接入" />
        </div>

        <div className={styles.kpiGrid}>
          {kpis.map((kpi) => (
            <article key={kpi.label} className={`${styles.kpiCard} ${styles[kpi.tone]}`}>
              <div className={styles.kpiTopline}>
                <span>{kpi.label}</span>
                <b>{kpi.change}</b>
              </div>
              <strong>{kpi.value}</strong>
              <p>基于当前筛选后的运营样本概览</p>
            </article>
          ))}
        </div>

        <div className={styles.summaryCard}>
          <PanelHeading title="管理层摘要" badge="分析推导" />
          <div className={styles.summaryGrid}>
            <DecisionBlock
              title="核心发现 #1"
              lines={["低时长负向反馈集中在早期体验", "性能、引导与购买预期需要优先复核", "结论需结合典型评论继续验证"]}
            />
            <DecisionBlock
              title="对应行动 #1"
              lines={["技术与运营共建问题清单", "社区准备 FAQ 与解释口径", "形成下一轮版本沟通素材"]}
            />
          </div>
        </div>

        <div className={styles.filterBar}>
          {filters.map((filter, index) => (
            <button key={filter} className={index === 0 ? styles.activeFilter : undefined}>
              {filter}
            </button>
          ))}
        </div>

        <div className={styles.contentGrid}>
          <article className={styles.chartCard}>
            <PanelHeading title="问题定位图表" badge="真实样本" />
            <div className={styles.chartBody}>
              <div className={styles.axisLabel}>推荐率</div>
              <div className={styles.barSet}>
                {[52, 78, 38, 64, 88].map((height, index) => (
                  <span key={height} style={{ height: `${height}%`, animationDelay: `${index * 80}ms` }} />
                ))}
              </div>
              <div className={styles.lineTrace}>
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className={styles.legend}>
              <span>正向传播</span>
              <span>风险反馈</span>
              <span>待验证</span>
            </div>
          </article>

          <article className={styles.chartCard}>
            <PanelHeading title="玩家四象限" badge="分析推导" />
            <div className={styles.quadrant}>
              <span>早期流失风险</span>
              <span>深度反馈用户</span>
              <span>初期印象良好</span>
              <span>核心口碑用户</span>
              <b className={styles.dotOne} />
              <b className={styles.dotTwo} />
              <b className={styles.dotThree} />
            </div>
          </article>
        </div>

        <div className={styles.actionGrid}>
          <article className={styles.feedbackCard}>
            <PanelHeading title="高优先级反馈池" badge="分析推导" />
            <PriorityRow topic="性能与稳定性" owner="技术" level="高" />
            <PriorityRow topic="Boss 难度理解" owner="策划" level="中" />
            <PriorityRow topic="社区解释成本" owner="社区" level="中" />
          </article>

          <article className={styles.feedbackCard}>
            <PanelHeading title="发行行动建议" badge="分析推导" />
            <div className={styles.actionNote}>
              <b>风险侧</b>
              <p>先验证高频负向主题，再对外整理 FAQ、配置说明和版本沟通节奏。</p>
            </div>
            <div className={styles.actionNote}>
              <b>机会侧</b>
              <p>沉淀正向评论中的 Boss、场景、美术与文化传播素材，进入媒体 Brief。</p>
            </div>
          </article>
        </div>

        <div className={styles.statusRow}>
          {statuses.map((status) => (
            <span key={status}>{status}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ColorPalette({ scheme }: { scheme: Scheme }) {
  const colors = [
    ["背景色", scheme.background],
    ["卡片色", scheme.surface],
    ["主色", scheme.primary],
    ["辅助色", scheme.secondary],
    ["强调色", scheme.accent],
    ["边框色", scheme.border],
    ["正文色", scheme.textPrimary],
    ["辅助文字", scheme.textSecondary],
  ];

  return (
    <div className={styles.palette}>
      {colors.map(([label, value]) => (
        <div key={label} className={styles.swatchItem}>
          <span style={{ background: value }} />
          <div>
            <b>{label}</b>
            <p>{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceTile({ label, value, source }: { label: string; value: string; source: string }) {
  return (
    <article className={styles.sourceTile}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <em>{source}</em>
    </article>
  );
}

function PanelHeading({ title, badge }: { title: string; badge: string }) {
  return (
    <div className={styles.panelHeading}>
      <h3>{title}</h3>
      <span>{badge}</span>
    </div>
  );
}

function DecisionBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <article className={styles.decisionBlock}>
      <h4>{title}</h4>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </article>
  );
}

function PriorityRow({ topic, owner, level }: { topic: string; owner: string; level: string }) {
  return (
    <div className={styles.priorityRow}>
      <strong>{topic}</strong>
      <span>{owner}</span>
      <em>{level}</em>
    </div>
  );
}
