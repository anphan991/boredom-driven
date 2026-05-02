import { useEffect, useRef, useCallback } from 'react';
import type { GameState, Bird, Pipe, FloatingText } from '../types';
import { GAME_CONFIG, ROASTS, MEME_POPUPS } from '../constants/config';
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
  
  // Lưu trữ kích thước động của màn hình
  const dimsRef = useRef({ width: 400, height: 500, scale: 1 });

  const gameStateRef = useRef<GameState>(gameState);
  const emojiRef = useRef(selectedEmoji);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { emojiRef.current = selectedEmoji; }, [selectedEmoji]);

  // --- XỬ LÝ RESIZE MÀN HÌNH ---
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

  // Phát nhạc xổ số khi ở màn hình chờ (Start Screen)
  useEffect(() => {
    if (gameState === 'START') {
      audio.playMenuMusic();
    }
  }, [gameState]);

  const jump = useCallback(() => {
    if (gameStateRef.current === 'PLAYING') {
      birdRef.current.velocity = GAME_CONFIG.JUMP_STRENGTH;
      
      // PHÁT TIẾNG NHẢY (Whoosh)
      audio.playJump(); 
      
      setShake(true);
      setTimeout(() => setShake(false), 80);
    }
  }, [setShake]);

  const handleGameOver = useCallback(() => {
    setGameState('GAMEOVER');
    
    // DỪNG NHẠC CẦU VỒNG VÀ PHÁT TIẾNG THUA (do-ngu-do-an-hai.mp3)
    audio.stopSequence(); 
    audio.playCrash(); 

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
    
    // DỪNG NHẠC XỔ SỐ KHI BẮT ĐẦU CHƠI
    audio.stopMenuMusic();
    audio.stopSequence();

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

    ctx.strokeStyle = isRGB ? `hsla(${time % 360}, 100%, 50%, 0.1)` : 'rgba(239, 68, 68, 0.05)';
    for (let i = 0; i < dims.width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, dims.height); ctx.stroke();
    }
    for (let i = 0; i < dims.height; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(dims.width, i); ctx.stroke();
    }

    pipesRef.current.forEach(pipe => {
      ctx.fillStyle = isRGB ? `hsla(${time % 360}, 100%, 50%, 0.15)` : 'rgba(239, 68, 68, 0.15)';
      ctx.strokeStyle = isRGB ? `hsla(${time % 360}, 100%, 50%, 0.6)` : 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 2;
      ctx.fillRect(pipe.x, 0, GAME_CONFIG.PIPE_WIDTH, pipe.gapTop);
      ctx.strokeRect(pipe.x, -2, GAME_CONFIG.PIPE_WIDTH, pipe.gapTop + 2);
      const bottomY = pipe.gapTop + GAME_CONFIG.PIPE_GAP;
      ctx.fillRect(pipe.x, bottomY, GAME_CONFIG.PIPE_WIDTH, dims.height - bottomY);
      ctx.strokeRect(pipe.x, bottomY, GAME_CONFIG.PIPE_WIDTH, dims.height - bottomY + 2);
    });

    floatingTextsRef.current.forEach(ft => {
      ctx.save();
      ctx.translate(ft.x, ft.y);
      const scaleFactor = 1 + (1.2 - ft.life) * 1.5; 
      ctx.scale(scaleFactor, scaleFactor);
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.life));
      ctx.font = '900 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    });

    ctx.restore(); 

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
        
        // KIỂM TRA MỐC 10 ĐIỂM ĐỂ BẮT ĐẦU CHUỖI NHẠC CẦU VỒNG
        if (scoreRef.current === 10) {
          audio.startRainbowSequence();
        } else if (scoreRef.current < 10) {
          audio.playScoreSound(); // Tiếng Fahhh random
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

  return { jump, resetGame };
};