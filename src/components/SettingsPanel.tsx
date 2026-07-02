import React from 'react';
import { THEMES, FONTS, CursorStyle } from '../types';
import { Settings, Palette, Type, MousePointer2, Target, CheckCircle2, SlidersHorizontal } from 'lucide-react';

interface CustomThemeState {
  enabled: boolean;
  mode: 'light' | 'dark';
  accentColor: string;
  tintLevel: number;
}

interface SettingsPanelProps {
  currentThemeId: string;
  onThemeChange: (id: string) => void;
  customTheme?: CustomThemeState;
  onCustomThemeChange?: (theme: CustomThemeState) => void;
  currentFontId: string;
  onFontChange: (id: string) => void;
  cursorStyle: CursorStyle;
  onCursorChange: (style: CursorStyle) => void;
  dailyGoalMinutes: number;
  onDailyGoalChange: (minutes: number) => void;
}

export default function SettingsPanel({
  currentThemeId,
  onThemeChange,
  customTheme,
  onCustomThemeChange,
  currentFontId,
  onFontChange,
  cursorStyle,
  onCursorChange,
  dailyGoalMinutes,
  onDailyGoalChange,
}: SettingsPanelProps) {
  const isCustom = customTheme?.enabled || false;

  return (
    <div className="bg-brand-bg border-2 border-brand-ink p-6 max-w-4xl mx-auto w-full animate-fadeIn" id="settings-panel">
      <div className="flex items-center gap-3 mb-8 border-b-2 border-brand-ink pb-4">
        <Settings className="w-6 h-6 text-brand-accent" />
        <h2 className="text-xl font-bold font-mono tracking-tight uppercase text-brand-ink">Preferences</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Visual Settings */}
        <div className="space-y-6">
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-brand-ink/70 border-b border-brand-ink/20 pb-2">Visual</h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs font-bold uppercase flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><Palette className="w-4 h-4 text-brand-accent" /> Theme Engine</span>
                {onCustomThemeChange && customTheme && (
                  <div className="flex border-2 border-brand-ink">
                    <button
                      onClick={() => onCustomThemeChange({ ...customTheme, enabled: false })}
                      className={`px-3 py-1 font-mono text-[10px] font-bold uppercase transition-colors ${!customTheme.enabled ? 'bg-brand-ink text-brand-bg' : 'bg-transparent text-brand-ink'}`}
                    >
                      Preset
                    </button>
                    <button
                      onClick={() => onCustomThemeChange({ ...customTheme, enabled: true })}
                      className={`px-3 py-1 font-mono text-[10px] font-bold uppercase transition-colors ${customTheme.enabled ? 'bg-brand-ink text-brand-bg' : 'bg-transparent text-brand-ink'}`}
                    >
                      Custom
                    </button>
                  </div>
                )}
              </label>

              {!isCustom ? (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => onThemeChange(theme.id)}
                      className={`px-3 py-2 text-left font-mono text-[11px] font-bold uppercase border-2 transition-all ${
                        currentThemeId === theme.id
                          ? 'border-brand-accent bg-brand-accent/10'
                          : 'border-brand-ink/20 hover:border-brand-ink/50 bg-brand-bg/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{theme.name}</span>
                        <span>{theme.isDark ? '🌙' : '☀️'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                customTheme && onCustomThemeChange && (
                  <div className="space-y-4 border-2 border-brand-ink/20 p-4 bg-brand-bg/50 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold uppercase">Mode</span>
                      <div className="flex border-2 border-brand-ink/50">
                        <button
                          onClick={() => onCustomThemeChange({ ...customTheme, mode: 'light' })}
                          className={`px-3 py-1 font-mono text-[10px] font-bold uppercase ${customTheme.mode === 'light' ? 'bg-brand-ink/20' : ''}`}
                        >
                          Light ☀️
                        </button>
                        <button
                          onClick={() => onCustomThemeChange({ ...customTheme, mode: 'dark' })}
                          className={`px-3 py-1 font-mono text-[10px] font-bold uppercase ${customTheme.mode === 'dark' ? 'bg-brand-ink/20' : ''}`}
                        >
                          Dark 🌙
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold uppercase">Accent Color</span>
                      <input
                        type="color"
                        value={customTheme.accentColor}
                        onChange={(e) => onCustomThemeChange({ ...customTheme, accentColor: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-brand-ink/10">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold uppercase flex items-center gap-1">
                          <SlidersHorizontal className="w-3 h-3" /> Tint Level
                        </span>
                        <span className="font-mono text-[10px]">{customTheme.tintLevel}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={customTheme.tintLevel}
                        onChange={(e) => onCustomThemeChange({ ...customTheme, tintLevel: parseInt(e.target.value) })}
                        className="w-full accent-brand-accent"
                      />
                      <p className="text-[9px] text-brand-ink/60 font-mono uppercase">
                        Adjust how much the accent color blends into the background.
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs font-bold uppercase flex items-center gap-2">
              <Type className="w-4 h-4 text-brand-accent" /> Font
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map((font) => (
                <button
                  key={font.id}
                  onClick={() => onFontChange(font.id)}
                  className={`px-3 py-2 text-left font-mono text-[11px] font-bold uppercase border-2 transition-all ${
                    currentFontId === font.id
                      ? 'border-brand-accent bg-brand-accent/10'
                      : 'border-brand-ink/20 hover:border-brand-ink/50 bg-brand-bg/50'
                  }`}
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor & Goals */}
        <div className="space-y-6">
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-brand-ink/70 border-b border-brand-ink/20 pb-2">Editor & Goals</h3>
          
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs font-bold uppercase flex items-center gap-2">
              <MousePointer2 className="w-4 h-4 text-brand-accent" /> Cursor Style
            </label>
            <div className="flex gap-2">
              {(['bar', 'line', 'underline', 'block'] as CursorStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => onCursorChange(style)}
                  className={`flex-1 px-3 py-2 font-mono text-[11px] font-bold uppercase border-2 transition-all ${
                    cursorStyle === style
                      ? 'border-brand-accent bg-brand-accent/10'
                      : 'border-brand-ink/20 hover:border-brand-ink/50 bg-brand-bg/50'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs font-bold uppercase flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-accent" /> Daily Goal (Minutes)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={dailyGoalMinutes}
                onChange={(e) => onDailyGoalChange(parseInt(e.target.value))}
                className="flex-1 accent-brand-accent"
              />
              <span className="font-mono font-bold text-lg w-12 text-center">{dailyGoalMinutes}m</span>
            </div>
            <p className="text-[10px] text-brand-ink/60 font-mono uppercase mt-1">Set a target for how long you want to practice each day.</p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-brand-ink/20 flex items-center justify-between text-brand-ink/60 font-mono text-[10px] uppercase">
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Changes saved automatically</span>
      </div>
    </div>
  );
}
