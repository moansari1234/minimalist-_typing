import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Balloon, GameDifficulty, GameMode } from '../types';
import { playPopSound, playGameOverSound, playSuccessChime } from '../utils/audio';
import { Play, RotateCcw, AlertTriangle, Heart, Zap, Gamepad2 } from 'lucide-react';
import { COMMON_WORDS } from '../utils/lessons';

interface BalloonPopperProps {
  onBack: () => void;
}

const BALLOON_CLASSES = [
  'bg-brand-bg border-2 border-brand-ink text-brand-ink',
  'bg-brand-accent border-2 border-brand-ink text-brand-bg',
  'bg-brand-bg border-2 border-brand-ink text-brand-ink',
];

export default function BalloonPopper({ onBack }: BalloonPopperProps) {
  // Game settings
  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [mode, setMode] = useState<GameMode>('letter');
  
  // Game status
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [penalties, setPenalties] = useState(0);
  const [inputVal, setInputVal] = useState('');
  
  // Balloon list
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  // Floating particles when popped
  const [particles, setParticles] = useState<{ id: string; x: number; y: number; color: string }[]>([]);

  const gameLoopRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const balloonIdCounterRef = useRef(0);

  // Maximum penalties based on difficulty
  const maxPenalties = difficulty === 'easy' ? 10 : difficulty === 'normal' ? 5 : 3;

  // Initialize/Reset Game
  const resetGame = () => {
    setIsPlaying(false);
    setIsGameOver(false);
    setScore(0);
    setPenalties(0);
    setBalloons([]);
    setParticles([]);
    setInputVal('');
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
  };

  const startGame = () => {
    resetGame();
    setIsPlaying(true);
    playSuccessChime();
  };

  // Particle explosion helper - always popped in pure red or dark ink particles!
  const createExplosion = (x: number, y: number, bClass: string) => {
    const colorHex = bClass.includes('brand-accent') ? '#E34A38' : '#1B1B1B';
                     
    const newParticles = Array.from({ length: 10 }).map((_, i) => ({
      id: `${Date.now()}-${i}-${Math.random()}`,
      x: x + (Math.random() * 6 - 3),
      y: y + (Math.random() * 6 - 3),
      color: colorHex,
    }));

    setParticles((prev) => [...prev, ...newParticles].slice(-50));
  };

  // Spawn Balloon
  const spawnBalloon = () => {
    let text = '';
    if (mode === 'letter') {
      const letters = 'abcdefghijklmnopqrstuvwxyz';
      text = letters[Math.floor(Math.random() * letters.length)];
    } else {
      // Pick a short common word (length 3-5)
      const shortWords = COMMON_WORDS.filter(w => w.length >= 3 && w.length <= 5);
      text = shortWords[Math.floor(Math.random() * shortWords.length)];
    }

    const x = 12 + Math.random() * 76; // keep between 12% and 88% width
    const id = `balloon-${balloonIdCounterRef.current++}`;
    const speed = (difficulty === 'easy' ? 0.35 : difficulty === 'normal' ? 0.55 : 0.75) + (score * 0.012);
    const color = BALLOON_CLASSES[Math.floor(Math.random() * BALLOON_CLASSES.length)];

    const newBalloon: Balloon = {
      id,
      text,
      x,
      y: 0,
      speed,
      color,
    };

    setBalloons((prev) => [...prev, newBalloon]);
  };

  // Keyboard typing input listener
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPlaying(false);
        return;
      }

      if (mode === 'letter') {
        const char = e.key.toLowerCase();
        if (char.length === 1 && /[a-z]/.test(char)) {
          // Find if there is a matching letter balloon nearest to the top (highest Y)
          const match = [...balloons]
            .filter((b) => b.text.toLowerCase() === char)
            .sort((a, b) => b.y - a.y)[0];

          if (match) {
            playPopSound();
            createExplosion(match.x, match.y, match.color);
            setBalloons((prev) => prev.filter((b) => b.id !== match.id));
            setScore((s) => s + 1);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isGameOver, balloons, mode, score]);

  // Handle word input change (For Word Mode)
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (mode !== 'word') return;
    const val = e.target.value.toLowerCase().trim();
    setInputVal(val);

    // If the typed word matches any balloon, pop it instantly!
    const match = balloons.find((b) => b.text.toLowerCase() === val);
    if (match) {
      playPopSound();
      createExplosion(match.x, match.y, match.color);
      setBalloons((prev) => prev.filter((b) => b.id !== match.id));
      setScore((s) => s + 2); // Words give double points!
      setInputVal('');
    }
  };

  // Spawn Timer
  useEffect(() => {
    if (isPlaying && !isGameOver) {
      const interval = difficulty === 'easy' ? 2200 : difficulty === 'normal' ? 1600 : 1100;
      const dynamicInterval = Math.max(interval - score * 10, 600);
      
      spawnTimerRef.current = setInterval(spawnBalloon, dynamicInterval);
    }

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [isPlaying, isGameOver, difficulty, mode, score]);

  // Main game animation loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const updateFrame = () => {
      setBalloons((prevBalloons) => {
        let updatedBalloons: Balloon[] = [];
        let missedCount = 0;

        for (const b of prevBalloons) {
          const nextY = b.y + b.speed;
          if (nextY >= 95) {
            missedCount++;
          } else {
            updatedBalloons.push({ ...b, y: nextY });
          }
        }

        if (missedCount > 0) {
          setPenalties((p) => {
            const newP = p + missedCount;
            if (newP >= maxPenalties) {
              setIsGameOver(true);
              setIsPlaying(false);
              playGameOverSound();
            }
            return newP;
          });
        }

        return updatedBalloons;
      });

      // Update flying particles
      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, y: p.y + 0.4, x: p.x + (Math.random() * 0.4 - 0.2) }))
          .filter((p) => p.y < 100)
      );

      gameLoopRef.current = requestAnimationFrame(updateFrame);
    };

    gameLoopRef.current = requestAnimationFrame(updateFrame);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isPlaying, isGameOver, maxPenalties]);

  // Input autofocus
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isPlaying && mode === 'word' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPlaying, mode]);

  return (
    <div className="w-full max-w-4xl mx-auto bg-brand-bg border-2 border-brand-ink p-6 md:p-8 text-brand-ink flex flex-col md:flex-row gap-8 animate-fadeIn" id="game-container">
      {/* Settings / Stats Left Panel */}
      <div className="w-full md:w-1/3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-brand-ink pb-6 md:pb-0 md:pr-8" id="game-controls-panel">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Gamepad2 className="w-6 h-6 text-brand-accent stroke-[2.5]" />
            <h2 className="text-xl font-bold font-mono uppercase tracking-tight">Balloon Popper</h2>
          </div>
          <p className="text-brand-ink/60 font-sans text-xs mb-6">
            Pop floating balloons before they escape. Keep focus sharp, lock your gaze, and type fast!
          </p>

          {/* Difficulty Selection */}
          <div className="mb-5">
            <label className="text-brand-ink/50 font-mono text-[9px] font-bold uppercase tracking-wider block mb-2">
              Difficulty & Lives
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['easy', 'normal', 'hard'] as GameDifficulty[]).map((d) => (
                <button
                  key={d}
                  disabled={isPlaying}
                  onClick={() => setDifficulty(d)}
                  className={`py-1.5 px-2 font-mono text-[10px] uppercase font-bold border transition-all cursor-pointer ${
                    difficulty === d
                      ? 'bg-brand-ink text-brand-bg border-brand-ink'
                      : 'bg-transparent text-brand-ink/60 border-brand-ink/30 hover:bg-brand-ink/5 disabled:opacity-40'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Game Mode Selection */}
          <div className="mb-6">
            <label className="text-brand-ink/50 font-mono text-[9px] font-bold uppercase tracking-wider block mb-2">
              Pop Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isPlaying}
                onClick={() => setMode('letter')}
                className={`py-2 px-3 font-mono text-[10px] uppercase font-bold border transition-all cursor-pointer ${
                  mode === 'letter'
                    ? 'bg-brand-ink text-brand-bg border-brand-ink'
                    : 'bg-transparent text-brand-ink/60 border-brand-ink/30 hover:bg-brand-ink/5 disabled:opacity-40'
                }`}
              >
                Letters
              </button>
              <button
                disabled={isPlaying}
                onClick={() => setMode('word')}
                className={`py-2 px-3 font-mono text-[10px] uppercase font-bold border transition-all cursor-pointer ${
                  mode === 'word'
                    ? 'bg-brand-ink text-brand-bg border-brand-ink'
                    : 'bg-transparent text-brand-ink/60 border-brand-ink/30 hover:bg-brand-ink/5 disabled:opacity-40'
                }`}
              >
                Short Words
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Stats during game or results */}
        <div className="bg-brand-bg border border-brand-ink p-4 mb-4 rounded-none">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-brand-ink/50">Score</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Zap className="w-4 h-4 text-brand-accent fill-brand-accent/20" />
                <span className="text-2xl font-black text-brand-accent font-mono">{score}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-brand-ink/50">Penalties</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Heart className="w-4 h-4 text-brand-ink fill-brand-ink/10" />
                <span className="text-2xl font-black text-brand-ink font-mono">
                  {penalties}
                  <span className="text-brand-ink/50 text-xs font-normal">/{maxPenalties}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {!isPlaying && !isGameOver ? (
            <button
              onClick={startGame}
              className="w-full py-3 bg-brand-accent hover:bg-brand-accent/90 text-brand-bg font-extrabold font-mono text-xs uppercase tracking-wider border border-brand-ink cursor-pointer"
              id="game-btn-start"
            >
              <Play className="w-4 h-4 inline-block mr-1 fill-brand-bg" />
              Start Game
            </button>
          ) : isPlaying ? (
            <button
              onClick={() => setIsPlaying(false)}
              className="w-full py-2.5 bg-transparent hover:bg-brand-ink/5 text-brand-ink font-bold font-mono text-xs uppercase border border-brand-ink cursor-pointer"
              id="game-btn-pause"
            >
              Pause Game
            </button>
          ) : (
            <button
              onClick={startGame}
              className="w-full py-3 bg-brand-accent hover:bg-brand-accent/90 text-brand-bg font-extrabold font-mono text-xs uppercase tracking-wider border border-brand-ink cursor-pointer"
              id="game-btn-restart"
            >
              <RotateCcw className="w-4 h-4 inline-block mr-1" />
              Play Again
            </button>
          )}

          <button
            onClick={onBack}
            className="w-full py-2 bg-transparent text-brand-ink/60 hover:text-brand-ink text-xs font-mono uppercase tracking-wider border border-brand-ink/30 hover:bg-brand-ink/5 mt-1 cursor-pointer"
            id="game-btn-back"
          >
            Practice Arena
          </button>
        </div>
      </div>

      {/* Interactive Balloon Popper Arena */}
      <div className="w-full md:w-2/3 flex flex-col bg-brand-bg border-2 border-brand-ink overflow-hidden relative min-h-[440px]" id="game-arena">
        {/* Sky/Float Space */}
        <div className="flex-1 relative overflow-hidden bg-brand-bg" id="game-sky">
          {/* Retro Editorial grid ambient background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f2f1ed_1px,transparent_1px),linear-gradient(to_bottom,#f2f1ed_1px,transparent_1px)] bg-[size:32px_32px]" />

          {/* Render Active Balloons */}
          {balloons.map((b) => (
            <div
              key={b.id}
              style={{
                left: `${b.x}%`,
                bottom: `${b.y}%`,
                transform: 'translateX(-50%)',
              }}
              className="absolute flex flex-col items-center transition-all duration-75 select-none"
            >
              {/* Balloon main body - stylized as slightly curved blocks */}
              <div
                className={`px-3.5 py-2.5 border-2 text-center flex items-center justify-center font-bold font-mono text-xs shadow-none uppercase min-w-[50px] rounded-xs ${b.color}`}
              >
                {b.text}
              </div>
              {/* Balloon tie */}
              <div className="w-2 h-2 bg-brand-ink mt-[-1px] rotate-45" />
              {/* Balloon string */}
              <div className="w-[1px] h-10 bg-brand-ink/40" />
            </div>
          ))}

          {/* Render popping particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              style={{
                left: `${p.x}%`,
                bottom: `${p.y}%`,
                backgroundColor: p.color,
              }}
              className="absolute w-2.5 h-2.5 rounded-none opacity-80 animate-ping pointer-events-none"
            />
          ))}

          {/* Idle Start screen */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-brand-bg/95 z-10">
              <Gamepad2 className="w-12 h-12 text-brand-accent mb-3 animate-pulse" />
              <h3 className="font-mono text-base font-bold uppercase tracking-wider text-brand-ink">Ready to Pop?</h3>
              {mode === 'letter' ? (
                <p className="text-brand-ink/60 font-sans text-xs max-w-sm mt-2 leading-relaxed">
                  Single letters will float upward. Press keycaps on your keyboard to pop them instantly. Focus on flow and position.
                </p>
              ) : (
                <p className="text-brand-ink/60 font-sans text-xs max-w-sm mt-2 leading-relaxed">
                  Common English words will float upward. Type the full word below to target and pop immediately!
                </p>
              )}
              <button
                onClick={startGame}
                className="mt-6 px-6 py-2.5 bg-brand-ink hover:bg-brand-accent text-brand-bg font-mono font-bold text-xs uppercase tracking-wider border border-brand-ink transition-colors cursor-pointer"
              >
                Press Start to Begin
              </button>
            </div>
          )}

          {/* Game Over Screen */}
          {isGameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-brand-accent text-brand-bg z-10 animate-fadeIn">
              <AlertTriangle className="w-12 h-12 text-brand-bg mb-3" />
              <h3 className="font-mono text-xl font-bold uppercase tracking-wider">Game Over</h3>
              <p className="font-sans text-sm max-w-xs mt-2 leading-relaxed opacity-90">
                Too many balloons escaped! You recorded <strong className="font-mono font-black text-white">{score}</strong> total points.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={startGame}
                  className="px-5 py-2.5 bg-brand-bg hover:bg-brand-bg text-brand-ink font-bold font-mono text-xs uppercase border border-brand-ink cursor-pointer"
                >
                  Play Again
                </button>
                <button
                  onClick={resetGame}
                  className="px-5 py-2.5 bg-transparent border border-brand-bg text-brand-bg font-bold font-mono text-xs uppercase hover:bg-brand-bg hover:text-brand-ink cursor-pointer"
                >
                  Setup
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Dock at bottom of sky */}
        {isPlaying && mode === 'word' && (
          <div className="p-4 bg-brand-bg border-t-2 border-brand-ink flex items-center justify-center gap-3">
            <span className="font-mono text-xs font-bold text-brand-ink/50 uppercase tracking-wider">Type word:</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={handleInputChange}
              placeholder="Type matching words here..."
              className="flex-1 max-w-md bg-brand-bg border border-brand-ink focus:border-brand-accent text-brand-ink placeholder-brand-ink/40 px-4 py-2 rounded-none text-sm outline-none font-mono font-semibold uppercase text-center transition-colors"
              id="game-word-input"
            />
          </div>
        )}

        {/* Interactive indicator for letters */}
        {isPlaying && mode === 'letter' && (
          <div className="p-3 bg-brand-bg border-t border-brand-ink text-center text-[10px] text-brand-ink/50 font-mono uppercase tracking-widest">
            💡 HOME ROW INSTANT Pop: press letter keys on your keyboard directly.
          </div>
        )}
      </div>
    </div>
  );
}
