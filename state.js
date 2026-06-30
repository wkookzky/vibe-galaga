(function () {
  const MG = (window.MiniGalaga = window.MiniGalaga || {});

  MG.canvas = document.getElementById("gameCanvas");
  MG.ctx = MG.canvas.getContext("2d");

  MG.dom = {
    scoreEl: document.getElementById("score"),
    stageEl: document.getElementById("stage"),
    livesEl: document.getElementById("lives"),
    powerupStateEl: document.getElementById("powerupState"),
    achievementCountEl: document.getElementById("achievementCount"),
    achievementToastEl: document.getElementById("achievementToast"),
    overlay: document.getElementById("overlay"),
    messageEl: document.getElementById("message"),
    startButton: document.getElementById("startButton")
  };

  MG.keys = {};
  MG.STORAGE_KEY = "mini-galaga-achievements";

  MG.achievementDefs = [
    { id: "first_blood", name: "First Blood", check: (game) => game.enemiesDestroyed >= 1 },
    { id: "power_surge", name: "Power Surge", check: (game) => game.powerupsCollected >= 1 },
    { id: "ace_pilot", name: "Ace Pilot", check: (game) => game.enemiesDestroyed >= 25 },
    { id: "boss_breaker", name: "Boss Breaker", check: (game) => game.bossesDefeated >= 1 },
    { id: "stage_five", name: "Stage Five", check: (game) => game.highestStage >= 5 },
    { id: "survivor", name: "Survivor", check: (game) => game.shieldBlocks >= 3 }
  ];

  MG.powerupExpiry = {
    spread: 0,
    rapid: 0
  };

  MG.stats = {
    enemiesDestroyed: 0,
    powerupsCollected: 0,
    bossesDefeated: 0,
    shieldBlocks: 0,
    highestStage: 1
  };

  MG.player = {
    x: MG.canvas.width / 2 - 22,
    y: MG.canvas.height - 58,
    width: 44,
    height: 28,
    speed: 5.2,
    shield: 0
  };

  MG.game = {
    animationId: null,
    lastShotAt: 0,
    enemyDirection: 1,
    enemyDrop: false,
    score: 0,
    stage: 1,
    lives: 3,
    state: "ready",
    boss: null,
    bullets: [],
    enemyBullets: [],
    enemies: [],
    stars: [],
    powerups: [],
    explosions: [],
    achievements: [],
    toastTimer: null,
    damageLocked: false
  };

  MG.loadAchievements = function loadAchievements() {
    try {
      const raw = localStorage.getItem(MG.STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  MG.saveAchievements = function saveAchievements() {
    try {
      localStorage.setItem(MG.STORAGE_KEY, JSON.stringify(MG.game.achievements));
    } catch {
      // Storage may be blocked; keep the in-memory state.
    }
  };

  MG.isEffectActive = function isEffectActive(type) {
    return performance.now() < MG.powerupExpiry[type];
  };

  MG.getPowerupState = function getPowerupState() {
    const active = [];
    if (MG.isEffectActive("rapid")) {
      active.push("Rapid");
    }
    if (MG.isEffectActive("spread")) {
      active.push("Spread");
    }
    if (MG.player.shield > 0) {
      active.push(`Shield x${MG.player.shield}`);
    }
    return active.length ? active.join(" / ") : "None";
  };

  MG.updateHud = function updateHud() {
    MG.dom.scoreEl.textContent = MG.game.score;
    MG.dom.stageEl.textContent = MG.game.stage;
    MG.dom.livesEl.textContent = MG.game.lives;
    MG.dom.powerupStateEl.textContent = MG.getPowerupState();
    MG.dom.achievementCountEl.textContent = `${MG.game.achievements.length}/${MG.achievementDefs.length}`;
  };

  MG.showOverlay = function showOverlay(message, buttonText) {
    MG.dom.messageEl.textContent = message;
    MG.dom.startButton.textContent = buttonText;
    MG.dom.overlay.classList.remove("hidden");
  };

  MG.hideOverlay = function hideOverlay() {
    MG.dom.overlay.classList.add("hidden");
  };

  MG.showToast = function showToast(message) {
    MG.dom.achievementToastEl.textContent = message;
    if (MG.game.toastTimer) {
      clearTimeout(MG.game.toastTimer);
    }
    MG.game.toastTimer = setTimeout(() => {
      MG.dom.achievementToastEl.textContent = "";
    }, 2200);
  };
})();
