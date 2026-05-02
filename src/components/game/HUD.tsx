import React from 'react';
import { Trophy } from 'lucide-react';

interface HUDProps {
  score: number;
  highScore: number;
}

export const HUD: React.FC<HUDProps> = ({ score, highScore }) => (
  <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
    <div className="bg-black/60 backdrop-blur-md border border-red-500/30 px-3 py-1 rounded-xl">
      <span className="text-red-400 font-black text-lg">{score.toString().padStart(2, '0')}</span>
    </div>
    <div className="bg-black/60 backdrop-blur-md border border-red-500/30 px-3 py-1 flex flex-col items-end rounded-xl">
      <span className="text-[8px] text-red-400/80 uppercase tracking-widest flex items-center gap-1">
        <Trophy size={8} /> Best
      </span>
      <span className="text-red-400 font-bold text-xs">{highScore}</span>
    </div>
  </div>
);