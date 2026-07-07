let exerciseState = {
  type: null,
  words: [],
  currentIndex: 0,
  score: 0,
  total: 0,
  correct: 0,
  answers: [],
  startTime: null,
  timerInterval: null,
  elapsed: 0,
};

const EXERCISE_TYPES = [
  { id: 'multiple-choice', name: 'Multiple Choice', icon: '✅', desc: 'Pick the correct answer' },
  { id: 'flashcards', name: 'Flashcards', icon: '🃏', desc: 'Swipe through words' },
  { id: 'match-pairs', name: 'Match Pairs', icon: '🔗', desc: 'Match words to definitions' },
  { id: 'fill-blank', name: 'Fill in the Blank', icon: '✍️', desc: 'Type the missing word' },
  { id: 'spelling', name: 'Spelling Challenge', icon: '🔤', desc: 'Hear and spell the word' },
  { id: 'sentence-builder', name: 'Sentence Builder', icon: '📝', desc: 'Arrange words into a sentence' },
  { id: 'sorting', name: 'Word Sorting', icon: '📋', desc: 'Sort words into categories' },
  { id: 'definition-match', name: 'Definition Match', icon: '📖', desc: 'Match words to definitions' },
  { id: 'image-match', name: 'Image Match', icon: '🖼️', desc: 'Match words to images' },
  { id: 'situation-match', name: 'Situation Match', icon: '🎭', desc: 'Choose words for real-life situations' },
];

function startExercise(type, words, categoryId) {
  exerciseState = {
    type,
    words: shuffleArray([...words]),
    currentIndex: 0,
    score: 0,
    total: words.length,
    correct: 0,
    answers: [],
    startTime: Date.now(),
    timerInterval: null,
    elapsed: 0,
    categoryId,
  };
  return exerciseState;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getRandomOptions(correctWord, allWords, count = 4) {
  const others = allWords.filter(w => w.word !== correctWord.word);
  const shuffled = shuffleArray([...others]);
  const options = shuffled.slice(0, count - 1).map(w => w.word);
  options.push(correctWord.word);
  return shuffleArray(options);
}

function buildMultipleChoice(words, allWords) {
  return words.map(w => ({
    type: 'multiple-choice',
    word: w.word,
    question: `What does "${w.word}" mean?`,
    options: getRandomOptions(w, allWords.length > 10 ? allWords : words, 4),
    correctAnswer: w.word,
    definition: w.definition,
    points: 10,
  }));
}

function buildFillBlank(words) {
  return words.map(w => ({
    type: 'fill-blank',
    sentence: w.example.replace(new RegExp(w.word, 'gi'), '___'),
    originalSentence: w.example,
    answer: w.word.toLowerCase(),
    hint: w.definition,
    points: 15,
  }));
}

function buildDefinitionMatch(words) {
  const pairs = words.slice(0, 6).map(w => ({
    word: w.word,
    definition: w.definition,
  }));
  return [{
    type: 'definition-match',
    pairs,
    points: 20,
  }];
}

function buildSentenceBuilder(words) {
  const valid = words.filter(w => w.example && w.example.split(' ').length >= 3 && w.example.split(' ').length <= 7);
  return valid.slice(0, 5).map(w => {
    const sentence = w.example.replace(/[.!?]/g, '');
    const parts = shuffleArray(sentence.split(' '));
    return {
      type: 'sentence-builder',
      parts,
      answer: sentence,
      word: w.word,
      points: 20,
    };
  });
}

function buildSituationMatch(words) {
  const situations = [
    { situation: 'You meet someone for the first time. What do you say?', options: ['Goodbye', 'Nice to meet you', 'See you later', 'I am sleepy'], answer: 'Nice to meet you' },
    { situation: 'You step on someone\'s foot. What do you say?', options: ['Thank you', 'Sorry', 'Good job', 'Hurry up'], answer: 'Sorry' },
  ];
  return situations.map(s => ({
    type: 'situation-match',
    situation: s.situation,
    options: s.options,
    answer: s.answer,
    points: 25,
  }));
}

function buildSpellingChallenge(words) {
  return words.slice(0, 8).map(w => ({
    type: 'spelling',
    word: w.word,
    definition: w.definition,
    hint: w.word.charAt(0) + '_'.repeat(w.word.length - 1),
    points: 20,
  }));
}

function buildPronunciationChallenge(words) {
  return words.slice(0, 8).map(w => ({
    type: 'pronunciation',
    word: w.word,
    phonetic: w.phonetic || w.phonetics || '',
    definition: w.definition,
    example: w.example,
    points: 20,
  }));
}

function buildExerciseQuestions(type, words, allWords) {
  switch (type) {
    case 'multiple-choice': return buildMultipleChoice(words, allWords);
    case 'fill-blank': return buildFillBlank(words);
    case 'flashcards': return words.map(w => ({ type: 'flashcard', ...w, points: 5 }));
    case 'definition-match': return buildDefinitionMatch(words);
    case 'sentence-builder': return buildSentenceBuilder(words);
    case 'situation-match': return buildSituationMatch(words);
    case 'spelling': return buildSpellingChallenge(words);
    case 'pronunciation': return buildPronunciationChallenge(words);
    default: return words.map(w => ({ type: 'multiple-choice', word: w.word, question: `What does "${w.word}" mean?`, options: getRandomOptions(w, allWords), correctAnswer: w.word, definition: w.definition, points: 10 }));
  }
}

function getExerciseProgress() {
  if (!exerciseState.total) return 0;
  return Math.round((exerciseState.currentIndex / exerciseState.total) * 100);
}

function getElapsedTime() {
  return Math.floor((Date.now() - exerciseState.startTime) / 1000);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
