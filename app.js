// APP STATE
const STORAGE_KEY = "mathlab-profile-v2";
const STARTER_STATE = {
  route: "onboarding",
  onboarded: false,
  studentName: "",
  estimatedGrade: null,
  placementBand: "",
  placementScore: 0,
  xp: 0,
  streak: 0,
  level: 1,
  currentWorld: "percentages",
  selectedPower: "percent-25",
  practiceMode: "quick",
  practice: { correct: 0, attempted: 0, streak: 0, history: [], weakSkill: "fraction-percent" },
  challengeScores: {},
  masteredSkills: ["percent-10", "percent-5", "percent-25", "mul-10", "mul-100", "divisibility-2"],
  skillMastery: {
    calculation: 82,
    fractions: 61,
    percentages: 48,
    algebra: 39,
    geometry: 54,
    numberSense: 76,
    money: 46,
    problemSolving: 73,
    mentalMath: 69,
    estimation: 58
  },
  notes: [],
  mistakes: [],
  powerUses: {},
  dailyMission: { completed: 0, target: 5 },
  settings: { reducedMotion: false, theme: "dark" }
};

let state = normalizeState(loadState());
let activeQuestion = null;
let challengeRun = null;
let toastTimerId = null;
let questionTimerId = null;
let mysteryIndex = 0;
let onboarding = { index: 0, score: 0, answers: [], done: false };

// CONTENT
const navItems = [
  ["home", "⌂", "Home"],
  ["journey", "◇", "Journey"],
  ["powers", "⚡", "Powers"],
  ["real", "₹", "Real Life"],
  ["explore", "✦", "Explore"],
  ["practice", "◎", "Practice"],
  ["tools", "▣", "Tools"],
  ["notebook", "▤", "Notebook"],
  ["challenges", "♛", "Challenges"],
  ["progress", "◌", "Progress"]
];

const onboardingQuestions = [
  {
    band: "Grades 3-4",
    skill: "numberSense",
    question: "Round 1: What is 36 + 47?",
    answer: "83",
    choices: ["73", "83", "93", "74"],
    why: "36 + 47 = 36 + 40 + 7 = 83."
  },
  {
    band: "Grades 3-5",
    skill: "calculation",
    question: "Lightning Mental Math: 8 x 25 = ?",
    answer: "200",
    choices: ["100", "160", "200", "250"],
    why: "25 is a quarter of 100, so 8 quarters of 100 is 200."
  },
  {
    band: "Grades 4-6",
    skill: "fractions",
    question: "Fraction Face-Off: Which fraction equals 1/2?",
    answer: "3/6",
    choices: ["2/6", "3/6", "4/6", "6/3"],
    why: "3 out of 6 parts is half."
  },
  {
    band: "Grades 5-7",
    skill: "percentages",
    question: "Percent Power: What is 25% of 240?",
    answer: "60",
    choices: ["24", "48", "60", "120"],
    why: "25% is one quarter, and 240 / 4 = 60."
  },
  {
    band: "Grades 6-8",
    skill: "problemSolving",
    question: "Strategy Pick: fastest way for 98 x 97?",
    answer: "Near-100",
    choices: ["Repeated addition", "Near-100", "Guessing", "Counting backward"],
    why: "Both numbers are close to 100, so near-100 multiplication is efficient."
  },
  {
    band: "Grades 7-9",
    skill: "algebra",
    question: "Mystery Number: x + 7 = 19. What is x?",
    answer: "12",
    choices: ["10", "11", "12", "26"],
    why: "Undo +7 by subtracting 7 from 19."
  },
  {
    band: "Grades 8-10",
    skill: "geometry",
    question: "Angle Arena: Two angles in a triangle are 50° and 60°. The third is...",
    answer: "70°",
    choices: ["60°", "70°", "80°", "110°"],
    why: "Triangle angles add to 180°, so 180 - 50 - 60 = 70."
  }
];

const worlds = [
  { id: "number", name: "Number Sense", icon: "NS", state: "mastered", col: 3, row: 1, skills: ["divisibility-2", "divisibility-3", "factors", "primes", "patterns"] },
  { id: "calculation", name: "Calculation", icon: "CP", state: "mastered", col: 3, row: 2, skills: ["mul-5", "mul-25", "mul-50", "near-100", "doubling"] },
  { id: "fractions", name: "Fractions", icon: "FR", state: "available", col: 2, row: 3, skills: ["fraction-bars", "equivalent-fractions", "quarter-sense"] },
  { id: "squares", name: "Squares", icon: "SQ", state: "available", col: 4, row: 3, skills: ["square-ending-5", "near-100-square"] },
  { id: "percentages", name: "Percentages", icon: "%", state: "learning", col: 3, row: 4, skills: ["percent-10", "percent-5", "percent-1", "percent-25", "fraction-percent", "percentage-flip"] },
  { id: "money", name: "Money", icon: "₹", state: "available", col: 4, row: 5, skills: ["discount", "profit-loss", "simple-interest"] },
  { id: "algebra", name: "Algebra", icon: "x", state: "locked", col: 3, row: 6, skills: ["mystery-number", "balance-equations", "linear-equations"] },
  { id: "geometry", name: "Geometry", icon: "△", state: "locked", col: 3, row: 7, skills: ["angles", "area", "coordinates"] },
  { id: "arena", name: "Challenge Arena", icon: "BA", state: "locked", col: 3, row: 8, skills: ["mixed-boss"] }
];

const powers = [
  power("percent-10", "10% power", "Percentages", "10% is divide by 10.", "10% of 360", "360 / 10 = 36", "Use when the percent is 10 or when building 5%, 20%, 30%."),
  power("percent-5", "5% power", "Percentages", "5% is half of 10%.", "5% of 480", "10% is 48, half is 24", "Use for discounts, tips, and building 15% or 25%."),
  power("percent-1", "1% power", "Percentages", "1% is divide by 100.", "1% of 750", "750 / 100 = 7.5", "Use to build any percent from small parts."),
  power("percent-25", "25% power", "Percentages", "25% is one quarter.", "25% of 240", "240 / 4 = 60", "Use when a quarter is easier than multiplying by 25."),
  power("fraction-percent", "Fraction -> percent", "Percentages", "Turn familiar fractions into percents.", "3/4 as a percent", "1/4 = 25%, so 3/4 = 75%", "Use when a fraction has halves, quarters, fifths, or tenths."),
  power("percentage-flip", "Percentage flip", "Percentages", "a% of b equals b% of a.", "8% of 25", "25% of 8 = 2", "Use when the flipped version is easier."),
  power("mul-5", "Multiply by 5", "Multiplication", "Multiply by 10, then halve.", "68 x 5", "680 / 2 = 340", "Use when halving is easier than repeated addition."),
  power("mul-25", "Multiply by 25", "Multiplication", "Multiply by 100, then divide by 4.", "48 x 25", "4800 / 4 = 1200", "Use with numbers that divide cleanly by 4."),
  power("mul-50", "Multiply by 50", "Multiplication", "Multiply by 100, then halve.", "36 x 50", "3600 / 2 = 1800", "Use for money and measurement questions."),
  power("mul-100", "Multiply by 100", "Multiplication", "Shift place value two places.", "73 x 100", "7300", "Use as a building block for 25 and 50."),
  power("near-100", "Near-100 multiplication", "Multiplication", "Use distances from 100.", "98 x 97", "95 | 06 = 9506", "Use when both numbers are close to 100."),
  power("doubling", "Doubling and halving", "Multiplication", "Double one factor and halve the other.", "25 x 48", "50 x 24 = 1200", "Use when one factor becomes friendlier."),
  power("square-ending-5", "Squares ending in 5", "Squares", "For 35², multiply 3 by 4 and attach 25.", "35²", "3 x 4 = 12, attach 25 = 1225", "Use only for numbers ending in 5."),
  power("near-100-square", "Near-100 squares", "Squares", "Use (100 - a)².", "98²", "10000 - 400 + 4 = 9604", "Use for numbers near 100."),
  power("divisibility-3", "Divisibility by 3", "Number Sense", "A number is divisible by 3 if its digit sum is.", "342", "3 + 4 + 2 = 9, so yes", "Use before factoring or simplifying."),
  power("primes", "Prime explorer", "Number Sense", "A prime has exactly two factors.", "29", "Only 1 and 29", "Use to understand factors and multiples."),
  power("discount", "Discount power", "Money", "Pay 100% minus the discount.", "25% off 800", "Pay 75% = 600", "Use for shopping and sale questions."),
  power("profit-loss", "Profit/loss", "Money", "Compare change with cost price.", "Buy 200, sell 240", "Profit = 40, profit% = 20%", "Use in money word problems."),
  power("simple-interest", "Simple interest", "Money", "Interest = P x R x T / 100.", "1000 at 10% for 2 years", "200", "Use when interest does not compound."),
  power("mystery-number", "Mystery number", "Algebra", "Undo operations to reveal x.", "x + 7 = 15", "x = 8", "Use when an unknown is hidden.")
];

const practiceModes = [
  ["quick", "Quick Fire", "Timed generated questions."],
  ["accuracy", "Accuracy", "No timer; hints encouraged."],
  ["streak", "Streak", "One mistake breaks the run."],
  ["trick", "Trick Mode", "Choose the smartest strategy."],
  ["mistake", "Find Mistake", "Diagnose a wrong solution."],
  ["reverse", "Reverse", "Work backward from the answer."],
  ["boss", "Boss Battle", "Mixed mastered skills."]
];

const challenges = [
  { id: "daily", title: "Daily Challenge", size: 5, mode: "accuracy", reward: 80 },
  { id: "speed", title: "Speed Challenge", size: 6, mode: "quick", reward: 110 },
  { id: "accuracy", title: "Accuracy Challenge", size: 10, mode: "accuracy", reward: 140 },
  { id: "mixed", title: "Mixed Challenge", size: 8, mode: "boss", reward: 150 },
  { id: "weekly", title: "Weekly Boss", size: 12, mode: "boss", reward: 250 }
];

const mysteries = [
  { title: "Trick Hunter: 999 x 37", prompt: "Can you find a faster way than long multiplication?", reveal: "1000 x 37 - 37 = 37000 - 37 = 36963", answer: "36963" },
  { title: "Percentage Flip", prompt: "Which is easier: 8% of 25 or 25% of 8?", reveal: "They are equal. 25% of 8 is 2, so 8% of 25 is also 2.", answer: "2" },
  { title: "Number Pattern", prompt: "2, 6, 12, 20, 30, ?", reveal: "The jumps are 4, 6, 8, 10, so the next jump is 12. Answer: 42.", answer: "42" },
  { title: "Impossible Maths", prompt: "Can 50% of a positive number be larger than the number?", reveal: "No. 50% is half. It can only be larger when the original number is negative.", answer: "no" }
];

const realWorldScenarios = [
  {
    id: "petrol-3l",
    category: "Petrol",
    title: "Petrol station math",
    setup: "Petrol costs ₹115.62 per litre. You need 3 litres.",
    question: "How much will you pay?",
    answer: "346.86",
    close: "350",
    tags: ["decimal", "multiplication", "unit rate", "estimation"],
    strategy: "Break 115.62 x 3 into 100 x 3 + 15 x 3 + 0.62 x 3.",
    explanation: "300 + 45 + 1.86 = ₹346.86. A sensible estimate is about ₹350."
  },
  {
    id: "shirt-discount",
    category: "Shopping",
    title: "Sale sign challenge",
    setup: "A shirt costs ₹1,800. The shop gives 15% off.",
    question: "How much will you pay?",
    answer: "1530",
    close: "1500",
    tags: ["percentage", "discount", "10% + 5%", "money"],
    strategy: "Find 10% and 5%, then subtract both from the original price.",
    explanation: "10% is ₹180 and 5% is ₹90. Discount = ₹270. Final price = ₹1,530."
  },
  {
    id: "travel-fuel",
    category: "Travel",
    title: "Road trip fuel",
    setup: "A car travels 240 km. Mileage is 18 km per litre.",
    question: "Approximately how many litres are needed?",
    answer: "13.33",
    close: "13",
    tags: ["division", "estimation", "unit rate", "travel"],
    strategy: "Use 240 ÷ 18. Since 18 x 13 = 234, the answer is a little more than 13.",
    explanation: "240 ÷ 18 = 13.33 litres approximately."
  },
  {
    id: "grocery-750",
    category: "Grocery",
    title: "750 gram price",
    setup: "Rice costs ₹120 per kg. You buy 750 g.",
    question: "How much should it cost?",
    answer: "90",
    close: "90",
    tags: ["fractions", "unit price", "money", "measurement"],
    strategy: "750 g is 3/4 kg. Find 3/4 of ₹120.",
    explanation: "1/4 of 120 is 30, so 3/4 is ₹90."
  },
  {
    id: "restaurant-tax-tip",
    category: "Restaurant",
    title: "Bill estimate",
    setup: "A restaurant bill is ₹840. Tax is 5% and tip is 10%.",
    question: "Approximately how much should you pay?",
    answer: "966",
    close: "970",
    tags: ["percentage", "estimation", "money", "10% + 5%"],
    strategy: "10% of 840 is 84. 5% is 42. Add both to 840.",
    explanation: "840 + 84 + 42 = ₹966, approximately ₹970."
  }
];

function power(id, title, category, why, challenge, reveal, when) {
  return { id, title, category, why, challenge, reveal, when };
}

// LOCAL STORAGE
function loadState() {
  try {
    return { ...structuredClone(STARTER_STATE), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return structuredClone(STARTER_STATE);
  }
}

function normalizeState(raw) {
  const merged = { ...structuredClone(STARTER_STATE), ...raw };
  merged.practice = { ...structuredClone(STARTER_STATE.practice), ...(raw.practice || {}) };
  merged.skillMastery = { ...structuredClone(STARTER_STATE.skillMastery), ...(raw.skillMastery || {}) };
  merged.challengeScores = { ...(raw.challengeScores || {}) };
  merged.notes = Array.isArray(raw.notes) ? raw.notes : [];
  merged.mistakes = Array.isArray(raw.mistakes) ? raw.mistakes : [];
  merged.powerUses = raw.powerUses || {};
  merged.dailyMission = { ...structuredClone(STARTER_STATE.dailyMission), ...(raw.dailyMission || {}) };
  merged.settings = { ...structuredClone(STARTER_STATE.settings), ...(raw.settings || {}) };
  return merged;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ROUTING
function routeTo(route) {
  state.route = route;
  saveState();
  location.hash = route;
  render();
}

function currentRoute() {
  if (!state.onboarded) return "onboarding";
  return (location.hash || "#home").replace("#", "") || "home";
}

// RENDERING
function render() {
  state.route = currentRoute();
  applyTheme();
  renderNav();
  renderTopStats();
  renderContext();
  const routes = {
    onboarding: renderOnboarding,
    home: renderHome,
    journey: renderJourney,
    powers: renderPowers,
    real: renderRealLife,
    explore: renderExplore,
    practice: renderPractice,
    tools: renderTools,
    notebook: renderNotebook,
    challenges: renderChallenges,
    progress: renderProgress
  };
  (routes[state.route] || renderHome)();
  bindSharedActions();
  saveState();
}

function renderNav() {
  const links = navItems.map(([id, icon, label]) => navLink(id, icon, label)).join("");
  byId("sideNav").innerHTML = links;
  byId("bottomNav").innerHTML = ["home", "journey", "real", "practice", "progress"].map(id => {
    const item = navItems.find(n => n[0] === id);
    return navLink(item[0], item[1], item[2]);
  }).join("");
}

function navLink(id, icon, label) {
  return `<a class="nav-link ${state.route === id ? "active" : ""}" href="#${id}" data-nav="${id}">
    <span class="nav-icon">${icon}</span><span>${label}</span>
  </a>`;
}

function renderTopStats() {
  state.level = Math.max(1, Math.floor(state.xp / 220) + 1);
  byId("levelText").textContent = state.level;
  byId("xpText").textContent = state.xp;
  byId("streakText").textContent = state.streak;
  updateThemeToggle();
}

function renderContext() {
  const pct = state.skillMastery.percentages;
  byId("contextScore").textContent = state.onboarded ? `${pct}%` : "Go";
  byId("contextLabel").textContent = state.onboarded ? "Percentages" : "Placement";
  byId("weakSpot").textContent = state.onboarded ? weakSkillLabel() : "Answer a few questions to find your starting level.";
  byId("nextUnlock").textContent = state.onboarded
    ? pct >= 70 ? "Reverse percentages and the weekly boss are ready." : "Master 25%, 10%, and fraction-percent links to unlock reverse percentages."
    : "The game show placement will personalize your MathLab journey.";
}

function renderOnboarding() {
  const q = onboardingQuestions[onboarding.index];
  const steps = onboardingQuestions.map((_, i) => `<span class="${i < onboarding.index || onboarding.done ? "done" : ""}"></span>`).join("");
  if (onboarding.done) {
    const result = placementResult(onboarding.score);
    view("", `
      <div class="onboarding-stage">
        <section class="show-host">
          <div class="host-content">
            <span class="eyebrow">MathLab placement complete</span>
            <h1>${escapeHtml(state.studentName || "Player")}, your arena is ready.</h1>
            <p>This is your real starting profile. MathLab will keep adapting as you practice.</p>
          </div>
        </section>
        <section class="quiz-stage reveal-panel">
          <div class="grade-badge">G${result.grade}</div>
          <h2>${result.band}</h2>
          <p>${result.message}</p>
          <div class="stats-grid">
            ${stat("Score", `${onboarding.score}/${onboardingQuestions.length}`, "Placement")}
            ${stat("Start", result.world, "Journey world")}
            ${stat("Power", result.powerTitle, "First unlock")}
          </div>
          <button class="btn primary" id="enterMathLab">Enter MathLab</button>
        </section>
      </div>
    `);
    byId("enterMathLab").addEventListener("click", finishOnboarding);
    return;
  }

  view("", `
    <div class="onboarding-stage">
      <section class="show-host">
        <div class="host-content">
          <span class="eyebrow">Welcome to the MathLab Game Show</span>
          <h1>Find your starting level.</h1>
          <p>Answer a few quick rounds. No pressure: this sets your journey, practice difficulty, and first recommended powers.</p>
          <div class="contestant">
            <label>Name
              <input id="studentName" value="${escapeAttr(state.studentName)}" placeholder="Your name" autocomplete="name">
            </label>
            <div class="stats-grid">
              ${stat("Round", `${onboarding.index + 1}/${onboardingQuestions.length}`, "Placement")}
              ${stat("Score", onboarding.score, "Correct")}
              ${stat("Band", q.band, "Question level")}
            </div>
          </div>
        </div>
      </section>
      <section class="quiz-stage">
        <div class="runway" style="--steps:${onboardingQuestions.length}">${steps}</div>
        <div class="question-card">
          <span class="eyebrow">${q.skill.replace(/([A-Z])/g, " $1")}</span>
          <div class="problem">${q.question}</div>
          <div class="podiums">
            ${q.choices.map(choice => `<button class="podium" data-onboarding-answer="${escapeAttr(choice)}">${choice}</button>`).join("")}
          </div>
          <div class="feedback" id="onboardingFeedback">Choose a podium answer.</div>
        </div>
      </section>
    </div>
  `);
  byId("studentName").addEventListener("input", (e) => {
    state.studentName = e.target.value.slice(0, 32);
    saveState();
  });
  document.querySelectorAll("[data-onboarding-answer]").forEach(btn => btn.addEventListener("click", () => gradeOnboarding(btn, q)));
}

function gradeOnboarding(btn, q) {
  const ok = normalize(btn.dataset.onboardingAnswer) === normalize(q.answer);
  document.querySelectorAll("[data-onboarding-answer]").forEach(option => {
    option.disabled = true;
    if (normalize(option.dataset.onboardingAnswer) === normalize(q.answer)) option.classList.add("correct");
  });
  btn.classList.add(ok ? "correct" : "wrong");
  if (ok) onboarding.score += 1;
  onboarding.answers.push({ skill: q.skill, ok });
  feedback("onboardingFeedback", `${ok ? "Correct." : "Good try."} ${q.why}`, ok ? "good" : "try");
  setTimeout(() => {
    onboarding.index += 1;
    if (onboarding.index >= onboardingQuestions.length) {
      onboarding.done = true;
      applyPlacement();
    }
    renderOnboarding();
  }, 850);
}

function placementResult(score) {
  if (score <= 2) return { grade: 4, band: "Grades 3-4 foundation path", world: "Number Sense", power: "mul-5", powerTitle: "Multiply by 5", message: "You will begin with number sense, friendly multiplication, and visual fractions." };
  if (score <= 4) return { grade: 6, band: "Grades 5-6 builder path", world: "Percentages", power: "percent-25", powerTitle: "25% Power", message: "You are ready for percentages, fraction links, and mental calculation powers." };
  if (score <= 6) return { grade: 8, band: "Grades 7-8 strategy path", world: "Algebra", power: "near-100", powerTitle: "Near-100 Multiplication", message: "You can handle strategy selection, reverse questions, and early algebra." };
  return { grade: 10, band: "Grades 9-10 challenge path", world: "Challenge Arena", power: "percentage-flip", powerTitle: "Percentage Flip", message: "You are ready for boss battles, mixed reasoning, and advanced shortcuts." };
}

function applyPlacement() {
  const result = placementResult(onboarding.score);
  const worldMap = { "Number Sense": "number", Percentages: "percentages", Algebra: "algebra", "Challenge Arena": "arena" };
  state.estimatedGrade = result.grade;
  state.placementBand = result.band;
  state.placementScore = onboarding.score;
  state.currentWorld = worldMap[result.world] || "percentages";
  state.selectedPower = result.power;
  state.level = Math.max(1, result.grade - 2);
  state.xp = result.grade * 120;
  state.streak = 1;
  state.skillMastery.numberSense = clamp(35 + onboarding.score * 8, 20, 92);
  state.skillMastery.calculation = clamp(30 + onboarding.score * 9, 18, 94);
  state.skillMastery.fractions = clamp(24 + scoreForSkill("fractions") * 18, 15, 80);
  state.skillMastery.percentages = clamp(22 + scoreForSkill("percentages") * 20, 12, 82);
  state.skillMastery.algebra = clamp(18 + scoreForSkill("algebra") * 22, 10, 78);
  state.skillMastery.geometry = clamp(20 + scoreForSkill("geometry") * 20, 10, 78);
  state.practice.weakSkill = firstMissedSkill() || "fraction-percent";
  saveState();
}

function finishOnboarding() {
  state.onboarded = true;
  state.route = "home";
  addNote("Profile", `Placement: ${state.placementBand}. Starting power: ${powers.find(p => p.id === state.selectedPower)?.title || "Percent Power"}.`);
  saveState();
  location.hash = "home";
  render();
}

function scoreForSkill(skill) {
  return onboarding.answers.filter(a => a.skill === skill && a.ok).length;
}

function firstMissedSkill() {
  const missed = onboarding.answers.find(a => !a.ok);
  const map = {
    numberSense: "divisibility-3",
    calculation: "mul-25",
    fractions: "fraction-percent",
    percentages: "percent-25",
    problemSolving: "percentage-flip",
    algebra: "mystery-number",
    geometry: "angles"
  };
  return missed ? map[missed.skill] : null;
}

function renderHome() {
  const selected = powers.find(p => p.id === state.selectedPower) || powers[0];
  const scenario = realWorldScenarios[0];
  view("number", `
    <div class="hero-grid">
      <section class="headline">
        <span class="eyebrow">Good ${dayPart()}${state.studentName ? `, ${escapeHtml(state.studentName)}` : ""} - Grade ${state.estimatedGrade || state.level} path</span>
        <h1>Math Base</h1>
        <p>Ready to sharpen your math powers? Continue your journey, discover today's strategy, and use it in a real situation.</p>
        <div class="actions">
          <button class="btn primary" data-go="journey">Continue journey</button>
          <button class="btn" data-go="real">Real Life Math</button>
          <button class="btn" data-go="practice">Start mission</button>
        </div>
      </section>
      <section class="world-visual" aria-label="Math world">
        <div class="orbit"></div><div class="orbit two"></div>
        <div class="planet a">₹</div><div class="planet b">%</div><div class="planet c">1/4</div>
        <div class="mission">
          <span class="eyebrow">Continue your journey</span>
          <h2>${worldName(state.currentWorld)}</h2>
          <p>Skill ${Math.min(4 + state.practice.correct, 8)} of 8. Next unlock: ${escapeHtml(selected.title)}.</p>
        </div>
      </section>
    </div>
    <section class="home-grid">
      <article class="module spotlight">
        <span class="eyebrow">Today's power</span>
        <h2>${escapeHtml(selected.title)}</h2>
        <p>${escapeHtml(selected.why)}</p>
        <div class="formula">${escapeHtml(selected.challenge)} → ${escapeHtml(selected.reveal)}</div>
        <div class="actions"><button class="btn primary" data-go="powers" data-select-power="${selected.id}">Open power</button><button class="btn" data-start-practice="${selected.id}">Practice</button></div>
      </article>
      <article class="module real-mini">
        <span class="eyebrow">Real life challenge</span>
        <h2>${scenario.title}</h2>
        <p>${scenario.setup}</p>
        <strong>${scenario.question}</strong>
        <div class="actions"><button class="btn primary" data-go="real">Calculate</button><button class="btn" data-save-note="Real Life Math: ${escapeAttr(scenario.setup)}">Save</button></div>
      </article>
      <article class="module">
        <span class="eyebrow">Daily mission</span>
        <h2>${state.dailyMission.completed}/${state.dailyMission.target} complete</h2>
        <p>2 calculation powers, 2 reasoning questions, 1 real-world problem.</p>
        <div class="progress"><div class="bar" style="width:${state.dailyMission.completed / state.dailyMission.target * 100}%"></div></div>
      </article>
    </section>
    <section class="module">
      <div class="section-title"><div><h2>Your Math DNA</h2><p>Tap into the exact skill that needs work.</p></div><button class="btn" data-go="progress">Full profile</button></div>
      ${miniDna()}
    </section>
  `);
}

function renderJourney() {
  view("number", `
    <div class="section-title">
      <div><span class="eyebrow">Map of mastery</span><h1>Journey</h1><p>Click a world to inspect skills, continue learning, and unlock the next area.</p></div>
      <button class="btn primary" data-go="powers" data-select-power="percent-25">Continue percentages</button>
    </div>
    <div class="map">${worlds.map(renderWorldNode).join("")}</div>
    <div class="module" id="worldDetail">${renderWorldDetail(state.currentWorld)}</div>
  `);
  document.querySelectorAll("[data-world]").forEach(btn => btn.addEventListener("click", () => {
    state.currentWorld = btn.dataset.world;
    saveState();
    byId("worldDetail").innerHTML = renderWorldDetail(state.currentWorld);
    bindSharedActions();
  }));
}

function renderWorldNode(w) {
  const visualState = w.id === state.currentWorld ? "learning" : w.state;
  return `<button class="node ${visualState}" data-world="${w.id}" style="grid-column:${w.col};grid-row:${w.row};--node-a:${nodeColors(w.id)[0]};--node-b:${nodeColors(w.id)[1]}">
    <span class="dot">${w.icon}</span>
    <strong>${w.name}</strong>
    <small>${visualState}</small>
  </button>`;
}

function renderWorldDetail(id) {
  const world = worlds.find(w => w.id === id) || worlds[0];
  const skillRows = world.skills.map(skill => `<span class="badge">${skillLabel(skill)}: ${skillState(skill)}</span>`).join("");
  return `<div class="section-title"><div><h2>${world.name}</h2><p>${world.state === "locked" ? "Locked, but visible so the student knows what is coming." : "Available skills in this world."}</p></div><button class="btn" data-go="powers">Open powers</button></div><div class="actions">${skillRows}</div>`;
}

function renderPowers() {
  const selected = powers.find(p => p.id === state.selectedPower) || powers[0];
  view(categoryClass(selected.category), `
    <div class="section-title">
      <div><span class="eyebrow">Math powers library</span><h1>${selected.title}</h1><p>${selected.why}</p></div>
      <button class="btn primary" data-start-practice="${selected.id}">Practice this</button>
    </div>
    <div class="split">
      <aside class="module">
        <label>Category
          <select id="powerFilter">
            <option>All</option>${unique(powers.map(p => p.category)).map(c => `<option ${c === selected.category ? "selected" : ""}>${c}</option>`).join("")}
          </select>
        </label>
        <div class="list" id="powerList">${renderPowerList("All")}</div>
      </aside>
      <section class="module">
        <span class="eyebrow">Challenge</span>
        <div class="formula">${selected.challenge}</div>
        <div class="learn-lab">
          <div>
            <h2>Discovery</h2>
            <div class="steps">
              <div class="step"><b>1</b><span>Try the problem first.</span></div>
              <div class="step"><b>2</b><span>${selected.reveal}</span></div>
              <div class="step"><b>3</b><span>${selected.why}</span></div>
              <div class="step"><b>4</b><span>${selected.when}</span></div>
            </div>
          </div>
          <div>
            ${selected.id.includes("percent") ? percentageVisual() : multiplicationVisual()}
            <button class="btn" data-save-note="Power: ${escapeAttr(selected.title)} - ${escapeAttr(selected.why)}">Save to notebook</button>
          </div>
        </div>
      </section>
    </div>
  `);
  byId("powerFilter").addEventListener("change", (e) => {
    byId("powerList").innerHTML = renderPowerList(e.target.value);
    bindPowerButtons();
  });
  bindPowerButtons();
}

function renderPowerList(filter) {
  return powers.filter(p => filter === "All" || p.category === filter).map(p => `
    <button class="btn power-btn" data-power="${p.id}" aria-pressed="${p.id === state.selectedPower}">
      <span>${p.title}<br><small>${p.category}</small></span>
      <span class="status ${state.masteredSkills.includes(p.id) ? "done" : ""}">${state.masteredSkills.includes(p.id) ? "mastered" : "learn"}</span>
    </button>
  `).join("");
}

function renderRealLife() {
  const selectedId = state.currentScenario || realWorldScenarios[0].id;
  const scenario = realWorldScenarios.find(s => s.id === selectedId) || realWorldScenarios[0];
  state.currentScenario = scenario.id;
  view("realworld", `
    <div class="section-title">
      <div><span class="eyebrow">Math Vision</span><h1>Real Life Math</h1><p>Recognize the mathematics inside shopping, petrol, travel, food, time, sports, and money.</p></div>
      <button class="btn primary" data-start-real-practice="${scenario.id}">Practice transfer</button>
    </div>
    <div class="split">
      <aside class="module">
        <h2>Scenario deck</h2>
        <div class="list">
          ${realWorldScenarios.map(s => `<button class="btn power-btn" data-scenario="${s.id}" aria-pressed="${s.id === scenario.id}"><span>${s.title}<br><small>${s.category}</small></span><span class="status">${s.tags[0]}</span></button>`).join("")}
        </div>
      </aside>
      <section class="module scenario-stage">
        <span class="eyebrow">${scenario.category}</span>
        <h2>${scenario.title}</h2>
        <p>${scenario.setup}</p>
        <div class="vision-tags">${scenario.tags.map(tag => `<span class="badge">${tag}</span>`).join("")}</div>
        <div class="real-visual">${realVisual(scenario)}</div>
        <div class="question-card">
          <strong>${scenario.question}</strong>
          <label>First estimate
            <input id="realEstimate" inputmode="decimal" placeholder="What should it be close to?">
          </label>
          <label>Exact answer
            <input id="realAnswer" inputmode="decimal" placeholder="Now calculate exactly">
          </label>
          <div class="actions">
            <button class="btn primary" id="checkReal">Check answer</button>
            <button class="btn" id="showRealStrategy">Show strategy</button>
            <button class="btn" data-save-note="Real Life Math: ${escapeAttr(scenario.title)} - ${escapeAttr(scenario.strategy)}">Save</button>
          </div>
          <div class="feedback" id="realFeedback">Estimate first. This builds number sense before exact calculation.</div>
        </div>
      </section>
    </div>
  `);
  document.querySelectorAll("[data-scenario]").forEach(btn => btn.addEventListener("click", () => {
    state.currentScenario = btn.dataset.scenario;
    saveState();
    renderRealLife();
  }));
  byId("showRealStrategy").addEventListener("click", () => feedback("realFeedback", `${scenario.strategy} ${scenario.explanation}`, "try"));
  byId("checkReal").addEventListener("click", () => checkRealScenario(scenario));
}

function checkRealScenario(scenario) {
  const estimate = Number(byId("realEstimate").value);
  const exact = Number(byId("realAnswer").value);
  const answer = Number(scenario.answer);
  const close = Number(scenario.close);
  const estimateOk = Number.isFinite(estimate) && Math.abs(estimate - close) <= Math.max(5, close * .12);
  const exactOk = Number.isFinite(exact) && Math.abs(exact - answer) < .05;
  if (estimateOk && exactOk) {
    state.xp += 35;
    state.dailyMission.completed = Math.min(state.dailyMission.target, state.dailyMission.completed + 1);
    bumpMastery("real-transfer", 5);
    feedback("realFeedback", `Excellent. You estimated first and calculated exactly. ${scenario.explanation}`, "good");
    toast("Transfer success +35 XP");
  } else if (estimateOk) {
    feedback("realFeedback", `Good estimate. Now tighten the exact calculation: ${scenario.strategy}`, "try");
  } else {
    feedback("realFeedback", `Start with sense-making. A good estimate is near ${scenario.close}. ${scenario.strategy}`, "try");
    logMistake("Estimation error", scenario.title, "Estimate did not match the situation size.");
  }
  saveState();
  renderTopStats();
  renderContext();
}

function realVisual(scenario) {
  if (scenario.category === "Petrol") {
    return `<div class="petrol-meter"><span></span><span></span><span></span></div><p>3 litres x ₹115.62 per litre</p>`;
  }
  if (scenario.category === "Shopping") {
    return `<div class="price-flow"><strong>₹1800</strong><span>-15%</span><strong>?</strong></div>`;
  }
  if (scenario.category === "Travel") {
    return `<div class="route-line"><span>240 km</span><span>18 km/l</span></div>`;
  }
  return `<div class="price-flow"><strong>unit</strong><span>x</span><strong>quantity</strong></div>`;
}

function percentageVisual() {
  return `<div class="tool-visual"><div><div class="fraction-circle" style="--slice:25%"></div><p>25% fills one quarter of the circle: 1 part out of 4.</p></div></div>`;
}

function multiplicationVisual() {
  return `<div class="tool-visual"><div><div class="formula">x25 = x100 / 4</div><p>Make the number 100 times bigger, then split it into four equal parts.</p></div></div>`;
}

function renderExplore() {
  const m = mysteries[mysteryIndex % mysteries.length];
  view("geometry", `
    <div class="section-title">
      <div><span class="eyebrow">Discovery playground</span><h1>Explore</h1><p>Short interactive mysteries that begin with curiosity, not formulas.</p></div>
      <button class="btn" id="nextMystery">Next mystery</button>
    </div>
    <div class="learn-lab">
      <section class="module">
        <h2>${m.title}</h2>
        <p>${m.prompt}</p>
        <div class="answer-row"><input id="mysteryAnswer" placeholder="Try an answer or strategy" aria-label="Mystery answer"><button class="btn primary" id="checkMystery">Check</button></div>
        <div class="feedback" id="mysteryFeedback">Experiment first. Reveal when ready.</div>
        <div class="actions"><button class="btn" id="revealMystery">Reveal idea</button><button class="btn" data-save-note="Discovery: ${escapeAttr(m.title)}">Save discovery</button></div>
      </section>
      <section class="module">
        <h2>Pattern board</h2>
        ${patternBoard()}
      </section>
    </div>
  `);
  byId("nextMystery").addEventListener("click", () => { mysteryIndex += 1; renderExplore(); });
  byId("revealMystery").addEventListener("click", () => feedback("mysteryFeedback", m.reveal, "good"));
  byId("checkMystery").addEventListener("click", () => {
    const val = byId("mysteryAnswer").value.trim().toLowerCase();
    feedback("mysteryFeedback", val.includes(m.answer) ? `Yes. ${m.reveal}` : "Not quite yet. Look for a friendlier version of the problem.", val.includes(m.answer) ? "good" : "try");
  });
}

function patternBoard() {
  return `<div class="bar-model" style="--parts:9">${Array.from({ length: 9 }, (_, i) => `<span class="${i < 4 ? "fill" : ""}"></span>`).join("")}</div>
    <div class="stats-grid">${[9,18,27].map((n, i) => stat(`${i + 1}x9`, n, "Digit sum 9")).join("")}</div>`;
}

function renderPractice() {
  clearInterval(questionTimerId);
  activeQuestion = activeQuestion || makeQuestion(state.practiceMode);
  activeQuestion.hintIndex = activeQuestion.hintIndex || 0;
  view("arena", `
    <div class="section-title">
      <div><span class="eyebrow">Practice engine</span><h1>Practice Arena</h1><p>${adaptiveMessage()}</p></div>
      <button class="btn" id="newQuestion">New question</button>
    </div>
    <div class="practice-layout">
      <section class="module">
        <div class="mode-row">${practiceModes.map(([id, label]) => `<button class="chip" data-mode="${id}" aria-pressed="${state.practiceMode === id}">${label}</button>`).join("")}</div>
        <div class="badge" id="timerBadge">${state.practiceMode === "quick" ? "15s" : "No timer"}</div>
        <div class="practice-rhythm"><span class="badge">Challenge</span><span class="badge">Try</span><span class="badge">Hint</span><span class="badge">Insight</span><span class="badge">Transfer</span></div>
        <div class="problem">${activeQuestion.question}</div>
        <div id="answerArea">${renderAnswerArea(activeQuestion)}</div>
        <div class="feedback" id="practiceFeedback">${activeQuestion.hints[0]}</div>
      </section>
      <aside class="module">
        <h2>Live mastery</h2>
        <div class="stats-grid">
          ${stat("✓", state.practice.correct, "Correct")}
          ${stat("◎", state.practice.attempted, "Attempted")}
          ${stat("🔥", state.practice.streak, "Streak")}
        </div>
        <p>Weak spot: <strong>${weakSkillLabel()}</strong></p>
        <div class="progress" role="progressbar" aria-label="Percentage mastery" aria-valuenow="${state.skillMastery.percentages}" aria-valuemin="0" aria-valuemax="100"><div class="bar" style="width:${state.skillMastery.percentages}%"></div></div>
        <div class="actions"><button class="btn primary" id="hintBtn">Hint level 1</button><button class="btn" id="saveMistake">Save mistake</button></div>
      </aside>
    </div>
  `);
  bindPractice();
  startQuestionTimer();
}

function renderAnswerArea(q) {
  if (q.type === "numeric") {
    return `<div class="answer-row"><input id="numericAnswer" inputmode="decimal" aria-label="Answer"><button class="btn primary" id="submitAnswer">Submit</button></div>`;
  }
  return `<div class="choices">${q.choices.map(c => `<button class="choice" data-choice="${escapeAttr(c)}">${c}</button>`).join("")}</div>`;
}

function bindPractice() {
  document.querySelectorAll("[data-mode]").forEach(btn => btn.addEventListener("click", () => {
    state.practiceMode = btn.dataset.mode;
    activeQuestion = makeQuestion(state.practiceMode);
    renderPractice();
  }));
  byId("newQuestion").addEventListener("click", () => { activeQuestion = makeQuestion(state.practiceMode); renderPractice(); });
  byId("hintBtn").addEventListener("click", () => {
    const hint = activeQuestion.hints[Math.min(activeQuestion.hintIndex, activeQuestion.hints.length - 1)];
    activeQuestion.hintIndex += 1;
    byId("hintBtn").textContent = activeQuestion.hintIndex >= activeQuestion.hints.length ? "Show final hint" : `Hint level ${activeQuestion.hintIndex + 1}`;
    feedback("practiceFeedback", hint, "try");
  });
  byId("saveMistake").addEventListener("click", () => addNote("Mistake", `${activeQuestion.question} - ${activeQuestion.explanation}`));
  const submit = byId("submitAnswer");
  if (submit) submit.addEventListener("click", () => gradeAnswer(byId("numericAnswer").value));
  document.querySelectorAll("[data-choice]").forEach(btn => btn.addEventListener("click", () => gradeAnswer(btn.dataset.choice, btn)));
}

function gradeAnswer(raw, btn) {
  if (activeQuestion.locked) return;
  activeQuestion.locked = true;
  clearInterval(questionTimerId);
  const ok = normalize(raw) === normalize(activeQuestion.answer);
  state.practice.attempted += 1;
  if (ok) {
    state.practice.correct += 1;
    state.practice.streak += 1;
    state.streak = Math.max(state.streak, state.practice.streak);
    state.xp += activeQuestion.difficulty * 12;
    bumpMastery(activeQuestion.skill, 4 + activeQuestion.difficulty);
    if (!state.masteredSkills.includes(activeQuestion.skill) && skillScore(activeQuestion.skill) >= 75) state.masteredSkills.push(activeQuestion.skill);
    feedback("practiceFeedback", `Correct. ${activeQuestion.explanation}`, "good");
    toast(`+${activeQuestion.difficulty * 12} XP`);
  } else {
    state.practice.streak = 0;
    state.practice.weakSkill = activeQuestion.skill;
    bumpMastery(activeQuestion.skill, -2);
    feedback("practiceFeedback", `Not quite. ${activeQuestion.hints[0]} ${activeQuestion.explanation}`, "try");
    logMistake("Concept error", activeQuestion.question, activeQuestion.explanation);
  }
  if (btn) btn.classList.add(ok ? "correct" : "wrong");
  document.querySelectorAll("[data-choice]").forEach(c => {
    c.disabled = true;
    if (normalize(c.dataset.choice) === normalize(activeQuestion.answer)) c.classList.add("correct");
  });
  state.practice.history.unshift({ ok, skill: activeQuestion.skill, at: Date.now() });
  state.practice.history = state.practice.history.slice(0, 30);
  saveState();
  renderTopStats();
  renderContext();
}

function startQuestionTimer() {
  if (state.practiceMode !== "quick") return;
  let remaining = 15;
  byId("timerBadge").textContent = `${remaining}s`;
  questionTimerId = setInterval(() => {
    remaining -= 1;
    const badge = byId("timerBadge");
    if (badge) badge.textContent = `${remaining}s`;
    if (remaining <= 0) {
      clearInterval(questionTimerId);
      activeQuestion.locked = true;
      state.practice.attempted += 1;
      state.practice.streak = 0;
      document.querySelectorAll("[data-choice], #submitAnswer").forEach(control => control.disabled = true);
      feedback("practiceFeedback", `Time. ${activeQuestion.explanation}`, "try");
      saveState();
      renderTopStats();
      renderContext();
    }
  }, 1000);
}

function renderTools() {
  view("fraction", `
    <div class="section-title"><div><span class="eyebrow">Interactive lab</span><h1>Number Tools</h1><p>Use visual tools to experiment with numbers, fractions, percentages, factors, primes, squares, algebra, and geometry.</p></div></div>
    <div class="tool-grid">
      ${tool("Multiplication explorer", `<label>A<input id="mulA" type="number" value="48"></label><label>B<input id="mulB" type="number" value="25"></label><div class="feedback" id="mulOut"></div>`)}
      ${tool("Number line", `<label>Value<input id="lineVal" type="range" min="-50" max="50" value="25"></label><div class="tool-visual"><div class="number-line"><span class="number-marker" id="lineMarker">25</span></div></div>`)}
      ${tool("Fraction visualizer", `<label>Numerator<input id="num" type="range" min="1" max="12" value="1"></label><label>Denominator<input id="den" type="range" min="2" max="12" value="4"></label><div id="fracOut"></div>`)}
      ${tool("Percentage visualizer", `<label>Percent<input id="pct" type="range" min="0" max="100" value="25"></label><label>Of number<input id="pctBase" type="number" value="240"></label><div class="feedback" id="pctOut"></div>`)}
      ${tool("Factor and prime explorer", `<label>Number<input id="factorN" type="number" value="48"></label><div class="factor-cloud" id="factorOut"></div>`)}
      ${tool("Square explorer", `<label>n<input id="sqN" type="range" min="2" max="12" value="5"></label><div class="tool-visual"><div id="squareOut"></div></div>`)}
      ${tool("Algebra balance", `<label>x + <input id="addN" type="number" value="7"></label><label>= <input id="totalN" type="number" value="15"></label><div class="feedback" id="algOut"></div>`)}
      ${tool("Geometry playground", `<label>Triangle height<input id="triH" type="range" min="30" max="130" value="80"></label><div class="tool-visual geometry-box" id="geoOut"></div>`)}
      ${tool("Estimation tool", `<label>Estimate 49 x 21<input id="estimate" type="number" placeholder="Your estimate"></label><div class="feedback" id="estimateOut">Try rounding to 50 x 20.</div>`)}
    </div>
  `);
  bindTools();
}

function tool(title, body) {
  return `<section class="module"><h2>${title}</h2>${body}</section>`;
}

function bindTools() {
  const update = () => {
    const a = num("mulA"), b = num("mulB");
    byId("mulOut").textContent = `${a} x ${b} = ${a * b}. Strategies: ${a} x (${b - b % 10} + ${b % 10}), or ${b === 25 ? `${a} x 100 / 4` : "break one number into friendly parts"}.`;
    const lv = num("lineVal");
    byId("lineMarker").style.left = `${8 + (lv + 50) * .84}%`;
    byId("lineMarker").textContent = lv;
    const n = num("num"), d = Math.max(2, num("den"));
    byId("fracOut").innerHTML = `<div class="fraction-circle" style="--slice:${n / d * 100}%"></div><div class="bar-model" style="--parts:${d}">${Array.from({ length: d }, (_, i) => `<span class="${i < n ? "fill" : ""}"></span>`).join("")}</div><p>${n}/${d} = ${Math.round(n / d * 100)}%</p>`;
    const pct = num("pct"), base = num("pctBase");
    byId("pctOut").textContent = `${pct}% of ${base} = ${base * pct / 100}`;
    const f = Math.max(1, Math.min(999, num("factorN")));
    const factors = [];
    for (let i = 1; i <= f; i++) if (f % i === 0) factors.push(i);
    byId("factorOut").innerHTML = factors.map(x => `<span>${x}</span>`).join("") + `<span>${factors.length === 2 ? "prime" : "composite"}</span>`;
    const sq = num("sqN");
    byId("squareOut").innerHTML = `<div class="square-grid" style="--n:${sq}">${Array.from({ length: sq * sq }, () => "<span></span>").join("")}</div><p>${sq}² = ${sq * sq}</p>`;
    byId("algOut").textContent = `x + ${num("addN")} = ${num("totalN")} means x = ${num("totalN") - num("addN")}.`;
    const h = num("triH");
    byId("geoOut").innerHTML = `<svg viewBox="0 0 220 160" role="img" aria-label="Triangle with adjustable height"><polygon points="30,140 190,140 110,${140 - h}" fill="rgba(87,228,209,.25)" stroke="#57e4d1" stroke-width="3"/><line x1="110" y1="${140 - h}" x2="110" y2="140" stroke="#f5c45a" stroke-width="3"/><text x="78" y="154" fill="#dbe8f6">base 160</text><text x="118" y="${142 - h / 2}" fill="#dbe8f6">h ${h}</text></svg><p>Area = 1/2 x 160 x ${h} = ${80 * h}</p>`;
    const est = num("estimate");
    if (byId("estimate").value) byId("estimateOut").textContent = Math.abs(est - 1029) <= 80 ? "Good estimate. Exact answer is 1029." : "Try rounding 49 to 50 and 21 to 20, so the estimate is near 1000.";
  };
  document.querySelectorAll("#view input").forEach(input => input.addEventListener("input", update));
  update();
}

function renderNotebook() {
  const mistakes = state.mistakes || [];
  view("number", `
    <div class="section-title"><div><span class="eyebrow">Personal collection</span><h1>Notebook</h1><p>Save powers, discoveries, mistakes, favorite problems, formulas, and your own observations.</p></div></div>
    <div class="notebook-grid">
      <section class="module">
        <label>Type<select id="noteType"><option>Discovery</option><option>Power</option><option>Mistake</option><option>Formula</option><option>Favorite problem</option></select></label>
        <label>Note<textarea id="noteText">25% means one quarter.</textarea></label>
        <button class="btn primary" id="addNote">Add note</button>
      </section>
      <section class="notes">
        <div class="module"><h2>My powers</h2>${state.notes.filter(n => n.type === "Power").map(renderNote).join("") || "<p>No saved powers yet.</p>"}</div>
        <div class="module"><h2>My discoveries</h2>${state.notes.filter(n => n.type !== "Power" && n.type !== "Mistake").map(renderNote).join("") || "<p>No discoveries saved yet.</p>"}</div>
        <div class="module"><h2>My mistakes</h2>${mistakes.map(renderMistake).join("") || "<p>No mistake patterns recorded yet. That is good data too.</p>"}</div>
      </section>
    </div>
  `);
  byId("addNote").addEventListener("click", () => addNote(byId("noteType").value, byId("noteText").value));
  document.querySelectorAll("[data-delete-note]").forEach(btn => btn.addEventListener("click", () => {
    state.notes = state.notes.filter(n => n.id !== btn.dataset.deleteNote);
    saveState();
    renderNotebook();
  }));
}

function renderMistake(mistake) {
  return `<article class="mistake-row"><span class="badge">${escapeHtml(mistake.type)}</span><strong>${escapeHtml(mistake.question)}</strong><p>${escapeHtml(mistake.explanation)}</p><small>${escapeHtml(mistake.date)}</small><button class="btn" data-start-practice="${escapeAttr(state.practice.weakSkill || "percent-25")}">Practice this</button></article>`;
}

function renderNote(note) {
  return `<article class="module note"><button class="btn delete-note" data-delete-note="${note.id}" aria-label="Delete note">x</button><span class="badge">${escapeHtml(note.type)}</span><p>${escapeHtml(note.text)}</p><small>${escapeHtml(note.date)}</small></article>`;
}

function renderChallenges() {
  view("arena", `
    <div class="section-title"><div><span class="eyebrow">Challenge arena</span><h1>Challenges</h1><p>Complete focused runs and beat personal records. Every button here starts a real challenge.</p></div></div>
    <div class="challenge-grid">${challenges.map(renderChallengeCard).join("")}</div>
  `);
  document.querySelectorAll("[data-challenge]").forEach(btn => btn.addEventListener("click", () => startChallenge(btn.dataset.challenge)));
}

function renderChallengeCard(c) {
  const completed = state.challengeScores[c.id] != null;
  return `<article class="challenge-card ${completed ? "completed" : ""}">
    <h3>${c.title}<span class="status ${completed ? "done" : ""}">${completed ? "Completed" : "Start"}</span></h3>
    <p>${c.size} questions. Reward up to ${c.reward} XP.</p>
    ${completed ? `<p class="record-line">Best score: <strong>${state.challengeScores[c.id]}%</strong></p>` : `<p class="record-line">First attempt waiting.</p>`}
    <button class="btn primary" data-challenge="${c.id}">${completed ? "Try again" : "Start"}</button>
  </article>`;
}

function startChallenge(id) {
  const c = challenges.find(x => x.id === id);
  challengeRun = { ...c, index: 0, correct: 0, questions: Array.from({ length: c.size }, () => makeQuestion(c.mode)) };
  renderChallengeModal();
}

function renderChallengeModal() {
  const mount = byId("challengeModal");
  if (!mount) return;
  if (!challengeRun) {
    mount.innerHTML = "";
    return;
  }
  const q = challengeRun.questions[challengeRun.index];
  const pct = Math.round(challengeRun.index / challengeRun.size * 100);
  mount.innerHTML = `
    <div class="modal-backdrop" data-close-challenge></div>
    <section class="challenge-modal" role="dialog" aria-modal="true" aria-labelledby="challengeTitle">
      <header class="challenge-modal-head">
        <div>
          <span class="eyebrow">Live challenge</span>
          <h2 id="challengeTitle">${challengeRun.title}</h2>
          <p>Question ${challengeRun.index + 1} of ${challengeRun.size} · Score ${challengeRun.correct}/${challengeRun.index}</p>
        </div>
        <button class="btn" type="button" data-close-challenge aria-label="Close challenge">Close</button>
      </header>
      <div class="progress" role="progressbar" aria-label="Challenge progress" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div class="bar" style="width:${pct}%"></div></div>
      <div class="challenge-modal-body">
        <div class="practice-rhythm"><span class="badge">Focus</span><span class="badge">Solve</span><span class="badge">Feedback</span><span class="badge">Next</span></div>
        <div class="problem">${q.question}</div>
        ${renderAnswerArea(q)}
        <div class="feedback" id="challengeFeedback">${q.hints[0]}</div>
      </div>
    </section>
  `;
  activeQuestion = q;
  const submit = byId("submitAnswer");
  if (submit) submit.addEventListener("click", () => gradeChallenge(byId("numericAnswer").value));
  document.querySelectorAll("[data-choice]").forEach(btn => btn.addEventListener("click", () => gradeChallenge(btn.dataset.choice)));
  document.querySelectorAll("[data-close-challenge]").forEach(btn => btn.addEventListener("click", closeChallengeModal));
  const firstInput = byId("numericAnswer") || document.querySelector("#challengeModal [data-choice]");
  if (firstInput) firstInput.focus();
}

function gradeChallenge(raw) {
  const ok = normalize(raw) === normalize(activeQuestion.answer);
  if (ok) challengeRun.correct += 1;
  document.querySelectorAll("#challengeModal [data-choice], #challengeModal #submitAnswer").forEach(control => control.disabled = true);
  feedback("challengeFeedback", ok ? `Correct. ${activeQuestion.explanation}` : `Not quite. ${activeQuestion.explanation}`, ok ? "good" : "try");
  setTimeout(() => {
    challengeRun.index += 1;
    if (challengeRun.index >= challengeRun.size) finishChallenge();
    else renderChallengeModal();
  }, 650);
}

function finishChallenge() {
  const score = Math.round(challengeRun.correct / challengeRun.size * 100);
  const reward = Math.round(challengeRun.reward * score / 100);
  state.xp += reward;
  state.challengeScores[challengeRun.id] = Math.max(score, state.challengeScores[challengeRun.id] || 0);
  const title = challengeRun.title;
  challengeRun = null;
  saveState();
  renderChallengeResult(title, score, reward);
  renderTopStats();
  renderContext();
  if (state.route === "challenges") renderChallenges();
}

function renderChallengeResult(title, score, reward) {
  const mount = byId("challengeModal");
  mount.innerHTML = `
    <div class="modal-backdrop" data-close-challenge></div>
    <section class="challenge-modal result" role="dialog" aria-modal="true" aria-labelledby="challengeResultTitle">
      <div class="reveal-panel">
        <span class="eyebrow">Challenge complete</span>
        <div class="grade-badge">${score}%</div>
        <h2 id="challengeResultTitle">${title}</h2>
        <p>${score >= 80 ? "New arena energy. That score shows real consistency." : "Good run. The mistakes are useful data for your next practice."}</p>
        <div class="stats-grid">
          ${stat("XP", `+${reward}`, "Earned")}
          ${stat("Best", bestScoreText(challenges.find(c => c.title === title)?.id || ""), "Record")}
          ${stat("Next", weakSkillLabel(), "Practice")}
        </div>
        <div class="actions">
          <button class="btn primary" data-close-challenge data-go="practice">Practice weak spot</button>
          <button class="btn" data-close-challenge>Back to challenges</button>
        </div>
      </div>
    </section>
  `;
  document.querySelectorAll("[data-close-challenge]").forEach(btn => btn.addEventListener("click", closeChallengeModal));
  bindSharedActions();
  toast(`${title} complete: ${score}%. +${reward} XP`);
}

function closeChallengeModal() {
  challengeRun = null;
  const mount = byId("challengeModal");
  if (mount) mount.innerHTML = "";
}

function renderProgress() {
  view("algebra", `
    <div class="section-title"><div><span class="eyebrow">My progress</span><h1>Math DNA</h1><p>Mastery is tracked by micro-skills, strengths, weak spots, challenge scores, and recent practice.</p></div></div>
    <div class="learn-lab">
      <section class="module dna">${dnaSvg()}</section>
      <section class="module"><h2>Skill diagnosis</h2>${diagnosisPanel()}<div class="actions"><button class="btn primary" data-go="practice">Practice weak spot</button><button class="btn" data-go="real">Try transfer</button></div></section>
    </div>
    <section class="module"><h2>Skill graph</h2>${skillRows()}</section>
    <section class="module"><h2>Records</h2><div class="stats-grid">${challenges.slice(0,3).map(c => stat(c.title, bestScoreText(c.id), "Best score")).join("")}</div></section>
  `);
}

// PRACTICE ENGINE
function makeQuestion(mode) {
  if (mode === "trick") return mc("strategy-near-100", "What is the smartest way to calculate 98 x 97?", "Near-100 strategy", ["Long multiplication", "Near-100 strategy", "Repeated addition", "Counting by 97"], "Both numbers are close to 100, so near-100 is built for this.", 3);
  if (mode === "mistake") return mc("percent-25", "A student says 25% of 240 = 240 / 2. What went wrong?", "They used 50%", ["They used 50%", "They divided by 4", "They rounded 240", "Nothing went wrong"], "25% is one quarter, not one half.", 2);
  if (mode === "reverse") {
    const part = randFrom([30, 45, 60, 90, 125]);
    return numeric("reverse-percent", `25% of what number is ${part}?`, part * 4, `25% is one quarter, so multiply ${part} by 4.`, 3);
  }
  if (mode === "boss") return randFrom([genPercent25(), genPercent10(), genMul25(), genFlip(), genDivisibility()]);
  if (mode === "quick") return randFrom([genPercent25(), genMul25(), genPercent10()]);
  if (mode === "streak") return randFrom([genPercent25(), genPercent5(), genMul25()]);
  const weak = state.practice.weakSkill;
  if (weak === "fraction-percent") return mc("fraction-percent", "3/4 as a percentage is...", "75%", ["25%", "50%", "75%", "300%"], "One quarter is 25%, so three quarters is 75%.", 2);
  return randFrom([genPercent25(), genPercent5(), genPercent10(), genFlip()]);
}

function genPercent25() {
  const n = randFrom([80, 120, 160, 200, 240, 320, 360, 480]);
  return numeric("percent-25", `25% of ${n}`, n / 4, `25% is one quarter. ${n} / 4 = ${n / 4}.`, 2);
}

function genPercent10() {
  const n = randFrom([120, 250, 360, 470, 800, 950]);
  return numeric("percent-10", `10% of ${n}`, n / 10, `10% means divide by 10.`, 1);
}

function genPercent5() {
  const n = randFrom([180, 240, 360, 480, 720]);
  return numeric("percent-5", `5% of ${n}`, n / 20, `5% is half of 10%.`, 2);
}

function genMul25() {
  const n = randFrom([32, 48, 64, 72, 88, 96, 124]);
  return numeric("mul-25", `${n} x 25`, n * 25, `Multiply by 100, then divide by 4.`, 2);
}

function genFlip() {
  return mc("percentage-flip", "8% of 25 equals...", "25% of 8", ["25% of 8", "8% of 8", "25% of 25", "80% of 25"], "a% of b equals b% of a, and the flipped version is easier.", 3);
}

function genDivisibility() {
  return mc("divisibility-3", "Is 342 divisible by 3?", "Yes", ["Yes", "No"], "3 + 4 + 2 = 9, and 9 is divisible by 3.", 1);
}

function numeric(skill, question, answer, explanation, difficulty) {
  return { type: "numeric", skill, question, answer: String(answer), hints: hintsFor(skill), explanation, difficulty };
}

function mc(skill, question, answer, choices, explanation, difficulty) {
  return { type: "choice", skill, question, answer, choices, hints: hintsFor(skill), explanation, difficulty };
}

// MASTERY ENGINE
function bumpMastery(skill, amount) {
  const bucket = bucketForSkill(skill);
  state.skillMastery[bucket] = clamp((state.skillMastery[bucket] || 40) + amount, 0, 100);
}

function skillScore(skill) {
  return state.skillMastery[bucketForSkill(skill)] || 0;
}

function bucketForSkill(skill) {
  if (skill.includes("real") || skill.includes("transfer") || skill.includes("estimate")) return "problemSolving";
  if (skill.includes("percent") || skill.includes("fraction")) return "percentages";
  if (skill.includes("mul") || skill.includes("strategy")) return "calculation";
  if (skill.includes("divisibility") || skill.includes("prime")) return "numberSense";
  if (skill.includes("discount") || skill.includes("profit") || skill.includes("interest")) return "money";
  if (skill.includes("algebra") || skill.includes("mystery")) return "algebra";
  return "problemSolving";
}

function weakSkillLabel() {
  return skillLabel(state.practice.weakSkill || "fraction-percent");
}

function adaptiveMessage() {
  const recentWrong = state.practice.history.slice(0, 5).filter(h => !h.ok).length;
  return recentWrong >= 2
    ? `We found a weak spot: ${weakSkillLabel()}. The engine will target that.`
    : "Choose a mode. Questions are generated from skill data and adapt to mistakes.";
}

// NOTEBOOK
function addNote(type, text) {
  const clean = String(text || "").trim();
  if (!clean) return;
  state.notes.unshift({ id: `note-${Date.now()}`, type, text: clean, date: new Date().toLocaleDateString() });
  state.notes = state.notes.slice(0, 30);
  saveState();
  toast("Saved to notebook.");
  if (state.route === "notebook") renderNotebook();
}

function logMistake(type, question, explanation) {
  state.mistakes = state.mistakes || [];
  state.mistakes.unshift({
    id: `mistake-${Date.now()}`,
    type,
    question,
    explanation,
    date: new Date().toLocaleDateString()
  });
  state.mistakes = state.mistakes.slice(0, 40);
  saveState();
}

// EVENT HANDLERS
function bindSharedActions() {
  document.querySelectorAll("[data-go]").forEach(btn => {
    if (btn.dataset.goBound) return;
    btn.dataset.goBound = "true";
    btn.addEventListener("click", () => routeTo(btn.dataset.go));
  });
  document.querySelectorAll("[data-select-power]").forEach(btn => btn.addEventListener("click", () => {
    state.selectedPower = btn.dataset.selectPower;
    routeTo("powers");
  }));
  document.querySelectorAll("[data-start-practice]").forEach(btn => btn.addEventListener("click", () => {
    state.practice.weakSkill = btn.dataset.startPractice;
    activeQuestion = null;
    routeTo("practice");
  }));
  document.querySelectorAll("[data-start-real-practice]").forEach(btn => btn.addEventListener("click", () => {
    state.practiceMode = "boss";
    state.practice.weakSkill = "real-transfer";
    activeQuestion = makeRealQuestion(realWorldScenarios.find(s => s.id === btn.dataset.startRealPractice) || realWorldScenarios[0]);
    routeTo("practice");
  }));
  document.querySelectorAll("[data-save-note]").forEach(btn => btn.addEventListener("click", () => addNote("Discovery", btn.dataset.saveNote)));
}

function bindPowerButtons() {
  document.querySelectorAll("[data-power]").forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "true";
    btn.addEventListener("click", () => {
      state.selectedPower = btn.dataset.power;
      saveState();
      renderPowers();
    });
  });
}

byId("quickPractice").addEventListener("click", () => routeTo("practice"));
byId("themeToggle").addEventListener("click", toggleTheme);
byId("levelInfo").addEventListener("click", () => toast(`${Math.max(0, state.level * 220 - state.xp)} XP to Level ${state.level + 1}.`));
byId("xpInfo").addEventListener("click", () => toast("XP comes from accuracy, transfer problems, challenges, and solving with fewer hints."));
byId("streakInfo").addEventListener("click", () => toast(`${state.streak} day streak. One short mission today keeps it alive.`));
window.addEventListener("hashchange", render);

// HELPERS
function view(kind, html) {
  byId("view").className = `screen ${kind}`;
  byId("view").innerHTML = html;
}

function applyTheme() {
  const theme = state.settings.theme === "light" ? "light" : "dark";
  document.body.dataset.theme = theme;
}

function toggleTheme() {
  state.settings.theme = state.settings.theme === "light" ? "dark" : "light";
  applyTheme();
  updateThemeToggle();
  saveState();
}

function updateThemeToggle() {
  const toggle = byId("themeToggle");
  const label = byId("themeText");
  if (!toggle || !label) return;
  const isLight = state.settings.theme === "light";
  label.textContent = isLight ? "Light" : "Dark";
  toggle.setAttribute("aria-pressed", String(isLight));
  toggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
}

function byId(id) {
  return document.getElementById(id);
}

function stat(icon, value, label) {
  return `<div class="stat"><strong>${icon} ${value}</strong><span>${label}</span></div>`;
}

function unique(arr) {
  return [...new Set(arr)];
}

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function num(id) {
  return Number(byId(id).value || 0);
}

function normalize(v) {
  return String(v).trim().toLowerCase().replace(/\s+/g, "");
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function hintFor(skill) {
  const hints = {
    "percent-25": "25% is the same as 1/4.",
    "percent-10": "10% means divide by 10.",
    "percent-5": "5% is half of 10%.",
    "mul-25": "Multiply by 100, then divide by 4.",
    "fraction-percent": "1/4 is 25%, 1/2 is 50%, 3/4 is 75%.",
    "percentage-flip": "Try flipping a% of b into b% of a.",
    "divisibility-3": "Add the digits and check if the sum is divisible by 3."
  };
  return hints[skill] || "Look for a friendlier number or a known relationship.";
}

function hintsFor(skill) {
  const first = hintFor(skill);
  const map = {
    "percent-25": [first, "Can you rewrite 25% as a fraction?", "25% = 1/4.", "Try dividing the number by 4."],
    "percent-10": [first, "Move one place value smaller.", "Divide the number by 10.", "Check whether your answer is one tenth of the original."],
    "percent-5": [first, "Find 10% first.", "Now halve that 10%.", "5% = 1/20."],
    "mul-25": [first, "25 = 100 / 4.", "Multiply by 100 first.", "Now divide the result by 4."],
    "fraction-percent": [first, "Convert one part first.", "1/4 = 25%.", "Scale the numerator."],
    "percentage-flip": [first, "Swap the percent and the number.", "Choose the easier direction.", "Example: 8% of 25 = 25% of 8."],
    "real-transfer": ["What math is hiding in the story?", "Look for unit rate, percentage, fraction, or estimation.", "Estimate before calculating exactly.", "Write the real-world units in the answer."]
  };
  return map[skill] || [first, "Break the problem into friendlier parts.", "Check the size of the answer.", "Now calculate carefully."];
}

function makeRealQuestion(scenario) {
  return {
    type: "numeric",
    skill: "real-transfer",
    question: `${scenario.category}: ${scenario.setup} ${scenario.question}`,
    answer: scenario.answer,
    hints: hintsFor("real-transfer"),
    explanation: scenario.explanation,
    difficulty: 3
  };
}

function skillLabel(skill) {
  return String(skill).replace(/-/g, " ").replace(/\b\w/g, ch => ch.toUpperCase());
}

function worldName(id) {
  return (worlds.find(w => w.id === id) || worlds[0]).name;
}

function skillState(skill) {
  if (state.masteredSkills.includes(skill)) return "mastered";
  if (skill === state.practice.weakSkill) return "needs practice";
  return skillScore(skill) > 55 ? "developing" : "available";
}

function categoryClass(category) {
  if (category === "Percentages" || category === "Squares") return "fraction";
  if (category === "Algebra") return "algebra";
  return "number";
}

function nodeColors(id) {
  const colors = {
    number: ["#57e4d1", "#73b8ff"],
    calculation: ["#f5c45a", "#ff7b6b"],
    fractions: ["#9a8cff", "#57e4d1"],
    squares: ["#f5c45a", "#9a8cff"],
    percentages: ["#75da8a", "#f5c45a"],
    money: ["#ff7b6b", "#f5c45a"],
    algebra: ["#9a8cff", "#ff7b6b"],
    geometry: ["#73b8ff", "#57e4d1"],
    arena: ["#ff6680", "#f5c45a"]
  };
  return colors[id] || colors.number;
}

function dayPart() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function bestScoreText(id) {
  return state.challengeScores[id] == null ? "new" : `${state.challengeScores[id]}%`;
}

function miniDna() {
  const rows = [
    ["Calculation", state.skillMastery.calculation],
    ["Fractions", state.skillMastery.fractions],
    ["Percentages", state.skillMastery.percentages],
    ["Problem Solving", state.skillMastery.problemSolving]
  ];
  return `<div class="list">${rows.map(([label, val]) => `<div><div class="section-title"><strong>${label}</strong><span>${val}%</span></div><div class="progress"><div class="bar" style="width:${val}%"></div></div></div>`).join("")}</div>`;
}

function skillRows() {
  return powers.map(p => {
    const s = skillState(p.id);
    return `<div class="step"><b>${state.masteredSkills.includes(p.id) ? "✓" : "•"}</b><span>${p.title}<br><small>${p.category} - ${s}</small></span></div>`;
  }).join("");
}

function diagnosisPanel() {
  const entries = Object.entries(state.skillMastery).sort((a, b) => a[1] - b[1]);
  const weak = entries.slice(0, 3);
  const strong = entries.slice(-3).reverse();
  return `
    <div class="diagnosis">
      <h3>Strong</h3>
      <div class="actions">${strong.map(([k, v]) => `<span class="badge">${skillLabel(k)} ${v}%</span>`).join("")}</div>
      <h3>Needs work</h3>
      <div class="list">${weak.map(([k, v]) => `<div><div class="section-title"><strong>${skillLabel(k)}</strong><span>${v}%</span></div><div class="progress"><div class="bar" style="width:${v}%"></div></div></div>`).join("")}</div>
      <p>Coach note: ${coachNote()}</p>
    </div>
  `;
}

function coachNote() {
  const recentMistakes = (state.mistakes || []).slice(0, 3);
  if (recentMistakes.length) return `Recent mistakes suggest ${recentMistakes[0].type.toLowerCase()}. Try one slow accuracy round before speed.`;
  if (state.skillMastery.percentages < 60) return "Percentages need transfer practice: discounts, petrol, and grocery questions.";
  return "You are ready for mixed problems where the strategy is not announced first.";
}

function dnaSvg() {
  const labels = ["Number", "Calc", "Fractions", "Percent", "Algebra", "Geometry", "Money", "Problems", "Mental", "Estimate"];
  const vals = [state.skillMastery.numberSense, state.skillMastery.calculation, state.skillMastery.fractions, state.skillMastery.percentages, state.skillMastery.algebra, state.skillMastery.geometry, state.skillMastery.money, state.skillMastery.problemSolving, state.skillMastery.mentalMath, state.skillMastery.estimation];
  const pts = vals.map((v, i) => {
    const a = -Math.PI / 2 + i * Math.PI * 2 / vals.length;
    const r = 118 * v / 100;
    return `${Math.cos(a) * r},${Math.sin(a) * r}`;
  }).join(" ");
  const axes = labels.map((l, i) => {
    const a = -Math.PI / 2 + i * Math.PI * 2 / labels.length;
    return `<line class="axis" x1="0" y1="0" x2="${Math.cos(a) * 126}" y2="${Math.sin(a) * 126}"></line><text text-anchor="middle" x="${Math.cos(a) * 145}" y="${Math.sin(a) * 145 + 4}">${l}</text>`;
  }).join("");
  return `<svg viewBox="-160 -160 320 320" role="img" aria-label="Math DNA radar chart"><circle class="ring" r="40"></circle><circle class="ring" r="80"></circle><circle class="ring" r="120"></circle>${axes}<polygon class="poly" points="${pts}"></polygon></svg>`;
}

function feedback(id, text, kind) {
  const el = byId(id);
  el.className = `feedback ${kind || ""}`;
  el.textContent = text;
}

function toast(text) {
  const el = byId("toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimerId);
  toastTimerId = setTimeout(() => el.classList.remove("show"), 2200);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]));
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/`/g, "&#096;");
}

render();
