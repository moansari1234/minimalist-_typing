# Minimalist Typing ⌨️

A distraction-free speed and focus typing trainer built with React, TypeScript, and Tailwind CSS. 

Minimalist Typing goes beyond standard WPM tests by offering cognitive challenges, weakness analysis, and distraction-free visual modes to genuinely improve your typing accuracy and concentration. It is built with a strict **local-first** and **privacy-focused** architecture—your typing data never leaves your device and is secured with client-side encryption.

## Features ✨

### 🔒 Privacy-First & Local Architecture
* **Local-First Storage**: All your typing history, stats, and custom settings are stored securely on your local device (IndexedDB/localStorage).
* **Client-Side Encryption**: User profiles are protected by 4-digit passkeys. Data is encrypted using the Web Crypto API (AES-GCM) with keys derived via PBKDF2.
* **Multi-Profile Support**: Share the app securely on a single device with isolated, encrypted user profiles.
* **Import/Export**: Export your fully encrypted user profile to a file and import it anywhere to restore your session securely.

### 🎯 Core Typing Modes
* **Time Tests**: 30s, 1m, 2m, 5m, and 10m sprints.
* **Zen Mode**: Relaxed, untimed typing by Word, Sentence, or Story length.
* **Custom Text**: Upload your own `.txt` files to practice on material that matters to you.
* **Focused Improvement**: The app automatically generates custom practice lessons targeting your most frequently missed characters and words.

### 🧠 Cognitive & Focus Tools
* **Focus Lock**: Greys out upcoming text to reduce visual noise and train pure focus on the current word.
* **Gaze Modes**:
  * *Standard*: Traditional typing view.
  * *Next Reveal*: Only reveals the upcoming word once you finish the current one.
  * *Memory Flash*: Briefly flashes the word, then hides it. Forces you to rely on memory and tactile feedback.

### 📊 Analytics & Improvement
* **Weakness Analyzer**: Automatically tracks and catalogs your most frequently missed words and individual characters. Practice specifically on your weak points.
* **Live Stats**: Real-time WPM and Accuracy tracking without visual clutter.
* **Session History**: Detailed logs and interactive WPM trend charts of your recent sessions.
* **Daily Goal Tracking**: Set a daily typing goal (in minutes) and track your progress via the circular progress ring.

### 🎈 Gamification & Visuals
* **Balloon Popper Game**: Type flying letters or words before they float away. A fun way to warm up or practice home-row reflexes.
* **Interactive Exploded Keyboard**: An interactive, SVG-based isometric exploded keyboard visualization greets you on the auth screen.

### 🎨 Customization
* **Dynamic Theme Engine**: Generate custom color palettes using `oklch` color spaces, or choose from built-in themes.
* **Dark/Light Mode**: Easily toggle between dark and light modes, or let the app generate inverted palettes for your custom themes.
* **Typography**: Beautiful monospaced developer fonts like *JetBrains Mono*, *Fira Code*, and *Space Mono*.
* **Cursor Styles**: Pick between Line, Bar, Underline, or Block cursors.

## Tech Stack 🛠️
* **Frontend**: React 18, TypeScript, Vite
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **Charts**: Recharts
* **Cryptography**: Web Crypto API

## Getting Started 🚀

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
