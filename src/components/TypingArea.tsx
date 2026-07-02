import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { TestConfig, TestResult, WpmDatapoint, CursorStyle } from '../types';
import { COMMON_WORDS, SENTENCES, STORIES, generateWordList, generateFocusedText } from '../utils/lessons';
import { playKeyClick, playErrorSound, playSuccessChime } from '../utils/audio';
import { Upload, Eye, EyeOff, Sparkles, RefreshCw, AlertCircle, FileText, ChevronRight, Volume2, VolumeX, Keyboard } from 'lucide-react';

interface TypingAreaProps {
  config: TestConfig;
  onTestComplete: (result: TestResult) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  cursorStyle?: CursorStyle;
}

export default function TypingArea({
  config,
  onTestComplete,
  isMuted,
  onToggleMute,
  cursorStyle = 'line',
}: TypingAreaProps) {
  // Practice states
  const [textToType, setTextToType] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  
  // Track keystrokes for the current word
  const [typedLetters, setTypedLetters] = useState<string[]>([]);
  
  // Overall metrics state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(config.duration);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [datapoints, setDatapoints] = useState<WpmDatapoint[]>([]);
  
  // Counter metrics
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [incorrectKeystrokes, setIncorrectKeystrokes] = useState(0);
  const [missedWords, setMissedWords] = useState<string[]>([]);
  const [missedChars, setMissedChars] = useState<Record<string, number>>({});

  // Synchronizing refs to avoid stale closures in setInterval and async callbacks without nesting setStates
  const correctKeystrokesRef = useRef(0);
  const incorrectKeystrokesRef = useRef(0);
  const missedWordsRef = useRef<string[]>([]);
  const missedCharsRef = useRef<Record<string, number>>({});
  const datapointsRef = useRef<WpmDatapoint[]>([]);
  const elapsedSecondsRef = useRef(0);

  useEffect(() => { correctKeystrokesRef.current = correctKeystrokes; }, [correctKeystrokes]);
  useEffect(() => { incorrectKeystrokesRef.current = incorrectKeystrokes; }, [incorrectKeystrokes]);
  useEffect(() => { missedWordsRef.current = missedWords; }, [missedWords]);
  useEffect(() => { missedCharsRef.current = missedChars; }, [missedChars]);
  useEffect(() => { datapointsRef.current = datapoints; }, [datapoints]);
  useEffect(() => { elapsedSecondsRef.current = elapsedSeconds; }, [elapsedSeconds]);

  // USP Flash mode specific states
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [flashTriggered, setFlashTriggered] = useState(false);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Inactivity / Sleep Mode states
  const [isAsleep, setIsAsleep] = useState(false);
  const [afkMode, setAfkMode] = useState(false);
  const lastKeystrokeTimeRef = useRef<number>(Date.now());

  // Focus ref for key inputs
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const secondTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize text based on configuration
  useEffect(() => {
    resetPractice();
  }, [config]);

  // Handle flash-mode timeouts
  useEffect(() => {
    if (config.uspMode === 'flash' && isActive && !flashTriggered) {
      setIsFlashActive(true);
      setFlashTriggered(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      
      flashTimerRef.current = setTimeout(() => {
        setIsFlashActive(false);
      }, 350); // Flash for 350ms - highly calibrated
    }
  }, [config.uspMode, currentWordIndex, isActive, flashTriggered]);

  const resetPractice = () => {
    // Determine target text
    let targetText = '';
    if (config.mode === 'custom' && config.customText) {
      targetText = config.customText;
    } else if (config.focusedChars.length > 0) {
      targetText = generateFocusedText(config.focusedChars, 30);
    } else if (config.focusedWords.length > 0) {
      // Practice exactly the missed words repeated randomly
      const repeated: string[] = [];
      const pool = config.focusedWords;
      for (let i = 0; i < 25; i++) {
        repeated.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      targetText = repeated.join(' ');
    } else {
      // Standard config
      if (config.mode === 'time') {
        // Generate enough words for the time limit (approx 60 words/min target)
        const wordCount = Math.max(80, Math.ceil((config.duration / 60) * 80));
        targetText = generateWordList(wordCount);
      } else {
        // Zen modes
        if (config.zenType === 'word') {
          targetText = generateWordList(15);
        } else if (config.zenType === 'sentence') {
          targetText = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
        } else {
          targetText = STORIES[Math.floor(Math.random() * STORIES.length)];
        }
      }
    }

    // Clean text (remove double spaces, standard quotes)
    const cleanedText = targetText.replace(/\s+/g, ' ').trim();
    setTextToType(cleanedText);
    
    const parsedWords = cleanedText.split(' ');
    setWords(parsedWords);
    setCurrentWordIndex(0);
    setCurrentLetterIndex(0);
    setTypedLetters([]);
    
    setStartTime(null);
    setTimeLeft(config.mode === 'time' ? config.duration : 0);
    setElapsedSeconds(0);
    setIsActive(false);
    setDatapoints([]);
    setCorrectKeystrokes(0);
    setIncorrectKeystrokes(0);
    setMissedWords([]);
    setMissedChars({});
    setIsFlashActive(false);
    setFlashTriggered(false);
    setIsAsleep(false);
    lastKeystrokeTimeRef.current = Date.now();

    // Clear tracking refs
    correctKeystrokesRef.current = 0;
    incorrectKeystrokesRef.current = 0;
    missedWordsRef.current = [];
    missedCharsRef.current = {};
    datapointsRef.current = [];
    elapsedSecondsRef.current = 0;

    if (secondTimerRef.current) clearInterval(secondTimerRef.current);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);

    // Focus input container automatically
    setTimeout(() => {
      if (inputContainerRef.current) {
        inputContainerRef.current.focus();
      }
    }, 50);
  };

  // 2. Start the timers
  const startPractice = () => {
    setStartTime(Date.now());
    setIsActive(true);
    lastKeystrokeTimeRef.current = Date.now();
    setIsAsleep(false);

    // Active metrics ticker (one update per second)
    secondTimerRef.current = setInterval(() => {
      // Check inactivity
      const secondsSinceLast = (Date.now() - lastKeystrokeTimeRef.current) / 1000;
      if (secondsSinceLast >= 15) {
        if (secondTimerRef.current) clearInterval(secondTimerRef.current);
        setIsActive(false);
        setIsAsleep(false);
        setAfkMode(true);
        resetPractice();
        return;
      } else if (secondsSinceLast >= 5) {
        if (!isAsleep) {
          setIsAsleep(true);
          setTypedLetters([]);
          setCurrentLetterIndex(0);
        }
      }

      setElapsedSeconds((prevSec) => {
        const nextSec = prevSec + 1;
        
        // In Time mode, decrement time left
        if (config.mode === 'time') {
          setTimeLeft((prevTime) => {
            if (prevTime <= 1) {
              clearInterval(secondTimerRef.current!);
              // Run completion asynchronously outside the state update phase
              setTimeout(() => {
                triggerTestComplete();
              }, 0);
              return 0;
            }
            return prevTime - 1;
          });
        }

        // Record real-time metrics for speed graph using up-to-date values from refs
        const correct = correctKeystrokesRef.current;
        const incorrect = incorrectKeystrokesRef.current;
        const mins = nextSec / 60;
        
        // Calculate speed
        const rawWpmVal = mins > 0 ? (correct + incorrect) / 5 / mins : 0;
        // Subtract dynamic mistakes penalty
        const wpmVal = mins > 0 ? Math.max(0, correct / 5 / mins) : 0;
        const accuracyVal = correct + incorrect > 0 ? (correct / (correct + incorrect)) * 100 : 100;

        setDatapoints((prevPoints) => [
          ...prevPoints,
          {
            second: nextSec,
            wpm: wpmVal,
            rawWpm: rawWpmVal,
            accuracy: accuracyVal,
          },
        ]);

        return nextSec;
      });
    }, 1000);
  };

  // Trigger full test completion
  const triggerTestComplete = () => {
    if (secondTimerRef.current) clearInterval(secondTimerRef.current);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);

    const correct = correctKeystrokesRef.current;
    const incorrect = incorrectKeystrokesRef.current;
    const elapsed = elapsedSecondsRef.current || 1;
    const mWords = missedWordsRef.current;
    const mChars = missedCharsRef.current;
    const currentDatapoints = datapointsRef.current;

    const minutes = elapsed / 60;
    const finalWpm = (correct / 5) / minutes;
    const finalRawWpm = ((correct + incorrect) / 5) / minutes;
    const finalAccuracy = correct + incorrect > 0 ? (correct / (correct + incorrect)) * 100 : 100;

    playSuccessChime();

    onTestComplete({
      id: `result-${Date.now()}`,
      timestamp: Date.now(),
      wpm: finalWpm,
      rawWpm: finalRawWpm,
      accuracy: finalAccuracy,
      correctChars: correct,
      incorrectChars: incorrect,
      missedWords: mWords,
      missedChars: mChars,
      datapoints: currentDatapoints.length > 0 ? currentDatapoints : [
        { second: elapsed, wpm: finalWpm, rawWpm: finalRawWpm, accuracy: finalAccuracy }
      ],
      config,
    });

    setIsActive(false);
  };

  // Cleanup effects
  useEffect(() => {
    return () => {
      if (secondTimerRef.current) clearInterval(secondTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  // 3. Handle physical key presses
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Ignore meta keys, system command shortcuts
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    
    // Refresh inactivity tracking time
    lastKeystrokeTimeRef.current = Date.now();
    
    // Wake up from sleep on any key press
    if (isAsleep) {
      setIsAsleep(false);
      e.preventDefault();
      return;
    }
    
    const key = e.key;

    // Handle Backspace
    if (key === 'Backspace') {
      e.preventDefault();
      if (!isActive) return;

      playKeyClick();

      if (currentLetterIndex > 0) {
        // Move back within current word
        const prevIndex = currentLetterIndex - 1;
        setCurrentLetterIndex(prevIndex);
        setTypedLetters((prev) => prev.slice(0, prevIndex));
      } else if (currentWordIndex > 0) {
        // Move back to previous word if not fully locked in
        // (Only allow backspacing to previous word if the user made mistakes there or wants to edit)
        const prevWordIdx = currentWordIndex - 1;
        const prevWord = words[prevWordIdx];
        setCurrentWordIndex(prevWordIdx);
        setCurrentLetterIndex(prevWord.length);
        setTypedLetters(prevWord.split(''));
      }
      return;
    }

    // Capture characters
    if (key.length === 1) {
      e.preventDefault();

      // Start test on first key stroke
      if (!isActive && startTime === null) {
        startPractice();
      }

      const activeWord = words[currentWordIndex];
      if (!activeWord) return;

      const expectedChar = activeWord[currentLetterIndex];

      // If user types SPACE at the end of a word or prematurely
      if (key === ' ') {
        // Space advances to the next word
        if (currentWordIndex < words.length - 1) {
          playKeyClick();
          
          // Check if current word was mistyped
          const typedWordStr = typedLetters.join('');
          if (typedWordStr !== activeWord) {
            setMissedWords((prev) => [...prev, activeWord]);
            // Track missed characters
            const activeChars = activeWord.split('');
            activeChars.forEach((char, idx) => {
              if (typedLetters[idx] !== char) {
                setMissedChars((prev) => ({
                  ...prev,
                  [char.toLowerCase()]: (prev[char.toLowerCase()] || 0) + 1,
                }));
              }
            });
          }

          // Advance word
          setCurrentWordIndex((prev) => prev + 1);
          setCurrentLetterIndex(0);
          setTypedLetters([]);
          setFlashTriggered(false); // Reset flash for next word
        } else {
          // End of the entire text!
          triggerTestComplete();
        }
        return;
      }

      // Check key character correctness
      const isCorrect = key === expectedChar;

      if (isCorrect) {
        playKeyClick();
        setCorrectKeystrokes((prev) => prev + 1);
      } else {
        playErrorSound();
        setIncorrectKeystrokes((prev) => prev + 1);
        
        // Track mistake for focused recommendations
        if (expectedChar) {
          const charLower = expectedChar.toLowerCase();
          setMissedChars((prev) => ({
            ...prev,
            [charLower]: (prev[charLower] || 0) + 1,
          }));
        }
      }

      // Track raw keystroke in current word buffer
      const updatedTyped = [...typedLetters, key];
      setTypedLetters(updatedTyped);

      // Advance letter
      const nextLetterIndex = currentLetterIndex + 1;
      
      if (nextLetterIndex <= activeWord.length) {
        setCurrentLetterIndex(nextLetterIndex);
      }

      // Check if we typed the very last character of the last word
      if (currentWordIndex === words.length - 1 && nextLetterIndex === activeWord.length && isCorrect) {
        // Automatically trigger test end
        setTimeout(() => {
          triggerTestComplete();
        }, 120);
      }
    }
  };

  // Focus utility
  const forceFocus = () => {
    if (inputContainerRef.current) {
      inputContainerRef.current.focus();
    }
  };

  // Real-time calculations for stats ribbon
  const currentElapsed = elapsedSeconds || 1;
  const currentMins = currentElapsed / 60;
  const currentWpm = Math.max(0, Math.round((correctKeystrokes / 5) / currentMins));
  const currentAcc = correctKeystrokes + incorrectKeystrokes > 0
    ? Math.round((correctKeystrokes / (correctKeystrokes + incorrectKeystrokes)) * 100)
    : 100;

  const renderCursor = () => {
    switch (cursorStyle) {
      case 'block':
        return <span className="absolute left-0 top-[50%] -translate-y-1/2 h-[1.1em] w-full bg-brand-accent/40 animate-[pulse_1s_infinite] pointer-events-none rounded-[1px]" />;
      case 'underline':
        return <span className="absolute left-0 top-[90%] -translate-y-1/2 h-[3px] w-full bg-brand-accent animate-[pulse_1s_infinite] pointer-events-none" />;
      case 'bar':
        return <span className="absolute left-0 top-[50%] -translate-y-1/2 h-[1.1em] w-[4px] bg-brand-accent animate-[pulse_1s_infinite] pointer-events-none" />;
      case 'line':
      default:
        return <span className="absolute left-0 top-[50%] -translate-y-1/2 h-[1.1em] w-[2px] bg-brand-accent animate-[pulse_1s_infinite] pointer-events-none" />;
    }
  };

  return (
    <div className="w-full flex flex-col gap-6" id="typing-area-wrapper">
      {/* Metrics Ribbon & Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b-2 border-brand-ink pb-4 gap-4" id="typing-ribbon">
        
        {/* Live Stats display matching the metadata spec */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Time/Zen State Display */}
          <div className="font-mono text-xs uppercase tracking-wider text-brand-ink/60">
            Session Time: <strong className="text-brand-accent font-bold">
              {config.mode === 'time' ? `${timeLeft}s` : `${elapsedSeconds}s`}
            </strong>
          </div>

          {/* Live Speed Display */}
          <div className="font-mono text-xs uppercase tracking-wider text-brand-ink/60">
            Live Speed: <strong className="text-brand-accent font-bold">{currentWpm} WPM</strong>
          </div>

          {/* Live Accuracy Display */}
          <div className="font-mono text-xs uppercase tracking-wider text-brand-ink/60">
            Live Acc: <strong className="text-brand-accent font-bold">{currentAcc}%</strong>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          {/* Sound clicker button styled minimalistically */}
          <button
            onClick={onToggleMute}
            className={`p-2 border border-brand-ink transition-all duration-150 ${
              isMuted
                ? 'bg-transparent text-brand-ink/40 border-brand-ink/30 hover:text-brand-ink'
                : 'bg-transparent text-brand-ink hover:bg-brand-ink hover:text-brand-bg'
            }`}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Quick restart - matching class .btn-main from design spec */}
          <button
            onClick={resetPractice}
            className="flex items-center gap-2 px-4 py-2 bg-brand-ink text-brand-bg hover:bg-brand-accent hover:text-brand-bg transition duration-150 font-mono text-[11px] uppercase tracking-wider font-bold"
            id="typing-btn-reset"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Practice
          </button>
        </div>
      </div>

      {/* Main Focus Typing Screen (matching .typing-box) */}
      <div
        ref={inputContainerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={forceFocus}
        className="w-full bg-brand-bg border-2 border-brand-ink p-8 md:p-12 min-h-[240px] flex flex-col justify-center relative focus:outline-none cursor-text select-none group"
        id="typing-input-screen"
      >
        {/* Thin highlight on focus */}
        <div className="absolute inset-0 border border-brand-accent/20 opacity-0 group-focus:opacity-100 transition duration-300 pointer-events-none" />

        {/* "Click to Focus" overlay when blurred */}
        <div className="absolute inset-0 bg-brand-bg/95 backdrop-blur-xs flex flex-col items-center justify-center opacity-100 group-focus:opacity-0 pointer-events-none group-focus:pointer-events-none transition duration-200 z-10 p-4 text-center">
          <Keyboard className="w-10 h-10 text-brand-accent mb-2 animate-pulse" />
          <h3 className="font-mono text-xs font-bold text-brand-ink uppercase tracking-wider">Click screen to focus & start</h3>
          <p className="text-brand-ink/60 font-mono text-[10px] mt-1 uppercase tracking-wider">Typing starts automatically on first keypress.</p>
        </div>

        {/* AFK Overlay */}
        {afkMode && (
          <div className="absolute inset-0 bg-brand-bg/95 backdrop-blur-md flex flex-col items-center justify-center transition duration-200 z-30 p-4 text-center">
            <div className="relative mb-2">
              <Keyboard className="w-10 h-10 text-brand-accent/50" />
            </div>
            <h3 className="font-mono text-xs font-bold text-brand-ink uppercase tracking-widest text-brand-accent">Test Aborted (AFK)</h3>
            <p className="text-brand-ink/60 font-mono text-[9px] mt-1 uppercase tracking-wider max-w-xs">
              You were inactive for more than 15 seconds. Click to start a new session.
            </p>
            <button
              onClick={() => {
                setAfkMode(false);
                forceFocus();
              }}
              className="mt-4 px-4 py-2 bg-brand-ink text-brand-bg font-mono text-[10px] uppercase font-bold hover:bg-brand-accent transition"
            >
              Start New Session
            </button>
          </div>
        )}

        {/* Sleep Mode / Snoozing Overlay */}
        {isAsleep && isActive && !afkMode && (
          <div className="absolute inset-0 bg-brand-bg/90 backdrop-blur-md flex flex-col items-center justify-center transition duration-200 z-20 p-4 text-center">
            <div className="relative mb-2">
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-accent"></span>
              </span>
              <Keyboard className="w-10 h-10 text-brand-ink" />
            </div>
            <h3 className="font-mono text-xs font-bold text-brand-ink uppercase tracking-widest animate-pulse">Snoozing...</h3>
            <p className="text-brand-ink/60 font-mono text-[9px] mt-1 uppercase tracking-wider max-w-xs">
              Press any key on your keyboard to awaken and resume practice.
            </p>
          </div>
        )}

        {/* Core Typing Words Container */}
        <div className="flex flex-wrap gap-x-4 gap-y-3 font-mono text-xl md:text-2xl leading-loose select-none tracking-normal">
          {words.map((word, wordIdx) => {
            const isCurrent = wordIdx === currentWordIndex;
            const isPast = wordIdx < currentWordIndex;
            const isFuture = wordIdx > currentWordIndex;

            // USP 1: Next Word Reveal mode - blur future words
            if (config.uspMode === 'reveal' && wordIdx > currentWordIndex + 1) {
              return (
                <span key={wordIdx} className="text-brand-ink/20 select-none cursor-default font-bold opacity-10 filter blur-[4px]">
                  •••••
                </span>
              );
            }

            // Focus Lock dimming for non-active words
            const isDimmed = config.focusLock && !isCurrent;
            const dimmingClass = isDimmed ? 'opacity-30' : '';

            // USP 2: Word Flash mode - hide letter values after flash
            if (config.uspMode === 'flash' && isCurrent && !isFlashActive && startTime !== null) {
              return (
                <span
                  key={wordIdx}
                  className="px-1 bg-brand-accent/5 border-b-2 border-brand-accent/30 text-brand-accent font-extrabold select-none transition-all flex items-center inline-flex"
                >
                  {word.split('').map((char, lIdx) => {
                    const hasTyped = lIdx < currentLetterIndex;
                    const typedCorrect = hasTyped && typedLetters[lIdx] === char;
                    const isCharActive = lIdx === currentLetterIndex;
                    if (hasTyped) {
                      return (
                        <span key={lIdx} className={`${typedCorrect ? 'text-brand-ink font-bold' : 'text-red-500 underline decoration-red-500 decoration-2'} relative inline-block`}>
                          {isCharActive && renderCursor()}
                          {typedLetters[lIdx]}
                        </span>
                      );
                    }
                    return (
                      <span key={lIdx} className="text-brand-accent animate-pulse relative inline-block">
                        {isCharActive && renderCursor()}
                        •
                      </span>
                    );
                  })}
                  {currentLetterIndex === word.length && (
                    <span className="relative inline-block w-[1ch] align-baseline">
                      {renderCursor()}
                      &nbsp;
                    </span>
                  )}
                </span>
              );
            }

            return (
              <span
                key={wordIdx}
                className={`relative px-0.5 transition duration-150 inline-block ${dimmingClass} ${
                  isCurrent ? 'bg-brand-accent/5 border-b-2 border-brand-accent' : ''
                }`}
              >
                {word.split('').map((char, charIdx) => {
                  let charClass = 'text-brand-ink/40'; // Default un-typed state
                  const isCharActive = isCurrent && charIdx === currentLetterIndex;
                  
                  if (isCurrent) {
                    if (charIdx < currentLetterIndex) {
                      const wasCorrect = typedLetters[charIdx] === char;
                      charClass = wasCorrect ? 'text-brand-ink font-bold' : 'text-red-500 underline font-bold decoration-red-500 decoration-2';
                    } else if (charIdx === currentLetterIndex) {
                      charClass = 'text-brand-accent font-extrabold bg-brand-accent/10 px-[1px]';
                    }
                  } else if (isPast) {
                    charClass = 'text-brand-ink';
                  }

                  return (
                    <span key={charIdx} className={`${charClass} relative inline-block`}>
                      {isCharActive && renderCursor()}
                      {char}
                    </span>
                  );
                })}
                {isCurrent && currentLetterIndex === word.length && (
                  <span className="relative inline-block w-[1ch] align-baseline">
                    {renderCursor()}
                    &nbsp;
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Mode Status details */}
      <div className="flex flex-col md:flex-row items-center justify-between text-[11px] text-brand-ink/60 font-mono uppercase tracking-wider px-2 gap-3" id="typing-sub-status">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-brand-ink">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
            Active Mode: {config.mode.toUpperCase()}
          </span>
          {config.uspMode !== 'none' && (
            <span className="bg-brand-accent text-brand-bg px-2 py-0.5 font-bold text-[9px] tracking-wide">
              {config.uspMode === 'flash' ? '⚡ Memory Flash Mode Active' : '👁️ Single Reveal Mode Active'}
            </span>
          )}
        </div>
        <span className="text-right">
          Shift + Enter to Restart
        </span>
      </div>
    </div>
  );
}
