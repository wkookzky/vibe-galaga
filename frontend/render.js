(function () {
  const MG = window.MiniGalaga;

  MG.draw = function draw() {
    MG.ctx.clearRect(0, 0, MG.canvas.width, MG.canvas.height);
    MG.drawBackground();
    MG.drawPowerups();
    MG.drawExplosions();
    MG.drawPlayer();
    MG.drawBullets();
    MG.drawEnemies();
    MG.drawBoss();
    MG.drawBossHealth();
  };

  MG.drawBackground = function drawBackground() {
    MG.ctx.fillStyle = "#050711";
    MG.ctx.fillRect(0, 0, MG.canvas.width, MG.canvas.height);
    MG.game.stars.forEach((star) => {
      MG.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      MG.ctx.fillRect(star.x, star.y, star.size, star.size);
    });
  };

  MG.drawPlayer = function drawPlayer() {
    if (MG.player.shield > 0) {
      MG.ctx.beginPath();
      MG.ctx.arc(MG.player.x + MG.player.width / 2, MG.player.y + 12, 26, 0, Math.PI * 2);
      MG.ctx.strokeStyle = "rgba(117, 222, 255, 0.75)";
      MG.ctx.lineWidth = 3;
      MG.ctx.stroke();
    }

    MG.ctx.fillStyle = "#ffcf40";
    MG.ctx.beginPath();
    MG.ctx.moveTo(MG.player.x + MG.player.width / 2, MG.player.y);
    MG.ctx.lineTo(MG.player.x + MG.player.width, MG.player.y + MG.player.height);
    MG.ctx.lineTo(MG.player.x, MG.player.y + MG.player.height);
    MG.ctx.closePath();
    MG.ctx.fill();

    MG.ctx.fillStyle = "#ffffff";
    MG.ctx.fillRect(MG.player.x + MG.player.width / 2 - 4, MG.player.y + 10, 8, 12);
  };

  MG.drawBullets = function drawBullets() {
    MG.ctx.fillStyle = "#ffffff";
    MG.game.bullets.forEach((bullet) => {
      MG.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    MG.ctx.fillStyle = "#ff5d73";
    MG.game.enemyBullets.forEach((bullet) => {
      MG.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
  };

  MG.drawEnemies = function drawEnemies() {
    MG.game.enemies.forEach((enemy) => {
      if (!enemy.alive) {
        return;
      }

      MG.ctx.fillStyle = enemy.color;
      MG.ctx.fillRect(enemy.x + 6, enemy.y, enemy.width - 12, enemy.height);
      MG.ctx.fillRect(enemy.x, enemy.y + 8, enemy.width, enemy.height - 8);
      MG.ctx.fillStyle = "#050711";
      MG.ctx.fillRect(enemy.x + 8, enemy.y + 11, 5, 5);
      MG.ctx.fillRect(enemy.x + enemy.width - 13, enemy.y + 11, 5, 5);
    });
  };

  MG.drawBoss = function drawBoss() {
    if (!MG.game.boss || !MG.game.boss.alive) {
      return;
    }

    MG.ctx.fillStyle = "#7e5cff";
    MG.ctx.fillRect(MG.game.boss.x, MG.game.boss.y + 10, MG.game.boss.width, MG.game.boss.height - 10);
    MG.ctx.fillStyle = "#ff5d73";
    MG.ctx.fillRect(MG.game.boss.x + 16, MG.game.boss.y, MG.game.boss.width - 32, 28);
    MG.ctx.fillStyle = "#050711";
    MG.ctx.fillRect(MG.game.boss.x + 20, MG.game.boss.y + 24, 12, 12);
    MG.ctx.fillRect(MG.game.boss.x + MG.game.boss.width - 32, MG.game.boss.y + 24, 12, 12);
  };

  MG.drawBossHealth = function drawBossHealth() {
    if (!MG.game.boss || !MG.game.boss.alive) {
      return;
    }

    const barWidth = 240;
    const barHeight = 10;
    const x = (MG.canvas.width - barWidth) / 2;
    const y = 18;

    MG.ctx.fillStyle = "rgba(255,255,255,0.12)";
    MG.ctx.fillRect(x, y, barWidth, barHeight);
    MG.ctx.fillStyle = "#ff5d73";
    MG.ctx.fillRect(x, y, barWidth * (MG.game.boss.hp / MG.game.boss.maxHp), barHeight);
    MG.ctx.strokeStyle = "#ffffff";
    MG.ctx.strokeRect(x, y, barWidth, barHeight);
  };

  MG.drawPowerups = function drawPowerups() {
    MG.game.powerups.forEach((powerup) => {
      MG.ctx.fillStyle = MG.getPowerupColor(powerup.type);
      MG.ctx.beginPath();
      MG.ctx.arc(powerup.x, powerup.y, 10, 0, Math.PI * 2);
      MG.ctx.fill();
      MG.ctx.fillStyle = "#050711";
      MG.ctx.font = "bold 11px Arial";
      MG.ctx.textAlign = "center";
      MG.ctx.textBaseline = "middle";
      MG.ctx.fillText(MG.getPowerupLabel(powerup.type), powerup.x, powerup.y + 0.5);
    });
  };

  MG.getPowerupColor = function getPowerupColor(type) {
    if (type === "rapid") return "#ffcf40";
    if (type === "spread") return "#75deff";
    return "#8aff80";
  };

  MG.getPowerupLabel = function getPowerupLabel(type) {
    if (type === "rapid") return "R";
    if (type === "spread") return "S";
    return "B";
  };

  MG.drawExplosions = function drawExplosions() {
    MG.game.explosions.forEach((burst) => {
      const alpha = Math.max(0, burst.life / 8);
      MG.ctx.fillStyle = burst.color;
      MG.ctx.globalAlpha = alpha;
      MG.ctx.beginPath();
      MG.ctx.arc(burst.x, burst.y, burst.size + (8 - burst.life), 0, Math.PI * 2);
      MG.ctx.fill();
      MG.ctx.globalAlpha = 1;
    });
  };
})();
