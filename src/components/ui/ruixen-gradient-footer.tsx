"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Stop = { offset: number; color: string };

const WIDTH = 1271;
const HEIGHT = 599;
const STOPS: Stop[] = [
  { offset: 0, color: "#102A1B" },
  { offset: 0.1827, color: "#17673F" },
  { offset: 0.2837, color: "#3FA66C" },
  { offset: 0.4135, color: "#C9EFA4" },
  { offset: 0.5866, color: "#D4FE2B" },
  { offset: 0.6827, color: "#8BCF44" },
  { offset: 0.8029, color: "#3F7D45" },
  { offset: 1, color: "#3F7D4500" },
];

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function barHeights(count: number, peak: number, valley: number) {
  const midpoint = (count - 1) / 2;
  return Array.from({ length: count }, (_, index) => {
    const distance = midpoint === 0 ? 0 : Math.abs(index - midpoint) / midpoint;
    return peak * HEIGHT * (valley + (1 - valley) * (1 - distance ** 1.24));
  });
}

export interface RuixenGradientFooterProps {
  children?: ReactNode;
  gradientHeight?: string;
  minReveal?: number;
  bars?: number;
  blur?: number;
  peak?: number;
  valley?: number;
  stops?: Stop[];
  className?: string;
  style?: CSSProperties;
}

export function RuixenGradientFooter({
  children,
  gradientHeight = "40vh",
  minReveal = 0.045,
  bars = 9,
  blur = 15,
  peak = 0.98,
  valley = 0.55,
  stops = STOPS,
  className,
  style,
}: RuixenGradientFooterProps) {
  const id = useId().replace(/:/g, "");
  const bandRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(minReveal);
  const columnCount = Math.max(1, Math.floor(bars));
  const columnWidth = WIDTH / columnCount;

  useEffect(() => {
    const band = bandRef.current;
    if (!band) return;

    const doc = band.ownerDocument;
    const win = doc.defaultView ?? window;
    const measure = () => {
      const height = band.offsetHeight || 1;
      const remaining = doc.documentElement.scrollHeight - win.innerHeight - win.scrollY;
      const reveal = clamp((height - remaining) / height);
      setProgress(clamp(minReveal + (1 - minReveal) * reveal));
    };

    measure();
    win.addEventListener("scroll", measure, { passive: true });
    win.addEventListener("resize", measure, { passive: true });
    return () => {
      win.removeEventListener("scroll", measure);
      win.removeEventListener("resize", measure);
    };
  }, [minReveal]);

  return (
    <footer className={className} style={{ paddingBottom: gradientHeight, ...style }}>
      {children}
      <div
        ref={bandRef}
        className="gradient-footer-band"
        aria-hidden="true"
        style={{ height: gradientHeight, transform: `scaleY(${progress})` }}
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id={`footer-gradient-${id}`} x1="0" y1="1" x2="0" y2="0">
              {stops.map((stop, index) => (
                <stop key={index} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
            <filter id={`footer-blur-${id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={blur} />
            </filter>
          </defs>
          {barHeights(columnCount, peak, valley).map((height, index) => (
            <g key={index} filter={`url(#footer-blur-${id})`}>
              <rect
                x={index * columnWidth}
                y={HEIGHT - height}
                width={columnWidth * 1.23}
                height={height}
                fill={`url(#footer-gradient-${id})`}
              />
            </g>
          ))}
        </svg>
      </div>
    </footer>
  );
}
