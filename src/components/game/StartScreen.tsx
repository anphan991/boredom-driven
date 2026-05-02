import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { EMOJIS } from '../../constants/config';

interface StartScreenProps {
  selectedEmoji: string;
  setSelectedEmoji: (emoji: string) => void;
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ selectedEmoji, setSelectedEmoji, onStart }) => {
  const [showSelector, setShowSelector] = useState(false);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0d1117]/80 backdrop-blur-sm p-6">
      <div className="text-6xl mb-6 animate-bounce">{selectedEmoji}</div>
      <h1 className="text-2xl font-black text-red-500 mb-1 tracking-tighter uppercase">Cyber_Fly</h1>
      <p className="text-white/30 text-[9px] uppercase tracking-widest mb-8">Bypass the firewalls</p>
      
      <div className="flex flex-col gap-3 w-full max-w-[200px]">
        <button 
          onClick={(e) => { e.stopPropagation(); onStart(); }}
          className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95 rounded-xl text-xs"
        >
          <Play size={14} fill="currentColor" /> INJECT PAYLOAD
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setShowSelector(!showSelector); }}
          className="w-full py-2.5 border border-white/10 hover:border-red-500/50 text-white/70 text-[10px] font-medium rounded-xl"
        >
          CHANGE_AVATAR
        </button>
      </div>

      {showSelector && (
        <div className="mt-4 p-3 bg-[#161b22] border border-red-500/20 rounded-2xl flex flex-wrap justify-center gap-2 max-w-[240px]">
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={(e) => { e.stopPropagation(); setSelectedEmoji(emoji); setShowSelector(false); }}
              className={`text-xl p-2 rounded-lg transition-all ${selectedEmoji === emoji ? 'bg-red-500/20 border border-red-500' : 'hover:bg-white/5'}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};