// src/components/Charts.tsx
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS } from "../lib/constants";
import type { Category } from '../lib/types'
import { fmt, fmtShort, todayLocal } from '../lib/helpers'

export function DonutChart({
  data,
  currency,
}: {
  data: Array<{ category: Category; total: number; pct: number }>;
  currency: string;
}) {
  const size = 110, r = 40, cx = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.map(d => {
    const dash = (d.pct / 100) * circumference;
    const gap = circumference - dash;
    const rotate = (offset / 100) * 360 - 90;
    offset += d.pct;
    return { ...d, dash, gap, rotate };
  });
  return (
    <div className="donut-wrap">
      <svg className="donut-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <circle
            key={i} cx={cx} cy={cx} r={r} fill="none"
            stroke={CATEGORY_COLORS[s.category]} strokeWidth={14}
            strokeDasharray={`${s.dash} ${s.gap}`} strokeLinecap="butt"
            transform={`rotate(${s.rotate} ${cx} ${cx})`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        ))}
        <circle cx={cx} cy={cx} r={33} fill="#fff" />
        <text x={cx} y={cx - 5} textAnchor="middle" fontSize="9" fill="#9a9088" fontWeight="600" fontFamily="DM Sans">TOTAL</text>
        <text x={cx} y={cx + 10} textAnchor="middle" fontSize="12" fill="#1a1714" fontWeight="700" fontFamily="Playfair Display, serif">
          {fmtShort(data.reduce((s, d) => s + d.total, 0), currency)}
        </text>
      </svg>
      <div className="donut-legend">
        {data.slice(0, 6).map(d => (
          <div key={d.category} className="legend-row">
            <span className="legend-dot" style={{ background: CATEGORY_COLORS[d.category] }} />
            <span className="legend-label">{CATEGORY_LABELS[d.category]}</span>
            <span className="legend-pct">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineChart({
    series,
    budget,
}: {
    series: Array<{ date: string; cumulative: number }>;
    budget: number;
}) {
    const W = 320, H = 80, PAD = 4;
    if (series.length < 2) return null;
    const maxVal = Math.max(series[series.length - 1].cumulative, budget * series.length);
    const xScale = (i: number) => PAD + (i / (series.length - 1)) * (W - PAD * 2);
    const yScale = (v: number) => H - PAD - (v / maxVal) * (H - PAD * 2);
    const points = series.map((p, i) => `${xScale(i)},${yScale(p.cumulative)}`).join(' ');
    const budgetY = yScale(budget * series.length);
    const areaPath = 
        `M${xScale(0)}, ${H} ` +
        series.map((p, i) => `L${xScale(i)},${yScale(p.cumulative)}`).join(' ') +
        ` L${xScale(series.length - 1)},${H} Z`;
    const firstDate = series[0].date.slice(5);
    const lastDate = series[series.length - 1].date.slice(5);
    const midDate = series[Math.floor(series.length / 2)]?.date.slice(5);
    return (
        <div>
            <svg 
                className="line-chart-wrap"
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                style={{ height: 80, width: '100%' }}
            >
                <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#lineGrad)" />
                {budgetY > PAD && budgetY < H && (
                    <line x1={PAD} y1={budgetY} x2={W - PAD} y2={budgetY}
                        stroke="#c4a87a" strokeWidth="1.2" strokeDasharray="4 3" />
                )}
                <polyline points={points} fill="none" stroke="#3B82F6" strokeWidth="2"
                    strokeLinejoin="round" strokeLinecap="round" />
                <circle
                    cx={xScale(series.length - 1)}
                    cy={yScale(series[series.length - 1].cumulative)}
                    r="3.5" fill="#3B82F6"
                />
            </svg>
            <div className="chart-xaxis">
                <span>{firstDate}</span>
                {midDate && <span>{midDate}</span>}
                <span>{lastDate}</span>
            </div>
        </div>
    );
}

export function DailyBarChart({
    series,
    budget,
    currency,
}: {
    series: Array<{ date: string; total: number }>
    budget: number;
    currency: string;
}) {
    const recent = series.slice(-30);
    const maxVal = Math.max(...recent.map(d => d.total), budget, 1)
    const today = todayLocal();
    const budgetPct = (budget / maxVal) * 100;
    const firstDate = recent[0]?.date.slice(5);
    const lastDate = recent[recent.length - 1]?.date.slice(5);
    return (
        <div className="chart-wrap">
            <div className="budget-line-label">Budget</div>
            <div className="budget-line" style={{ bottom: `${budgetPct}%`, top: 'auto', position: 'absolute' }} />
            <div className="bar-chart">
                {recent.map((d, i) => {
                    const h = Math.max((d.total / maxVal) * 100, d.total > 0 ? 4 : 1);
                    return (
                        <div 
                            key={i}
                            className={`bar-col ${d.total > budget ? 'over' : 'ok'} ${d.date === today ? 'today' : ''}`}
                            style={{ height: `${h}%` }}
                            title={`${d.date}: ${fmt(d.total, currency)}`}
                        />
                    );
                })}
            </div>
            <div className="chart-xaxis">
                <span>{firstDate}</span>
                <span>{lastDate}</span>
            </div>
        </div>
    );
}

export function CategoryBreakdown({
    data,
    currency,
}: {
    data: Array<{ category: Category; total: number; pct: number }>;
    currency: string;
}) {
    return (
        <div style={{ marginTop: 14, borderTop: '1px solid #f0ede7', paddingTop: 10 }}>
            {data.map(d => (
                <div
                    key={d.category}
                    style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 0', borderBottom: '1px solid #f8f6f3',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{CATEGORY_ICONS[d.category]}</span>
                        <span style={{ fontSize: 13, color: '#2d2a26' }}>{CATEGORY_LABELS[d.category]}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(d.total, currency)}</span>
                        <span style={{ fontSize: 11, color: '#9a9088', marginLeft: 6 }}>{d.pct}%</span>
                    </div>
                </div>
            ))}
        </div>
    );
}