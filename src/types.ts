export type TestDuration = 30 | 60 | 120 | 300 | 600;
export type ZenModeType = 'word' | 'sentence' | 'story' | null;
export type CursorStyle = 'bar' | 'line' | 'underline' | 'block';

export interface TestConfig {
  mode: 'time' | 'zen' | 'custom';
  duration: TestDuration; // in seconds
  zenType: ZenModeType;
  uspMode: 'none' | 'reveal' | 'flash';
  customText: string | null;
  customName: string | null;
  focusedChars: string[];
  focusedWords: string[];
  focusLock: boolean;
}

export interface WpmDatapoint {
  second: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
}

export interface TestResult {
  id: string;
  timestamp: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  missedWords: string[];
  missedChars: Record<string, number>; // char -> count
  datapoints: WpmDatapoint[];
  config: TestConfig;
}

export interface Balloon {
  id: string;
  text: string;
  x: number; // percentage from left, e.g. 10 to 90
  y: number; // percentage from bottom, e.g. 0 to 100
  speed: number; // speed of upward motion
  color: string;
}

export type GameDifficulty = 'easy' | 'normal' | 'hard';
export type GameMode = 'letter' | 'word';

export interface ColorTheme {
  id: string;
  name: string;
  bg: string;
  ink: string;
  accent: string;
  isDark: boolean;
}

export interface FontConfig {
  id: string;
  name: string;
  value: string;
}

export const THEMES: ColorTheme[] = [
  { id: 'swiss', name: 'Swiss Clean', bg: '#F8F7F4', ink: '#1B1B1B', accent: '#2563EB', isDark: false },
  { id: 'cream', name: 'Warm Cream', bg: '#FDFBF7', ink: '#3E2723', accent: '#D97706', isDark: false },
  { id: 'mint', name: 'Serene Mint', bg: '#F1F8F6', ink: '#1A3038', accent: '#00897B', isDark: false },
  { id: 'midnight', name: 'Midnight Obsidian', bg: '#000000', ink: '#F3F4F6', accent: '#00E5FF', isDark: true },
  { id: 'cyber', name: 'Cyber Neon', bg: '#000000', ink: '#E2E8F0', accent: '#B026FF', isDark: true },
  { id: 'frost', name: 'Nordic Frost', bg: '#000000', ink: '#F1F5F9', accent: '#39FF14', isDark: true },
  { id: 'monokai', name: 'Monokai Pro', bg: '#000000', ink: '#FCFCFA', accent: '#FFEA00', isDark: true },
  { id: 'deepspace', name: 'Deep Space', bg: '#000000', ink: '#E2E8F0', accent: '#F000FF', isDark: true },
];

export interface UserDataPayload {
  sessionHistory: TestResult[];
  missedCharsHistory: Record<string, number>;
  missedWordsHistory: string[];
  settings: {
    currentThemeId: string;
    customTheme?: {
      enabled: boolean;
      mode: "light" | "dark";
      accentColor: string;
      tintLevel: number;
    };
    currentFontId: string;
    cursorStyle: CursorStyle;
    dailyGoalMinutes: number;
    dailyTypedSeconds: number;
    dailyTypedDate: string;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  salt: string; // For deriving User KEK
  dek_encrypted_by_user: string; // The DEK encrypted by User KEK
  encrypted_payload: string; // The UserDataPayload encrypted by DEK
  iv_user_dek: string; // IV used when encrypting the DEK with KEK
  iv_payload: string; // IV used when encrypting payload with DEK
}

export interface AdminMasterFile {
  export_date: string;
  users: UserProfile[];
}

export const FONTS: FontConfig[] = [
  { id: 'space-mono', name: 'Space Mono', value: '"Space Mono", monospace' },
  { id: 'jetbrains-mono', name: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { id: 'fira-code', name: 'Fira Code', value: '"Fira Code", monospace' },
  { id: 'inter', name: 'Inter Sans', value: '"Inter", sans-serif' },
  { id: 'playfair', name: 'Playfair Serif', value: '"Playfair Display", serif' },
];

