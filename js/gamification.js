const LEVELS = [
  { level: 1, name: 'Beginner', pointsRequired: 0, icon: '🌱' },
  { level: 2, name: 'Starter', pointsRequired: 500, icon: '🌟' },
  { level: 3, name: 'Explorer', pointsRequired: 1500, icon: '🔍' },
  { level: 4, name: 'Learner', pointsRequired: 3000, icon: '📖' },
  { level: 5, name: 'Achiever', pointsRequired: 5000, icon: '🏆' },
  { level: 6, name: 'Scholar', pointsRequired: 8000, icon: '🎓' },
  { level: 7, name: 'Expert', pointsRequired: 12000, icon: '💡' },
  { level: 8, name: 'Master', pointsRequired: 18000, icon: '👑' },
  { level: 9, name: 'Champion', pointsRequired: 25000, icon: '⭐' },
  { level: 10, name: 'Legend', pointsRequired: 35000, icon: '🔥' },
];

const BADGE_DEFS = [
  { id: 'first-exercise', name: 'First Steps', description: 'Complete your first exercise', icon: '👶', category: 'achievement' },
  { id: 'quick-learner', name: 'Quick Learner', description: 'Get 10 perfect scores', icon: '⚡', category: 'achievement' },
  { id: 'streak-7', name: 'Streak Master', description: 'Maintain a 7-day streak', icon: '🔥', category: 'achievement' },
  { id: 'streak-30', name: 'Dedicated Student', description: '30-day streak!', icon: '💎', category: 'achievement' },
  { id: 'words-100', name: 'Word Collector', description: 'Learn 100 words', icon: '📚', category: 'achievement' },
  { id: 'words-500', name: 'Vocabulary Builder', description: 'Learn 500 words', icon: '📖', category: 'achievement' },
  { id: 'words-1000', name: 'Language Master', description: 'Learn 1000 words', icon: '🏅', category: 'achievement' },
  { id: 'speed-demon', name: 'Speed Demon', description: 'Exercise in under 30 seconds', icon: '💨', category: 'achievement' },
  { id: 'perfect-week', name: 'Perfect Week', description: 'No mistakes for 7 days', icon: '✨', category: 'achievement' },
  { id: 'all-categories', name: 'Category Champion', description: 'Complete all categories', icon: '👑', category: 'achievement' },
  { id: 'first-quiz-pass', name: 'Quiz Passer', description: 'Pass your first milestone quiz', icon: '✅', category: 'achievement' },
  { id: 'quiz-gold', name: 'Quiz Gold Medalist', description: 'Get 90%+ on any quiz', icon: '🥇', category: 'achievement' },
  { id: 'early-bird', name: 'Early Bird', description: 'Practice before 8 AM', icon: '🌅', category: 'special' },
  { id: 'night-owl', name: 'Night Owl', description: 'Practice after 8 PM', icon: '🦉', category: 'special' },
  { id: 'comeback', name: 'Comeback Kid', description: 'Return after 7+ days away', icon: '💪', category: 'special' },
];

const POINTS = {
  EXERCISE_COMPLETE: 10,
  PERFECT_SCORE: 25,
  STREAK_BONUS_PER_DAY: 5,
  CATEGORY_COMPLETE: 100,
  ALL_CATEGORIES_LEVEL: 500,
  PERFECT_QUIZ: 50,
  SPEED_BONUS: 15,
  FIRST_MASTERY: 20,
};

function getLevel(points) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (points >= l.pointsRequired) current = l;
    else break;
  }
  return current;
}

function getNextLevel(points) {
  for (let i = 0; i < LEVELS.length - 1; i++) {
    if (points < LEVELS[i + 1].pointsRequired) return LEVELS[i + 1];
  }
  return null;
}

function getLevelProgress(points) {
  const current = getLevel(points);
  const next = getNextLevel(points);
  if (!next) return 100;
  const range = next.pointsRequired - current.pointsRequired;
  const progress = points - current.pointsRequired;
  return Math.min(100, Math.round((progress / range) * 100));
}

async function awardPoints(userId, amount, reason) {
  const progress = await getUserProgress(userId);
  if (!progress) return;
  const newPoints = (progress.totalPoints || 0) + amount;
  const newLevel = getLevel(newPoints).level;
  await updateUserProgress(userId, {
    totalPoints: newPoints,
    level: newLevel
  });
  return { newPoints, newLevel };
}

async function checkAndAwardBadges(userId, context) {
  const progress = await getUserProgress(userId);
  if (!progress) return [];
  const badges = progress.badges || [];
  const earned = [];

  const hasBadge = (id) => badges.some(b => b.id === id);

  if (!hasBadge('first-exercise') && context.type === 'exercise_complete') {
    earned.push(BADGE_DEFS.find(b => b.id === 'first-exercise'));
  }

  if (!hasBadge('words-100') && (progress.wordsLearned || 0) >= 100) {
    earned.push(BADGE_DEFS.find(b => b.id === 'words-100'));
  }

  if (!hasBadge('words-500') && (progress.wordsLearned || 0) >= 500) {
    earned.push(BADGE_DEFS.find(b => b.id === 'words-500'));
  }

  if (!hasBadge('words-1000') && (progress.wordsLearned || 0) >= 1000) {
    earned.push(BADGE_DEFS.find(b => b.id === 'words-1000'));
  }

  if (!hasBadge('first-quiz-pass') && context.type === 'quiz_pass') {
    earned.push(BADGE_DEFS.find(b => b.id === 'first-quiz-pass'));
  }

  if (!hasBadge('quiz-gold') && context.type === 'quiz_gold') {
    earned.push(BADGE_DEFS.find(b => b.id === 'quiz-gold'));
  }

  if (!hasBadge('streak-7') && (progress.currentStreak || 0) >= 7) {
    earned.push(BADGE_DEFS.find(b => b.id === 'streak-7'));
  }

  if (!hasBadge('streak-30') && (progress.currentStreak || 0) >= 30) {
    earned.push(BADGE_DEFS.find(b => b.id === 'streak-30'));
  }

  for (const badge of earned) {
    await addBadge(userId, badge);
  }
  return earned;
}

async function updateStreak(userId) {
  const progress = await getUserProgress(userId);
  if (!progress) return;
  const today = new Date().toDateString();
  const lastDate = progress.lastPracticeDate?.toDate
    ? progress.lastPracticeDate.toDate()
    : progress.lastPracticeDate ? new Date(progress.lastPracticeDate) : null;

  if (lastDate) {
    const lastDay = new Date(lastDate).toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastDay === today) return;
    if (lastDay === yesterday) {
      const newStreak = (progress.currentStreak || 0) + 1;
      await updateUserProgress(userId, {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, progress.longestStreak || 0),
        lastPracticeDate: new Date()
      });
    } else if (lastDay !== today) {
      await updateUserProgress(userId, {
        currentStreak: 1,
        lastPracticeDate: new Date()
      });
    }
  } else {
    await updateUserProgress(userId, {
      currentStreak: 1,
      lastPracticeDate: new Date()
    });
  }
}

async function updateAccuracy(userId, correct, total) {
  const progress = await getUserProgress(userId);
  if (!progress) return;
  const newCorrect = (progress.totalCorrect || 0) + correct;
  const newTotal = (progress.totalAttempts || 0) + total;
  const accuracy = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0;
  await updateUserProgress(userId, {
    totalCorrect: newCorrect,
    totalAttempts: newTotal,
    averageAccuracy: accuracy
  });
}
