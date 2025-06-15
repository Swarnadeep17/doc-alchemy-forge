
import React from "react";

interface USPCardProps {
  title: string;
  description: string;
}

export const USPCard: React.FC<USPCardProps> = ({ title, description }) => (
  <div className="relative group bg-black/80 border border-cyan-400/30 rounded-2xl shadow-[0_2px_36px_2px_rgba(8,246,255,0.06)] px-5 py-7 flex flex-col items-start justify-center hover:shadow-[0_4px_60px_3px_rgba(19,251,255,0.18)] transition-all overflow-hidden min-h-[112px]">
    {/* Neon/cyan bottom glow */}
    <span className="absolute bottom-0 left-0 w-full h-1 bg-cyan-400/60 blur-md opacity-80 group-hover:opacity-100 transition" />
    <span className="text-lg font-bold font-mono tracking-wide text-white mb-1 drop-shadow-[0_2px_12px_cyan] uppercase">
      {title}
    </span>
    <span className="text-sm text-cyan-100 font-semibold tracking-tight leading-normal z-10">
      {description}
    </span>
  </div>
);

