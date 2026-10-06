import type { ComponentPropsWithoutRef } from "react";

type LogoProps = ComponentPropsWithoutRef<"span"> & {
  as?: "span" | "div";
};

export function GlobalLogo({ as: Tag = "span", className = "", ...props }: LogoProps) {
  return (
    <Tag className={`global-logo ${className}`.trim()} aria-label="GLOBAL" {...props}>
      <span className="global-logo-main">GLO</span>
      <span className="global-logo-accent">BAL</span>
    </Tag>
  );
}

export function GlobalEmblem({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`global-emblem ${className}`.trim()}
      viewBox="0 0 160 160"
      role="img"
      aria-label="Эмблема GLOBAL"
    >
      <defs>
        <linearGradient id="global-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#245da8" />
          <stop offset="1" stopColor="#173f78" />
        </linearGradient>
        <linearGradient id="global-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e43e3f" />
          <stop offset="0.48" stopColor="#e43e3f" />
          <stop offset="0.52" stopColor="#245da8" />
          <stop offset="1" stopColor="#173f78" />
        </linearGradient>
        <filter id="global-emboss" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#071a12" floodOpacity=".28" />
        </filter>
      </defs>
      <ellipse cx="80" cy="80" rx="73" ry="65" fill="url(#global-blue)" stroke="#e2bb2d" strokeWidth="5" />
      <circle cx="80" cy="80" r="61" fill="none" stroke="#d1a91f" strokeWidth="2" />
      {[
        [80, 20], [112, 29], [134, 55], [140, 88], [125, 119], [96, 138],
        [63, 138], [34, 119], [20, 88], [26, 55], [48, 29],
      ].map(([x, y], index) => (
        <path
          key={index}
          d="M0-5 1.47-1.55 4.76-1.55 2.38.59 3.85 4.05 0 2-3.85 4.05-2.38.59-4.76-1.55-1.47-1.55Z"
          fill="#e2bb2d"
          transform={`translate(${x} ${y}) scale(.72)`}
        />
      ))}
      <path
        d="M112 58c-7-11-18-17-32-17-23 0-39 17-39 40 0 24 16 40 40 40 22 0 38-14 38-36v-8H79v17h19c-4 7-10 10-18 10-13 0-21-10-21-23 0-14 9-24 22-24 8 0 14 3 18 9Z"
        fill="url(#global-g)"
        filter="url(#global-emboss)"
      />
    </svg>
  );
}
