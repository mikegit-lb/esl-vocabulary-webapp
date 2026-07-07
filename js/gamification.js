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
  { id: 'words-100', name: 'Word Collector', description: 'Master 100 words', icon: '📚', category: 'achievement' },
  { id: 'words-500', name: 'Vocabulary Builder', description: 'Master 500 words', icon: '📖', category: 'achievement' },
  { id: 'words-1000', name: 'Language Master', description: 'Master 1000 words', icon: '🏅', category: 'achievement' },
  { id: 'speed-demon', name: 'Speed Demon', description: 'Exercise in under 30 seconds', icon: '💨', category: 'achievement' },
  { id: 'perfect-week', name: 'Perfect Week', description: 'No mistakes for 7 days', icon: '✨', category: 'achievement' },
  { id: 'all-categories', name: 'Category Champion', description: 'Complete all categories', icon: '👑', category: 'achievement' },
  { id: 'category-master', name: 'Category Master', description: 'Get 3 stars in any category', icon: '⭐', category: 'achievement' },
  { id: 'first-quiz-pass', name: 'Quiz Passer', description: 'Pass your first milestone quiz', icon: '✅', category: 'achievement' },
  { id: 'quiz-gold', name: 'Quiz Gold Medalist', description: 'Get 90%+ on any quiz', icon: '🥇', category: 'achievement' },
  { id: 'early-bird', name: 'Early Bird', description: 'Practice before 8 AM', icon: '🌅', category: 'special' },
  { id: 'night-owl', name: 'Night Owl', description: 'Practice after 8 PM', icon: '🦉', category: 'special' },
  { id: 'comeback', name: 'Comeback Kid', description: 'Return after 7+ days away', icon: '💪', category: 'special' },
  { id: 'word-master', name: 'Word Master', description: 'Master your first word', icon: '🎯', category: 'achievement' },
  { id: 'avatar-evolve', name: 'Growing Up!', description: 'Evolve your avatar to stage 2', icon: '🐣', category: 'achievement' },
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
  DAILY_QUEST: 30,
  REVIEW_WORD: 10,
};

const QUESTS_CONFIG = [
  { id: 'quest-exercise', type: 'exercise_complete', target: 1, description: 'Complete 1 exercise', icon: '🏃', reward: 30 },
  { id: 'quest-words', type: 'words_learned', target: 3, description: 'Master 3 words', icon: '📖', reward: 40 },
  { id: 'quest-quiz', type: 'quiz_pass', target: 1, description: 'Pass 1 quiz', icon: '✅', reward: 50 },
  { id: 'quest-perfect', type: 'perfect_score', target: 1, description: 'Get a perfect score', icon: '💯', reward: 50 },
  { id: 'quest-category', type: 'category_complete', target: 1, description: 'Complete 1 category', icon: '🏁', reward: 60 },
  { id: 'quest-streak', type: 'streak_day', target: 1, description: 'Keep your streak alive', icon: '🔥', reward: 20 },
];

const AVATAR_STAGES = [
  { stage: 0, name: 'Egg', icon: '🥚', desc: 'Just starting your journey' },
  { stage: 1, name: 'Hatchling', icon: '🐣', desc: 'A new learner is born' },
  { stage: 2, name: 'Chick', icon: '🐤', desc: 'Growing stronger every day' },
  { stage: 3, name: 'Bird', icon: '🐦', desc: 'Spreading your wings' },
  { stage: 4, name: 'Phoenix', icon: '🦅', desc: 'Rising to new heights' },
  { stage: 5, name: 'Dragon', icon: '🐉', desc: 'A true language master!' },
];

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
  if (!progress) return null;
  const oldLevel = progress.level || 1;
  const newPoints = (progress.totalPoints || 0) + amount;
  const newLevelObj = getLevel(newPoints);
  const newLevel = newLevelObj.level;
  await updateUserProgress(userId, {
    totalPoints: newPoints,
    level: newLevel
  });
  if (userProfile?.progress) {
    userProfile.progress.totalPoints = newPoints;
    userProfile.progress.level = newLevel;
  }
  return { newPoints, newLevel, leveledUp: newLevel > oldLevel, newLevelObj };
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

  const masteredCount = Object.values(progress.wordMastery || {}).filter(v => v === 2).length;
  if (!hasBadge('word-master') && masteredCount >= 1) {
    earned.push(BADGE_DEFS.find(b => b.id === 'word-master'));
  }

  if (!hasBadge('words-100') && masteredCount >= 100) {
    earned.push(BADGE_DEFS.find(b => b.id === 'words-100'));
  }

  if (!hasBadge('words-500') && masteredCount >= 500) {
    earned.push(BADGE_DEFS.find(b => b.id === 'words-500'));
  }

  if (!hasBadge('words-1000') && masteredCount >= 1000) {
    earned.push(BADGE_DEFS.find(b => b.id === 'words-1000'));
  }

  if (!hasBadge('quick-learner') && (progress.perfectScoreCount || 0) >= 10) {
    earned.push(BADGE_DEFS.find(b => b.id === 'quick-learner'));
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

  if (!hasBadge('category-master') && progress.categoryStars) {
    const hasThreeStar = Object.values(progress.categoryStars).some(s => s >= 3);
    if (hasThreeStar) earned.push(BADGE_DEFS.find(b => b.id === 'category-master'));
  }

  if (!hasBadge('all-categories') && progress.categoryStars) {
    const allCats = getAllCategoryIds();
    const allDone = allCats.every(id => progress.categoryStars[id] && progress.categoryStars[id] >= 1);
    if (allDone) earned.push(BADGE_DEFS.find(b => b.id === 'all-categories'));
  }

  if (!hasBadge('avatar-evolve') && (progress.avatar?.stage || 0) >= 2) {
    earned.push(BADGE_DEFS.find(b => b.id === 'avatar-evolve'));
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
      if (userProfile?.progress) {
        userProfile.progress.currentStreak = newStreak;
        userProfile.progress.longestStreak = Math.max(newStreak, progress.longestStreak || 0);
        userProfile.progress.lastPracticeDate = new Date();
      }
    } else if (lastDay !== today) {
      await updateUserProgress(userId, {
        currentStreak: 1,
        lastPracticeDate: new Date()
      });
      if (userProfile?.progress) {
        userProfile.progress.currentStreak = 1;
        userProfile.progress.lastPracticeDate = new Date();
      }
    }
  } else {
    await updateUserProgress(userId, {
      currentStreak: 1,
      lastPracticeDate: new Date()
    });
    if (userProfile?.progress) {
      userProfile.progress.currentStreak = 1;
      userProfile.progress.lastPracticeDate = new Date();
    }
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
  if (userProfile?.progress) {
    userProfile.progress.totalCorrect = newCorrect;
    userProfile.progress.totalAttempts = newTotal;
    userProfile.progress.averageAccuracy = accuracy;
  }
}

async function updateWordMastery(userId, wordId, level) {
  if (!userId) return;
  const progress = await getUserProgress(userId);
  if (!progress) return;
  const mastery = progress.wordMastery || {};
  const oldLevel = mastery[wordId] || 0;
  if (oldLevel >= level) return;
  mastery[wordId] = level;
  await updateUserProgress(userId, { wordMastery: mastery });
  if (userProfile?.progress) {
    userProfile.progress.wordMastery = mastery;
  }
  if (level === 2 && oldLevel < 2) {
    await awardPoints(userId, POINTS.FIRST_MASTERY, `Mastered word: ${wordId}`);
    await updateUserProgress(userId, {
      wordsLearned: (progress.wordsLearned || 0) + 1
    });
    if (userProfile?.progress) {
      userProfile.progress.wordsLearned = (progress.wordsLearned || 0) + 1;
    }
  }
}

async function updateCategoryStars(userId, categoryId, percentage) {
  if (!userId) return;
  const progress = await getUserProgress(userId);
  if (!progress) return;
  const stars = progress.categoryStars || {};
  let starCount = 1;
  if (percentage >= 90) starCount = 3;
  else if (percentage >= 80) starCount = 2;

  if ((stars[categoryId] || 0) >= starCount) return;
  stars[categoryId] = starCount;
  await updateUserProgress(userId, { categoryStars: stars });
  if (userProfile?.progress) {
    userProfile.progress.categoryStars = stars;
  }
  const badges = await checkAndAwardBadges(userId, { type: 'category_complete' });
  return { stars: starCount, newBadges: badges };
}

function initDailyQuests() {
  return [
    { ...QUESTS_CONFIG[0], progress: 0, completed: false, date: new Date().toDateString() },
    { ...QUESTS_CONFIG[1], progress: 0, completed: false, date: new Date().toDateString() },
    { ...QUESTS_CONFIG[2], progress: 0, completed: false, date: new Date().toDateString() },
  ];
}

async function getDailyQuests(userId) {
  const progress = await getUserProgress(userId);
  if (!progress) return initDailyQuests();
  const quests = progress.dailyQuests || [];
  const today = new Date().toDateString();
  if (quests.length && quests[0].date === today) return quests;
  const newQuests = initDailyQuests();
  await updateUserProgress(userId, { dailyQuests: newQuests });
  if (userProfile?.progress) userProfile.progress.dailyQuests = newQuests;
  return newQuests;
}

async function updateDailyQuestProgress(userId, type, delta = 1) {
  const quests = await getDailyQuests(userId);
  let changed = false;
  for (const q of quests) {
    if (q.completed || q.type !== type) continue;
    q.progress = Math.min(q.target, (q.progress || 0) + delta);
    if (q.progress >= q.target && !q.completed) {
      q.completed = true;
      changed = true;
      await awardPoints(userId, q.reward || POINTS.DAILY_QUEST, `Daily quest: ${q.description}`);
    }
  }
  if (changed) {
    await updateUserProgress(userId, { dailyQuests: quests });
    if (userProfile?.progress) userProfile.progress.dailyQuests = quests;
  }
  return quests.filter(q => q.completed);
}

function scheduleWordReview(wordId) {
  const schedule = userProfile?.progress?.reviewSchedule || {};
  const intervals = [1, 3, 7, 14, 30];
  const nextDate = new Date();
  const currentLevel = schedule[wordId]?.level || 0;
  const days = intervals[Math.min(currentLevel, intervals.length - 1)];
  nextDate.setDate(nextDate.getDate() + days);
  schedule[wordId] = { nextReview: nextDate.toISOString(), level: currentLevel + 1 };
  if (userProfile?.progress) userProfile.progress.reviewSchedule = schedule;
  return schedule;
}

function getDueReviews(progress) {
  if (!progress?.reviewSchedule) return [];
  const now = new Date();
  return Object.entries(progress.reviewSchedule)
    .filter(([_, v]) => v && new Date(v.nextReview) <= now)
    .map(([id, v]) => ({ wordId: id, level: v?.level || 1 }));
}

async function recordWordError(userId, wordId) {
  const progress = await getUserProgress(userId);
  if (!progress) return;
  const errors = progress.wordErrors || {};
  errors[wordId] = (errors[wordId] || 0) + 1;
  await updateUserProgress(userId, { wordErrors: errors });
  if (userProfile?.progress) userProfile.progress.wordErrors = errors;
}

function getWeakWords(progress, limit = 10) {
  if (!progress?.wordErrors) return [];
  return Object.entries(progress.wordErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({ wordId: id, errors: count }));
}

async function getAvatarStage(userId) {
  const progress = await getUserProgress(userId);
  const avatar = progress?.avatar || { stage: 0, name: 'Buddy' };
  return avatar;
}

function getAvatarStageForPoints(points, badges, categoryStars) {
  let stage = 0;
  if (points >= 0) stage = 0;
  if (points >= 500 || (badges || []).length >= 3) stage = 1;
  if (points >= 3000 || (badges || []).length >= 6) stage = 2;
  if (points >= 8000 || (badges || []).length >= 10) stage = 3;
  if (points >= 18000 || (badges || []).length >= 14) stage = 4;
  if (points >= 35000 || (badges || []).length >= 17) stage = 5;
  return stage;
}

async function evolveAvatar(userId) {
  const progress = await getUserProgress(userId);
  if (!progress) return null;
  const currentStage = progress.avatar?.stage || 0;
  const targetStage = getAvatarStageForPoints(
    progress.totalPoints || 0,
    progress.badges || [],
    progress.categoryStars || {}
  );
  if (targetStage > currentStage) {
    const avatar = { stage: targetStage, name: progress.avatar?.name || 'Buddy' };
    await updateUserProgress(userId, { avatar });
    if (userProfile?.progress) userProfile.progress.avatar = avatar;
    await checkAndAwardBadges(userId, { type: 'avatar_evolve' });
    return avatar;
  }
  return null;
}

async function incrementPerfectScore(userId) {
  const progress = await getUserProgress(userId);
  if (!progress) return;
  const count = (progress.perfectScoreCount || 0) + 1;
  await updateUserProgress(userId, { perfectScoreCount: count });
  if (userProfile?.progress) userProfile.progress.perfectScoreCount = count;
  await checkAndAwardBadges(userId, { type: 'perfect_score' });
}

function getAllCategoryIds() {
  if (typeof allCategoryMeta !== 'undefined') return allCategoryMeta.map(c => c.id);
  return [];
}
