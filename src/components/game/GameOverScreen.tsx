import React from 'react';
import { RotateCcw, Home } from 'lucide-react';

interface GameOverProps {
  score: number;
  highScore: number;
  roastMsg: string;
  onRetry: () => void;
  onMenu: () => void;
}

export const GameOverScreen: React.FC<GameOverProps> = ({ score, highScore, roastMsg, onRetry, onMenu }) => (
  <div className="absolute inset-0 z-30 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
    <div className="text-4xl mb-4">💀</div>
    <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">BLOCKED!</h2>
    <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg mb-6 max-w-[220px]">
      <p className="text-red-300 text-[10px] leading-relaxed">{roastMsg}</p>
    </div>
    
    <div className="flex gap-4 mb-8">
      <div className="text-center">
        <div className="text-[8px] text-white/40 uppercase mb-1">Score</div>
        <div className="text-xl font-black text-white">{score}</div>
      </div>
      <div className="text-center">
        <div className="text-[8px] text-red-400/40 uppercase mb-1">Best</div>
        <div className="text-xl font-black text-red-500">{highScore}</div>
      </div>
    </div>

    <div className="flex gap-3 w-full max-w-[240px]">
      <button onClick={(e) => { e.stopPropagation(); onRetry(); }} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 transition-all active:scale-95">
        <RotateCcw size={14} /> RETRY
      </button>
      <button onClick={(e) => { e.stopPropagation(); onMenu(); }} className="flex-1 py-3 border border-white/20 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-all active:scale-95">
        <Home size={14} /> MENU
      </button>
    </div>
  </div>
);