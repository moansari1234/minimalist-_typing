import { TestResult } from '../types';
import { RefreshCw, Target, Flame, ArrowRight, Award } from 'lucide-react';

interface StatsPanelProps {
  result: TestResult;
  onRestart: () => void;
  onStartFocusedPractice: (chars: string[], words: string[]) => void;
  onClose: () => void;
}

export default function StatsPanel({
  result,
  onRestart,
  onStartFocusedPractice,
  onClose,
}: StatsPanelProps) {
  const { wpm, rawWpm, accuracy, correctChars, incorrectChars, missedChars, datapoints } = result;

  // Find missed characters sorted by count descending
  const missedList = Object.entries(missedChars)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Missed words (unique, up to 10)
  const missedWordsUnique = Array.from(new Set(result.missedWords)).slice(0, 10);

  // SVG dimensions for the custom graph
  const width = 600;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 30;

  // Calculate scales
  const points = datapoints.length > 0 ? datapoints : [{ second: 0, wpm: 0, rawWpm: 0, accuracy: 100 }];
  const maxSecond = Math.max(...points.map((p) => p.second), 1);
  const maxWpm = Math.max(...points.map((p) => Math.max(p.wpm, p.rawWpm)), 60);

  const getX = (second: number) => {
    return paddingLeft + (second / maxSecond) * (width - paddingLeft - paddingRight);
  };

  const getY = (val: number) => {
    return height - paddingBottom - (val / maxWpm) * (height - paddingTop - paddingBottom);
  };

  const getAccuracyY = (acc: number) => {
    return height - paddingBottom - (acc / 100) * (height - paddingTop - paddingBottom);
  };

  // Build SVG Path strings for WPM
  let wpmPath = '';
  let rawWpmPath = '';
  let accuracyPath = '';
  let areaPath = '';

  if (points.length > 0) {
    wpmPath = `M ${getX(points[0].second)} ${getY(points[0].wpm)}`;
    areaPath = `M ${getX(points[0].second)} ${height - paddingBottom}`;
    areaPath += ` L ${getX(points[0].second)} ${getY(points[0].wpm)}`;
    
    rawWpmPath = `M ${getX(points[0].second)} ${getY(points[0].rawWpm)}`;
    accuracyPath = `M ${getX(points[0].second)} ${getAccuracyY(points[0].accuracy)}`;

    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      wpmPath += ` L ${getX(p.second)} ${getY(p.wpm)}`;
      rawWpmPath += ` L ${getX(p.second)} ${getY(p.rawWpm)}`;
      accuracyPath += ` L ${getX(p.second)} ${getAccuracyY(p.accuracy)}`;
      areaPath += ` L ${getX(p.second)} ${getY(p.wpm)}`;
    }

    areaPath += ` L ${getX(points[points.length - 1].second)} ${height - paddingBottom} Z`;
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-brand-bg/40 border-2 border-brand-ink p-6 md:p-8 text-brand-ink animate-fadeIn" id="stats-panel-container">
      {/* Header section with score highlights */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-brand-ink pb-6 mb-8 gap-4" id="stats-header">
        <div className="flex items-center gap-3">
          <div className="bg-brand-accent text-brand-bg p-2.5 rounded-none">
            <Award className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-mono uppercase tracking-tight">Performance Results</h2>
            <p className="text-brand-ink/60 text-xs font-mono uppercase tracking-wider mt-1">Review your session metrics and track progress</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-brand-ink/5 text-brand-ink text-xs font-mono font-bold uppercase border border-brand-ink transition duration-150 cursor-pointer"
            id="stats-btn-retry"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-brand-ink hover:bg-brand-accent text-brand-bg text-xs font-mono font-bold uppercase border border-brand-ink transition duration-150 cursor-pointer"
            id="stats-btn-done"
          >
            Close Results
          </button>
        </div>
      </div>

      {/* Main Metrics Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" id="stats-numbers-grid">
        <div className="bg-brand-bg border border-brand-ink p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-accent" />
          <span className="text-brand-ink/50 uppercase tracking-wider font-mono text-[10px] font-bold mb-1">Net WPM</span>
          <span className="text-4xl md:text-5xl font-black font-sans text-brand-accent leading-none">{Math.round(wpm)}</span>
          <span className="text-brand-ink/40 font-mono text-[9px] uppercase tracking-wider mt-2">Adjusted speed</span>
        </div>

        <div className="bg-brand-bg border border-brand-ink p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-ink/40" />
          <span className="text-brand-ink/50 uppercase tracking-wider font-mono text-[10px] font-bold mb-1">Raw WPM</span>
          <span className="text-4xl md:text-5xl font-black font-sans text-brand-ink/80 leading-none">{Math.round(rawWpm)}</span>
          <span className="text-brand-ink/40 font-mono text-[9px] uppercase tracking-wider mt-2">Before penalties</span>
        </div>

        <div className="bg-brand-bg border border-brand-ink p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-ink" />
          <span className="text-brand-ink/50 uppercase tracking-wider font-mono text-[10px] font-bold mb-1">Accuracy</span>
          <span className="text-4xl md:text-5xl font-black font-sans text-brand-ink leading-none">{Math.round(accuracy)}%</span>
          <span className="text-brand-ink/40 font-mono text-[9px] uppercase tracking-wider mt-2">Correct strokes</span>
        </div>

        <div className="bg-brand-bg border border-brand-ink p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-accent" />
          <span className="text-brand-ink/50 uppercase tracking-wider font-mono text-[10px] font-bold mb-1">Keys (Ok/Err)</span>
          <div className="flex items-baseline gap-1 mt-1 font-mono">
            <span className="text-2xl md:text-3.5xl font-bold text-brand-ink">{correctChars}</span>
            <span className="text-brand-ink/30">/</span>
            <span className="text-2xl md:text-3.5xl font-bold text-brand-accent">{incorrectChars}</span>
          </div>
          <span className="text-brand-ink/40 font-mono text-[9px] uppercase tracking-wider mt-2">Total characters</span>
        </div>
      </div>

      {/* Speed Graph section */}
      <div className="bg-brand-bg/60 border-2 border-brand-ink p-5 mb-8" id="stats-graph-container">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-2 border-b border-brand-ink/10 pb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-brand-accent" />
            <h3 className="font-mono text-xs font-bold text-brand-ink uppercase tracking-wider">Speed & Accuracy Timeline</h3>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-brand-ink/60">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-brand-accent inline-block" />
              <span>Net WPM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 border-t-2 border-dashed border-brand-ink/60 inline-block" />
              <span>Raw WPM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-brand-ink inline-block" />
              <span>Accuracy %</span>
            </div>
          </div>
        </div>

        {/* SVG Drawing area */}
        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity="0.12" />
                <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const yVal = Math.round(ratio * maxWpm);
              const yPos = getY(yVal);
              return (
                <g key={i} className="opacity-15">
                  <line
                    x1={paddingLeft}
                    y1={yPos}
                    x2={width - paddingRight}
                    y2={yPos}
                    stroke="var(--brand-ink)"
                    strokeWidth="0.75"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={yPos + 4}
                    textAnchor="end"
                    className="fill-brand-ink text-[10px] font-mono"
                  >
                    {yVal}
                  </text>
                </g>
              );
            })}

            {/* Horizontal axis time markers */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const tVal = Math.round(ratio * maxSecond);
              const xPos = getX(tVal);
              return (
                <text
                  key={i}
                  x={xPos}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-brand-ink/60 text-[10px] font-mono opacity-80"
                >
                  {tVal}s
                </text>
              );
            })}

            {/* Area Fill */}
            {points.length > 1 && (
              <path d={areaPath} fill="url(#areaGrad)" />
            )}

            {/* Raw WPM Line (Dashed black) */}
            {points.length > 1 && (
              <path
                d={rawWpmPath}
                fill="none"
                stroke="var(--brand-ink)"
                strokeWidth="1.25"
                strokeDasharray="3 3"
                opacity="0.4"
              />
            )}

            {/* Net WPM Line (Solid Red Accent) */}
            {points.length > 1 && (
              <path
                d={wpmPath}
                fill="none"
                stroke="var(--brand-accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Accuracy Line (Solid Black) */}
            {points.length > 1 && (
              <path
                d={accuracyPath}
                fill="none"
                stroke="var(--brand-ink)"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
            )}

            {/* Data Points */}
            {points.map((p, idx) => (
              <circle
                key={idx}
                cx={getX(p.second)}
                cy={getY(p.wpm)}
                r="3"
                className="fill-brand-accent stroke-brand-bg stroke-2 hover:r-5 transition-all cursor-crosshair"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Error analysis and targeted recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="stats-analysis-grid">
        {/* Missed Characters */}
        <div className="bg-brand-bg border border-brand-ink p-5">
          <div className="flex items-center justify-between mb-4 border-b border-brand-ink/10 pb-2">
            <span className="font-mono text-xs font-bold text-brand-ink uppercase tracking-wider">Missed Characters</span>
            <span className="font-mono text-[9px] text-brand-ink/50 uppercase">Char : Errors</span>
          </div>
          
          {missedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-brand-ink/60">
              <span className="text-brand-accent font-mono text-xs font-bold uppercase mb-1">Pristine Accuracy!</span>
              <span className="text-xs font-sans">No key registry errors this session.</span>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {missedList.map(([char, count]) => (
                  <div
                    key={char}
                    className="flex items-center gap-1.5 px-3 py-1 bg-brand-bg border border-brand-ink text-xs font-mono"
                  >
                    <span className="font-bold text-brand-accent">
                      {char === ' ' ? 'Space' : char}
                    </span>
                    <span className="text-brand-ink/50">x{count}</span>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => {
                  const chars = missedList.map(([char]) => char);
                  onStartFocusedPractice(chars, []);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-ink text-brand-bg hover:bg-brand-accent hover:border-brand-accent transition duration-150 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
                id="stats-btn-focused-chars"
              >
                <Target className="w-4 h-4" />
                Practice Missed Chars
                <ArrowRight className="w-3.5 h-3.5 ml-0.5 animate-pulse" />
              </button>
            </div>
          )}
        </div>

        {/* Missed Words */}
        <div className="bg-brand-bg border border-brand-ink p-5">
          <div className="flex items-center justify-between mb-4 border-b border-brand-ink/10 pb-2">
            <span className="font-mono text-xs font-bold text-brand-ink uppercase tracking-wider">Missed Words</span>
            <span className="font-mono text-[9px] text-brand-ink/50 uppercase">Spelling errors</span>
          </div>

          {missedWordsUnique.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-brand-ink/60">
              <span className="text-brand-accent font-mono text-xs font-bold uppercase mb-1">Flawless Spellcheck!</span>
              <span className="text-xs font-sans">Every single word was parsed successfully.</span>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {missedWordsUnique.map((word, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-brand-bg border border-brand-ink text-xs font-mono text-brand-ink"
                  >
                    {word}
                  </span>
                ))}
              </div>

              <button
                onClick={() => {
                  onStartFocusedPractice([], missedWordsUnique);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-ink text-brand-bg hover:bg-brand-accent hover:border-brand-accent transition duration-150 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
                id="stats-btn-focused-words"
              >
                <Target className="w-4 h-4" />
                Practice Missed Words
                <ArrowRight className="w-3.5 h-3.5 ml-0.5 animate-pulse" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
