let currentQuiz = null;

const QUIZ_TEMPLATES = {
  generate(category, wordCount) {
    const questions = category.quizQuestions || [];
    const words = category.words || [];
    const count = Math.min(wordCount || words.length, 25);
    const targetCount = Math.max(10, Math.min(count, 25));

    let quizQuestions = [];

    const mcqWords = shuffleArray(words.filter(w => w.definition)).slice(0, Math.ceil(targetCount * 0.25));
    mcqWords.forEach(w => {
      const otherWords = words.filter(x => x.word !== w.word);
      const wrongOptions = shuffleArray(otherWords).slice(0, 3).map(x => x.word);
      while (wrongOptions.length < 3) wrongOptions.push('unknown');
      const options = shuffleArray([w.word, ...wrongOptions]);
      quizQuestions.push({
        type: 'mcq',
        question: `What does "${w.word}" mean?`,
        options: options.map(o => o === w.word ? w.definition : o),
        correctIndex: options.indexOf(w.word),
        points: 10,
      });
    });

    const fillWords = shuffleArray(words.filter(w => w.example)).slice(0, Math.ceil(targetCount * 0.2));
    fillWords.forEach(w => {
      const blanked = w.example.replace(new RegExp(`\\b${w.word}\\b`, 'gi'), '___');
      quizQuestions.push({
        type: 'fill',
        question: blanked,
        answer: w.word.toLowerCase(),
        hint: w.definition,
        points: 15,
      });
    });

    const matchWords = shuffleArray(words).slice(0, Math.min(6, Math.ceil(targetCount * 0.15)));
    if (matchWords.length >= 4) {
      quizQuestions.push({
        type: 'match',
        question: 'Match each word to its definition',
        pairs: matchWords.map(w => ({ word: w.word, definition: w.definition })),
        points: 25,
      });
    }

    const situationQs = buildSituationMatch(words);
    if (situationQs.length) {
      quizQuestions.push(...situationQs.slice(0, Math.max(1, Math.ceil(targetCount * 0.1))));
    }

    const spellingWs = shuffleArray(words).slice(0, Math.ceil(targetCount * 0.15));
    spellingWs.forEach(w => {
      quizQuestions.push({
        type: 'spelling',
        question: `Spell the word that means: "${w.definition}"`,
        answer: w.word.toLowerCase(),
        hint: w.word.charAt(0),
        points: 20,
      });
    });

    const sentenceWs = words.filter(w => w.example && w.example.split(' ').length >= 4).slice(0, Math.ceil(targetCount * 0.1));
    sentenceWs.slice(0, 2).forEach(w => {
      const clean = w.example.replace(/[.!?]/g, '');
      const parts = shuffleArray(clean.split(' '));
      quizQuestions.push({
        type: 'sentence',
        question: 'Arrange the words into a correct sentence',
        parts,
        answer: clean,
        points: 20,
      });
    });

    quizQuestions = shuffleArray(quizQuestions).slice(0, targetCount);

    return {
      categoryId: category.id,
      categoryName: category.name,
      totalQuestions: quizQuestions.length,
      questions: quizQuestions,
      passingScore: 70,
      timeLimit: Math.max(300, quizQuestions.length * 45),
      pointsAvailable: quizQuestions.reduce((sum, q) => sum + (q.points || 10), 0),
    };
  }
};

function startQuiz(category) {
  const totalWords = category.words.length;
  const quizSize = totalWords >= 50 ? 20 : Math.max(10, Math.min(totalWords, 25));
  currentQuiz = QUIZ_TEMPLATES.generate(category, quizSize);
  currentQuiz.currentIndex = 0;
  currentQuiz.score = 0;
  currentQuiz.results = [];
  currentQuiz.startTime = Date.now();
  currentQuiz.elapsed = 0;
  currentQuiz.matchAnswers = {};
  return currentQuiz;
}

function submitQuizAnswer(questionIndex, answer) {
  if (!currentQuiz) return null;
  const q = currentQuiz.questions[questionIndex];
  if (!q) return null;

  let correct = false;
  if (q.type === 'mcq') {
    correct = answer === q.correctIndex;
  } else if (q.type === 'fill' || q.type === 'spelling') {
    correct = answer.toLowerCase().trim() === q.answer.toLowerCase().trim();
  } else if (q.type === 'sentence') {
    correct = answer.toLowerCase().trim() === q.answer.toLowerCase().trim();
  }

  currentQuiz.results.push({
    questionIndex,
    answer,
    correct,
    points: correct ? (q.points || 10) : 0,
  });

  if (correct) currentQuiz.score += (q.points || 10);
  currentQuiz.currentIndex = questionIndex + 1;

  return { correct, points: correct ? (q.points || 10) : 0 };
}

function finishQuiz() {
  if (!currentQuiz) return null;
  const total = currentQuiz.questions.length;
  const correctCount = currentQuiz.results.filter(r => r.correct).length;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const passed = percentage >= currentQuiz.passingScore;
  const timeSpent = Math.floor((Date.now() - currentQuiz.startTime) / 1000);

  let tier = null;
  if (passed) {
    if (percentage >= 90) tier = 'gold';
    else if (percentage >= 80) tier = 'silver';
    else tier = 'bronze';
  }

  return {
    total,
    correctCount,
    percentage,
    passed,
    tier,
    score: currentQuiz.score,
    timeSpent,
    results: currentQuiz.results,
    categoryId: currentQuiz.categoryId,
    categoryName: currentQuiz.categoryName,
  };
}

function getQuizProgress() {
  if (!currentQuiz) return 0;
  return Math.round((currentQuiz.currentIndex / currentQuiz.questions.length) * 100);
}

function getQuizElapsed() {
  return Math.floor((Date.now() - currentQuiz.startTime) / 1000);
}
