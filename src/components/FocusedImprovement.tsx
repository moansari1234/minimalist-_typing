import { useState } from 'react';
import { Target, Sparkles, Layers, Keyboard } from 'lucide-react';

interface FocusedImprovementProps {
  missedCharsHistory: Record<string, number>;
  missedWordsHistory: string[];
  onStartFocusedPractice: (chars: string[], words: string[]) => void;
  onClearHistory: () => void;
}

export default function FocusedImprovement({
  missedCharsHistory,
  missedWordsHistory,
  onStartFocusedPractice,
  onClearHistory,
}: FocusedImprovementProps) {
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  // Sorted list of frequently missed letters
  const sortedMissedChars = Object.entries(missedCharsHistory)
    .sort((a, b) => b[1] - a[1])
    .filter(([char]) => char !== ' ' && char.length === 1 && /[a-z]/.test(char)); // letter-only characters

  // Filter unique recently missed words
  const uniqueMissedWords = Array.from(new Set(missedWordsHistory)).slice(0, 15);

  const toggleCharSelection = (char: string) => {
    if (selectedChars.includes(char)) {
      setSelectedChars((prev) => prev.filter((c) => c !== char));
    } else {
      setSelectedChars((prev) => [...prev, char]);
    }
  };

  const toggleWordSelection = (word: string) => {
    if (selectedWords.includes(word)) {
      setSelectedWords((prev) => prev.filter((w) => w !== word));
    } else {
      setSelectedWords((prev) => [...prev, word]);
    }
  };

  const handleStartPractice = () => {
    if (selectedChars.length === 0 && selectedWords.length === 0) return;
    onStartFocusedPractice(selectedChars, selectedWords);
  };

  // Keyboard Heat Map Visualizer - QWERTY standard keys
  const rows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  // Helper to determine letter color based on mistake count
  const getLetterHeatClass = (letter: string) => {
    const count = missedCharsHistory[letter] || 0;
    const isSelected = selectedChars.includes(letter);

    if (isSelected) {
      return 'bg-brand-accent text-brand-bg font-bold border-brand-ink';
    }

    if (count === 0) {
      return 'bg-brand-bg text-brand-ink/60 hover:text-brand-ink border-brand-ink/30 hover:bg-brand-ink/5';
    } else if (count <= 2) {
      return 'bg-brand-accent/10 text-brand-ink border-brand-accent/30 hover:bg-brand-accent/20';
    } else if (count <= 5) {
      return 'bg-brand-accent/25 text-brand-ink font-semibold border-brand-accent/50 hover:bg-brand-accent/35';
    } else {
      return 'bg-brand-accent/50 text-brand-ink font-bold border-brand-accent/80 hover:bg-brand-accent/60';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-brand-bg border-2 border-brand-ink p-6 md:p-8 text-brand-ink flex flex-col gap-8 animate-fadeIn" id="focused-practice-dashboard">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-brand-ink pb-5 gap-4" id="focused-header">
        <div className="flex items-center gap-3">
          <div className="bg-brand-accent text-brand-bg p-2.5 rounded-none">
            <Target className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-mono uppercase tracking-tight">Targeted Weakness practice</h2>
            <p className="text-brand-ink/60 text-xs font-mono uppercase tracking-wider mt-1">Generate customized drill sessions focused purely on your spelling errors</p>
          </div>
        </div>

        {/* Clear Stats btn */}
        {(sortedMissedChars.length > 0 || uniqueMissedWords.length > 0) && (
          <button
            onClick={onClearHistory}
            className="text-xs text-brand-ink/60 hover:text-brand-accent flex items-center gap-1.5 transition self-start sm:self-auto py-1 px-2.5 font-mono uppercase tracking-wider border border-brand-ink/30 bg-transparent hover:bg-brand-ink/5 cursor-pointer"
          >
            Reset Error Statistics
          </button>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="focused-main-grid">
        
        {/* Left Side: Heatmap and Character Picker */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3 border-b border-brand-ink/10 pb-2">
              <Keyboard className="w-4 h-4 text-brand-accent" />
              <h3 className="font-mono text-xs font-bold text-brand-ink uppercase tracking-wider">Keyboard Error Heat-Map</h3>
            </div>
            <p className="text-brand-ink/60 font-sans text-xs mb-4 leading-relaxed">
              Colored keys indicate higher mistake rates in previous sessions. Click keys to compose your targeted letter practice!
            </p>

            {/* QWERTY Heat Map Keyboard Grid */}
            <div className="flex flex-col gap-2 bg-brand-bg p-4 border-2 border-brand-ink rounded-none" id="keyboard-heatmap">
              {rows.map((row, rIdx) => (
                <div key={rIdx} className="flex justify-center gap-1.5">
                  {row.map((letter) => {
                    const count = missedCharsHistory[letter] || 0;
                    return (
                      <button
                        key={letter}
                        onClick={() => toggleCharSelection(letter)}
                        className={`w-7 h-8 md:w-9 md:h-10 text-xs font-bold font-mono uppercase border transition duration-100 flex flex-col items-center justify-center relative select-none cursor-pointer ${getLetterHeatClass(letter)}`}
                        title={`Missed ${count} times`}
                      >
                        <span>{letter}</span>
                        {count > 0 && (
                          <span className="text-[7px] font-mono opacity-80 mt-[2px] leading-none">{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Quick recommendations list */}
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-brand-ink/50 block mb-3">
              Frequently Missed Letters
            </span>

            {sortedMissedChars.length === 0 ? (
              <div className="bg-brand-bg border border-brand-ink p-5 text-center text-brand-ink/60 font-mono text-xs">
                No mistakes tracked yet. Complete a few practice sessions to unlock visual keyboard analytics!
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {sortedMissedChars.slice(0, 8).map(([char, count]) => {
                  const isSelected = selectedChars.includes(char);
                  return (
                    <button
                      key={char}
                      onClick={() => toggleCharSelection(char)}
                      className={`py-2 px-3 border text-sm flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand-accent border-brand-ink text-brand-bg font-bold'
                          : 'bg-brand-bg border-brand-ink/30 text-brand-ink hover:bg-brand-ink/5'
                      }`}
                    >
                      <span className="uppercase font-mono font-black">{char}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-brand-bg/80' : 'text-brand-ink/50'}`}>
                        {count}x
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Missed Words Selection and Drill Builder */}
        <div className="flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3 border-b border-brand-ink/10 pb-2">
                <Layers className="w-4 h-4 text-brand-accent" />
                <h3 className="font-mono text-xs font-bold text-brand-ink uppercase tracking-wider">Missed Words List</h3>
              </div>
              <p className="text-brand-ink/60 font-sans text-xs mb-4 leading-relaxed">
                Toggle recently misspelled words to construct a custom repetition practice block.
              </p>

              {uniqueMissedWords.length === 0 ? (
                <div className="bg-brand-bg border border-brand-ink p-6 text-center text-brand-ink/60 font-mono text-xs flex flex-col items-center justify-center min-h-[140px]">
                  <Sparkles className="w-6 h-6 text-brand-ink/30 mb-2" />
                  No spelling errors cataloged yet. Enjoy the clean run!
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto bg-brand-bg p-3 border border-brand-ink/30 rounded-none">
                  {uniqueMissedWords.map((word) => {
                    const isSelected = selectedWords.includes(word);
                    return (
                      <button
                        key={word}
                        onClick={() => toggleWordSelection(word)}
                        className={`py-1 px-2.5 border text-xs font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-accent border-brand-ink text-brand-bg font-bold'
                            : 'bg-brand-bg border-brand-ink/30 text-brand-ink hover:bg-brand-ink/5'
                        }`}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Practice Builder Summary Footer */}
          <div className="bg-brand-bg border-2 border-brand-ink p-5 mt-auto flex flex-col gap-4">
            <div>
              <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-brand-ink/50 block mb-1">
                Custom Drill Configuration
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-ink mt-2 font-mono uppercase tracking-wider">
                <div>
                  Selected Letters: <strong className="text-brand-accent font-mono font-bold">{selectedChars.length || 'None'}</strong>
                </div>
                <div>
                  Selected Words: <strong className="text-brand-accent font-mono font-bold">{selectedWords.length || 'None'}</strong>
                </div>
              </div>
            </div>

            <button
              disabled={selectedChars.length === 0 && selectedWords.length === 0}
              onClick={handleStartPractice}
              className={`w-full py-3 transition duration-150 flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-wider ${
                selectedChars.length > 0 || selectedWords.length > 0
                  ? 'bg-brand-ink text-brand-bg hover:bg-brand-accent hover:border-brand-accent border border-brand-ink cursor-pointer'
                  : 'bg-transparent text-brand-ink/20 border border-brand-ink/10 cursor-not-allowed'
              }`}
              id="focused-btn-generate"
            >
              <Target className="w-4 h-4" />
              Generate Targeted Practice Drill
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
