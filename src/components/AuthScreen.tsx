import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, UserPlus, LogIn, Upload, Download, Key, AlertTriangle, ArrowLeft, ChevronDown, Users, Sun, Moon } from 'lucide-react';
import { UserProfile, UserDataPayload } from '../types';
import { getLocalUsers, upsertUser, exportAdminData } from '../utils/storage';
import { generateSalt, deriveKeyFromPasskey, generateDEK, encryptDEK, decryptDEK, encryptPayload, decryptPayload } from '../utils/crypto';
import IsometricKeyboard from './IsometricKeyboard';

interface AuthScreenProps {
  onLogin: (user: UserProfile | null, payload: UserDataPayload | null, dek: CryptoKey | null) => void;
  initialMode?: 'select' | 'create';
}

const DEFAULT_PAYLOAD: UserDataPayload = {
  sessionHistory: [],
  missedCharsHistory: {},
  missedWordsHistory: [],
  settings: {
    currentThemeId: 'swiss',
    currentFontId: 'space-mono',
    cursorStyle: 'line',
    dailyGoalMinutes: 15,
    dailyTypedSeconds: 0,
    dailyTypedDate: new Date().toISOString().split('T')[0]
  }
};

export default function AuthScreen({ onLogin, initialMode = 'select' }: AuthScreenProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [mode, setMode] = useState<'select' | 'create' | 'login' | 'admin'>(initialMode);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [username, setUsername] = useState('');
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.setProperty('--brand-bg', '#000000');
      root.style.setProperty('--brand-ink', '#F3F4F6');
      root.style.setProperty('--brand-accent', '#00E5FF');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--brand-bg', '#F8F7F4');
      root.style.setProperty('--brand-ink', '#1B1B1B');
      root.style.setProperty('--brand-accent', '#2563EB');
    }
  }, [isDarkMode]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const loadedUsers = getLocalUsers();
    setUsers(loadedUsers);
  }, [initialMode]);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || passkey.length !== 4 || isNaN(Number(passkey))) {
      setError('Username required, and passkey must be exactly 4 digits.');
      return;
    }
    
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      setError('Profile name already exists.');
      return;
    }

    setLoading(true);
    try {
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API is not supported in this browser environment. Please try using a secure context (HTTPS) or a modern browser.');
      }
      
      const salt = generateSalt();
      const userKEK = await deriveKeyFromPasskey(passkey, salt);
      const dek = await generateDEK();
      
      const { encrypted: encryptedDek, iv: dekIv } = await encryptDEK(dek, userKEK);
      const { encrypted: encryptedPayload, iv: payloadIv } = await encryptPayload(DEFAULT_PAYLOAD, dek);

      const newUser: UserProfile = {
        id: window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now().toString(),
        username,
        salt,
        dek_encrypted_by_user: encryptedDek,
        encrypted_payload: encryptedPayload,
        iv_user_dek: dekIv,
        iv_payload: payloadIv
      };

      upsertUser(newUser);
      onLogin(newUser, DEFAULT_PAYLOAD, dek);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to create profile securely.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (passkey.length !== 4) {
      setError('Passkey must be 4 digits.');
      return;
    }

    setLoading(true);
    try {
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API is not supported in this browser environment.');
      }
      const userKEK = await deriveKeyFromPasskey(passkey, selectedUser.salt);
      const dek = await decryptDEK(selectedUser.dek_encrypted_by_user, selectedUser.iv_user_dek, userKEK);
      const payload = await decryptPayload(selectedUser.encrypted_payload, selectedUser.iv_payload, dek);
      
      upsertUser(selectedUser); // Ensure it's in local DB if imported
      onLogin(selectedUser, payload, dek);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error && err.message.includes('Web Crypto') ? err.message : 'Incorrect passkey or corrupted data. Decryption failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as UserProfile;
        if (!data.username || !data.salt || !data.dek_encrypted_by_user) {
          throw new Error('Invalid file format');
        }
        
        // Upsert into local users so it shows up in the list
        upsertUser(data);
        const all = getLocalUsers();
        setUsers(all);
        setSelectedUser(data);
        setMode('login');
        setError('Profile imported successfully. Please enter your passkey.');
      } catch (err) {
        setError('Failed to import data. Invalid file format.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[var(--brand-bg)] text-[var(--brand-ink)] flex font-sans relative">
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="relative inline-flex items-center w-12 h-6 rounded-full transition-colors focus:outline-none border-2 border-[var(--brand-ink)] overflow-hidden shrink-0"
          style={{ backgroundColor: isDarkMode ? '#1B1B1B' : '#F8F7F4' }}
          title="Toggle Dark/Light Mode"
        >
          <span
            className={`absolute flex items-center justify-center w-5 h-5 transition-transform duration-300 transform rounded-full bg-[var(--brand-accent)] ${
              isDarkMode ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          >
            {isDarkMode ? (
              <Moon className="w-3 h-3 text-white" />
            ) : (
              <Sun className="w-3 h-3 text-white" />
            )}
          </span>
        </button>
      </div>
      <div className="w-full md:w-1/2 lg:w-[35%] flex items-center justify-center p-6 border-r-2 border-[var(--brand-ink)]/10 z-10 bg-[var(--brand-bg)] shadow-2xl">
        <div className="max-w-md w-full border-2 border-[var(--brand-ink)] bg-[var(--brand-bg)] p-6 sm:p-8 relative">
          <div className="text-center mb-8 border-b-2 border-[var(--brand-ink)]/10 pb-8">
          <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Minimalist Typing</h1>
          <p className="opacity-70 mt-3 text-[10px] font-mono uppercase tracking-widest leading-relaxed">
            Practice typing privately. Your data stays on your device.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="">
          {mode === 'select' && (
            <div className="space-y-6">
              {users.length > 0 ? (
                <>
                  <div className="space-y-4">
                    <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[var(--brand-ink)] opacity-80">Continue as</label>
                    <div className="relative">
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full p-4 border-2 border-[var(--brand-ink)] bg-transparent font-mono font-bold uppercase tracking-wider appearance-none cursor-pointer outline-none focus:border-[var(--brand-accent)]"
                      >
                        <option value="" disabled className="hidden">User Name</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.username}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-5 h-5 opacity-50" />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const u = users.find(u => u.id === selectedUserId);
                        if (u) {
                          setSelectedUser(u);
                          setMode('login');
                          setError(null);
                          setPasskey('');
                        }
                      }}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-[var(--brand-accent)] border-2 border-[var(--brand-ink)] text-white font-mono font-bold tracking-widest uppercase hover:opacity-90 transition-opacity group"
                    >
                      Continue
                      <LogIn className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>

                  <div className="pt-6 border-t border-black/10 space-y-3">
                    <button
                      onClick={() => {
                        setMode('create');
                        setError(null);
                        setUsername('');
                        setPasskey('');
                      }}
                      className="w-full flex items-center justify-center gap-2 p-3 border-2 border-[var(--brand-ink)] bg-transparent font-mono text-xs font-bold tracking-widest uppercase hover:bg-[var(--brand-ink)] hover:text-[var(--brand-bg)] transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Create New Profile
                    </button>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 p-3 border-2 border-transparent hover:border-[var(--brand-ink)] text-[var(--brand-ink)] font-mono text-xs font-bold tracking-widest uppercase hover:bg-black/5 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Import Existing Profile
                    </button>

                    <button
                      onClick={() => onLogin(null, null, null)}
                      className="w-full flex items-center justify-center gap-2 p-3 border-2 border-transparent hover:border-[var(--brand-ink)] text-[var(--brand-ink)] font-mono text-sm font-bold tracking-widest uppercase hover:bg-black/5 transition-colors"
                    >
                      <Users className="w-5 h-5" />
                      Guest Login
                    </button>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleImport}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <p className="text-xs opacity-70 leading-relaxed font-mono tracking-widest uppercase">
                      Create a local, encrypted profile to track your progress over time, or jump right in as a guest.
                    </p>
                  </div>
                  
                  <div className="grid gap-4">
                    <button
                      onClick={() => {
                        setMode('create');
                        setError(null);
                        setUsername('');
                        setPasskey('');
                      }}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-[var(--brand-accent)] border-2 border-[var(--brand-ink)] text-white font-mono font-bold tracking-widest uppercase hover:opacity-90 transition-opacity"
                    >
                      <UserPlus className="w-5 h-5" />
                      Create New Profile
                    </button>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-3 p-4 border-2 border-transparent hover:border-[var(--brand-ink)] text-[var(--brand-ink)] font-mono font-bold tracking-widest uppercase hover:bg-black/5 transition-colors"
                    >
                      <Upload className="w-5 h-5 opacity-70" />
                      Import Existing Profile
                    </button>
                    
                    <button
                      onClick={() => onLogin(null, null, null)}
                      className="w-full flex items-center justify-center gap-3 p-4 border-2 border-transparent hover:border-[var(--brand-ink)] text-[var(--brand-ink)] font-mono font-bold tracking-widest uppercase hover:bg-black/5 transition-colors"
                    >
                      <Users className="w-5 h-5 opacity-70" />
                      Guest Login
                    </button>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleImport}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {mode === 'create' && (
            <form onSubmit={handleCreateProfile} className="space-y-6">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest uppercase opacity-60 hover:opacity-100 hover:text-[var(--brand-accent)] transition-colors mb-2"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <h2 className="text-sm font-bold font-mono tracking-widest uppercase text-[var(--brand-ink)]">Create Profile</h2>
              
              <div>
                <label className="block text-[10px] font-mono font-bold tracking-widest uppercase mb-2 opacity-70">Profile Name</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="E.G. ALEX"
                  className="w-full px-4 py-3 bg-transparent border-2 border-[var(--brand-ink)] focus:border-[var(--brand-accent)] outline-none font-mono tracking-widest uppercase"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-mono font-bold tracking-widest uppercase mb-2 opacity-70">4-Digit Passkey</label>
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  value={passkey}
                  onChange={e => setPasskey(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-3 bg-transparent border-2 border-[var(--brand-ink)] focus:border-[var(--brand-accent)] outline-none text-center tracking-[1em] font-mono text-xl"
                />
                <p className="text-[10px] font-mono uppercase tracking-widest opacity-60 mt-3 leading-relaxed">
                  Important: If you forget this passkey, your data cannot be recovered.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 flex items-center justify-center gap-2 p-4 bg-[var(--brand-accent)] border-2 border-[var(--brand-ink)] text-white font-mono font-bold tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Securing...' : 'Create & Login'}
              </button>
            </form>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest uppercase opacity-60 hover:opacity-100 hover:text-[var(--brand-accent)] transition-colors mb-2"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <div className="text-center mb-6 border-b-2 border-black/10 pb-6">
                <div className="w-16 h-16 border-2 border-[var(--brand-ink)] flex items-center justify-center mx-auto mb-4 bg-black/5">
                  <Key className="w-6 h-6 opacity-60" />
                </div>
                <h2 className="text-sm font-bold font-mono tracking-widest uppercase">Welcome back, {selectedUser?.username}</h2>
                <p className="opacity-60 text-[10px] font-mono tracking-widest uppercase mt-3">Enter your passkey to decrypt your data.</p>
              </div>
              
              <div>
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  value={passkey}
                  onChange={e => setPasskey(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-3 bg-transparent border-2 border-[var(--brand-ink)] focus:border-[var(--brand-accent)] outline-none text-center tracking-[1em] font-mono text-2xl"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 p-4 bg-[var(--brand-accent)] border-2 border-[var(--brand-ink)] text-white font-mono font-bold tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Decrypting...' : 'Unlock Profile'}
              </button>
            </form>
          )}

          {mode === 'admin' && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest uppercase opacity-60 hover:opacity-100 hover:text-[var(--brand-accent)] transition-colors mb-2"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <div className="text-center mb-6 border-b-2 border-black/10 pb-6">
                <div className="w-16 h-16 border-2 border-[var(--brand-ink)] flex items-center justify-center mx-auto mb-4 text-[var(--brand-ink)] bg-black/5">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-sm font-bold font-mono tracking-widest uppercase">Admin Master Export</h2>
                <p className="opacity-70 text-[10px] font-mono tracking-widest uppercase mt-3 leading-relaxed text-left">
                  Create a master backup of all local encrypted user profiles. 
                  This export contains zero-knowledge data. The admin cannot decrypt or read the contents without the users' original passkeys.
                </p>
              </div>

              <button
                onClick={() => {
                  exportAdminData();
                  setError('Master file exported successfully.');
                }}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-bg)] font-mono font-bold tracking-widest uppercase hover:bg-black/80 transition-colors"
              >
                <Download className="w-5 h-5" />
                Export Encrypted Master Archive
              </button>
            </div>
          )}
        </div>

        {/* Global Footer (Privacy & Secondary Actions) */}
        <div className="mt-8 pt-6 border-t-2 border-black/10 flex flex-col gap-5">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setMode('admin')}
              className="text-[10px] font-mono font-bold tracking-widest uppercase opacity-60 hover:opacity-100 hover:text-[var(--brand-accent)] transition-colors"
            >
              Admin Tools
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest opacity-40">
            <ShieldCheck className="w-3 h-3" />
            <span>✓ Data never leaves your device</span>
          </div>
        </div>
      </div>
      </div>
      <div className="hidden md:flex md:w-1/2 lg:w-[65%] bg-[var(--brand-bg)] items-center justify-center">
        <IsometricKeyboard />
      </div>
    </div>
  );
}

