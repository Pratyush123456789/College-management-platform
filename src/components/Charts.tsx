import React, { useState } from 'react';

interface TrendPoint {
  label: string;
  primary: number;
  secondary?: number;
  meta?: string;
}

export function SgpaTrendChart({
  data,
  primaryLabel = 'Student SGPA',
  secondaryLabel = 'Batch Avg',
}: {
  data: TrendPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const width = 520;
  const height = 220;
  const padX = 44;
  const padY = 24;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;
  const minVal = 6.5;
  const maxVal = 10;

  const getX = (i: number) =>
    data.length <= 1 ? padX + plotW / 2 : padX + (i / (data.length - 1)) * plotW;
  const getY = (val: number) =>
    padY + plotH - ((Math.min(maxVal, Math.max(minVal, val)) - minVal) / (maxVal - minVal)) * plotH;

  const primaryPoints = data.map((d, i) => `${getX(i)},${getY(d.primary)}`).join(' ');
  const areaPoints = `${getX(0)},${padY + plotH} ${primaryPoints} ${getX(data.length - 1)},${padY + plotH}`;
  const secondaryPoints = data
    .filter((d) => typeof d.secondary === 'number')
    .map((d, i) => `${getX(i)},${getY(d.secondary as number)}`)
    .join(' ');

  const active = hoveredIdx !== null ? data[hoveredIdx] : data[data.length - 1];

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-5 text-xs text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
            <span className="w-3 h-0.5 bg-[#0F274A] dark:bg-amber-400 inline-block" />
            {primaryLabel}
          </span>
          {data.some((d) => typeof d.secondary === 'number') && (
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-600 dark:border-sky-400 inline-block" />
              {secondaryLabel}
            </span>
          )}
        </div>
        {active && (
          <div className="text-xs font-mono tabular-nums text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">
            {active.label}: <span className="font-semibold text-[#0F274A] dark:text-amber-400">{active.primary.toFixed(2)}</span>
            {typeof active.secondary === 'number' && (
              <span className="text-slate-500 dark:text-slate-400 ml-2">· Avg {active.secondary.toFixed(2)}</span>
            )}
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-52 overflow-visible" role="img" aria-label="SGPA progression chart">
        <defs>
          <linearGradient id="sgpaAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D97706" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#0F274A" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {[7.0, 8.0, 9.0, 10.0].map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="3 3" />
              <text x={padX - 8} y={y + 4} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono">
                {tick.toFixed(1)}
              </text>
            </g>
          );
        })}

        <polygon points={areaPoints} fill="url(#sgpaAreaGrad)" />

        {secondaryPoints && (
          <polyline
            fill="none"
            className="stroke-amber-600 dark:stroke-sky-400"
            strokeWidth="2"
            strokeDasharray="5 4"
            points={secondaryPoints}
          />
        )}

        <polyline
          fill="none"
          className="stroke-[#0F274A] dark:stroke-amber-400"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={primaryPoints}
        />

        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.primary);
          const isHovered = hoveredIdx === i;
          return (
            <g
              key={d.label}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 7 : 4.5}
                className="fill-white dark:fill-slate-900 stroke-[#0F274A] dark:stroke-amber-400 transition-all"
                strokeWidth="2.5"
              />
              <text x={cx} y={height - 4} textAnchor="middle" className="fill-slate-600 dark:fill-slate-400 text-[11px] font-medium">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface BarDatum {
  label: string;
  value: number;
  maxValue?: number;
  secondaryValue?: number;
  sublabel?: string;
}

export function HorizontalBarChart({
  data,
  unit = '',
  barColor,
  accentThreshold,
  onSelectBar,
}: {
  data: BarDatum[];
  unit?: string;
  barColor?: string;
  accentThreshold?: number;
  onSelectBar?: (item: BarDatum) => void;
}) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const max = item.maxValue ?? 100;
        const pct = Math.min(100, Math.max(0, (item.value / max) * 100));
        const isBelow = accentThreshold !== undefined && item.value < accentThreshold;
        const isHovered = hoveredLabel === item.label;
        return (
          <div
            key={item.label}
            onMouseEnter={() => setHoveredLabel(item.label)}
            onMouseLeave={() => setHoveredLabel(null)}
            onClick={() => onSelectBar?.(item)}
            className={`space-y-1 rounded-md px-1.5 py-1 -mx-1.5 transition-colors ${
              onSelectBar ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70' : ''
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-3">{item.label}</span>
              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 shrink-0">
                {item.value}
                {unit}
                {item.sublabel ? (
                  <span className="text-slate-400 dark:text-slate-500 ml-1.5">({item.sublabel})</span>
                ) : null}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
              <div
                className={`h-full rounded-sm transition-all duration-300 ${
                  isBelow
                    ? 'bg-red-700 dark:bg-red-500'
                    : isHovered
                    ? 'bg-amber-600 dark:bg-amber-400'
                    : barColor
                    ? ''
                    : 'bg-[#0F274A] dark:bg-sky-500'
                }`}
                style={{
                  width: `${pct}%`,
                  ...(barColor && !isBelow && !isHovered ? { backgroundColor: barColor } : {}),
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function VerticalBarChart({
  data,
  maxValue = 100,
  targetLine,
  unit = '',
}: {
  data: BarDatum[];
  maxValue?: number;
  targetLine?: number;
  unit?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const width = 520;
  const height = 210;
  const padX = 36;
  const padTop = 20;
  const padBottom = 34;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;
  const slotW = plotW / Math.max(1, data.length);
  const barW = Math.min(44, slotW * 0.56);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-52 overflow-visible" role="img" aria-label="Bar analytics chart">
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padTop + plotH * (1 - ratio);
          return (
            <g key={ratio}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="2 3" />
              <text x={padX - 6} y={y + 4} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono">
                {Math.round(maxValue * ratio)}
              </text>
            </g>
          );
        })}

        {targetLine !== undefined && (
          <g>
            <line
              x1={padX}
              y1={padTop + plotH * (1 - targetLine / maxValue)}
              x2={width - padX}
              y2={padTop + plotH * (1 - targetLine / maxValue)}
              className="stroke-amber-600 dark:stroke-amber-400"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text
              x={width - padX}
              y={padTop + plotH * (1 - targetLine / maxValue) - 5}
              textAnchor="end"
              className="fill-amber-700 dark:fill-amber-400 text-[10px] font-mono font-medium"
            >
              Target {targetLine}{unit}
            </text>
          </g>
        )}

        {data.map((d, i) => {
          const barH = Math.max(4, (Math.min(maxValue, d.value) / maxValue) * plotH);
          const x = padX + i * slotW + (slotW - barW) / 2;
          const y = padTop + plotH - barH;
          const isHovered = hovered === i;
          return (
            <g
              key={d.label}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={3}
                className={`transition-colors duration-150 ${
                  isHovered
                    ? 'fill-amber-600 dark:fill-amber-400'
                    : 'fill-[#0F274A] dark:fill-sky-500'
                }`}
              />
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                className={`text-[10px] font-mono tabular-nums ${
                  isHovered
                    ? 'fill-amber-700 dark:fill-amber-300 font-semibold'
                    : 'fill-slate-600 dark:fill-slate-300'
                }`}
              >
                {d.value}{unit}
              </text>
              <text x={x + barW / 2} y={height - 10} textAnchor="middle" className="fill-slate-600 dark:fill-slate-400 text-[11px] font-medium">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DonutGauge({
  percentage,
  label,
  sublabel,
  threshold = 75,
}: {
  percentage: number;
  label: string;
  sublabel: string;
  threshold?: number;
}) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clamped / 100) * circumference;
  const isHealthy = clamped >= threshold;

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-32 h-32 shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            className={`transition-all duration-300 ${
              isHealthy ? 'stroke-[#0F274A] dark:stroke-amber-400' : 'stroke-red-700 dark:stroke-red-500'
            }`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">{clamped.toFixed(1)}%</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Min {threshold}%</span>
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</div>
        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{sublabel}</div>
        <div className={`text-xs font-medium mt-2 ${isHealthy ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
          {isHealthy ? 'GGSIPU Exam Eligible' : 'Below 75% Mandate — Action Required'}
        </div>
      </div>
    </div>
  );
}
