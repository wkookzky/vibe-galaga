(function () {
  const MG = window.MiniGalaga;

  MG.phaseConfigs = {
    1: {
      1: {
        enemyRows: 4,
        enemySpeed: 0.82,
        enemyShootChance: 0.018,
        enemyBulletSpeed: 3.15
      },
      2: {
        enemyRows: 4,
        enemySpeed: 0.92,
        enemyShootChance: 0.021,
        enemyBulletSpeed: 3.25
      },
      3: {
        enemyRows: 5,
        enemySpeed: 1.02,
        enemyShootChance: 0.024,
        enemyBulletSpeed: 3.35
      }
    },
    2: {
      1: {
        enemyRows: 5,
        enemySpeed: 1.0,
        enemyShootChance: 0.022,
        enemyBulletSpeed: 3.35
      },
      2: {
        enemyRows: 5,
        enemySpeed: 1.1,
        enemyShootChance: 0.025,
        enemyBulletSpeed: 3.45
      },
      3: {
        enemyRows: 6,
        enemySpeed: 1.2,
        enemyShootChance: 0.028,
        enemyBulletSpeed: 3.55
      }
    },
    3: {
      1: {
        enemyRows: 6,
        enemySpeed: 1.18,
        enemyShootChance: 0.026,
        enemyBulletSpeed: 3.55
      },
      2: {
        enemyRows: 6,
        enemySpeed: 1.28,
        enemyShootChance: 0.029,
        enemyBulletSpeed: 3.65
      },
      3: {
        bossHp: 36,
        bossSpeed: 1.58,
        bossFireCooldown: 800
      }
    }
  };

  MG.getPhaseConfig = function getPhaseConfig(stage, level) {
    const safeStage = Math.min(Math.max(stage, 1), MG.MAX_STAGE);
    const safeLevel = Math.min(Math.max(level, 1), MG.MAX_LEVEL);
    return MG.phaseConfigs[safeStage][safeLevel] || MG.phaseConfigs[1][1];
  };

  MG.isBossPhase = function isBossPhase(stage, level) {
    return stage === MG.MAX_STAGE && level === MG.MAX_LEVEL;
  };

  MG.createStars = function createStars() {
    MG.game.stars = Array.from({ length: 70 }, () => ({
      x: Math.random() * MG.canvas.width,
      y: Math.random() * MG.canvas.height,
      speed: 0.45 + Math.random() * 1.35,
      size: 1 + Math.random() * 1.6
    }));
  };

  MG.createEnemies = function createEnemies() {
    MG.game.enemies = [];
    const config = MG.getPhaseConfig(MG.game.stage, MG.game.level);
    const rows = config.enemyRows;
    const cols = 8;
    const gap = 14;
    const enemyWidth = 34;
    const enemyHeight = 26;
    const startX = (MG.canvas.width - cols * enemyWidth - (cols - 1) * gap) / 2;
    const startY = 62;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        MG.game.enemies.push({
          x: startX + col * (enemyWidth + gap),
          y: startY + row * (enemyHeight + gap),
          width: enemyWidth,
          height: enemyHeight,
          alive: true,
          color: row % 2 === 0 ? "#ff5d73" : "#75deff"
        });
      }
    }
    MG.game.enemyDirection = 1;
  };

  MG.createBoss = function createBoss(currentStage, currentLevel) {
    const config = MG.getPhaseConfig(currentStage, currentLevel);
    return {
      x: MG.canvas.width / 2 - 56,
      y: 72,
      width: 112,
      height: 58,
      hp: config.bossHp,
      maxHp: config.bossHp,
      direction: 1,
      speed: config.bossSpeed,
      fireCooldown: 0,
      alive: true
    };
  };

  MG.spawnLevel = function spawnLevel() {
    if (MG.game.stage > MG.MAX_STAGE) {
      MG.clearGame();
      return;
    }

    MG.game.bullets = [];
    MG.game.enemyBullets = [];
    MG.game.powerups = [];

    if (MG.isBossPhase(MG.game.stage, MG.game.level)) {
      MG.game.enemies = [];
      MG.game.boss = MG.createBoss(MG.game.stage, MG.game.level);
      return;
    }

    MG.game.boss = null;
    MG.createEnemies();
  };

  MG.startLoop = function startLoop() {
    if (MG.game.animationId) {
      cancelAnimationFrame(MG.game.animationId);
    }
    MG.game.animationId = requestAnimationFrame(MG.gameLoop);
  };

  MG.gameLoop = function gameLoop(timestamp) {
    MG.update(timestamp);
    MG.draw();
    if (MG.game.state === "playing") {
      MG.game.animationId = requestAnimationFrame(MG.gameLoop);
    }
  };

  MG.resetGame = function resetGame() {
    MG.game.score = 0;
    MG.game.stage = 1;
    MG.game.level = 1;
    MG.game.lives = 3;
    MG.game.state = "playing";
    MG.game.boss = null;
    MG.game.bullets = [];
    MG.game.enemyBullets = [];
    MG.game.enemies = [];
    MG.game.powerups = [];
    MG.game.explosions = [];
    MG.game.lastShotAt = 0;
    MG.game.achievements = [];
    MG.player.x = MG.canvas.width / 2 - MG.player.width / 2;
    MG.player.shield = 1;
    MG.powerupExpiry.spread = 0;
    MG.powerupExpiry.rapid = 0;
    MG.stats.enemiesDestroyed = 0;
    MG.stats.powerupsCollected = 0;
    MG.stats.bossesDefeated = 0;
    MG.stats.shieldBlocks = 0;
    MG.stats.highestStage = 1;
    MG.createStars();
    MG.spawnLevel();
    MG.updateHud();
    MG.hideOverlay();
    MG.startLoop();
  };

  MG.update = function update(timestamp) {
    MG.game.damageLocked = false;
    MG.moveStars();
    MG.movePlayer();
    MG.shoot(timestamp);
    MG.moveBullets();
    MG.moveEnemies();
    MG.moveBoss(timestamp);
    MG.maybeEnemyShoot(timestamp);
    MG.movePowerups();
    MG.moveExplosions();
    MG.detectCollisions();
    MG.removeOffscreenObjects();
    MG.checkLevelClear();
    MG.checkAchievements();
  };

  MG.moveStars = function moveStars() {
    MG.game.stars.forEach((star) => {
      star.y += star.speed;
      if (star.y > MG.canvas.height) {
        star.y = 0;
        star.x = Math.random() * MG.canvas.width;
      }
    });
  };

  MG.movePlayer = function movePlayer() {
    if (MG.keys.ArrowLeft || MG.keys.KeyA) {
      MG.player.x -= MG.player.speed;
    }
    if (MG.keys.ArrowRight || MG.keys.KeyD) {
      MG.player.x += MG.player.speed;
    }
    MG.player.x = Math.max(8, Math.min(MG.canvas.width - MG.player.width - 8, MG.player.x));
  };

  MG.shoot = function shoot(timestamp) {
    const cooldown = MG.isEffectActive("rapid") ? 110 : 240;
    if (!MG.keys.Space || timestamp - MG.game.lastShotAt < cooldown) {
      return;
    }

    MG.game.bullets.push(...MG.createPlayerShots());
    MG.game.lastShotAt = timestamp;
  };

  MG.createPlayerShots = function createPlayerShots() {
    const centerX = MG.player.x + MG.player.width / 2;
    const baseBullet = {
      x: centerX - 3,
      y: MG.player.y - 12,
      width: 6,
      height: 14,
      speed: 7.5
    };

    if (!MG.isEffectActive("spread")) {
      return [baseBullet];
    }

    return [
      { ...baseBullet, x: centerX - 14, speed: 7.2 },
      { ...baseBullet, x: centerX - 3, speed: 7.7 },
      { ...baseBullet, x: centerX + 8, speed: 7.2 }
    ];
  };

  MG.moveBullets = function moveBullets() {
    MG.game.bullets.forEach((bullet) => {
      bullet.y -= bullet.speed;
    });

    MG.game.enemyBullets.forEach((bullet) => {
      bullet.y += bullet.speed;
    });
  };

  MG.moveEnemies = function moveEnemies() {
    if (MG.game.boss) {
      return;
    }

    const livingEnemies = MG.game.enemies.filter((enemy) => enemy.alive);
    const speed = MG.getPhaseConfig(MG.game.stage, MG.game.level).enemySpeed;

    MG.game.enemyDrop = livingEnemies.some((enemy) => {
      const nextX = enemy.x + speed * MG.game.enemyDirection;
      return nextX <= 8 || nextX + enemy.width >= MG.canvas.width - 8;
    });

    livingEnemies.forEach((enemy) => {
      if (MG.game.enemyDrop) {
        enemy.y += 18;
      } else {
        enemy.x += speed * MG.game.enemyDirection;
      }

      if (enemy.y + enemy.height >= MG.player.y) {
        MG.handlePlayerHit();
      }
    });

    if (MG.game.enemyDrop) {
      MG.game.enemyDirection *= -1;
    }
  };

  MG.moveBoss = function moveBoss(timestamp) {
    if (!MG.game.boss || !MG.game.boss.alive) {
      return;
    }

    MG.game.boss.x += MG.game.boss.speed * MG.game.boss.direction;
    if (MG.game.boss.x <= 12 || MG.game.boss.x + MG.game.boss.width >= MG.canvas.width - 12) {
      MG.game.boss.direction *= -1;
    }

    if (timestamp >= MG.game.boss.fireCooldown) {
      MG.fireBossShots();
      MG.game.boss.fireCooldown = timestamp + MG.getPhaseConfig(MG.game.stage, MG.game.level).bossFireCooldown;
    }
  };

  MG.maybeEnemyShoot = function maybeEnemyShoot() {
    if (MG.game.boss) {
      return;
    }

    const config = MG.getPhaseConfig(MG.game.stage, MG.game.level);
    if (Math.random() > config.enemyShootChance) {
      return;
    }

    const livingEnemies = MG.game.enemies.filter((enemy) => enemy.alive);
    if (livingEnemies.length === 0) {
      return;
    }

    const shooter = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
    MG.game.enemyBullets.push({
      x: shooter.x + shooter.width / 2 - 3,
      y: shooter.y + shooter.height,
      width: 6,
      height: 12,
      speed: config.enemyBulletSpeed
    });
  };

  MG.fireBossShots = function fireBossShots() {
    if (!MG.game.boss) {
      return;
    }

    [
      { dx: -22, speed: 4.0 },
      { dx: 0, speed: 4.5 },
      { dx: 22, speed: 4.0 }
    ].forEach((pattern) => {
      MG.game.enemyBullets.push({
        x: MG.game.boss.x + MG.game.boss.width / 2 - 3 + pattern.dx,
        y: MG.game.boss.y + MG.game.boss.height,
        width: 6,
        height: 14,
        speed: pattern.speed + MG.game.stage * 0.1 + MG.game.level * 0.05
      });
    });
  };

  MG.movePowerups = function movePowerups() {
    MG.game.powerups.forEach((powerup) => {
      powerup.y += powerup.speed;
    });
  };

  MG.moveExplosions = function moveExplosions() {
    MG.game.explosions.forEach((burst) => {
      burst.life -= 1;
    });
    MG.game.explosions = MG.game.explosions.filter((burst) => burst.life > 0);
  };

  MG.detectCollisions = function detectCollisions() {
    MG.game.bullets.forEach((bullet) => {
      if (MG.game.boss && MG.game.boss.alive && MG.intersects(bullet, MG.game.boss)) {
        const hitX = bullet.x;
        const hitY = bullet.y;
        MG.game.boss.hp -= 1;
        bullet.y = -100;
        MG.createExplosion(hitX, hitY, "#ffcf40");
        if (MG.game.boss.hp <= 0) {
          MG.defeatBoss();
        }
        return;
      }

      MG.game.enemies.forEach((enemy) => {
        if (enemy.alive && MG.intersects(bullet, enemy)) {
          enemy.alive = false;
          bullet.y = -100;
          MG.game.score += 10 * MG.game.stage;
          MG.stats.enemiesDestroyed += 1;
          MG.maybeDropPowerup(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          MG.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#ff5d73");
          MG.updateHud();
        }
      });
    });

    MG.game.enemyBullets.forEach((bullet) => {
      if (MG.intersects(bullet, MG.player)) {
        bullet.y = MG.canvas.height + 100;
        MG.handlePlayerHit();
      }
    });

    MG.game.powerups.forEach((powerup) => {
      if (!powerup.collected && MG.intersects(powerup, MG.player)) {
        powerup.collected = true;
        MG.applyPowerup(powerup.type);
      }
    });
  };

  MG.intersects = function intersects(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  };

  MG.handlePlayerHit = function handlePlayerHit() {
    if (MG.game.damageLocked) {
      return;
    }

    MG.game.damageLocked = true;

    if (MG.player.shield > 0) {
      MG.player.shield -= 1;
      MG.stats.shieldBlocks += 1;
      MG.createExplosion(MG.player.x + MG.player.width / 2, MG.player.y + MG.player.height / 2, "#75deff");
      MG.updateHud();
      return;
    }

    MG.game.lives -= 1;
    MG.updateHud();

    if (MG.game.lives <= 0) {
      MG.endGame();
      return;
    }

    MG.player.x = MG.canvas.width / 2 - MG.player.width / 2;
    MG.game.bullets = [];
    MG.game.enemyBullets = [];
    MG.game.powerups = [];
    MG.spawnLevel();
  };

  MG.submitScore = async function submitScore() {
    try {
      await fetch(`${MG.backendBaseUrl}/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          player_name: "Anonymous",
          score: MG.game.score,
          stage: MG.game.stage,
          level: MG.game.level
        })
      });
    } catch (error) {
      console.warn("Score submission failed", error);
    }
  };

  MG.endGame = function endGame() {
    MG.game.state = "gameover";
    if (MG.game.animationId) {
      cancelAnimationFrame(MG.game.animationId);
      MG.game.animationId = null;
    }
    MG.draw();
    void MG.submitScore();
    MG.showOverlay(`Game over! Final score: ${MG.game.score}`, "Restart");
  };

  MG.clearGame = function clearGame() {
    MG.game.state = "cleared";
    if (MG.game.animationId) {
      cancelAnimationFrame(MG.game.animationId);
      MG.game.animationId = null;
    }
    MG.draw();
    void MG.submitScore();
    MG.showOverlay(`You cleared all stages! Final score: ${MG.game.score}`, "Restart");
  };

  MG.defeatBoss = function defeatBoss() {
    if (!MG.game.boss || !MG.game.boss.alive) {
      return;
    }

    MG.game.boss.alive = false;
    MG.stats.bossesDefeated += 1;
    MG.game.score += 500 + MG.game.stage * 100 + MG.game.level * 50;
    MG.createExplosion(MG.game.boss.x + MG.game.boss.width / 2, MG.game.boss.y + MG.game.boss.height / 2, "#ffcf40");
    MG.game.boss = null;
    MG.stats.highestStage = Math.max(MG.stats.highestStage, MG.game.stage);
    MG.updateHud();
    MG.showToast("Boss defeated!");

    MG.clearGame();
  };

  MG.removeOffscreenObjects = function removeOffscreenObjects() {
    MG.game.bullets = MG.game.bullets.filter((bullet) => bullet.y + bullet.height > 0);
    MG.game.enemyBullets = MG.game.enemyBullets.filter((bullet) => bullet.y < MG.canvas.height + 20);
    MG.game.powerups = MG.game.powerups.filter((powerup) => powerup.y < MG.canvas.height + 20 && !powerup.collected);
  };

  MG.maybeDropPowerup = function maybeDropPowerup(x, y) {
    if (Math.random() > 0.11) {
      return;
    }

    const types = ["rapid", "spread", "shield"];
    const type = types[Math.floor(Math.random() * types.length)];
    MG.game.powerups.push({
      x,
      y,
      type,
      speed: 2.1,
      width: 20,
      height: 20,
      collected: false
    });
  };

  MG.applyPowerup = function applyPowerup(type) {
    MG.stats.powerupsCollected += 1;

    if (type === "shield") {
      MG.player.shield = Math.min(MG.player.shield + 1, 3);
    }

    if (type === "rapid") {
      MG.powerupExpiry.rapid = performance.now() + 10000;
    }

    if (type === "spread") {
      MG.powerupExpiry.spread = performance.now() + 10000;
    }

    MG.updateHud();
    MG.showToast(`Power-up gained: ${MG.getPowerupTitle(type)}`);
  };

  MG.getPowerupTitle = function getPowerupTitle(type) {
    if (type === "rapid") return "Rapid Fire";
    if (type === "spread") return "Spread Shot";
    return "Shield";
  };

  MG.createExplosion = function createExplosion(x, y, color) {
    MG.game.explosions.push({
      x,
      y,
      color,
      life: 8,
      size: 6
    });
  };

  MG.checkLevelClear = function checkLevelClear() {
    if (MG.game.boss || (MG.game.stage >= MG.MAX_STAGE && MG.game.level >= MG.MAX_LEVEL)) {
      return;
    }

    if (MG.game.enemies.length > 0 && MG.game.enemies.every((enemy) => !enemy.alive)) {
      MG.game.score += 100;

      if (MG.game.level < MG.MAX_LEVEL) {
        MG.game.level += 1;
        MG.showToast(`Level ${MG.game.stage}-${MG.game.level}`);
      } else if (MG.game.stage < MG.MAX_STAGE) {
        MG.game.stage += 1;
        MG.game.level = 1;
        MG.stats.highestStage = Math.max(MG.stats.highestStage, MG.game.stage);
        MG.showToast(`Stage ${MG.game.stage}`);
      }

      MG.updateHud();
      MG.spawnLevel();
    }
  };

  MG.checkAchievements = function checkAchievements() {
    MG.achievementDefs.forEach((achievement) => {
      if (MG.game.achievements.includes(achievement.id)) {
        return;
      }

      if (achievement.check(MG.stats)) {
        MG.game.achievements.push(achievement.id);
        MG.updateHud();
        MG.showToast(`Achievement unlocked: ${achievement.name}`);
      }
    });
  };
})();
