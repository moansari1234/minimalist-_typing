# Minimalist Typing ⌨️

A distraction-free speed and focus trainer built with React, TypeScript, and Tailwind CSS. 

Minimalist Typing goes beyond standard WPM tests by offering cognitive challenges, weakness analysis, and distraction-free visual modes to genuinely improve your typing accuracy and concentration.

## Features ✨

### 🎯 Core Typing Modes
* **Time Tests**: 30s, 1m, 2m, 5m, and 10m sprints.
* **Zen Mode**: Relaxed, untimed typing by Word, Sentence, or Story length.
* **Custom Text**: Upload your own `.txt` files to practice on material that matters to you.

### 🧠 Cognitive & Focus Tools
* **Focus Lock**: Greys out upcoming text to reduce visual noise and train pure focus on the current word.
* **Gaze Modes**:
  * *Standard*: Traditional typing view.
  * *Next Reveal*: Only reveals the upcoming word once you finish the current one.
  * *Memory Flash*: Briefly flashes the word, then hides it. Forces you to rely on memory and tactile feedback.
* **AFK / Sleep Mode**: Automatically detects inactivity and pauses or aborts the test to keep your stats accurate.

### 📊 Analytics & Improvement
* **Weakness Analyzer**: Automatically tracks and catalogs your most frequently missed words and individual characters. Practice specifically on your weak points.
* **Live Stats**: Real-time WPM and Accuracy tracking without visual clutter.
* **Session History**: Detailed logs and trend charts of your recent sessions.
* **Daily Goal Tracking**: Set a daily typing goal (in minutes) and track your progress via the circular progress ring in the header.

### 🎈 Gamification
* **Balloon Popper Game**: Type flying letters or words before they float away. A fun way to warm up or practice home-row reflexes.

### 🎨 Customization
* **Rich Themes**: Choose from multiple Light and Dark themes, including *Swiss Clean*, *Midnight Obsidian*, *Cyber Neon*, and *Deep Space*.
* **Typography**: Beautiful monospaced developer fonts like *JetBrains Mono*, *Fira Code*, and *Space Mono*.
* **Cursor Styles**: Pick between Line, Bar, Underline, or Block cursors.

## Tech Stack 🛠️
* **Frontend**: React 18, TypeScript, Vite
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **Routing**: React Router

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
