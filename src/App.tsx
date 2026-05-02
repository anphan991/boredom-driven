import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Play, RotateCcw, Home, Skull, AlertTriangle, WifiOff } from 'lucide-react';

// --- TYPES ---
export type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

export interface Bird {
  y: number;
  velocity: number;
  rotation: number;
}

export interface Pipe {
  x: number;
  gapTop: number;
  passed: boolean;
  moveType: 'none' | 'sine';
  baseY: number;
  angle: number;
}

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
}

// --- CONSTANTS ---
export const GAME_CONFIG = {
  GRAVITY: 0.25,
  JUMP_STRENGTH: -4.8,
  PIPE_SPEED: 2.4,
  PIPE_SPACING: 240,
  PIPE_WIDTH: 52,
  PIPE_GAP: 160,
  BIRD_X: 50,
  BIRD_SIZE: 34,
  LOGICAL_WIDTH: 400,
  LOGICAL_HEIGHT: 500,
  DPI_SCALE: 2,
};

export const EMOJIS = [
  '🤡', '🍄', '🤖', '🐶', '🐛', '☕', '🫠', '💀', '🐧', '🗿', 
  '💩', '👽', '🩲', '🪳', '💅', '🐔', '👁️👄👁️', '🐸', '🐹', '🍆'
];

export const ROASTS = [
  "Skill issue. Đập máy đi 🤡",
  "Chơi bằng ngón chân à? 👣",
  "Mù mắt quá, xóa game dùm 😭",
  "Thế cũng chết được, ảo thật đấy 💀",
  "Nghỉ game đi, tốn điện 🔌",
  "Trình này đòi hack NASA? 💻",
  "Hết cứu... 🚑",
  "Bà hàng xóm còn chơi giỏi hơn m! 👵",
  "Nhìn m chơi t đau mắt quá 🫣",
  "10 điểm môn Thể dục 🏃‍♂️",
  "Mới mua acc à bro? 💳",
  "Bảo gà lại tự ái 🐔"
];

export const MEME_POPUPS = [
  "Skill gap 📈", "R U Sofm 💯", "That’s heat 🔥", "TÀY 🐧", 
  "Hackerman 💻", "Drip maxed 🗿", "EZ Game 🥱", "LỎ 🤡",
  "Ao chình 🌊", "Bóng đà điểu 🏐", "Cháy phố 🔥", "Vất sục 🗑️"
];

export const FAKE_ADS = [
  "⚠️ Chúc mừng bạn trúng iPhone 15 Pro Max! Bấm nhận!!!",
  "Lõi quá bro, nạp 50k để qua màn? 💳",
  "Bà Tân Vlog: Bí quyết siêu to khổng lồ 🍲",
  "Thuốc trị hói đầu gia truyền 3 đời 💊",
  "Xóa nợ xấu FE Credit - KHÔNG CẦN TRẢ GỐC 💸",
  "Tải thêm RAM 128GB miễn phí tại đây! 💾",
  "Em gái gần nhà đang tìm sugar daddy 💋",
  "Click ngay để xem clip bị rò rỉ 🤫"
];

const MEME_WORDS = [
  "Background đẹp nhất 2026 (nguồn: tôi tự tin).", 
  "Đẹp vậy là đủ rồi.", 
  "Background xịn nhất 2026."
];

// --- AUDIO MANAGER ---
class AudioManager {
  private jumpSnd: HTMLAudioElement;
  private crashSnd: HTMLAudioElement;
  private randomScoreSounds: HTMLAudioElement[];
  private menuBgm: HTMLAudioElement;
  private rainbowFirst: HTMLAudioElement;
  private rainbowPlaylist: HTMLAudioElement[];
  private sequenceTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentSequenceAudio: HTMLAudioElement | null = null;

  constructor() {
    this.jumpSnd = new Audio('/sounds/freesound_community-flappy_whoosh-43099.mp3');
    this.jumpSnd.volume = 0.5;
    this.crashSnd = new Audio('/sounds/do-ngu-do-an-hai.mp3');
    this.crashSnd.volume = 0.8;
    this.randomScoreSounds = [
      new Audio('/sounds/fahhhhh.mp3'),
      new Audio('/sounds/fahhhhh_zaX5nvm.mp3')
    ];
    this.randomScoreSounds.forEach(snd => snd.volume = 0.6);
    this.menuBgm = new Audio('/sounds/nhac-xo-so.mp3');
    this.menuBgm.loop = true; 
    this.menuBgm.volume = 0.4;
    this.rainbowFirst = new Audio('/sounds/mo-dun-thooc-kinh-do.mp3');
    this.rainbowFirst.volume = 0.7;
    this.rainbowPlaylist = [
      new Audio('/sounds/trinh-la-gi.mp3'),
      new Audio('/sounds/tap-trung-vao-su-nghiep.mp3'),
      new Audio('/sounds/hachimi-chimici-mambo.mp3'),
      new Audio('/sounds/outro-song_oqu8zAg.mp3')
    ];
    this.rainbowPlaylist.forEach(snd => snd.volume = 0.7);
  }

  playMenuMusic() { this.menuBgm.play().catch(() => {}); }
  stopMenuMusic() { this.menuBgm.pause(); this.menuBgm.currentTime = 0; }
  playJump() { const clone = this.jumpSnd.cloneNode() as HTMLAudioElement; clone.volume = this.jumpSnd.volume; clone.play().catch(() => {}); }
  playCrash() { this.crashSnd.currentTime = 0; this.crashSnd.play().catch(() => {}); }
  playScoreSound() {
    const randomIndex = Math.floor(Math.random() * this.randomScoreSounds.length);
    const selectedSound = this.randomScoreSounds[randomIndex];
    const clone = selectedSound.cloneNode() as HTMLAudioElement;
    clone.volume = selectedSound.volume;
    clone.play().catch(() => {});
  }
  startRainbowSequence() {
    this.stopSequence(); 
    this.rainbowFirst.currentTime = 0;
    this.rainbowFirst.play().catch(() => {});
    this.currentSequenceAudio = this.rainbowFirst;
    this.sequenceTimeout = setTimeout(() => { this.playNextInPlaylist(0); }, 10000);
  }
  private playNextInPlaylist(index: number) {
    if (this.currentSequenceAudio) this.currentSequenceAudio.pause();
    const safeIndex = index % this.rainbowPlaylist.length;
    const nextAudio = this.rainbowPlaylist[safeIndex];
    nextAudio.currentTime = 0;
    nextAudio.play().catch(() => {});
    this.currentSequenceAudio = nextAudio;
    this.sequenceTimeout = setTimeout(() => { this.playNextInPlaylist(safeIndex + 1); }, 10000);
  }
  stopSequence() {
    if (this.sequenceTimeout) { clearTimeout(this.sequenceTimeout); this.sequenceTimeout = null; }
    if (this.currentSequenceAudio) { this.currentSequenceAudio.pause(); this.currentSequenceAudio = null; }
    this.rainbowFirst.pause();
  }
}
const audio = new AudioManager();

// --- COMPONENTS ---
const HUD: React.FC<{ score: number; highScore: number }> = ({ score, highScore }) => (
  <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start z-20 pointer-events-none" style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
    <div className="flex flex-col gap-1">
      <div className="bg-[#ff00ff] border-[3px] border-[#00ffff] text-yellow-300 font-black text-2xl px-4 py-1 shadow-[4px_4px_0_#000] rotate-[-2deg] animate-pulse">
        ĐIỂM RÁC: {score}
      </div>
      <div className="bg-black/90 text-[#00ff00] text-[10px] font-mono px-2 py-1 flex items-center gap-1 border border-[#00ff00] w-max">
        <WifiOff size={10} className="animate-ping text-red-500"/> Ping: 999ms
      </div>
    </div>

    <div className="flex flex-col items-end gap-1">
      <div className="bg-yellow-400 border-[3px] border-red-600 px-3 py-1 flex flex-col items-end shadow-[4px_4px_0_#000] rotate-[2deg]">
        <span className="text-[10px] text-red-700 uppercase font-black flex items-center gap-1">
          <Trophy size={12} /> KỶ LỤC LỎ
        </span>
        <span className="text-black font-black text-xl leading-none">{highScore}</span>
      </div>
      <div className="bg-red-600 border border-white text-white text-[10px] font-black px-2 py-1 shadow-[2px_2px_0_#000]">
        👁️ Viewers: 69,420
      </div>
    </div>
  </div>
);

const StartScreen: React.FC<{ selectedEmoji: string; setSelectedEmoji: (e: string) => void; onStart: () => void }> = ({ selectedEmoji, setSelectedEmoji, onStart }) => {
  const [showSelector, setShowSelector] = useState(false);
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 overflow-hidden bg-[#000033]">
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,0,255,0.2)_0%,rgba(0,0,51,1)_70%)]"></div>
      
      {/* Background chữ spawn dầy đặc */}
      <div className="absolute inset-0 pointer-events-none flex flex-wrap justify-center items-center opacity-40 overflow-hidden">
        {Array.from({length: 40}).map((_, i) => (
          <span key={i} className="text-yellow-400 font-black text-sm md:text-base m-2 rotate-[15deg] opacity-60 text-center drop-shadow-md">
            {MEME_WORDS[i % MEME_WORDS.length]}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-[320px]">
        
        {/* Thứ tự 1: Avatar xoay */}
        <div className="text-[110px] mb-2 animate-[spin_0.5s_linear_infinite] drop-shadow-[0_0_15px_#00ffff]">
          {selectedEmoji}
        </div>
        
        {/* Thứ tự 2: FLAPPY LỎ */}
        <h1 className="text-6xl text-center font-black text-[#00ffff] mb-0 tracking-tighter drop-shadow-[4px_4px_0_#ff00ff] skew-y-[-3deg]" style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
          FLAPPY LỎ
        </h1>
        
        {/* Thứ tự 3: ĐẠI SỨ CÁCH LY */}
        <p className="text-yellow-300 text-[14px] font-black uppercase tracking-[0.1em] mt-3 bg-red-600 px-4 py-1 border-dashed border-2 border-white shadow-[4px_4px_0_#000] rotate-2">
          ĐẠI SỨ CÁCH LY
        </p>
        
        {/* Thứ tự 4: Dòng cảnh báo (chạy nhanh hơn 1 chút: 12s, vắt ngang màn hình) */}
    <div className="relative z-10 w-full bg-yellow-400 border-y-4 border-black overflow-hidden mb-6 shadow-[0_4px_0_#ff0000]">
        <div className="whitespace-nowrap text-black font-black text-[16px] py-2 px-2 uppercase tracking-widest inline-block" style={{ animation: 'marquee 15s linear infinite' }}>
          ⚠️ CẢNH BÁO: TRÒ CHƠI GÂY ỨC CHẾ MẠNH - KHÔNG DÀNH CHO NGƯỜI YẾU TIM VÀ HAY ĐẬP MÁY ⚠️ &nbsp; &nbsp; &nbsp; ⚠️ CẢNH BÁO: TRÒ CHƠI GÂY ỨC CHẾ MẠNH - KHÔNG DÀNH CHO NGƯỜI YẾU TIM VÀ HAY ĐẬP MÁY ⚠️
        </div>
      </div>
        
        {/* Thứ tự 5: Buttons */}
        <div className="flex flex-col gap-3 w-full" style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); onStart(); }}
            className="w-full py-4 bg-[#ff00ff] hover:bg-[#ff33ff] text-white font-black text-xl flex items-center justify-center gap-2 transition-transform active:scale-95 border-4 border-[#00ffff] shadow-[8px_8px_0_#000] animate-pulse"
          >
            <Play size={28} fill="currentColor" /> HACK TUNG SERVER
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowSelector(true); }}
            className="w-full py-3 bg-[#00ff00] hover:bg-[#33ff33] text-black border-4 border-black text-md font-black uppercase tracking-widest shadow-[6px_6px_0_#000] active:scale-95 transition-transform"
          >
            CHỌN HỆ TÂM LINH
          </button>
        </div>

        {showSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { e.stopPropagation(); setShowSelector(false); }}>
            <div 
              className="bg-cyan-300 border-4 border-pink-600 p-4 flex flex-wrap justify-center gap-3 w-full max-w-[340px] max-h-[60vh] overflow-y-auto shadow-[12px_12px_0_#000] animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()} 
            >
              <h3 className="w-full text-center font-black text-pink-600 mb-2 uppercase text-xl" style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>Tuyển dụng Đại Sứ</h3>
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={(e) => { e.stopPropagation(); setSelectedEmoji(emoji); setShowSelector(false); }}
                  className={`text-4xl p-2 transition-transform hover:scale-125 ${selectedEmoji === emoji ? 'bg-yellow-400 border-4 border-black rotate-12' : 'bg-transparent hover:bg-white/30 rounded-lg'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

const GameOverScreen: React.FC<{ score: number; highScore: number; roastMsg: string; onRetry: () => void; onMenu: () => void }> = ({ score, highScore, roastMsg, onRetry, onMenu }) => (
  <div className="absolute inset-0 z-30 bg-[#0000aa] flex flex-col items-center justify-center p-6 text-center text-white" style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
    <div className="relative z-10 flex flex-col items-center w-full max-w-[340px]">
      <div className="bg-white text-[#0000aa] px-2 py-1 font-bold text-sm mb-6 self-start tracking-widest">CYBER_LO.EXE</div>
      
      <h2 className="text-5xl font-black mb-4 uppercase tracking-tighter text-left w-full">HẾT CỨU... 🚑</h2>
      
      <p className="text-left w-full text-[14px] font-mono mb-8 leading-relaxed">
        A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01). 
        <br/><br/>
        * Diagnosis: <span className="text-yellow-300 font-bold text-[16px] bg-black/30 px-1">"{roastMsg}"</span>
        <br/><br/>
        Press any key to continue being a loser.
      </p>
      
      <div className="flex gap-4 mb-8 w-full">
        <div className="text-left flex-1 border-2 border-white border-dashed p-3 bg-[#0000ff] shadow-[4px_4px_0_#000]">
          <div className="text-[12px] uppercase mb-1 font-bold text-gray-300">SCORE LỎ</div>
          <div className="text-4xl font-black text-yellow-300">{score}</div>
        </div>
        <div className="text-left flex-1 border-2 border-white border-dashed p-3 bg-[#0000ff] shadow-[4px_4px_0_#000]">
          <div className="text-[12px] uppercase mb-1 font-bold text-gray-300">KỶ LỤC</div>
          <div className="text-4xl font-black text-cyan-300">{highScore}</div>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full">
        <button onClick={(e) => { e.stopPropagation(); onRetry(); }} className="w-full py-4 bg-[#c0c0c0] text-black font-black text-lg uppercase flex items-center justify-center gap-2 border-[4px] border-t-white border-l-white border-b-black border-r-black hover:bg-[#a0a0a0] active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
          <RotateCcw size={20} /> CHƠI LẠI ĐI GÀ
        </button>
        <button onClick={(e) => { e.stopPropagation(); onMenu(); }} className="w-full py-3 bg-[#c0c0c0] text-black font-bold text-sm uppercase flex items-center justify-center gap-2 border-[4px] border-t-white border-l-white border-b-black border-r-black hover:bg-[#a0a0a0] active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
          <Home size={16} /> CÚT VỀ MENU
        </button>
      </div>
    </div>
  </div>
);

// --- HOOK: useGameEngine ---
const useGameEngine = ({
  canvasRef, gameState, setGameState, setScore, setHighScore, setRoastMsg, setShake, selectedEmoji
}: any) => {
  const birdRef = useRef<Bird>({ y: 250, velocity: 0, rotation: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const requestRef = useRef<number>(0);
  const scoreRef = useRef(0);
  
  // Hạt background "Vaporwave Chill"
  const particlesRef = useRef<Array<{x: number, y: number, speed: number, size: number, type: 'star' | 'cloud' | 'text', text?: string}>>([]);
  const [fakeAd, setFakeAd] = useState({ show: false, text: '' });
  const adTimeoutRef = useRef<any>(null);
  const dimsRef = useRef({ width: 400, height: 500, scale: 1 });

  const gameStateRef = useRef<GameState>(gameState);
  const emojiRef = useRef(selectedEmoji);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { emojiRef.current = selectedEmoji; }, [selectedEmoji]);

  useEffect(() => {
    const particles: any[] = [];
    const chillWords = ["chill", "lỏ", "nịt", "bruh", "ảo"];
    for (let i = 0; i < 30; i++) {
      const typeRand = Math.random();
      const type = typeRand > 0.8 ? 'text' : (typeRand > 0.5 ? 'cloud' : 'star');
      particles.push({
        x: Math.random() * GAME_CONFIG.LOGICAL_WIDTH,
        y: Math.random() * GAME_CONFIG.LOGICAL_HEIGHT,
        speed: Math.random() * 0.5 + 0.2, 
        size: Math.random() * 3 + 1,
        type: type,
        text: type === 'text' ? chillWords[Math.floor(Math.random() * chillWords.length)] : ''
      });
    }
    particlesRef.current = particles;
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const parent = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = parent.clientWidth * dpr;
    canvas.height = parent.clientHeight * dpr;
    const logicalHeight = 500;
    const scale = parent.clientHeight / logicalHeight;
    const logicalWidth = parent.clientWidth / scale;
    dimsRef.current = { width: logicalWidth, height: logicalHeight, scale };
  }, [canvasRef]);

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const jump = useCallback(() => {
    if (gameStateRef.current === 'PLAYING') {
      birdRef.current.velocity = GAME_CONFIG.JUMP_STRENGTH;
      audio.playJump(); 
      setShake(true);
      // Hiệu ứng giật nhẹ nhàng, nhanh tắt để tối ưu
      setTimeout(() => setShake(false), 50);
    }
  }, [setShake]);

  const handleGameOver = useCallback(() => {
    setGameState('GAMEOVER');
    audio.stopSequence(); 
    audio.playCrash(); 
    setFakeAd({ show: false, text: '' });
    if (adTimeoutRef.current) clearTimeout(adTimeoutRef.current);
    setRoastMsg(ROASTS[Math.floor(Math.random() * ROASTS.length)]);
    setHighScore((prev: number) => {
      const newHigh = Math.max(prev, scoreRef.current);
      localStorage.setItem('cyberfly_highscore', newHigh.toString());
      return newHigh;
    });
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  }, [setGameState, setRoastMsg, setHighScore]);

  const resetGame = useCallback(() => {
    const dims = dimsRef.current;
    audio.stopMenuMusic();
    audio.stopSequence();
    setFakeAd({ show: false, text: '' });
    if (adTimeoutRef.current) clearTimeout(adTimeoutRef.current);
    birdRef.current = { y: dims.height / 2, velocity: 0, rotation: 0 };
    pipesRef.current = [{ x: dims.width, gapTop: 100, passed: false, moveType: 'none', baseY: 100, angle: 0 }];
    floatingTextsRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setGameState('PLAYING');
  }, [setGameState, setScore]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dims = dimsRef.current;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr * dims.scale, dpr * dims.scale); 

    const time = Date.now() / 5;
    const isRGB = scoreRef.current >= 10;

    // 1. VẼ BACKGROUND NỊNH MẮT (Vaporwave Sunset Gradient)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, dims.height);
    bgGrad.addColorStop(0, '#1a0b2e');
    bgGrad.addColorStop(0.5, '#4b1d52');
    bgGrad.addColorStop(1, '#ff6b6b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, dims.width, dims.height);

    // 2. VẼ MẶT TRỜI CHILL (Sun - Tối ưu FPS, ko dùng shadowBlur đắt đỏ)
    // Lớp viền hào quang sáng nhẹ
    ctx.beginPath();
    ctx.arc(dims.width / 2, dims.height * 0.65, 135, 0, Math.PI, true);
    ctx.fillStyle = 'rgba(255, 0, 128, 0.3)';
    ctx.fill();

    // Lõi mặt trời Gradient
    ctx.beginPath();
    ctx.arc(dims.width / 2, dims.height * 0.65, 120, 0, Math.PI, true);
    const sunGrad = ctx.createLinearGradient(0, dims.height * 0.65 - 120, 0, dims.height * 0.65);
    sunGrad.addColorStop(0, '#ffdf00');
    sunGrad.addColorStop(1, '#ff0080');
    ctx.fillStyle = sunGrad;
    ctx.fill();

    // 3. VẼ PARTICLES (Chill mây, sao, và chữ mờ)
    particlesRef.current.forEach(p => {
      if (p.type === 'star') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      } else if (p.type === 'cloud') {
        ctx.fillStyle = 'rgba(255, 192, 203, 0.2)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
        ctx.arc(p.x + p.size*3, p.y - p.size*2, p.size * 4, 0, Math.PI * 2);
        ctx.arc(p.x + p.size*6, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'text') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; 
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(p.text || '', p.x, p.y);
      }
    });

    // 4. VẼ LƯỚI CYBERPUNK TRÔI SÀN DƯỚI
    ctx.strokeStyle = isRGB ? `hsla(${time % 360}, 100%, 70%, 0.15)` : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const offsetX = (Date.now() / 20) % 40; 
    const gridStartY = dims.height * 0.65; 
    for (let i = -40; i < dims.width; i += 40) { ctx.beginPath(); ctx.moveTo(i - offsetX, gridStartY); ctx.lineTo(i - offsetX, dims.height); ctx.stroke(); }
    for (let i = gridStartY; i < dims.height; i += 20) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(dims.width, i); ctx.stroke(); }

    // 5. VẼ ỐNG GLOSSY MƯỢT MÀ
    pipesRef.current.forEach(pipe => {
      const pipeColor = isRGB ? `hsla(${time % 360}, 100%, 60%, 0.9)` : 'rgba(56, 189, 248, 0.8)';
      const pipeBorder = isRGB ? '#fff' : 'rgba(255, 255, 255, 0.5)';
      
      // Ống trên
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'; 
      ctx.strokeStyle = pipeBorder;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(pipe.x, -10, GAME_CONFIG.PIPE_WIDTH, pipe.gapTop + 10, [0, 0, 8, 8]); ctx.fill(); ctx.stroke();
      
      ctx.fillStyle = pipeColor;
      ctx.beginPath(); ctx.roundRect(pipe.x - 4, pipe.gapTop - 20, GAME_CONFIG.PIPE_WIDTH + 8, 20, 6); ctx.fill();

      // Ống dưới
      const bottomY = pipe.gapTop + GAME_CONFIG.PIPE_GAP;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.beginPath(); ctx.roundRect(pipe.x, bottomY, GAME_CONFIG.PIPE_WIDTH, dims.height - bottomY + 10, [8, 8, 0, 0]); ctx.fill(); ctx.stroke();
      
      ctx.fillStyle = pipeColor;
      ctx.beginPath(); ctx.roundRect(pipe.x - 4, bottomY, GAME_CONFIG.PIPE_WIDTH + 8, 20, 6); ctx.fill();
    });

    // 6. VẼ TEXT MEME (Dùng fill và stroke mượt mà, ko dùng shadowBlur)
    floatingTextsRef.current.forEach(ft => {
      ctx.save();
      ctx.translate(ft.x, ft.y);
      const scaleVal = Math.max(0.1, 1 + (1.2 - ft.life) * 1.5); 
      ctx.scale(scaleVal, scaleVal);
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.life));
      ctx.font = '900 36px "Comic Sans MS", cursive';
      ctx.textAlign = 'center';
      
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 6;
      ctx.strokeText(ft.text, 0, 0);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    });

    ctx.restore(); 

    // 7. VẼ AVATAR
    const bird = birdRef.current;
    ctx.save();
    const physicalX = GAME_CONFIG.BIRD_X * dims.scale * dpr;
    const physicalY = bird.y * dims.scale * dpr;
    
    // Giữ lại hitbox béo phì (mốc 20)
    const sizeMult = scoreRef.current >= 20 ? 1.5 : 1;
    const physicalFontSize = GAME_CONFIG.BIRD_SIZE * dims.scale * dpr * sizeMult;

    ctx.translate(physicalX, physicalY);
    
    // Động kinh (mốc 40)
    if(scoreRef.current >= 40) {
       ctx.rotate(bird.rotation + (Math.random() - 0.5) * 0.5);
    } else {
       ctx.rotate(bird.rotation);
    }
    
    ctx.font = `${physicalFontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emojiRef.current, 0, 0);
    ctx.restore();
  }, [canvasRef]);

  const update = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;

    const bird = birdRef.current;
    const dims = dimsRef.current;
    const { GRAVITY, BIRD_SIZE, PIPE_SPEED, PIPE_WIDTH, PIPE_GAP, BIRD_X, PIPE_SPACING } = GAME_CONFIG;

    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.PI / 2.5, Math.max(-Math.PI / 4, bird.velocity / 8));

    particlesRef.current.forEach(p => {
      p.x -= p.speed;
      if (p.x < -100) {
        p.x = dims.width + 50;
        p.y = Math.random() * dims.height;
      }
    });

    const sizeMult = scoreRef.current >= 20 ? 1.5 : 1;
    const actualBirdSize = BIRD_SIZE * sizeMult;

    if (bird.y + actualBirdSize / 2 > dims.height || bird.y - actualBirdSize / 2 < 0) {
      handleGameOver();
      return;
    }

    floatingTextsRef.current.forEach(ft => { ft.life -= 0.02; ft.y -= 2; }); 
    floatingTextsRef.current = floatingTextsRef.current.filter(ft => ft.life > 0);

    pipesRef.current.forEach((pipe) => {
      pipe.x -= PIPE_SPEED;
      if (pipe.moveType === 'sine') {
        pipe.angle += 0.04;
        pipe.gapTop = pipe.baseY + Math.sin(pipe.angle) * 50;
      }

      if (BIRD_X + actualBirdSize/3 > pipe.x && BIRD_X - actualBirdSize/3 < pipe.x + PIPE_WIDTH &&
         (bird.y - actualBirdSize/3 < pipe.gapTop || bird.y + actualBirdSize/3 > pipe.gapTop + PIPE_GAP)) {
        handleGameOver();
      }

      if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
        pipe.passed = true;
        scoreRef.current += 1;
        setScore(scoreRef.current);
        
        if (scoreRef.current === 10) audio.startRainbowSequence();
        else if (scoreRef.current < 10) audio.playScoreSound();

        if (scoreRef.current >= 3 && Math.random() < 0.25) {
          setFakeAd({ show: true, text: FAKE_ADS[Math.floor(Math.random() * FAKE_ADS.length)] });
          if (adTimeoutRef.current) clearTimeout(adTimeoutRef.current);
          adTimeoutRef.current = setTimeout(() => { setFakeAd({ show: false, text: '' }); }, 2000);
        }

        let popupText = MEME_POPUPS[Math.floor(Math.random() * MEME_POPUPS.length)];
        
        // ĐÃ XÓA GHOST MODE (Ống tàng hình) VÀ CÁC TÍNH NĂNG LỘN NGƯỢC/ĐỔI MẶT
        if (scoreRef.current === 20) popupText = "BÉO PHÌ! 🍔";
        if (scoreRef.current === 40) popupText = "ĐỘNG KINH! ⚡";

        floatingTextsRef.current.push({
          text: popupText,
          x: dims.width / 2, y: dims.height / 2, 
          life: (scoreRef.current === 20 || scoreRef.current === 40) ? 2 : 1.2, 
          color: `hsl(${Math.random() * 360}, 100%, 65%)`
        });
      }
    });

    const lastPipe = pipesRef.current[pipesRef.current.length - 1];
    if (lastPipe && lastPipe.x < dims.width - PIPE_SPACING) {
      const gapTop = Math.random() * (dims.height - PIPE_GAP - 120) + 60;
      pipesRef.current.push({
        x: dims.width, gapTop, passed: false,
        moveType: scoreRef.current >= 5 && Math.random() > 0.5 ? 'sine' : 'none',
        baseY: gapTop, angle: 0
      });
    }

    if (pipesRef.current[0] && pipesRef.current[0].x < -PIPE_WIDTH) pipesRef.current.shift();

    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [handleGameOver, draw, setScore]);

  useEffect(() => {
    if (gameState === 'PLAYING') requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState, update]);

  return { jump, resetGame, fakeAd };
};

// --- MAIN APP ---
export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0); 
  const [highScore, setHighScore] = useState(0);
  const [selectedEmoji, setSelectedEmoji] = useState('🤡');
  const [roastMsg, setRoastMsg] = useState('');
  const [shake, setShake] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { jump, resetGame, fakeAd } = useGameEngine({ canvasRef, gameState, setGameState, setScore, setHighScore, setRoastMsg, setShake, selectedEmoji });

  useEffect(() => {
    const saved = localStorage.getItem('cyberfly_highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    const initAudioOnInteraction = () => {
      if (gameState === 'START') audio.playMenuMusic();
      window.removeEventListener('click', initAudioOnInteraction);
      window.removeEventListener('touchstart', initAudioOnInteraction);
    };
    window.addEventListener('click', initAudioOnInteraction);
    window.addEventListener('touchstart', initAudioOnInteraction);
    return () => {
      window.removeEventListener('click', initAudioOnInteraction);
      window.removeEventListener('touchstart', initAudioOnInteraction);
    };
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'PLAYING') jump();
        else if (gameState === 'START' || gameState === 'GAMEOVER') resetGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, jump, resetGame]);

  return (
    <div className="w-screen h-screen bg-[#050010] flex items-center justify-center overflow-hidden font-['Comic_Sans_MS']">
      {/* HIỆU ỨNG LẮC NHẸ HƠN: thay vì dịch chuyển quá đà, giờ chỉ nảy nhẹ 2px tạo cảm giác mượt mà */}
      <div className={`relative w-full h-full overflow-hidden transition-all duration-75 ${shake ? 'translate-y-[2px] bg-white/5' : 'bg-[#050010]'}`}>
        
        {gameState !== 'START' && <HUD score={score} highScore={highScore} />}
        {gameState === 'START' && <StartScreen selectedEmoji={selectedEmoji} setSelectedEmoji={setSelectedEmoji} onStart={resetGame} />}
        {gameState === 'GAMEOVER' && <GameOverScreen score={score} highScore={highScore} roastMsg={roastMsg} onRetry={resetGame} onMenu={() => { setGameState('START'); setScore(0); audio.playMenuMusic(); }} />}

        {fakeAd?.show && gameState === 'PLAYING' && (
          <div className="absolute z-50 top-[20%] left-1/2 -translate-x-1/2 w-[90%] max-w-[320px] bg-[#ece9d8] border-[3px] border-t-white border-l-white border-r-[#808080] border-b-[#808080] p-[2px] shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col pointer-events-auto animate-in zoom-in-75 duration-200">
            <div className="bg-[linear-gradient(to_right,#000080_0%,#1084d0_100%)] text-white text-[13px] font-bold px-2 py-1 flex justify-between items-center mb-1">
              <span className="flex items-center gap-1 drop-shadow"><AlertTriangle size={14} color="yellow"/> System_Warning.exe</span>
              <button onClick={(e) => e.stopPropagation()} className="bg-[#c0c0c0] text-black border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] w-5 h-5 flex items-center justify-center rounded-sm font-bold leading-none hover:bg-red-500 hover:text-white active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white">X</button>
            </div>
            <div className="p-4 text-center bg-white border border-[#808080] m-[2px]">
              <p className="text-black text-[14px] font-bold mb-4">{fakeAd.text}</p>
              <button onClick={(e) => e.stopPropagation()} className="bg-[#f5f5f5] border-[3px] border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-black px-8 py-2 font-sans text-md font-bold active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white outline-none">
                OK
              </button>
            </div>
          </div>
        )}

        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full cursor-pointer touch-none z-10"
          onMouseDown={() => { if (gameState === 'PLAYING') jump(); else if (gameState === 'START') resetGame(); }}
          onTouchStart={(e) => { e.preventDefault(); if (gameState === 'PLAYING') jump(); else if (gameState === 'START') resetGame(); }}
        />
        
        {/* Lớp sọc CRT giữ nguyên */}
        <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)] z-20"></div>
      </div>
    </div>
  );
}