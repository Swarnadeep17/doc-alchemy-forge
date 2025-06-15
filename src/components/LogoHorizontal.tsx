
import React from "react";

// 1-line logo with SVG "D" and "DocEnclave" text next to it.
export const LogoHorizontal = ({
  className = "",
  size = 36,
}: {
  className?: string;
  size?: number;
}) => (
  <span className={`flex items-center gap-2 font-mono font-extrabold text-white text-2xl md:text-3xl select-none ${className}`}>
    {/* SVG D - same style as before but scaled to size prop */}
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className="drop-shadow-[0_0_16px_#fff3]"
      aria-hidden="true"
      style={{
        filter:
          "drop-shadow(0 0 6px #fff8),drop-shadow(0 0 32px #57cbfd12)",
      }}
    >
      <rect
        x="7"
        y="7"
        rx="16"
        width="50"
        height="50"
        fill="rgba(44,44,44,0.72)"
        stroke="#e9e9e9"
        strokeWidth="2.5"
        style={{ filter: "drop-shadow(0 0 8px #fff3)" }}
      />
      <path
        d="M25 17h13a13 13 0 1 1 0 26h-13V17z"
        fill="#fff"
        style={{ filter: "drop-shadow(0 0 14px #e9e9e9)" }}
      />
      <path
        d="M25 17h13a13 13 0 1 1 0 26h-13V17z"
        fill="none"
        stroke="#9DECF9"
        strokeWidth="2"
        style={{ filter: "drop-shadow(0 0 12px #9DECF966)" }}
      />
    </svg>
    <span className="uppercase tracking-widest">DocEnclave</span>
  </span>
);
