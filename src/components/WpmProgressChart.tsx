import React from 'react';
import { EvaluationResult } from '../types';

interface WpmProgressChartProps {
  attempts: EvaluationResult[];
  targetWpm?: number;
}

export const WpmProgressChart: React.FC<WpmProgressChartProps> = ({
  attempts,
  targetWpm = 25
}) => {
  if (!attempts || attempts.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748b', fontSize: '0.85rem' }}>
        <span>📈 Take at least <strong>2 tests</strong> to visualize your speed progress trajectory chart.</span>
      </div>
    );
  }

  // Sort chronological (oldest to newest), take last 15 attempts
  const data = [...attempts]
    .filter((a) => a.timestamp && typeof a.netWpm === 'number')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-15);

  if (data.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748b', fontSize: '0.85rem' }}>
        <span>📈 Take at least <strong>2 tests</strong> to visualize your speed progress trajectory chart.</span>
      </div>
    );
  }

  const wpmValues = data.map((d) => d.netWpm);
  const maxWpm = Math.max(...wpmValues, targetWpm + 5, 30);
  const minWpm = Math.max(0, Math.min(...wpmValues, targetWpm - 5));
  const range = Math.max(maxWpm - minWpm, 10);

  const W = 520;
  const H = 200;
  const PAD = { top: 24, right: 28, bottom: 36, left: 42 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const xStep = chartW / Math.max(data.length - 1, 1);
  const toX = (i: number) => PAD.left + i * xStep;
  const toY = (wpm: number) => PAD.top + chartH - ((wpm - minWpm) / range) * chartH;

  // Build SVG path
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.netWpm).toFixed(1)}`)
    .join(' ');

  // Area fill
  const areaPath = [
    `M ${toX(0).toFixed(1)} ${(PAD.top + chartH).toFixed(1)}`,
    ...data.map((d, i) => `L ${toX(i).toFixed(1)} ${toY(d.netWpm).toFixed(1)}`),
    `L ${toX(data.length - 1).toFixed(1)} ${(PAD.top + chartH).toFixed(1)}`,
    'Z'
  ].join(' ');

  // Y-axis grid ticks (4 steps)
  const gridTicks = [0, 0.33, 0.66, 1].map((t) => ({
    y: PAD.top + chartH * (1 - t),
    label: Math.round(minWpm + range * t)
  }));

  const avgWpm = Math.round(wpmValues.reduce((s, v) => s + v, 0) / wpmValues.length);
  const firstWpm = wpmValues[0];
  const lastWpm = wpmValues[wpmValues.length - 1];
  const delta = lastWpm - firstWpm;
  const highestWpm = Math.max(...wpmValues);

  return (
    <div>
      {/* Chart Header with Metrics */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>📊</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
              Speed Trajectory (Last {data.length} Tests)
            </h4>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Net WPM over time &bull; Target: {targetWpm} WPM
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: '#64748b' }}>Average: </span>
            <strong style={{ color: '#0284c7', fontWeight: 800 }}>{avgWpm} WPM</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Peak: </span>
            <strong style={{ color: '#16a34a', fontWeight: 800 }}>{highestWpm} WPM</strong>
          </div>
          <div
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.75rem',
              background: delta >= 0 ? '#dcfce7' : '#fee2e2',
              color: delta >= 0 ? '#15803d' : '#b91c1c'
            }}
          >
            {delta >= 0 ? `▲ +${delta}` : `▼ ${delta}`} WPM
          </div>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '220px' }}
        >
          <defs>
            <linearGradient id="wpmProgressGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y labels */}
          {gridTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={tick.y}
                x2={PAD.left + chartW}
                y2={tick.y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <text
                x={PAD.left - 6}
                y={tick.y + 3.5}
                textAnchor="end"
                fontSize="9.5"
                fill="#94a3b8"
                fontWeight="600"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Benchmark cutoff target line */}
          {targetWpm >= minWpm && targetWpm <= maxWpm && (
            <g>
              <line
                x1={PAD.left}
                y1={toY(targetWpm)}
                x2={PAD.left + chartW}
                y2={toY(targetWpm)}
                stroke="#f97316"
                strokeWidth="1.5"
                strokeDasharray="5,4"
              />
              <text
                x={PAD.left + chartW + 4}
                y={toY(targetWpm) + 3}
                fontSize="9"
                fill="#ea580c"
                fontWeight="800"
              >
                {targetWpm}
              </text>
            </g>
          )}

          {/* Area under curve */}
          <path d={areaPath} fill="url(#wpmProgressGradient)" />

          {/* Smooth connecting line */}
          <path
            d={linePath}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data points */}
          {data.map((d, i) => {
            const cx = toX(i);
            const cy = toY(d.netWpm);
            const isFirst = i === 0;
            const isLast = i === data.length - 1;
            const isPeak = d.netWpm === highestWpm;

            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={d.isQualified ? 4.5 : 3.5}
                  fill={d.isQualified ? '#16a34a' : '#0284c7'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Score badge on peak, first, and latest */}
                {(isFirst || isLast || isPeak) && (
                  <text
                    x={cx}
                    y={cy - 8}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill={d.isQualified ? '#15803d' : '#0f172a'}
                    fontWeight="800"
                  >
                    {d.netWpm}
                  </text>
                )}
              </g>
            );
          })}

          {/* X axis dates */}
          {data.map((d, i) => {
            if (data.length > 7 && i % 2 !== 0 && i !== data.length - 1) return null;
            const dt = new Date(d.timestamp);
            const label = !isNaN(dt.getTime())
              ? `${dt.getDate()}/${dt.getMonth() + 1}`
              : `#${i + 1}`;
            return (
              <text
                key={i}
                x={toX(i)}
                y={H - 8}
                textAnchor="middle"
                fontSize="9"
                fill="#94a3b8"
                fontWeight="600"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '6px',
          fontSize: '0.72rem',
          color: '#64748b'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
          Qualified (Cutoff met)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
          Attempt
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '14px', height: '2px', background: '#f97316' }} />
          {targetWpm} WPM Cutoff
        </span>
      </div>
    </div>
  );
};
