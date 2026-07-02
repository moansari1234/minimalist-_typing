import React, { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { TestConfig, TestResult, TestDuration, ZenModeType, THEMES, FONTS, CursorStyle, UserProfile, UserDataPayload } from './types';
import TypingArea from './components/TypingArea';
import StatsPanel from './components/StatsPanel';
import BalloonPopper from './components/BalloonPopper';
import FocusedImprovement from './components/FocusedImprovement';
import WpmTrendChart from './components/WpmTrendChart';
import SettingsPanel from './components/SettingsPanel';
import AuthScreen from './components/AuthScreen';
import { toggleMute, getMuteState } from './utils/audio';
import { generateFocusedText } from './utils/lessons';
import { encryptPayload } from './utils/crypto';
import { upsertUser, exportUserData } from './utils/storage';
import { Keyboard, Sun, Moon, Target, Gamepad2, FileText, BarChart2, ShieldCheck, Sparkles, Volume2, VolumeX, Eye, EyeOff, Zap, HelpCircle, Upload, Palette, Type, Settings, LogOut, Download, Users, UserPlus } from 'lucide-react';

interface AppContentProps {
  user: UserProfile | null;
  initialPayload: UserDataPayload | null;
  dek: CryptoKey | null;
  onLogout: (mode?: 'select' | 'create') => void;
}

function AppContent({ user, initialPayload, dek, onLogout }: AppContentProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isGuest = !user || !initialPayload || !dek;

  const defaultPayload = initialPayload || {
    sessionHistory: [],
    missedCharsHistory: {},
    missedWordsHistory: [],
    settings: {
      currentThemeId: 'swiss',
      customTheme: {
        enabled: false,
        mode: 'light',
        accentColor: '#2563EB',
        tintLevel: 50,
      },
      currentFontId: 'space-mono',
      cursorStyle: 'line' as CursorStyle,
      dailyGoalMinutes: 15,
      dailyTypedSeconds: 0,
      dailyTypedDate: new Date().toISOString().split('T')[0]
    }
  };

  // Mute toggle
  const [isMuted, setIsMuted] = useState(getMuteState());

  // Dynamic Theme and Font configuration
  const [currentThemeId, setCurrentThemeId] = useState<string>(defaultPayload.settings.currentThemeId);
  const [customTheme, setCustomTheme] = useState(defaultPayload.settings.customTheme || {
    enabled: false,
    mode: 'light' as const,
    accentColor: '#2563EB',
    tintLevel: 50,
  });
  const [currentFontId, setCurrentFontId] = useState<string>(defaultPayload.settings.currentFontId);
  const [cursorStyle, setCursorStyle] = useState<CursorStyle>(defaultPayload.settings.cursorStyle);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(defaultPayload.settings.dailyGoalMinutes);
  const [dailyTypedSeconds, setDailyTypedSeconds] = useState<number>(defaultPayload.settings.dailyTypedSeconds);
  const [dailyTypedDate, setDailyTypedDate] = useState<string>(defaultPayload.settings.dailyTypedDate);

  // Active testing outcome
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);

  // Persisted statistics
  const [sessionHistory, setSessionHistory] = useState<TestResult[]>(defaultPayload.sessionHistory);
  const [missedCharsHistory, setMissedCharsHistory] = useState<Record<string, number>>(defaultPayload.missedCharsHistory);
  const [missedWordsHistory, setMissedWordsHistory] = useState<string[]>(defaultPayload.missedWordsHistory);

  // Save changes to encrypted storage
  const saveStatsToStorage = async (
    newHistory: TestResult[],
    newChars: Record<string, number>,
    newWords: string[],
    newSettings?: any
  ) => {
    if (isGuest || !user || !dek) return; // Guests don't save

    const payload: UserDataPayload = {
      sessionHistory: newHistory,
      missedCharsHistory: newChars,
      missedWordsHistory: newWords,
      settings: {
        currentThemeId,
        currentFontId,
        cursorStyle,
        dailyGoalMinutes,
        dailyTypedSeconds,
        dailyTypedDate,
        ...newSettings
      }
    };

    try {
      const { encrypted, iv } = await encryptPayload(payload, dek);
      const updatedUser = {
        ...user,
        encrypted_payload: encrypted,
        iv_payload: iv
      };
      upsertUser(updatedUser);
    } catch (e) {
      console.error('Failed to encrypt and save payload', e);
    }
  };

  // Save settings when they change
  useEffect(() => {
    if (isGuest) return;
    
    // Check if day rolled over
    const today = new Date().toISOString().split('T')[0];
    let actualSeconds = dailyTypedSeconds;
    let actualDate = dailyTypedDate;
    
    if (today !== dailyTypedDate) {
      actualSeconds = 0;
      actualDate = today;
      setDailyTypedSeconds(0);
      setDailyTypedDate(today);
    }

    saveStatsToStorage(sessionHistory, missedCharsHistory, missedWordsHistory, {
      currentThemeId,
      customTheme,
      currentFontId,
      cursorStyle,
      dailyGoalMinutes,
      dailyTypedSeconds: actualSeconds,
      dailyTypedDate: actualDate
    });
  }, [currentThemeId, customTheme, currentFontId, cursorStyle, dailyGoalMinutes, dailyTypedSeconds]);

  const activeTheme = THEMES.find((t) => t.id === currentThemeId) || THEMES[0];
  const activeFont = FONTS.find((f) => f.id === currentFontId) || FONTS[0];

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-font', activeFont.value);
    
    if (customTheme && customTheme.enabled) {
      if (customTheme.mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      import('./utils/themeEngine').then(({ generateTheme, hexToOklch, applyThemeToDocument }) => {
        const oklchAccent = hexToOklch(customTheme.accentColor);
        const tokens = generateTheme(customTheme.mode, oklchAccent, customTheme.tintLevel);
        applyThemeToDocument(tokens);
      });
    } else {
      if (activeTheme.isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      // Remove any generated CSS variables by applyThemeToDocument to fallback to simple vars if needed, 
      // but applyThemeToDocument updates the same brand variables:
      root.style.setProperty('--brand-bg', activeTheme.bg);
      root.style.setProperty('--brand-ink', activeTheme.ink);
      root.style.setProperty('--brand-accent', activeTheme.accent);
    }
  }, [activeTheme, activeFont, customTheme]);

  const toggleDarkMode = () => {
    if (customTheme && customTheme.enabled) {
      setCustomTheme(prev => ({ ...prev, mode: prev.mode === 'light' ? 'dark' : 'light' }));
    } else {
      const isCurrentlyDark = activeTheme.isDark;
      const newThemeId = isCurrentlyDark ? 'swiss' : 'midnight';
      setCurrentThemeId(newThemeId);
    }
  };

  // Current practice configuration
  const [testConfig, setTestConfig] = useState<TestConfig>({
    mode: 'time',
    duration: 30,
    zenType: null,
    uspMode: 'none',
    customText: null,
    customName: null,
    focusedChars: [],
    focusedWords: [],
    focusLock: false,
  });

  // Uploaded files and custom text
  const [customText, setCustomText] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string | null>(null);

  // Clear current result on route change
  useEffect(() => {
    setCurrentResult(null);
  }, [location.pathname]);

  // Clear statistics
  const handleClearHistory = () => {
    setSessionHistory([]);
    setMissedCharsHistory({});
    setMissedWordsHistory([]);
    saveStatsToStorage([], {}, []);
  };

  // Toggle audio
  const handleToggleMute = () => {
    const nextMuted = toggleMute();
    setIsMuted(nextMuted);
  };

  // Process test completion
  const handleTestComplete = (result: TestResult) => {
    setCurrentResult(result);

    // Update daily progress (duration is in seconds)
    // Actually we need to know how long the user *actually* typed for.
    // We can infer this roughly from the duration config, or datapoints.
    // For simplicity, let's use the duration of the test for time mode, 
    // or estimate based on datapoints. Datapoints has 'second'.
    const typedSeconds = result.datapoints.length > 0 
      ? result.datapoints[result.datapoints.length - 1].second 
      : (result.config.mode === 'time' ? result.config.duration : 0);
      
    setDailyTypedSeconds(prev => prev + typedSeconds);

    // Append to local history
    const updatedHistory = [result, ...sessionHistory].slice(0, 50); // limit to last 50
    setSessionHistory(updatedHistory);

    // Aggregate missed characters
    const updatedMissedChars = { ...missedCharsHistory };
    Object.entries(result.missedChars).forEach(([char, count]) => {
      updatedMissedChars[char] = (updatedMissedChars[char] || 0) + count;
    });
    setMissedCharsHistory(updatedMissedChars);

    // Append missed words
    const updatedMissedWords = [...result.missedWords, ...missedWordsHistory].slice(0, 100); // limit to last 100
    setMissedWordsHistory(updatedMissedWords);

    saveStatsToStorage(updatedHistory, updatedMissedChars, updatedMissedWords);
  };

  // Handle uploaded text files
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const cleaned = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        setCustomText(cleaned);
        setCustomFileName(file.name);
        
        // Load custom config instantly
        setTestConfig((prev) => ({
          ...prev,
          mode: 'custom',
          customText: cleaned,
          customName: file.name,
          focusedChars: [],
          focusedWords: [],
        }));
        setCurrentResult(null); // clear past result to start typing
      }
    };
    reader.readAsText(file);
  };

  // Create customized weakness drill
  const handleStartFocusedPractice = (chars: string[], words: string[]) => {
    setTestConfig({
      mode: chars.length > 0 ? 'custom' : 'custom',
      duration: 30,
      zenType: null,
      uspMode: 'none',
      customText: chars.length > 0 ? null : null, // generated dynamic text triggers in typing area
      customName: chars.length > 0 ? 'Targeted Letter Drill' : 'Targeted Spelling Drill',
      focusedChars: chars,
      focusedWords: words, focusLock: false
    });
    
    setCurrentResult(null);
    navigate('/');
  };

  // Quick setup options
  const changeDuration = (d: TestDuration) => {
    setTestConfig((prev) => ({
      ...prev,
      mode: 'time',
      duration: d,
      zenType: null,
      focusedChars: [],
      focusedWords: [],
    }));
    setCurrentResult(null);
  };

  const changeZenType = (z: ZenModeType) => {
    setTestConfig((prev) => ({
      ...prev,
      mode: 'zen',
      zenType: z,
      focusedChars: [],
      focusedWords: [],
    }));
    setCurrentResult(null);
  };

  const changeUspMode = (mode: 'none' | 'reveal' | 'flash') => {
    setTestConfig((prev) => ({
      ...prev,
      uspMode: mode,
    }));
  };

  const toggleFocusLock = () => {
    setTestConfig((prev) => ({
      ...prev,
      focusLock: !prev.focusLock,
    }));
  };

  const dailyGoalProgress = Math.min(100, Math.round((dailyTypedSeconds / (dailyGoalMinutes * 60)) * 100));
  const dashArray = 2 * Math.PI * 14;
  const dashOffset = dashArray - (dashArray * dailyGoalProgress) / 100;

  return (
    <div
      className="min-h-screen flex flex-col font-sans selection:bg-brand-accent selection:text-brand-bg"
    >
      
      {/* Main Top Navigation Header */}
      <header className="border-b-2 border-brand-ink bg-brand-bg/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-0 flex flex-col gap-4">
          
          {/* Top Row: Logo & Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Logo & Slogan */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleDarkMode}
                  className="relative inline-flex items-center w-12 h-6 rounded-full transition-colors focus:outline-none border-2 border-brand-ink overflow-hidden shrink-0"
                  style={{ backgroundColor: activeTheme.isDark || (customTheme?.enabled && customTheme.mode === 'dark') ? '#1B1B1B' : '#F8F7F4' }}
                  title="Toggle Dark/Light Mode"
                >
                  <span
                    className={`absolute flex items-center justify-center w-5 h-5 transition-transform duration-300 transform rounded-full bg-brand-accent ${
                      activeTheme.isDark || (customTheme?.enabled && customTheme.mode === 'dark') ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  >
                    {activeTheme.isDark || (customTheme?.enabled && customTheme.mode === 'dark') ? (
                      <Moon className="w-3 h-3 text-white" />
                    ) : (
                      <Sun className="w-3 h-3 text-white" />
                    )}
                  </span>
                </button>
                <h1 className="text-2xl font-bold font-mono tracking-tight uppercase leading-none text-brand-ink flex items-center gap-2">
                  <Keyboard className="w-7 h-7 stroke-[2.5]" />
                  Minimalist Typing
                </h1>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="font-mono text-[10px] text-brand-ink/60 uppercase tracking-widest">Distraction-Free Speed and Focus Trainer</div>
                
                {/* User Info & Controls */}
                <div className="flex items-center gap-4 pl-4 ml-4 border-l-2 border-brand-ink">
                  <div className="flex items-center">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-brand-ink bg-brand-ink/5 px-2 py-1 border-2 border-transparent hover:border-brand-ink transition-colors cursor-default">
                      {user ? user.username : 'Guest Session'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {user && (
                      <button 
                        onClick={() => exportUserData(user)}
                        className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-brand-ink/70 hover:text-brand-accent transition-colors"
                        title="Export Data"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline-block">Export</span>
                      </button>
                    )}
                    <button 
                      onClick={() => onLogout('select')}
                      className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-brand-ink/70 hover:text-brand-accent transition-colors"
                      title="Switch Profile"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline-block">Profiles</span>
                    </button>
                    <button 
                      onClick={() => onLogout('select')}
                      className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-brand-ink/70 hover:text-brand-accent transition-colors ml-2 pl-4 border-l-2 border-brand-ink/20"
                      title="Logout"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline-block">Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Goal & Quick Settings */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 text-brand-ink text-xs">
              
              {/* Daily Goal Progress Ring */}
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-brand-ink/70">
                <div className="relative w-8 h-8 flex items-center justify-center" title={`${dailyGoalProgress}% of ${dailyGoalMinutes}m daily goal`}>
                  <svg className="w-8 h-8 -rotate-90 transform" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-brand-ink/10" />
                    <circle 
                      cx="16" cy="16" r="14" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="3" 
                      strokeLinecap="round"
                      className="text-brand-accent transition-all duration-1000 ease-out"
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                    />
                  </svg>
                  <span className="absolute text-[8px] font-bold text-brand-ink">{dailyGoalProgress}%</span>
                </div>
                <div className="flex flex-col">
                  <span>Daily Goal</span>
                  <span className="text-brand-accent">{Math.floor(dailyTypedSeconds / 60)}m / {dailyGoalMinutes}m</span>
                </div>
              </div>

              <div className="w-px h-6 bg-brand-ink/20 hidden sm:block"></div>

              {/* Audio Toggle */}
              <button
                onClick={handleToggleMute}
                className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] uppercase border border-brand-ink bg-brand-bg/50 hover:bg-brand-ink hover:text-brand-bg transition duration-150"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-brand-accent" /> : <Volume2 className="w-3.5 h-3.5 text-brand-accent" />}
              </button>
            </div>
          </div>

          {/* Bottom Row: Navigation Tabs */}
          <nav className="flex items-center justify-center md:justify-start gap-2 md:gap-8 overflow-x-auto">
            <NavLink
              to="/"
              className={({ isActive }) => `font-mono text-sm uppercase tracking-wider py-3 px-2 border-b-[3px] transition-all whitespace-nowrap ${
                isActive
                  ? 'border-brand-accent text-brand-accent font-bold'
                  : 'border-transparent text-brand-ink/60 hover:text-brand-ink'
              }`}
            >
              Practice Arena
            </NavLink>
            <NavLink
              to="/game"
              className={({ isActive }) => `font-mono text-sm uppercase tracking-wider py-3 px-2 border-b-[3px] transition-all whitespace-nowrap ${
                isActive
                  ? 'border-brand-accent text-brand-accent font-bold'
                  : 'border-transparent text-brand-ink/60 hover:text-brand-ink'
              }`}
            >
              Balloon Game
            </NavLink>
            <NavLink
              to="/weakness"
              className={({ isActive }) => `font-mono text-sm uppercase tracking-wider py-3 px-2 border-b-[3px] transition-all whitespace-nowrap ${
                isActive
                  ? 'border-brand-accent text-brand-accent font-bold'
                  : 'border-transparent text-brand-ink/60 hover:text-brand-ink'
              }`}
            >
              Weakness Analyzer
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => `font-mono text-sm uppercase tracking-wider py-3 px-2 border-b-[3px] transition-all whitespace-nowrap flex items-center gap-2 md:ml-auto ${
                isActive
                  ? 'border-brand-accent text-brand-accent font-bold'
                  : 'border-transparent text-brand-ink/60 hover:text-brand-ink'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </NavLink>
          </nav>

        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:py-10 flex flex-col gap-8">
        <Routes>
          <Route path="/" element={
            <div className="flex flex-col gap-6 animate-fadeIn" id="practice-arena-view">
              
              {/* Config & File Upload Panel */}
              {!currentResult && (
                <div className="bg-brand-bg border-2 border-brand-ink p-5 flex flex-col lg:flex-row gap-6 justify-between items-stretch lg:items-center" id="typing-config-bar">
                  
                  {/* Mode Selectors */}
                  <div className="flex flex-wrap items-center gap-6">
                    
                    {/* Time Presets */}
                    <div className="flex flex-col gap-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-brand-ink/50">Time Tests</span>
                      <div className="flex bg-brand-bg border border-brand-ink p-0.5 gap-1">
                        {([30, 60, 120, 300, 600] as TestDuration[]).map((d) => (
                          <button
                            key={d}
                            onClick={() => changeDuration(d)}
                            className={`px-3 py-1 font-mono text-[11px] font-bold uppercase transition-all ${
                              testConfig.mode === 'time' && testConfig.duration === d
                                ? 'bg-brand-ink text-brand-bg'
                                : 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-ink/5'
                            }`}
                          >
                            {d === 60 ? '1m' : d === 120 ? '2m' : d === 300 ? '5m' : d === 600 ? '10m' : '30s'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Zen Presets */}
                    <div className="flex flex-col gap-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-brand-ink/50">Zen Mode</span>
                      <div className="flex bg-brand-bg border border-brand-ink p-0.5 gap-1">
                        {(['word', 'sentence', 'story'] as ZenModeType[]).map((z) => (
                          <button
                            key={z || 'none'}
                            onClick={() => changeZenType(z)}
                            className={`px-3 py-1 font-mono text-[11px] font-bold capitalize transition-all ${
                              testConfig.mode === 'zen' && testConfig.zenType === z
                                ? 'bg-brand-ink text-brand-bg'
                                : 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-ink/5'
                            }`}
                          >
                            {z}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Focus Lock Toggle */}
                    <div className="flex flex-col gap-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-brand-ink/50 flex items-center gap-1">
                        Focus Lock
                      </span>
                      <button
                        onClick={toggleFocusLock}
                        className={`px-3 py-1 font-mono text-[11px] font-bold uppercase transition flex items-center gap-1.5 border border-brand-ink ${
                          testConfig.focusLock
                            ? 'bg-brand-ink text-brand-bg'
                            : 'bg-brand-bg text-brand-ink hover:bg-brand-ink/5'
                        }`}
                        title="Greys out non-active text to reduce visual noise"
                      >
                        {testConfig.focusLock ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {testConfig.focusLock ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>

                  {/* Unique USP Revealed / Flash Focus Modes */}
                  <div className="flex flex-col gap-1.5 w-full lg:w-auto">
                    <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-brand-ink/50 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-brand-accent" />
                      Gaze Modes
                    </span>
                    <div className="flex bg-brand-bg border border-brand-ink p-0.5 gap-1">
                      <button
                        onClick={() => changeUspMode('none')}
                        className={`px-3 py-1 font-mono text-[11px] font-bold uppercase transition ${
                          testConfig.uspMode === 'none'
                            ? 'bg-brand-ink text-brand-bg'
                            : 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-ink/5'
                        }`}
                        title="Standard high-contrast practice layout"
                      >
                        Standard
                      </button>
                      <button
                        onClick={() => changeUspMode('reveal')}
                        className={`px-3 py-1 font-mono text-[11px] font-bold uppercase transition flex items-center gap-1.5 ${
                          testConfig.uspMode === 'reveal'
                            ? 'bg-brand-accent text-brand-bg'
                            : 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-ink/5'
                        }`}
                        title="Only reveals current and next word to lock gaze focus"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Next Reveal
                      </button>
                      <button
                        onClick={() => changeUspMode('flash')}
                        className={`px-3 py-1 font-mono text-[11px] font-bold uppercase transition flex items-center gap-1.5 ${
                          testConfig.uspMode === 'flash'
                            ? 'bg-brand-accent text-brand-bg'
                            : 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-ink/5'
                        }`}
                        title="Flashes word for 350ms, then hides it. Type purely from memory!"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Memory Flash
                      </button>
                    </div>
                  </div>

                  {/* Text File Upload Component */}
                  <div className="flex flex-col gap-1.5 w-full lg:w-auto">
                    <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-brand-ink/50">Upload Custom Lesson</span>
                    <div className="flex items-center bg-brand-bg border border-brand-ink p-1.5 rounded-none max-w-xs relative hover:bg-brand-ink/5 transition-colors">
                      <label className="flex items-center gap-2 cursor-pointer w-full text-xs font-bold font-mono uppercase text-brand-ink/80 hover:text-brand-ink">
                        <Upload className="w-3.5 h-3.5 text-brand-accent" />
                        <span className="truncate max-w-[140px]">
                          {testConfig.mode === 'custom' && customFileName
                            ? customFileName
                            : 'Upload .txt'}
                        </span>
                        <input
                          type="file"
                          accept=".txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                </div>
              )}

              {/* Main Interactive Screen */}
              {!currentResult ? (
                <TypingArea
                  config={testConfig}
                  onTestComplete={handleTestComplete}
                  isMuted={isMuted}
                  onToggleMute={handleToggleMute}
                  cursorStyle={cursorStyle}
                />
              ) : (
                <StatsPanel
                  result={currentResult}
                  onRestart={() => setCurrentResult(null)}
                  onStartFocusedPractice={handleStartFocusedPractice}
                  onClose={() => setCurrentResult(null)}
                />
              )}

              {/* Quick Context Tip on USPs */}
              {!currentResult && (
                <div className="border border-brand-ink/30 bg-brand-bg/50 p-4 flex gap-3 text-brand-ink/70 text-xs leading-relaxed max-w-4xl mx-auto">
                  <HelpCircle className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-mono font-bold text-brand-ink uppercase tracking-wider">Cognitive Typing Modes</h4>
                    <p className="mt-1 font-sans">
                      Activate <strong className="text-brand-accent font-bold">Memory Flash</strong> to display the next word for just 350ms, challenging your visual cortex to type purely from memory—dramatically enhancing typing muscle speed. <strong className="text-brand-accent font-bold">Next Reveal</strong> restricts sight to the current and immediate next words to eliminate eye wander.
                    </p>
                  </div>
                </div>
              )}

              {/* Session Stats History Log */}
              {sessionHistory.length > 0 && !currentResult && (
                <div className="flex flex-col gap-6 mt-8" id="history-and-analytics-section">
                  <WpmTrendChart sessionHistory={sessionHistory} />

                  <div className="bg-brand-bg border-2 border-brand-ink p-6" id="session-history-log">
                    <div className="flex items-center gap-2 mb-4 border-b-2 border-brand-ink pb-3 justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-brand-accent" />
                        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-brand-ink">Practice Session History</h3>
                      </div>
                      <span className="text-xs text-brand-ink/60 font-mono">Last {sessionHistory.length} attempts</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sessionHistory.slice(0, 6).map((item, idx) => (
                        <div
                          key={item.id}
                          className="bg-brand-bg border border-brand-ink p-4 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-brand-ink/50 font-mono">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="bg-brand-ink text-brand-bg px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                              {item.config.mode}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between">
                            <div>
                              <span className="text-2xl font-black font-sans text-brand-accent">{Math.round(item.wpm)}</span>
                              <span className="text-brand-ink/50 text-[10px] ml-1 uppercase font-mono">WPM</span>
                            </div>
                            <div>
                              <span className="text-sm font-bold text-brand-ink">{Math.round(item.accuracy)}%</span>
                              <span className="text-brand-ink/50 text-[10px] ml-1 uppercase font-mono">Acc</span>
                            </div>
                          </div>
                          
                          {Object.keys(item.missedChars).length > 0 && (
                            <div className="mt-3 border-t border-brand-ink/20 pt-2 flex items-center gap-1.5 text-[10px] text-brand-ink/60">
                              <span className="font-mono">Missed keys:</span>
                              <span className="font-mono text-brand-accent font-semibold uppercase">
                                {Object.keys(item.missedChars).slice(0, 4).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          } />
          <Route path="/game" element={
            <div className="animate-fadeIn" id="balloon-popper-view">
              <BalloonPopper onBack={() => navigate('/')} />
            </div>
          } />
          <Route path="/weakness" element={
            <div className="animate-fadeIn" id="weakness-view">
              <FocusedImprovement
                missedCharsHistory={missedCharsHistory}
                missedWordsHistory={missedWordsHistory}
                onStartFocusedPractice={handleStartFocusedPractice}
                onClearHistory={handleClearHistory}
              />
            </div>
          } />
          <Route path="/settings" element={
            <div className="animate-fadeIn">
              <SettingsPanel
                currentThemeId={currentThemeId}
                onThemeChange={setCurrentThemeId}
                customTheme={customTheme}
                onCustomThemeChange={setCustomTheme}
                currentFontId={currentFontId}
                onFontChange={setCurrentFontId}
                cursorStyle={cursorStyle}
                onCursorChange={setCursorStyle}
                dailyGoalMinutes={dailyGoalMinutes}
                onDailyGoalChange={setDailyGoalMinutes}
              />
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Decorative clean footer */}
      <footer className="border-t-2 border-brand-ink py-6 text-brand-ink/60 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-wider">© 2026 Minimal Typing Practice App. Local State Storage Engaged.</p>
          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider">
            <span className="hover:text-brand-ink transition cursor-help">Local Storage Active</span>
            <span className="text-brand-ink/30">|</span>
            <span className="hover:text-brand-ink transition cursor-help">Web Audio Synthesizer Ready</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [payload, setPayload] = useState<UserDataPayload | null>(null);
  const [dek, setDek] = useState<CryptoKey | null>(null);
  const [isGuestSession, setIsGuestSession] = useState(false);
  const [authMode, setAuthMode] = useState<'select' | 'create'>('select');

  const handleLogin = (u: UserProfile | null, p: UserDataPayload | null, d: CryptoKey | null) => {
    if (u === null && p === null && d === null) {
      setIsGuestSession(true);
    } else {
      setUser(u);
      setPayload(p);
      setDek(d);
      setIsGuestSession(false);
    }
  };

  const handleLogout = (mode: 'select' | 'create' = 'select') => {
    setUser(null);
    setPayload(null);
    setDek(null);
    setIsGuestSession(false);
    setAuthMode(mode);
  };

  if (!isGuestSession && user === null && payload === null && dek === null) {
    return <AuthScreen onLogin={handleLogin} initialMode={authMode} />;
  }

  return (
    <Router>
      <AppContent user={user} initialPayload={payload} dek={dek} onLogout={handleLogout} />
    </Router>
  );
}
