import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TestResult } from '../types';
import { TrendingUp, Award, Activity, History } from 'lucide-react';

interface WpmTrendChartProps {
  sessionHistory: TestResult[];
}

export default function WpmTrendChart({ sessionHistory }: WpmTrendChartProps) {
  const [metric, setMetric] = useState<'wpm' | 'accuracy' | 'both'>('both');

  if (!sessionHistory || sessionHistory.length === 0) {
    return null;
  }

  // Reverse history so we show progress from oldest (left) to newest (right)
  const chartData = [...sessionHistory]
    .reverse()
    .map((result, idx) => {
      const date = new Date(result.timestamp);
      return {
        attempt: idx + 1,
        wpm: Math.round(result.wpm),
        rawWpm: Math.round(result.rawWpm),
        accuracy: Math.round(result.accuracy),
        timeLabel: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateLabel: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        mode: result.config.mode,
      };
    });

  // Calculate Growth statistics
  const wpms = chartData.map((d) => d.wpm);
  const averageWpm = Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length);
  const maxWpm = Math.max(...wpms);
  
  // Growth rate: compare average of first 20% vs last 20% of attempts, or first vs last if small
  let growthPercent = 0;
  if (chartData.length > 1) {
    const firstWpm = chartData[0].wpm;
    const lastWpm = chartData[chartData.length - 1].wpm;
    if (firstWpm > 0) {
      growthPercent = Math.round(((lastWpm - firstWpm) / firstWpm) * 100);
    }
  }

  return (
    <div className="bg-brand-bg border-2 border-brand-ink p-6 transition-all duration-200" id="wpm-trend-chart-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-brand-ink pb-4 mb-6 gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-accent animate-bounce" />
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-brand-ink">WPM Growth & Analytics</h3>
            <p className="text-[10px] text-brand-ink/50 uppercase font-mono">Continuous learning curve tracker</p>
          </div>
        </div>

        {/* Metric Toggles */}
        <div className="flex bg-brand-bg border border-brand-ink p-0.5 gap-1 self-start md:self-auto">
          {(['both', 'wpm', 'accuracy'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-2.5 py-1 font-mono text-[10px] font-bold uppercase transition-all ${
                metric === m
                  ? 'bg-brand-ink text-brand-bg'
                  : 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-ink/5'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-brand-ink/30 bg-brand-bg/20 p-3 flex flex-col justify-between">
          <span className="font-mono text-[9px] uppercase text-brand-ink/50 font-semibold block">Average Speed</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl md:text-2xl font-black text-brand-ink">{averageWpm}</span>
            <span className="text-[9px] uppercase font-mono text-brand-ink/60">WPM</span>
          </div>
        </div>
        <div className="border border-brand-ink/30 bg-brand-bg/20 p-3 flex flex-col justify-between">
          <span className="font-mono text-[9px] uppercase text-brand-ink/50 font-semibold block">Personal Best</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl md:text-2xl font-black text-brand-accent">{maxWpm}</span>
            <span className="text-[9px] uppercase font-mono text-brand-ink/60">WPM</span>
          </div>
        </div>
        <div className="border border-brand-ink/30 bg-brand-bg/20 p-3 flex flex-col justify-between">
          <span className="font-mono text-[9px] uppercase text-brand-ink/50 font-semibold block">Net Growth</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl md:text-2xl font-black ${growthPercent >= 0 ? 'text-brand-ink' : 'text-brand-accent'}`}>
              {growthPercent >= 0 ? '+' : ''}{growthPercent}%
            </span>
            <span className="text-[9px] uppercase font-mono text-brand-ink/60">Trend</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="w-full h-[240px] md:h-[280px]" id="recharts-trend-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--brand-ink)"
              opacity={0.1}
              vertical={false}
            />
            <XAxis
              dataKey="attempt"
              tickLine={false}
              axisLine={{ stroke: 'var(--brand-ink)', strokeWidth: 1.5 }}
              tick={{ fill: 'var(--brand-ink)', fontSize: 9, fontFamily: 'monospace' }}
              label={{
                value: 'ATTEMPTS',
                position: 'insideBottom',
                offset: -10,
                fill: 'var(--brand-ink)',
                opacity: 0.5,
                fontSize: 8,
                fontFamily: 'monospace',
              }}
            />
            <YAxis
              yAxisId="left"
              domain={['auto', 'auto']}
              tickLine={false}
              axisLine={{ stroke: 'var(--brand-ink)', strokeWidth: 1.5 }}
              tick={{ fill: 'var(--brand-ink)', fontSize: 9, fontFamily: 'monospace' }}
            />
            {metric === 'both' && (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tickLine={false}
                axisLine={{ stroke: 'var(--brand-ink)', strokeWidth: 1.5 }}
                tick={{ fill: 'var(--brand-ink)', fontSize: 9, fontFamily: 'monospace' }}
              />
            )}

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-brand-bg border-2 border-brand-ink p-3 shadow-sm font-mono text-[10px] uppercase text-brand-ink">
                      <p className="font-bold border-b border-brand-ink/20 pb-1 mb-1 text-brand-accent">
                        Attempt #{data.attempt} ({data.mode})
                      </p>
                      <p className="text-brand-ink/60">
                        Date: <span className="text-brand-ink font-bold">{data.dateLabel} {data.timeLabel}</span>
                      </p>
                      {payload.map((p, idx) => (
                        <p key={idx} className="mt-1" style={{ color: p.color }}>
                          {p.name}: <span className="font-bold">{p.value}</span>
                          {p.name === 'Accuracy' ? '%' : ' WPM'}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend
              verticalAlign="top"
              height={36}
              iconType="plainline"
              wrapperStyle={{
                fontFamily: 'monospace',
                fontSize: '9px',
                textTransform: 'uppercase',
                color: 'var(--brand-ink)',
              }}
            />

            {(metric === 'wpm' || metric === 'both') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="wpm"
                name="Net Speed"
                stroke="var(--brand-accent)"
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 1, fill: 'var(--brand-bg)' }}
                activeDot={{ r: 5 }}
                animationDuration={500}
              />
            )}

            {(metric === 'wpm' || metric === 'both') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="rawWpm"
                name="Raw Speed"
                stroke="var(--brand-ink)"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                opacity={0.4}
                dot={{ r: 2 }}
                animationDuration={500}
              />
            )}

            {(metric === 'accuracy' || metric === 'both') && (
              <Line
                yAxisId={metric === 'both' ? 'right' : 'left'}
                type="monotone"
                dataKey="accuracy"
                name="Accuracy"
                stroke="var(--brand-ink)"
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 1, fill: 'var(--brand-bg)' }}
                activeDot={{ r: 5 }}
                animationDuration={500}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 border-t border-brand-ink/10 pt-3 flex items-center justify-between text-[10px] text-brand-ink/60 font-mono uppercase">
        <span className="flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-brand-accent" />
          Realtime interactive analysis
        </span>
        <span className="flex items-center gap-1">
          <History className="w-3.5 h-3.5" />
          Historical learning trend
        </span>
      </div>
    </div>
  );
}
