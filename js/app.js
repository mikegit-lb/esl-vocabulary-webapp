function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function showConfetti(colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:10000';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * -1,
    w: Math.random() * 10 + 5,
    h: Math.random() * 6 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    vy: Math.random() * 3 + 2,
    vx: (Math.random() - 0.5) * 2,
    rot: Math.random() * 360,
    rotV: (Math.random() - 0.5) * 5,
  }));
  let frame = 0;
  function animate() {
    if (frame++ > 120) { canvas.remove(); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotV;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

function getFullCategories() {
  const expanded = allCategoryMeta.map(c => expandCategoryData(c.id, c.name, c.icon, c.diff, c.desc, CATEGORY_WORDS[c.id] || []));
  return expanded;
}

function getCategory(id) {
  return getFullCategories().find(c => c.id === id);
}

function handleMarkLearning(categoryId, wordId) {
  if (!currentUser) { showToast('Sign in to track your progress!'); return; }
  updateWordMastery(currentUser.uid, wordId, 1);
  updateDailyQuestProgress(currentUser.uid, 'words_learned', 0.5);
  showToast('📖 Added to learning list!');
}

function handleMarkMastered(categoryId, wordId) {
  if (!currentUser) { showToast('Sign in to track your progress!'); return; }
  const wasMastered = userProfile?.progress?.wordMastery?.[wordId] >= 2;
  if (wasMastered) { showToast('Already mastered!'); return; }
  updateWordMastery(currentUser.uid, wordId, 2).then(() => {
    const masteredCount = Object.values(userProfile?.progress?.wordMastery || {}).filter(v => v === 2).length;
    showToast('⭐ Word mastered! (' + masteredCount + ' total)');
    scheduleWordReview(wordId);
    updateDailyQuestProgress(currentUser.uid, 'words_learned');
    showConfetti(['#FFD700', '#FF6B6B', '#4ECDC4']);
  });
}

function render(app) {
  app.innerHTML = `<div id="app-root"></div>`;
  const root = document.getElementById('app-root');
  if (currentUser) {
    renderAuthenticatedLayout(root);
  } else {
    renderPublicLayout(root);
  }
}

function renderPublicLayout(root) {
  let userNav = currentUser ? `
    <div style="display:flex;align-items:center;gap:8px">
      <span>${currentUser.displayName || currentUser.email}</span>
      <button class="nav-btn primary" onclick="handleSignOut()">Sign Out</button>
    </div>
  ` : `
    <button class="nav-btn" onclick="navigateTo('login')">Log In</button>
    <button class="nav-btn primary" onclick="navigateTo('signup')">Sign Up</button>
  `;

  root.innerHTML = `
    <header>
      <div class="header-inner">
        <div class="logo" onclick="navigateTo('landing')"><span>📚</span> ESL Vocab</div>
        <nav>${userNav}</nav>
      </div>
    </header>
    <main><div id="page-content"></div></main>
  `;
  const pageContent = document.getElementById('page-content');
  navigateTo(currentRoute || 'landing');
}

function renderAuthenticatedLayout(root) {
  let streakDisplay = '';
  if (userProfile?.progress) {
    streakDisplay = `<span class="nav-btn" style="cursor:default">🔥 ${userProfile.progress.currentStreak || 0} day streak</span>`;
  }

  root.innerHTML = `
    <header>
      <div class="header-inner">
        <div class="logo" onclick="navigateTo('dashboard')"><span>📚</span> ESL Vocab</div>
        <nav>
          <button class="nav-btn" onclick="navigateTo('dashboard')"><span>🏠</span><span class="nav-label">Home</span></button>
          <button class="nav-btn" onclick="navigateTo('categories')"><span>📖</span><span class="nav-label">Words</span></button>
          <button class="nav-btn" onclick="navigateTo('progress')"><span>📊</span><span class="nav-label">Progress</span></button>
          <button class="nav-btn" onclick="navigateTo('badges')"><span>🏅</span><span class="nav-label">Badges</span></button>
          ${streakDisplay}
          <button class="nav-btn primary" onclick="handleSignOut()">Sign Out</button>
        </nav>
      </div>
    </header>
    <main><div id="page-content"></div></main>
  `;
  const pageContent = document.getElementById('page-content');
  navigateTo(currentRoute || 'dashboard');
}

function renderLanding(el) {
  el.innerHTML = `
    <div class="hero">
      <h1>Learn <span>English</span> Vocabulary!</h1>
      <p>Fun exercises, milestone quizzes, and badges to help young learners master English words</p>
      <div class="hero-buttons">
        <button class="btn btn-primary btn-lg" onclick="navigateTo('signup')">Get Started Free</button>
        <button class="btn btn-outline btn-lg" onclick="navigateTo('login')">I Already Have an Account</button>
      </div>
    </div>
    <div class="features">
      <div class="card feature-card">
        <div class="icon">📚</div>
        <h3>55+ Categories</h3>
        <p>Over 2,500 words across animals, colors, food, phrasal verbs, and more</p>
      </div>
      <div class="card feature-card">
        <div class="icon">🎮</div>
        <h3>Fun Exercises</h3>
        <p>Multiple choice, flashcards, match games, spelling, and sentence building</p>
      </div>
      <div class="card feature-card">
        <div class="icon">🏆</div>
        <h3>Badges & Levels</h3>
        <p>Earn badges, level up, and build daily streaks as you learn</p>
      </div>
      <div class="card feature-card">
        <div class="icon">✅</div>
        <h3>Milestone Quizzes</h3>
        <p>Test your knowledge after every category with mixed-question quizzes</p>
      </div>
    </div>
  `;
}

function renderLogin(el) {
  el.innerHTML = `
    <div class="auth-page">
      <div class="card">
        <h2>Welcome Back!</h2>
        <form id="login-form" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label for="login-email">Email</label>
            <input type="email" id="login-email" class="form-input" placeholder="your@email.com" required>
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" class="form-input" placeholder="Enter your password" required>
          </div>
          <div id="login-error" class="form-error" style="display:none"></div>
          <button type="submit" class="btn btn-primary" style="width:100%">Log In</button>
        </form>
        <div class="auth-toggle">
          Don't have an account? <a onclick="navigateTo('signup')">Sign Up</a>
        </div>
      </div>
    </div>
  `;
}

function renderSignup(el) {
  el.innerHTML = `
    <div class="auth-page">
      <div class="card">
        <h2>Create Account</h2>
        <form id="signup-form" onsubmit="handleSignup(event)">
          <div class="form-group">
            <label for="signup-name">Your Name</label>
            <input type="text" id="signup-name" class="form-input" placeholder="Enter your name" required>
          </div>
          <div class="form-group">
            <label for="signup-email">Email</label>
            <input type="email" id="signup-email" class="form-input" placeholder="your@email.com" required>
          </div>
          <div class="form-group">
            <label for="signup-password">Password</label>
            <input type="password" id="signup-password" class="form-input" placeholder="Create a password (min 6 characters)" required minlength="6">
          </div>
          <div id="signup-error" class="form-error" style="display:none"></div>
          <button type="submit" class="btn btn-primary" style="width:100%">Create Account</button>
        </form>
        <div class="auth-toggle">
          Already have an account? <a onclick="navigateTo('login')">Log In</a>
        </div>
      </div>
    </div>
  `;
}

function renderDashboard(el) {
  let progress = userProfile?.progress;
  let level = progress ? getLevel(progress.totalPoints || 0) : getLevel(0);
  let nextLevel = progress ? getNextLevel(progress.totalPoints || 0) : getNextLevel(0);
  let levelProgress = progress ? getLevelProgress(progress.totalPoints || 0) : 0;
  let categories = getFullCategories();
  let avatarStage = progress ? getAvatarStageForPoints(progress.totalPoints || 0, progress.badges || [], progress.categoryStars || {}).stage : 0;
  let masteredCount = Object.values(progress?.wordMastery || {}).filter(v => v === 2).length;
  let quests = progress?.dailyQuests || [];
  let dueReviews = getDueReviews(progress);

  el.innerHTML = `
    <div class="dashboard container">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
        <div class="avatar-sprite avatar-stage-${avatarStage}" title="${AVATAR_STAGES[avatarStage]?.name || 'Egg'}"></div>
        <div>
          <h1 style="margin:0">Hello, ${userProfile?.displayName || 'Learner'}! 👋</h1>
          <p class="greeting" style="margin:0">${AVATAR_STAGES[avatarStage]?.desc || 'Keep learning!'}</p>
        </div>
      </div>

      <div class="level-progress">
        <div class="level-info">
          <span class="level-name">${level.icon} ${level.name}</span>
          <span>Level ${level.level}</span>
        </div>
        <div class="level-bar">
          <div class="level-bar-fill" style="width:${levelProgress}%"></div>
        </div>
        <div class="progress-row">
          <span style="color:var(--text-light);font-size:0.9rem">Level ${level.level} · ${progress?.totalPoints || 0} XP</span>
          ${nextLevel ? `<span style="color:var(--text-light);font-size:0.9rem">${nextLevel.pointsRequired - (progress?.totalPoints || 0)} XP to ${nextLevel.name}</span>` : '<span style="color:var(--success);font-weight:600">Max Level!</span>'}
        </div>
      </div>

      ${dueReviews.length ? `
        <div class="card" style="background:var(--warning-light, #FFF3E0);margin-bottom:16px;cursor:pointer" onclick="startReviewSession()">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:2rem">🔄</span>
            <div>
              <strong>${dueReviews.length} word${dueReviews.length > 1 ? 's' : ''} due for review!</strong>
              <p style="margin:0;font-size:0.85rem;color:var(--text-light)">Tap to start a quick review session</p>
            </div>
          </div>
        </div>
      ` : ''}

      ${quests.length ? `
        <div style="margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:1.2rem">📋</span>
            <strong>Daily Quests</strong>
          </div>
          ${quests.map(q => `
            <div class="card" style="padding:12px;margin-bottom:6px;display:flex;align-items:center;gap:12px;${q.completed ? 'opacity:0.6' : ''}">
              <span style="font-size:1.3rem">${q.completed ? '✅' : q.icon}</span>
              <div style="flex:1">
                <div style="font-size:0.9rem">${q.description}</div>
                <div class="level-bar" style="height:6px;margin-top:4px">
                  <div class="level-bar-fill" style="width:${Math.round(q.progress/q.target*100)}%;height:6px;${q.completed ? 'background:var(--success)' : ''}"></div>
                </div>
              </div>
              <span style="font-size:0.85rem;color:var(--text-light)">${q.progress}/${q.target} · +${q.reward}pts</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="stats-grid">
        <div class="card stat-card">
          <div class="stat-icon">📖</div>
          <div class="stat-value">${masteredCount}</div>
          <div class="stat-label">Words Mastered</div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-value">${(progress?.badges || []).length}</div>
          <div class="stat-label">Badges Earned</div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value">${progress?.totalExercisesCompleted || 0}</div>
          <div class="stat-label">Exercises Done</div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">${progress?.averageAccuracy || 0}%</div>
          <div class="stat-label">Accuracy</div>
        </div>
      </div>

      <h2 style="margin-bottom:16px">Continue Learning</h2>
      <div class="card-grid">
        ${categories.slice(0, 6).map(c => {
          const stars = userProfile?.progress?.categoryStars?.[c.id] || 0;
          return `
          <div class="card category-card" onclick="navigateTo('category',{id:'${c.id}'})">
            <div class="icon">${c.icon}</div>
            <h3>${c.name}</h3>
            <p>${c.description}</p>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="difficulty difficulty-${c.difficulty === 1 ? 'easy' : c.difficulty === 2 ? 'medium' : 'hard'}">
                ${c.difficulty === 1 ? 'Easy' : c.difficulty === 2 ? 'Medium' : 'Hard'}
              </span>
              ${stars > 0 ? `<span style="color:var(--warning);font-weight:600">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</span>` : ''}
            </div>
          </div>
        `}).join('')}
      </div>
      <div style="text-align:center;margin-top:20px">
        <button class="btn btn-secondary" onclick="navigateTo('categories')">View All Categories</button>
      </div>
    </div>
  `;
}

function renderCategories(el) {
  let categories = getFullCategories();
  let categorized = { 1: [], 2: [], 3: [] };
  categories.forEach(c => categorized[c.difficulty] ? categorized[c.difficulty].push(c) : categorized[1].push(c));

  el.innerHTML = `
    <div class="container" style="padding:40px 20px">
      <h1 style="margin-bottom:8px">Vocabulary Categories</h1>
      <p style="color:var(--text-light);margin-bottom:24px">${categories.length} categories — master all words and take the quiz to earn stars!</p>

      ${[1, 2, 3].map(diff => `
        <h2 style="margin:24px 0 12px">${diff === 1 ? '🟢' : diff === 2 ? '🟡' : '🔴'} ${diff === 1 ? 'Easy' : diff === 2 ? 'Medium' : 'Hard'} (${categorized[diff]?.length || 0})</h2>
        <div class="card-grid">
          ${(categorized[diff] || []).map(c => {
            const stars = userProfile?.progress?.categoryStars?.[c.id] || 0;
            return `
            <div class="card category-card" onclick="navigateTo('category',{id:'${c.id}'})">
              <div class="icon">${c.icon}</div>
              <h3>${c.name}</h3>
              <p>${c.description}</p>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span class="difficulty difficulty-${diff === 1 ? 'easy' : diff === 2 ? 'medium' : 'hard'}">
                  ${diff === 1 ? 'Easy' : diff === 2 ? 'Medium' : 'Hard'}
                </span>
                ${stars > 0 ? `<span style="color:var(--warning);font-weight:600">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</span>` : `<span style="color:var(--text-light);font-size:0.8rem">☆☆☆</span>`}
              </div>
            </div>
          `}).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

function renderCategory(el, params) {
  const cat = getCategory(params.id);
  if (!cat) { navigateTo('categories'); return; }

  const catStars = userProfile?.progress?.categoryStars?.[cat.id] || 0;
  const mastery = userProfile?.progress?.wordMastery || {};

  let completedWords = 0;
  for (const w of cat.words) {
    if (mastery[cat.id + '-' + w.word.toLowerCase().replace(/\s+/g, '-')] === 2) completedWords++;
  }

  el.innerHTML = `
    <div class="category-detail container">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <span style="font-size:2.5rem">${cat.icon}</span>
        <div>
          <h1>${cat.name}</h1>
          <div class="meta">
            <span>${cat.words.length} words · </span>
            <span class="difficulty difficulty-${cat.difficulty === 1 ? 'easy' : cat.difficulty === 2 ? 'medium' : 'hard'}">
              ${cat.difficulty === 1 ? 'Easy' : cat.difficulty === 2 ? 'Medium' : 'Hard'}
            </span>
            ${catStars > 0 ? ` · <span style="color:var(--warning);font-weight:600">${'★'.repeat(catStars)}${'☆'.repeat(3-catStars)}</span>` : ''}
          </div>
        </div>
      </div>

      <p style="color:var(--text-light);margin-bottom:24px">${cat.description}</p>

      <div class="progress-row" style="margin-bottom:24px;gap:12px">
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px">
            <span>Progress</span>
            <span>${completedWords}/${cat.words.length} mastered</span>
          </div>
          <div class="level-bar"><div class="level-bar-fill" style="width:${cat.words.length ? Math.round(completedWords/cat.words.length*100) : 0}%"></div></div>
        </div>
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px">
        <button class="btn btn-primary" onclick="handleStartExercise('multiple-choice','${cat.id}')">✅ Multiple Choice</button>
        <button class="btn btn-secondary" onclick="handleStartExercise('flashcards','${cat.id}')">🃏 Flashcards</button>
        <button class="btn btn-accent" onclick="handleStartExercise('fill-blank','${cat.id}')">✍️ Fill Blanks</button>
        <button class="btn btn-outline" onclick="handleStartExercise('spelling','${cat.id}')">🔤 Spelling</button>
      </div>

      ${completedWords >= cat.words.length ? `
        <div style="background:var(--primary-light);border-radius:var(--radius);padding:20px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div><strong>🎯 Category Complete!</strong> Take the milestone quiz to earn your stars!</div>
          <button class="btn btn-primary" onclick="handleStartQuiz('${cat.id}')">Start Quiz</button>
        </div>
      ` : ''}

      <h2 style="margin-bottom:12px">Words (${cat.words.length})</h2>
      <div class="word-list">
        ${cat.words.map((w, i) => {
          const wid = cat.id + '-' + w.word.toLowerCase().replace(/\s+/g, '-');
          const m = mastery[wid] || 0;
          return `
          <div class="card word-item" onclick="navigateTo('word',{id:'${cat.id}',wordIndex:${i}})">
            <div class="word-main">
              <div class="word-status status-${m >= 2 ? 'mastered' : m >= 1 ? 'learning' : 'new'}"></div>
              <span class="word-text">${w.word}</span>
              <span style="color:var(--text-light);font-size:0.9rem">${w.pos}</span>
              <span style="font-size:0.8rem;margin-left:auto">${m >= 2 ? '⭐⭐' : m >= 1 ? '⭐' : ''}</span>
            </div>
            <span style="color:var(--text-light);font-size:0.85rem">${w.phonetic}</span>
          </div>
        `}).join('')}
      </div>
    </div>
  `;
}

function renderWord(el, params) {
  const cat = getCategory(params.id);
  if (!cat) { navigateTo('categories'); return; }
  const word = cat.words[parseInt(params.wordIndex) || 0];
  if (!word) { navigateTo('category', { id: cat.id }); return; }
  const wordId = cat.id + '-' + word.word.toLowerCase().replace(/\s+/g, '-');
  const mastery = userProfile?.progress?.wordMastery?.[wordId] || 0;

  el.innerHTML = `
    <div class="word-detail container">
      <button class="btn btn-sm btn-outline" onclick="navigateTo('category',{id:'${cat.id}'})" style="margin-bottom:16px">← Back to ${cat.name}</button>
      <div class="card">
        <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap">
          <h1>${word.word}</h1>
          <span class="phonetic">${word.phonetic || ''}</span>
          <span style="font-size:1.2rem">${mastery >= 2 ? '⭐⭐' : mastery >= 1 ? '⭐' : ''}</span>
        </div>
        <span class="pos">${word.pos || ''}</span>
        <p class="definition">${word.definition}</p>
        <div class="example">"${word.example}"</div>

        ${word.synonyms?.length ? `
          <div style="margin-bottom:12px">
            <strong>Synonyms:</strong> ${word.synonyms.join(', ')}
          </div>
        ` : ''}

        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:16px">
          <button class="btn btn-sm ${mastery >= 1 ? 'btn-secondary' : 'btn-primary'}" onclick="handleMarkLearning('${cat.id}','${wordId}')" ${mastery >= 1 ? 'disabled' : ''}>
            ${mastery >= 1 ? '✅ Learning' : '📖 Mark as Learning'}
          </button>
          <button class="btn btn-sm ${mastery >= 2 ? 'btn-secondary' : 'btn-primary'}" onclick="handleMarkMastered('${cat.id}','${wordId}')" ${mastery >= 2 ? 'disabled' : ''}>
            ${mastery >= 2 ? '✅ Mastered' : '⭐ Mark as Mastered'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderExercise(el, params) {
  const cat = getCategory(params.categoryId);
  if (!cat) { navigateTo('categories'); return; }
  const type = params.type || 'multiple-choice';
  const state = startExercise(type, cat.words, cat.id);
  const questions = buildExerciseQuestions(type, cat.words, cat.words);

  renderExerciseContent(el, cat, type, state, questions);
}

let currentExerciseQuestions = [];

function renderExerciseContent(el, cat, type, state, questions) {
  currentExerciseQuestions = questions;
  if (!questions.length) { showToast('No questions available'); navigateTo('category', { id: cat.id }); return; }

  const q = questions[state.currentIndex] || questions[0];
  const progress = state.currentIndex / state.total * 100;
  const elapsed = getElapsedTime();

  let questionHTML = '';
  let feedbackHTML = '';

  if (q.type === 'multiple-choice' || q.type === 'mcq') {
    questionHTML = `
      <div class="exercise-question">
        <h2>${q.question}</h2>
        <div class="options-grid">
          ${q.options.map((opt, i) => `
            <button class="option-btn" data-option="${i}" onclick="handleMCQAnswer(this, ${i}, ${q.options.indexOf(q.correctAnswer) >= 0 ? q.options.indexOf(q.correctAnswer) : -1})">${opt}</button>
          `).join('')}
        </div>
      </div>
    `;
    feedbackHTML = `<div id="feedback" class="feedback"><span class="fb-icon"></span><span class="fb-text"></span></div>`;
  } else if (q.type === 'flashcard') {
    questionHTML = `
      <div class="card flashcard" id="flashcard" onclick="flipFlashcard()">
        <div class="flashcard-inner">
          <div class="flashcard-front">
            <h2>${q.word}</h2>
            <p style="color:var(--text-light)">Tap to flip</p>
          </div>
          <div class="flashcard-back" style="display:none" id="flashcard-back">
            <h3>${q.word}</h3>
            <span class="pos">${q.pos || ''}</span>
            <p>${q.definition}</p>
            <div class="example" style="margin-top:12px">"${q.example}"</div>
            ${q.phonetic ? `<p style="color:var(--text-light);margin-top:8px">${q.phonetic}</p>` : ''}
          </div>
        </div>
      </div>
      <div class="flashcard-controls">
        <button class="btn btn-danger" onclick="handleFlashcardResponse(false)">😵 Still Learning</button>
        <button class="btn btn-primary" onclick="handleFlashcardResponse(true)">✅ Got It!</button>
      </div>
    `;
  } else if (q.type === 'fill-blank' || q.type === 'fill') {
    questionHTML = `
      <div class="exercise-question" style="text-align:center">
        <h2>${q.question || q.sentence}</h2>
        ${q.hint ? `<p style="color:var(--text-light);margin-bottom:12px">💡 Hint: ${q.hint}</p>` : ''}
        <input type="text" class="fill-blank-input" id="fill-answer" placeholder="Type your answer..." autocomplete="off" onkeydown="if(event.key==='Enter')handleFillAnswer()">
      </div>
      <button class="btn btn-primary" onclick="handleFillAnswer()" style="width:100%">Check Answer</button>
    `;
  } else if (q.type === 'sentence') {
    let sentencePieces = q.parts || [];
    questionHTML = `
      <div class="exercise-question" style="text-align:center">
        <h2>${q.question || 'Arrange the words into a sentence'}</h2>
        <div class="sentence-parts" id="sentence-parts">
          ${sentencePieces.map((p, i) => `<button class="sentence-part" data-idx="${i}" onclick="sentenceSelect(this)">${p}</button>`).join('')}
        </div>
        <div id="sentence-answer" style="min-height:48px;border:2px dashed var(--border);border-radius:var(--radius-sm);padding:12px;font-size:1.2rem;margin-bottom:12px"></div>
        <div style="display:flex;gap:12px;justify-content:center">
          <button class="btn btn-sm btn-outline" onclick="sentenceClear()">Clear</button>
          <button class="btn btn-sm btn-primary" onclick="handleSentenceAnswer()">Check</button>
        </div>
      </div>
    `;
  } else if (q.type === 'spelling') {
    questionHTML = `
      <div class="exercise-question" style="text-align:center">
        <div style="font-size:4rem;margin-bottom:16px">🔤</div>
        <h2>Spell the word</h2>
        <p style="color:var(--text-light);margin-bottom:12px">${q.definition}</p>
        ${q.hint ? `<p style="color:var(--text-light);margin-bottom:12px">💡 Hint: ${q.hint}</p>` : ''}
        <input type="text" class="fill-blank-input" id="spelling-answer" placeholder="Type the word..." autocomplete="off" onkeydown="if(event.key==='Enter')handleSpellingAnswer()">
      </div>
      <button class="btn btn-primary" onclick="handleSpellingAnswer()" style="width:100%">Check Spelling</button>
    `;
  } else if (q.type === 'situation-match') {
    questionHTML = `
      <div class="exercise-question">
        <div style="font-size:3rem;text-align:center;margin-bottom:16px">🎭</div>
        <h2 style="text-align:center">${q.situation}</h2>
        <div class="options-grid">
          ${q.options.map((opt, i) => `
            <button class="option-btn" onclick="handleSituationAnswer(this, ${i === q.options.indexOf(q.answer) ? 1 : 0})">${opt}</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  el.innerHTML = `
    <div class="exercise-container container">
      <div class="exercise-header">
        <button class="btn btn-sm btn-outline" onclick="navigateTo('category',{id:'${cat.id}'})">← Back</button>
        <span style="font-weight:600">${q.type === 'flashcard' ? '🃏' : q.type === 'fill-blank' ? '✍️' : q.type === 'sentence' ? '📝' : q.type === 'spelling' ? '🔤' : '✅'} ${q.type === 'flashcard' ? 'Flashcard' : q.type === 'multiple-choice' ? 'Multiple Choice' : q.type === 'fill-blank' ? 'Fill in the Blank' : q.type === 'sentence' ? 'Sentence Builder' : q.type === 'spelling' ? 'Spelling' : 'Exercise'} ${state.currentIndex + 1}/${state.total}</span>
        <span style="color:var(--text-light);font-size:0.9rem">⏱️ ${formatTime(elapsed)}</span>
      </div>
      <div class="exercise-progress">
        <div class="exercise-progress-fill" style="width:${progress}%"></div>
      </div>
      <div class="card" style="padding:32px">
        ${questionHTML}
        ${feedbackHTML}
      </div>
    </div>
  `;

  if (q.type === 'fill-blank' || q.type === 'fill') {
    setTimeout(() => document.getElementById('fill-answer')?.focus(), 100);
  }
  if (q.type === 'spelling') {
    setTimeout(() => document.getElementById('spelling-answer')?.focus(), 100);
  }
}

function handleMCQAnswer(btn, selectedIdx, correctIdx) {
  if (exerciseState.answered) return;
  exerciseState.answered = true;

  const correct = selectedIdx === correctIdx;
  const feedback = document.getElementById('feedback');
  const allBtns = document.querySelectorAll('.option-btn');

  allBtns.forEach(b => b.disabled = true);
  allBtns.forEach((b, i) => {
    if (i === correctIdx) b.classList.add('correct');
    if (i === selectedIdx && !correct) b.classList.add('incorrect');
  });

  if (feedback) {
    feedback.className = `feedback show ${correct ? 'correct' : 'incorrect'}`;
    feedback.querySelector('.fb-icon').textContent = correct ? '✅' : '❌';
    feedback.querySelector('.fb-text').textContent = correct ? 'Correct! Well done!' : `The correct answer was: ${document.querySelectorAll('.option-btn')[correctIdx]?.textContent || 'unknown'}`;
  }

  if (correct) exerciseState.correct++;
  exerciseState.currentIndex++;
  exerciseState.answered = false;

  setTimeout(() => advanceExercise(), 1500);
}

function handleFillAnswer() {
  const input = document.getElementById('fill-answer');
  if (!input) return;
  const answer = input.value.trim().toLowerCase();
  const q = currentExerciseQuestions[exerciseState.currentIndex];
  const correct = answer === (q.answer || '').toLowerCase();

  const feedback = document.getElementById('feedback');
  if (feedback) {
    feedback.className = `feedback show ${correct ? 'correct' : 'incorrect'}`;
    feedback.querySelector('.fb-icon').textContent = correct ? '✅' : '❌';
    feedback.querySelector('.fb-text').textContent = correct ? 'Correct!' : `The answer was: "${q.answer || q.word}"`;
  }

  input.disabled = true;
  if (correct) exerciseState.correct++;
  exerciseState.currentIndex++;
  setTimeout(() => advanceExercise(), 1500);
}

function handleSpellingAnswer() {
  const input = document.getElementById('spelling-answer');
  if (!input) return;
  const answer = input.value.trim().toLowerCase();
  const q = currentExerciseQuestions[exerciseState.currentIndex];
  const correct = answer === (q.word || q.answer || '').toLowerCase();

  const feedback = document.getElementById('feedback');
  if (feedback) {
    feedback.className = `feedback show ${correct ? 'correct' : 'incorrect'}`;
    feedback.querySelector('.fb-icon').textContent = correct ? '✅' : '❌';
    feedback.querySelector('.fb-text').textContent = correct ? 'Correct spelling!' : `Correct spelling: "${q.word || q.answer}"`;
  }

  input.disabled = true;
  if (correct) exerciseState.correct++;
  exerciseState.currentIndex++;
  setTimeout(() => advanceExercise(), 1500);
}

function handleFlashcardResponse(knew) {
  if (knew) exerciseState.correct++;
  exerciseState.currentIndex++;
  advanceExercise();
}

let sentenceSelected = [];

function sentenceSelect(el) {
  if (el.classList.contains('used')) return;
  el.classList.add('used');
  sentenceSelected.push(el.textContent);
  document.getElementById('sentence-answer').textContent = sentenceSelected.join(' ');
}

function sentenceClear() {
  document.querySelectorAll('.sentence-part.used').forEach(el => el.classList.remove('used'));
  sentenceSelected = [];
  document.getElementById('sentence-answer').textContent = '';
}

function handleSentenceAnswer() {
  const userAns = sentenceSelected.join(' ').toLowerCase().replace(/[.!?,]/g, '').trim();
  const q = currentExerciseQuestions[exerciseState.currentIndex];
  const correctAns = (q.answer || '').toLowerCase().replace(/[.!?,]/g, '').trim();
  const correct = userAns === correctAns;

  const feedback = document.getElementById('feedback');
  if (feedback) {
    feedback.className = `feedback show ${correct ? 'correct' : 'incorrect'}`;
    feedback.querySelector('.fb-icon').textContent = correct ? '✅' : '❌';
    feedback.querySelector('.fb-text').textContent = correct ? 'Perfect sentence!' : `The correct sentence: "${q.answer}"`;
  }

  document.querySelectorAll('.sentence-part').forEach(el => el.style.pointerEvents = 'none');
  if (correct) exerciseState.correct++;
  exerciseState.currentIndex++;
  setTimeout(() => advanceExercise(), 1500);
}

function handleSituationAnswer(btn, isCorrect) {
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  btn.classList.add(isCorrect ? 'correct' : 'incorrect');

  const feedback = document.getElementById('feedback');
  if (feedback) {
    feedback.className = `feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
    feedback.querySelector('.fb-icon').textContent = isCorrect ? '✅' : '❌';
    feedback.querySelector('.fb-text').textContent = isCorrect ? 'Great choice!' : 'Think about what fits the situation.';
  }

  if (isCorrect) exerciseState.correct++;
  exerciseState.currentIndex++;
  setTimeout(() => advanceExercise(), 1500);
}

function advanceExercise() {
  const root = document.getElementById('page-content');
  if (!root) return;
  const cat = getCategory(exerciseState.categoryId);
  if (!cat) { navigateTo('categories'); return; }

  if (exerciseState.currentIndex >= exerciseState.total) {
    completeExercise();
    return;
  }

  renderExerciseContent(root, cat, exerciseState.type, exerciseState, currentExerciseQuestions);
}

async function completeExercise() {
  const cat = getCategory(exerciseState.categoryId);
  const elapsed = getElapsedTime();
  const accuracy = exerciseState.total > 0 ? Math.round((exerciseState.correct / exerciseState.total) * 100) : 0;
  const isPerfect = accuracy === 100;
  const isSpeed = elapsed < 30;

  let points = POINTS.EXERCISE_COMPLETE;
  if (isPerfect) points += POINTS.PERFECT_SCORE;
  if (isSpeed) points += POINTS.SPEED_BONUS;

  const root = document.getElementById('page-content');
  if (!root) return;

  root.innerHTML = `
    <div class="exercise-container container" style="text-align:center">
      <div class="card" style="padding:48px">
        <div style="font-size:4rem;margin-bottom:16px">${isPerfect ? '🎉' : '👏'}</div>
        <h2>Exercise Complete!</h2>
        <div class="stats-grid" style="margin:24px 0">
          <div class="stat-card" style="box-shadow:none;background:var(--bg)">
            <div class="stat-value">${exerciseState.correct}/${exerciseState.total}</div>
            <div class="stat-label">Correct</div>
          </div>
          <div class="stat-card" style="box-shadow:none;background:var(--bg)">
            <div class="stat-value">${accuracy}%</div>
            <div class="stat-label">Accuracy</div>
          </div>
          <div class="stat-card" style="box-shadow:none;background:var(--bg)">
            <div class="stat-value">+${points}</div>
            <div class="stat-label">Points Earned</div>
          </div>
          <div class="stat-card" style="box-shadow:none;background:var(--bg)">
            <div class="stat-value">${formatTime(elapsed)}</div>
            <div class="stat-label">Time</div>
          </div>
        </div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="handleStartExercise('${exerciseState.type}','${exerciseState.categoryId}')">🔄 Try Again</button>
          <button class="btn btn-secondary" onclick="handleStartQuiz('${exerciseState.categoryId}')">🎯 Take Quiz</button>
          <button class="btn btn-outline" onclick="navigateTo('category',{id:'${exerciseState.categoryId}'})">Back to Category</button>
        </div>
      </div>
    </div>
  `;

  if (currentUser) {
    await updateStreak(currentUser.uid);
    await awardPoints(currentUser.uid, points, `Exercise: ${exerciseState.type}`);
    await updateAccuracy(currentUser.uid, exerciseState.correct, exerciseState.total);
    await updateUserProgress(currentUser.uid, {
      wordsLearned: (userProfile?.progress?.wordsLearned || 0) + exerciseState.correct,
      totalExercisesCompleted: (userProfile?.progress?.totalExercisesCompleted || 0) + 1,
    });
    updateDailyQuestProgress(currentUser.uid, 'words_learned', exerciseState.correct * 0.5);
    updateDailyQuestProgress(currentUser.uid, 'exercises_done');
    if (isPerfect) await incrementPerfectScore(currentUser.uid);
    // Record errors for weak word tracking
    // currentExerciseQuestions.forEach((q, i) => { if (exerciseState.wrongIndices?.includes(i)) recordWordError(currentUser.uid, q.wordWordId || q.word || ''); });
    await saveExerciseResult(currentUser.uid, {
      type: exerciseState.type,
      categoryId: exerciseState.categoryId,
      score: exerciseState.correct,
      total: exerciseState.total,
      accuracy,
      timeSpent: elapsed,
      points,
    });
    const badges = await checkAndAwardBadges(currentUser.uid, { type: 'exercise_complete' });
    if (badges.length) {
      setTimeout(() => showCelebration(badges[0]), 1000);
    }
    if (isPerfect) {
      const perfectBadges = await checkAndAwardBadges(currentUser.uid, { type: 'perfect_score' });
      if (perfectBadges.length) {
        setTimeout(() => showCelebration(perfectBadges[0]), 2000);
      }
    }
  }

  if (isPerfect) showConfetti();
}

function startReviewSession() {
  if (!currentUser) { showToast('Sign in to review words!'); return; }
  const dueReviews = getDueReviews(userProfile?.progress);
  if (!dueReviews.length) { showToast('No words to review right now!'); return; }
  // Collect all words across categories that need review
  const allCats = getFullCategories();
  const reviewWords = [];
  dueReviews.forEach(wordId => {
    for (const cat of allCats) {
      const found = cat.words.find(w => (cat.id + '-' + w.word.toLowerCase().replace(/\s+/g, '-')) === wordId);
      if (found) { reviewWords.push({ word: found, categoryId: cat.id }); break; }
    }
  });
  if (!reviewWords.length) { showToast('No review words available'); return; }
  // Pick a random category from the review words
  const pick = reviewWords[Math.floor(Math.random() * reviewWords.length)];
  showToast('🔄 Starting review session...');
  handleStartExercise('multiple-choice', pick.categoryId);
}

function showCelebration(badge) {
  if (!badge) return;
  showConfetti();
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.frequency.setValueAtTime(523, ac.currentTime);
    osc.frequency.setValueAtTime(659, ac.currentTime + 0.1);
    osc.frequency.setValueAtTime(784, ac.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.4);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.4);
  } catch (e) {}
  const overlay = document.createElement('div');
  overlay.className = 'celebration-overlay';
  overlay.innerHTML = `
    <div class="celebration-modal">
      <div style="font-size:4rem;margin-bottom:16px">${badge.icon || '🏅'}</div>
      <h2>🎉 New Badge Earned!</h2>
      <h3 style="color:var(--primary);margin:8px 0">${badge.name}</h3>
      <p style="color:var(--text-light)">${badge.description}</p>
      <button class="btn btn-primary" style="margin-top:20px" onclick="this.closest('.celebration-overlay').remove()">Awesome!</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function handleStartExercise(type, categoryId) {
  const cat = getCategory(categoryId);
  if (!cat) { showToast('Category not found'); return; }
  const root = document.getElementById('page-content');
  if (!root) return;
  renderExercise(root, { type, categoryId });
}

function renderQuiz(el, params) {
  const cat = getCategory(params.categoryId);
  if (!cat) { navigateTo('categories'); return; }

  const quiz = startQuiz(cat);

  el.innerHTML = `
    <div class="quiz-container container">
      <div class="card">
        <div class="quiz-header">
          <div style="font-size:3rem;margin-bottom:12px">🎯</div>
          <h1>${cat.name} Quiz</h1>
          <p style="color:var(--text-light)">Test what you've learned!</p>
          <div class="quiz-info">
            <div class="quiz-info-item">
              <div class="qii-value">${quiz.totalQuestions}</div>
              <div class="qii-label">Questions</div>
            </div>
            <div class="quiz-info-item">
              <div class="qii-value">${formatTime(quiz.timeLimit)}</div>
              <div class="qii-label">Time Limit</div>
            </div>
            <div class="quiz-info-item">
              <div class="qii-value">${quiz.passingScore}%</div>
              <div class="qii-label">Pass Score</div>
            </div>
            <div class="quiz-info-item">
              <div class="qii-value">${quiz.pointsAvailable}</div>
              <div class="qii-label">Points Max</div>
            </div>
          </div>
          <button class="btn btn-primary btn-lg" onclick="startQuizSession('${cat.id}')">Start Quiz!</button>
        </div>
      </div>
    </div>
  `;
}

function startQuizSession(categoryId) {
  const cat = getCategory(categoryId);
  if (!cat) return;
  startQuiz(cat);
  renderQuizQuestion(document.getElementById('page-content'));
}

let quizAnswers = [];

function renderQuizQuestion(el) {
  if (!currentQuiz || currentQuiz.currentIndex >= currentQuiz.questions.length) {
    finishQuizAndShowResult(el);
    return;
  }

  const q = currentQuiz.questions[currentQuiz.currentIndex];
  const progress = getQuizProgress();
  const timeLeft = Math.max(0, currentQuiz.timeLimit - getQuizElapsed());

  if (timeLeft <= 0) {
    finishQuizAndShowResult(el);
    return;
  }

  let qHTML = '';
  if (q.type === 'mcq') {
    qHTML = `
      <div class="exercise-question">
        <h2>${q.question}</h2>
        <div class="options-grid">
          ${q.options.map((opt, i) => `
            <button class="option-btn" onclick="handleQuizMCQ(this, ${i})">${opt}</button>
          `).join('')}
        </div>
      </div>
    `;
  } else if (q.type === 'fill') {
    qHTML = `
      <div class="exercise-question" style="text-align:center">
        <h2>${q.question}</h2>
        ${q.hint ? `<p style="color:var(--text-light);margin-bottom:12px">💡 Hint: ${q.hint}</p>` : ''}
        <input type="text" class="fill-blank-input" id="quiz-fill" placeholder="Type your answer..." onkeydown="if(event.key==='Enter')handleQuizFill()">
      </div>
      <button class="btn btn-primary" onclick="handleQuizFill()" style="width:100%">Submit</button>
    `;
  } else if (q.type === 'spelling') {
    qHTML = `
      <div class="exercise-question" style="text-align:center">
        <div style="font-size:3rem;margin-bottom:12px">🔤</div>
        <h2>${q.question}</h2>
        ${q.hint ? `<p style="color:var(--text-light);margin-bottom:12px">💡 Hint: starts with "${q.hint}"</p>` : ''}
        <input type="text" class="fill-blank-input" id="quiz-spelling" placeholder="Type the word..." onkeydown="if(event.key==='Enter')handleQuizSpelling()">
      </div>
      <button class="btn btn-primary" onclick="handleQuizSpelling()" style="width:100%">Submit</button>
    `;
  } else if (q.type === 'sentence') {
    const parts = q.parts || [];
    quizAnswers = [];
    qHTML = `
      <div class="exercise-question" style="text-align:center">
        <h2>${q.question}</h2>
        <div class="sentence-parts" id="quiz-sentence-parts">
          ${parts.map((p, i) => `<button class="sentence-part" data-idx="${i}" onclick="quizSentenceSelect(this)">${p}</button>`).join('')}
        </div>
        <div id="quiz-sentence-answer" style="min-height:48px;border:2px dashed var(--border);border-radius:var(--radius-sm);padding:12px;font-size:1.2rem;margin-bottom:12px"></div>
        <div style="display:flex;gap:12px;justify-content:center">
          <button class="btn btn-sm btn-outline" onclick="quizSentenceClear()">Clear</button>
          <button class="btn btn-sm btn-primary" onclick="handleQuizSentence()">Submit</button>
        </div>
      </div>
    `;
  } else if (q.type === 'match') {
    qHTML = `
      <div class="exercise-question">
        <h2 style="text-align:center">${q.question}</h2>
        <div class="match-grid">
          <div class="match-left">
            ${q.pairs.map((p, i) => `
              <div class="match-item" data-side="left" data-idx="${i}" onclick="handleQuizMatch(this)">${p.word}</div>
            `).join('')}
          </div>
          <div class="match-right">
            ${shuffleArray([...q.pairs]).map((p, i) => `
              <div class="match-item" data-side="right" data-idx="${i}" data-word="${p.word}" onclick="handleQuizMatch(this)">${p.definition}</div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  el.innerHTML = `
    <div class="quiz-container container">
      <div class="exercise-header">
        <span style="font-weight:600">🎯 Quiz: ${currentQuiz.categoryName}</span>
        <span>Question ${currentQuiz.currentIndex + 1}/${currentQuiz.questions.length}</span>
        <span style="color:${timeLeft < 60 ? 'var(--error)' : 'var(--text-light)'}">⏱️ ${formatTime(timeLeft)}</span>
      </div>
      <div class="exercise-progress">
        <div class="exercise-progress-fill" style="width:${progress}%"></div>
      </div>
      <div class="card" style="padding:32px">
        ${qHTML}
      </div>
    </div>
  `;

  if (q.type === 'fill') setTimeout(() => document.getElementById('quiz-fill')?.focus(), 100);
  if (q.type === 'spelling') setTimeout(() => document.getElementById('quiz-spelling')?.focus(), 100);
}

function handleQuizMCQ(btn, selectedIdx) {
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  const q = currentQuiz.questions[currentQuiz.currentIndex];
  const correct = selectedIdx === q.correctIndex;

  btn.classList.add(correct ? 'correct' : 'incorrect');
  if (!correct) {
    document.querySelectorAll('.option-btn')[q.correctIndex]?.classList.add('correct');
  }

  submitQuizAnswer(currentQuiz.currentIndex, selectedIdx);
  setTimeout(() => renderQuizQuestion(document.getElementById('page-content')), 800);
}

function handleQuizFill() {
  const input = document.getElementById('quiz-fill');
  if (!input) return;
  const answer = input.value.trim();
  submitQuizAnswer(currentQuiz.currentIndex, answer);
  input.style.borderColor = 'var(--success)';
  setTimeout(() => renderQuizQuestion(document.getElementById('page-content')), 500);
}

function handleQuizSpelling() {
  const input = document.getElementById('quiz-spelling');
  if (!input) return;
  const answer = input.value.trim();
  submitQuizAnswer(currentQuiz.currentIndex, answer);
  input.style.borderColor = 'var(--success)';
  setTimeout(() => renderQuizQuestion(document.getElementById('page-content')), 500);
}

let quizSentenceSelected = [];

function quizSentenceSelect(el) {
  if (el.classList.contains('used')) return;
  el.classList.add('used');
  quizSentenceSelected.push(el.textContent);
  document.getElementById('quiz-sentence-answer').textContent = quizSentenceSelected.join(' ');
}

function quizSentenceClear() {
  document.querySelectorAll('#quiz-sentence-parts .sentence-part.used').forEach(el => el.classList.remove('used'));
  quizSentenceSelected = [];
  document.getElementById('quiz-sentence-answer').textContent = '';
}

function handleQuizSentence() {
  const answer = quizSentenceSelected.join(' ');
  submitQuizAnswer(currentQuiz.currentIndex, answer);
  quizSentenceClear();
  setTimeout(() => renderQuizQuestion(document.getElementById('page-content')), 500);
}

const quizMatchState = { left: null };

function handleQuizMatch(el) {
  const side = el.dataset.side;
  if (side === 'left') {
    if (quizMatchState.left) quizMatchState.left.classList.remove('selected');
    quizMatchState.left = el;
    el.classList.add('selected');
  } else {
    if (!quizMatchState.left) return;
    const leftWord = quizMatchState.left.textContent;
    const rightWord = el.dataset.word;
    const correct = leftWord === rightWord;

    if (correct) {
      quizMatchState.left.classList.add('matched');
      el.classList.add('matched');
      quizMatchState.left = null;
      submitQuizAnswer(currentQuiz.currentIndex, leftWord);
      const allRight = document.querySelectorAll('.match-item[data-side="right"]');
      const allLeft = document.querySelectorAll('.match-item[data-side="left"]');
      if (Array.from(allRight).every(r => r.classList.contains('matched')) &&
          Array.from(allLeft).every(l => l.classList.contains('matched'))) {
        setTimeout(() => renderQuizQuestion(document.getElementById('page-content')), 500);
      }
    } else {
      el.classList.add('incorrect');
      quizMatchState.left.classList.add('incorrect');
      setTimeout(() => {
        el.classList.remove('incorrect', 'selected');
        quizMatchState.left.classList.remove('incorrect', 'selected');
        quizMatchState.left = null;
      }, 600);
    }
  }
}

async function finishQuizAndShowResult(el) {
  const result = finishQuiz();
  if (!result) return;

  let rewards = [];
  if (currentUser) {
    await updateStreak(currentUser.uid);

    if (result.passed) {
      let points = result.tier === 'gold' ? 300 : result.tier === 'silver' ? 200 : 150;
      if (result.percentage === 100) points += 50;
      await awardPoints(currentUser.uid, points, `Quiz passed: ${result.categoryName}`);
      rewards.push({ type: 'points', amount: points });

      await updateCategoryStars(currentUser.uid, result.categoryId, result.percentage);
      await updateDailyQuestProgress(currentUser.uid, 'quizzes_done');
      updateDailyQuestProgress(currentUser.uid, 'perfect_scores', result.percentage >= 100 ? 1 : 0);
      if (result.percentage === 100) await incrementPerfectScore(currentUser.uid);

      const badgeMap = {
        gold: { id: `quiz-gold-${result.categoryId}`, name: `${result.categoryName} Gold`, icon: '🥇', description: `Gold medal on ${result.categoryName} quiz!` },
        silver: { id: `quiz-silver-${result.categoryId}`, name: `${result.categoryName} Silver`, icon: '🥈', description: `Silver medal on ${result.categoryName} quiz!` },
        bronze: { id: `quiz-bronze-${result.categoryId}`, name: `${result.categoryName} Bronze`, icon: '🥉', description: `Bronze medal on ${result.categoryName} quiz!` },
      };
      const badge = badgeMap[result.tier];
      if (badge) {
        await addBadge(currentUser.uid, badge);
        rewards.push({ type: 'badge', ...badge });
        await checkAndAwardBadges(currentUser.uid, { type: result.percentage >= 90 ? 'quiz_gold' : 'quiz_pass' });
      }
    } else {
      updateDailyQuestProgress(currentUser.uid, 'quiz_attempts');
    }

    await saveExerciseResult(currentUser.uid, {
      type: 'quiz',
      categoryId: result.categoryId,
      score: result.correctCount,
      total: result.total,
      accuracy: result.percentage,
      timeSpent: result.timeSpent,
      passed: result.passed,
      points: rewards.reduce((s, r) => s + (r.amount || 0), 0),
    });
  }

  let hasBadge = rewards.some(r => r.type === 'badge');

  el.innerHTML = `
    <div class="quiz-container container">
      <div class="card" style="padding:48px">
        <div class="quiz-result">
          <div class="icon">${result.passed ? '🎉' : '😅'}</div>
          <h2>${result.passed ? 'Congratulations!' : 'Keep Trying!'}</h2>
          <div class="score">${result.percentage}%</div>
          <div style="margin-bottom:16px">
            <span style="display:inline-block;padding:6px 20px;border-radius:20px;font-weight:700;font-size:1.1rem;
              background:${result.passed ? 'var(--primary-light)' : '#FFEBEE'};
              color:${result.passed ? 'var(--primary-dark)' : 'var(--error)'}">
              ${result.passed ? `✅ PASSED${result.tier === 'gold' ? ' (Gold!)' : result.tier === 'silver' ? ' (Silver!)' : ''}` : '❌ Needs Improvement'}
            </span>
          </div>
          <div class="details">
            ${result.correctCount}/${result.total} correct · ${formatTime(result.timeSpent)} · ${result.score} points earned
          </div>
          ${rewards.length ? `
            <div style="background:var(--bg);border-radius:var(--radius-sm);padding:16px;margin-bottom:20px">
              <strong>Rewards:</strong>
              ${rewards.map(r => r.type === 'points' ? `<div>⭐ +${r.amount} points</div>` : `<div>${r.icon || '🏅'} New badge: ${r.name}</div>`).join('')}
            </div>
          ` : ''}
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="handleStartQuiz('${result.categoryId}')">🔄 Retake Quiz</button>
            <button class="btn btn-outline" onclick="navigateTo('category',{id:'${result.categoryId}'})">Back to Category</button>
            <button class="btn btn-secondary" onclick="navigateTo('dashboard')">Dashboard</button>
          </div>
        </div>
      </div>
    </div>
  `;

  if (result.percentage >= 90) showConfetti();
  if (hasBadge) {
    setTimeout(() => showCelebration(rewards.find(r => r.type === 'badge')), 500);
  }
}

function handleStartQuiz(categoryId) {
  const root = document.getElementById('page-content');
  if (!root) return;
  renderQuiz(root, { categoryId });
}

function renderQuizResult(el) {
  renderDashboard(el);
}

function renderProgress(el) {
  el.innerHTML = `
    <div class="progress-page container">
      <h1 style="margin-bottom:24px">📊 Your Progress</h1>
      <div class="stats-grid">
        <div class="card stat-card">
          <div class="stat-value">${userProfile?.progress?.wordsLearned || 0}</div>
          <div class="stat-label">Words Learned</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">${(userProfile?.progress?.badges || []).length}</div>
          <div class="stat-label">Badges</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">${userProfile?.progress?.currentStreak || 0}</div>
          <div class="stat-label">Day Streak</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">${userProfile?.progress?.averageAccuracy || 0}%</div>
          <div class="stat-label">Accuracy</div>
        </div>
      </div>

      <div class="level-progress" style="margin-top:24px">
        <h3>Level Progress</h3>
        <p style="color:var(--text-light);margin-bottom:8px">${getLevel(userProfile?.progress?.totalPoints || 0).icon} ${getLevel(userProfile?.progress?.totalPoints || 0).name} - Level ${getLevel(userProfile?.progress?.totalPoints || 0).level}</p>
        <div class="level-bar">
          <div class="level-bar-fill" style="width:${getLevelProgress(userProfile?.progress?.totalPoints || 0)}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px">
          <span>${userProfile?.progress?.totalPoints || 0} XP</span>
          ${(() => { const n = getNextLevel(userProfile?.progress?.totalPoints || 0); return n ? `${n.pointsRequired} XP needed` : 'Max Level!'; })()}
        </div>
      </div>

      <div style="margin-top:32px">
        <h3 style="margin-bottom:16px">All Categories</h3>
        <div class="card-grid">
          ${getFullCategories().map(c => `
            <div class="card category-card" onclick="navigateTo('category',{id:'${c.id}'})" style="display:flex;align-items:center;gap:12px;text-align:left;padding:16px">
              <span style="font-size:2rem">${c.icon}</span>
              <div>
                <h4 style="margin-bottom:2px">${c.name}</h4>
                <span style="font-size:0.85rem;color:var(--text-light)">${c.words.length} words</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderBadges(el) {
  const userBadges = userProfile?.progress?.badges || [];

  el.innerHTML = `
    <div class="badges-page container">
      <h1 style="margin-bottom:8px">🏅 Badges</h1>
      <p style="color:var(--text-light);margin-bottom:24px">${userBadges.length} of ${BADGE_DEFS.length} earned</p>

      <div class="badge-category">
        <h3>🏆 Achievements</h3>
        <div class="badge-grid">
          ${BADGE_DEFS.filter(b => b.category === 'achievement').map(b => {
            const earned = userBadges.find(ub => ub.id === b.id);
            return `
              <div class="badge-item ${earned ? '' : 'locked'}">
                <div class="icon">${b.icon}</div>
                <h4>${b.name}</h4>
                <p>${b.description}</p>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="badge-category">
        <h3>✨ Special</h3>
        <div class="badge-grid">
          ${BADGE_DEFS.filter(b => b.category === 'special').map(b => {
            const earned = userBadges.find(ub => ub.id === b.id);
            return `
              <div class="badge-item ${earned ? '' : 'locked'}">
                <div class="icon">${b.icon}</div>
                <h4>${b.name}</h4>
                <p>${b.description}</p>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderProfile(el) {
  el.innerHTML = `
    <div class="settings-page container">
      <div class="card" style="text-align:center;padding:40px">
        <div style="font-size:4rem;margin-bottom:12px">👤</div>
        <h2>${userProfile?.displayName || 'Learner'}</h2>
        <p style="color:var(--text-light)">${currentUser?.email || ''}</p>
        <div style="margin-top:8px">
          <span style="display:inline-block;padding:4px 16px;background:var(--primary-light);border-radius:20px;font-size:0.9rem;font-weight:600">
            ${getLevel(userProfile?.progress?.totalPoints || 0).icon} ${getLevel(userProfile?.progress?.totalPoints || 0).name}
          </span>
        </div>
        <button class="btn btn-danger btn-sm" style="margin-top:20px" onclick="handleSignOut()">Sign Out</button>
      </div>
    </div>
  `;
}

function renderLeaderboard(el) {
  el.innerHTML = `
    <div class="leaderboard-page container">
      <h1 style="margin-bottom:24px">🏆 Leaderboard</h1>
      <div class="empty-state">
        <div class="icon">👥</div>
        <h3>Leaderboard Coming Soon</h3>
        <p>Compete with other learners to see who can earn the most points!</p>
      </div>
    </div>
  `;
}

function renderSettings(el) {
  el.innerHTML = `
    <div class="settings-page container">
      <h1 style="margin-bottom:24px">⚙️ Settings</h1>
      <div class="card">
        <div class="setting-item">
          <div><strong>Sound Effects</strong><p style="font-size:0.9rem;color:var(--text-light)">Play sounds during exercises</p></div>
          <div class="toggle active" id="toggle-sound" onclick="toggleSetting('sound')"></div>
        </div>
        <div class="setting-item">
          <div><strong>Theme</strong><p style="font-size:0.9rem;color:var(--text-light)">Light / Dark mode</p></div>
          <select class="form-input" style="width:auto;padding:8px" onchange="changeTheme(this.value)">
            <option value="light">☀️ Light</option>
            <option value="dark">🌙 Dark</option>
          </select>
        </div>
        <div class="setting-item" style="border:none">
          <div><strong>Account</strong></div>
          <button class="btn btn-danger btn-sm" onclick="handleSignOut()">Sign Out</button>
        </div>
      </div>
    </div>
  `;
}

function toggleSetting() {}
function changeTheme(val) { showToast(`Theme: ${val} mode`); }

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  try {
    const result = await signIn(email, password);
    if (result.success) {
      navigateTo('dashboard');
    } else {
      errorEl.textContent = result.error;
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const errorEl = document.getElementById('signup-error');

  if (!name || !email || !password) {
    errorEl.textContent = 'Please fill in all fields';
    errorEl.style.display = 'block';
    return;
  }

  try {
    const result = await signUp(email, password, name);
    if (result.success) {
      navigateTo('dashboard');
    } else {
      errorEl.textContent = result.error;
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
}

async function handleSignOut() {
  await signOut();
  render(document.getElementById('app'));
}

function flipFlashcard() {
  const flashcard = document.getElementById('flashcard');
  const back = document.getElementById('flashcard-back');
  if (flashcard && back) {
    flashcard.classList.toggle('flipped');
    back.style.display = back.style.display === 'none' ? 'block' : 'none';
  }
}

registerRoutes({
  'landing': { render: renderLanding, auth: false },
  'login': { render: renderLogin, auth: false },
  'signup': { render: renderSignup, auth: false },
  'dashboard': { render: renderDashboard, auth: true },
  'categories': { render: renderCategories, auth: true },
  'category': { render: renderCategory, auth: true },
  'word': { render: renderWord, auth: true },
  'exercise': { render: renderExercise, auth: true },
  'quiz': { render: renderQuiz, auth: true },
  'quiz-result': { render: renderQuizResult, auth: true },
  'progress': { render: renderProgress, auth: true },
  'badges': { render: renderBadges, auth: true },
  'profile': { render: renderProfile, auth: true },
  'leaderboard': { render: renderLeaderboard, auth: true },
  'settings': { render: renderSettings, auth: true },
});
