import { useEffect, useRef, useCallback, useState } from 'react';
import type { GameState, Bird, Pipe, FloatingText } from '../types';
import { GAME_CONFIG, ROASTS, MEME_POPUPS, FAKE_ADS } from '../constants/config';
import { audio } from '../utils/audioManager';

interface UseGameEngineProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  setHighScore: React.Dispatch<React.SetStateAction<number>>;
  setRoastMsg: (msg: string) => void;
  setShake: (shake: boolean) => void;
  selectedEmoji: string;
}

export const useGameEngine = ({
  canvasRef, gameState, setGameState, setScore, setHighScore, setRoastMsg, setShake, selectedEmoji
}: UseGameEngineProps) => {
  const birdRef = useRef<Bird>({ y: 250, velocity: 0, rotation: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const requestRef = useRef<number>(0);
  const scoreRef = useRef(0);
  
  const particlesRef = useRef<Array<{x: number, y: number, speed: number, size: number}>>([]);
  
  // Hàm khởi tạo hạt (chạy 1 lần)
  useEffect(() => {
    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * GAME_CONFIG.LOGICAL_WIDTH,
        y: Math.random() * GAME_CONFIG.LOGICAL_HEIGHT,
        speed: Math.random() * 0.5 + 0.1, // Tốc độ bay khác nhau tạo 3D
        size: Math.random() * 2 + 0.5
      });
    }
    particlesRef.current = particles;
  }, []);

  // TÍNH NĂNG TROLL: Quản lý trạng thái hiển thị Fake Pop-up
  const [fakeAd, setFakeAd] = useState({ show: false, text: '' });
  const adTimeoutRef = useRef<any>(null);
  
  const dimsRef = useRef({ width: 400, height: 500, scale: 1 });

  const gameStateRef = useRef<GameState>(gameState);
  const emojiRef = useRef(selectedEmoji);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { emojiRef.current = selectedEmoji; }, [selectedEmoji]);

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

  useEffect(() => {
    if (gameState === 'START') {
      audio.playMenuMusic();
    }
  }, [gameState]);

  const jump = useCallback(() => {
    if (gameStateRef.current === 'PLAYING') {
      birdRef.current.velocity = GAME_CONFIG.JUMP_STRENGTH;
      audio.playJump(); 
      setShake(true);
      setTimeout(() => setShake(false), 80);
    }
  }, [setShake]);

  const handleGameOver = useCallback(() => {
    setGameState('GAMEOVER');
    audio.stopSequence(); 
    audio.playCrash(); 

    // Dọn dẹp Fake Ad khi chết
    setFakeAd({ show: false, text: '' });
    if (adTimeoutRef.current) clearTimeout(adTimeoutRef.current);

    setRoastMsg(ROASTS[Math.floor(Math.random() * ROASTS.length)]);
    setHighScore(prev => {
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

    // Dọn dẹp Fake Ad khi chơi lại
    setFakeAd({ show: false, text: '' });
    if (adTimeoutRef.current) clearTimeout(adTimeoutRef.current);

    birdRef.current = { y: dims.height / 2, velocity: 0, rotation: 0 };
    pipesRef.current = [{ 
      x: dims.width, gapTop: 100, passed: false, moveType: 'none', baseY: 100, angle: 0 
    }];
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

    // 1. VẼ HẠT BACKGROUND (CYBER PARTICLES)
    ctx.fillStyle = isRGB ? `hsla(${time % 360}, 100%, 70%, 0.5)` : 'rgba(0, 255, 255, 0.3)'; // Màu Cyan mờ
    particlesRef.current.forEach(p => {
      p.x -= p.speed; // Hạt trôi sang trái
      if (p.x < 0) {  // Nếu khuất màn hình thì vòng lại bên phải
        p.x = dimsRef.current.width;
        p.y = Math.random() * dimsRef.current.height;
      }
    });

    // 2. VẼ LƯỚI CUỘN DI ĐỘNG (SCROLLING GRID)
    ctx.strokeStyle = isRGB ? `hsla(${time % 360}, 100%, 50%, 0.1)` : 'rgba(239, 68, 68, 0.08)';
    ctx.lineWidth = 1;
    // Offset tạo hiệu ứng lưới trôi ngược lại với tốc độ chim bay
    const offsetX = (Date.now() / 20) % 40; 
    
    // Cột dọc trôi liên tục
    for (let i = -40; i < dims.width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i - offsetX, 0); ctx.lineTo(i - offsetX, dims.height); ctx.stroke();
    }
    // Hàng ngang đứng im
    for (let i = 0; i < dims.height; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(dims.width, i); ctx.stroke();
    }

    // 3. VẼ ỐNG VỚI HIỆU ỨNG NEON GLOW CHÁY MÁY
    pipesRef.current.forEach(pipe => {
      let alpha = 1;
      if (scoreRef.current >= 30) {
        const distToPipe = pipe.x - GAME_CONFIG.BIRD_X;
        if (distToPipe < 150 && pipe.x + GAME_CONFIG.PIPE_WIDTH > GAME_CONFIG.BIRD_X - 50) {
          alpha = 0; 
        }
      }
      ctx.globalAlpha = alpha;

      // Cài đặt Neon Glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = isRGB ? `hsl(${time % 360}, 100%, 50%)` : 'rgba(239, 68, 68, 0.8)';
      
      ctx.fillStyle = isRGB ? `hsla(${time % 360}, 100%, 5%, 0.8)` : 'rgba(20, 5, 5, 0.8)'; // Lõi ống tối màu
      ctx.strokeStyle = isRGB ? `hsla(${time % 360}, 100%, 60%, 1)` : 'rgba(255, 50, 50, 1)'; // Viền ống sáng chói
      ctx.lineWidth = 2;

      // Vẽ ống trên
      ctx.fillRect(pipe.x, 0, GAME_CONFIG.PIPE_WIDTH, pipe.gapTop);
      ctx.strokeRect(pipe.x, -2, GAME_CONFIG.PIPE_WIDTH, pipe.gapTop + 2);
      
      // Vẽ ống dưới
      const bottomY = pipe.gapTop + GAME_CONFIG.PIPE_GAP;
      ctx.fillRect(pipe.x, bottomY, GAME_CONFIG.PIPE_WIDTH, dims.height - bottomY);
      ctx.strokeRect(pipe.x, bottomY, GAME_CONFIG.PIPE_WIDTH, dims.height - bottomY + 2);
      
      // Tắt Glow để không ảnh hưởng các vật thể khác
      ctx.shadowBlur = 0; 
      ctx.globalAlpha = 1; 
    });

    // 4. VẼ TEXT BAY LÊN (CŨNG CÓ NEON)
    floatingTextsRef.current.forEach(ft => {
      ctx.save();
      ctx.translate(ft.x, ft.y);
      const scaleFactor = 1 + (1.2 - ft.life) * 1.5; 
      ctx.scale(scaleFactor, scaleFactor);
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.life));
      ctx.font = '900 32px sans-serif';
      ctx.textAlign = 'center';
      
      ctx.shadowBlur = 10;
      ctx.shadowColor = ft.color;
      ctx.fillStyle = ft.color;
      
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    });

    ctx.restore(); 

    // 5. VẼ AVATAR
    const bird = birdRef.current;
    ctx.save();
    const physicalX = GAME_CONFIG.BIRD_X * dims.scale * dpr;
    const physicalY = bird.y * dims.scale * dpr;
    const physicalFontSize = GAME_CONFIG.BIRD_SIZE * dims.scale * dpr;

    ctx.translate(physicalX, physicalY);
    ctx.rotate(scoreRef.current >= 15 ? (time / 10) : bird.rotation);
    ctx.font = `${physicalFontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Thêm tí viền mờ cho Avatar nổi lên
    ctx.shadowBlur = 20 * dims.scale;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
    
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

    if (bird.y + BIRD_SIZE / 2 > dims.height || bird.y - BIRD_SIZE / 2 < 0) {
      handleGameOver();
      return;
    }

    floatingTextsRef.current.forEach(ft => { ft.life -= 0.015; ft.y -= 2; });
    floatingTextsRef.current = floatingTextsRef.current.filter(ft => ft.life > 0);

    pipesRef.current.forEach((pipe) => {
      pipe.x -= PIPE_SPEED;
      if (pipe.moveType === 'sine') {
        pipe.angle += 0.04;
        pipe.gapTop = pipe.baseY + Math.sin(pipe.angle) * 50;
      }

      if (BIRD_X + 12 > pipe.x && BIRD_X - 12 < pipe.x + PIPE_WIDTH &&
         (bird.y - 12 < pipe.gapTop || bird.y + 12 > pipe.gapTop + PIPE_GAP)) {
        handleGameOver();
      }

      if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
        pipe.passed = true;
        scoreRef.current += 1;
        setScore(scoreRef.current);
        
        if (scoreRef.current === 10) {
          audio.startRainbowSequence();
        } else if (scoreRef.current < 10) {
          audio.playScoreSound();
        }

        // TÍNH NĂNG TROLL: Bật Fake Ad (25% tỷ lệ xuất hiện từ điểm số 3)
        if (scoreRef.current >= 3 && Math.random() < 0.25) {
          setFakeAd({ 
            show: true, 
            text: FAKE_ADS[Math.floor(Math.random() * FAKE_ADS.length)] 
          });
          
          if (adTimeoutRef.current) clearTimeout(adTimeoutRef.current);
          adTimeoutRef.current = setTimeout(() => {
            setFakeAd({ show: false, text: '' });
          }, 1800);
        }

        floatingTextsRef.current = [{
          text: MEME_POPUPS[Math.floor(Math.random() * MEME_POPUPS.length)],
          x: dims.width / 2, y: dims.height / 2, life: 1.2,
          color: `hsl(${Math.random() * 360}, 100%, 65%)`
        }];
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
    if (gameState === 'PLAYING') {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState, update]);

  // Nhớ export thêm biến fakeAd để bên App.tsx vẽ
  return { jump, resetGame, fakeAd };
};