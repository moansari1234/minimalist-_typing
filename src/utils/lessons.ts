export const COMMON_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", 
  "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", 
  "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", 
  "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", 
  "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", 
  "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", 
  "give", "day", "most", "us", "water", "sound", "place", "little", "sound", "sentence", "great", "through", "line", 
  "right", "mean", "old", "any", "same", "tell", "boy", "follow", "came", "show", "also", "around", "form", "three", 
  "small", "set", "end", "does", "another", "well", "large", "must", "big", "even", "such", "because", "turn", "here", 
  "why", "ask", "went", "men", "read", "need", "land", "different", "home", "us", "move", "try", "kind", "hand", "picture", 
  "again", "change", "off", "play", "spell", "air", "away", "animal", "house", "point", "page", "letter", "mother", "answer", 
  "found", "study", "still", "learn", "should", "america", "world", "high", "every", "near", "add", "food", "between", 
  "own", "below", "country", "plant", "last", "school", "father", "keep", "tree", "never", "start", "city", "earth", "eyes", 
  "light", "thought", "head", "under", "story", "saw", "left", "don't", "few", "while", "along", "might", "close", "something", 
  "seem", "next", "hard", "open", "example", "begin", "life", "always", "those", "both", "paper", "together", "got", "group", 
  "often", "run", "important", "until", "children", "side", "feet", "car", "mile", "night", "walk", "white", "sea", "began", 
  "grow", "took", "river", "four", "carry", "state", "once", "book", "hear", "stop", "without", "second", "late", "miss"
];

export const SENTENCES = [
  "The quick brown fox jumps over the lazy dog.",
  "Type carefully and build consistency before you try to type at maximum speed.",
  "Real elegance in software lies in simplicity and thoughtful user experience design.",
  "Focus entirely on the current character, and let your fingers find their natural rhythm.",
  "Every line of clean code you write today saves someone else hours of debugging tomorrow.",
  "Consistency is the hallmark of progress; typing every day builds immense muscle memory.",
  "Technology is best when it brings people together and solves genuine human problems.",
  "To understand recursion, you must first understand recursion and trace its beauty.",
  "The beautiful thing about learning is that nobody can take it away from you.",
  "A journey of a thousand miles begins with a single step and a clear sense of purpose.",
  "Your attitude, not your aptitude, will determine your altitude in this competitive world.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts."
];

export const STORIES = [
  "Deep in the heart of the digital valley, an elegant algorithm was running. It processed streams of keystrokes from around the world, turning simple letters into high-speed creative output. Every typist contributed to this global symphony of mechanical keys, membrane pads, and virtual screens. Through these signals, humanity shared knowledge, expressed art, and solved the world's greatest puzzles, one letter at a time.",
  "In the early days of computing, mechanical typewriters ruled the office desk. Each key pressed would swing a metal arm, striking an inked ribbon against a sheet of paper. If you typed too fast, the metal arms would collide and jam, forcing you to manually separate them. To solve this, the QWERTY keyboard layout was created, separating common letter pairs to slow down typing speed and prevent jamming. Decades later, we still use this layout.",
  "The art of touch typing is like playing a musical instrument. At first, you look at your fingers and hunt for each key, which feels clumsy and slow. But as the hours of practice accumulate, a quiet miracle occurs in your motor cortex. Your brain starts thinking of complete words, and your fingers fly to their destinations without conscious effort. You no longer see keys; you see language flowing onto the screen.",
  "Imagine a silent library where the only sound is the rhythmic, satisfying tap-clack of a mechanical keyboard with brown tactile switches. Each keypress feels like a tiny, crisp snap, followed by a soft bottom-out. The typist is in a state of pure flow, completely absorbed in the screen. Outside, rain patters gently against the glass, but inside, thoughts are turning into software as fast as fingers can fly."
];

// Generate text focused on specific characters
export function generateFocusedText(chars: string[], numWords: number = 25): string {
  const filteredWords = COMMON_WORDS.filter(word => 
    word.split('').some(c => chars.includes(c.toLowerCase()))
  );
  
  const wordPool = filteredWords.length >= 10 ? filteredWords : COMMON_WORDS;
  const result: string[] = [];
  for (let i = 0; i < numWords; i++) {
    const randomIndex = Math.floor(Math.random() * wordPool.length);
    result.push(wordPool[randomIndex]);
  }
  return result.join(' ');
}

// Generate standard word list
export function generateWordList(numWords: number = 60): string {
  const result: string[] = [];
  for (let i = 0; i < numWords; i++) {
    const randomIndex = Math.floor(Math.random() * COMMON_WORDS.length);
    result.push(COMMON_WORDS[randomIndex]);
  }
  return result.join(' ');
}
