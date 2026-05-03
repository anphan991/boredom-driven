import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Trophy, Play, RotateCcw, Home, AlertTriangle, WifiOff, Terminal } from 'lucide-react';

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
  active: boolean; 
}

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
  active: boolean;
}

// --- CONSTANTS ---
const TWO_PI = Math.PI * 2;

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
};

export const EMOJIS = [
  '🤡', '🍄', '🤖', '🐶', '🐛', '☕', '🫠', '💀', '🐧', '🗿', 
  '💩', '👽', '🩲', '🪳', '💅', '🐔', '👁️👄👁️', '🐸', '🐹', '🍆'
];

export const ROASTS = [
  "Skill issue. Đập máy đi 🤡", "Chơi bằng ngón chân à? 👣", "Mù mắt quá, xóa game dùm 😭",
  "Thế cũng chết được, ảo thật đấy 💀", "Nghỉ game đi, tốn điện 🔌", "Trình này đòi hack NASA? 💻",
  "Hết cứu... 🚑", "Bà hàng xóm còn chơi giỏi hơn m! 👵", "Nhìn m chơi t đau mắt quá 🫣",
  "Mới mua acc à bro? 💳", "Bảo gà lại tự ái 🐔"
];

export const MEME_POPUPS = [
  "Skill gap 📈", "R U Surfm💯", "That’s heat 🔥", "TÀY 🐧", 
  "Hackerman 💻", "Drip maxed 🗿", "EZ Game 🥱", "LỎ 🤡",
  "Ao chình 🌊", "Thưởng khô gà 🐔", "Fire 🔥", "Được của ló 🗑️"
];

export const FAKE_ADS = [
  "⚠️ Chúc mừng bạn trúng iPhone 15 Pro Max! Bấm nhận!!!", "Lõi quá bro, nạp 50k để qua màn? 💳",
  "Bà Tân Vlog: Bí quyết siêu to khổng lồ 🍲", "Thuốc trị hói đầu gia truyền 3 đời 💊",
  "Xóa nợ xấu FE Credit - KHÔNG CẦN TRẢ GỐC 💸", "Tải thêm RAM 128GB miễn phí tại đây! 💾",
  "Em gái gần nhà đang tìm sugar daddy 💋", "Click ngay để xem clip bị rò rỉ 🤫"
];

const MEME_WORDS = [
  "Background đẹp nhất 2026 (nguồn: tôi tự tin).", 
  "Đẹp vậy là đủ rồi.", 
  "Background xịn nhất 2026."
];

// --- ULTRA OPTIMIZED AUDIO MANAGER ---
class AudioManager {
  private jumpPool: HTMLAudioElement[] = [];
  private jumpPoolIndex: number = 0;
  
  private scorePool: HTMLAudioElement[] = [];
  private scorePoolIndex: number = 0;

  private crashSnd: HTMLAudioElement;
  private menuBgm: HTMLAudioElement;
  private rainbowFirst: HTMLAudioElement;
  private rainbowPlaylist: HTMLAudioElement[];
  private currentSequenceAudio: HTMLAudioElement | null = null;
  private unlocked: boolean = false;

  constructor() {
    for (let i = 0; i < 5; i++) {
      const snd = new Audio('./sounds/freesound_community-flappy_whoosh-43099.mp3');
      snd.volume = 0.5;
      this.jumpPool.push(snd);
    }

    const scoreSoundSrcs = ['./sounds/fahhhhh.mp3', './sounds/fahhhhh_zaX5nvm.mp3'];
    for (let i = 0; i < 4; i++) {
      const snd = new Audio(scoreSoundSrcs[i % 2]);
      snd.volume = 0.6;
      this.scorePool.push(snd);
    }

    this.crashSnd = new Audio('./sounds/do-ngu-do-an-hai.mp3');
    this.crashSnd.volume = 0.8;
    
    this.menuBgm = new Audio('./sounds/nhac-xo-so.mp3');
    this.menuBgm.loop = true; 
    this.menuBgm.volume = 0.4;
    
    this.rainbowFirst = new Audio('./sounds/mo-dun-thooc-kinh-do.mp3');
    this.rainbowFirst.volume = 0.7;

    this.rainbowPlaylist = [
      './sounds/trinh-la-gi.mp3', './sounds/tap-trung-vao-su-nghiep.mp3', './sounds/hachimi-chimici-mambo.mp3',
      './sounds/outro-song_oqu8zAg.mp3', './sounds/tam-trang.mp3', './sounds/loi-toi_TnbhdTR.mp3',
      './sounds/banh-bao-banh-bao-day.mp3', './sounds/Am_thanh_meme_con_may_thich_kieu_gi_may_nhay_vao_may_an_tao_di_tiktok-www_tiengdong_com.mp3',
      './sounds/low-cortisol-song.mp3', './sounds/dreamcore.mp3', './sounds/tu-tu-tu-du-max-verstappen.mp3',
      './sounds/Johnny-Dak.mp3', './sounds/Anh-yeu-em-nhieu-VL.mp3', './sounds/Anh-em-bi-chem.-Tao-bo-chay.mp3',
      './sounds/outro-song_oqu8zAg.mp3', './sounds/Day-no-phai-the-chu-li-thang-nay-kha-va-gioi.mp3', './sounds/Vu-nao-Banh-ma.mp3'
    ].map(src => {
      const audio = new Audio(src);
      audio.volume = 0.7;
      return audio;
    });
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    this.jumpPool.forEach(a => a.load());
    this.scorePool.forEach(a => a.load());
    this.crashSnd.load();
    this.rainbowFirst.load();
    this.rainbowPlaylist.forEach(a => a.load());
  }

  playMenuMusic() { this.menuBgm.play().catch(() => {}); }
  stopMenuMusic() { this.menuBgm.pause(); this.menuBgm.currentTime = 0; }
  
  playJump() { 
    const snd = this.jumpPool[this.jumpPoolIndex];
    snd.currentTime = 0;
    snd.play().catch(() => {});
    this.jumpPoolIndex = (this.jumpPoolIndex + 1) % this.jumpPool.length;
  }
  
  playCrash() { this.crashSnd.currentTime = 0; this.crashSnd.play().catch(() => {}); }
  
  playScoreSound() {
    const snd = this.scorePool[this.scorePoolIndex];
    snd.currentTime = 0;
    snd.play().catch(() => {});
    this.scorePoolIndex = (this.scorePoolIndex + 1) % this.scorePool.length;
  }
  
  playMusicForScore(score: number) {
    if (score < 10) {
      this.playScoreSound();
    } else if (score === 10) {
      this.startRainbowSequence();
    } else if (score % 10 === 0 && score > 10) {
      const trackIndex = Math.floor(score / 10) - 2;
      this.playNextInPlaylist(trackIndex);
    }
  }

  startRainbowSequence() {
    this.stopSequence(); 
    this.rainbowFirst.currentTime = 0;
    this.rainbowFirst.play().catch(() => {});
    this.currentSequenceAudio = this.rainbowFirst;
    this.rainbowFirst.onended = () => this.playNextInPlaylist(0);
  }

  private playNextInPlaylist(index: number) {
    if (this.currentSequenceAudio) {
      this.currentSequenceAudio.onended = null;
      this.currentSequenceAudio.pause();
    }
    this.rainbowFirst.onended = null;
    this.rainbowFirst.pause();

    const safeIndex = index % this.rainbowPlaylist.length;
    const nextAudio = this.rainbowPlaylist[safeIndex];

    nextAudio.currentTime = 0;
    nextAudio.play().catch(() => {});
    this.currentSequenceAudio = nextAudio;
    nextAudio.onended = () => this.playNextInPlaylist(safeIndex + 1);
  }

  stopSequence() {
    if (this.currentSequenceAudio) {
      this.currentSequenceAudio.onended = null;
      this.currentSequenceAudio.pause();
      this.currentSequenceAudio = null;
    }
    this.rainbowFirst.onended = null;
    this.rainbowFirst.pause();
  }
}
const audio = new AudioManager();

// --- REACT COMPONENTS (Wrapped in memo with safe TS Props) ---
const HUD = memo(({ score, highScore }: { score: number; highScore: number }) => (
  <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start z-20 pointer-events-none" style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
    <div className="flex flex-col gap-1">
      <div className="bg-[#ff00ff] border-[3px] border-[#00ffff] text-yellow-300 font-black text-2xl px-4 py-1 shadow-[4px_4px_0_#000] rotate-[-2deg] animate-pulse">
        ĐIỂM : {score}
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
));

const StartScreen = memo(({ selectedEmoji, setSelectedEmoji, onStart }: { selectedEmoji: string; setSelectedEmoji: (e: string) => void; onStart: () => void }) => {
  const [showSelector, setShowSelector] = useState(false);
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center py-6 overflow-hidden bg-[#000033]">
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,0,255,0.2)_0%,rgba(0,0,51,1)_70%)]"></div>
      
      <div className="absolute inset-0 pointer-events-none flex flex-wrap justify-center items-center opacity-40 overflow-hidden">
        {Array.from({length: 40}).map((_, i) => (
          <span key={i} className="text-yellow-400 font-black text-sm md:text-base m-2 rotate-[15deg] opacity-60 text-center drop-shadow-md">
            {MEME_WORDS[i % MEME_WORDS.length]}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-[320px]">
        <div className="text-[110px] mb-2 animate-[spin_0.5s_linear_infinite] drop-shadow-[0_0_15px_#00ffff]">
          {selectedEmoji}
        </div>
        
        <h1 className="text-6xl text-center font-black text-[#00ffff] mb-0 tracking-tighter drop-shadow-[4px_4px_0_#ff00ff] skew-y-[-3deg]" style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
          FLAPPY LỎ
        </h1>
        
        <p className="text-yellow-300 text-[14px] font-black uppercase tracking-[0.1em] mt-3 bg-red-600 px-4 py-1 border-dashed border-2 border-white shadow-[4px_4px_0_#000] rotate-2">
          Chim thế hệ mới
        </p>
      </div>
        
      <div className="relative z-10 w-full bg-yellow-400 border-y-4 border-black overflow-hidden my-8 shadow-[0_6px_0_#ff0000] flex">
        <div className="whitespace-nowrap text-black font-black text-xl md:text-2xl py-3 uppercase tracking-widest flex w-max" style={{ animation: 'marquee 25s linear infinite' }}>
          <span className="pr-16">⚠️ CẢNH BÁO: TRÒ CHƠI GÂY ỨC CHẾ MẠNH - KHÔNG DÀNH CHO NGƯỜI YẾU TIM VÀ HAY ĐẬP MÁY ⚠️</span>
          <span className="pr-16">⚠️ CẢNH BÁO: TRÒ CHƠI GÂY ỨC CHẾ MẠNH - KHÔNG DÀNH CHO NGƯỜI YẾU TIM VÀ HAY ĐẬP MÁY ⚠️</span>
        </div>
      </div>
        
      <div className="relative z-10 flex flex-col gap-3 w-full max-w-[320px] px-6" style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
        <button 
          onClick={(e) => { e.stopPropagation(); onStart(); }}
          className="w-full py-4 bg-[#ff00ff] hover:bg-[#ff33ff] text-white font-black text-xl flex items-center justify-center gap-2 transition-transform active:scale-95 border-4 border-[#00ffff] shadow-[8px_8px_0_#000] animate-pulse"
        >
          <Play size={28} fill="currentColor" /> HUPS
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); setShowSelector(true); }}
          className="w-full py-3 bg-[#00ff00] hover:bg-[#33ff33] text-black border-4 border-black text-md font-black uppercase tracking-widest shadow-[6px_6px_0_#000] active:scale-95 transition-transform"
        >
          CHỌN AVT
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); window.close(); }}
          className="w-full py-3 bg-red-600 hover:bg-red-500 text-white border-4 border-white text-md font-black uppercase tracking-widest shadow-[6px_6px_0_#000] active:scale-95 transition-transform"
        >
          ❌ THOÁT GAME (ESC)
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
      
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>
    </div>
  );
});

const GameOverScreen = memo(({ score, highScore, roastMsg, onRetry, onMenu }: { score: number; highScore: number; roastMsg: string; onRetry: () => void; onMenu: () => void }) => (
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
        <button onClick={(e) => { e.stopPropagation(); window.close(); }} className="w-full py-3 bg-red-800 text-white font-bold text-sm uppercase flex items-center justify-center gap-2 border-[4px] border-t-red-400 border-l-red-400 border-b-black border-r-black hover:bg-red-700 active:border-t-black active:border-l-black active:border-b-red-400 active:border-r-red-400">
          ❌ ĐẬP MÁY NGHỈ CHƠI
        </button>
      </div>
    </div>
  </div>
));

// --- HOOK: useGameEngine ---
const useGameEngine = ({
  canvasRef, gameState, setGameState, setScore, setHighScore, setRoastMsg, triggerShake, selectedEmoji
}: any) => {
  const birdRef = useRef<Bird>({ y: 250, velocity: 0, rotation: 0 });
  
  const pipesRef = useRef<Pipe[]>(Array.from({length: 4}, () => ({ x: 0, gapTop: 0, passed: false, moveType: 'none', baseY: 0, angle: 0, active: false })));
  const floatingTextsRef = useRef<FloatingText[]>(Array.from({length: 3}, () => ({text: '', x: 0, y: 0, life: 0, color: '', active: false})));
  const particlesRef = useRef<Array<{x: number, y: number, speed: number, size: number, type: 'star' | 'cloud'}>>([]);
  
  const requestRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const dimsRef = useRef({ width: 400, height: 500, scale: 1, dpr: 1 });
  
  const frameRef = useRef(0);

  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const emojiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gradientsRef = useRef<{ pipeGrad: CanvasGradient | null }>({ pipeGrad: null });
  
  const textCacheRef = useRef<Record<string, HTMLCanvasElement>>({});

  const [fakeAd, setFakeAd] = useState({ show: false, text: '' });
  const adTimeoutRef = useRef<any>(null);
  const [isGodModeUI, setIsGodModeUI] = useState(false);
  const isGodModeRef = useRef(false);
  const gameStateRef = useRef<GameState>(gameState);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const getCachedText = useCallback((text: string, color: string) => {
    const key = text + color;
    if (textCacheRef.current[key]) return textCacheRef.current[key];
    
    const cvs = document.createElement('canvas');
    cvs.width = 400; cvs.height = 100;
    const ctx = cvs.getContext('2d', { willReadFrequently: false });
    if (ctx) {
      ctx.font = '900 36px "Comic Sans MS", cursive';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 6;
      ctx.strokeText(text, 200, 50);
      ctx.fillStyle = color;
      ctx.fillText(text, 200, 50);
    }
    textCacheRef.current[key] = cvs;
    return cvs;
  }, []);

  useEffect(() => {
    let cvs = emojiCanvasRef.current;
    if (!cvs) { cvs = document.createElement('canvas'); emojiCanvasRef.current = cvs; }
    cvs.width = 128; cvs.height = 128;
    const ctx = cvs.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 128, 128);
      ctx.font = '100px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedEmoji, 64, 64);
    }
  }, [selectedEmoji]);

  useEffect(() => {
    const particles: any[] = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * GAME_CONFIG.LOGICAL_WIDTH,
        y: Math.random() * GAME_CONFIG.LOGICAL_HEIGHT,
        speed: Math.random() * 0.5 + 0.2, 
        size: Math.random() * 3 + 1,
        type: Math.random() > 0.6 ? 'cloud' : 'star'
      });
    }
    particlesRef.current = particles;
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    
    const parent = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const cw = parent.clientWidth * dpr;
    const ch = parent.clientHeight * dpr;
    canvas.width = cw; canvas.height = ch;
    
    const logicalHeight = 500;
    const scale = parent.clientHeight / logicalHeight;
    const logicalWidth = parent.clientWidth / scale;
    
    dimsRef.current = { width: logicalWidth, height: logicalHeight, scale, dpr };

    let bgCvs = bgCanvasRef.current;
    if (!bgCvs) { bgCvs = document.createElement('canvas'); bgCanvasRef.current = bgCvs; }
    bgCvs.width = cw; bgCvs.height = ch;
    
    const bgCtx = bgCvs.getContext('2d', { alpha: false });
    if (bgCtx) {
      bgCtx.scale(dpr * scale, dpr * scale);
      
      const bgGrad = bgCtx.createLinearGradient(0, 0, 0, logicalHeight);
      bgGrad.addColorStop(0, '#1a0b2e'); bgGrad.addColorStop(0.5, '#4b1d52'); bgGrad.addColorStop(1, '#ff6b6b');
      bgCtx.fillStyle = bgGrad;
      bgCtx.fillRect(0, 0, logicalWidth, logicalHeight);

      bgCtx.beginPath();
      bgCtx.arc(logicalWidth / 2, logicalHeight * 0.65, 135, 0, TWO_PI);
      bgCtx.fillStyle = 'rgba(255, 0, 128, 0.3)';
      bgCtx.fill();

      const sunGrad = bgCtx.createLinearGradient(0, logicalHeight * 0.65 - 120, 0, logicalHeight * 0.65);
      sunGrad.addColorStop(0, '#ffdf00'); sunGrad.addColorStop(1, '#ff0080');
      bgCtx.beginPath();
      bgCtx.arc(logicalWidth / 2, logicalHeight * 0.65, 120, 0, TWO_PI);
      bgCtx.fillStyle = sunGrad;
      bgCtx.fill();
    }

    const ctx = canvas.getContext('2d', { alpha: false });
    if (ctx) {
       const pipeGrad = ctx.createLinearGradient(0, 0, GAME_CONFIG.PIPE_WIDTH, 0);
       pipeGrad.addColorStop(0, '#ff00cc'); pipeGrad.addColorStop(1, '#00ffff');
       gradientsRef.current = { pipeGrad };
    }
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
      triggerShake();
    }
  }, [triggerShake]);

  const handleScoreIncrease = useCallback((amount: number = 1, isHack: boolean = false) => {
    scoreRef.current += amount;
    setScore(scoreRef.current);
    audio.playMusicForScore(scoreRef.current);

    if (!isHack && scoreRef.current >= 3 && Math.random() < 0.25) {
      setFakeAd({ show: true, text: FAKE_ADS[Math.floor(Math.random() * FAKE_ADS.length)] });
      if (adTimeoutRef.current) clearTimeout(adTimeoutRef.current);
      adTimeoutRef.current = setTimeout(() => { setFakeAd({ show: false, text: '' }); }, 2000);
    }

    let popupText = MEME_POPUPS[Math.floor(Math.random() * MEME_POPUPS.length)];
    if (scoreRef.current >= 20 && scoreRef.current < 30) popupText = "Mups! 🍔";
    if (scoreRef.current >= 30) popupText = "Tày! ⚡";
    if (isHack) popupText = `🚀 TỚI MỐC ${scoreRef.current}!`;

    const textColor = isHack ? '#00ff00' : `hsl(${Math.floor(Math.random() * 360)}, 100%, 65%)`;
    getCachedText(popupText, textColor);

    const texts = floatingTextsRef.current;
    let assigned = false;
    let oldestIdx = 0, minLife = 999;
    
    for (let i = 0; i < texts.length; i++) {
      if (!texts[i].active) {
        texts[i] = { text: popupText, x: dimsRef.current.width / 2, y: dimsRef.current.height / 2, life: 1.2, color: textColor, active: true };
        assigned = true; break;
      }
      if (texts[i].life < minLife) { minLife = texts[i].life; oldestIdx = i; }
    }
    if (!assigned) {
      texts[oldestIdx] = { text: popupText, x: dimsRef.current.width / 2, y: dimsRef.current.height / 2, life: 1.2, color: textColor, active: true };
    }
  }, [setScore, getCachedText]);

  const toggleGodMode = useCallback(() => {
    isGodModeRef.current = !isGodModeRef.current;
    setIsGodModeUI(isGodModeRef.current);
    
    const textMsg = isGodModeRef.current ? "HACKER MAN! (+10)" : "TẮT HACK";
    const color = isGodModeRef.current ? '#00ff00' : '#ff0000';
    getCachedText(textMsg, color);

    const texts = floatingTextsRef.current;
    texts[0] = {
      text: textMsg,
      x: dimsRef.current.width / 2, y: dimsRef.current.height / 3,
      life: 2.0, color: color, active: true
    };
  }, [getCachedText]);

  const addScoreHack = useCallback(() => {
    if (isGodModeRef.current && gameStateRef.current === 'PLAYING') {
      const nextMilestone = Math.floor(scoreRef.current / 10) * 10 + 10;
      handleScoreIncrease(nextMilestone - scoreRef.current, true);
    }
  }, [handleScoreIncrease]);

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
    frameRef.current = 0; 
    
    pipesRef.current.forEach((p, i) => {
      p.active = i === 0;
      p.x = dims.width;
      p.gapTop = 100;
      p.passed = false;
      p.moveType = 'none';
      p.baseY = 100;
      p.angle = 0;
    });
    floatingTextsRef.current.forEach(t => t.active = false);
    
    scoreRef.current = 0;
    setScore(0);
    setGameState('PLAYING');
  }, [setGameState, setScore]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dims = dimsRef.current;
    frameRef.current += 1; 
    const time = frameRef.current;
    
    ctx.save();
    
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    if (bgCanvasRef.current) ctx.drawImage(bgCanvasRef.current, 0, 0);
    
    ctx.scale(dims.dpr * dims.scale, dims.dpr * dims.scale); 

    const isRGB = scoreRef.current >= 10;
    const { pipeGrad } = gradientsRef.current;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    const particles = particlesRef.current;
    const pLen = particles.length;
    for (let i = 0; i < pLen; i++) {
      const p = particles[i];
      if (p.type === 'star') {
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, p.size, 0, TWO_PI);
      }
    }
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 192, 203, 0.2)';
    ctx.beginPath();
    for (let i = 0; i < pLen; i++) {
      const p = particles[i];
      if (p.type === 'cloud') {
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, p.size * 5, 0, TWO_PI);
        ctx.moveTo(p.x + p.size*3, p.y - p.size*2);
        ctx.arc(p.x + p.size*3, p.y - p.size*2, p.size * 4, 0, TWO_PI);
        ctx.moveTo(p.x + p.size*6, p.y);
        ctx.arc(p.x + p.size*6, p.y, p.size * 4, 0, TWO_PI);
      }
    }
    ctx.fill();

    ctx.strokeStyle = isRGB ? `hsla(${time % 360}, 100%, 70%, 0.15)` : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const offsetX = (time / 2) % 40; 
    const gridStartY = dims.height * 0.65; 
    ctx.beginPath();
    for (let i = -40; i < dims.width; i += 40) { ctx.moveTo(i - offsetX, gridStartY); ctx.lineTo(i - offsetX, dims.height); }
    for (let i = gridStartY; i < dims.height; i += 20) { ctx.moveTo(0, i); ctx.lineTo(dims.width, i); }
    ctx.stroke();

    let currentFill: string | CanvasGradient;
    let currentStrobe: string;

    if (isRGB) {
        currentFill = `hsl(${(time * 2 + 180) % 360}, 100%, 50%)`;
        currentStrobe = `hsl(${(time * 2) % 360}, 100%, 60%)`;
    } else {
        currentFill = pipeGrad || '#ff00cc';
        currentStrobe = Math.random() > 0.95 ? 'rgba(255,255,255,0.8)' : '#ff003c';
    }

    const pipes = pipesRef.current;
    const pipesLen = pipes.length;
    for (let i = 0; i < pipesLen; i++) {
      const pipe = pipes[i];
      if (!pipe.active) continue;

      ctx.save();
      ctx.translate(pipe.x, 0);
      
      ctx.fillStyle = currentFill;
      ctx.strokeStyle = currentStrobe;
      ctx.lineWidth = 4;
      
      ctx.fillRect(0, 0, GAME_CONFIG.PIPE_WIDTH, pipe.gapTop);
      ctx.strokeRect(0, 0, GAME_CONFIG.PIPE_WIDTH, pipe.gapTop);
      ctx.fillStyle = currentStrobe;
      ctx.fillRect(-6, pipe.gapTop - 25, GAME_CONFIG.PIPE_WIDTH + 12, 25);

      const bottomY = pipe.gapTop + GAME_CONFIG.PIPE_GAP;
      ctx.fillStyle = currentFill;
      ctx.fillRect(0, bottomY, GAME_CONFIG.PIPE_WIDTH, dims.height - bottomY);
      ctx.strokeRect(0, bottomY, GAME_CONFIG.PIPE_WIDTH, dims.height - bottomY);
      ctx.fillStyle = currentStrobe;
      ctx.fillRect(-6, bottomY, GAME_CONFIG.PIPE_WIDTH + 12, 25);
      
      ctx.restore();
    }

    const texts = floatingTextsRef.current;
    const textsLen = texts.length;
    for (let i = 0; i < textsLen; i++) {
      const ft = texts[i];
      if (!ft.active) continue;

      ctx.save();
      ctx.translate(ft.x, ft.y);
      const scaleVal = Math.max(0.1, 1 + (1.2 - ft.life) * 1.5); 
      ctx.scale(scaleVal, scaleVal);
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.life));
      
      const cachedImage = getCachedText(ft.text, ft.color);
      ctx.drawImage(cachedImage, -200, -50);
      
      ctx.restore();
    }

    ctx.restore(); 

    const bird = birdRef.current;
    ctx.save();
    const physicalX = GAME_CONFIG.BIRD_X * dims.scale * dims.dpr;
    const physicalY = bird.y * dims.scale * dims.dpr;
    const sizeMult = scoreRef.current >= 20 ? 1.5 : 1;
    const physicalFontSize = GAME_CONFIG.BIRD_SIZE * dims.scale * dims.dpr * sizeMult;

    ctx.translate(physicalX, physicalY);
    ctx.rotate(scoreRef.current >= 40 ? bird.rotation + (Math.random() - 0.5) * 0.5 : bird.rotation);
    
    if (emojiCanvasRef.current) {
        ctx.drawImage(emojiCanvasRef.current, -physicalFontSize/2, -physicalFontSize/2, physicalFontSize, physicalFontSize);
    }
    
    if (isGodModeRef.current) {
      ctx.beginPath();
      ctx.arc(0, 0, physicalFontSize * 0.7, 0, TWO_PI);
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.restore();
  }, [canvasRef, getCachedText]);

  const update = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;

    const bird = birdRef.current;
    const dims = dimsRef.current;
    const { GRAVITY, BIRD_SIZE, PIPE_SPEED, PIPE_WIDTH, PIPE_GAP, BIRD_X, PIPE_SPACING } = GAME_CONFIG;

    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.PI / 2.5, Math.max(-Math.PI / 4, bird.velocity / 8));

    const pLen = particlesRef.current.length;
    for (let i = 0; i < pLen; i++) {
      const p = particlesRef.current[i];
      p.x -= p.speed;
      if (p.x < -100) { p.x = dims.width + 50; p.y = Math.random() * dims.height; }
    }

    const sizeMult = scoreRef.current >= 20 ? 1.5 : 1;
    const actualBirdSize = BIRD_SIZE * sizeMult;

    if (bird.y + actualBirdSize / 2 > dims.height || bird.y - actualBirdSize / 2 < 0) {
      if (!isGodModeRef.current) {
        handleGameOver();
        return;
      } else {
        if (bird.y + actualBirdSize / 2 > dims.height) { 
          bird.y = dims.height - actualBirdSize / 2; 
          bird.velocity = -5; 
        }
        if (bird.y - actualBirdSize / 2 < 0) { 
          bird.y = actualBirdSize / 2; 
          bird.velocity = 0; 
        }
      }
    }

    const texts = floatingTextsRef.current;
    for (let i = 0; i < texts.length; i++) {
      if (texts[i].active) {
        texts[i].life -= 0.02;
        texts[i].y -= 2;
        if (texts[i].life <= 0) texts[i].active = false;
      }
    }

    const pipes = pipesRef.current;
    const pipesLen = pipes.length;
    let maxActiveX = -Infinity;
    let activeCount = 0;

    for (let i = 0; i < pipesLen; i++) {
      const pipe = pipes[i];
      if (!pipe.active) continue;
      
      activeCount++;
      if (pipe.x > maxActiveX) maxActiveX = pipe.x;

      pipe.x -= PIPE_SPEED;
      if (pipe.moveType === 'sine') {
        pipe.angle += 0.04;
        pipe.gapTop = pipe.baseY + Math.sin(pipe.angle) * 50;
      }

      if (!isGodModeRef.current) {
        if (BIRD_X + actualBirdSize/3 > pipe.x && BIRD_X - actualBirdSize/3 < pipe.x + PIPE_WIDTH &&
           (bird.y - actualBirdSize/3 < pipe.gapTop || bird.y + actualBirdSize/3 > pipe.gapTop + PIPE_GAP)) {
          handleGameOver();
        }
      }

      if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
        pipe.passed = true;
        handleScoreIncrease(1, false);
      }

      if (pipe.x < -PIPE_WIDTH) {
        pipe.active = false;
      }
    }

    if (activeCount > 0 && maxActiveX < dims.width - PIPE_SPACING) {
      for (let i = 0; i < pipesLen; i++) {
        if (!pipes[i].active) {
          pipes[i].active = true;
          pipes[i].x = dims.width;
          pipes[i].gapTop = Math.random() * (dims.height - PIPE_GAP - 120) + 60;
          pipes[i].baseY = pipes[i].gapTop;
          pipes[i].passed = false;
          pipes[i].moveType = scoreRef.current >= 5 && Math.random() > 0.5 ? 'sine' : 'none';
          pipes[i].angle = 0;
          break;
        }
      }
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [handleGameOver, draw, handleScoreIncrease]);

  useEffect(() => {
    if (gameState === 'PLAYING') requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState, update]);

  return { jump, resetGame, fakeAd, toggleGodMode, addScoreHack, isGodModeUI };
};

// --- MAIN APP ---
export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0); 
  const [highScore, setHighScore] = useState(0);
  const [selectedEmoji, setSelectedEmoji] = useState('🤡');
  const [roastMsg, setRoastMsg] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputSequence = useRef<string[]>([]);

  const triggerShake = useCallback(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = 'translate3d(0, 2px, 0)';
      wrapperRef.current.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      setTimeout(() => {
        if (wrapperRef.current) {
          wrapperRef.current.style.transform = 'translate3d(0, 0, 0)';
          wrapperRef.current.style.backgroundColor = '#050010';
        }
      }, 50);
    }
  }, []);

  const { jump, resetGame, fakeAd, toggleGodMode, addScoreHack, isGodModeUI } = useGameEngine({ 
    canvasRef, gameState, setGameState, setScore, setHighScore, setRoastMsg, triggerShake, selectedEmoji 
  });

  useEffect(() => {
    const saved = localStorage.getItem('cyberfly_highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    const initAudioOnInteraction = () => {
      audio.unlock(); // Đánh thức phần cứng Audio
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
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'PLAYING') jump();
        else if (gameState === 'START' || gameState === 'GAMEOVER') resetGame();
      }

      inputSequence.current.push(e.code);
      if (inputSequence.current.length > konamiCode.length) {
        inputSequence.current.shift(); 
      }
      if (inputSequence.current.join(',') === konamiCode.join(',')) {
        toggleGodMode();
        inputSequence.current = []; 
      }

      if (e.code === 'KeyS' || e.code === 'KeyS'.toLowerCase()) {
        addScoreHack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, jump, resetGame, toggleGodMode, addScoreHack]);

  return (
    <div className="w-screen h-screen bg-[#050010] flex items-center justify-center overflow-hidden font-['Comic_Sans_MS']">
      <div ref={wrapperRef} className="relative w-full h-full overflow-hidden transition-all duration-75 ease-in-out bg-[#050010]">
        
        {gameState !== 'START' && <HUD score={score} highScore={highScore} />}
        {gameState === 'START' && <StartScreen selectedEmoji={selectedEmoji} setSelectedEmoji={setSelectedEmoji} onStart={resetGame} />}
        {gameState === 'GAMEOVER' && <GameOverScreen score={score} highScore={highScore} roastMsg={roastMsg} onRetry={resetGame} onMenu={() => { setGameState('START'); setScore(0); audio.playMenuMusic(); }} />}

        {isGodModeUI && gameState === 'PLAYING' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 border border-green-500 text-green-500 font-mono text-sm px-4 py-2 font-bold z-30 animate-pulse flex items-center gap-2 rounded-lg pointer-events-none">
            <Terminal size={16} /> BẬT HACK - BẤM 'S' LÊN +10 ĐIỂM
          </div>
        )}

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
          className="absolute inset-0 w-full h-full cursor-pointer touch-none z-10 block"
          onMouseDown={() => { if (gameState === 'PLAYING') jump(); else if (gameState === 'START') resetGame(); }}
          onTouchStart={(e) => { e.preventDefault(); if (gameState === 'PLAYING') jump(); else if (gameState === 'START') resetGame(); }}
        />
        
        <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)] z-20"></div>
      </div>
    </div>
  );
}